"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";

import {
  FiHome,
  FiClock,
  FiBookOpen,
  FiLogOut,
  FiSmile,
  FiFrown,
  FiMeh,
  FiChevronDown,
  FiChevronUp,
  FiMessageCircle,
  FiUser,
  FiShield, // <-- Ícono del escudo agregado
} from "react-icons/fi";

type Usuario = {
  id?: number;
  nombre?: string;
  correo?: string;
};

type Mensaje = {
  mensaje_id: number;
  role: "user" | "assistant";
  texto: string;
  fecha: string;
};

type Conversacion = {
  conversacion_id: number;
  titulo: string | null;
  fecha_creacion: string;
  mensaje: Mensaje[];
  _count: { mensaje: number };
};

export default function HistorialPage() {

  const router = useRouter();

  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [conversaciones, setConversaciones] = useState<Conversacion[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  /* =========================
     VALIDAR SESIÓN
  ========================= */

  const readCookie = (name: string) => {
    const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
    return match ? decodeURIComponent(match[1]) : null;
  };

  useEffect(() => {
    const checkSession = async () => {
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
        setUsuario({
          id: usuarioPublic.id,
          nombre: data.nombre,
          correo: data.correo,
        });

        /* Cargar historial */
        await loadHistorial(usuarioPublic.id);

      } catch (error) {
        router.push("/");
      }
    };

    checkSession();
  }, [router]);

  /* =========================
     CARGAR HISTORIAL
  ========================= */

  const loadHistorial = async (userId: number) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/historial?usuario_id=${userId}`);
      const data = await res.json();

      if (res.ok) {
        setConversaciones(data.conversaciones);
      }
    } catch (error) {
      console.error("Error cargando historial:", error);
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     TOGGLE CONVERSACIÓN
  ========================= */

  const toggleConversacion = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  /* Scroll al abrir una conversación */
  useEffect(() => {
    if (expandedId !== null) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [expandedId]);

  /* =========================
     FORMATEAR FECHA
  ========================= */

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("es-MX", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString("es-MX", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  /* =========================
     ICONO SEGÚN CANTIDAD DE MENSAJES
  ========================= */

  const getConversationIcon = (count: number) => {
    if (count > 10) return <FiFrown size={22} style={{ color: "#e74c3c" }} />;
    if (count > 5) return <FiMeh size={22} style={{ color: "#f39c12" }} />;
    return <FiSmile size={22} style={{ color: "var(--color-verde-turquesa)" }} />;
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

            <a className="sidebar-link active">
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
          <a className="sidebar-link" onClick={() => router.push("/perfil")}>
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
          <h1>Hola, {usuario?.nombre || usuario?.correo}</h1>
        </div>

        <div className="historial-container">

          <div className="historial-header">
            <h2>Mi Historial de Interacciones</h2>
            <p>Revisa tus conversaciones anteriores con el asistente virtual</p>
          </div>

          {/* LOADING */}
          {loading && (
            <div className="historial-loading">
              <div className="typing-indicator">
                <span>●</span>
                <span>●</span>
                <span>●</span>
              </div>
              <p>Cargando historial...</p>
            </div>
          )}

          {/* SIN CONVERSACIONES */}
          {!loading && conversaciones.length === 0 && (
            <div className="historial-empty">
              <FiMessageCircle size={48} style={{ color: "var(--neutral-400)" }} />
              <p>Aún no tienes conversaciones registradas</p>
              <button
                className="btn-primary"
                onClick={() => router.push("/usuarios")}
              >
                Iniciar una conversación
              </button>
            </div>
          )}

          {/* LISTA DE CONVERSACIONES */}
          {!loading && conversaciones.map((conv) => (
            <div
              key={conv.conversacion_id}
              className={`historial-card ${expandedId === conv.conversacion_id ? "expanded" : ""}`}
            >

              {/* CABECERA DE LA CONVERSACIÓN */}
              <div
                className="historial-card-header"
                onClick={() => toggleConversacion(conv.conversacion_id)}
              >
                <div className="historial-card-left">
                  {getConversationIcon(conv._count.mensaje)}
                  <div className="historial-card-info">
                    <strong>{conv.titulo || "Conversación sin título"}</strong>
                    <span className="historial-card-meta">
                      {conv._count.mensaje} mensajes intercambiados
                    </span>
                    <span className="historial-card-meta">
                      Fecha: {formatDate(conv.fecha_creacion)} &nbsp; Hora: {formatTime(conv.fecha_creacion)}
                    </span>
                  </div>
                </div>

                <div className="historial-card-right">
                  {expandedId === conv.conversacion_id
                    ? <FiChevronUp size={22} />
                    : <FiChevronDown size={22} />
                  }
                </div>
              </div>

              {/* MENSAJES DESPLEGABLES */}
              {expandedId === conv.conversacion_id && (
                <div className="historial-messages">
                  {conv.mensaje.map((msg) => (
                    <div
                      key={msg.mensaje_id}
                      className={`historial-msg ${msg.role}`}
                    >
                      <div className="historial-msg-bubble">
                        {msg.role === "assistant" && (
                          <span className="historial-msg-icon">
                            <FiSmile size={16} />
                          </span>
                        )}
                        <p>{msg.texto}</p>
                      </div>
                      <span className="historial-msg-time">
                        {formatTime(msg.fecha)}
                      </span>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}

            </div>
          ))}

        </div>
      </main>
    </div>
  );
}