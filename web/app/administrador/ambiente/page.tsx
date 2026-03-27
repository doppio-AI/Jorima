"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./risk-dashboard.module.css";
import AdminSidebarSimple from "@/app/components/admin-sidebar-simple";
import RiskChart from "@/app/components/RiskChart";

type RiskLevel = "bajo" | "medio" | "alto" | "crítico";

type BuildingRisk = {
  edificio_id: number;
  edificio_nombre: string | null;
  riskScore: number;
  riskLevel: RiskLevel;
  neurona: {
    probabilidad: number;
    alerta: boolean;
  };
};

type RiskApiResponse = {
  buildings: BuildingRisk[];
};

type PredData = {
  historico: number[];
  prediccion: number | null;
};

const riskColors: Record<RiskLevel, string> = {
  bajo: "#16A34A",
  medio: "#F59E0B",
  alto: "#F97316",
  "crítico": "#DC2626",
};

export default function AmbienteDashboardPage() {
  const [data, setData] = useState<RiskApiResponse>({ buildings: [] });
  const [predData, setPredData] = useState<PredData | null>(null);
  const [selectedBuildingId, setSelectedBuildingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  // =========================
  // CARGAR EDIFICIOS
  // =========================
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/riesgo");
        const json = await res.json();

        const safeBuildings: BuildingRisk[] = json?.buildings || [];

        setData({ buildings: safeBuildings });

        if (safeBuildings.length > 0) {
          setSelectedBuildingId(safeBuildings[0].edificio_id);
        }
      } catch (error) {
        console.error("Error cargando riesgos:", error);
        setData({ buildings: [] });
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  // =========================
  // CARGAR PREDICCIÓN
  // =========================
  useEffect(() => {
    if (!selectedBuildingId) return;

    const loadPrediction = async () => {
      try {
        const res = await fetch(`/api/riesgo/prediccion/${selectedBuildingId}`);
        const json = await res.json();

        setPredData({
          historico: json?.historico || [],
          prediccion: typeof json?.prediccion === "number" ? json.prediccion : null,
        });
      } catch (error) {
        console.error("Error cargando predicción:", error);
        setPredData({
          historico: [],
          prediccion: null,
        });
      }
    };

    loadPrediction();
  }, [selectedBuildingId]);

  // =========================
  // EDIFICIO SELECCIONADO
  // =========================
  const selectedBuilding = useMemo(() => {
    return data.buildings.find(
      (b) => b.edificio_id === selectedBuildingId
    );
  }, [data, selectedBuildingId]);

  // =========================
  // ESTADÍSTICA
  // =========================
  const stats = useMemo(() => {
    if (!predData?.historico || predData.historico.length === 0) return null;

    const data = predData.historico;
    const n = data.length;

    const media = data.reduce((a, b) => a + b, 0) / n;

    const varianza =
      data.reduce((acc, val) => acc + Math.pow(val - media, 2), 0) / n;

    const desviacion = Math.sqrt(varianza);

    const first = data[0];
    const last = data[data.length - 1];

    let tendencia: "subiendo" | "bajando" | "estable" = "estable";
    if (last > first) tendencia = "subiendo";
    if (last < first) tendencia = "bajando";

    return { media, varianza, desviacion, tendencia, n };
  }, [predData]);

  // =========================
  // LOADING
  // =========================
  if (loading) {
    return <div style={{ padding: 40 }}>Cargando...</div>;
  }

  return (
    <div className="dashboard-container">
      <AdminSidebarSimple active="ambiente" />

      <main className={styles.page}>
        <div className={styles.header}>
          <h1>Matriz de Riesgo</h1>
          <p>Monitoreo por edificio</p>
        </div>

        {data.buildings.length === 0 && (
          <div style={{ padding: 20, textAlign: "center", color: "#666" }}>
            No hay edificios registrados
          </div>
        )}

        {/* ========================= */}
        {/* LISTA */}
        {/* ========================= */}
        <div className={styles.grid}>
          {data.buildings.map((b) => {
            const riskScore = b.riskScore ?? 0;
            const prob = b.neurona?.probabilidad ?? 0;

            return (
              <div
                key={b.edificio_id}
                onClick={() => setSelectedBuildingId(b.edificio_id)}
                className={`${styles.card} ${
                  selectedBuildingId === b.edificio_id
                    ? styles.cardSelected
                    : ""
                }`}
              >
                <div className={styles.cardTop}>
                  <span className={styles.buildingName}>
                    {b.edificio_nombre || "Sin nombre"}
                  </span>

                  <span
                    className={styles.riskBadge}
                    style={{
                      background: riskColors[b.riskLevel] || "#999",
                    }}
                  >
                    {b.riskLevel}
                  </span>
                </div>

                <div className={styles.metricRow}>
                  <span>Riesgo</span>
                  <span>{(riskScore * 100).toFixed(1)}%</span>
                </div>

                <div className={styles.metricRow}>
                  <span>Probabilidad</span>
                  <span>{(prob * 100).toFixed(1)}%</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* ========================= */}
        {/* DETALLE */}
        {/* ========================= */}
        {selectedBuilding && (
          <div className={styles.details}>
            <h2>{selectedBuilding.edificio_nombre}</h2>

            {!predData || predData.historico.length === 0 ? (
              <div style={{ padding: 20, textAlign: "center", color: "#666" }}>
                No hay datos suficientes
              </div>
            ) : (
              <>
                <div className={styles.lists}>
                  {/* ACTUAL */}
                  <div className={styles.sublist}>
                    <h3>Actual</h3>

                    <div className={styles.row}>
                      <span>Riesgo</span>
                      <span>{(selectedBuilding.riskScore * 100).toFixed(1)}%</span>
                    </div>

                    <div className={styles.row}>
                      <span>Probabilidad</span>
                      <span>
                        {(selectedBuilding.neurona.probabilidad * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  {/* PREDICCIÓN */}
                  <div className={styles.sublist}>
                    <h3>Predicción</h3>

                    <div className={styles.row}>
                      <span>Futuro</span>
                      <span>
                        {predData.prediccion !== null
                          ? predData.prediccion.toFixed(2)
                          : "Sin datos"}
                      </span>
                    </div>
                  </div>

                  {/* ESTADÍSTICA */}
                  <div className={styles.sublist}>
                    <h3>Estadística</h3>

                    {stats && (
                      <>
                        <div className={styles.row}>
                          <span>Muestra</span>
                          <span>{stats.n}</span>
                        </div>

                        <div className={styles.row}>
                          <span>Media</span>
                          <span>{stats.media.toFixed(2)}</span>
                        </div>

                        <div className={styles.row}>
                          <span>Varianza</span>
                          <span>{stats.varianza.toFixed(3)}</span>
                        </div>

                        <div className={styles.row}>
                          <span>Desviación</span>
                          <span>{stats.desviacion.toFixed(3)}</span>
                        </div>

                        <div className={styles.row}>
                          <span>Tendencia</span>
                          <span>{stats.tendencia}</span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* INTERPRETACIÓN */}
                  <div className={styles.sublist}>
                    <h3>Interpretación</h3>

                    {stats && (
                      <div style={{ fontSize: 14 }}>
                        {stats.media > 3.5 && "Condiciones buenas. "}
                        {stats.media <= 3.5 && stats.media > 2 && "Condiciones regulares. "}
                        {stats.media <= 2 && "Condiciones críticas. "}

                        {stats.desviacion > 1 && "Alta variabilidad. "}
                        {stats.desviacion <= 1 && "Sistema estable. "}

                        {stats.tendencia === "subiendo" && "Tendencia positiva."}
                        {stats.tendencia === "bajando" && "Tendencia negativa."}
                      </div>
                    )}
                  </div>
                </div>

                {/* GRÁFICA */}
                <RiskChart
                  historico={predData.historico}
                  prediccion={predData.prediccion}
                  media={stats?.media || null}
                />
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}