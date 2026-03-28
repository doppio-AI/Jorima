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

    // =========================
    // 🔹 GUARDAR RESPUESTA
    // =========================
    const nueva = await prisma.respuesta.create({
      data: {
        edificio_id,
        respuestas,
      },
    });

    // =========================
    // 🔹 OBTENER HISTÓRICO
    // =========================
    const respuestasDB = await prisma.respuesta.findMany({
      where: { edificio_id },
      orderBy: { fecha: "asc" },
    });

    const map: Record<string, number> = {
      "muy mal": 1,
      "mal": 2,
      "regular": 3,
      "bien": 4,
      "muy bien": 5,
    };

    const valores = respuestasDB.map((r) => {
      let val: any = null;

      if (r.respuestas && typeof r.respuestas === "object") {
        val = Object.values(r.respuestas)[0];
      } else {
        val = r.respuestas;
      }

      return map[String(val).toLowerCase()] ?? 3;
    });

    // =========================
    // 🔹 ENTRENAR
    // =========================
    if (valores.length >= 2) {
      await entrenarModelo(valores);
    }

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