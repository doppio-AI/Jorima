"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

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
  FiUser,
  FiShield,
} from "react-icons/fi";

type Usuario = {
  id: number;
  nombre?: string;
  correo?: string;
  edificio_id?: number | null;
};

type Message = {
  id: string;
  role: "assistant" | "user";
  text: string;
};

type ChatPostResponse = {
  conversacion_id?: number;
  respuesta?: string;
  error?: string;
  temporal?: boolean;
};

type ChatGetResponse = {
  conversacion_id?: number;
  mensajes?: Array<{
    mensaje_id: number;
    role: string;
    texto: string;
    fecha: string;
  }>;
  error?: string;
};

const MENSAJE_BIENVENIDA: Message = {
  id: "bienvenida",
  role: "assistant",
  text: "Inicia tu conversación con Jorima, tu asistente de bienestar emocional.",
};

const MAX_MENSAJE_LENGTH = 2000;

function readCookie(name: string): string | null {
  const cookies = document.cookie.split(";");

  for (const cookie of cookies) {
    const [cookieName, ...cookieValue] = cookie.trim().split("=");

    if (cookieName === name) {
      return decodeURIComponent(cookieValue.join("="));
    }
  }

  return null;
}

function obtenerFechaLocal(): string {
  const fecha = new Date();
  const year = fecha.getFullYear();
  const month = String(fecha.getMonth() + 1).padStart(2, "0");
  const day = String(fecha.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function crearIdMensaje(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random()}`;
}

export default function UsuariosPage() {
  const router = useRouter();

  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargandoSesion, setCargandoSesion] = useState(true);

  const [mood, setMood] = useState<string | null>(null);
  const [enviandoMood, setEnviandoMood] = useState(false);
  const [moodEnviadoHoy, setMoodEnviadoHoy] = useState(false);

  const [messages, setMessages] = useState<Message[]>([
    MENSAJE_BIENVENIDA,
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);
  const [chatError, setChatError] = useState("");

  const [conversacionId, setConversacionId] =
    useState<number | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);

  /* =========================
     SCROLL AUTOMÁTICO
  ========================= */

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages, loading, cargandoHistorial]);

  /* =========================
     VALIDAR SESIÓN
  ========================= */

  useEffect(() => {
    const checkSession = async () => {
      try {
        const cookieValue = readCookie("usuario_public");

        if (!cookieValue) {
          router.replace("/");
          return;
        }

        const usuarioPublic = JSON.parse(cookieValue);

        const usuarioId = Number(
          usuarioPublic.id ?? usuarioPublic.usuario_id
        );

        if (!Number.isInteger(usuarioId) || usuarioId <= 0) {
          router.replace("/");
          return;
        }

        const response = await fetch(
          `/api/usuarios/${usuarioId}`,
          {
            method: "GET",
            credentials: "same-origin",
            cache: "no-store",
          }
        );

        if (response.status === 401) {
          router.replace("/");
          return;
        }

        if (!response.ok) {
          throw new Error(
            "No fue posible recuperar la información del usuario"
          );
        }

        const data = await response.json();

        setUsuario({
          id: usuarioId,
          nombre: data.nombre ?? usuarioPublic.nombre,
          correo: data.correo ?? usuarioPublic.correo,
          edificio_id:
            data.edificio_id ??
            usuarioPublic.edificio_id ??
            null,
        });
      } catch (error) {
        console.error("Error validando sesión:", error);
        router.replace("/");
      } finally {
        setCargandoSesion(false);
      }
    };

    void checkSession();
  }, [router]);

  /* =========================
     CARGAR CONVERSACIÓN ACTUAL
  ========================= */

  useEffect(() => {
    if (!usuario?.id) {
      return;
    }

    const cargarConversacion = async () => {
      const storageKey = `jorima_conversacion_${usuario.id}`;
      const guardada = localStorage.getItem(storageKey);

      if (!guardada) {
        return;
      }

      const idGuardado = Number(guardada);

      if (!Number.isInteger(idGuardado) || idGuardado <= 0) {
        localStorage.removeItem(storageKey);
        return;
      }

      setCargandoHistorial(true);
      setChatError("");

      try {
        const response = await fetch(
          `/api/chat?conversacion_id=${idGuardado}`,
          {
            method: "GET",
            credentials: "same-origin",
            cache: "no-store",
          }
        );

        if (response.status === 401) {
          router.replace("/");
          return;
        }

        const data =
          (await response.json()) as ChatGetResponse;

        if (!response.ok) {
          localStorage.removeItem(storageKey);
          setConversacionId(null);
          setMessages([MENSAJE_BIENVENIDA]);
          return;
        }

        const mensajesValidos = (data.mensajes ?? [])
          .filter(
            (mensaje) =>
              mensaje.role === "user" ||
              mensaje.role === "assistant"
          )
          .map<Message>((mensaje) => ({
            id: String(mensaje.mensaje_id),
            role:
              mensaje.role === "assistant"
                ? "assistant"
                : "user",
            text: mensaje.texto,
          }));

        setConversacionId(idGuardado);

        setMessages(
          mensajesValidos.length > 0
            ? mensajesValidos
            : [MENSAJE_BIENVENIDA]
        );
      } catch (error) {
        console.error(
          "Error cargando la conversación:",
          error
        );

        setChatError(
          "No fue posible recuperar la conversación anterior."
        );
      } finally {
        setCargandoHistorial(false);
      }
    };

    void cargarConversacion();
  }, [usuario?.id, router]);

  /* =========================
     VALIDAR MOOD DIARIO
  ========================= */

  useEffect(() => {
    if (!usuario?.id) {
      return;
    }

    const hoy = obtenerFechaLocal();
    const storageKey = `mood_fecha_${usuario.id}`;
    const ultimoEnvio = localStorage.getItem(storageKey);

    setMoodEnviadoHoy(ultimoEnvio === hoy);
  }, [usuario?.id]);

  /* =========================
     ICONO SEGÚN EMOCIÓN
  ========================= */

  const getMoodIcon = () => {
    switch (mood) {
      case "muy mal":
      case "mal":
        return <FiFrown size={18} />;

      case "regular":
        return <FiMeh size={18} />;

      case "bien":
      case "muy bien":
        return <FiSmile size={18} />;

      default:
        return <FiSmile size={18} />;
    }
  };

  /* =========================
     ENVIAR MOOD
  ========================= */

  const enviarMood = async () => {
    if (
      !mood ||
      enviandoMood ||
      moodEnviadoHoy ||
      !usuario?.id
    ) {
      return;
    }

    setEnviandoMood(true);

    try {
      const response = await fetch("/api/respuesta", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify({
          /*
           * Conviene que /api/respuesta obtenga el edificio
           * desde la sesión. Mientras eso se modifica, usamos
           * el edificio asociado al usuario.
           */
          edificio_id: usuario.edificio_id ?? 1,
          respuestas: {
            estado_animo: mood,
          },
        }),
      });

      if (response.status === 401) {
        router.replace("/");
        return;
      }

      if (!response.ok) {
        const data = await response.json().catch(() => null);

        throw new Error(
          data?.error || "No fue posible enviar el estado"
        );
      }

      const storageKey = `mood_fecha_${usuario.id}`;

      localStorage.setItem(
        storageKey,
        obtenerFechaLocal()
      );

      setMoodEnviadoHoy(true);
    } catch (error) {
      console.error("Error enviando mood:", error);
    } finally {
      setEnviandoMood(false);
    }
  };

  /* =========================
     ENVIAR MENSAJE
  ========================= */

  const sendMessage = async () => {
    const textoUsuario = input.trim();

    if (
      !textoUsuario ||
      loading ||
      cargandoHistorial ||
      !usuario?.id
    ) {
      return;
    }

    if (textoUsuario.length > MAX_MENSAJE_LENGTH) {
      setChatError(
        `El mensaje no puede superar los ${MAX_MENSAJE_LENGTH} caracteres.`
      );
      return;
    }

    const mensajeLocal: Message = {
      id: crearIdMensaje(),
      role: "user",
      text: textoUsuario,
    };

    setMessages((prev) => [...prev, mensajeLocal]);
    setInput("");
    setChatError("");
    setLoading(true);

    const controller = new AbortController();
    const timeoutId = window.setTimeout(
      () => controller.abort(),
      30000
    );

   try {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "same-origin",
    body: JSON.stringify({
      mensaje: textoUsuario,
      conversacion_id: conversacionId,
    }),
  });

  const data = (await response
    .json()
    .catch(() => ({}))) as ChatPostResponse;

  if (response.status === 401) {
    router.replace("/");
    return;
  }

  if (!response.ok) {
    throw new Error(
      data.error || "No fue posible procesar tu mensaje"
    );
  }

  if (
    typeof data.respuesta !== "string" ||
    !data.respuesta.trim()
  ) {
    throw new Error(
      "El asistente devolvió una respuesta inválida"
    );
  }

  if (
    typeof data.conversacion_id === "number" &&
    data.conversacion_id > 0
  ) {
    setConversacionId(data.conversacion_id);

    localStorage.setItem(
      `jorima_conversacion_${usuario.id}`,
      String(data.conversacion_id)
    );
  }

  setMessages((prev) => [
    ...prev,
    {
      id: crearIdMensaje(),
      role: "assistant",
      text: data.respuesta!.trim(),
    },
  ]);
} catch (error) {
  console.error(
    "Error comunicándose con el chatbot:",
    error
  );

  const mensajeError =
    error instanceof Error
      ? error.message
      : "No se pudo conectar con el servidor.";

  setChatError(mensajeError);

  setMessages((prev) => [
    ...prev,
    {
      id: crearIdMensaje(),
      role: "assistant",
      text:
        "Lo siento, ocurrió un problema al procesar tu mensaje. Puedes intentarlo nuevamente.",
    },
  ]);
} finally {
  setLoading(false);
}
  };

  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (event.key === "Enter") {
      event.preventDefault();
      void sendMessage();
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
    } catch (error) {
      console.error("Error cerrando sesión:", error);
    } finally {
      if (usuario?.id) {
        localStorage.removeItem(
          `jorima_conversacion_${usuario.id}`
        );
      }

      window.location.href = "/";
    }
  };

  /* =========================
     UI
  ========================= */

  if (cargandoSesion) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <FiLoader className="spin" size={30} />
      </main>
    );
  }

  return (
    <div className="dashboard-container">
      <aside className="sidebar">
        <div>
          <div className="sidebar-logo">
            <img
              src="/logo.jpeg"
              alt="Jorima"
              style={{
                width: "100%",
                maxWidth: "160px",
                height: "auto",
              }}
            />
          </div>

          <nav>
            <a className="sidebar-link active">
              <FiHome size={20} />
              Inicio
            </a>

            <a
              className="sidebar-link"
              onClick={() => router.push("/historial")}
            >
              <FiClock size={20} />
              Mi Historial
            </a>

            <a
              className="sidebar-link"
              onClick={() => router.push("/recursos")}
            >
              <FiBookOpen size={20} />
              Recursos
            </a>

            <a
              className="sidebar-link"
              onClick={() =>
                window.open(
                  "/aviso-privacidad",
                  "_blank",
                  "noopener,noreferrer"
                )
              }
            >
              <FiShield size={20} />
              Aviso de Privacidad
            </a>
          </nav>
        </div>

        <div>
          <a
            className="sidebar-link"
            onClick={() => router.push("/perfil")}
          >
            <FiUser size={20} />
            Mi Perfil
          </a>

          <div className="logout" onClick={logout}>
            <FiLogOut size={20} />
            Cerrar Sesión
          </div>
        </div>
      </aside>

      <main className="dashboard-main">
        <div className="dashboard-header">
          <h1>
            Hola,{" "}
            {usuario?.nombre ||
              usuario?.correo ||
              "usuario"}
          </h1>
        </div>

        {/* MOOD */}

        <div className="mood-card">
          <h3>
            ¿Cómo te sientes hoy antes de empezar?
          </h3>

          <div className="mood-selector">
            {[
              "muy mal",
              "mal",
              "regular",
              "bien",
              "muy bien",
            ].map((estado) => (
              <div
                key={estado}
                className={`mood-option ${
                  mood === estado ? "selected" : ""
                }`}
                onClick={() => {
                  if (!moodEnviadoHoy) {
                    setMood(estado);
                  }
                }}
              >
                {estado === "regular" ? (
                  <FiMeh size={26} />
                ) : estado === "bien" ||
                  estado === "muy bien" ? (
                  <FiSmile size={26} />
                ) : (
                  <FiFrown size={26} />
                )}

                <span>{estado}</span>
              </div>
            ))}
          </div>

          {mood && (
            <div className="mood-thanks">
              ✓ Gracias por compartir cómo te sientes
            </div>
          )}

          <button
            type="button"
            className="btn-primary"
            onClick={enviarMood}
            disabled={
              !mood ||
              enviandoMood ||
              moodEnviadoHoy
            }
          >
            {enviandoMood
              ? "Enviando..."
              : moodEnviadoHoy
                ? "Ya enviaste tu estado hoy"
                : "Enviar estado"}
          </button>
        </div>

        {/* CHAT */}

        <div className="chat-card">
          <div className="chat-header">
            <strong>Chat privado y seguro</strong>

            <p className="chat-subtitle">
              Tus conversaciones son confidenciales
            </p>
          </div>

          <div className="chat-messages">
            {cargandoHistorial && (
              <div className="chat-message assistant">
                <FiSmile
                  size={18}
                  style={{ marginRight: "6px" }}
                />

                <span>Cargando conversación...</span>
              </div>
            )}

            {!cargandoHistorial &&
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`chat-message ${
                    message.role === "assistant"
                      ? "assistant"
                      : "user"
                  }`}
                >
                  {message.role === "assistant" && (
                    /*
                     * El icono del asistente ya no cambia según
                     * el mood del usuario. Eso daba a entender
                     * que la IA estaba triste o feliz.
                     */
                    <FiSmile
                      size={18}
                      style={{ marginRight: "6px" }}
                    />
                  )}

                  {message.text}
                </div>
              ))}

            {loading && (
              <div className="chat-message assistant">
                <FiSmile
                  size={18}
                  style={{ marginRight: "6px" }}
                />

                <span className="typing-indicator">
                  <span>●</span>
                  <span>●</span>
                  <span>●</span>
                </span>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {chatError && (
            <p
              className="error-text"
              style={{
                margin: "8px 16px 0",
              }}
            >
              {chatError}
            </p>
          )}

          <div className="chat-input">
            <input
              type="text"
              placeholder="Escribe tu mensaje..."
              value={input}
              maxLength={MAX_MENSAJE_LENGTH}
              onChange={(event) => {
                setInput(event.target.value);
                setChatError("");
              }}
              onKeyDown={handleKeyDown}
              disabled={
                loading ||
                cargandoHistorial ||
                !usuario
              }
            />

            <button
              type="button"
              onClick={() => void sendMessage()}
              disabled={
                loading ||
                cargandoHistorial ||
                !input.trim()
              }
              aria-label="Enviar mensaje"
            >
              {loading ? (
                <FiLoader
                  className="spin"
                  size={18}
                />
              ) : (
                <FiSend size={18} />
              )}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}