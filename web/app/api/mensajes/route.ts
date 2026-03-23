import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const mensajes = await prisma.mensaje.findMany({ include: { conversacion: true } });
    return NextResponse.json(mensajes);
  } catch (error: unknown) {
    const mensaje = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json(
      { error: "Error al obtener mensajes", detalle: mensaje },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const nuevo = await prisma.mensaje.create({
      data: {
        conversacion_id: body.conversacion_id,
        role: body.role,
        texto: body.texto,
      },
    });
    return NextResponse.json(nuevo);
  } catch (error: unknown) {
    const mensaje = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json(
      { error: "Error al crear mensaje", detalle: mensaje },
      { status: 500 }
    );
  }
}
