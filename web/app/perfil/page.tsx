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
  FiClock as FiTurno,
  FiCalendar,
  FiMapPin,
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
      await fetch("/api/login", { method: "DELETE" });
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

  return (
    <div className="dashboard-container">

      {/* SIDEBAR */}
      <aside className="sidebar">
        <div>
          <div className="sidebar-logo">
            <FiSmile size={28} />
            <span>Jorima</span>
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

              </div>

            </div>
          ) : null}

        </div>

      </main>
    </div>
  );
}