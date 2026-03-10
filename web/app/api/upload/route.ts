import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
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

    if (!file || !usuario_id || !personal_id) {
      return NextResponse.json(
        { error: "Datos incompletos" },
        { status: 400 }
      );
    }

    // verificar RH
    const usuario = await prisma.usuario.findUnique({
      where: { usuario_id }
    });

    if (!usuario || usuario.tipo_usuario !== 1) {
      return NextResponse.json(
        { error: "Solo RH puede crear seguimientos" },
        { status: 403 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const uploadDir = path.join(process.cwd(), "uploads");
    await fs.mkdir(uploadDir, { recursive: true });

    const uniqueName = `${Date.now()}-${file.name}`;
    const filePath = path.join(uploadDir, uniqueName);

    await fs.writeFile(filePath, buffer);

    const hash = crypto
      .createHash("sha256")
      .update(buffer)
      .digest("hex");

    const data: Prisma.seguimiento_rhUncheckedCreateInput = {
      personal_id: personal_id,
      rh_id: usuario_id,
      nivel_urgencia: nivel_urgencia as any,
      tipo_seguimiento: tipo_seguimiento as any,
      estado: "Pendiente",
      notas: notas,
      ruta: filePath   
    };

    const seguimiento = await prisma.seguimiento_rh.create({
      data
    });

    const archivo = await prisma.archivo_seguimiento.create({
      data: {
        nombre: uniqueName,
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

    console.error(error);

    return NextResponse.json(
      { error: "Error al subir archivo" },
      { status: 500 }
    );
  }
}