type PdfViewerProps = {
  url: string;
};

export default function PdfViewer({ url }: PdfViewerProps) {
  if (!url) return null;

  return (
    <section style={{ marginTop: 24 }}>
      <p>
        <a href={url} target="_blank" rel="noopener noreferrer">
          Abrir PDF en otra pestaña
        </a>
      </p>

      <iframe
        src={url}
        width="100%"
        height="700"
        style={{ border: "1px solid #ccc", borderRadius: "8px" }}
        title="Vista previa PDF"
      />
    </section>
  );
}