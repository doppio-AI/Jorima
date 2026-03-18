import { NextResponse } from "next/server";

// función sigmoide
function sigmoid(x: number) {
  return 1 / (1 + Math.exp(-x));
}

export async function GET() {

  // entradas simuladas
  const respuestas_negativas = Math.floor(Math.random() * 10);
  const siendo_atendido = Math.random() < 0.5;

  // convertir booleano a número
  const atendido = siendo_atendido ? 1 : 0;

  // 🔥 crecimiento exponencial controlado
  const k = 0.4; // controla qué tan rápido crece
  const negativas_transformadas = Math.exp(k * respuestas_negativas);

  // pesos
  const w1 = 0.05;   // bajamos el peso porque exponencial crece mucho
  const w2 = -2.5;

  const bias = -3;

  // nueva suma neuronal
  const z = (negativas_transformadas * w1) + (atendido * w2) + bias;

  const probabilidad = sigmoid(z);

  const alerta = probabilidad > 0.5;

  return NextResponse.json({
    entradas: {
      respuestas_negativas,
      siendo_atendido
    },
    transformacion: {
      negativas_transformadas
    },
    neurona: {
      z,
      probabilidad_alerta: probabilidad
    },
    alerta,
    mensaje: alerta
      ? "Riesgo alto detectado → enviar aviso"
      : "Ambiente laboral estable"
  });

}