import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  agruparPorDia,
  promediosDiarios,
  calcularRiesgo,
} from "@/lib/ml/preprocess";

export async function GET() {
  try {
    // 🔥 1. TRAER TODOS LOS EDIFICIOS
    const edificios = await prisma.edificio.findMany({
      select: {
        edificio_id: true,
        nombre: true,
      },
    });

    if (!edificios.length) {
      return NextResponse.json({
        buildings: [],
        areas: [],
        users: [],
      });
    }

    // 🔥 2. PROCESAR CADA EDIFICIO
    const buildings = await Promise.all(
      edificios.map(async (e) => {
        const respuestas = await prisma.respuesta.findMany({
          where: { edificio_id: e.edificio_id },
          orderBy: { fecha: "asc" },
        });

        // ⚠️ SIN DATOS
        if (respuestas.length === 0) {
          return {
            edificio_id: e.edificio_id,
            edificio_nombre: e.nombre,

            riskScore: 0,
            riskLevel: "bajo",
            probability: 0,
            impact: 0,
            trend: 0,
            avgScoreRecent: 0,

            probabilityBin: "bajo",
            impactBin: "bajo",

            neurona: {
              negativas_transformadas: 0,
              z: 0,
              probabilidad: 0,
              alerta: false,
            },

            totals: {
              recentCount: 0,
              prevCount: 0,
              negCountRecent: 0,
              negCountPrev: 0,
            },
          };
        }

        // 🔥 PROCESAMIENTO REAL
        const dias = agruparPorDia(respuestas);
        const serie = promediosDiarios(dias);

        const ultimo = serie[serie.length - 1]?.promedio || 0;

        const riesgo = calcularRiesgo(ultimo);

        // 🔥 CLASIFICACIÓN
        let nivel: "bajo" | "medio" | "alto" | "crítico" = "bajo";

        if (riesgo > 0.75) nivel = "crítico";
        else if (riesgo > 0.5) nivel = "alto";
        else if (riesgo > 0.25) nivel = "medio";

        return {
          edificio_id: e.edificio_id,
          edificio_nombre: e.nombre,

          riskScore: riesgo,
          riskLevel: nivel,

          probability: riesgo,
          impact: riesgo,
          trend: 0,
          avgScoreRecent: ultimo,

          probabilityBin: nivel,
          impactBin: nivel,

          neurona: {
            negativas_transformadas: 0,
            z: 0,
            probabilidad: riesgo,
            alerta: riesgo > 0.7,
          },

          totals: {
            recentCount: respuestas.length,
            prevCount: 0,
            negCountRecent: 0,
            negCountPrev: 0,
          },
        };
      })
    );

    return NextResponse.json({
      buildings,
      areas: [],
      users: [],
    });
  } catch (error) {
    console.error("ERROR API RIESGO:", error);

    return NextResponse.json(
      { error: "Error interno" },
      { status: 500 }
    );
  }
}