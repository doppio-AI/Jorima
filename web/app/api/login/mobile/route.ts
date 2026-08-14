import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { createSessionToken } from "@/lib/auth/session";

// Orígenes autorizados para consumir esta API.
// Puedes agregar más separados por coma en CORS_ALLOWED_ORIGINS.
const DEFAULT_ALLOWED_ORIGINS = [
  "http://localhost:8081",
  "http://127.0.0.1:8081",
];

function getAllowedOrigins(): string[] {
  const configuredOrigins = process.env.CORS_ALLOWED_ORIGINS;

  if (!configuredOrigins) {
    return DEFAULT_ALLOWED_ORIGINS;
  }

  return configuredOrigins
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function isOriginAllowed(request: Request): boolean {
  const origin = request.headers.get("origin");

  // Aplicaciones móviles nativas, Postman y cURL normalmente
  // no envían el encabezado Origin.
  if (!origin) {
    return true;
  }

  const allowedOrigins = getAllowedOrigins();

  if (allowedOrigins.includes("*")) {
    return true;
  }

  return allowedOrigins.includes(origin);
}

function getCorsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get("origin");
  const allowedOrigins = getAllowedOrigins();
  const wildcard = allowedOrigins.includes("*");

  // Con wildcard reflejamos el Origin recibido en vez de mandar
  // el string "*" fijo: así, si algún día se agrega Authorization
  // + cookies con "credentials: include", el navegador no lo rechaza
  // (Access-Control-Allow-Origin: * no es compatible con credentials).
  const allowOriginValue = wildcard
    ? origin || "*"
    : origin && allowedOrigins.includes(origin)
      ? origin
      : allowedOrigins[0];

  return {
    "Access-Control-Allow-Origin": allowOriginValue,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers":
      "Content-Type, Authorization, Accept",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
    "Cache-Control": "no-store",
  };
}

function jsonResponse(
  request: Request,
  data: Record<string, unknown>,
  status = 200
) {
  return NextResponse.json(data, {
    status,
    headers: getCorsHeaders(request),
  });
}

/**
 * Responde la petición preflight de CORS.
 * El navegador manda OPTIONS antes del POST.
 */
export async function OPTIONS(request: Request) {
  if (!isOriginAllowed(request)) {
    return jsonResponse(
      request,
      { error: "Origen no autorizado" },
      403
    );
  }

  return new NextResponse(null, {
    status: 204,
    headers: getCorsHeaders(request),
  });
}

/**
 * Inicio de sesión para aplicación móvil y Expo Web.
 */
export async function POST(request: Request) {
  try {
    if (!isOriginAllowed(request)) {
      return jsonResponse(
        request,
        { error: "Origen no autorizado" },
        403
      );
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return jsonResponse(
        request,
        { error: "El cuerpo de la solicitud debe ser un JSON válido" },
        400
      );
    }

    if (!body || typeof body !== "object") {
      return jsonResponse(
        request,
        { error: "Datos de inicio de sesión inválidos" },
        400
      );
    }

    const {
      correo: correoIngresado,
      contrasena: contrasenaIngresada,
    } = body as {
      correo?: unknown;
      contrasena?: unknown;
    };

    if (
      typeof correoIngresado !== "string" ||
      typeof contrasenaIngresada !== "string"
    ) {
      return jsonResponse(
        request,
        { error: "Correo y contraseña son obligatorios" },
        400
      );
    }

    const correo = correoIngresado.trim().toLowerCase();
    const contrasena = contrasenaIngresada;

    if (!correo || !contrasena.trim()) {
      return jsonResponse(
        request,
        { error: "Correo y contraseña son obligatorios" },
        400
      );
    }

    if (correo.length > 254) {
      return jsonResponse(
        request,
        { error: "El correo electrónico no es válido" },
        400
      );
    }

    if (contrasena.length > 200) {
      return jsonResponse(
        request,
        { error: "Las credenciales proporcionadas no son válidas" },
        400
      );
    }

    const user = await prisma.usuario.findUnique({
      where: {
        correo,
      },
      select: {
        usuario_id: true,
        nombre: true,
        correo: true,
        tipo_usuario: true,
        edificio_id: true,
        turno: true,
        contrasena: true,
      },
    });

    /*
     * Se usa el mismo mensaje si el usuario no existe o la contraseña
     * es incorrecta. Así no revelamos qué correos están registrados.
     */
    if (!user) {
      return jsonResponse(
        request,
        { error: "Correo o contraseña incorrectos" },
        401
      );
    }

    const validPassword = await bcrypt.compare(
      contrasena,
      user.contrasena
    );

    if (!validPassword) {
      return jsonResponse(
        request,
        { error: "Correo o contraseña incorrectos" },
        401
      );
    }

    /*
     * A diferencia de la cookie httpOnly que usa el flujo web,
     * el cliente móvil no puede depender de cookies persistentes.
     * Por eso aquí se firma un token de sesión que la app guarda
     * y reenvía como "Authorization: Bearer <token>".
     */
    const token = createSessionToken({
      usuario_id: user.usuario_id,
      tipo_usuario: user.tipo_usuario,
    });

    return jsonResponse(
      request,
      {
        message: "Login exitoso",
        token,
        usuario: {
          id: user.usuario_id,
          nombre: user.nombre,
          correo: user.correo,
          tipo_usuario: user.tipo_usuario,
          edificio_id: user.edificio_id,
          turno: user.turno,
        },
      },
      200
    );
  } catch (error) {
    console.error("LOGIN MOBILE ERROR:", error);

    return jsonResponse(
      request,
      { error: "Error interno en login móvil" },
      500
    );
  }
}