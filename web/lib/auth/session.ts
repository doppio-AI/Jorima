import type { NextRequest } from "next/server";
import crypto from "crypto";

/* ─────────────────────────────────────────────────
   Tipos
   ───────────────────────────────────────────────── */
export type SessionUser = {
  usuario_id: number;
  tipo_usuario: number;
};

export type Role = "admin" | "usuario" | "unknown";

/* ─────────────────────────────────────────────────
   Configuración del token firmado (usado por móvil)
   ───────────────────────────────────────────────── */

// 30 días. Ajustar según la política de sesión que definan.
const SESSION_TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 30;

function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;

  if (!secret) {
    throw new Error(
      "SESSION_SECRET no está configurado en las variables de entorno"
    );
  }

  return secret;
}

function base64UrlEncode(input: Buffer | string): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function base64UrlDecode(input: string): Buffer {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/");
  const remainder = padded.length % 4;
  const withPadding =
    remainder === 0 ? padded : padded + "=".repeat(4 - remainder);

  return Buffer.from(withPadding, "base64");
}

/* ─────────────────────────────────────────────────
   createSessionToken / verifySessionToken

   Token firmado con HMAC-SHA256, pensado para clientes
   que no pueden depender de cookies httpOnly (app móvil).

   Formato: base64url(payloadJson).base64url(firma)

   No es JWT estándar (sin header ni algoritmo declarado
   en el token) a propósito: evita ambigüedad de algoritmo
   y mantiene la superficie de ataque mínima. Si más adelante
   se necesita interoperar con otras librerías, migrar a JWT
   real (p. ej. "jose") sería el siguiente paso.
   ───────────────────────────────────────────────── */
export function createSessionToken(user: SessionUser): string {
  const payload = {
    usuario_id: user.usuario_id,
    tipo_usuario: user.tipo_usuario,
    exp: Date.now() + SESSION_TOKEN_TTL_MS,
  };

  const payloadB64 = base64UrlEncode(JSON.stringify(payload));

  const signature = crypto
    .createHmac("sha256", getSessionSecret())
    .update(payloadB64)
    .digest();

  const signatureB64 = base64UrlEncode(signature);

  return `${payloadB64}.${signatureB64}`;
}

export function verifySessionToken(token: string): SessionUser | null {
  try {
    const [payloadB64, signatureB64] = token.split(".");

    if (!payloadB64 || !signatureB64) {
      return null;
    }

    const expectedSignature = crypto
      .createHmac("sha256", getSessionSecret())
      .update(payloadB64)
      .digest();

    const receivedSignature = base64UrlDecode(signatureB64);

    if (
      expectedSignature.length !== receivedSignature.length ||
      !crypto.timingSafeEqual(expectedSignature, receivedSignature)
    ) {
      return null;
    }

    const payload = JSON.parse(
      base64UrlDecode(payloadB64).toString("utf8")
    ) as {
      usuario_id?: unknown;
      tipo_usuario?: unknown;
      exp?: unknown;
    };

    if (typeof payload.exp !== "number" || payload.exp < Date.now()) {
      return null; // token expirado
    }

    const usuario_id = Number(payload.usuario_id);
    const tipo_usuario = Number(payload.tipo_usuario);

    if (!Number.isFinite(usuario_id) || !Number.isFinite(tipo_usuario)) {
      return null;
    }

    return { usuario_id, tipo_usuario };
  } catch {
    return null;
  }
}

function getBearerToken(request: NextRequest): string | null {
  const header = request.headers.get("authorization");

  if (!header) return null;

  const [scheme, token] = header.split(" ");

  if (scheme?.toLowerCase() !== "bearer" || !token) {
    return null;
  }

  return token.trim();
}

/* ─────────────────────────────────────────────────
   getSessionUser

   Web: lee la cookie httpOnly "usuario".
   Móvil: lee "Authorization: Bearer <token>" firmado.

   Prueba primero la cookie (comportamiento actual sin
   cambios) y solo si no existe intenta el token.
   ───────────────────────────────────────────────── */
export function getSessionUser(request: NextRequest): SessionUser | null {
  try {
    const cookie = request.cookies.get("usuario");

    if (cookie?.value) {
      const parsed = JSON.parse(cookie.value) as unknown;

      if (parsed && typeof parsed === "object") {
        const obj = parsed as Record<string, unknown>;

        const id =
          typeof obj.id === "number"
            ? obj.id
            : Number(obj.id ?? obj.usuario_id);

        const tipo =
          typeof obj.tipo_usuario === "number"
            ? obj.tipo_usuario
            : Number(obj.tipo_usuario);

        if (Number.isFinite(id) && Number.isFinite(tipo)) {
          return { usuario_id: id, tipo_usuario: tipo };
        }
      }
    }

    const token = getBearerToken(request);

    if (token) {
      return verifySessionToken(token);
    }

    return null;
  } catch {
    return null;
  }
}

/* ─────────────────────────────────────────────────
   getRole
   Convierte el campo tipo_usuario numérico a un rol legible.
   1 = admin (RH/administrador)
   2 = usuario (personal/docente)
   ───────────────────────────────────────────────── */
export function getRole(tipo_usuario: number): Role {
  switch (tipo_usuario) {
    case 1:
      return "admin";
    case 2:
      return "usuario";
    default:
      return "unknown";
  }
}