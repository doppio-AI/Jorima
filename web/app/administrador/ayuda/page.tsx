"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import AdminSidebarSimple from "@/app/components/admin-sidebar-simple";
import { getPdfViewerUrl } from "@/lib/pdf-viewer";

type HelpDoc = {
  archivo_id: number;
  nombre_archivo: string;
  hash: string;
  categoria: string;
  descripcion: string;
  estado: string;
  fechaCreacion: string;
  tamanoBytes: number | null;
  ruta: string;
};

type ApiHelpDoc = {
  reporte_id: number;
  nombre_archivo: string;
  hash: string;
  tipo_seguimiento?: string | null;
  notas?: string | null;
  estado?: string | null;
  fecha_creacion?: string | null;
  nivel_urgencia?: string | null;
  tamano_bytes?: number | null;
  ruta?: string | null;
};

function getFriendlyDocumentName(fileName: string, categoria: string) {
  const trimmed = (fileName || "").trim();
  if (!trimmed) return `Guia de ${categoria}`;

  const hashLike = /^[a-f0-9]{40,}(\.[a-z0-9]+)?$/i.test(trimmed);
  if (!hashLike) return trimmed;

  const extMatch = trimmed.match(/\.([a-z0-9]+)$/i);
  const ext = extMatch ? extMatch[1].toUpperCase() : "DOC";
  return `Guia de ${categoria} (${ext})`;
}

function formatFileSize(bytes: number | null) {
  if (!bytes || bytes <= 0) return "Tamano no disponible";
  const mb = bytes / (1024 * 1024);
  if (mb >= 1) return `${mb.toFixed(2)} MB`;
  const kb = bytes / 1024;
  return `${kb.toFixed(1)} KB`;
}

function formatDate(value: string) {
  if (!value) return "Fecha no disponible";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Fecha no disponible";
  return date.toLocaleDateString("es-MX", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function statusColor(estado: string) {
  const normalized = (estado || "").toLowerCase();
  if (normalized.includes("public")) return "#1d7c71";
  if (normalized.includes("pend")) return "#b45309";
  if (normalized.includes("borr") || normalized.includes("rech")) return "#b91c1c";
  return "#0f4c81";
}

export default function ContenidoAyudaAdminPage() {
  const [rhId, setRhId] = useState<number | null>(null);
  const [docs, setDocs] = useState<HelpDoc[]>([]);
  const [searchQ, setSearchQ] = useState("");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const [file, setFile] = useState<File | null>(null);
  const [categoria, setCategoria] = useState<string>("Guía emocional");
  const [descripcion, setDescripcion] = useState<string>("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);

  const readCookie = (name: string) => {
    const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
    return match ? decodeURIComponent(match[1]) : null;
  };

  const localPreviewUrl = useMemo(() => {
    if (!file) return "";
    if (file.type !== "application/pdf") return "";
    return URL.createObjectURL(file);
  }, [file]);

  useEffect(() => {
    return () => {
      if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl);
    };
  }, [localPreviewUrl]);

  const loadDocs = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      params.set("scope", "admin");
      if (searchQ.trim()) params.set("q", searchQ.trim());

      const res = await fetch(`/api/contenido-ayuda?${params.toString()}`, {
        cache: "no-store",
      });

      const contenidos = (await res.json()) as ApiHelpDoc[];
      if (!Array.isArray(contenidos)) throw new Error("Datos inválidos");

      const mapped: HelpDoc[] = contenidos.map((r) => ({
        archivo_id: r.reporte_id,
        nombre_archivo: r.nombre_archivo,
        hash: r.hash,
        categoria: r.tipo_seguimiento ?? "General",
        descripcion: r.notas ?? "Sin descripción",
        estado: r.estado ?? "Publicado",
        fechaCreacion: r.fecha_creacion ?? "",
        tamanoBytes: r.tamano_bytes ?? null,
        ruta: r.ruta ?? "",
      }));

      setDocs(mapped);
      setSelectedIds((prev) =>
        prev.filter((id) => mapped.some((doc) => doc.archivo_id === id))
      );
    } catch (e) {
      console.error(e);
      setError("Error cargando contenido");
    }
  }, [searchQ]);

  const toggleSelection = (archivoId: number) => {
    setSelectedIds((prev) =>
      prev.includes(archivoId)
        ? prev.filter((id) => id !== archivoId)
        : [...prev, archivoId]
    );
  };

  const toggleSelectAllVisible = () => {
    const visibleIds = docs.map((doc) => doc.archivo_id);
    const allSelected =
      visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id));

    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
      return;
    }

    setSelectedIds((prev) => {
      const next = new Set(prev);
      visibleIds.forEach((id) => next.add(id));
      return Array.from(next);
    });
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;

    const shouldDelete = window.confirm(
      `Se eliminaran ${selectedIds.length} contenidos seleccionados. Esta accion no se puede deshacer.`
    );
    if (!shouldDelete) return;

    setDeleting(true);
    setError(null);

    try {
      const res = await fetch("/api/contenido-ayuda", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || "No se pudo eliminar el contenido seleccionado");
      }

      setSelectedIds([]);
      await loadDocs();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error eliminando contenido");
    } finally {
      setDeleting(false);
    }
  };

  const loadRhFromCookie = useCallback(() => {
    const raw = readCookie("usuario_public");
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw);
      if (parsed?.id) setRhId(parsed.id);
    } catch {}
  }, []);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      loadRhFromCookie();
      await loadDocs();
      setLoading(false);
    };

    void init();
  }, [loadDocs, loadRhFromCookie]);

  useEffect(() => {
    if (!loading) void loadDocs();
  }, [loadDocs, loading]);

  const handleUpload = async () => {
    if (!file) {
      setError("Selecciona un archivo");
      return;
    }

    if (file.type !== "application/pdf") {
      setError("Solo se permiten archivos PDF");
      return;
    }

    if (!rhId) {
      setError("Sesión inválida");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      if (file.size <= 0) {
        throw new Error("El archivo seleccionado está vacío");
      }

      const formData = new FormData();
      formData.append("file", file);
      formData.append("rh_id", String(rhId));
      formData.append("personal_id", String(rhId));
      formData.append("nivel_urgencia", "Baja");
      formData.append("tipo_seguimiento", categoria);
      formData.append("estado", "Publicado");
      formData.append("notas", descripcion);

      const res = await fetch("/api/contenido-ayuda", {
        method: "POST",
        body: formData,
      });

      const body = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(body?.error || "Error al subir archivo");
      }

      setFile(null);
      setDescripcion("");
      setCategoria("Guía emocional");
      setShowUploadForm(false);
      await loadDocs();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="dashboard-container">
      <AdminSidebarSimple active="ayuda" />

      <main className="dashboard-main">
        <div className="dashboard-header">
          <div className="admin-page-intro">
            <h1>Contenido de Ayuda</h1>
            <p>Material general publicado para todos los usuarios</p>
          </div>

          <button
            className="btn-primary"
            onClick={() => setShowUploadForm(!showUploadForm)}
          >
            {showUploadForm ? "Cancelar" : "+ Nuevo contenido"}
          </button>
        </div>

        {error && (
          <div
            style={{
              color: "#DC2626",
              background: "#FEF2F2",
              padding: 12,
              borderRadius: 8,
              marginBottom: 16,
            }}
          >
            {error}
          </div>
        )}

        {showUploadForm && (
          <div className="card admin-card-section" style={{ marginBottom: 24 }}>
            <h3 style={{ marginTop: 0 }}>Subir contenido de ayuda</h3>

            <div className="admin-form-grid">
              <div className="form-group">
                <label>Archivo (solo PDF)</label>
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />

                {file && (
                  <div
                    style={{
                      marginTop: 8,
                      fontSize: "0.9rem",
                      color: file.size > 0 ? "var(--neutral-700)" : "#B91C1C",
                    }}
                  >
                    {file.name} · {formatFileSize(file.size)}
                    {file.size <= 0 ? " · El archivo seleccionado está vacío" : ""}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>Categoría de contenido</label>
                <select
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                >
                  <option value="Guía emocional">Guía emocional</option>
                  <option value="Manejo del estrés">Manejo del estrés</option>
                  <option value="Autocuidado">Autocuidado</option>
                  <option value="Mindfulness">Mindfulness</option>
                  <option value="Orientación psicológica">
                    Orientación psicológica
                  </option>
                  <option value="Otro">Otro</option>
                </select>
              </div>

              <div className="form-group" style={{ gridColumn: "1/-1" }}>
                <label>Descripción (opcional)</label>
                <textarea
                  rows={3}
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Explica brevemente para qué sirve esta guía..."
                />
              </div>
            </div>

            {localPreviewUrl && (
              <div style={{ marginTop: 16 }}>
                <strong style={{ display: "block", marginBottom: 8 }}>
                  Vista previa antes de publicar
                </strong>
                <iframe
                  src={localPreviewUrl}
                  title="Vista previa local del PDF"
                  style={{
                    width: "100%",
                    height: 420,
                    border: "1px solid var(--neutral-200)",
                    borderRadius: 10,
                    background: "#fff",
                  }}
                />
              </div>
            )}

            <div className="admin-actions" style={{ marginTop: 16 }}>
              <button
                className="btn-primary"
                onClick={handleUpload}
                disabled={uploading}
              >
                {uploading ? "Subiendo..." : "Publicar contenido"}
              </button>
            </div>
          </div>
        )}

        <div className="admin-filterbar">
          <input
            className="search-input"
            type="text"
            placeholder="Buscar guías y contenido..."
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
          />

          <button
            type="button"
            className="btn-volver"
            onClick={toggleSelectAllVisible}
            disabled={docs.length === 0}
            style={{ minWidth: 168 }}
          >
            {docs.length > 0 &&
            docs.every((doc) => selectedIds.includes(doc.archivo_id))
              ? "Quitar selección"
              : "Seleccionar visibles"}
          </button>

          <button
            type="button"
            className="btn-danger"
            onClick={handleDeleteSelected}
            disabled={selectedIds.length === 0 || deleting}
            style={{ minWidth: 200 }}
          >
            {deleting
              ? "Eliminando..."
              : `Eliminar seleccionados (${selectedIds.length})`}
          </button>
        </div>

        {loading ? (
          <div
            style={{
              textAlign: "center",
              padding: 60,
              color: "var(--neutral-500)",
            }}
          >
            Cargando contenido...
          </div>
        ) : docs.length === 0 ? (
          <div className="admin-empty-state">No hay contenido que mostrar</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {docs.map((d) => (
              <div
                key={d.archivo_id}
                className="historial-card"
                style={{
                  border: "1px solid var(--neutral-300)",
                  borderRadius: 12,
                  overflow: "hidden",
                  background: "#fff",
                }}
              >
                <div
                  className="historial-card-header"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "16px 20px",
                    gap: 16,
                  }}
                >
                  <div
                    className="historial-card-left admin-report-meta"
                    style={{ display: "flex", flexDirection: "column", gap: 2 }}
                  >
                    <strong style={{ color: "var(--neutral-900)" }}>
                      {getFriendlyDocumentName(d.nombre_archivo, d.categoria)}
                    </strong>
                    <span className="help-doc-secondary">{d.categoria}</span>
                    <span className="help-doc-secondary">{d.descripcion}</span>
                    <span className="help-doc-meta">
                      {formatDate(d.fechaCreacion)} · {formatFileSize(d.tamanoBytes)}
                    </span>
                  </div>

                  <div className="help-card-header-actions">
                    <label className="help-select-label">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(d.archivo_id)}
                        onChange={() => toggleSelection(d.archivo_id)}
                      />
                      Seleccionar
                    </label>

                    <div
                      className="admin-status-badge"
                      style={{ background: statusColor(d.estado) }}
                    >
                      {d.estado}
                    </div>
                  </div>
                </div>

                {d.ruta ? (
                  <div style={{ padding: "0 20px 16px 20px" }}>
                    <iframe
                      src={getPdfViewerUrl(d.ruta)}
                      title={d.nombre_archivo}
                      style={{
                        width: "100%",
                        height: 420,
                        border: "1px solid var(--neutral-200)",
                        borderRadius: 10,
                        background: "#fff",
                      }}
                    />
                  </div>
                ) : (
                  <div
                    style={{
                      padding: "0 20px 16px 20px",
                      color: "#B91C1C",
                      fontSize: "0.9rem",
                    }}
                  >
                    Este contenido no tiene URL disponible.
                  </div>
                )}

                <div
                  className="admin-actions help-card-actions"
                  style={{
                    padding: "12px 20px",
                    borderTop: "1px solid var(--neutral-200)",
                  }}
                >
                  <a
                    className="btn-primary"
                    href={d.ruta}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      textDecoration: "none",
                      textAlign: "center",
                      fontSize: "0.85rem",
                      pointerEvents: d.ruta ? "auto" : "none",
                      opacity: d.ruta ? 1 : 0.5,
                    }}
                  >
                    Ver
                  </a>

                  <a
                    className="btn-volver"
                    href={d.ruta}
                    download
                    style={{
                      textDecoration: "none",
                      textAlign: "center",
                      fontSize: "0.85rem",
                      pointerEvents: d.ruta ? "auto" : "none",
                      opacity: d.ruta ? 1 : 0.5,
                    }}
                  >
                    Descargar
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}