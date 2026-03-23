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

    const encuesta = await prisma.encuesta.findUnique({
      where: { encuesta_id: id },
      include: { usuario: true, edificio: true, respuesta: true },
    });

    if (!encuesta) return NextResponse.json({ error: "No encontrada" }, { status: 404 });

    return NextResponse.json(encuesta);
  } catch (error: unknown) {
    const mensaje = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: "Error al buscar encuesta", detalle: mensaje }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const id = getIdFromRequest(request);
    if (!id) return NextResponse.json({ error: "Debe enviar un id" }, { status: 400 });

    const body = await request.json();
    const updated = await prisma.encuesta.update({
      where: { encuesta_id: id },
      data: {
        titulo: body.titulo,
        descripcion: body.descripcion,
        edificio_id: body.edificio_id,
        creador_id: body.creador_id,
      },
    });

    return NextResponse.json(updated);
  } catch (error: unknown) {
    const mensaje = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: "Error al actualizar encuesta", detalle: mensaje }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const id = getIdFromRequest(request);
    if (!id) return NextResponse.json({ error: "Debe enviar un id" }, { status: 400 });

    await prisma.encuesta.delete({ where: { encuesta_id: id } });
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    const mensaje = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: "Error al eliminar encuesta", detalle: mensaje }, { status: 500 });
  }
}
