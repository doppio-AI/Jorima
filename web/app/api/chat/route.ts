import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
const N8N_WEBHOOK = "https://159.65.111.84.sslip.io/webhook/Jorima-Tech";

/* ───────────────────────────────────────────
   POST  /api/chat
   Body: { usuario_id, mensaje, conversacion_id? }
   ─────────────────────────────────────────── */

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { usuario_id, mensaje, conversacion_id } = body;

    if (!usuario_id || !mensaje) {
      return NextResponse.json(
        { error: "Faltan campos requeridos" },
        { status: 400 }
      );
    }

    /* ── Obtener o crear conversación ── */

    let convId = conversacion_id;

    if (!convId) {
      const nueva = await prisma.conversacion.create({
        data: {
          usuario_id: Number(usuario_id),
          titulo: mensaje.substring(0, 100),
        },
      });
      convId = nueva.conversacion_id;
    }

    /* ── Guardar mensaje del usuario ── */

    await prisma.mensaje.create({
      data: {
        conversacion_id: convId,
        role: "user",
        texto: mensaje,
      },
    });

    /* ── Obtener historial para contexto ── */

    const historial = await prisma.mensaje.findMany({
      where: { conversacion_id: convId },
      orderBy: { fecha: "asc" },
      select: { role: true, texto: true },
    });

    /* ── Enviar al webhook de n8n ── */

    const n8nResponse = await fetch(N8N_WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        usuario_id,
        mensaje,
        conversacion_id: convId,
        historial,
      }),
    });

    if (!n8nResponse.ok) {
      throw new Error(`n8n respondió con status ${n8nResponse.status}`);
    }

    const n8nData = await n8nResponse.json();

    /* ── Extraer respuesta del asistente ── */

    const respuestaAsistente =
      n8nData.respuesta ||
      n8nData.output ||
      n8nData.text ||
      n8nData.message ||
      (typeof n8nData === "string" ? n8nData : "Lo siento, no pude procesar tu mensaje.");

    /* ── Guardar respuesta del asistente ── */

    await prisma.mensaje.create({
      data: {
        conversacion_id: convId,
        role: "assistant",
        texto: respuestaAsistente,
      },
    });

    /* ── Responder al frontend ── */

    return NextResponse.json({
      conversacion_id: convId,
      respuesta: respuestaAsistente,
    });

  } catch (error: any) {
    console.error("Error en /api/chat:", error);
    return NextResponse.json(
      { error: "Error al procesar el mensaje" },
      { status: 500 }
    );
  }
}

/* ───────────────────────────────────────────
   GET  /api/chat?usuario_id=X&conversacion_id=Y
   Obtiene historial de mensajes
   ─────────────────────────────────────────── */

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const usuario_id = searchParams.get("usuario_id");
    const conversacion_id = searchParams.get("conversacion_id");

    if (!usuario_id) {
      return NextResponse.json(
        { error: "Se requiere usuario_id" },
        { status: 400 }
      );
    }

    /* ── Si piden una conversación específica ── */

    if (conversacion_id) {
      const mensajes = await prisma.mensaje.findMany({
        where: { conversacion_id: Number(conversacion_id) },
        orderBy: { fecha: "asc" },
        select: {
          mensaje_id: true,
          role: true,
          texto: true,
          fecha: true,
        },
      });

      return NextResponse.json({ mensajes });
    }

    /* ── Si no, devolver lista de conversaciones ── */

    const conversaciones = await prisma.conversacion.findMany({
      where: {
        usuario_id: Number(usuario_id),
        activa: true,
      },
      orderBy: { fecha_creacion: "desc" },
      select: {
        conversacion_id: true,
        titulo: true,
        fecha_creacion: true,
      },
    });

    return NextResponse.json({ conversaciones });

  } catch (error: any) {
    console.error("Error en GET /api/chat:", error);
    return NextResponse.json(
      { error: "Error al obtener mensajes" },
      { status: 500 }
    );
  }
}