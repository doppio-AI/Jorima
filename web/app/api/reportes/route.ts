// app/api/reportes/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { promises as fs } from "fs";
import path from "path";
import type { Prisma } from "@prisma/client";

const UPLOAD_DIR = path.join(process.cwd(), "uploads");

// --- Función para guardar archivo y generar hash ---
async function saveFile(file: File) {
  const buffer = Buffer.from(await file.arrayBuffer());
  const hash = crypto.createHash("sha256").update(buffer).digest("hex");
  const ext = path.extname(file.name).toLowerCase() || "";
  const fileName = `${hash}${ext}`;

  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  const filePath = path.join(UPLOAD_DIR, fileName);

  try {
    await fs.access(filePath);
  } catch {
    await fs.writeFile(filePath, buffer);
  }

  return {
    fileName,
    relativePath: `/uploads/${fileName}`,
    hash,
  };
}

// --- POST: Crear nuevo reporte ---
export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") || "";

    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json(
        { error: "Content-Type inválido. Se esperaba multipart/form-data" },
        { status: 400 }
      );
    }

    const formData = await request.formData();

    const file = formData.get("file");
    const usuario_rh_id = Number(formData.get("rh_id"));
    const usuario_personal_id = Number(formData.get("personal_id"));
    const nivel_urgencia = String(formData.get("nivel_urgencia") || "Media");
    const tipo_seguimiento = String(formData.get("tipo_seguimiento") || "Seguimiento");
    const notas = String(formData.get("notas") || "");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Archivo inválido o faltante" }, { status: 400 });
    }

    if (!usuario_rh_id || !usuario_personal_id) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }

    const usuario = await prisma.usuario.findUnique({
      where: { usuario_id: usuario_rh_id },
    });

    if (!usuario || usuario.tipo_usuario !== 1) {
      return NextResponse.json(
        { error: "Solo RH puede crear reportes" },
        { status: 403 }
      );
    }

    const { fileName, relativePath, hash } = await saveFile(file);

    const reporte = await prisma.reporte.create({
      data: {
        nivel_urgencia,
        tipo_seguimiento,
        estado: "Pendiente",
        notas,
        nombre_archivo: fileName,
        ruta: relativePath,
        hash,
        usuario_reporte_usuario_rh_idTousuario: {
          connect: { usuario_id: usuario_rh_id },
        },
        usuario_reporte_usuario_personal_idTousuario: {
          connect: { usuario_id: usuario_personal_id },
        },
      },
      include: {
        usuario_reporte_usuario_rh_idTousuario: true,
        usuario_reporte_usuario_personal_idTousuario: {
          include: { edificio: true },
        },
      },
    });

    return NextResponse.json(
      { message: "Reporte creado correctamente", reporte },
      { status: 201 }
    );
  } catch (error) {
    console.error("UPLOAD ERROR:", error);
    return NextResponse.json(
      { error: "Error al crear reporte" },
      { status: 500 }
    );
  }
}

// --- GET: Listar reportes ---
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const edificio_id = url.searchParams.get("edificio_id");
    const q = url.searchParams.get("q")?.trim() || "";

    const where: Prisma.reporteWhereInput = {};

    if (edificio_id) {
      where.usuario_reporte_usuario_personal_idTousuario = {
        is: {
          edificio_id: Number(edificio_id),
        },
      };
    }

    if (q) {
      where.OR = [
        {
          nombre_archivo: {
            contains: q,
            mode: "insensitive",
          },
        },
        {
          notas: {
            contains: q,
            mode: "insensitive",
          },
        },
      ];
    }

    const reportes = await prisma.reporte.findMany({
      where,
      include: {
        usuario_reporte_usuario_rh_idTousuario: true,
        usuario_reporte_usuario_personal_idTousuario: {
          include: { edificio: true },
        },
      },
      orderBy: { fecha_creacion: "desc" },
    });

    return NextResponse.json(reportes);
  } catch (error) {
    console.error("GET REPORTES ERROR:", error);
    return NextResponse.json(
      { error: "Error al obtener reportes" },
      { status: 500 }
    );
  }
}

// --- PUT: Actualizar reporte ---
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { reporte_id, nivel_urgencia, tipo_seguimiento, estado, notas } = body;

    if (!reporte_id) {
      return NextResponse.json(
        { error: "reporte_id es requerido" },
        { status: 400 }
      );
    }

    const reporte = await prisma.reporte.update({
      where: { reporte_id: Number(reporte_id) },
      data: {
        ...(nivel_urgencia !== undefined && { nivel_urgencia }),
        ...(tipo_seguimiento !== undefined && { tipo_seguimiento }),
        ...(estado !== undefined && { estado }),
        ...(notas !== undefined && { notas }),
      },
    });

    return NextResponse.json({
      message: "Reporte actualizado",
      reporte,
    });
  } catch (error) {
    console.error("UPDATE ERROR:", error);
    return NextResponse.json(
      { error: "Error al actualizar reporte" },
      { status: 500 }
    );
  }
}

// --- DELETE: Eliminar reporte ---
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const reporte_id = Number(searchParams.get("id"));

    if (!reporte_id) {
      return NextResponse.json({ error: "ID requerido" }, { status: 400 });
    }

    const reporte = await prisma.reporte.findUnique({
      where: { reporte_id },
    });

    if (!reporte) {
      return NextResponse.json(
        { error: "Reporte no encontrado" },
        { status: 404 }
      );
    }

    const filePath = path.join(UPLOAD_DIR, path.basename(reporte.ruta));

    try {
      await fs.unlink(filePath);
    } catch {
      // Si no existe el archivo, no detenemos la eliminación del registro
    }

    await prisma.reporte.delete({
      where: { reporte_id },
    });

    return NextResponse.json({ message: "Reporte eliminado" });
  } catch (error) {
    console.error("DELETE ERROR:", error);
    return NextResponse.json(
      { error: "Error al eliminar reporte" },
      { status: 500 }
    );
  }
}

// --- Función auxiliar para buscar por hash ---
export async function getReportByHash(hash: string) {
  return prisma.reporte.findFirst({
    where: { hash },
  });
}