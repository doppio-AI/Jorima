import * as tf from "@tensorflow/tfjs";

export const crearModelo = () => {
  const model = tf.sequential();

  model.add(tf.layers.dense({
    units: 1, // una neurona
    inputShape: [1]
  }));

  model.compile({
    loss: "meanSquaredError",
    optimizer: "sgd"
  });

  return model;
};