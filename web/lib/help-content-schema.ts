import { prisma } from "@/lib/prisma";

let binarySupportPromise: Promise<boolean> | null = null;

type ColumnRow = { column_name: string };

async function queryBinaryColumns() {
  const rows = await prisma.$queryRawUnsafe<ColumnRow[]>(`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'reporte'
      AND column_name IN ('mime_type', 'tamano_bytes', 'archivo_binario')
  `);

  const names = new Set(rows.map((row) => row.column_name));
  return (
    names.has("mime_type") &&
    names.has("tamano_bytes") &&
    names.has("archivo_binario")
  );
}

export async function hasHelpContentBinarySupport() {
  if (!binarySupportPromise) {
    binarySupportPromise = queryBinaryColumns().catch(() => false);
  }

  return binarySupportPromise;
}

const LEGACY_PREFIX = "__JORIMA_FILE__:";

export function serializeLegacyNotas(notas: string, mimeType: string, buffer: Buffer) {
  const header = `${LEGACY_PREFIX}${mimeType};base64,${buffer.toString("base64")}`;
  const body = (notas || "").trim();
  return body ? `${header}\n${body}` : header;
}

export function extractLegacyFileFromNotas(notas: string | null | undefined) {
  if (!notas || !notas.startsWith(LEGACY_PREFIX)) {
    return null;
  }

  const lineBreakIndex = notas.indexOf("\n");
  const encodedLine = lineBreakIndex >= 0 ? notas.slice(0, lineBreakIndex) : notas;
  const payload = encodedLine.slice(LEGACY_PREFIX.length);
  const separatorIndex = payload.indexOf(";base64,");
  if (separatorIndex < 0) {
    return null;
  }

  const mimeType = payload.slice(0, separatorIndex) || "application/octet-stream";
  const base64 = payload.slice(separatorIndex + ";base64,".length);
  if (!base64) {
    return null;
  }

  try {
    const buffer = Buffer.from(base64, "base64");
    return { mimeType, buffer };
  } catch {
    return null;
  }
}

export function cleanLegacyNotas(notas: string | null | undefined) {
  if (!notas || !notas.startsWith(LEGACY_PREFIX)) {
    return notas ?? "";
  }

  const lineBreakIndex = notas.indexOf("\n");
  if (lineBreakIndex < 0) {
    return "";
  }

  return notas.slice(lineBreakIndex + 1);
}