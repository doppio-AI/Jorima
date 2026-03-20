import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    const usuarios = await prisma.usuario.findMany({
      include: {
        edificio: true,
      },
    });

    return NextResponse.json(usuarios);
  } catch (error: unknown) {
    const mensaje =
      error instanceof Error ? error.message : "Error desconocido";

    return NextResponse.json(
      { error: "Error al obtener usuarios", detalle: mensaje },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const passwordHash = await bcrypt.hash(body.contrasena, 10);

    const nuevoUsuario = await prisma.usuario.create({
      data: {
        tipo_usuario: body.tipo_usuario,
        correo: body.correo,
        nombre: body.nombre,
        apellido_paterno: body.apellido_paterno,
        apellido_materno: body.apellido_materno,
        contrasena: passwordHash,
        edificio_id: body.edificio_id,
        turno: body.turno,
      },
    });

    return NextResponse.json(nuevoUsuario);
  } catch (error: unknown) {
    const mensaje =
      error instanceof Error ? error.message : "Error desconocido";

    return NextResponse.json(
      { error: "Error al crear usuario", detalle: mensaje },
      { status: 500 }
    );
  }
}