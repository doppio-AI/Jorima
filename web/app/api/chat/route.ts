import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSesionUsuario } from "@/lib/session";
import { generarRespuestaJorima, type HistorialTurno } from "@/lib/ia/gemini";

const NIVELES_QUE_ALERTAN = new Set(["alto", "crisis"]);

/* ───────────────────────────────────────────
   POST  /api/chat
   Body: { mensaje, conversacion_id? }
   El usuario_id SIEMPRE sale de la sesión, nunca del body
   (cierra deuda técnica crítica #6 del README).
   ─────────────────────────────────────────── */

export async function POST(req: NextRequest) {
  try {
    const sesion = getSesionUsuario(req);
    if (!sesion) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    const usuario_id = sesion.id;

    const body = await req.json();
    const { mensaje, conversacion_id } = body;

    if (!mensaje || typeof mensaje !== "string" || !mensaje.trim()) {
      return NextResponse.json(
        { error: "Falta el campo mensaje" },
        { status: 400 }
      );
    }

    /* ── Obtener o crear conversación (validando que sea del usuario) ── */

    let convId: number = conversacion_id;

    if (convId) {
      const conv = await prisma.conversacion.findUnique({
        where: { conversacion_id: Number(convId) },
        select: { usuario_id: true },
      });
      if (!conv || conv.usuario_id !== usuario_id) {
        return NextResponse.json(
          { error: "Conversación no encontrada" },
          { status: 404 }
        );
      }
    } else {
      const nueva = await prisma.conversacion.create({
        data: {
          usuario_id,
          titulo: mensaje.substring(0, 100),
        },
      });
      convId = nueva.conversacion_id;
    }

    /* ── Guardar mensaje del usuario (aún sin metadatos) ── */

    await prisma.mensaje.create({
      data: {
        conversacion_id: convId,
        role: "user",
        texto: mensaje,
      },
    });

    /* ── Obtener historial para contexto ── */

    const historialBD = await prisma.mensaje.findMany({
      where: { conversacion_id: convId },
      orderBy: { fecha: "asc" },
      select: { role: true, texto: true },
    });

    // El último elemento es el mensaje que acabamos de guardar; Gemini lo
    // recibe por separado en sendMessage, así que se excluye del historial.
    const historial: HistorialTurno[] = historialBD
      .slice(0, -1)
      .map((m) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        texto: m.texto,
      }));

    /* ── Generar respuesta + clasificación con Gemini ── */

    const clasificacion = await generarRespuestaJorima(mensaje, historial);
    const esAlerta = NIVELES_QUE_ALERTAN.has(clasificacion.riesgo);

    /* ── Guardar respuesta del asistente con metadatos ── */
    /* El mensaje del usuario recibe la clasificación (habla de él), pero  */
    /* técnicamente Gemini clasifica el turno completo; guardamos los      */
    /* metadatos en el mensaje del asistente para no reescribir el mensaje */
    /* del usuario ya persistido.                                          */

    const mensajeAsistente = await prisma.mensaje.create({
      data: {
        conversacion_id: convId,
        role: "assistant",
        texto: clasificacion.respuesta,
        sentimiento: clasificacion.sentimiento,
        categoria: clasificacion.categoria,
        riesgo: clasificacion.riesgo,
        alerta: esAlerta,
      },
    });

    /* ── Si el riesgo lo amerita, crear alerta para el dashboard ── */
    /* Nunca bloquea ni modifica la respuesta al usuario. */

    if (esAlerta) {
      await prisma.alerta_riesgo.create({
        data: {
          usuario_id,
          conversacion_id: convId,
          mensaje_id: mensajeAsistente.mensaje_id,
          nivel: clasificacion.riesgo,
          resumen: clasificacion.resumen_riesgo || null,
        },
      });
    }

    /* ── Responder al frontend (sin exponer metadatos de riesgo) ── */

    return NextResponse.json({
      conversacion_id: convId,
      respuesta: clasificacion.respuesta,
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
   GET  /api/chat?conversacion_id=Y
   Obtiene historial de mensajes. usuario_id sale de la sesión.
   ─────────────────────────────────────────── */

export async function GET(req: NextRequest) {
  try {
    const sesion = getSesionUsuario(req);
    if (!sesion) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    const usuario_id = sesion.id;

    const { searchParams } = new URL(req.url);
    const conversacion_id = searchParams.get("conversacion_id");

    /* ── Si piden una conversación específica, validar propiedad ── */

    if (conversacion_id) {
      const conv = await prisma.conversacion.findUnique({
        where: { conversacion_id: Number(conversacion_id) },
        select: { usuario_id: true },
      });

      if (!conv || conv.usuario_id !== usuario_id) {
        return NextResponse.json(
          { error: "Conversación no encontrada" },
          { status: 404 }
        );
      }

      const mensajes = await prisma.mensaje.findMany({
        where: { conversacion_id: Number(conversacion_id) },
        orderBy: { fecha: "asc" },
        select: {
          mensaje_id: true,
          role: true,
          texto: true,
          fecha: true,
          // No se exponen sentimiento/categoria/riesgo/alerta al cliente
          // del empleado: son datos internos para RH/psicología.
        },
      });

      return NextResponse.json({ mensajes });
    }

    /* ── Si no, devolver lista de conversaciones del usuario en sesión ── */

    const conversaciones = await prisma.conversacion.findMany({
      where: {
        usuario_id,
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
