"use client";

import { useState } from "react";

export default function Registro() {
  const [form, setForm] = useState({
    tipo_usuario: 2,
    correo: "",
    nombre: "",
    apellido_paterno: "",
    apellido_materno: "",
    contrasena: "",
    confirmContrasena: "",
    edificio: "",
    turno: "Matutino",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.contrasena !== form.confirmContrasena) {
      alert("Las contraseñas no coinciden");
      return;
    }
    const res = await fetch("/api/usuarios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      alert("Cuenta creada con éxito");
    } else {
      alert("Error al registrar");
    }
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Crear Cuenta Institucional</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-2 w-80">
        <input placeholder="Correo Institucional" type="email"
          onChange={e => setForm({...form, correo: e.target.value})}/>
        <input placeholder="Nombre"
          onChange={e => setForm({...form, nombre: e.target.value})}/>
        <input placeholder="Apellido Paterno"
          onChange={e => setForm({...form, apellido_paterno: e.target.value})}/>
        <input placeholder="Apellido Materno"
          onChange={e => setForm({...form, apellido_materno: e.target.value})}/>
        <input placeholder="Contraseña" type="password"
          onChange={e => setForm({...form, contrasena: e.target.value})}/>
        <input placeholder="Confirmar Contraseña" type="password"
          onChange={e => setForm({...form, confirmContrasena: e.target.value})}/>
        <input placeholder="Edificio"
          onChange={e => setForm({...form, edificio: e.target.value})}/>
        <select onChange={e => setForm({...form, turno: e.target.value})}>
          <option value="Matutino">Matutino</option>
          <option value="Vespertino">Vespertino</option>
        </select>
        <select onChange={e => setForm({...form, tipo_usuario: Number(e.target.value)})}>
          <option value={1}>Recursos Humanos</option>
          <option value={2}>Personal</option>
        </select>
        <button type="submit" className="bg-blue-600 text-white py-2 rounded">Registrar</button>
      </form>
      <a href="/login" className="mt-4 text-blue-600">← Volver al Inicio de Sesión</a>
    </main>
  );
}