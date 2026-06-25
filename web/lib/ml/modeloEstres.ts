import * as tf from "@tensorflow/tfjs";

const VENTANA = 5; // usa los últimos 5 días para predecir el siguiente

/**
 * Construye pares (ventana de N días -> día siguiente)
 */
function construirDataset(serie: number[], ventana: number) {
  const xs: number[][] = [];
  const ys: number[] = [];
  for (let i = 0; i + ventana < serie.length; i++) {
    xs.push(serie.slice(i, i + ventana));
    ys.push(serie[i + ventana]);
  }
  return { xs, ys };
}

export const entrenarModeloTemporal = async (
  series: number[],
  ventana: number = VENTANA
) => {
  if (series.length <= ventana) {
    throw new Error(
      `Se necesitan más de ${ventana} días de datos para entrenar (hay ${series.length}).`
    );
  }

  const { xs, ys } = construirDataset(series, ventana);

  const xsTensor = tf.tensor2d(xs, [xs.length, ventana]);
  const ysTensor = tf.tensor2d(ys, [ys.length, 1]);

  const model = tf.sequential();
  model.add(
    tf.layers.dense({ units: 16, inputShape: [ventana], activation: "relu" })
  );
  model.add(tf.layers.dense({ units: 8, activation: "relu" }));
  model.add(tf.layers.dense({ units: 1 }));

  model.compile({
    optimizer: tf.train.adam(0.01),
    loss: "meanSquaredError",
  });

  await model.fit(xsTensor, ysTensor, {
    epochs: 100,
    verbose: 0,
  });

  xsTensor.dispose();
  ysTensor.dispose();

  return model;
};

export const proyectar30Dias = async (
  model: tf.LayersModel,
  ultimosValores: number[], // debe tener longitud = ventana
  ventana: number = VENTANA
) => {
  if (ultimosValores.length !== ventana) {
    throw new Error(
      `Se esperaban ${ventana} valores para iniciar la proyección, llegaron ${ultimosValores.length}.`
    );
  }

  const resultados: number[] = [];
  let buffer = [...ultimosValores];

  for (let i = 0; i < 30; i++) {
    const pred = model.predict(tf.tensor2d([buffer], [1, ventana])) as tf.Tensor;
    const valorArr = await pred.data();
    const val = Math.min(100, Math.max(0, valorArr[0])); // clamp 0-100
    resultados.push(val);
    pred.dispose();

    buffer = [...buffer.slice(1), val]; // desliza la ventana
  }

  return resultados;
};