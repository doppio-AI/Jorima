"use client";

import { useState } from "react";
import PdfViewer from "./PdfViewer";

export default function PdfUploader() {
  const [file, setFile] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleUpload = async () => {
    setError("");

    if (!file) {
      setError("Selecciona un archivo PDF.");
      return;
    }

    if (file.type !== "application/pdf") {
      setError("El archivo debe ser un PDF.");
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload-pdf", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error al subir el PDF");
      }

      setPdfUrl(data.url);
    } catch (err: any) {
      setError(err.message || "Ocurrió un error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
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

      {error && <p style={{ color: "red", marginTop: 12 }}>{error}</p>}

      <PdfViewer url={pdfUrl} />
    </div>
  );
}