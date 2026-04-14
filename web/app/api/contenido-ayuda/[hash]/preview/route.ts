import path from "path";
import { promises as fs } from "fs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const UPLOAD_DIR = path.join(process.cwd(), "uploads");

const MIME_TYPES: Record<string, string> = {
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".mp4": "video/mp4",
  ".mov": "video/quicktime",
  ".txt": "text/plain",
  ".json": "application/json",
};

function getMimeType(fileName: string) {
  const ext = path.extname(fileName).toLowerCase();
  return MIME_TYPES[ext] ?? "application/octet-stream";
}

async function resolveFilePath(hash: string) {
  const content = await prisma.reporte.findFirst({ where: { hash } });
  if (content?.ruta) {
    const normalized = content.ruta.replace(/^\/+/, "");
    const filePath = path.join(process.cwd(), normalized);
    try {
      await fs.access(filePath);
      return { fileName: path.basename(filePath), filePath };
    } catch {}
  }

  const files = await fs.readdir(UPLOAD_DIR);
  const fileName = files.find((file) => file.startsWith(hash));
  if (!fileName) return null;
  return { fileName, filePath: path.join(UPLOAD_DIR, fileName) };
}

async function resolveStoredContent(hash: string) {
  const content = await prisma.reporte.findFirst({
    where: { hash },
    select: {
      nombre_archivo: true,
      mime_type: true,
      archivo_binario: true,
    },
  });

  if (!content?.archivo_binario) {
    return null;
  }

  return {
    fileName: content.nombre_archivo,
    mimeType: content.mime_type || getMimeType(content.nombre_archivo),
    fileBuffer: content.archivo_binario,
  };
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ hash: string }> }
) {
  const { hash } = await params;

  try {
    const storedContent = await resolveStoredContent(hash);
    if (storedContent) {
      return new Response(storedContent.fileBuffer, {
        headers: {
          "Content-Type": storedContent.mimeType,
          "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(storedContent.fileName)}`,
        },
      });
    }

    const file = await resolveFilePath(hash);
    if (!file) {
      return NextResponse.json({ error: "Archivo no encontrado" }, { status: 404 });
    }

    const fileBuffer = await fs.readFile(file.filePath);
    const mimeType = getMimeType(file.fileName);

    return new Response(fileBuffer, {
      headers: {
        "Content-Type": mimeType,
        "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(file.fileName)}`,
      },
    });
  } catch (error) {
    console.error("PREVIEW CONTENIDO AYUDA ERROR:", error);
    return NextResponse.json({ error: "Error al leer archivo" }, { status: 500 });
  }
}
