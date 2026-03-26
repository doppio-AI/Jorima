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

    return new Response(fileBuffer, {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: "Error al descargar archivo" }, { status: 500 });
  }
}