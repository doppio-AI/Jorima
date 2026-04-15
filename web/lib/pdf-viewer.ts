export function getPdfViewerUrl(url: string) {
  if (!url) return "";

  // Para Cloudinary PDFs correctamente entregados como image/pdf
  return url;

  // Si luego vuelves a tener problemas con algún proveedor,
  // aquí centralizas el ajuste y no en 20 vistas.
}