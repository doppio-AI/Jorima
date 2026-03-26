"use client";

import { useEffect, useState, useRef } from "react";
import styles from "./admin-stats.module.css";

interface StatsData {
  totalUsuarios: number;
  usuariosPorEdificio: { nombre: string; count: number }[];
  distribucionTurnos: { turno: string; count: number }[];
  distribucionMood: { mood: string; count: number }[];
  totalEncuestas: number;
  totalRespuestas: number;
  usuariosActivos: number;
  usuariosInactivos: number;
}

export default function AdminStats() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasRunRef = useRef(false);

  useEffect(() => {
    if (hasRunRef.current) return;
    hasRunRef.current = true;

    const fetchStats = async () => {
      try {
        const response = await fetch("/api/admin/stats");
        if (!response.ok) {
          throw new Error("Error obteniendo estadísticas");
        }
        const data = await response.json();
        setStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) return <div className={styles.loading}>Cargando estadísticas...</div>;
  if (error) return <div className={styles.error}>Error: {error}</div>;
  if (!stats) return <div className={styles.error}>Sin datos disponibles</div>;

  return (
    <div className={styles.statsContainer}>
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiValue}>{stats.totalUsuarios}</div>
          <div className={styles.kpiLabel}>Usuarios Totales</div>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiValue}>{stats.usuariosActivos}</div>
          <div className={styles.kpiLabel}>Usuarios Activos</div>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiValue}>{stats.totalEncuestas}</div>
          <div className={styles.kpiLabel}>Encuestas Creadas</div>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiValue}>{stats.totalRespuestas}</div>
          <div className={styles.kpiLabel}>Respuestas Totales</div>
        </div>
      </div>

      <div className={styles.chartsGrid}>
        <div className={styles.chartCard}>
          <h4>Usuarios por edificio</h4>
          {stats.usuariosPorEdificio.map((item) => (
            <div key={item.nombre} className={styles.barRow}>
              <span className={styles.barLabel}>{item.nombre}</span>
              <div className={styles.barTrack}>
                <div
                  className={styles.barFill}
                  style={{
                    width: `${Math.min(100, (item.count / stats.totalUsuarios) * 100)}%`,
                  }}
                />
              </div>
              <span className={styles.barValue}>{item.count}</span>
            </div>
          ))}
        </div>

        <div className={styles.chartCard}>
          <h4>Distribución de turnos</h4>
          {stats.distribucionTurnos.map((item) => (
            <div key={item.turno} className={styles.barRow}>
              <span className={styles.barLabel}>{item.turno}</span>
              <div className={styles.barTrack}>
                <div
                  className={styles.barFill}
                  style={{
                    width: `${Math.min(100, (item.count / stats.totalUsuarios) * 100)}%`,
                    background: "var(--color-verde-turquesa)",
                  }}
                />
              </div>
              <span className={styles.barValue}>{item.count}</span>
            </div>
          ))}
        </div>

        <div className={styles.chartCard}>
          <h4>Distribución de mood</h4>
          {stats.distribucionMood.slice(0, 6).map((item) => (
            <div key={item.mood} className={styles.barRow}>
              <span className={styles.barLabel}>{item.mood}</span>
              <div className={styles.barTrack}>
                <div
                  className={styles.barFill}
                  style={{
                    width: `${Math.min(100, (item.count / stats.totalRespuestas) * 100)}%`,
                    background: "#F59E0B",
                  }}
                />
              </div>
              <span className={styles.barValue}>{item.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
