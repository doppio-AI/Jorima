import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const edificios = await prisma.edificio.findMany({
      include: { usuario: true, respuesta: true },
    });
    return NextResponse.json(edificios);
  } catch (error: unknown) {
    const mensaje = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json(
      { error: "Error al obtener edificios", detalle: mensaje },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const nuevo = await prisma.edificio.create({
      data: {
        nombre: body.nombre,
        descripcion: body.descripcion,
      },
    });
    return NextResponse.json(nuevo);
  } catch (error: unknown) {
    const mensaje = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json(
      { error: "Error al crear edificio", detalle: mensaje },
      { status: 500 }
    );
  }
}
