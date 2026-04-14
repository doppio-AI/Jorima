import * as tf from "@tensorflow/tfjs";

type RiesgoNivel = "bajo" | "medio" | "alto" | "crítico";
type Tendencia = "subiendo" | "bajando" | "estable";

type RespuestaDB = {
  fecha: Date | string;
  respuestas: unknown;
};

type FactoresInterpretacion = {
  tendencia: number;
  volatilidad: number;
  consistencia: number;
};

type EstadisticasModelo = {
  media: number;
  varianza: number;
  desviacion: number;
  pendiente: number;
  tendencia: Tendencia;
  muestra: number;
  mae: number;
  rmse: number;
  confianza: number;
};

type Interpretacion = {
  resumen: string;
  recomendaciones: string[];
  factores: FactoresInterpretacion;
};

export type PrediccionRiesgo = {
  historico: number[];
  prediccion: number;
  estadisticas: EstadisticasModelo | null;
  probabilidad: number;
  riesgo: RiesgoNivel | "sin datos" | "error";
  alerta: boolean;
  interpretacion: Interpretacion | null;
};

type PredCacheEntry = {
  expiresAt: number;
  result: PrediccionRiesgo;
};

const PREDICTION_CACHE_TTL_MS = 2 * 60 * 1000;
const predictionCache = new Map<number, PredCacheEntry>();

const mapValores: Record<string, number> = {
  "muy mal": 1,
  mal: 2,
  regular: 3,
  bien: 4,
  "muy bien": 5,
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function mapRespuesta(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return clamp(value, 1, 5);
  }

  const normalized = String(value ?? "").trim().toLowerCase();
  if (normalized in mapValores) return mapValores[normalized];

  const parsed = Number(normalized.replace(",", "."));
  if (Number.isFinite(parsed)) return clamp(parsed, 1, 5);

  return 3;
}

function extraerValoresRespuesta(entry: RespuestaDB) {
  const raw = entry.respuestas;
  if (!raw || typeof raw !== "object") {
    return [mapRespuesta(raw)];
  }

  const values = Object.values(raw as Record<string, unknown>);
  if (values.length === 0) return [3];

  return values.map((value) => mapRespuesta(value));
}

function normalizarFechaDia(value: Date | string) {
  const fecha = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(fecha.getTime())) {
    return null;
  }

  return fecha.toISOString().slice(0, 10);
}

function promedio(nums: number[]) {
  return nums.reduce((acc, n) => acc + n, 0) / nums.length;
}

function normalizarRespuestasPorDia(respuestas: RespuestaDB[]) {
  const dias = new Map<string, number[]>();

  for (const entry of respuestas) {
    const fecha = normalizarFechaDia(entry.fecha);
    if (!fecha) continue;

    const valores = extraerValoresRespuesta(entry);
    if (valores.length === 0) continue;

    const existentes = dias.get(fecha) ?? [];
    existentes.push(...valores);
    dias.set(fecha, existentes);
  }

  return Array.from(dias.entries())
    .sort(([fechaA], [fechaB]) => fechaA.localeCompare(fechaB))
    .map(([, valores]) => Number(promedio(valores).toFixed(3)));
}

function calcularEstadisticas(data: number[]) {
  const n = data.length;
  const media = promedio(data);

  const varianza = data.reduce((acc, value) => {
    const diff = value - media;
    return acc + diff * diff;
  }, 0) / n;

  const desviacion = Math.sqrt(varianza);

  const xMean = (n - 1) / 2;
  const numerador = data.reduce((acc, y, i) => acc + (i - xMean) * (y - media), 0);
  const denominador = data.reduce((acc, _y, i) => acc + (i - xMean) ** 2, 0);
  const pendiente = denominador === 0 ? 0 : numerador / denominador;

  let tendencia: Tendencia = "estable";
  if (pendiente > 0.015) tendencia = "subiendo";
  if (pendiente < -0.015) tendencia = "bajando";

  return { media, varianza, desviacion, pendiente, tendencia, muestra: n };
}

function crearModelo() {
  const model = tf.sequential();

  model.add(
    tf.layers.dense({
      units: 16,
      inputShape: [1],
      activation: "relu",
      kernelInitializer: "heNormal",
    })
  );

  model.add(tf.layers.dropout({ rate: 0.08 }));

  model.add(
    tf.layers.dense({
      units: 8,
      activation: "relu",
      kernelInitializer: "heNormal",
    })
  );

  model.add(tf.layers.dense({ units: 1, activation: "linear" }));

  model.compile({
    optimizer: tf.train.adam(0.01),
    loss: "meanSquaredError",
  });

  return model;
}

async function entrenarYPredecir(data: number[]) {
  const n = data.length;
  const xMax = Math.max(1, n - 1);

  const xValues = data.map((_value, index) => [index / xMax]);
  const yValues = data.map((value) => [(value - 1) / 4]);

  const xs = tf.tensor2d(xValues);
  const ys = tf.tensor2d(yValues);

  const model = crearModelo();

  await model.fit(xs, ys, {
    epochs: 120,
    batchSize: Math.min(8, n),
    verbose: 0,
    shuffle: false,
  });

  const trainPred = model.predict(xs) as tf.Tensor;
  const trainPredData = await trainPred.data();

  const maeRaw = yValues.reduce((acc, y, i) => {
    return acc + Math.abs(y[0] - trainPredData[i]);
  }, 0) / n;

  const rmseRaw = Math.sqrt(
    yValues.reduce((acc, y, i) => {
      const diff = y[0] - trainPredData[i];
      return acc + diff * diff;
    }, 0) / n
  );

  const nextInput = tf.tensor2d([[n / xMax]]);
  const nextPred = model.predict(nextInput) as tf.Tensor;
  const nextRaw = (await nextPred.data())[0];

  xs.dispose();
  ys.dispose();
  trainPred.dispose();
  nextInput.dispose();
  nextPred.dispose();
  model.dispose();

  const prediccionEscala = clamp(1 + nextRaw * 4, 1, 5);

  return {
    prediccion: Number(prediccionEscala.toFixed(2)),
    mae: Number((maeRaw * 4).toFixed(3)),
    rmse: Number((rmseRaw * 4).toFixed(3)),
    confianza: Number(clamp(1 - rmseRaw, 0, 1).toFixed(3)),
  };
}

function calcularProbabilidad(score: number) {
  return clamp(1 - score / 5, 0, 1);
}

function nivelRiesgo(probabilidad: number): RiesgoNivel {
  if (probabilidad >= 0.75) return "crítico";
  if (probabilidad >= 0.55) return "alto";
  if (probabilidad >= 0.3) return "medio";
  return "bajo";
}

function construirInterpretacion(
  stats: ReturnType<typeof calcularEstadisticas>,
  confianza: number,
  riesgo: RiesgoNivel
): Interpretacion {
  const tendenciaFactor = clamp(Math.abs(stats.pendiente) * 20, 0, 1);
  const volatilidadFactor = clamp(stats.desviacion / 2, 0, 1);
  const consistenciaFactor = clamp(confianza, 0, 1);

  let resumen = "Ambiente estable con riesgo controlado.";
  if (riesgo === "medio") resumen = "Hay señales tempranas de deterioro en el ambiente laboral.";
  if (riesgo === "alto") resumen = "El riesgo es alto; se recomienda intervención táctica inmediata.";
  if (riesgo === "crítico") resumen = "El riesgo es crítico; se requiere plan urgente con seguimiento diario.";

  if (stats.tendencia === "subiendo") {
    resumen += " La tendencia histórica muestra mejora gradual.";
  } else if (stats.tendencia === "bajando") {
    resumen += " La tendencia histórica muestra deterioro sostenido.";
  } else {
    resumen += " La tendencia se mantiene lateral.";
  }

  const recomendaciones: string[] = [];
  if (riesgo === "alto" || riesgo === "crítico") {
    recomendaciones.push("Priorizar intervención focalizada en los equipos con menor percepción de bienestar.");
    recomendaciones.push("Ejecutar acciones de soporte psicosocial y seguimiento semanal.");
  } else {
    recomendaciones.push("Mantener monitoreo quincenal y reforzar prácticas de reconocimiento positivo.");
  }

  if (volatilidadFactor > 0.55) {
    recomendaciones.push("Reducir variabilidad mediante comunicación de objetivos y carga de trabajo balanceada.");
  }

  if (consistenciaFactor < 0.5) {
    recomendaciones.push("Incrementar volumen de respuestas para mejorar la confianza estadística del modelo.");
  }

  return {
    resumen,
    recomendaciones,
    factores: {
      tendencia: Number(tendenciaFactor.toFixed(3)),
      volatilidad: Number(volatilidadFactor.toFixed(3)),
      consistencia: Number(consistenciaFactor.toFixed(3)),
    },
  };
}

const EMPTY_RESULT: PrediccionRiesgo = {
  historico: [],
  prediccion: 0,
  estadisticas: null,
  probabilidad: 0,
  riesgo: "sin datos",
  alerta: false,
  interpretacion: null,
};

export function invalidarPrediccion(edificio_id: number) {
  predictionCache.delete(edificio_id);
}

export async function predecir(edificio_id: number): Promise<PrediccionRiesgo> {
  try {
    if (!Number.isInteger(edificio_id) || edificio_id <= 0) {
      throw new Error("ID inválido");
    }

    const cacheEntry = predictionCache.get(edificio_id);
    if (cacheEntry && cacheEntry.expiresAt > Date.now()) {
      return cacheEntry.result;
    }

    const { prisma } = await import("@/lib/prisma");

    const respuestasDB = (await prisma.respuesta.findMany({
      where: { edificio_id },
      orderBy: { fecha: "asc" },
      select: {
        fecha: true,
        respuestas: true,
      },
    })) as RespuestaDB[];

    const valores = normalizarRespuestasPorDia(respuestasDB);
    if (valores.length < 2) {
      return EMPTY_RESULT;
    }

    await tf.ready();

    const statsBase = calcularEstadisticas(valores);
    const pred = await entrenarYPredecir(valores);

    const probabilidad = Number(calcularProbabilidad(pred.prediccion).toFixed(3));
    const riesgo = nivelRiesgo(probabilidad);
    const alerta = probabilidad >= 0.65;

    const estadisticas: EstadisticasModelo = {
      media: Number(statsBase.media.toFixed(3)),
      varianza: Number(statsBase.varianza.toFixed(3)),
      desviacion: Number(statsBase.desviacion.toFixed(3)),
      pendiente: Number(statsBase.pendiente.toFixed(4)),
      tendencia: statsBase.tendencia,
      muestra: statsBase.muestra,
      mae: pred.mae,
      rmse: pred.rmse,
      confianza: pred.confianza,
    };

    const interpretacion = construirInterpretacion(statsBase, pred.confianza, riesgo);

    const result: PrediccionRiesgo = {
      historico: valores,
      prediccion: pred.prediccion,
      estadisticas,
      probabilidad,
      riesgo,
      alerta,
      interpretacion,
    };

    predictionCache.set(edificio_id, {
      result,
      expiresAt: Date.now() + PREDICTION_CACHE_TTL_MS,
    });

    return result;
  } catch (error) {
    console.error("ML ERROR:", error);
    return {
      ...EMPTY_RESULT,
      riesgo: "error",
    };
  }
}
