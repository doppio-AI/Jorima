"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./risk-dashboard.module.css";
import AdminSidebarSimple from "@/app/components/admin-sidebar-simple";

type RiskLevel = "bajo" | "medio" | "alto" | "crítico";

type BuildingRisk = {
  edificio_id: number;
  edificio_nombre: string | null;
  riskScore: number;
  riskLevel: RiskLevel;
  probability: number;
  impact: number;
  trend: number;
  avgScoreRecent: number | null;
  probabilityBin: string;
  impactBin: string;
  neurona: {
    negativas_transformadas: number;
    z: number;
    probabilidad: number;
    alerta: boolean;
  };
  totals: {
    recentCount: number;
    prevCount: number;
    negCountRecent: number;
    negCountPrev: number;
  };
};

type AreaRisk = {
  encuesta_id: number;
  edificio_id: number | null;
  riskScore: number;
  riskLevel: RiskLevel;
  probability: number;
  impact: number;
  trend: number;
  avgScoreRecent: number | null;
};

type UserRisk = {
  edificio_id: number;
  usuario_alias: string;
  riskScore: number;
  riskLevel: RiskLevel;
  probability: number;
  impact: number;
  trend: number;
  avgScoreRecent: number | null;
};

type RiskApiResponse = {
  buildings: BuildingRisk[];
  areas: AreaRisk[];
  users: UserRisk[];
  window?: {   // 👈 ahora opcional (más seguro)
    recentDays: number;
    prevDays: number;
    recentStart: string;
    prevStart: string;
  };
};

const riskColors: Record<RiskLevel, string> = {
  bajo: "#16A34A",
  medio: "#F59E0B",
  alto: "#F97316",
  "crítico": "#DC2626",
};

const getEnvironmentLabel = (level: RiskLevel) => {
  switch (level) {
    case "bajo": return "Ambiente laboral estable";
    case "medio": return "Atención requerida";
    case "alto": return "Riesgo elevado";
    case "crítico": return "Riesgo crítico";
  }
};

export default function AmbienteDashboardPage() {
  const [data, setData] = useState<RiskApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBuildingId, setSelectedBuildingId] = useState<number | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/evaluar-ambiente", { cache: "no-store" });
        if (!res.ok) {
          const body = await res.json().catch(() => null);
          throw new Error(body?.error || "No se pudo cargar el riesgo");
        }

        const json = (await res.json()) as RiskApiResponse;
        setData(json);

        if (json.buildings?.length > 0) {
          setSelectedBuildingId(json.buildings[0].edificio_id);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error desconocido");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  // ✅ valores seguros para window
  const recentDays = data?.window?.recentDays ?? 30;
  const prevDays = data?.window?.prevDays ?? 30;

  const selectedBuilding = useMemo(() => {
    if (!data || selectedBuildingId == null) return null;
    return data.buildings.find((b) => b.edificio_id === selectedBuildingId) || null;
  }, [data, selectedBuildingId]);

  const areasForSelectedBuilding = useMemo(() => {
    if (!data || selectedBuildingId == null) return [];
    return data.areas
      .filter((a) => a.edificio_id === selectedBuildingId)
      .sort((a, b) => b.riskScore - a.riskScore);
  }, [data, selectedBuildingId]);

  const topUsersForSelectedBuilding = useMemo(() => {
    if (!data || selectedBuildingId == null) return [];
    return data.users
      .filter((u) => u.edificio_id === selectedBuildingId)
      .sort((a, b) => b.riskScore - a.riskScore)
      .slice(0, 5);
  }, [data, selectedBuildingId]);

  return (
    <div className="dashboard-container">
      <AdminSidebarSimple active="ambiente" />

      <main className="dashboard-main">
        <div className={styles.page}>
          <div className={styles.header}>
            <h1>Matriz de riesgo por edificio</h1>
            <p>
              Calculada con probabilidad (respuestas negativas), impacto (puntaje promedio)
              y neurona artificial. Ventana: últimos {recentDays} días vs. {prevDays} días previos.
            </p>
          </div>

          {loading && (
            <div className={styles.details}>
              <div style={{ textAlign: "center", padding: 40, color: "var(--neutral-500)" }}>
                Calculando matriz de riesgo...
              </div>
            </div>
          )}

          {error && (
            <div className={styles.details}>
              <p style={{ color: "#DC2626" }}>Error: {error}</p>
            </div>
          )}

          {data && (
            <>
              <div className={styles.grid}>
                {data.buildings?.map((b) => (
                  <div
                    key={b.edificio_id}
                    className={`${styles.card} ${selectedBuildingId === b.edificio_id ? styles.cardSelected : ""}`}
                    onClick={() => setSelectedBuildingId(b.edificio_id)}
                  >
                    <div className={styles.cardTop}>
                      <div className={styles.buildingName}>
                        {b.edificio_nombre || `Edificio ${b.edificio_id}`}
                      </div>
                      <div
                        className={styles.riskBadge}
                        style={{ background: riskColors[b.riskLevel] }}
                      >
                        {b.riskLevel}
                      </div>
                    </div>

                    <div className={styles.metricRow}>
                      <div className={styles.metricLabel}>
                        {getEnvironmentLabel(b.riskLevel)}
                      </div>
                      <div className={styles.metricValue}>
                        Riesgo: {(b.riskScore * 100).toFixed(1)}%
                      </div>
                      <div className={styles.metricValue} style={{ fontSize: "0.85rem", color: "var(--neutral-500)" }}>
                        Prob: {b.probabilityBin} · Impacto: {b.impactBin}
                      </div>

                      {b.neurona?.alerta && (   // 👈 también protegido
                        <div style={{ color: "#DC2626", fontSize: "0.8rem", fontWeight: 600, marginTop: 4 }}>
                          ⚠ Neurona: alerta activada
                        </div>
                      )}
                    </div>

                    <div style={{ marginTop: 8, fontSize: "0.8rem", color: "var(--neutral-500)" }}>
                      Respuestas: {b.totals?.recentCount ?? 0} recientes · {b.totals?.negCountRecent ?? 0} negativas
                    </div>
                  </div>
                ))}
              </div>

              {selectedBuilding && (
                <div className={styles.details}>
                  <div className={styles.detailsTitle}>
                    <h2>
                      {selectedBuilding.edificio_nombre || `Edificio ${selectedBuilding.edificio_id}`}
                    </h2>
                    <div
                      className={styles.riskBadge}
                      style={{ background: riskColors[selectedBuilding.riskLevel] }}
                    >
                      {selectedBuilding.riskLevel}
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
                    {[
                      { label: "Riesgo total", value: `${(selectedBuilding.riskScore * 100).toFixed(1)}%` },
                      { label: "Probabilidad", value: `${(selectedBuilding.probability * 100).toFixed(1)}%` },
                      { label: "Impacto", value: `${(selectedBuilding.impact * 100).toFixed(1)}%` },
                      { label: "Tendencia", value: `${selectedBuilding.trend >= 0 ? "+" : ""}${(selectedBuilding.trend * 100).toFixed(1)}%` },
                      { label: "Score promedio", value: selectedBuilding.avgScoreRecent != null ? selectedBuilding.avgScoreRecent.toFixed(2) : "—" },
                      { label: "Neurona (σ)", value: `${(selectedBuilding.neurona?.probabilidad ?? 0 * 100).toFixed(1)}%` },
                    ].map(({ label, value }) => (
                      <div key={label} style={{ background: "var(--neutral-100)", borderRadius: 12, padding: "12px 16px", border: "1px solid var(--neutral-300)" }}>
                        <div style={{ fontSize: "0.78rem", color: "var(--neutral-500)" }}>{label}</div>
                        <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--neutral-900)" }}>{value}</div>
                      </div>
                    ))}
                  </div>

                  <div className={styles.lists}>
                    <div className={styles.sublist}>
                      <h3>Áreas / Encuestas (por riesgo)</h3>
                      {areasForSelectedBuilding.length === 0 && (
                        <div style={{ color: "var(--neutral-500)" }}>Sin datos</div>
                      )}
                      {areasForSelectedBuilding.map((a) => (
                        <div key={a.encuesta_id} className={styles.row}>
                          <div className={styles.rowLeft}>
                            <div className={styles.rowTitle}>Encuesta #{a.encuesta_id}</div>
                            <div className={styles.rowMeta}>
                              Riesgo: {(a.riskScore * 100).toFixed(1)}%
                            </div>
                          </div>
                          <div
                            className={styles.riskBadge}
                            style={{ background: riskColors[a.riskLevel] }}
                          >
                            {a.riskLevel}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className={styles.sublist}>
                      <h3>Top usuarios (anonimizados)</h3>
                      {topUsersForSelectedBuilding.length === 0 && (
                        <div style={{ color: "var(--neutral-500)" }}>Sin datos</div>
                      )}
                      {topUsersForSelectedBuilding.map((u) => (
                        <div key={u.usuario_alias} className={styles.row}>
                          <div className={styles.rowLeft}>
                            <div className={styles.rowTitle}>{u.usuario_alias}</div>
                            <div className={styles.rowMeta}>
                              Negativas: {(u.probability * 100).toFixed(0)}%
                            </div>
                          </div>
                          <div
                            className={styles.riskBadge}
                            style={{ background: riskColors[u.riskLevel] }}
                          >
                            {u.riskLevel}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}