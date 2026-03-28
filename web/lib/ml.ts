import * as tf from "@tensorflow/tfjs";

let modelo: tf.Sequential | null = null;

// =========================
// 🔹 LIMPIAR TF
// =========================
function resetTF() {
  tf.engine().disposeVariables();
}

// =========================
// 🔹 CREAR MODELO
// =========================
function crearModelo() {
  resetTF();

  const model = tf.sequential();

  model.add(
    tf.layers.dense({
      units: 8,
      inputShape: [1],
      activation: "relu",
    })
  );

  model.add(
    tf.layers.dense({
      units: 1,
    })
  );

  model.compile({
    optimizer: "adam",
    loss: "meanSquaredError",
  });

  return model;
}

// =========================
// 🔹 MAPEO GLOBAL
// =========================
const mapValores: Record<string, number> = {
  "muy mal": 1,
  "mal": 2,
  "regular": 3,
  "bien": 4,
  "muy bien": 5,
};

// =========================
// 🔹 NORMALIZAR RESPUESTAS
// =========================
function normalizarRespuestas(respuestas: any[]) {
  return respuestas.map((r) => {
    let val: any = null;

    if (r.respuestas && typeof r.respuestas === "object") {
      val = Object.values(r.respuestas)[0];
    } else {
      val = r.respuestas;
    }

    return mapValores[String(val).toLowerCase()] ?? 3;
  });
}

// =========================
// 🔹 ESTADÍSTICA
// =========================
function calcularEstadisticas(data: number[]) {
  const n = data.length;

  const media = data.reduce((a, b) => a + b, 0) / n;

  const varianza =
    data.reduce((sum, x) => sum + Math.pow(x - media, 2), 0) / n;

  const desviacion = Math.sqrt(varianza);

  const x = data.map((_, i) => i);

  const xMean = x.reduce((a, b) => a + b, 0) / n;

  const numerador = x.reduce(
    (sum, xi, i) => sum + (xi - xMean) * (data[i] - media),
    0
  );

  const denominador = x.reduce(
    (sum, xi) => sum + Math.pow(xi - xMean, 2),
    0
  );

  const pendiente = denominador === 0 ? 0 : numerador / denominador;

  return {
    media,
    varianza,
    desviacion,
    pendiente,
  };
}

// =========================
// 🔹 ENTRENAR (EXPORTADO)
// =========================
export async function entrenarModelo(data: number[]) {
  if (!data || data.length < 2) return;

  modelo = crearModelo();

  const xs = tf.tensor2d(data.map((_, i) => [i]));
  const ys = tf.tensor2d(data.map((v) => [v]));

  await modelo.fit(xs, ys, {
    epochs: 50,
    verbose: 0,
  });

  xs.dispose();
  ys.dispose();
}

// =========================
// 🔹 PROBABILIDAD
// =========================
function calcularProbabilidad(media: number) {
  return (media - 1) / 4;
}

// =========================
// 🔹 NIVEL DE RIESGO
// =========================
function nivelRiesgo(valor: number) {
  if (valor < 2) return "crítico";
  if (valor < 3) return "alto";
  if (valor < 4) return "medio";
  return "bajo";
}

// =========================
// 🔹 PREDICCIÓN COMPLETA
// =========================
export async function predecir(edificio_id: number) {
  try {
    if (!edificio_id || isNaN(edificio_id)) {
      throw new Error("ID inválido");
    }

    const { prisma } = await import("@/lib/prisma");

    const respuestasDB = await prisma.respuesta.findMany({
      where: { edificio_id: Number(edificio_id) },
      orderBy: { fecha: "asc" },
    });

    if (!respuestasDB || respuestasDB.length < 2) {
      return {
        historico: [],
        prediccion: 0,
        estadisticas: null,
        probabilidad: 0,
        riesgo: "sin datos",
      };
    }

    // =========================
    // 🔹 NORMALIZAR
    // =========================
    const valores = normalizarRespuestas(respuestasDB);

    // =========================
    // 🔹 ESTADÍSTICA
    // =========================
    const stats = calcularEstadisticas(valores);

    // =========================
    // 🔹 ENTRENAR
    // =========================
    await entrenarModelo(valores);

    if (!modelo) throw new Error("Modelo no inicializado");

    const nextX = tf.tensor2d([[valores.length]]);
    const pred = modelo.predict(nextX) as tf.Tensor;

    const prediccionRaw = (await pred.data())[0];

    nextX.dispose();
    pred.dispose();

    const prediccion = Number(prediccionRaw.toFixed(2));

    const probabilidad = Number(
      calcularProbabilidad(stats.media).toFixed(2)
    );

    const riesgo = nivelRiesgo(prediccion);

    return {
      historico: valores,

      prediccion,

      estadisticas: {
        media: Number(stats.media.toFixed(2)),
        varianza: Number(stats.varianza.toFixed(2)),
        desviacion: Number(stats.desviacion.toFixed(2)),
        tendencia: Number(stats.pendiente.toFixed(3)),
      },

      probabilidad,

      riesgo,
    };
  } catch (error) {
    console.error("ML ERROR:", error);

    return {
      historico: [],
      prediccion: 0,
      estadisticas: null,
      probabilidad: 0,
      riesgo: "error",
    };
  }
}