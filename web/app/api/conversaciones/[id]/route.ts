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

    const conversacion = await prisma.conversacion.findUnique({
      where: { conversacion_id: id },
      include: { usuario: true, mensaje: true },
    });
    if (!conversacion) return NextResponse.json({ error: "No encontrada" }, { status: 404 });

    return NextResponse.json(conversacion);
  } catch (error: unknown) {
    const mensaje = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: "Error al buscar conversación", detalle: mensaje }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const id = getIdFromRequest(request);
    if (!id) return NextResponse.json({ error: "Debe enviar un id" }, { status: 400 });

    const body = await request.json();
    const updated = await prisma.conversacion.update({
      where: { conversacion_id: id },
      data: { usuario_id: body.usuario_id, titulo: body.titulo, activa: body.activa },
    });

    return NextResponse.json(updated);
  } catch (error: unknown) {
    const mensaje = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: "Error al actualizar conversacion", detalle: mensaje }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const id = getIdFromRequest(request);
    if (!id) return NextResponse.json({ error: "Debe enviar un id" }, { status: 400 });

    await prisma.conversacion.delete({ where: { conversacion_id: id } });
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    const mensaje = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: "Error al eliminar conversacion", detalle: mensaje }, { status: 500 });
  }
}
