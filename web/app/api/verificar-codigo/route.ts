import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {

  try {
    const body = await request.json();
    const { usuario_id, codigo } = body;

    if (!usuario_id || !codigo) {
      return NextResponse.json(
        { error: "Datos incompletos" },
        { status: 400 }
      );
    }

    /* ── Buscar código válido ── */
    const codigoBD = await prisma.codigo_verificacion.findFirst({
      where: {
        usuario_id: Number(usuario_id),
        codigo: String(codigo),
        usado: false,
        fecha_expiracion: {
          gte: new Date(),
        },
      },
      orderBy: { fecha_creacion: "desc" },
    });

    if (!codigoBD) {
      return NextResponse.json(
        { error: "Código inválido o expirado" },
        { status: 401 }
      );
    }

    /* ── Marcar código como usado ── */
    await prisma.codigo_verificacion.update({
      where: { codigo_id: codigoBD.codigo_id },
      data: { usado: true },
    });

    /* ── Obtener datos del usuario ── */
    const user = await prisma.usuario.findUnique({
      where: { usuario_id: Number(usuario_id) },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    /* ── Crear sesión ── */
    const response = NextResponse.json({
      message: "Verificación exitosa",
      usuario: {
        id: user.usuario_id,
        nombre: user.nombre,
        correo: user.correo,
        tipo_usuario: user.tipo_usuario,
      },
    });

    response.cookies.set("usuario", JSON.stringify({
      id: user.usuario_id,
      tipo_usuario: user.tipo_usuario,
    }), {
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 24,
    });

    response.cookies.set("usuario_public", encodeURIComponent(JSON.stringify({
      id: user.usuario_id,
      tipo_usuario: user.tipo_usuario,
    })), {
      httpOnly: false,
      path: "/",
      maxAge: 60 * 60 * 24,
    });

    return response;

  } catch (error) {
    console.error("VERIFICAR CÓDIGO ERROR:", error);
    return NextResponse.json(
      { error: "Error interno al verificar código" },
      { status: 500 }
    );
  }
}

/* ── Reenviar código ── */
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { usuario_id } = body;

    if (!usuario_id) {
      return NextResponse.json(
        { error: "Falta usuario_id" },
        { status: 400 }
      );
    }

    const user = await prisma.usuario.findUnique({
      where: { usuario_id: Number(usuario_id) },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    /* Generar nuevo código */
    const codigo = Math.floor(100000 + Math.random() * 900000).toString();
    const fechaExpiracion = new Date(Date.now() + 5 * 60 * 1000);

    /* Invalidar códigos anteriores */
    await prisma.codigo_verificacion.updateMany({
      where: {
        usuario_id: user.usuario_id,
        usado: false,
      },
      data: { usado: true },
    });

    /* Guardar nuevo código */
    await prisma.codigo_verificacion.create({
      data: {
        usuario_id: user.usuario_id,
        codigo,
        fecha_expiracion: fechaExpiracion,
      },
    });

    /* Enviar a n8n */
    const N8N_2FA_WEBHOOK = "https://159.65.111.84.sslip.io/webhook/Jorima-2FA";

    await fetch(N8N_2FA_WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        correo: user.correo,
        codigo,
        nombre: user.nombre,
      }),
    });

    return NextResponse.json({ message: "Código reenviado" });

  } catch (error) {
    console.error("REENVIAR CÓDIGO ERROR:", error);
    return NextResponse.json(
      { error: "Error al reenviar código" },
      { status: 500 }
    );
  }
}