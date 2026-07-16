import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSesionUsuario } from "@/lib/session";
import {
  generarRespuestaJorima,
  type HistorialTurno,
} from "@/lib/ia/gemini";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NIVELES_QUE_ALERTAN = new Set(["alto", "crisis"]);

const MAX_MENSAJE_LENGTH = 2_000;
const MAX_HISTORIAL_MENSAJES = 16;

const RESPUESTA_CONTINGENCIA =
  "Lo siento, en este momento no pude procesar correctamente tu mensaje. " +
  "Puedes intentarlo nuevamente en unos momentos.";

type ChatBody = {
  mensaje?: unknown;
  conversacion_id?: unknown;
};

/* ───────────────────────────────────────────
   Helpers
─────────────────────────────────────────── */

function respuestaJson(
  data: Record<string, unknown>,
  status = 200
) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

function convertirEnteroPositivo(valor: unknown): number | null {
  if (
    valor === undefined ||
    valor === null ||
    valor === ""
  ) {
    return null;
  }

  const numero = Number(valor);

  if (
    !Number.isInteger(numero) ||
    numero <= 0
  ) {
    return null;
  }

  return numero;
}

/* ───────────────────────────────────────────
   POST /api/chat

   Body:
   {
     mensaje: string,
     conversacion_id?: number
   }

   El usuario siempre se obtiene desde la sesión.
─────────────────────────────────────────── */

export async function POST(req: NextRequest) {
  try {
    /* ── 1. Validar sesión ── */

    const sesion = getSesionUsuario(req);

    if (!sesion) {
      return respuestaJson(
        { error: "No autenticado" },
        401
      );
    }

    const usuarioId = convertirEnteroPositivo(sesion.id);

    if (!usuarioId) {
      return respuestaJson(
        { error: "Sesión inválida" },
        401
      );
    }

    /* ── 2. Leer y validar body ── */

    const body = (await req
      .json()
      .catch(() => null)) as ChatBody | null;

    if (!body) {
      return respuestaJson(
        { error: "El cuerpo de la petición no es válido" },
        400
      );
    }

    if (
      typeof body.mensaje !== "string" ||
      !body.mensaje.trim()
    ) {
      return respuestaJson(
        { error: "El mensaje es obligatorio" },
        400
      );
    }

    const mensaje = body.mensaje.trim();

    if (mensaje.length > MAX_MENSAJE_LENGTH) {
      return respuestaJson(
        {
          error: `El mensaje no puede superar los ${MAX_MENSAJE_LENGTH} caracteres`,
        },
        400
      );
    }

    let conversacionId: number;

    /* ── 3. Obtener o crear conversación ── */

    if (
      body.conversacion_id !== undefined &&
      body.conversacion_id !== null
    ) {
      const idRecibido = convertirEnteroPositivo(
        body.conversacion_id
      );

      if (!idRecibido) {
        return respuestaJson(
          { error: "El identificador de conversación no es válido" },
          400
        );
      }

      const conversacion =
        await prisma.conversacion.findFirst({
          where: {
            conversacion_id: idRecibido,
            usuario_id: usuarioId,
            activa: true,
          },
          select: {
            conversacion_id: true,
          },
        });

      if (!conversacion) {
        return respuestaJson(
          { error: "Conversación no encontrada" },
          404
        );
      }

      conversacionId = conversacion.conversacion_id;
    } else {
      const titulo =
        mensaje.length > 100
          ? `${mensaje.slice(0, 97)}...`
          : mensaje;

      const nuevaConversacion =
        await prisma.conversacion.create({
          data: {
            usuario_id: usuarioId,
            titulo,
            activa: true,
          },
          select: {
            conversacion_id: true,
          },
        });

      conversacionId =
        nuevaConversacion.conversacion_id;
    }

    /* ── 4. Guardar mensaje del usuario ── */

    const mensajeUsuario =
      await prisma.mensaje.create({
        data: {
          conversacion_id: conversacionId,
          role: "user",
          texto: mensaje,
        },
        select: {
          mensaje_id: true,
        },
      });

    /* ── 5. Obtener contexto limitado ── */

    const historialBD =
      await prisma.mensaje.findMany({
        where: {
          conversacion_id: conversacionId,
          NOT: {
            mensaje_id: mensajeUsuario.mensaje_id,
          },
        },
        orderBy: {
          fecha: "desc",
        },
        take: MAX_HISTORIAL_MENSAJES,
        select: {
          role: true,
          texto: true,
        },
      });

    /*
     * La consulta se hace descendente para recuperar únicamente
     * los mensajes más recientes. Después se revierte para que
     * Gemini los reciba en orden cronológico.
     */
    const historial: HistorialTurno[] = historialBD
      .reverse()
      .flatMap((item) => {
        if (
          item.role !== "user" &&
          item.role !== "assistant"
        ) {
          return [];
        }

        return [
          {
            role: item.role,
            texto: item.texto,
          },
        ];
      });

    /* ── 6. Consultar Gemini ── */

    let clasificacion: Awaited<
      ReturnType<typeof generarRespuestaJorima>
    >;

    try {
      clasificacion =
        await generarRespuestaJorima(
          mensaje,
          historial
        );
    } catch (geminiError: unknown) {
      console.error(
        "Error consultando Gemini:",
        geminiError
      );

      /*
       * Guardamos una respuesta de contingencia para no dejar
       * un turno incompleto en la conversación.
       */
      await prisma.mensaje.create({
        data: {
          conversacion_id: conversacionId,
          role: "assistant",
          texto: RESPUESTA_CONTINGENCIA,
        },
      });

      return respuestaJson({
        conversacion_id: conversacionId,
        respuesta: RESPUESTA_CONTINGENCIA,
        temporal: true,
      });
    }

    const esAlerta = NIVELES_QUE_ALERTAN.has(
      clasificacion.riesgo
    );

    /* ── 7. Guardar clasificación y respuesta ── */

    /*
     * La clasificación se guarda en el mensaje del usuario
     * porque ese es el texto que fue analizado.
     */
    const [, mensajeAsistente] =
      await prisma.$transaction([
        prisma.mensaje.update({
          where: {
            mensaje_id: mensajeUsuario.mensaje_id,
          },
          data: {
            sentimiento:
              clasificacion.sentimiento,
            categoria:
              clasificacion.categoria,
            riesgo:
              clasificacion.riesgo,
            alerta: esAlerta,
          },
        }),

        prisma.mensaje.create({
          data: {
            conversacion_id: conversacionId,
            role: "assistant",
            texto: clasificacion.respuesta,
          },
          select: {
            mensaje_id: true,
          },
        }),
      ]);

    /* ── 8. Crear alerta sin romper el chat ── */

    if (esAlerta) {
      try {
        await prisma.alerta_riesgo.create({
          data: {
            usuario_id: usuarioId,
            conversacion_id: conversacionId,

            /*
             * La alerta apunta al mensaje que produjo
             * la clasificación, no a la respuesta de Gemini.
             */
            mensaje_id: mensajeUsuario.mensaje_id,

            nivel: clasificacion.riesgo,
            resumen:
              clasificacion.resumen_riesgo?.trim() ||
              null,
          },
        });
      } catch (alertaError: unknown) {
        /*
         * Una falla en el dashboard o en su tabla no debe
         * impedir que el empleado reciba la respuesta.
         */
        console.error(
          "No se pudo crear la alerta de riesgo:",
          alertaError
        );
      }
    }

    /* Evitar advertencia mientras no utilicemos este ID. */
    void mensajeAsistente;

    /* ── 9. Responder al frontend ── */

    return respuestaJson({
      conversacion_id: conversacionId,
      respuesta: clasificacion.respuesta,
    });
  } catch (error: unknown) {
    console.error(
      "Error inesperado en POST /api/chat:",
      error
    );

    return respuestaJson(
      { error: "Error al procesar el mensaje" },
      500
    );
  }
}

/* ───────────────────────────────────────────
   GET /api/chat

   Sin conversacion_id:
   devuelve conversaciones.

   Con conversacion_id:
   devuelve mensajes de una conversación.
─────────────────────────────────────────── */

export async function GET(req: NextRequest) {
  try {
    /* ── 1. Validar sesión ── */

    const sesion = getSesionUsuario(req);

    if (!sesion) {
      return respuestaJson(
        { error: "No autenticado" },
        401
      );
    }

    const usuarioId = convertirEnteroPositivo(sesion.id);

    if (!usuarioId) {
      return respuestaJson(
        { error: "Sesión inválida" },
        401
      );
    }

    const conversacionParam =
      req.nextUrl.searchParams.get(
        "conversacion_id"
      );

    /* ── 2. Obtener mensajes específicos ── */

    if (conversacionParam !== null) {
      const conversacionId =
        convertirEnteroPositivo(
          conversacionParam
        );

      if (!conversacionId) {
        return respuestaJson(
          {
            error:
              "El identificador de conversación no es válido",
          },
          400
        );
      }

      const conversacion =
        await prisma.conversacion.findFirst({
          where: {
            conversacion_id: conversacionId,
            usuario_id: usuarioId,
            activa: true,
          },
          select: {
            conversacion_id: true,
          },
        });

      if (!conversacion) {
        return respuestaJson(
          { error: "Conversación no encontrada" },
          404
        );
      }

      const mensajes =
        await prisma.mensaje.findMany({
          where: {
            conversacion_id: conversacionId,
          },
          orderBy: {
            fecha: "asc",
          },
          select: {
            mensaje_id: true,
            role: true,
            texto: true,
            fecha: true,
          },
        });

      return respuestaJson({
        conversacion_id: conversacionId,
        mensajes,
      });
    }

    /* ── 3. Obtener conversaciones del usuario ── */

    const conversaciones =
      await prisma.conversacion.findMany({
        where: {
          usuario_id: usuarioId,
          activa: true,
        },
        orderBy: {
          fecha_creacion: "desc",
        },
        take: 50,
        select: {
          conversacion_id: true,
          titulo: true,
          fecha_creacion: true,
        },
      });

    return respuestaJson({
      conversaciones,
    });
  } catch (error: unknown) {
    console.error(
      "Error inesperado en GET /api/chat:",
      error
    );

    return respuestaJson(
      { error: "Error al obtener las conversaciones" },
      500
    );
  }
}