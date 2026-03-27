import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const getId = (id: string) => {
  const num = Number(id);
  return isNaN(num) ? null : num;
};

// =====================================================
// ✅ GET
// =====================================================
export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // 🔥 AQUÍ ESTÁ LA CORRECCIÓN
    const { id: paramId } = await context.params;

    const id = getId(paramId);

    if (id === null) {
      return NextResponse.json(
        { error: "ID inválido" },
        { status: 400 }
      );
    }

    const respuesta = await prisma.respuesta.findUnique({
      where: { respuesta_id: id },
    });

    if (!respuesta) {
      return NextResponse.json(
        { error: "No encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(respuesta);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Error en GET" },
      { status: 500 }
    );
  }
}

// =====================================================
// ✅ PUT
// =====================================================
export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: paramId } = await context.params;

    const id = getId(paramId);

    if (id === null) {
      return NextResponse.json(
        { error: "ID inválido" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { respuestas } = body;

    if (!respuestas || typeof respuestas !== "object") {
      return NextResponse.json(
        { error: "respuestas inválidas" },
        { status: 400 }
      );
    }

    const valoresValidos = ["muy mal", "mal", "regular", "bien", "muy bien"];

    for (const key in respuestas) {
      const valor = String(respuestas[key]).toLowerCase();

      if (!valoresValidos.includes(valor)) {
        return NextResponse.json(
          { error: `Valor inválido en "${key}"` },
          { status: 400 }
        );
      }
    }

    const actualizada = await prisma.respuesta.update({
      where: { respuesta_id: id },
      data: { respuestas },
    });

    return NextResponse.json(actualizada);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Error en PUT" },
      { status: 500 }
    );
  }
}

// =====================================================
// ✅ DELETE
// =====================================================
export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: paramId } = await context.params;

    const id = getId(paramId);

    if (id === null) {
      return NextResponse.json(
        { error: "ID inválido" },
        { status: 400 }
      );
    }

    await prisma.respuesta.delete({
      where: { respuesta_id: id },
    });

    return NextResponse.json({
      message: "Eliminado correctamente",
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Error en DELETE" },
      { status: 500 }
    );
  }
}