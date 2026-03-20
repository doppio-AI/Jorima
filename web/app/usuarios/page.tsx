"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";

/* ICONOS */
import {
  FiHome,
  FiClock,
  FiBookOpen,
  FiLogOut,
  FiSmile,
  FiFrown,
  FiMeh,
  FiSend,
  FiLoader,
} from "react-icons/fi";

type Usuario = {
  id?: number;
  nombre?: string;
  correo?: string;
};

type Message = {
  role: "assistant" | "user";
  text: string;
};

export default function UsuariosPage() {

  const router = useRouter();

  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [mood, setMood] = useState<string | null>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      text: "Inicia tu conversación con Jorima, tu asistente de bienestar emocional.",
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversacionId, setConversacionId] = useState<number | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);

  /* =========================
     SCROLL AL ÚLTIMO MENSAJE
  ========================= */

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* =========================
     ICONO SEGÚN EMOCIÓN
  ========================= */

  const getMoodIcon = () => {
    switch (mood) {
      case "muy mal":
        return <FiFrown size={18} />;
      case "mal":
        return <FiFrown size={18} />;
      case "regular":
        return <FiMeh size={18} />;
      case "bien":
        return <FiSmile size={18} />;
      case "muy bien":
        return <FiSmile size={18} />;
      default:
        return <FiSmile size={18} />;
    }
  };

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
      } catch (error) {
        router.push("/");
      }
    };

    checkSession();
  }, [router]);

  /* =========================
     ENVIAR MENSAJE AL CHAT
  ========================= */

  const sendMessage = async () => {
    if (!input.trim() || loading || !usuario?.id) return;

    const textoUsuario = input.trim();

    /* Agregar mensaje del usuario al chat */
    setMessages((prev) => [...prev, { role: "user", text: textoUsuario }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          usuario_id: usuario.id,
          mensaje: textoUsuario,
          conversacion_id: conversacionId,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        /* Guardar ID de conversación para mensajes siguientes */
        if (!conversacionId) {
          setConversacionId(data.conversacion_id);
        }

        /* Agregar respuesta del asistente */
        setMessages((prev) => [
          ...prev,
          { role: "assistant", text: data.respuesta },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            text: "Lo siento, hubo un error al procesar tu mensaje. Intenta de nuevo.",
          },
        ]);
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "No se pudo conectar con el servidor. Verifica tu conexión.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  /* Enviar con Enter */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
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
            <a className="sidebar-link active">
              <FiHome size={20} />
              Inicio
            </a>

            <a className="sidebar-link" onClick={() => router.push("/historial")}>
              <FiClock size={20} />
              Mi Historial
            </a>

            <a className="sidebar-link">
              <FiBookOpen size={20} />
              Recursos de Ayuda
            </a>
          </nav>
        </div>

        <div className="logout" onClick={logout}>
          <FiLogOut size={20} />
          Cerrar Sesión
        </div>
      </aside>

      {/* MAIN */}

      <main className="dashboard-main">
        <div className="dashboard-header">
          <h1>Hola, {usuario?.nombre || usuario?.correo}</h1>
        </div>

        {/* MOOD */}

        <div className="mood-card">
          <h3>¿Cómo te sientes hoy antes de empezar?</h3>

          <div className="mood-selector">
            <div
              className={`mood-option ${mood === "muy mal" ? "selected" : ""}`}
              onClick={() => setMood("muy mal")}
            >
              <FiFrown size={28} />
              <span>Muy mal</span>
            </div>

            <div
              className={`mood-option ${mood === "mal" ? "selected" : ""}`}
              onClick={() => setMood("mal")}
            >
              <FiFrown size={26} />
              <span>Mal</span>
            </div>

            <div
              className={`mood-option ${mood === "regular" ? "selected" : ""}`}
              onClick={() => setMood("regular")}
            >
              <FiMeh size={26} />
              <span>Regular</span>
            </div>

            <div
              className={`mood-option ${mood === "bien" ? "selected" : ""}`}
              onClick={() => setMood("bien")}
            >
              <FiSmile size={26} />
              <span>Bien</span>
            </div>

            <div
              className={`mood-option ${mood === "muy bien" ? "selected" : ""}`}
              onClick={() => setMood("muy bien")}
            >
              <FiSmile size={26} />
              <span>Muy bien</span>
            </div>
          </div>

          {mood && (
            <div className="mood-thanks">
              ✓ Gracias por compartir cómo te sientes
            </div>
          )}
        </div>

        {/* CHAT */}

        <div className="chat-card">
          <div className="chat-header">
            <strong>Chat Privado y Seguro</strong>
            <p className="chat-subtitle">
              Tus conversaciones son confidenciales
            </p>
          </div>

          <div className="chat-messages">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`chat-message ${
                  msg.role === "assistant" ? "assistant" : "user"
                }`}
              >
                {msg.role === "assistant" && (
                  <span style={{ marginRight: "6px" }}>{getMoodIcon()}</span>
                )}
                {msg.text}
              </div>
            ))}

            {/* Indicador de carga */}
            {loading && (
              <div className="chat-message assistant">
                <span style={{ marginRight: "6px" }}>{getMoodIcon()}</span>
                <span className="typing-indicator">
                  <span>●</span>
                  <span>●</span>
                  <span>●</span>
                </span>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          <div className="chat-input">
            <input
              type="text"
              placeholder="Escribe tu mensaje aquí..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
            />

            <button onClick={sendMessage} disabled={loading}>
              {loading ? <FiLoader className="spin" size={18} /> : <FiSend size={18} />}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
