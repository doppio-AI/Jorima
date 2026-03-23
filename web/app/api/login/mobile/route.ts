import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { correo, contrasena } = body;

    if (!correo || !contrasena) {
      return NextResponse.json(
        { error: "Correo y contraseña son obligatorios" },
        { status: 400 }
      );
    }

    const user = await prisma.usuario.findUnique({
      where: { correo },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    const validPassword = await bcrypt.compare(contrasena, user.contrasena);

    if (!validPassword) {
      return NextResponse.json(
        { error: "Credenciales inválidas" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      message: "Login exitoso",
      usuario: {
        id: user.usuario_id,
        nombre: user.nombre,
        correo: user.correo,
        tipo_usuario: user.tipo_usuario,
        edificio_id: user.edificio_id,
        turno: user.turno,
      },
    });
  } catch (error) {
    console.error("LOGIN MOBILE ERROR:", error);

    return NextResponse.json(
      { error: "Error interno en login móvil" },
      { status: 500 }
    );
  }
}