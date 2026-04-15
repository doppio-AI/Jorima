"use client";

import { useState } from "react";

export default function SubirPdfPage() {
  const [file, setFile] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleUpload = async () => {
    setError("");

    if (!file) {
      setError("Selecciona un PDF.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      setLoading(true);

      const res = await fetch("/api/upload-pdf", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error al subir PDF");
      }

      setPdfUrl(data.url);
      console.log("Cloudinary response:", data);
    } catch (err: any) {
      setError(err.message || "Error inesperado");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
      <h1>Subir PDF</h1>

      <input
        type="file"
        accept="application/pdf"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />

      <div style={{ marginTop: 16 }}>
        <button onClick={handleUpload} disabled={loading}>
          {loading ? "Subiendo..." : "Subir PDF"}
        </button>
      </div>

      {error && <p style={{ color: "red", marginTop: 16 }}>{error}</p>}

      {pdfUrl && (
        <section style={{ marginTop: 24 }}>
          <p>
            <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
              Abrir PDF
            </a>
          </p>

          <iframe
            src={pdfUrl}
            width="100%"
            height="700"
            style={{ border: "1px solid #ccc" }}
            title="Vista previa PDF"
          />
        </section>
      )}
    </main>
  );
}