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
        // Obtener tipo_usuario del localStorage
        const userSession = localStorage.getItem("userSession");
        const tipoUsuario = userSession ? JSON.parse(userSession).tipo_usuario : null;

        const response = await fetch("/api/admin/stats", {
          headers: {
            "x-tipo-usuario": tipoUsuario?.toString() || "",
          },
        });
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
      {/* KPIs principales */}
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
          <div className={styles.kpiLabel}>Respuestas Obtenidas</div>
        </div>
      </div>

      {/* Gráficos */}
      <div className={styles.chartsGrid}>
        {/* Usuarios por edificio */}
        <div className={styles.chartCard}>
          <h3>Usuarios por Edificio</h3>
          <div className={styles.chartContent}>
            {stats.usuariosPorEdificio.length > 0 ? (
              stats.usuariosPorEdificio.map((item) => (
                <div key={item.nombre} className={styles.barItem}>
                  <div className={styles.barLabel}>{item.nombre}</div>
                  <div className={styles.barContainer}>
                    <div
                      className={styles.bar}
                      style={{
                        width: `${(item.count / stats.totalUsuarios) * 100}%`,
                      }}
                    >
                      {item.count}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className={styles.noData}>Sin datos</p>
            )}
          </div>
        </div>

        {/* Distribución de turnos */}
        <div className={styles.chartCard}>
          <h3>Distribución de Turnos</h3>
          <div className={styles.chartContent}>
            {stats.distribucionTurnos.length > 0 ? (
              stats.distribucionTurnos.map((item) => (
                <div key={item.turno} className={styles.pieItem}>
                  <div className={styles.pieBall} />
                  <span>{item.turno}: {item.count} usuarios</span>
                </div>
              ))
            ) : (
              <p className={styles.noData}>Sin datos de turnos</p>
            )}
          </div>
        </div>

        {/* Moods anonymos */}
        <div className={styles.chartCard}>
          <h3>Estado de Ánimo (Anónimo)</h3>
          <div className={styles.chartContent}>
            {stats.distribucionMood.length > 0 ? (
              stats.distribucionMood.map((item) => (
                <div key={item.mood} className={styles.moodItem}>
                  <div className={styles.moodLabel}>{item.mood}</div>
                  <div className={styles.moodBar}>
                    <div
                      className={styles.moodFill}
                      style={{
                        width: `${(item.count / stats.totalRespuestas) * 100 || 0}%`,
                      }}
                    />
                  </div>
                  <span className={styles.moodCount}>{item.count}</span>
                </div>
              ))
            ) : (
              <p className={styles.noData}>Sin datos de moods</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
