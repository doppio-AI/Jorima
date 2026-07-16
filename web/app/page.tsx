"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import CryptoJS from "crypto-js";
import JSEncrypt from "jsencrypt";

type LoginResponse = {
  ok?: boolean;
  message?: string;
  error?: string;
  usuario?: {
    id: number;
    usuario_id: number;
    tipo_usuario: number;
    correo: string;
    nombre: string;
    apellido_paterno?: string | null;
    apellido_materno?: string | null;
    edificio_id?: number | null;
    turno?: string | null;
  };
};

export default function Login() {
  const router = useRouter();

  const [publicKey, setPublicKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingKey, setLoadingKey] = useState(true);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    correo: "",
    contrasena: "",
  });

  /* ======================
     OBTENER CLAVE PÚBLICA
  ====================== */

  useEffect(() => {
    const obtenerPublicKey = async () => {
      try {
        const response = await fetch("/api/public-key", {
          method: "GET",
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok || !data.publicKey) {
          throw new Error(
            data.error || "No se pudo obtener la clave pública"
          );
        }

        setPublicKey(data.publicKey);
      } catch (error) {
        console.error("Error obteniendo la clave pública:", error);
        setError(
          "No fue posible preparar el inicio de sesión. Recarga la página."
        );
      } finally {
        setLoadingKey(false);
      }
    };

    obtenerPublicKey();
  }, []);

  /* ======================
     LOGIN
  ====================== */

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (loading) {
      return;
    }

    if (!publicKey) {
      setError(
        "La clave de seguridad todavía no está disponible. Recarga la página."
      );
      return;
    }

    const correo = form.correo.trim().toLowerCase();
    const contrasena = form.contrasena;

    if (!correo || !contrasena) {
      setError("Correo y contraseña son obligatorios.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      /* ── 1. Generar llave AES e IV ── */

      const aesKey = CryptoJS.lib.WordArray.random(32);
      const iv = CryptoJS.lib.WordArray.random(16);

      /* ── 2. Crear payload ── */

      const payload = JSON.stringify({
        correo,
        contrasena,
      });

      /* ── 3. Cifrar credenciales con AES-256-CBC ── */

      const encryptedData = CryptoJS.AES.encrypt(
        payload,
        aesKey,
        {
          iv,
          mode: CryptoJS.mode.CBC,
          padding: CryptoJS.pad.Pkcs7,
        }
      ).ciphertext.toString(CryptoJS.enc.Base64);

      /* ── 4. Cifrar la llave AES con RSA ── */

      const rsa = new JSEncrypt();
      rsa.setPublicKey(publicKey);

      const aesKeyHex = aesKey.toString(CryptoJS.enc.Hex);
      const encryptedKey = rsa.encrypt(aesKeyHex);

      if (!encryptedKey) {
        throw new Error("No se pudo cifrar la llave de seguridad");
      }

      /* ── 5. Enviar credenciales al backend ── */

      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify({
          encryptedData,
          encryptedKey,
          iv: CryptoJS.enc.Base64.stringify(iv),
        }),
      });

      const data = (await response.json()) as LoginResponse;

      if (!response.ok) {
        throw new Error(
          data.error || "Correo o contraseña incorrectos"
        );
      }

      if (!data.usuario) {
        throw new Error(
          "El servidor no devolvió la información del usuario"
        );
      }

      /*
       * No se crea la cookie desde JavaScript.
       * /api/login ya establece usuario y usuario_public.
       */

      const tipoUsuario = Number(data.usuario.tipo_usuario);

      /* ── 6. Redirigir según el rol ── */

      if (tipoUsuario === 1) {
        router.replace("/administrador");
      } else {
        router.replace("/usuarios");
      }

      router.refresh();
    } catch (error) {
      console.error("Error iniciando sesión:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Error al iniciar sesión"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center">
      <div className="header">
        <h1>Jorima</h1>
        <p>Plataforma de Bienestar Laboral</p>
      </div>

      <form onSubmit={handleSubmit} className="login-card">
        <h2>Iniciar Sesión</h2>

        <div className="form-group">
          <label htmlFor="correo">Correo Institucional</label>

          <input
            id="correo"
            name="correo"
            type="email"
            autoComplete="email"
            value={form.correo}
            onChange={(event) => {
              setForm((previous) => ({
                ...previous,
                correo: event.target.value,
              }));
              setError("");
            }}
            disabled={loading}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="contrasena">Contraseña</label>

          <input
            id="contrasena"
            name="contrasena"
            type="password"
            autoComplete="current-password"
            value={form.contrasena}
            onChange={(event) => {
              setForm((previous) => ({
                ...previous,
                contrasena: event.target.value,
              }));
              setError("");
            }}
            disabled={loading}
            required
          />
        </div>

        {error && <p className="error-text">{error}</p>}

        <button
          type="submit"
          className="btn-primary"
          disabled={loading || loadingKey || !publicKey}
        >
          {loadingKey
            ? "Preparando inicio de sesión..."
            : loading
              ? "Iniciando sesión..."
              : "Entrar"}
        </button>

        <a className="link link-primary" href="/registro">
          Registrarse
        </a>
      </form>

      <footer>© 2026 Jorima - Universidad</footer>
    </main>
  );
}