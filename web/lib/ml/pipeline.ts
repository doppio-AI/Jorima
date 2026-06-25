import { RespuestaLikert, PreguntaCuestionario, RegistroDiario } from "./types";

/**
 * Normaliza una respuesta Likert (1-5) a escala de estrés 0-100,
 * respetando el peso (y si es negativo, invierte la escala).
 */
function normalizarRespuesta(valor: number, peso: number = 1): number {
  // 1 -> 0, 5 -> 100 en escala "a más alto, más estrés"
  const baseEscala = ((valor - 1) / 4) * 100;
  if (peso < 0) {
    return (100 - baseEscala) * Math.abs(peso);
  }
  return baseEscala * peso;
}

/**
 * Calcula el score de estrés diario (0-100) a partir de
 * un set de respuestas de un día, usando el banco de preguntas
 * para resolver los pesos.
 */
export function calcularScoreDiario(
  respuestas: RespuestaLikert[],
  bancoPreguntas: PreguntaCuestionario[]
): number {
  if (respuestas.length === 0) return NaN;

  let sumaPonderada = 0;
  let sumaPesos = 0;

  for (const r of respuestas) {
    const pregunta = bancoPreguntas.find((p) => p.id === r.preguntaId);
    const peso = pregunta?.peso ?? 1;
    sumaPonderada += normalizarRespuesta(r.valor, peso);
    sumaPesos += Math.abs(peso);
  }

  return sumaPonderada / sumaPesos; // promedio ponderado 0-100
}

/**
 * Agrupa registros por fecha y genera la serie temporal final.
 * Si un día no tiene datos (cuestionario de seguimiento es solo 3x/semana),
 * se interpola linealmente para no romper la regresión.
 */
export function construirSerieTemporal(
  registros: RegistroDiario[]
): { fechas: string[]; valores: number[] } {
  const ordenados = [...registros].sort((a, b) => a.fecha.localeCompare(b.fecha));
  const fechas = ordenados.map((r) => r.fecha);
  const valoresCrudos = ordenados.map((r) => r.scoreEstres);

  const valores = interpolarFaltantes(valoresCrudos);

  return { fechas, valores };
}

function interpolarFaltantes(valores: number[]): number[] {
  const resultado = [...valores];
  for (let i = 0; i < resultado.length; i++) {
    if (Number.isNaN(resultado[i])) {
      // busca el anterior y siguiente valor válido
      let prev = i - 1;
      while (prev >= 0 && Number.isNaN(resultado[prev])) prev--;
      let next = i + 1;
      while (next < resultado.length && Number.isNaN(resultado[next])) next++;

      if (prev >= 0 && next < resultado.length) {
        const pasos = next - prev;
        const incremento = (resultado[next] - resultado[prev]) / pasos;
        resultado[i] = resultado[prev] + incremento * (i - prev);
      } else if (prev >= 0) {
        resultado[i] = resultado[prev];
      } else if (next < resultado.length) {
        resultado[i] = resultado[next];
      }
    }
  }
  return resultado;
}