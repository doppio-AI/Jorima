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

    const respuesta = await prisma.respuesta.findUnique({
      where: { respuesta_id: id },
      include: { encuesta: true },
    });
    if (!respuesta) return NextResponse.json({ error: "No encontrada" }, { status: 404 });

    return NextResponse.json(respuesta);
  } catch (error: unknown) {
    const mensaje = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: "Error al buscar respuesta", detalle: mensaje }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const id = getIdFromRequest(request);
    if (!id) return NextResponse.json({ error: "Debe enviar un id" }, { status: 400 });

    const body = await request.json();
    const updated = await prisma.respuesta.update({
      where: { respuesta_id: id },
      data: { encuesta_id: body.encuesta_id, respuesta: body.respuesta },
    });

    return NextResponse.json(updated);
  } catch (error: unknown) {
    const mensaje = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: "Error al actualizar respuesta", detalle: mensaje }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const id = getIdFromRequest(request);
    if (!id) return NextResponse.json({ error: "Debe enviar un id" }, { status: 400 });

    await prisma.respuesta.delete({ where: { respuesta_id: id } });
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    const mensaje = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: "Error al eliminar respuesta", detalle: mensaje }, { status: 500 });
  }
}
