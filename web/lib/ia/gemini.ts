import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import {
  SYSTEM_PROMPT,
  TAXONOMIA_CATEGORIAS,
  NIVELES_RIESGO,
  type ClasificacionGemini,
} from "./prompt";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  // No lanzar en el import top-level en build time de Next; validar en uso.
  console.warn("GEMINI_API_KEY no está configurada.");
}

const genAI = new GoogleGenerativeAI(apiKey ?? "");

const responseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    respuesta: { type: SchemaType.STRING },
    sentimiento: {
      type: SchemaType.STRING,
      enum: ["positivo", "neutral", "negativo"],
    },
    categoria: {
      type: SchemaType.STRING,
      enum: [...TAXONOMIA_CATEGORIAS],
    },
    riesgo: {
      type: SchemaType.STRING,
      enum: [...NIVELES_RIESGO],
    },
    resumen_riesgo: { type: SchemaType.STRING },
  },
  required: ["respuesta", "sentimiento", "categoria", "riesgo", "resumen_riesgo"],
} as const;

const model = genAI.getGenerativeModel({
  model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
  systemInstruction: SYSTEM_PROMPT,
  generationConfig: {
    temperature: 0.4,
    responseMimeType: "application/json",
    // @ts-expect-error -- responseSchema acepta el objeto construido arriba
    responseSchema,
  },
});

export interface HistorialTurno {
  role: "user" | "assistant";
  texto: string;
}

/**
 * Palabras de respaldo para no depender únicamente de la clasificación del
 * modelo (README §7.3 y §17: "no confiar únicamente en" un solo mecanismo).
 * Si el modelo falla o el JSON no puede parsearse, este filtro simple evita
 * que una señal de crisis se pierda silenciosamente. NO reemplaza al modelo,
 * solo evita que un error técnico oculte una señal grave.
 */
const SENIALES_CRISIS_RESPALDO = [
  "suicid",
  "quitarme la vida",
  "no quiero vivir",
  "autolesion",
  "autolesión",
  "hacerme daño",
  "lastimarme",
];

function clasificacionDeEmergencia(mensajeUsuario: string): ClasificacionGemini {
  const texto = mensajeUsuario.toLowerCase();
  const posibleCrisis = SENIALES_CRISIS_RESPALDO.some((s) => texto.includes(s));

  return {
    respuesta:
      "Gracias por compartir esto conmigo. En este momento tuve un problema " +
      "técnico para procesar tu mensaje con el detalle que merece. Si sientes " +
      "que necesitas ayuda urgente, por favor contacta a los servicios de " +
      "emergencia o a la línea de apoyo institucional. Si no es urgente, " +
      "intenta escribirme de nuevo en un momento.",
    sentimiento: "neutral",
    categoria: "otro",
    riesgo: posibleCrisis ? "crisis" : "medio",
    resumen_riesgo: posibleCrisis
      ? "Fallo técnico en clasificación; el filtro de respaldo detectó posibles señales de crisis. Revisar manualmente."
      : "Fallo técnico en clasificación automática. Revisar manualmente por precaución.",
  };
}

export async function generarRespuestaJorima(
  mensajeUsuario: string,
  historial: HistorialTurno[]
): Promise<ClasificacionGemini> {
  try {
    const chat = model.startChat({
      history: historial.map((h) => ({
        role: h.role === "assistant" ? "model" : "user",
        parts: [{ text: h.texto }],
      })),
    });

    const result = await chat.sendMessage(mensajeUsuario);
    const raw = result.response.text();

    const parsed = JSON.parse(raw) as ClasificacionGemini;

    // Validación defensiva: nunca confiar ciegamente en el JSON del modelo.
    if (
      !parsed.respuesta ||
      !NIVELES_RIESGO.includes(parsed.riesgo) ||
      !TAXONOMIA_CATEGORIAS.includes(parsed.categoria)
    ) {
      throw new Error("Respuesta de Gemini con forma inesperada");
    }

    return parsed;
  } catch (error) {
    console.error("Error al generar respuesta con Gemini:", error);
    return clasificacionDeEmergencia(mensajeUsuario);
  }
}
