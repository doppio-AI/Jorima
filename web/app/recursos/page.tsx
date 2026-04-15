"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FiHome,
  FiClock,
  FiBookOpen,
  FiLogOut,
  FiUser,
  FiExternalLink,
  FiDownload,
  FiShield, // <-- Ícono del escudo agregado
} from "react-icons/fi";
import { getPdfViewerUrl } from "@/lib/pdf-viewer";

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
  ruta: string;
  nombre_archivo: string;
};

export default function RecursosPage() {
  const router = useRouter();

  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [helpContent, setHelpContent] = useState<HelpContent[]>([]);
  const [loadingHelp, setLoadingHelp] = useState(true);
  const [helpError, setHelpError] = useState<string | null>(null);

  const readCookie = (name: string) => {
    const match = document.cookie.match(
      new RegExp(`(?:^|; )${name}=([^;]*)`)
    );
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
      } catch {
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

        const res = await fetch("/api/contenido-ayuda", {
          cache: "no-store",
        });

        if (!res.ok) {
          throw new Error("No se pudo cargar el contenido de ayuda");
        }

        const data = await res.json();

        if (!Array.isArray(data)) {
          throw new Error("Formato inválido de respuesta");
        }

        const mapped = data.map((item: any) => ({
          id: item.reporte_id,
          hash: item.hash,
          categoria: item.tipo_seguimiento || "General",
          descripcion: item.notas || "Sin descripción",
          ruta: item.ruta || "",
          nombre_archivo: item.nombre_archivo || "Documento sin nombre",
        }));

        setHelpContent(mapped);
      } catch (error) {
        setHelpError(
          error instanceof Error ? error.message : "Error cargando recursos"
        );
      } finally {
        setLoadingHelp(false);
      }
    };

    loadHelpContent();
  }, []);

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
    } catch {
      window.location.href = "/";
    }
  };

  return (
    <div className="dashboard-container">
      <aside className="sidebar">
        <div>
          <div className="sidebar-logo">
            <img
              src="/logo.jpeg"
              alt="Jorima"
              style={{ width: "100%", maxWidth: "160px", height: "auto" }}
            />
          </div>

          <nav>
            <a className="sidebar-link" onClick={() => router.push("/usuarios")}>
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

            <a className="sidebar-link active">
              <FiBookOpen size={20} />
              Recursos de Ayuda
            </a>

            {/* AVISO DE PRIVACIDAD */}
            <a className="sidebar-link" onClick={() => window.open("/aviso-privacidad", "_blank")}>
              <FiShield size={20} />
              Aviso de Privacidad
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

      <main className="dashboard-main">
        <div className="dashboard-header">
          <h1>Hola, {usuario?.nombre || usuario?.correo}</h1>
        </div>

        <div className="recursos-container">
          <div className="recursos-card-info">
            <strong>Guías Emocionales y Contenido de Ayuda</strong>

            <p style={{ marginTop: 10, color: "var(--neutral-600)" }}>
              Consulta material recomendado por administración para gestionar
              emociones, fortalecer hábitos saludables y mejorar tu bienestar
              diario.
            </p>

            {loadingHelp ? (
              <p style={{ marginTop: 12, color: "var(--neutral-500)" }}>
                Cargando recursos...
              </p>
            ) : helpError ? (
              <p style={{ marginTop: 12, color: "#DC2626" }}>{helpError}</p>
            ) : helpContent.length === 0 ? (
              <p style={{ marginTop: 12, color: "var(--neutral-500)" }}>
                Aún no hay contenido publicado por administración.
              </p>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                  marginTop: 12,
                }}
              >
                {helpContent.map((doc) => (
                  <div
                    key={doc.id}
                    style={{
                      border: "1px solid var(--neutral-300)",
                      borderRadius: 10,
                      padding: 12,
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                      background: "#fff",
                    }}
                  >
                    <strong>{doc.categoria}</strong>

                    <span style={{ fontSize: "0.95rem", fontWeight: 500 }}>
                      {doc.nombre_archivo}
                    </span>

                    <span style={{ fontSize: "0.9rem" }}>{doc.descripcion}</span>

                    {doc.ruta ? (
                      <iframe
                        src={getPdfViewerUrl(doc.ruta)}
                        title={doc.nombre_archivo}
                        style={{
                          width: "100%",
                          height: "320px",
                          border: "1px solid var(--neutral-200)",
                          borderRadius: 8,
                          marginTop: 6,
                          background: "#fff",
                        }}
                      />
                    ) : (
                      <span style={{ fontSize: "0.85rem", color: "#DC2626" }}>
                        Este recurso no tiene URL disponible.
                      </span>
                    )}

                    <div
                      className="admin-actions"
                      style={{
                        marginTop: 4,
                        display: "flex",
                        gap: 8,
                        flexWrap: "wrap",
                      }}
                    >
                      <a
                        className="btn-primary"
                        href={doc.ruta}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          textDecoration: "none",
                          textAlign: "center",
                          fontSize: "0.85rem",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          pointerEvents: doc.ruta ? "auto" : "none",
                          opacity: doc.ruta ? 1 : 0.5,
                        }}
                      >
                        <FiExternalLink size={16} />
                        Ver
                      </a>

                      <a
                        className="btn-volver"
                        href={doc.ruta}
                        download
                        style={{
                          textDecoration: "none",
                          textAlign: "center",
                          fontSize: "0.85rem",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          pointerEvents: doc.ruta ? "auto" : "none",
                          opacity: doc.ruta ? 1 : 0.5,
                        }}
                      >
                        <FiDownload size={16} />
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