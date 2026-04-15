"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  FiHome,
  FiClock,
  FiBookOpen,
  FiLogOut,
  FiSmile,
  FiUser,
  FiMail,
  FiSave,
  FiLock,
  FiClock as FiTurno,
  FiCalendar,
  FiMapPin,
  FiShield, // <-- Ícono del escudo agregado
} from "react-icons/fi";

type UsuarioCompleto = {
  usuario_id: number;
  nombre: string;
  apellido_paterno: string;
  apellido_materno: string | null;
  correo: string;
  turno: string | null;
  tipo_usuario: number;
  fecha_registro: string | null;
  edificio: {
    nombre: string;
  } | null;
};

export default function PerfilPage() {

  const router = useRouter();
  const [usuario, setUsuario] = useState<UsuarioCompleto | null>(null);
  const [formData, setFormData] = useState({
    nombre: "",
    apellido_paterno: "",
    apellido_materno: "",
    turno: "",
    contrasena: "",
    confirmarContrasena: "",
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  /* =========================
     VALIDAR SESIÓN Y CARGAR DATOS
  ========================= */

  const readCookie = (name: string) => {
    const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
    return match ? decodeURIComponent(match[1]) : null;
  };

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const usuarioPublicValue = readCookie("usuario_public");

        if (!usuarioPublicValue) {
          router.push("/");
          return;
        }

        const usuarioPublic = JSON.parse(usuarioPublicValue);

        if (!usuarioPublic?.id) {
          router.push("/");
          return;
        }

        const res = await fetch(`/api/usuarios/${usuarioPublic.id}`, {
          method: "GET",
          cache: "no-store",
        });

        if (!res.ok) {
          router.push("/");
          return;
        }

        const data = await res.json();
        setUsuario(data);
        setFormData({
          nombre: data.nombre || "",
          apellido_paterno: data.apellido_paterno || "",
          apellido_materno: data.apellido_materno || "",
          turno: data.turno || "",
          contrasena: "",
          confirmarContrasena: "",
        });
      } catch (error) {
        router.push("/");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [router]);

  /* =========================
     FORMATEAR FECHA
  ========================= */

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "No disponible";
    const date = new Date(dateStr);
    return date.toLocaleDateString("es-MX", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  /* =========================
     TIPO DE USUARIO
  ========================= */

  const getTipoUsuario = (tipo: number) => {
    switch (tipo) {
      case 1:
        return "Recursos Humanos";
      case 2:
        return "Personal Docente/Administrativo";
      default:
        return "Usuario";
    }
  };

  /* =========================
     LOGOUT
  ========================= */

  const logout = async () => {
    try {
      await fetch("/api/login", {
        method: "DELETE",
        credentials: "same-origin",
        cache: "no-store",
      });
      document.cookie =
        "usuario_public=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      window.location.href = "/";
    } catch (error) {
      window.location.href = "/";
    }
  };

  const nombreCompleto = usuario
    ? `${usuario.nombre} ${usuario.apellido_paterno} ${usuario.apellido_materno || ""}`.trim()
    : "";

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (message) setMessage(null);
    if (errorMessage) setErrorMessage(null);
  };

  const handleSave = async () => {
    if (!usuario?.usuario_id) return;

    const nombre = formData.nombre.trim();
    const apellidoPaterno = formData.apellido_paterno.trim();
    const apellidoMaterno = formData.apellido_materno.trim();
    const turno = formData.turno.trim();

    if (!nombre || !apellidoPaterno) {
      setErrorMessage("Nombre y apellido paterno son obligatorios.");
      return;
    }

    if (formData.contrasena && formData.contrasena !== formData.confirmarContrasena) {
      setErrorMessage("La confirmación de contraseña no coincide.");
      return;
    }

    setSaving(true);
    setMessage(null);
    setErrorMessage(null);

    try {
      const payload: Record<string, string> = {
        nombre,
        apellido_paterno: apellidoPaterno,
        apellido_materno: apellidoMaterno,
        turno,
      };

      if (formData.contrasena.trim()) {
        payload.contrasena = formData.contrasena.trim();
      }

      const res = await fetch(`/api/usuarios/${usuario.usuario_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "No se pudieron actualizar tus datos.");
      }

      setUsuario((prev) =>
        prev
          ? {
              ...prev,
              nombre: data.nombre,
              apellido_paterno: data.apellido_paterno,
              apellido_materno: data.apellido_materno,
              turno: data.turno,
            }
          : prev,
      );

      setFormData((prev) => ({
        ...prev,
        contrasena: "",
        confirmarContrasena: "",
      }));

      setMessage("Tu perfil se actualizó correctamente.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Ocurrió un error al guardar.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="dashboard-container">

      {/* SIDEBAR */}
      <aside className="sidebar">
        <div>
          <div className="sidebar-logo">
            <img src="/logo.jpeg" alt="Jorima" style={{ width: "100%", maxWidth: "160px", height: "auto" }} />
          </div>

          <nav>
            <a className="sidebar-link" onClick={() => router.push("/usuarios")}>
              <FiHome size={20} />
              Inicio
            </a>

            <a className="sidebar-link" onClick={() => router.push("/historial")}>
              <FiClock size={20} />
              Mi Historial
            </a>

            <a className="sidebar-link" onClick={() => router.push("/recursos")}>
              <FiBookOpen size={20} />
              Recursos de Ayuda
            </a>

            {/* AVISO DE PRIVACIDAD */}
            <a className="sidebar-link" onClick={() => window.open("/aviso-privacidad", "_blank")}>
              <FiShield size={20} />
              Aviso de Privacidad
            </a>
          </nav>
        </div>

        <div>
          <a className="sidebar-link active" onClick={() => router.push("/perfil")}>
            <FiUser size={20} />
            Mi Perfil
          </a>

          <div className="logout" onClick={logout}>
            <FiLogOut size={20} />
            Cerrar Sesión
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <main className="dashboard-main">

        <div className="dashboard-header">
          <h1>Hola, {usuario?.nombre || "..."}</h1>
        </div>

        <div className="perfil-container">

          <div className="perfil-title">
            <h2>Mi Perfil</h2>
            <p>Revisa y actualiza tus datos personales y profesionales</p>
          </div>

          {loading ? (
            <div className="perfil-loading">
              <div className="typing-indicator">
                <span>●</span>
                <span>●</span>
                <span>●</span>
              </div>
            </div>
          ) : usuario ? (
            <div className="perfil-card">

              {/* HEADER AZUL */}
              <div className="perfil-card-header">
                <h3>Información Personal</h3>
              </div>

              <div className="perfil-card-body">

                {/* INFO PRINCIPAL */}
                <div className="perfil-info-main">
                  <div className="perfil-avatar">
                    <FiUser size={32} />
                  </div>
                  <div className="perfil-info-text">
                    <strong>{nombreCompleto}</strong>
                    <span>{getTipoUsuario(usuario.tipo_usuario)}</span>
                  </div>
                </div>

                {/* GRID DE DATOS */}
                <div className="perfil-grid">

                  <div className="perfil-dato">
                    <div className="perfil-dato-icon">
                      <FiMail size={20} />
                    </div>
                    <div>
                      <strong>Correo Electrónico</strong>
                      <span>{usuario.correo}</span>
                    </div>
                  </div>

                  <div className="perfil-dato">
                    <div className="perfil-dato-icon">
                      <FiTurno size={20} />
                    </div>
                    <div>
                      <strong>Turno</strong>
                      <span>{usuario.turno || "No asignado"}</span>
                    </div>
                  </div>

                  <div className="perfil-dato">
                    <div className="perfil-dato-icon">
                      <FiMapPin size={20} />
                    </div>
                    <div>
                      <strong>Edificio</strong>
                      <span>{usuario.edificio?.nombre || "No asignado"}</span>
                    </div>
                  </div>

                  <div className="perfil-dato">
                    <div className="perfil-dato-icon">
                      <FiCalendar size={20} />
                    </div>
                    <div>
                      <strong>Fecha de Ingreso</strong>
                      <span>{formatDate(usuario.fecha_registro)}</span>
                    </div>
                  </div>

                </div>

                {message ? <p className="perfil-message-ok">{message}</p> : null}
                {errorMessage ? <p className="perfil-message-error">{errorMessage}</p> : null}

                <div className="perfil-edit-modules">
                  <div className="perfil-module">
                    <h4>Modulo 1: Datos personales</h4>
                    <div className="perfil-form-grid">
                      <label className="perfil-field">
                        <span>Nombre</span>
                        <input
                          value={formData.nombre}
                          onChange={(e) => handleChange("nombre", e.target.value)}
                          placeholder="Tu nombre"
                        />
                      </label>

                      <label className="perfil-field">
                        <span>Apellido paterno</span>
                        <input
                          value={formData.apellido_paterno}
                          onChange={(e) => handleChange("apellido_paterno", e.target.value)}
                          placeholder="Tu apellido paterno"
                        />
                      </label>

                      <label className="perfil-field">
                        <span>Apellido materno</span>
                        <input
                          value={formData.apellido_materno}
                          onChange={(e) => handleChange("apellido_materno", e.target.value)}
                          placeholder="Tu apellido materno"
                        />
                      </label>

                      <label className="perfil-field">
                        <span>Correo electrónico</span>
                        <div className="perfil-readonly">
                          <p>{usuario.correo}</p>
                        </div>
                      </label>
                    </div>
                  </div>

                  <div className="perfil-module">
                    <h4>Modulo 2: Configuración de cuenta</h4>
                    <div className="perfil-form-grid">
                      <label className="perfil-field">
                        <span>Turno</span>
                        <select
                          value={formData.turno}
                          onChange={(e) => handleChange("turno", e.target.value)}
                        >
                          <option value="">Selecciona un turno</option>
                          <option value="Matutino">Matutino</option>
                          <option value="Vespertino">Vespertino</option>
                          <option value="Nocturno">Nocturno</option>
                          <option value="Mixto">Mixto</option>
                        </select>
                      </label>

                      <label className="perfil-field">
                        <span>Nueva contraseña</span>
                        <input
                          type="password"
                          value={formData.contrasena}
                          onChange={(e) => handleChange("contrasena", e.target.value)}
                          placeholder="Opcional"
                        />
                      </label>

                      <label className="perfil-field">
                        <span>Confirmar contraseña</span>
                        <input
                          type="password"
                          value={formData.confirmarContrasena}
                          onChange={(e) => handleChange("confirmarContrasena", e.target.value)}
                          placeholder="Repite la contraseña"
                        />
                      </label>

                      <div className="perfil-field perfil-readonly">
                        <span>Tipo de usuario</span>
                        <p>{getTipoUsuario(usuario.tipo_usuario)}</p>
                      </div>

                      <div className="perfil-field perfil-readonly">
                        <span>Edificio</span>
                        <p>{usuario.edificio?.nombre || "No asignado"}</p>
                      </div>

                      <div className="perfil-field perfil-readonly">
                        <span>Fecha de ingreso</span>
                        <p>{formatDate(usuario.fecha_registro)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="perfil-actions">
                  <button className="btn-primary" onClick={handleSave} disabled={saving}>
                    <FiSave size={16} />
                    {saving ? "Guardando..." : "Guardar cambios"}
                  </button>
                  <p className="perfil-actions-note">
                    <FiLock size={14} />
                    Tu contraseña se guarda cifrada.
                  </p>
                </div>

              </div>

            </div>
          ) : null}

        </div>

      </main>
    </div>
  );
}