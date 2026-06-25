// app/test-modelo/page.tsx
"use client";

import { useState } from "react";
import { entrenarModeloTemporal, proyectar30Dias } from "@/lib/ml/modeloEstres";

// Serie sintética de prueba: 40 días de "estrés" simulado con ruido
function generarSerieSintetica(dias: number = 40): number[] {
  const serie: number[] = [];
  let base = 50;
  for (let i = 0; i < dias; i++) {
    base += (Math.random() - 0.5) * 8; // ruido
    base = Math.min(100, Math.max(0, base));
    serie.push(base);
  }
  return serie;
}

export default function TestModeloPage() {
  const [serie, setSerie] = useState<number[]>([]);
  const [proyeccion, setProyeccion] = useState<number[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ejecutarPrueba = async () => {
    setCargando(true);
    setError(null);
    try {
      const ventana = 5;
      const datos = generarSerieSintetica(40);
      setSerie(datos);

      const model = await entrenarModeloTemporal(datos, ventana);
      const ultimosValores = datos.slice(-ventana);
      const resultado = await proyectar30Dias(model, ultimosValores, ventana);

      setProyeccion(resultado);
      model.dispose();
    } catch (e: unknown) {
      const mensaje = e instanceof Error ? e.message : "Error desconocido al ejecutar el modelo.";
      setError(mensaje);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div style={{ padding: 24, fontFamily: "monospace" }}>
      <h1>Test - Modelo de Estrés (TF.js)</h1>
      <button onClick={ejecutarPrueba} disabled={cargando}>
        {cargando ? "Entrenando..." : "Ejecutar prueba"}
      </button>

      {error && <p style={{ color: "red" }}>Error: {error}</p>}

      {serie.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <h3>Serie histórica (sintética, {serie.length} días)</h3>
          <p>{serie.map((v) => v.toFixed(1)).join(", ")}</p>
        </div>
      )}

      {proyeccion.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <h3>Proyección 30 días</h3>
          <p>{proyeccion.map((v) => v.toFixed(1)).join(", ")}</p>
        </div>
      )}
    </div>
  );
}