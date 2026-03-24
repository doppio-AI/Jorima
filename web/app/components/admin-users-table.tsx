"use client";

import { useEffect, useState, useRef } from "react";
import styles from "./admin-users-table.module.css";

interface UserRecord {
  id: number;
  edificio: string;
  turno: string;
  estado: "activo" | "inactivo";
  ultimaActividad: string;
}

export default function AdminUsersTable() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtroEdificio, setFiltroEdificio] = useState("todos");
  const [filtroTurno, setFiltroTurno] = useState("todos");
  const hasRunRef = useRef(false);

  useEffect(() => {
    if (hasRunRef.current) return;
    hasRunRef.current = true;

    const fetchUsers = async () => {
      try {
        const userSession = localStorage.getItem("userSession");
        const tipoUsuario = userSession ? JSON.parse(userSession).tipo_usuario : null;

        const response = await fetch("/api/admin/users", {
          headers: {
            "x-tipo-usuario": tipoUsuario?.toString() || "",
          },
        });

        if (!response.ok) {
          throw new Error("Error obteniendo usuarios");
        }

        const data = await response.json();
        setUsers(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const edificios = [...new Set(users.map((u) => u.edificio))];
  const turnos = [...new Set(users.map((u) => u.turno).filter(Boolean))];

  const usersFiltrados = users.filter((user) => {
    const matchEdificio = filtroEdificio === "todos" || user.edificio === filtroEdificio;
    const matchTurno = filtroTurno === "todos" || user.turno === filtroTurno;
    return matchEdificio && matchTurno;
  });

  if (loading) return <div className={styles.loading}>Cargando usuarios...</div>;
  if (error) return <div className={styles.error}>Error: {error}</div>;

  return (
    <div className={styles.container}>
      <div className={styles.filters}>
        <select
          value={filtroEdificio}
          onChange={(e) => setFiltroEdificio(e.target.value)}
          className={styles.filterSelect}
        >
          <option value="todos">Todos los edificios</option>
          {edificios.map((ed) => (
            <option key={ed} value={ed}>
              {ed}
            </option>
          ))}
        </select>

        <select
          value={filtroTurno}
          onChange={(e) => setFiltroTurno(e.target.value)}
          className={styles.filterSelect}
        >
          <option value="todos">Todos los turnos</option>
          {turnos.map((turno) => (
            <option key={turno} value={turno}>
              {turno}
            </option>
          ))}
        </select>

        <div className={styles.resultCount}>
          Mostrando {usersFiltrados.length} de {users.length} usuarios
        </div>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>ID Anónimo</th>
              <th>Edificio</th>
              <th>Turno</th>
              <th>Estado</th>
              <th>Última Actividad</th>
            </tr>
          </thead>
          <tbody>
            {usersFiltrados.map((user) => (
              <tr key={user.id} className={styles[`status-${user.estado}`]}>
                <td>USR-{String(user.id).padStart(5, "0")}</td>
                <td>{user.edificio}</td>
                <td>{user.turno || "Sin turno"}</td>
                <td>
                  <span className={`${styles.badge} ${styles[`badge-${user.estado}`]}`}>
                    {user.estado === "activo" ? "✓ Activo" : "○ Inactivo"}
                  </span>
                </td>
                <td>{user.ultimaActividad}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
