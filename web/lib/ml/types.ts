export type Cargo = "Administrativo" | "Docente";

export interface PreguntaCuestionario {
  id: string;
  texto: string;
  // peso opcional: algunas preguntas pesan más en el cálculo de estrés
  peso?: number; // default 1
  // categoría útil para análisis posterior (carga laboral, relaciones, autonomía, etc.)
  categoria?: string;
}

export interface RespuestaLikert {
  preguntaId: string;
  valor: 1 | 2 | 3 | 4 | 5; // escala Likert
  fecha: string; 
}

// Banco fijo de 15 preguntas por cargo (cuestionario inicial)
export const BANCO_INICIAL: Record<Cargo, PreguntaCuestionario[]> = {
  Administrativo: [
    { id: "adm_01", texto: "Siento que mi carga de trabajo es manejable", peso: 1, categoria: "carga" },
    { id: "adm_02", texto: "Tengo claridad sobre mis responsabilidades", peso: 1, categoria: "claridad_rol" },
    // ... hasta 15
  ],
  Docente: [
    { id: "ope_01", texto: "Mi entorno de trabajo me permite concentrarme", peso: 1, categoria: "ambiente" },
    // ... hasta 15
  ],
};

// Banco amplio para seguimiento (se eligen 3 al azar, 3 veces por semana)
export const BANCO_SEGUIMIENTO: PreguntaCuestionario[] = [
  { id: "seg_01", texto: "Hoy sentí ansiedad relacionada al trabajo", peso: 1.2, categoria: "emocional" },
  { id: "seg_02", texto: "Dormí bien anoche", peso: 1, categoria: "fisico" },
  { id: "seg_03", texto: "Sentí que tuve apoyo de mi equipo", peso: -1, categoria: "social" }, // peso negativo = reduce estrés
  // ... banco amplio, ej. 30-50 preguntas
];

export interface RegistroDiario {
  fecha: string;
  origen: "inicial" | "seguimiento";
  respuestas: RespuestaLikert[];
  scoreEstres: number; // calculado, 0-100
}