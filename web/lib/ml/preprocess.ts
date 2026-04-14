export const mapRespuesta = (valor: string): number => {
  const map: Record<string, number> = {
    "muy mal": 1,
    "mal": 2,
    "regular": 3,
    "bien": 4,
    "muy bien": 5,
  };

  return map[valor.toLowerCase()] || 3;
};

// 🔥 Agrupar por día
export const agruparPorDia = (respuestas: any[]) => {
  const dias: Record<string, number[]> = {};

  respuestas.forEach((r) => {
    const fecha = new Date(r.fecha).toISOString().split("T")[0];

    if (!dias[fecha]) dias[fecha] = [];

    const values = Object.values(r.respuestas);
    values.forEach((v: any) => {
      dias[fecha].push(mapRespuesta(String(v)));
    });
  });

  return dias;
};

export const promediosDiarios = (dias: Record<string, number[]>) => {
  return Object.entries(dias).map(([fecha, valores]) => ({
    fecha,
    promedio:
      valores.reduce((a, b) => a + b, 0) / valores.length,
  }));
};

export const calcularRiesgo = (promedio: number) => {
  return 1 - promedio / 5;
};