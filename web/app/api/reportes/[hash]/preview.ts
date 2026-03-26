import { NextResponse } from "next/server";
import path from "path";
import { promises as fs } from "fs";

const UPLOAD_DIR = path.join(process.cwd(), "uploads");

export async function GET(request: Request, { params }: { params: { hash: string } }) {
  const { hash } = params;
  try {
    const files = await fs.readdir(UPLOAD_DIR);
    const fileName = files.find(f => f.startsWith(hash));
    if (!fileName) return NextResponse.json({ error: "Archivo no encontrado" }, { status: 404 });

    const fileBuffer = await fs.readFile(path.join(UPLOAD_DIR, fileName));
    const ext = path.extname(fileName).toLowerCase();

    let mimeType = "application/octet-stream";
    if (ext === ".pdf") mimeType = "application/pdf";
    else if ([".png", ".jpg", ".jpeg", ".webp"].includes(ext)) mimeType = `image/${ext.slice(1)}`;

    return new Response(fileBuffer, { headers: { "Content-Type": mimeType } });
  } catch (error) {
    return NextResponse.json({ error: "Error al leer archivo" }, { status: 500 });
  }
}