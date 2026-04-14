import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function getIdFromRequest(request: Request) {
  const url = new URL(request.url);
  const id = url.pathname.split("/").pop();
  return id ? Number(id) : null;
}

export async function GET(request: Request) {
  try {
    const id = getIdFromRequest(request);
    if (!id) return NextResponse.json({ error: "Debe enviar un id" }, { status: 400 });

    const edificio = await prisma.edificio.findUnique({
      where: { edificio_id: id },
      include: { usuario: true, respuesta: true },
    });
    if (!edificio) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

    return NextResponse.json(edificio);
  } catch (error: unknown) {
    const mensaje = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: "Error al buscar edificio", detalle: mensaje }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const id = getIdFromRequest(request);
    if (!id) return NextResponse.json({ error: "Debe enviar un id" }, { status: 400 });

    const body = await request.json();
    const updated = await prisma.edificio.update({
      where: { edificio_id: id },
      data: { nombre: body.nombre, descripcion: body.descripcion },
    });

    return NextResponse.json(updated);
  } catch (error: unknown) {
    const mensaje = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: "Error al actualizar edificio", detalle: mensaje }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const id = getIdFromRequest(request);
    if (!id) return NextResponse.json({ error: "Debe enviar un id" }, { status: 400 });

    await prisma.edificio.delete({ where: { edificio_id: id } });
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    const mensaje = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: "Error al eliminar edificio", detalle: mensaje }, { status: 500 });
  }
}
