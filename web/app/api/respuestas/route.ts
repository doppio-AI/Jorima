import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const respuestas = await prisma.respuesta.findMany({ include: { encuesta: true } });
    return NextResponse.json(respuestas);
  } catch (error: unknown) {
    const mensaje = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json(
      { error: "Error al obtener respuestas", detalle: mensaje },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const nueva = await prisma.respuesta.create({
      data: {
        encuesta_id: body.encuesta_id,
        respuesta: body.respuesta,
      },
    });
    return NextResponse.json(nueva);
  } catch (error: unknown) {
    const mensaje = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json(
      { error: "Error al crear respuesta", detalle: mensaje },
      { status: 500 }
    );
  }
}
