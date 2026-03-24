import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Obtener el tipo_usuario del header (enviado desde el cliente autenticado)
    const tipoUsuario = request.headers.get("x-tipo-usuario");

    // Validar que sea administrador (tipo_usuario === 1)
    if (tipoUsuario !== "1") {
      return NextResponse.json(
        { error: "No autorizado. Solo administradores pueden acceder." },
        { status: 403 }
      );
    }

    // Obtener total de usuarios
    const totalUsuarios = await prisma.usuario.count();

    // Usuarios por edificio
    const usuariosPorEdificio = await prisma.edificio.findMany({
      include: {
        _count: {
          select: { usuario: true },
        },
      },
    });

    const usuariosPorEdificioFormatted = usuariosPorEdificio.map((edificio) => ({
      nombre: edificio.nombre,
      count: edificio._count.usuario,
    }));

    // Distribución de turnos
    const distribucionTurnos = await prisma.usuario.groupBy({
      by: ["turno"],
      _count: true,
    });

    const distribucionTurnosFormatted = distribucionTurnos
      .filter((item) => item.turno !== null)
      .map((item) => ({
        turno: item.turno || "Sin turno",
        count: item._count,
      }));

    // Total de encuestas y respuestas
    const totalEncuestas = await prisma.encuesta.count();
    const totalRespuestas = await prisma.respuesta.count();

    // Estadísticas de estado de ánimo (mood) desde respuestas de encuestas
    // Asumiendo que las respuestas de mood están guardadas en el campo respuesta como JSON
    const respuestasRaw = await prisma.respuesta.findMany({
      select: { respuesta: true },
    });

    // Contar moods anónimamente
    const moodCount: Record<string, number> = {
      "Muy Mal": 0,
      Mal: 0,
      Neutral: 0,
      Bien: 0,
      "Muy Bien": 0,
    };

    respuestasRaw.forEach((resp) => {
      try {
        if (resp.respuesta && typeof resp.respuesta === "object") {
          const mood = (resp.respuesta as Record<string, any>).mood;
          if (mood && moodCount.hasOwnProperty(mood)) {
            moodCount[mood]++;
          }
        }
      } catch (e) {
        // Ignorar respuestas que no tengan formato esperado
      }
    });

    const distribucionMood = Object.entries(moodCount).map(([mood, count]) => ({
      mood,
      count,
    }));

    // Usuarios activos basado en conversaciones recientes (últimos 7 días)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const usuariosActivos = await prisma.conversacion.groupBy({
      by: ["usuario_id"],
      where: {
        fecha_creacion: {
          gte: sevenDaysAgo,
        },
      },
    });

    const usuariosActivosCount = usuariosActivos.length;
    const usuariosInactivosCount = totalUsuarios - usuariosActivosCount;

    return NextResponse.json({
      totalUsuarios,
      usuariosPorEdificio: usuariosPorEdificioFormatted,
      distribucionTurnos: distribucionTurnosFormatted,
      distribucionMood,
      totalEncuestas,
      totalRespuestas,
      usuariosActivos: usuariosActivosCount,
      usuariosInactivos: usuariosInactivosCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error en /api/admin/stats:", error);
    return NextResponse.json(
      { error: "Error obteniendo estadísticas" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
