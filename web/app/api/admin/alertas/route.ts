import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSesionUsuario } from "@/lib/session";

/**
 * ⚠️ AJUSTAR: el README (§6.2) no confirma la codificación exacta de
 * `tipo_usuario` contra roles (Superadministrador, Administrador,
 * Psicólogo, Directivo, Colaborador, Docente, Personal administrativo).
 * Se deja aquí una constante centralizada para que se corrija en un solo
 * lugar en cuanto se confirme contra el esquema/seed real de la BD.
 */
const ROLES_CON_ACCESO_ALERTAS = new Set<number>([1, 2, 3]);

function tieneAcceso(tipo_usuario: number): boolean {
  return ROLES_CON_ACCESO_ALERTAS.has(tipo_usuario);
}

/* ───────────────────────────────────────────
   GET /api/admin/alertas?atendida=false&nivel=crisis
   Lista alertas para el dashboard.
   ─────────────────────────────────────────── */

export async function GET(req: NextRequest) {
  try {
    const sesion = getSesionUsuario(req);
    if (!sesion) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    if (!tieneAcceso(sesion.tipo_usuario)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const atendidaParam = searchParams.get("atendida");
    const nivel = searchParams.get("nivel");

    const where: Record<string, unknown> = {};
    if (atendidaParam !== null) where.atendida = atendidaParam === "true";
    if (nivel) where.nivel = nivel;

    const alertas = await prisma.alerta_riesgo.findMany({
      where,
      orderBy: [{ nivel: "desc" }, { created_at: "desc" }],
      take: 200,
      select: {
        alerta_id: true,
        nivel: true,
        resumen: true,
        atendida: true,
        atendida_por: true,
        atendida_en: true,
        notas_admin: true,
        created_at: true,
        conversacion_id: true,
        mensaje_id: true,
        usuario: {
          select: {
            usuario_id: true,
            nombre: true,
            apellido_paterno: true,
            edificio_id: true,
            // Se expone identidad aquí a propósito: quien consulta este
            // endpoint ya tiene rol autorizado para dar seguimiento
            // individual (README §11, alternativa de "acceso restringido"
            // en vez de anonimato absoluto).
          },
        },
      },
    });

    return NextResponse.json({ alertas });
  } catch (error) {
    console.error("Error en GET /api/admin/alertas:", error);
    return NextResponse.json(
      { error: "Error al obtener alertas" },
      { status: 500 }
    );
  }
}

/* ───────────────────────────────────────────
   PATCH /api/admin/alertas
   Body: { alerta_id, atendida?, notas_admin? }
   Marca una alerta como atendida / agrega notas de seguimiento.
   ─────────────────────────────────────────── */

export async function PATCH(req: NextRequest) {
  try {
    const sesion = getSesionUsuario(req);
    if (!sesion) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    if (!tieneAcceso(sesion.tipo_usuario)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const body = await req.json();
    const { alerta_id, atendida, notas_admin } = body;

    if (!alerta_id) {
      return NextResponse.json(
        { error: "Falta alerta_id" },
        { status: 400 }
      );
    }

    const data: Record<string, unknown> = {};
    if (typeof atendida === "boolean") {
      data.atendida = atendida;
      data.atendida_por = atendida ? sesion.id : null;
      data.atendida_en = atendida ? new Date() : null;
    }
    if (typeof notas_admin === "string") {
      data.notas_admin = notas_admin;
    }

    const actualizada = await prisma.alerta_riesgo.update({
      where: { alerta_id: Number(alerta_id) },
      data,
    });

    return NextResponse.json({ alerta: actualizada });
  } catch (error) {
    console.error("Error en PATCH /api/admin/alertas:", error);
    return NextResponse.json(
      { error: "Error al actualizar alerta" },
      { status: 500 }
    );
  }
}
