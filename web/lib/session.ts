import { NextRequest } from "next/server";

export interface SesionUsuario {
  id: number;
  tipo_usuario: number;
}

/**
 * Lee la sesión desde la cookie httpOnly `usuario`, creada en
 * /api/verificar-codigo (ver route.ts de ese endpoint).
 *
 * ⚠️ DEUDA TÉCNICA HEREDADA (README §7.2, §18 crítico #5):
 * el valor de esta cookie es JSON plano, NO está firmado ni es un JWT real.
 * httpOnly evita que JS del navegador la lea/modifique, pero no la protege
 * de manipulación si un atacante logra escribir cookies por otra vía
 * (proxy malicioso, XSS en un subdominio, etc.). Este helper se usa aquí
 * para cerrar el hueco más urgente (que el cliente mande `usuario_id` en
 * el body/query y el backend confíe en él ciegamente), pero NO sustituye
 * implementar una sesión firmada — eso sigue pendiente.
 */
export function getSesionUsuario(req: NextRequest): SesionUsuario | null {
  const raw = req.cookies.get("usuario")?.value;
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed.id !== "number" || typeof parsed.tipo_usuario !== "number") {
      return null;
    }
    return { id: parsed.id, tipo_usuario: parsed.tipo_usuario };
  } catch {
    return null;
  }
}
