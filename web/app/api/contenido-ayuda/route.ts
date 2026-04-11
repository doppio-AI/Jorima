import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { promises as fs } from "fs";
import path from "path";
import type { Prisma } from "@prisma/client";

const UPLOAD_DIR = path.join(process.cwd(), "uploads");

async function saveFile(file: File) {
  const buffer = Buffer.from(await file.arrayBuffer());
  const hash = crypto.createHash("sha256").update(buffer).digest("hex");
  const ext = path.extname(file.name).toLowerCase();
  const fileName = `${hash}${ext}`;

  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  const filePath = path.join(UPLOAD_DIR, fileName);

  try {
    await fs.access(filePath);
  } catch {
    await fs.writeFile(filePath, buffer);
  }

  return { fileName, relativePath: `/uploads/${fileName}`, hash };
}

function sanitizeOriginalName(name: string) {
  const cleaned = (name || "").replace(/[\\/:*?"<>|]/g, "_").trim();
  if (!cleaned) return "documento-ayuda";
  return cleaned.slice(0, 255);
}

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file") as File;
      const usuario_rh_id = Number(formData.get("rh_id"));
      const personalInForm = Number(formData.get("personal_id"));
      const usuario_personal_id = personalInForm > 0 ? personalInForm : usuario_rh_id;
      const nivel_urgencia = (formData.get("nivel_urgencia") as string) || "Baja";
      const tipo_seguimiento = (formData.get("tipo_seguimiento") as string) || "Guía emocional";
      const estado = (formData.get("estado") as string) || "Publicado";
      const notas = (formData.get("notas") as string) || "";

      if (!file || !usuario_rh_id) {
        return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
      }

      const usuario = await prisma.usuario.findUnique({ where: { usuario_id: usuario_rh_id } });
      if (!usuario || usuario.tipo_usuario !== 1) {
        return NextResponse.json({ error: "Solo RH puede publicar contenido" }, { status: 403 });
      }

      const { relativePath, hash } = await saveFile(file);

      const reporte = await prisma.reporte.create({
        data: {
          nivel_urgencia,
          tipo_seguimiento,
          estado,
          notas,
          nombre_archivo: sanitizeOriginalName(file.name),
          ruta: relativePath,
          hash,
          usuario_reporte_usuario_rh_idTousuario: { connect: { usuario_id: usuario_rh_id } },
          usuario_reporte_usuario_personal_idTousuario: { connect: { usuario_id: usuario_personal_id } },
        },
      });

      return NextResponse.json({ message: "Contenido publicado correctamente", reporte });
    }

    return NextResponse.json({ error: "Content-Type inválido" }, { status: 400 });
  } catch (error) {
    console.error("UPLOAD ERROR:", error);
    return NextResponse.json({ error: "Error al publicar contenido" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const scope = url.searchParams.get("scope") || "public";
    const q = url.searchParams.get("q")?.toLowerCase() || "";
    const categoria = url.searchParams.get("categoria")?.toLowerCase() || "";

    const where: Prisma.reporteWhereInput = {};
    if (scope !== "admin") {
      where.estado = "Publicado";
    }
    if (q) {
      where.OR = [
        { nombre_archivo: { contains: q } },
        { notas: { contains: q } },
        { tipo_seguimiento: { contains: q } },
      ];
    }
    if (categoria) {
      where.tipo_seguimiento = { contains: categoria };
    }

    const reportes = await prisma.reporte.findMany({
      where,
      include: {
        usuario_reporte_usuario_rh_idTousuario: true,
        usuario_reporte_usuario_personal_idTousuario: { include: { edificio: true } },
      },
      orderBy: { fecha_creacion: "desc" },
    });

    const enriched = await Promise.all(
      reportes.map(async (reporte) => {
        let tamano_bytes: number | null = null;
        try {
          const normalized = reporte.ruta.replace(/^\/+/, "");
          const filePath = path.join(process.cwd(), normalized);
          const stats = await fs.stat(filePath);
          tamano_bytes = stats.size;
        } catch {
          tamano_bytes = null;
        }

        return { ...reporte, tamano_bytes };
      })
    );

    return NextResponse.json(enriched);
  } catch (error) {
    console.error("GET CONTENIDO AYUDA ERROR:", error);
    return NextResponse.json({ error: "Error al obtener contenido" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { reporte_id, nivel_urgencia, tipo_seguimiento, estado, notas } = body;

    const reporte = await prisma.reporte.update({
      where: { reporte_id },
      data: { nivel_urgencia, tipo_seguimiento, estado, notas },
    });

    return NextResponse.json({ message: "Contenido actualizado", reporte });
  } catch (error) {
    console.error("UPDATE CONTENIDO AYUDA ERROR:", error);
    return NextResponse.json({ error: "Error al actualizar contenido" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const idFromQuery = Number(searchParams.get("id"));

    let ids: number[] = [];
    if (idFromQuery > 0) {
      ids = [idFromQuery];
    } else {
      const body = await request.json().catch(() => null);
      if (Array.isArray(body?.ids)) {
        ids = body.ids
          .map((value: unknown) => Number(value))
          .filter((value: number) => Number.isInteger(value) && value > 0);
      }
    }

    if (ids.length === 0) {
      return NextResponse.json({ error: "Debes indicar al menos un ID" }, { status: 400 });
    }

    const reportes = await prisma.reporte.findMany({
      where: { reporte_id: { in: ids } },
      select: { reporte_id: true, ruta: true },
    });

    await Promise.all(
      reportes.map(async (reporte) => {
        const filePath = path.join(UPLOAD_DIR, path.basename(reporte.ruta));
        try {
          await fs.unlink(filePath);
        } catch {}
      })
    );

    const deleted = await prisma.reporte.deleteMany({
      where: { reporte_id: { in: reportes.map((r) => r.reporte_id) } },
    });

    return NextResponse.json({ message: "Contenido eliminado", deleted: deleted.count });
  } catch (error) {
    console.error("DELETE CONTENIDO AYUDA ERROR:", error);
    return NextResponse.json({ error: "Error al eliminar contenido" }, { status: 500 });
  }
}

export async function getContentByHash(hash: string) {
  return prisma.reporte.findFirst({ where: { hash } });
}
