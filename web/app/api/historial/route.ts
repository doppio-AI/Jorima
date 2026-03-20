import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/* ───────────────────────────────────────────
   GET  /api/historial?usuario_id=X
   Obtiene todas las conversaciones con sus mensajes
   ─────────────────────────────────────────── */

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const usuario_id = searchParams.get("usuario_id");

    if (!usuario_id) {
      return NextResponse.json(
        { error: "Se requiere usuario_id" },
        { status: 400 }
      );
    }

    const conversaciones = await prisma.conversacion.findMany({
      where: {
        usuario_id: Number(usuario_id),
      },
      orderBy: { fecha_creacion: "desc" },
      include: {
        mensaje: {
          orderBy: { fecha: "asc" },
          select: {
            mensaje_id: true,
            role: true,
            texto: true,
            fecha: true,
          },
        },
        _count: {
          select: { mensaje: true },
        },
      },
    });

    return NextResponse.json({ conversaciones });

  } catch (error: any) {
    console.error("Error en GET /api/historial:", error);
    return NextResponse.json(
      { error: "Error al obtener historial" },
      { status: 500 }
    );
  }
}