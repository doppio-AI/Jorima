import * as tf from "@tensorflow/tfjs";

export const entrenarModeloTemporal = async (series: number[]) => {
  const xs = [];
  const ys = [];

  for (let i = 0; i < series.length - 1; i++) {
    xs.push(series[i]);
    ys.push(series[i + 1]); // siguiente día
  }

  const xsTensor = tf.tensor2d(xs, [xs.length, 1]);
  const ysTensor = tf.tensor2d(ys, [ys.length, 1]);

  const model = tf.sequential();

  model.add(tf.layers.dense({ units: 10, inputShape: [1], activation: "relu" }));
  model.add(tf.layers.dense({ units: 1 }));

  model.compile({
    optimizer: tf.train.adam(0.01),
    loss: "meanSquaredError",
  });

  await model.fit(xsTensor, ysTensor, {
    epochs: 60,
    verbose: 0,
  });

  return model;
};

export const proyectar30Dias = async (
  model: tf.LayersModel,
  ultimoValor: number
) => {
  const resultados: number[] = [];
  let actual = ultimoValor;

  for (let i = 0; i < 30; i++) {
    const pred = model.predict(tf.tensor2d([actual], [1, 1])) as tf.Tensor;
    const val = (await pred.data())[0];

    resultados.push(val);
    actual = val;
  }

  return resultados;
};