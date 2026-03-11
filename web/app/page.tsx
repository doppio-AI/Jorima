"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import CryptoJS from "crypto-js";
import JSEncrypt from "jsencrypt";

export default function Login() {

  const router = useRouter();

  const [publicKey, setPublicKey] = useState("");

  const [form, setForm] = useState({
    correo: "",
    contrasena: "",
  });

  /* ======================
     OBTENER PUBLIC KEY
  ====================== */

  useEffect(() => {

    fetch("/api/public-key")
      .then(res => res.json())
      .then(data => {

        console.log("🔑 PUBLIC KEY RECIBIDA");

        setPublicKey(data.publicKey);

      });

  }, []);

  /* ======================
     LOGIN
  ====================== */

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {

    e.preventDefault();

    try {

      /* AES KEY */

      const aesKey = CryptoJS.lib.WordArray.random(32);
      const iv = CryptoJS.lib.WordArray.random(16);

      console.log("🔑 AES KEY:", aesKey.toString());
      console.log("🧪 IV:", iv.toString());

      /* PAYLOAD */

      const payload = JSON.stringify({
        correo: form.correo,
        contrasena: form.contrasena
      });

      /* CIFRAR DATOS */

      const encryptedData = CryptoJS.AES.encrypt(
        payload,
        aesKey,
        {
          iv,
          mode: CryptoJS.mode.CBC,
          padding: CryptoJS.pad.Pkcs7
        }
      ).ciphertext.toString(CryptoJS.enc.Base64);

      console.log("📦 DATA CIFRADA:", encryptedData);

      /* CIFRAR AES CON RSA */

      const rsa = new JSEncrypt();

      rsa.setPublicKey(publicKey);

      const aesKeyHex = aesKey.toString(CryptoJS.enc.Hex);

      const encryptedKey = rsa.encrypt(aesKeyHex);

      console.log("🔐 AES KEY HEX:", aesKeyHex);
      console.log("🔐 RSA RESULT:", encryptedKey);

      if (!encryptedKey) {

        alert("Error cifrando clave RSA");

        return;

      }

      /* ENVIAR LOGIN */

      const res = await fetch("/api/login", {

        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({

          encryptedData,
          encryptedKey,
          iv: CryptoJS.enc.Base64.stringify(iv)

        })

      });

      const data = await res.json();

      console.log("RESPUESTA:", data);

      if (res.ok) {

        /* guardar usuario */

        localStorage.setItem(
          "usuario",
          JSON.stringify(data.usuario)
        );

        /* redirigir dashboard */

        router.push("/usuarios");

      } else {

        alert(data.error || "Credenciales incorrectas");

      }

    } catch (error) {

      console.error("ERROR LOGIN:", error);

      alert("Error al iniciar sesión");

    }

  };

  return (

    <main className="flex flex-col items-center justify-center min-h-screen">

      <div className="header">
        <h1>Jorima</h1>
        <p>Plataforma de Bienestar Laboral</p>
      </div>

      <form onSubmit={handleSubmit} className="login-card">

        <h2>Iniciar Sesión</h2>

        <div className="form-group">

          <label>Correo Institucional</label>

          <input
            type="email"
            value={form.correo}
            onChange={(e) =>
              setForm({ ...form, correo: e.target.value })
            }
            required
          />

        </div>

        <div className="form-group">

          <label>Contraseña</label>

          <input
            type="password"
            value={form.contrasena}
            onChange={(e) =>
              setForm({ ...form, contrasena: e.target.value })
            }
            required
          />

        </div>

        <button type="submit" className="btn-primary">
          Entrar
        </button>

        <a className="link link-primary">
          ¿Olvidé mi contraseña?
        </a>

      </form>

      <footer>
        © 2026 Jorima - Universidad
      </footer>

    </main>

  );

}