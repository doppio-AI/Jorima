import crypto from "crypto";

/* ─────────────────────────────────────────────────
   makeUserAlias
   Devuelve un alias anónimo determinístico basado
   en el usuario_id para mostrar en reportes públicos.
   Ejemplo: usuario_id=42 → "Usuario-7a3f"
   ───────────────────────────────────────────────── */
export function makeUserAlias(userId: number): string {
  const hash = crypto
    .createHash("sha256")
    .update(String(userId))
    .digest("hex")
    .slice(0, 4);
  return `Usuario-${hash}`;
}
