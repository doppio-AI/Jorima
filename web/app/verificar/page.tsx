"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { FiMail, FiRefreshCw, FiArrowLeft } from "react-icons/fi";

export default function VerificarPage() {

  const router = useRouter();

  const [codigo, setCodigo] = useState(["", "", "", "", "", ""]);
  const [usuario, setUsuario] = useState<{ usuario_id: number; correo: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [tiempoRestante, setTiempoRestante] = useState(300); // 5 minutos en segundos

  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  /* =========================
     CARGAR USUARIO PENDIENTE
  ========================= */

  useEffect(() => {
    const pendingData = sessionStorage.getItem("pending_2fa");

    if (!pendingData) {
      router.push("/");
      return;
    }

    setUsuario(JSON.parse(pendingData));

    /* Auto-focus al primer input */
    setTimeout(() => {
      inputsRef.current[0]?.focus();
    }, 100);
  }, [router]);

  /* =========================
     CONTADOR REGRESIVO
  ========================= */

  useEffect(() => {
    if (tiempoRestante <= 0) return;

    const timer = setInterval(() => {
      setTiempoRestante((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [tiempoRestante]);

  const formatTiempo = (segundos: number) => {
    const min = Math.floor(segundos / 60);
    const seg = segundos % 60;
    return `${min}:${seg.toString().padStart(2, "0")}`;
  };

  /* =========================
     MANEJAR INPUT DE CÓDIGO
  ========================= */

  const handleChange = (index: number, value: string) => {
    /* Solo aceptar números */
    if (!/^\d*$/.test(value)) return;

    const nuevoCodigo = [...codigo];
    nuevoCodigo[index] = value.slice(-1); // Solo el último carácter
    setCodigo(nuevoCodigo);
    setError("");

    /* Avanzar al siguiente input automáticamente */
    if (value && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }

    /* Auto-enviar si se completaron los 6 dígitos */
    if (nuevoCodigo.every((d) => d !== "") && nuevoCodigo.join("").length === 6) {
      handleVerificar(nuevoCodigo.join(""));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    /* Backspace: borrar y volver al anterior */
    if (e.key === "Backspace" && !codigo[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);

    if (pasted.length === 6) {
      const nuevoCodigo = pasted.split("");
      setCodigo(nuevoCodigo);
      handleVerificar(pasted);
    }
  };

  /* =========================
     VERIFICAR CÓDIGO
  ========================= */

  const handleVerificar = async (codigoCompleto: string) => {
    if (!usuario || loading) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/verificar-codigo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          usuario_id: usuario.usuario_id,
          codigo: codigoCompleto,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        /* Guardar cookie pública */
        document.cookie = `usuario_public=${encodeURIComponent(
          JSON.stringify(data.usuario)
        )}; path=/; max-age=86400`;

        /* Limpiar sessionStorage */
        sessionStorage.removeItem("pending_2fa");

        /* Redirigir según tipo */
        if (Number(data.usuario.tipo_usuario) === 1) {
          router.push("/administrador");
        } else {
          router.push("/usuarios");
        }
      } else {
        setError(data.error || "Código incorrecto");
        setCodigo(["", "", "", "", "", ""]);
        inputsRef.current[0]?.focus();
      }
    } catch (err) {
      setError("Error al verificar el código");
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     REENVIAR CÓDIGO
  ========================= */

  const handleReenviar = async () => {
    if (!usuario || resending) return;

    setResending(true);
    setError("");

    try {
      const res = await fetch("/api/verificar-codigo", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario_id: usuario.usuario_id }),
      });

      if (res.ok) {
        setTiempoRestante(300);
        setCodigo(["", "", "", "", "", ""]);
        inputsRef.current[0]?.focus();
        alert("Código reenviado a tu correo");
      } else {
        setError("Error al reenviar el código");
      }
    } catch (err) {
      setError("Error al reenviar el código");
    } finally {
      setResending(false);
    }
  };

  /* =========================
     VOLVER AL LOGIN
  ========================= */

  const handleVolver = () => {
    sessionStorage.removeItem("pending_2fa");
    router.push("/");
  };

  /* Ocultar parte del correo */
  const ocultarCorreo = (correo: string) => {
    const [usuario, dominio] = correo.split("@");
    if (usuario.length <= 3) return correo;
    return `${usuario.slice(0, 3)}${"*".repeat(usuario.length - 3)}@${dominio}`;
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen">

      <div className="header">
        <h1>Jorima</h1>
        <p>Plataforma de Bienestar Laboral</p>
      </div>

      <div className="login-card verificar-card">

        <div className="verificar-icon">
          <FiMail size={32} />
        </div>

        <h2>Verificación en 2 Pasos</h2>

        <p className="verificar-subtitle">
          Hemos enviado un código de 6 dígitos a tu correo
        </p>

        {usuario && (
          <p className="verificar-correo">
            <strong>{ocultarCorreo(usuario.correo)}</strong>
          </p>
        )}

        {/* Inputs del código */}
        <div className="codigo-inputs">
          {codigo.map((digit, i) => (
            <input
              key={i}
              ref={(el) => { inputsRef.current[i] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              onPaste={i === 0 ? handlePaste : undefined}
              disabled={loading}
              className={`codigo-input ${error ? "input-error" : ""}`}
            />
          ))}
        </div>

        {/* Mensajes */}
        {error && <p className="error-text">{error}</p>}

        {loading && <p className="verificar-info">Verificando código...</p>}

        {/* Tiempo restante */}
        <div className="verificar-tiempo">
          {tiempoRestante > 0 ? (
            <span>El código expira en <strong>{formatTiempo(tiempoRestante)}</strong></span>
          ) : (
            <span style={{ color: "#e74c3c" }}>El código ha expirado</span>
          )}
        </div>

        {/* Botón reenviar */}
        <button
          type="button"
          className="btn-reenviar"
          onClick={handleReenviar}
          disabled={resending || tiempoRestante > 240}
        >
          <FiRefreshCw size={16} className={resending ? "spin" : ""} />
          {resending ? "Reenviando..." : "Reenviar código"}
        </button>

        {/* Volver */}
        <button
          type="button"
          className="btn-volver"
          onClick={handleVolver}
        >
          <FiArrowLeft size={16} />
          Volver al inicio de sesión
        </button>

      </div>

      <footer>
        © 2026 Jorima - Universidad
      </footer>

    </main>
  );
}