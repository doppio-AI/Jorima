import crypto from "crypto";

/* ─────────────────────────────────────────────────
   Gestión de claves RSA para el login híbrido
   ───────────────────────────────────────────────── */

let cachedKeyPair: { publicKey: string; privateKey: string } | null = null;

export function getKeys(): { publicKey: string; privateKey: string } {
  if (cachedKeyPair) return cachedKeyPair;

  /* Intentar leer claves de variables de entorno */
  const envPublic = process.env.RSA_PUBLIC_KEY;
  const envPrivate = process.env.RSA_PRIVATE_KEY;

  if (envPublic && envPrivate) {
    cachedKeyPair = { publicKey: envPublic, privateKey: envPrivate };
    return cachedKeyPair;
  }

  /* Generar un par de claves nuevo en memoria (solo para dev sin ENV) */
  const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
    modulusLength: 2048,
    publicKeyEncoding: { type: "pkcs1", format: "pem" },
    privateKeyEncoding: { type: "pkcs1", format: "pem" },
  });

  cachedKeyPair = { publicKey, privateKey };
  return cachedKeyPair;
}
