import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const encuestas = await prisma.encuesta.findMany({
      include: { usuario: true, edificio: true, respuesta: true },
    });
    return NextResponse.json(encuestas);
  } catch (error: unknown) {
    const mensaje = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json(
      { error: "Error al obtener encuestas", detalle: mensaje },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const nueva = await prisma.encuesta.create({
      data: {
        titulo: body.titulo,
        descripcion: body.descripcion,
        edificio_id: body.edificio_id,
        creador_id: body.creador_id,
      },
    });
    return NextResponse.json(nueva);
  } catch (error: unknown) {
    const mensaje = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json(
      { error: "Error al crear encuesta", detalle: mensaje },
      { status: 500 }
    );
  }
}
