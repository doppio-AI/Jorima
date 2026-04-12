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
} from "react-icons/fi";

type Usuario = {
  id?: number;
  nombre?: string;
  correo?: string;
};

type HelpContent = {
  id: number;
  hash: string;
  categoria: string;
  descripcion: string;
};

export default function RecursosPage() {

  const router = useRouter();
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [helpContent, setHelpContent] = useState<HelpContent[]>([]);
  const [loadingHelp, setLoadingHelp] = useState(true);
  const [helpError, setHelpError] = useState<string | null>(null);

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

  useEffect(() => {
    const loadHelpContent = async () => {
      try {
        setLoadingHelp(true);
        setHelpError(null);
        const res = await fetch("/api/contenido-ayuda", { cache: "no-store" });
        if (!res.ok) throw new Error("No se pudo cargar el contenido de ayuda");

        const data = await res.json();
        if (!Array.isArray(data)) throw new Error("Formato inválido de respuesta");

        const mapped = data.map((item: any) => ({
          id: item.reporte_id,
          hash: item.hash,
          categoria: item.tipo_seguimiento || "General",
          descripcion: item.notas || "Sin descripción",
        }));

        setHelpContent(mapped);
      } catch (error) {
        setHelpError(error instanceof Error ? error.message : "Error cargando recursos");
      } finally {
        setLoadingHelp(false);
      }
    };

    loadHelpContent();
  }, []);

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
          <div className="recursos-card-info">
            <strong>Guías Emocionales y Contenido de Ayuda</strong>
            <p style={{ marginTop: 10, color: "var(--neutral-600)" }}>
              Consulta material recomendado por administración para gestionar emociones,
              fortalecer hábitos saludables y mejorar tu bienestar diario.
            </p>

            {loadingHelp ? (
              <p style={{ marginTop: 12, color: "var(--neutral-500)" }}>Cargando recursos...</p>
            ) : helpError ? (
              <p style={{ marginTop: 12, color: "#DC2626" }}>{helpError}</p>
            ) : helpContent.length === 0 ? (
              <p style={{ marginTop: 12, color: "var(--neutral-500)" }}>
                Aún no hay contenido publicado por administración.
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 12 }}>
                {helpContent.map((doc) => (
                  <div
                    key={doc.id}
                    style={{
                      border: "1px solid var(--neutral-300)",
                      borderRadius: 10,
                      padding: 12,
                      display: "flex",
                      flexDirection: "column",
                      gap: 6,
                    }}
                  >
                    <strong>{doc.categoria}</strong>
                    <span style={{ fontSize: "0.9rem" }}>{doc.descripcion}</span>
                    <div className="admin-actions" style={{ marginTop: 4 }}>
                      <a
                        className="btn-primary"
                        href={`/api/contenido-ayuda/${doc.hash}/preview`}
                        target="_blank"
                        rel="noreferrer"
                        style={{ textDecoration: "none", textAlign: "center", fontSize: "0.85rem" }}
                      >
                        Ver
                      </a>
                      <a
                        className="btn-volver"
                        href={`/api/contenido-ayuda/${doc.hash}/download`}
                        style={{ textDecoration: "none", textAlign: "center", fontSize: "0.85rem" }}
                      >
                        Descargar
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </main>
    </div>
  );
}