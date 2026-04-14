import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { invalidarPrediccion, predecir } from "../../../lib/ml";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { edificio_id, respuestas } = body;

    if (!edificio_id || !respuestas || typeof respuestas !== "object") {
      return NextResponse.json(
        { error: "Faltan datos" },
        { status: 400 }
      );
    }

    const respuestasPayload = respuestas as Record<string, unknown>;

    const valoresValidos = ["muy mal", "mal", "regular", "bien", "muy bien"];

    for (const key in respuestasPayload) {
      const valor = String(respuestasPayload[key]).toLowerCase();

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
        respuestas: respuestasPayload as Prisma.InputJsonValue,
      },
    });


    invalidarPrediccion(Number(edificio_id));
    const prediccion = await predecir(Number(edificio_id));

    return NextResponse.json({
      respuesta: nueva,
      prediccion,
    });

  } catch (error) {
    console.error("Error en POST /api/respuesta:", error);

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
  } catch {
    return NextResponse.json(
      { error: "Error en GET" },
      { status: 500 }
    );
  }
}