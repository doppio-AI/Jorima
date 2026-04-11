"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminSidebarSimple from "@/app/components/admin-sidebar-simple";

interface Usuario {
  id: number;
  nombre: string;
  correo: string;
  tipo_usuario: number;
  edificio_id?: number;
  turno?: string;
} 

type UsuarioApi = {
  usuario_id: number;
  nombre: string;
  correo: string;
  tipo_usuario: number;
  edificio_id: number;
  turno: string | null;
};

type Filtro = "todos" | "usuario" | "admin";

type FormData = {
  nombre: string;
  correo: string;
  contrasena: string;
  rol: "usuario" | "admin";
  edificio_id: number;
  turno: string;
};

export default function AdminUsuarios() {
  const router = useRouter();

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Usuario | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState<FormData>({
    nombre: "",
    correo: "",
    contrasena: "",
    rol: "usuario",
    edificio_id: 1,
    turno: "",
  });

  const fetchUsuarios = async () => {
    try {
      const res = await fetch("/api/usuarios");
      const data = await res.json();
      if (!Array.isArray(data)) return;
      
      setUsuarios(
        (data as UsuarioApi[]).map((u) => ({
          id: u.usuario_id,
          nombre: u.nombre,
          correo: u.correo,
          tipo_usuario: u.tipo_usuario,
          edificio_id: u.edificio_id,
          turno: u.turno ?? "",
        }))
      );
    } catch (error) {
      console.error("Error al obtener usuarios:", error);
    }
  };

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/login", {
        method: "DELETE",
        credentials: "same-origin",
      });
    } finally {
      document.cookie = "usuario_public=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      router.push("/");
      router.refresh();
    }
  };

  const getRolTexto = (tipo: number) => (tipo === 1 ? "admin" : "usuario");

  const usuariosFiltrados = usuarios
    .filter((u) => (filtro === "todos" ? true : getRolTexto(u.tipo_usuario) === filtro))
    .filter((u) => u.nombre.toLowerCase().includes(busqueda.toLowerCase()));

  const handleSave = async () => {
    const tipo_usuario = form.rol === "admin" ? 1 : 2;

    const body: any = {
      nombre: form.nombre,
      correo: form.correo,
      tipo_usuario,
      edificio_id: form.edificio_id,
      turno: form.turno,
    };

    if (form.contrasena) body.contrasena = form.contrasena;

    try {
      const url = selectedUser ? `/api/usuarios/${selectedUser.id}` : "/api/usuarios";
      const method = selectedUser ? "PUT" : "POST";

      await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      resetForm();
      fetchUsuarios();
    } catch (error) {
      console.error("Error al guardar:", error);
    }
  };

  const handleDelete = async () => {
    if (!selectedUser) return;
    try {
      await fetch(`/api/usuarios/${selectedUser.id}`, { method: "DELETE" });
      setDeleteOpen(false);
      setSelectedUser(null);
      fetchUsuarios();
    } catch (error) {
      console.error("Error al eliminar:", error);
    }
  };

  const handleEdit = (user: Usuario) => {
    setSelectedUser(user);
    setForm({
      nombre: user.nombre,
      correo: user.correo,
      contrasena: "",
      rol: getRolTexto(user.tipo_usuario) as "usuario" | "admin",
      edificio_id: user.edificio_id || 1,
      turno: user.turno || "",
    });
    setShowForm(true);
  };

  const handleCreate = () => {
    setSelectedUser(null);
    resetForm();
    setShowForm(true);
  };

  const resetForm = () => {
    setShowForm(false);
    setSelectedUser(null);
    setForm({ nombre: "", correo: "", contrasena: "", rol: "usuario", edificio_id: 1, turno: "" });
  };

  return (
    <div className="dashboard-container">
      <AdminSidebarSimple active="usuarios" onLogout={handleLogout} />

      <main className="dashboard-main">
        <div className="dashboard-header">
          <div className="admin-page-intro">
            <h1>Gestión de Usuarios</h1>
            <p>
              Administra los usuarios del sistema
            </p>
          </div>
          <div className="admin-toolbar">
            <button className="btn-primary" onClick={handleCreate}>
              + Nuevo usuario
            </button>
          </div>
        </div>

        <div className="filters admin-filterbar">
          <input
            className="search-input"
            type="text"
            placeholder="Buscar por nombre..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
          <select
            className="filter-select"
            value={filtro}
            onChange={(e) => setFiltro(e.target.value as Filtro)}
          >
            <option value="todos">Todos los roles</option>
            <option value="usuario">Usuarios</option>
            <option value="admin">Administradores</option>
          </select>
        </div>

        <div className="table-wrapper">
          <table className="users-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Correo</th>
                <th>Rol</th>
                <th>Edificio ID</th>
                <th>Turno</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuariosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", color: "var(--neutral-500)", padding: 32 }}>
                    No hay usuarios que coincidan
                  </td>
                </tr>
              ) : (
                usuariosFiltrados.map((u) => (
                  <tr key={u.id}>
                    <td>{u.nombre}</td>
                    <td>{u.correo}</td>
                    <td>
                      <span
                        className={`admin-status-badge ${u.tipo_usuario === 1 ? "is-admin" : "is-user"}`}
                      >
                        {getRolTexto(u.tipo_usuario)}
                      </span>
                    </td>
                    <td>{u.edificio_id ?? "—"}</td>
                    <td>{u.turno || "—"}</td>
                    <td>
                      <div className="admin-actions">
                        <button
                          className="btn-volver"
                          style={{ padding: "6px 12px", fontSize: "0.85rem" }}
                          onClick={() => handleEdit(u)}
                        >
                          Editar
                        </button>
                        <button
                          className="btn-danger"
                          onClick={() => { setSelectedUser(u); setDeleteOpen(true); }}
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* --- MODALES Y DRAWERS (Sin cambios mayores, solo correcciones de sintaxis menor) --- */}
        {showForm && (
          <div className="drawer-overlay" onClick={resetForm}>
            <div className="drawer" onClick={(e) => e.stopPropagation()}>
              <div className="drawer-header">
                <h3>{selectedUser ? "Editar usuario" : "Nuevo usuario"}</h3>
                <button className="drawer-close" onClick={resetForm}>✕</button>
              </div>

              <div className="drawer-body">
                <div className="form-group">
                  <label>Nombre</label>
                  <input
                    type="text"
                    value={form.nombre}
                    onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))}
                    placeholder="Nombre completo"
                  />
                </div>

                <div className="form-group">
                  <label>Correo</label>
                  <input
                    type="email"
                    value={form.correo}
                    onChange={(e) => setForm((p) => ({ ...p, correo: e.target.value }))}
                    placeholder="correo@ejemplo.com"
                  />
                </div>

                <div className="form-group">
                  <label>Contraseña {selectedUser && "(dejar vacío para no cambiar)"}</label>
                  <input
                    type="password"
                    value={form.contrasena}
                    onChange={(e) => setForm((p) => ({ ...p, contrasena: e.target.value }))}
                    placeholder="••••••••"
                  />
                </div>

                <div className="form-group">
                  <label>Rol</label>
                  <select
                    value={form.rol}
                    onChange={(e) => setForm((p) => ({ ...p, rol: e.target.value as "usuario" | "admin" }))}
                  >
                    <option value="usuario">Usuario</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Edificio ID</label>
                  <input
                    type="number"
                    value={form.edificio_id}
                    onChange={(e) => setForm((p) => ({ ...p, edificio_id: Number(e.target.value) }))}
                    min={1}
                  />
                </div>

                <div className="form-group">
                  <label>Turno</label>
                  <input
                    type="text"
                    value={form.turno}
                    onChange={(e) => setForm((p) => ({ ...p, turno: e.target.value }))}
                    placeholder="Matutino, Vespertino..."
                  />
                </div>
              </div>

              <div className="drawer-footer">
                <button className="btn-volver" onClick={resetForm}>Cancelar</button>
                <button className="btn-primary" onClick={handleSave}>Guardar</button>
              </div>
            </div>
          </div>
        )}

        {deleteOpen && (
          <div className="modal">
            <div className="modal-content">
              <h3>Confirmar eliminación</h3>
              <p>¿Estás seguro de que deseas eliminar a <strong>{selectedUser?.nombre}</strong>? Esta acción no se puede deshacer.</p>
              <div className="admin-actions" style={{ justifyContent: "flex-end", marginTop: 20 }}>
                <button className="btn-volver" onClick={() => setDeleteOpen(false)}>Cancelar</button>
                <button
                  className="btn-danger"
                  onClick={handleDelete}
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}