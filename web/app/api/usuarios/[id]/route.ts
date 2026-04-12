import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// OBTENER UNO
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.pathname.split("/").pop();
    if (!id) {
      return NextResponse.json({ error: "Debe enviar un id" }, { status: 400 });
    }

    const usuario = await prisma.usuario.findUnique({
          where: { usuario_id: Number(id) },
          include: {
            edificio: true,
          },
        });

    if (!usuario) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    return NextResponse.json(usuario);
  } catch (error) {
    return NextResponse.json({ error: "Error al obtener usuario" }, { status: 500 });
  }
}

// ACTUALIZAR
export async function PUT(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.pathname.split("/").pop();

    if (!id) {
      return NextResponse.json({ error: "Debe enviar un id" }, { status: 400 });
    }

    const body = await request.json();

    const dataToUpdate: any = { ...body };
    if (body.contrasena) {
      dataToUpdate.contrasena = await bcrypt.hash(body.contrasena, 10);
    }

    const usuarioActualizado = await prisma.usuario.update({
      where: { usuario_id: Number(id) },
      data: dataToUpdate,
    });

    return NextResponse.json(usuarioActualizado);
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ELIMINAR
export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.pathname.split("/").pop();

    if (!id) {
      return NextResponse.json({ error: "Debe enviar un id" }, { status: 400 });
    }

    await prisma.usuario.delete({
      where: { usuario_id: Number(id) },
    });

    return NextResponse.json({ message: "Usuario eliminado" });
  } catch (error) {
    return NextResponse.json({ error: "Error al eliminar usuario" }, { status: 500 });
  }
}