import type { NextRequest } from "next/server";

/* ─────────────────────────────────────────────────
   Tipos
   ───────────────────────────────────────────────── */
export type SessionUser = {
  usuario_id: number;
  tipo_usuario: number;
};

export type Role = "admin" | "usuario" | "unknown";

/* ─────────────────────────────────────────────────
   getSessionUser
   Lee la cookie httpOnly "usuario" del request.
   Devuelve null si no existe o es inválida.
   ───────────────────────────────────────────────── */
export function getSessionUser(request: NextRequest): SessionUser | null {
  try {
    const cookie = request.cookies.get("usuario");
    if (!cookie?.value) return null;

    const parsed = JSON.parse(cookie.value) as unknown;
    if (!parsed || typeof parsed !== "object") return null;

    const obj = parsed as Record<string, unknown>;

    const id =
      typeof obj.id === "number"
        ? obj.id
        : Number(obj.id ?? obj.usuario_id);

    const tipo =
      typeof obj.tipo_usuario === "number"
        ? obj.tipo_usuario
        : Number(obj.tipo_usuario);

    if (!Number.isFinite(id) || !Number.isFinite(tipo)) return null;

    return { usuario_id: id, tipo_usuario: tipo };
  } catch {
    return null;
  }
}

/* ─────────────────────────────────────────────────
   getRole
   Convierte el campo tipo_usuario numérico a un rol legible.
   1 = admin (RH/administrador)
   2 = usuario (personal/docente)
   ───────────────────────────────────────────────── */
export function getRole(tipo_usuario: number): Role {
  switch (tipo_usuario) {
    case 1:
      return "admin";
    case 2:
      return "usuario";
    default:
      return "unknown";
  }
}
