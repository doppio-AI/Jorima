import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";


// OBTENER TODOS
export async function GET() {
  try {
    const usuarios = await prisma.usuario.findMany();
    return NextResponse.json(usuarios);
  } catch (error) {
    return NextResponse.json(
      { error: "Error al obtener usuarios" },
      { status: 500 }
    );
  }
}


// CREAR USUARIO
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
        edificio: body.edificio,
        turno: body.turno
      },
    });

    return NextResponse.json(nuevoUsuario);
  } catch (error) {
    return NextResponse.json(
      { error: "Error al crear usuario" },
      { status: 500 }
    );
  }
}