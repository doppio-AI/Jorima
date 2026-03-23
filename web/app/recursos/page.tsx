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
  FiPhone,
  FiMail,
  FiMapPin,
  FiClock as FiHorario,
  FiAlertTriangle,
} from "react-icons/fi";

type Usuario = {
  id?: number;
  nombre?: string;
  correo?: string;
};

export default function RecursosPage() {

  const router = useRouter();
  const [usuario, setUsuario] = useState<Usuario | null>(null);

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
            <a className="sidebar-link" onClick={() => router.push("/usuarios")}>
              <FiHome size={20} />
              Inicio
            </a>

            <a className="sidebar-link" onClick={() => router.push("/historial")}>
              <FiClock size={20} />
              Mi Historial
            </a>

            <a className="sidebar-link active">
              <FiBookOpen size={20} />
              Recursos de Ayuda
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

        <div className="recursos-container">

          {/* CARD PRINCIPAL - DEPARTAMENTO */}
          <div className="recursos-card-principal">

            <div className="recursos-card-header">
              <h3>Departamento de Bienestar Psicológico</h3>
            </div>

            <div className="recursos-card-body">

              {/* INFO DE LA PSICÓLOGA */}
              <div className="recursos-profesional">
                <div className="recursos-avatar">
                  <FiUser size={28} />
                </div>
                <div className="recursos-profesional-info">
                  <strong>Dra. María Elena Rodríguez</strong>
                  <span>Psicóloga Clínica - Especialista en Bienestar Laboral y Organizacional</span>
                  <span>Colegiatura Profesional: PSI-12345</span>
                </div>
              </div>

              {/* GRID DE CONTACTO */}
              <div className="recursos-grid">

                <div className="recursos-dato">
                  <div className="recursos-dato-icon">
                    <FiPhone size={20} />
                  </div>
                  <div>
                    <strong>Teléfono</strong>
                    <span>+52 (442) 123-4567</span>
                    <span>Ext. 3456</span>
                  </div>
                </div>

                <div className="recursos-dato">
                  <div className="recursos-dato-icon">
                    <FiMail size={20} />
                  </div>
                  <div>
                    <strong>Correo Electrónico</strong>
                    <span>bienestar.psicologico@uteq.edu.mx</span>
                  </div>
                </div>

                <div className="recursos-dato">
                  <div className="recursos-dato-icon">
                    <FiMapPin size={20} />
                  </div>
                  <div>
                    <strong>Ubicación</strong>
                    <span>Edificio Administrativo, 2do Piso</span>
                    <span>Oficina 205 - Campus Central</span>
                  </div>
                </div>

                <div className="recursos-dato">
                  <div className="recursos-dato-icon">
                    <FiHorario size={20} />
                  </div>
                  <div>
                    <strong>Horario de Atención</strong>
                    <span>Lunes a Viernes</span>
                    <span>8:00 AM - 5:00 PM</span>
                  </div>
                </div>

              </div>

              {/* BOTÓN CITA */}
              <button className="recursos-btn-cita">
                Solicitar Cita Presencial
              </button>

            </div>

          </div>

          {/* CARD INFO IMPORTANTE */}
          <div className="recursos-card-info">

            <strong>Información Importante</strong>

            <div className="recursos-lista">
              <div className="recursos-lista-item">
                <span className="recursos-bullet">•</span>
                <p>Todas las consultas son estrictamente confidenciales</p>
              </div>
              <div className="recursos-lista-item">
                <span className="recursos-bullet">•</span>
                <p>Las citas pueden ser presenciales o virtuales según tu preferencia</p>
              </div>
              <div className="recursos-lista-item">
                <span className="recursos-bullet">•</span>
                <p>El servicio es gratuito para todos los colaboradores universitarios</p>
              </div>
              <div className="recursos-lista-item">
                <span className="recursos-bullet">•</span>
                <p>Se recomienda agendar cita con al menos 48 horas de anticipación</p>
              </div>
            </div>

          </div>

          {/* CARD EMERGENCIA */}
          <div className="recursos-card-emergencia">

            <div className="recursos-emergencia-header">
              <FiAlertTriangle size={20} />
              <strong>En Caso de Emergencia</strong>
            </div>

            <p>Si te encuentras en una situación de crisis o emergencia, contacta inmediatamente:</p>

            <div className="recursos-emergencia-contactos">
              <div className="recursos-emergencia-item">
                <FiPhone size={16} />
                <span>Línea de Crisis 24/7: <strong>800-911-2000</strong></span>
              </div>
              <div className="recursos-emergencia-item">
                <FiPhone size={16} />
                <span>Emergencias Universitarias: <strong>Ext. 911</strong></span>
              </div>
            </div>

          </div>

        </div>

      </main>
    </div>
  );
}