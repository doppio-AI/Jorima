import { NextResponse } from "next/server";
import { predecir } from "@/lib/ml";

export async function GET(
  req: Request,
  context: { params: Promise<{ edificio: string }> }
) {
  try {
    // 🔥 FIX Next.js (params async)
    const { edificio } = await context.params;

    const id = Number(edificio);

    // 🔒 Validación
    if (!id || isNaN(id)) {
      return NextResponse.json(
        { error: "ID de edificio inválido" },
        { status: 400 }
      );
    }

    const result = await predecir(id);

    return NextResponse.json(result);
  } catch (error) {
    console.error("ERROR PREDICCION:", error);

    return NextResponse.json(
      {
        historico: [],
        prediccion: 0,
        estadisticas: null,
        probabilidad: 0,
        riesgo: "error",
        alerta: false,
        interpretacion: null,
      },
      { status: 500 }
    );
  }
}