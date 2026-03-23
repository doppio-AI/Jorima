import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const edificios = await prisma.edificio.findMany({
      orderBy: { nombre: "asc" },
      select: {
        edificio_id: true,
        nombre: true,
      },
    });

    return NextResponse.json(edificios);
  } catch (error: unknown) {
    const mensaje =
      error instanceof Error ? error.message : "Error desconocido";

    return NextResponse.json(
      { error: "Error al obtener edificios", detalle: mensaje },
      { status: 500 }
    );
  }
}