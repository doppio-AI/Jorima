"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Usuario {
  id: number;
  nombre: string;
  correo: string;
  rol: string;
}

export default function AdminUsuarios() {

  const router = useRouter();

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [busqueda, setBusqueda] = useState("");

  useEffect(() => {
    fetch("/api/usuarios")
      .then((res) => res.json())
      .then((data) => setUsuarios(data));
  }, []);

  const usuariosFiltrados = usuarios.filter((u) =>
    u.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );


  const handleLogout = () => {

    document.cookie =
      "usuario_public=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";

    router.push("/");

  };

  return (
    <div className="dashboard-container">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div>
          <div className="sidebar-logo">Admin</div>
          <nav>
            <a className="sidebar-link active">Usuarios</a>
            <a className="sidebar-link">Reportes</a>
            <a className="sidebar-link">Configuración</a>
          </nav>
        </div>

        {/* LOGOUT */}
        <div className="logout" onClick={handleLogout} style={{ cursor: "pointer" }}>
          Cerrar sesión
        </div>
      </aside>

      {/* MAIN */}
      <main className="dashboard-main">
        <div className="dashboard-header">
          <h1>Panel de Administrador</h1>
          <p>Gestión de usuarios del sistema</p>
        </div>

        {/* BUSCADOR */}
        <div className="chat-card">
          <div className="form-group">
            <label>Buscar usuario</label>
            <input
              type="text"
              placeholder="Buscar por nombre..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
        </div>

        {/* LISTA DE USUARIOS */}
        <div className="chat-card">
          <div className="chat-header">
            <strong>Usuarios registrados</strong>
          </div>

          <div className="historial-container">
            {usuariosFiltrados.map((user) => (
              <div key={user.id} className="historial-card">
                <div className="historial-card-header">
                  <div className="historial-card-left">
                    <div className="historial-card-info">
                      <strong>{user.nombre}</strong>
                      <span className="historial-card-meta">
                        {user.correo}
                      </span>
                    </div>
                  </div>

                  <div className="historial-card-right">
                    {user.rol}
                  </div>
                </div>

                <div style={{ padding: "16px", display: "flex", gap: "8px" }}>
                  <button className="btn-primary">Editar</button>
                  <button className="btn-volver">Eliminar</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ACCIONES */}
        <div className="chat-card">
          <div className="chat-header">
            <strong>Acciones rápidas</strong>
          </div>

          <button className="btn-primary">Agregar usuario</button>
        </div>
      </main>
    </div>
  );
}