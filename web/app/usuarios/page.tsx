"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

/* ICONOS */
import {
  FiHome,
  FiClock,
  FiBookOpen,
  FiLogOut,
  FiSmile,
  FiFrown,
  FiMeh
} from "react-icons/fi";

type Usuario = {
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
      text: "¡Hola! Soy tu asistente virtual de bienestar. Estoy aquí para escucharte y ayudarte. ¿Hay algo en lo que pueda apoyarte hoy?"
    }
  ]);

  const [input, setInput] = useState("");

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

  useEffect(() => {

    const user = localStorage.getItem("usuario");

    if (!user) {
      router.push("/");
      return;
    }

    setUsuario(JSON.parse(user));

  }, [router]);

  /* =========================
     CHAT
  ========================= */

  const sendMessage = () => {

    if (!input.trim()) return;

    const newMessages: Message[] = [
      ...messages,
      { role: "user", text: input },
      {
        role: "assistant",
        text: "Gracias por compartir. Estoy aquí para escucharte. ¿Puedes contarme más sobre eso?"
      }
    ];

    setMessages(newMessages);
    setInput("");

  };

  /* =========================
     LOGOUT
  ========================= */

  const logout = () => {

    localStorage.removeItem("usuario");
    router.push("/");

  };

  return (

    <div className="dashboard-container">

      {/* SIDEBAR */}

      <aside className="sidebar">

        <div>

          <div className="sidebar-logo">
            <FiSmile size={28}/>
            <span>Jorima</span>
          </div>

          <nav>

            <a className="sidebar-link active">
              <FiHome size={20}/>
              Inicio
            </a>

            <a className="sidebar-link">
              <FiClock size={20}/>
              Mi Historial
            </a>

            <a className="sidebar-link">
              <FiBookOpen size={20}/>
              Recursos de Ayuda
            </a>

          </nav>

        </div>

        <div className="logout" onClick={logout}>
          <FiLogOut size={20}/>
          Cerrar Sesión
        </div>

      </aside>

      {/* MAIN */}

      <main className="dashboard-main">

        <div className="dashboard-header">

          <h1>
            Hola, {usuario?.nombre || usuario?.correo}
          </h1>

        </div>

        {/* MOOD */}

        <div className="mood-card">

          <h3>¿Cómo te sientes hoy antes de empezar?</h3>

          <div className="mood-selector">

            <div
              className={`mood-option ${mood === "muy mal" ? "selected" : ""}`}
              onClick={() => setMood("muy mal")}
            >
              <FiFrown size={28}/>
              <span>Muy mal</span>
            </div>

            <div
              className={`mood-option ${mood === "mal" ? "selected" : ""}`}
              onClick={() => setMood("mal")}
            >
              <FiFrown size={26}/>
              <span>Mal</span>
            </div>

            <div
              className={`mood-option ${mood === "regular" ? "selected" : ""}`}
              onClick={() => setMood("regular")}
            >
              <FiMeh size={26}/>
              <span>Regular</span>
            </div>

            <div
              className={`mood-option ${mood === "bien" ? "selected" : ""}`}
              onClick={() => setMood("bien")}
            >
              <FiSmile size={26}/>
              <span>Bien</span>
            </div>

            <div
              className={`mood-option ${mood === "muy bien" ? "selected" : ""}`}
              onClick={() => setMood("muy bien")}
            >
              <FiSmile size={26}/>
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
                  msg.role === "assistant"
                    ? "assistant"
                    : "user"
                }`}
              >

                {msg.role === "assistant" && (
                  <span style={{marginRight:"6px"}}>
                    {getMoodIcon()}
                  </span>
                )}

                {msg.text}

              </div>

            ))}

          </div>

          <div className="chat-input">

            <input
              type="text"
              placeholder="Escribe tu mensaje aquí..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />

            <button onClick={sendMessage}>
              ➤
            </button>

          </div>

        </div>

      </main>

    </div>

  );

}