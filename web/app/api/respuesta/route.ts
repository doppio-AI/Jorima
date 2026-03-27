import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { entrenarModelo } from "@/lib/ml";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { edificio_id, respuestas } = body;

    if (!edificio_id || !respuestas) {
      return NextResponse.json(
        { error: "Faltan datos" },
        { status: 400 }
      );
    }

    const valoresValidos = ["muy mal", "mal", "regular", "bien", "muy bien"];

    for (const key in respuestas) {
      const valor = String(respuestas[key]).toLowerCase();

      if (!valoresValidos.includes(valor)) {
        return NextResponse.json(
          { error: `Valor inválido en "${key}"` },
          { status: 400 }
        );
      }
    }

    const nueva = await prisma.respuesta.create({
      data: {
        edificio_id,
        respuestas,
      },
    });

    await entrenarModelo(edificio_id);

    return NextResponse.json(nueva);

  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Error en POST" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const data = await prisma.respuesta.findMany({
      orderBy: { respuesta_id: "desc" },
    });

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: "Error en GET" },
      { status: 500 }
    );
  }
}