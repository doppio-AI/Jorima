import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const conversaciones = await prisma.conversacion.findMany({
      include: { usuario: true, mensaje: true },
    });
    return NextResponse.json(conversaciones);
  } catch (error: unknown) {
    const mensaje = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json(
      { error: "Error al obtener conversaciones", detalle: mensaje },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const nueva = await prisma.conversacion.create({
      data: {
        usuario_id: body.usuario_id,
        titulo: body.titulo,
        activa: body.activa ?? true,
      },
    });
    return NextResponse.json(nueva);
  } catch (error: unknown) {
    const mensaje = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json(
      { error: "Error al crear conversacion", detalle: mensaje },
      { status: 500 }
    );
  }
}
