import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { promises as fs } from "fs";
import path from "path";

export async function POST(request: Request) {
  try {

    const formData = await request.formData();

    const file = formData.get("file") as File;

    const usuario_id = Number(formData.get("usuario_id"));
    const personal_id = Number(formData.get("personal_id"));
    const nivel_urgencia = formData.get("nivel_urgencia") as string;
    const tipo_seguimiento = formData.get("tipo_seguimiento") as string;
    const notas = (formData.get("notas") as string) || "";

    // Validar datos
    if (!file || typeof file === "string" || !usuario_id || !personal_id) {
      return NextResponse.json(
        { error: "Datos incompletos" },
        { status: 400 }
      );
    }

    // Verificar que el usuario sea RH
    const usuario = await prisma.usuario.findUnique({
      where: { usuario_id }
    });

    if (!usuario || usuario.tipo_usuario !== 1) {
      return NextResponse.json(
        { error: "Solo RH puede crear seguimientos" },
        { status: 403 }
      );
    }

    // Convertir archivo a buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Generar hash SHA256 del archivo
    const hash = crypto
      .createHash("sha256")
      .update(buffer)
      .digest("hex");

    // Obtener extensión del archivo
    const ext = path.extname(file.name);

    // Usar hash como nombre del archivo
    const fileName = `${hash}${ext}`;

    // Crear carpeta uploads si no existe
    const uploadDir = path.join(process.cwd(), "uploads");
    await fs.mkdir(uploadDir, { recursive: true });

    const filePath = path.join(uploadDir, fileName);

    // Guardar archivo SOLO si no existe (evita duplicados)
    try {
      await fs.access(filePath);
    } catch {
      await fs.writeFile(filePath, buffer);
    }

    // Ruta relativa para la BD
    const relativePath = `/uploads/${fileName}`;

    // Crear seguimiento
    const seguimiento = await prisma.seguimiento_rh.create({
      data: {
        nivel_urgencia: nivel_urgencia,
        tipo_seguimiento: tipo_seguimiento,
        estado: "Pendiente",
        notas: notas,
        ruta: relativePath,

        usuario_personal: {
          connect: { usuario_id: personal_id }
        },

        usuario_rh: {
          connect: { usuario_id: usuario_id }
        }
      }
    });

    // Registrar archivo
    const archivo = await prisma.archivo_seguimiento.create({
      data: {
        nombre: fileName,
        hash: hash,
        seguimiento_id: seguimiento.seguimiento_id
      }
    });

    return NextResponse.json({
      message: "Seguimiento y archivo creados correctamente",
      seguimiento,
      archivo,
      hash
    });

  } catch (error) {

    console.error("UPLOAD ERROR:", error);

    return NextResponse.json(
      { error: "Error al subir archivo" },
      { status: 500 }
    );

  }
}