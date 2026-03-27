import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calcularRiesgo } from "@/lib/ml/preprocess";

export async function GET() {
  try {
    const edificios = await prisma.edificio.findMany({
      select: {
        edificio_id: true,
        nombre: true,
      },
    });

    const buildings = await Promise.all(
      edificios.map(async (e) => {
        const respuestas = await prisma.respuesta.findMany({
          where: { edificio_id: e.edificio_id },
        });

        const total = respuestas.length;

        const riesgo = total > 0 ? calcularRiesgo(3) : 0;

        return {
          edificio_id: e.edificio_id,
          edificio_nombre: e.nombre,

          riskScore: riesgo,
          riskLevel: "bajo",

          neurona: {
            probabilidad: riesgo,
            alerta: false,
          },
        };
      })
    );

    // 🔥 SIEMPRE REGRESA buildings
    return NextResponse.json({
      buildings: buildings || [],
    });
  } catch (error) {
    console.error("ERROR API RIESGO:", error);

    // 🔥 NUNCA rompas el front
    return NextResponse.json({
      buildings: [],
    });
  }
}