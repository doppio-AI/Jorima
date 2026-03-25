"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Usuario {
  id: number;
  nombre: string;
  correo: string;
  tipo_usuario: number;
  edificio_id?: number;
  turno?: string;
}

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
    const res = await fetch("/api/usuarios");
    const data = await res.json();

    setUsuarios(
      data.map((u: any) => ({
        id: u.usuario_id,
        nombre: u.nombre,
        correo: u.correo,
        tipo_usuario: u.tipo_usuario,
        edificio_id: u.edificio_id,
        turno: u.turno,
      }))
    );
  };

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const handleLogout = () => {
    document.cookie =
      "usuario_public=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
    router.push("/");
  };

  const getRolTexto = (tipo: number) => {
    return tipo === 1 ? "admin" : "usuario";
  };

  const usuariosFiltrados = usuarios
    .filter((u) =>
      filtro === "todos" ? true : getRolTexto(u.tipo_usuario) === filtro
    )
    .filter((u) =>
      u.nombre.toLowerCase().includes(busqueda.toLowerCase())
    );

  const handleSave = async () => {
    const tipo_usuario = form.rol === "admin" ? 1 : 2;

    const body: any = {
      nombre: form.nombre,
      correo: form.correo,
      tipo_usuario,
      edificio_id: form.edificio_id,
      turno: form.turno,
    };

    if (form.contrasena) {
      body.contrasena = form.contrasena;
    }

    if (selectedUser) {
      await fetch(`/api/usuarios/${selectedUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } else {
      await fetch("/api/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...body,
          contrasena: form.contrasena,
        }),
      });
    }

    setShowForm(false);
    setSelectedUser(null);
    setForm({
      nombre: "",
      correo: "",
      contrasena: "",
      rol: "usuario",
      edificio_id: 1,
      turno: "",
    });

    fetchUsuarios();
  };

  const handleDelete = async () => {
    if (!selectedUser) return;

    await fetch(`/api/usuarios/${selectedUser.id}`, {
      method: "DELETE",
    });

    setDeleteOpen(false);
    setSelectedUser(null);

    fetchUsuarios();
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
    setForm({
      nombre: "",
      correo: "",
      contrasena: "",
      rol: "usuario",
      edificio_id: 1,
      turno: "",
    });
    setShowForm(true);
  };

  return (
    <div className="dashboard-container">
      <aside className="sidebar">
        <div>
          <div className="sidebar-logo">Admin</div>
          <nav>
            <a className="sidebar-link active">Usuarios</a>
            <a className="sidebar-link">Reportes</a>
            <a className="sidebar-link">Configuración</a>
          </nav>
        </div>

        <div
          className="logout"
          onClick={handleLogout}
          style={{ cursor: "pointer" }}
        >
          Cerrar sesión
        </div>
      </aside>

      <main className="dashboard-main">
        <div className="dashboard-header">
          <h1>Panel de Administrador</h1>
          <p>Gestión de usuarios del sistema</p>
        </div>

        <div className="chat-card" style={{ display: "flex", gap: "10px" }}>
          <button onClick={() => setFiltro("todos")} className="btn-primary">
            Todos
          </button>
          <button onClick={() => setFiltro("usuario")} className="btn-primary">
            Usuarios
          </button>
          <button onClick={() => setFiltro("admin")} className="btn-primary">
            Admin
          </button>
        </div>

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
                    {getRolTexto(user.tipo_usuario)}
                  </div>
                </div>

                <div
                  style={{ padding: "16px", display: "flex", gap: "8px" }}
                >
                  <button
                    className="btn-primary"
                    onClick={() => handleEdit(user)}
                  >
                    Editar
                  </button>
                  <button
                    className="btn-volver"
                    onClick={() => {
                      setSelectedUser(user);
                      setDeleteOpen(true);
                    }}
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="chat-card">
          <div className="chat-header">
            <strong>Acciones rápidas</strong>
          </div>

          <button className="btn-primary" onClick={handleCreate}>
            Agregar usuario
          </button>
        </div>

        {/* PANEL DE FORMULARIO */}
        {showForm && (
  <div className="drawer-overlay">
    <div className="drawer">
      <div className="drawer-header">
        <strong>
          {selectedUser ? "Editar usuario" : "Crear usuario"}
        </strong>
        <button onClick={() => setShowForm(false)}>✕</button>
      </div>

      <div className="drawer-body">
        <div className="form-group">
          <label>Nombre</label>
          <input
            value={form.nombre}
            onChange={(e) =>
              setForm({ ...form, nombre: e.target.value })
            }
          />
        </div>

        <div className="form-group">
          <label>Correo</label>
          <input
            value={form.correo}
            onChange={(e) =>
              setForm({ ...form, correo: e.target.value })
            }
          />
        </div>

        <div className="form-group">
          <label>Contraseña</label>
          <input
            type="password"
            placeholder="Dejar vacío para no cambiar"
            value={form.contrasena}
            onChange={(e) =>
              setForm({ ...form, contrasena: e.target.value })
            }
          />
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <div className="form-group" style={{ flex: 1 }}>
            <label>Edificio</label>
            <input
              type="number"
              value={form.edificio_id}
              onChange={(e) =>
                setForm({
                  ...form,
                  edificio_id: Number(e.target.value),
                })
              }
            />
          </div>

          <div className="form-group" style={{ flex: 1 }}>
            <label>Turno</label>
            <input
              placeholder="mañana / tarde / noche"
              value={form.turno}
              onChange={(e) =>
                setForm({ ...form, turno: e.target.value })
              }
            />
          </div>
        </div>

        <div className="form-group">
          <label>Rol</label>
          <select
            value={form.rol}
            onChange={(e) =>
              setForm({
                ...form,
                rol: e.target.value as "usuario" | "admin",
              })
            }
          >
            <option value="usuario">Usuario</option>
            <option value="admin">Administrador</option>
          </select>
        </div>
      </div>

      <div className="drawer-footer">
        <button
          className="btn-volver"
          onClick={() => setShowForm(false)}
        >
          Cancelar
        </button>

        <button className="btn-primary" onClick={handleSave}>
          Guardar
        </button>
      </div>
    </div>
  </div>
)}
      </main>

      {deleteOpen && (
        <div className="modal">
          <div className="bg-white p-4">
            <p>¿Eliminar a {selectedUser?.nombre}?</p>

            <div
              style={{
                display: "flex",
                gap: "10px",
                marginTop: "10px",
              }}
            >
              <button className="btn-volver" onClick={handleDelete}>
                Eliminar
              </button>
              <button onClick={() => setDeleteOpen(false)}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}