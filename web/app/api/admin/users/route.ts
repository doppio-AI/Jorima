import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Validar que sea administrador
    const tipoUsuario = request.headers.get("x-tipo-usuario");

    if (tipoUsuario !== "1") {
      return NextResponse.json(
        { error: "No autorizado. Solo administradores pueden acceder." },
        { status: 403 }
      );
    }

    // Obtener todos los usuarios con información seleccionada
    const usuarios = await prisma.usuario.findMany({
      select: {
        usuario_id: true,
        edificio: {
          select: {
            nombre: true,
          },
        },
        turno: true,
        fecha_registro: true,
        conversacion: {
          select: {
            fecha_creacion: true,
          },
          orderBy: {
            fecha_creacion: "desc",
          },
          take: 1,
        },
      },
    });

    // Transformar datos para ser anónimos
    const usuariosAnonimos = usuarios.map((usuario) => {
      // Determinar si está activo (conversaciones en últimos 7 días)
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const ultimaConversacion = usuario.conversacion[0];
      const estado =
        ultimaConversacion &&
        new Date(ultimaConversacion.fecha_creacion) > sevenDaysAgo
          ? "activo"
          : "inactivo";

      // Formatear última actividad
      let ultimaActividad = "Sin registros";
      if (ultimaConversacion) {
        const fecha = new Date(ultimaConversacion.fecha_creacion);
        const ahora = new Date();
        const diff = ahora.getTime() - fecha.getTime();
        const dias = Math.floor(diff / (1000 * 60 * 60 * 24));
        const horas = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutos = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        if (dias > 0) {
          ultimaActividad = `Hace ${dias} día${dias > 1 ? "s" : ""}`;
        } else if (horas > 0) {
          ultimaActividad = `Hace ${horas} hora${horas > 1 ? "s" : ""}`;
        } else if (minutos > 0) {
          ultimaActividad = `Hace ${minutos} minuto${minutos > 1 ? "s" : ""}`;
        } else {
          ultimaActividad = "Hace poco";
        }
      }

      return {
        id: usuario.usuario_id,
        edificio: usuario.edificio.nombre,
        turno: usuario.turno || "N/A",
        estado,
        ultimaActividad,
      };
    });

    return NextResponse.json(usuariosAnonimos);
  } catch (error) {
    console.error("Error en /api/admin/users:", error);
    return NextResponse.json(
      { error: "Error obteniendo usuarios" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
