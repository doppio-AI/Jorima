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
  prediccion: number;
  probabilidad: number;
  riesgo: string;
  alerta: boolean;
  estadisticas: {
    media: number;
    varianza: number;
    desviacion: number;
    pendiente: number;
    tendencia: "subiendo" | "bajando" | "estable";
    muestra: number;
    mae: number;
    rmse: number;
    confianza: number;
  } | null;
  interpretacion: {
    resumen: string;
    recomendaciones: string[];
    factores: {
      tendencia: number;
      volatilidad: number;
      consistencia: number;
    };
  } | null;
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

    void load();
  }, []);

  useEffect(() => {
    if (!selectedBuildingId) return;

    const loadPrediction = async () => {
      try {
        const res = await fetch(`/api/riesgo/prediccion/${selectedBuildingId}`);
        const json = await res.json();

        setPredData({
          historico: json?.historico || [],
          prediccion: typeof json?.prediccion === "number" ? json.prediccion : 0,
          probabilidad: typeof json?.probabilidad === "number" ? json.probabilidad : 0,
          riesgo: json?.riesgo || "sin datos",
          alerta: Boolean(json?.alerta),
          estadisticas: json?.estadisticas || null,
          interpretacion: json?.interpretacion || null,
        });
      } catch (error) {
        console.error("Error cargando predicción:", error);
        setPredData({
          historico: [],
          prediccion: 0,
          probabilidad: 0,
          riesgo: "sin datos",
          alerta: false,
          estadisticas: null,
          interpretacion: null,
        });
      }
    };

    void loadPrediction();
  }, [selectedBuildingId]);

  const selectedBuilding = useMemo(() => {
    return data.buildings.find((b) => b.edificio_id === selectedBuildingId);
  }, [data, selectedBuildingId]);

  const recommendationPreview = predData?.interpretacion?.recomendaciones?.slice(0, 3) ?? [];
  const remainingRecommendations =
    (predData?.interpretacion?.recomendaciones?.length ?? 0) - recommendationPreview.length;

  if (loading) {
    return <div style={{ padding: 40 }}>Cargando...</div>;
  }

  return (
    <div className="dashboard-container">
      <AdminSidebarSimple active="ambiente" />

      <main className={styles.page}>
        <div className={styles.header}>
          <h1>Ambiente Laboral Inteligente</h1>
          <p>Panel de riesgo con interpretación de modelo neuronal</p>
        </div>

        {data.buildings.length === 0 && (
          <div style={{ padding: 20, textAlign: "center", color: "var(--neutral-500)" }}>
            No hay edificios registrados
          </div>
        )}

        <div className={styles.grid}>
          {data.buildings.map((b) => {
            const prob = b.neurona?.probabilidad ?? 0;

            return (
              <button
                type="button"
                key={b.edificio_id}
                onClick={() => setSelectedBuildingId(b.edificio_id)}
                className={`${styles.card} ${selectedBuildingId === b.edificio_id ? styles.cardSelected : ""}`}
              >
                <div className={styles.cardTop}>
                  <span className={styles.buildingName}>{b.edificio_nombre || "Sin nombre"}</span>
                  <span className={styles.riskBadge} style={{ background: riskColors[b.riskLevel] || "#999" }}>
                    {b.riskLevel}
                  </span>
                </div>

                <div className={styles.metricRow}>
                  <span className={styles.metricLabel}>Prob. alerta</span>
                  <span className={styles.metricValue}>{(prob * 100).toFixed(1)}%</span>
                </div>
              </button>
            );
          })}
        </div>

        {selectedBuilding && (
          <div className={styles.details}>
            <div className={styles.detailsTitle}>
              <h2>{selectedBuilding.edificio_nombre}</h2>
              {predData?.alerta && <span className={styles.alertBadge}>Alerta activa</span>}
            </div>

            {!predData || predData.historico.length === 0 ? (
              <div style={{ padding: 20, textAlign: "center", color: "var(--neutral-500)" }}>
                No hay datos suficientes para entrenar el modelo
              </div>
            ) : (
              <>
                <div
                  className={`${styles.lists} ${
                    predData.estadisticas ? styles.listsWithStats : styles.listsNoStats
                  }`}
                >
                  <div className={styles.sublist}>
                    <h3>Resumen de riesgo</h3>
                    <div className={styles.row}>
                      <span>Probabilidad actual</span>
                      <span>{(selectedBuilding.neurona.probabilidad * 100).toFixed(1)}%</span>
                    </div>
                    <div className={styles.row}>
                      <span>Nivel actual</span>
                      <span className={styles.inlineBadge}>{selectedBuilding.riskLevel}</span>
                    </div>
                    <div className={styles.row}>
                      <span>Siguiente ventana</span>
                      <span>{predData.prediccion.toFixed(2)}</span>
                    </div>
                    <div className={styles.row}>
                      <span>Riesgo proyectado</span>
                      <span>{(predData.probabilidad * 100).toFixed(1)}%</span>
                    </div>
                    <div className={styles.row}>
                      <span>Nivel proyectado</span>
                      <span className={styles.inlineBadge}>{predData.riesgo}</span>
                    </div>
                  </div>

                  {predData.estadisticas && (
                    <div className={styles.sublist}>
                      <h3>Calidad del modelo</h3>
                      <div className={styles.row}>
                        <span>Muestra</span>
                        <span>{predData.estadisticas.muestra}</span>
                      </div>
                      <div className={styles.row}>
                        <span>Media</span>
                        <span>{predData.estadisticas.media.toFixed(2)}</span>
                      </div>
                      <div className={styles.row}>
                        <span>Desviación</span>
                        <span>{predData.estadisticas.desviacion.toFixed(3)}</span>
                      </div>
                      <div className={styles.row}>
                        <span>Tendencia</span>
                        <span>{predData.estadisticas.tendencia}</span>
                      </div>
                      <div className={styles.row}>
                        <span>Confianza</span>
                        <span>{(predData.estadisticas.confianza * 100).toFixed(1)}%</span>
                      </div>
                    </div>
                  )}

                  {predData.interpretacion && (
                    <div className={`${styles.sublist} ${styles.interpretationCard}`}>
                      <h3>Interpretación</h3>
                      <div className={styles.interpretation}>
                        <p>{predData.interpretacion.resumen}</p>

                        <div className={styles.factorGrid}>
                          <div className={styles.factorRow}>
                            <span>Tendencia</span>
                            <strong>{(predData.interpretacion.factores.tendencia * 100).toFixed(0)}%</strong>
                          </div>
                          <div className={styles.factorRow}>
                            <span>Volatilidad</span>
                            <strong>{(predData.interpretacion.factores.volatilidad * 100).toFixed(0)}%</strong>
                          </div>
                          <div className={styles.factorRow}>
                            <span>Consistencia</span>
                            <strong>{(predData.interpretacion.factores.consistencia * 100).toFixed(0)}%</strong>
                          </div>
                        </div>

                        <ul className={styles.recommendationList}>
                          {recommendationPreview.map((item, idx) => (
                            <li key={`${selectedBuilding.edificio_id}-${idx}`}>{item}</li>
                          ))}
                        </ul>
                        {remainingRecommendations > 0 && (
                          <span className={styles.moreHint}>
                            +{remainingRecommendations} recomendación(es) adicional(es)
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <RiskChart
                  historico={predData.historico}
                  prediccion={predData.prediccion}
                  media={predData.estadisticas?.media || null}
                />
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}