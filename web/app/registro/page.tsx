"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import CryptoJS from "crypto-js";
import JSEncrypt from "jsencrypt";

import { FiSmile, FiEye, FiEyeOff } from "react-icons/fi";

type Edificio = {
  edificio_id: number;
  nombre: string;
};

export default function Registro() {

  const router = useRouter();

  const [publicKey, setPublicKey] = useState("");
  const [edificios, setEdificios] = useState<Edificio[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ESTADO PARA EL AVISO DE PRIVACIDAD
  const [aceptaPrivacidad, setAceptaPrivacidad] = useState(false);

  const [form, setForm] = useState({
    tipo_usuario: 2,
    correo: "",
    nombre: "",
    apellido_paterno: "",
    apellido_materno: "",
    contrasena: "",
    confirmContrasena: "",
    edificio_id: "",
    turno: "",
  });

  /* =========================
     CARGAR DATOS INICIALES
  ========================= */

  useEffect(() => {
    /* Obtener clave pública RSA */
    fetch("/api/public-key")
      .then((res) => res.json())
      .then((data) => setPublicKey(data.publicKey));

    /* Obtener lista de edificios */
    fetch("/api/edificios")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setEdificios(data);
      });
  }, []);

  /* =========================
     VALIDACIONES
  ========================= */

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!form.nombre.trim()) {
      newErrors.nombre = "El nombre es requerido";
    }

    if (!form.apellido_paterno.trim()) {
      newErrors.apellido_paterno = "El apellido paterno es requerido";
    }

    if (!form.correo.trim()) {
      newErrors.correo = "El correo es requerido";
    } else if (!form.correo.endsWith("@uteq.edu.mx")) {
      newErrors.correo = "Debe ser un correo institucional @uteq.edu.mx";
    }

    if (!form.contrasena) {
      newErrors.contrasena = "La contraseña es requerida";
    } else if (form.contrasena.length < 8) {
      newErrors.contrasena = "La contraseña debe tener al menos 8 caracteres";
    }

    if (!form.confirmContrasena) {
      newErrors.confirmContrasena = "Confirma tu contraseña";
    } else if (form.contrasena !== form.confirmContrasena) {
      newErrors.confirmContrasena = "Las contraseñas no coinciden";
    }

    if (!form.edificio_id) {
      newErrors.edificio_id = "Selecciona un edificio";
    }

    if (!form.turno) {
      newErrors.turno = "Selecciona un turno";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /* =========================
     REGISTRO
  ========================= */

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // VALIDACIÓN DEL AVISO DE PRIVACIDAD
    if (!aceptaPrivacidad) {
      alert("Debes aceptar el Aviso de Privacidad para continuar.");
      return;
    }

    if (!validate()) return;

    setLoading(true);

    try {
      const res = await fetch("/api/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo_usuario: form.tipo_usuario,
          correo: form.correo.toLowerCase().trim(),
          nombre: form.nombre.trim(),
          apellido_paterno: form.apellido_paterno.trim(),
          apellido_materno: form.apellido_materno.trim(),
          contrasena: form.contrasena,
          edificio_id: Number(form.edificio_id),
          turno: form.turno,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        alert("¡Cuenta creada con éxito! Ahora puedes iniciar sesión.");
        router.push("/");
      } else {
        if (data.detalle?.includes("Unique constraint")) {
          setErrors({ correo: "Este correo ya está registrado" });
        } else {
          alert(data.error || "Error al registrar");
        }
      }
    } catch (error) {
      alert("Error al conectar con el servidor");
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     ACTUALIZAR CAMPO
  ========================= */

  const updateField = (field: string, value: string) => {
    setForm({ ...form, [field]: value });
    /* Limpiar error del campo al escribir */
    if (errors[field]) {
      setErrors({ ...errors, [field]: "" });
    }
  };

  return (
    <main className="registro-page">

      {/* HEADER */}
      <div className="registro-brand">
        <div className="registro-logo">
          <FiSmile size={32} color="#2A9D8F" />
          <span>Jorima</span>
        </div>
        <p>Plataforma de Bienestar Laboral</p>
      </div>

      {/* FORM CARD */}
      <form onSubmit={handleSubmit} className="registro-card">

        <h2>Crear Cuenta Institucional</h2>

        {/* NOMBRE */}
        <div className="registro-group">
          <label>Nombre(s)</label>
          <input
            type="text"
            placeholder="Juan"
            value={form.nombre}
            onChange={(e) => updateField("nombre", e.target.value)}
            className={errors.nombre ? "input-error" : ""}
          />
          {errors.nombre && <span className="error-text">{errors.nombre}</span>}
        </div>

        {/* APELLIDO PATERNO */}
        <div className="registro-group">
          <label>Apellido Paterno</label>
          <input
            type="text"
            placeholder="Pérez"
            value={form.apellido_paterno}
            onChange={(e) => updateField("apellido_paterno", e.target.value)}
            className={errors.apellido_paterno ? "input-error" : ""}
          />
          {errors.apellido_paterno && <span className="error-text">{errors.apellido_paterno}</span>}
        </div>

        {/* APELLIDO MATERNO */}
        <div className="registro-group">
          <label>Apellido Materno <span className="optional">(Opcional)</span></label>
          <input
            type="text"
            placeholder="García"
            value={form.apellido_materno}
            onChange={(e) => updateField("apellido_materno", e.target.value)}
          />
        </div>

        {/* CORREO */}
        <div className="registro-group">
          <label>Correo Institucional</label>
          <input
            type="email"
            placeholder="tu.correo@uteq.edu.mx"
            value={form.correo}
            onChange={(e) => updateField("correo", e.target.value)}
            className={errors.correo ? "input-error" : ""}
          />
          {errors.correo && <span className="error-text">{errors.correo}</span>}
        </div>

        {/* EDIFICIO */}
        <div className="registro-group">
          <label>Edificio</label>
          <select
            value={form.edificio_id}
            onChange={(e) => updateField("edificio_id", e.target.value)}
            className={errors.edificio_id ? "input-error" : ""}
          >
            <option value="">Selecciona un edificio</option>
            {edificios.map((ed) => (
              <option key={ed.edificio_id} value={ed.edificio_id}>
                {ed.nombre}
              </option>
            ))}
          </select>
          {errors.edificio_id && <span className="error-text">{errors.edificio_id}</span>}
        </div>

        {/* TURNO */}
        <div className="registro-group">
          <label>Turno</label>
          <select
            value={form.turno}
            onChange={(e) => updateField("turno", e.target.value)}
            className={errors.turno ? "input-error" : ""}
          >
            <option value="">Selecciona un turno</option>
            <option value="Matutino">Matutino</option>
            <option value="Vespertino">Vespertino</option>
          </select>
          {errors.turno && <span className="error-text">{errors.turno}</span>}
        </div>

        {/* ROL */}
        <div className="registro-group">
          <label>Tipo de Usuario</label>
          <select
            value={form.tipo_usuario}
            onChange={(e) => updateField("tipo_usuario", e.target.value)}
          >
            <option value={2}>Personal Docente/Administrativo</option>
            <option value={1}>Recursos Humanos</option>
          </select>
        </div>

        {/* CONTRASEÑA */}
        <div className="registro-group">
          <label>Contraseña</label>
          <div className="password-wrapper">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Mínimo 8 caracteres"
              value={form.contrasena}
              onChange={(e) => updateField("contrasena", e.target.value)}
              className={errors.contrasena ? "input-error" : ""}
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
            </button>
          </div>
          {errors.contrasena && <span className="error-text">{errors.contrasena}</span>}
        </div>

        {/* CONFIRMAR CONTRASEÑA */}
        <div className="registro-group">
          <label>Confirmar Contraseña</label>
          <div className="password-wrapper">
            <input
              type={showConfirm ? "text" : "password"}
              placeholder="Repite tu contraseña"
              value={form.confirmContrasena}
              onChange={(e) => updateField("confirmContrasena", e.target.value)}
              className={errors.confirmContrasena ? "input-error" : ""}
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowConfirm(!showConfirm)}
            >
              {showConfirm ? <FiEyeOff size={18} /> : <FiEye size={18} />}
            </button>
          </div>
          {errors.confirmContrasena && <span className="error-text">{errors.confirmContrasena}</span>}
        </div>

        {/* CHECKBOX AVISO DE PRIVACIDAD */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", marginTop: "16px", marginBottom: "24px" }}>
          <input
            type="checkbox"
            id="privacidad"
            checked={aceptaPrivacidad}
            onChange={(e) => setAceptaPrivacidad(e.target.checked)}
            required
            style={{ marginTop: "4px", width: "18px", height: "18px", cursor: "pointer", accentColor: "#0F4C81" }}
          />
          <label htmlFor="privacidad" style={{ fontSize: "14px", color: "#4A5568", lineHeight: "1.5" }}>
            He leído y acepto el{" "}
            <Link 
              href="/aviso-privacidad" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ color: "#0F4C81", fontWeight: "600", textDecoration: "underline" }}
            >
              Aviso de Privacidad
            </Link>
            . Entiendo que mis datos serán tratados de forma confidencial.
          </label>
        </div>

        {/* BOTÓN */}
        <button
          type="submit"
          className="btn-registro"
          disabled={loading}
        >
          {loading ? "Registrando..." : "Registrar"}
        </button>

        {/* LINK VOLVER */}
        <button
          type="button"
          className="btn-volver"
          onClick={() => router.push("/")}
        >
          ← Volver al Inicio de Sesión
        </button>

      </form>

      {/* FOOTER */}
      <footer className="registro-footer">
        © 2026 Jorima - Universidad. Todos los derechos reservados.
      </footer>

    </main>
  );
}