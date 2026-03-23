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

    const mensaje = await prisma.mensaje.findUnique({
      where: { mensaje_id: id },
      include: { conversacion: true },
    });
    if (!mensaje) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

    return NextResponse.json(mensaje);
  } catch (error: unknown) {
    const mensajeError = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: "Error al buscar mensaje", detalle: mensajeError }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const id = getIdFromRequest(request);
    if (!id) return NextResponse.json({ error: "Debe enviar un id" }, { status: 400 });

    const body = await request.json();
    const updated = await prisma.mensaje.update({
      where: { mensaje_id: id },
      data: {
        conversacion_id: body.conversacion_id,
        role: body.role,
        texto: body.texto,
      },
    });
    return NextResponse.json(updated);
  } catch (error: unknown) {
    const mensajeError = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: "Error al actualizar mensaje", detalle: mensajeError }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const id = getIdFromRequest(request);
    if (!id) return NextResponse.json({ error: "Debe enviar un id" }, { status: 400 });

    await prisma.mensaje.delete({ where: { mensaje_id: id } });
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    const mensajeError = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: "Error al eliminar mensaje", detalle: mensajeError }, { status: 500 });
  }
}
