"use client";

import { useEffect, useMemo, useState } from "react";
import AdminSidebarSimple from "@/app/components/admin-sidebar-simple";

type Edificio = { edificio_id: number; nombre: string };
type Usuario = { usuario_id: number; nombre: string; tipo_usuario: number };
type ReportDoc = {
  archivo_id: number;
  nombre_archivo: string;
  hash: string;
  seguimiento?: {
    seguimiento_id: number;
    nivel_urgencia: string;
    tipo_seguimiento: string;
    estado: string;
    notas: string | null;
    personal_alias: string;
    rh_alias: string;
    edificio_id: number;
    edificio_nombre: string;
  };
};

const riskLevelColor = (estado: string) => {
  const s = (estado || "").toLowerCase();
  if (s.includes("pend")) return "#F59E0B";
  if (s.includes("apro")) return "#16A34A";
  if (s.includes("rech") || s.includes("cancel")) return "#DC2626";
  return "#0F4C81";
};

export default function ReportesAdminPage() {
  const [rhId, setRhId] = useState<number | null>(null);
  const [edificios, setEdificios] = useState<Edificio[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [docs, setDocs] = useState<ReportDoc[]>([]);
  const [edificioFilter, setEdificioFilter] = useState<number | "">("");
  const [searchQ, setSearchQ] = useState("");

  const [file, setFile] = useState<File | null>(null);
  const [personalId, setPersonalId] = useState<number | "">("");
  const [nivelUrgencia, setNivelUrgencia] = useState<string>("Media");
  const [tipoSeguimiento, setTipoSeguimiento] = useState<string>("Seguimiento");
  const [notas, setNotas] = useState<string>("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);

  const readCookie = (name: string) => {
    const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
    return match ? decodeURIComponent(match[1]) : null;
  };

  const loadMeta = async () => {
    try {
      const [edificioRes, usuariosRes] = await Promise.all([
        fetch("/api/edificios", { cache: "no-store" }),
        fetch("/api/usuarios", { cache: "no-store" }),
      ]);
      const edificiosJson: Edificio[] = await edificioRes.json();
      const usuariosJson: Usuario[] = await usuariosRes.json();
      setEdificios(Array.isArray(edificiosJson) ? edificiosJson : []);
      setUsuarios(Array.isArray(usuariosJson) ? usuariosJson : []);
    } catch (e) {
      console.error(e);
      setError("Error cargando edificios/usuarios");
    }
  };

  const loadDocs = async () => {
    try {
      const params = new URLSearchParams();
      if (edificioFilter !== "") params.set("edificio_id", String(edificioFilter));
      if (searchQ.trim()) params.set("q", searchQ.trim());
      const res = await fetch(`/api/reportes?${params.toString()}`, { cache: "no-store" });
      const reportes = await res.json();
      if (!Array.isArray(reportes)) throw new Error("Datos inválidos");

      const mapped: ReportDoc[] = reportes.map((r: any) => ({
        archivo_id: r.reporte_id,
        nombre_archivo: r.nombre_archivo,
        hash: r.hash,
        seguimiento: r
          ? {
              seguimiento_id: r.reporte_id,
              nivel_urgencia: r.nivel_urgencia,
              tipo_seguimiento: r.tipo_seguimiento,
              estado: r.estado,
              notas: r.notas,
              personal_alias: r.usuario_personal?.nombre ?? "",
              rh_alias: r.usuario_rh?.nombre ?? "",
              edificio_id: r.usuario_personal?.edificio_id ?? 0,
              edificio_nombre: r.usuario_personal?.edificio?.nombre ?? "",
            }
          : undefined,
      }));
      setDocs(mapped);
    } catch (e) {
      console.error(e);
      setError("Error cargando reportes");
    }
  };

  const loadRhFromCookie = () => {
    const raw = readCookie("usuario_public");
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      if (parsed?.id) setRhId(parsed.id);
    } catch {}
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await loadMeta();
      loadRhFromCookie();
      await loadDocs();
      setLoading(false);
    };
    init();
  }, []);

  useEffect(() => {
    if (!loading) void loadDocs();
  }, [edificioFilter, searchQ]);

  const personalOptions = useMemo(() => usuarios.filter((u) => u.tipo_usuario === 2), [usuarios]);

  const handleUpload = async () => {
    if (!file) return setError("Selecciona un archivo");
    if (!rhId) return setError("Sesión inválida");
    if (!personalId) return setError("Selecciona el personal");

    setUploading(true);
    setError(null);

    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("rh_id", String(rhId));
      fd.append("personal_id", String(personalId));
      fd.append("nivel_urgencia", nivelUrgencia);
      fd.append("tipo_seguimiento", tipoSeguimiento);
      fd.append("notas", notas);

      // <-- Aquí apunta a /api/reportes para que coincida con tu backend
      const res = await fetch("/api/reportes", { method: "POST", body: fd });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || "Error al subir archivo");
      }

      setFile(null);
      setPersonalId("");
      setNotas("");
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
      <AdminSidebarSimple active="reportes" />
      <main className="dashboard-main">
        <div className="dashboard-header">
          <div>
            <h1>Reportes de Seguimiento</h1>
            <p style={{ color: "var(--neutral-500)", margin: 0 }}>Archivos de seguimiento de Recursos Humanos</p>
          </div>
          <button className="btn-primary" onClick={() => setShowUploadForm(!showUploadForm)}>
            {showUploadForm ? "Cancelar" : "+ Nuevo reporte"}
          </button>
        </div>

        {error && <div style={{ color: "#DC2626", background: "#FEF2F2", padding: 12, borderRadius: 8, marginBottom: 16 }}>{error}</div>}

        {showUploadForm && (
          <div className="card" style={{ marginBottom: 24, padding: 24 }}>
            <h3 style={{ marginTop: 0 }}>Subir nuevo reporte</h3>
            <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
              <div className="form-group">
                <label>Archivo (PDF, imagen)</label>
                <input type="file" accept=".pdf,.png,.jpg,.jpeg,.webp" onChange={e => setFile(e.target.files?.[0] || null)} />
              </div>
              <div className="form-group">
                <label>Personal</label>
                <select value={personalId} onChange={e => setPersonalId(Number(e.target.value))}>
                  <option value="">Seleccionar...</option>
                  {personalOptions.map(u => <option key={u.usuario_id} value={u.usuario_id}>{u.nombre}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Nivel de urgencia</label>
                <select value={nivelUrgencia} onChange={e => setNivelUrgencia(e.target.value)}>
                  <option value="Baja">Baja</option>
                  <option value="Media">Media</option>
                  <option value="Alta">Alta</option>
                  <option value="Crítica">Crítica</option>
                </select>
              </div>
              <div className="form-group">
                <label>Tipo de seguimiento</label>
                <select value={tipoSeguimiento} onChange={e => setTipoSeguimiento(e.target.value)}>
                  <option value="Seguimiento">Seguimiento</option>
                  <option value="Incidente">Incidente</option>
                  <option value="Evaluación">Evaluación</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>
              <div className="form-group" style={{ gridColumn: "1/-1" }}>
                <label>Notas (opcional)</label>
                <textarea rows={3} value={notas} onChange={e => setNotas(e.target.value)} placeholder="Observaciones adicionales..." />
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
              <button className="btn-primary" onClick={handleUpload} disabled={uploading}>{uploading ? "Subiendo..." : "Subir reporte"}</button>
            </div>
          </div>
        )}

        <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
          <input className="search-input" type="text" placeholder="Buscar reportes..." value={searchQ} onChange={e => setSearchQ(e.target.value)} />
          <select className="filter-select" value={edificioFilter} onChange={e => setEdificioFilter(e.target.value === "" ? "" : Number(e.target.value))}>
            <option value="">Todos los edificios</option>
            {edificios.map(e => <option key={e.edificio_id} value={e.edificio_id}>{e.nombre}</option>)}
          </select>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: 60, color: "var(--neutral-500)" }}>Cargando reportes...</div>
        ) : docs.length === 0 ? (
          <div style={{ textAlign: "center", padding: 60, color: "var(--neutral-500)" }}>No hay reportes que mostrar</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {docs.map(d => (
              <div key={d.archivo_id} className="historial-card" style={{ border: "1px solid var(--neutral-300)", borderRadius: 12, overflow: "hidden" }}>
                <div className="historial-card-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px" }}>
                  <div className="historial-card-left" style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <strong style={{ color: "var(--neutral-900)" }}>{d.nombre_archivo}</strong>
                    <span style={{ fontSize: "0.82rem", color: "var(--neutral-500)" }}>{d.seguimiento?.edificio_nombre ?? "Sin edificio"} · {d.seguimiento?.tipo_seguimiento ?? "Sin tipo"}</span>
                    <span style={{ fontSize: "0.82rem", color: "var(--neutral-500)" }}>Estado: {d.seguimiento?.estado ?? "N/A"} · Urgencia: {d.seguimiento?.nivel_urgencia ?? "N/A"}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{
                      background: riskLevelColor(d.seguimiento?.estado ?? ""),
                      color: "white",
                      padding: "6px 12px",
                      borderRadius: 999,
                      fontSize: "0.82rem",
                      fontWeight: 600
                    }}>{d.seguimiento?.estado ?? "Sin estado"}</div>
                  </div>
                </div>
                <div style={{ padding: "12px 20px", display: "flex", gap: 10, borderTop: "1px solid var(--neutral-200)" }}>
                  <a className="btn-primary" href={`/api/reportes/${d.hash}/preview`} target="_blank" rel="noreferrer" style={{ textDecoration: "none", textAlign: "center", fontSize: "0.85rem" }}>Ver</a>
                  <a className="btn-volver" href={`/api/reportes/${d.hash}/download`} style={{ textDecoration: "none", textAlign: "center", fontSize: "0.85rem" }}>Descargar</a>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}