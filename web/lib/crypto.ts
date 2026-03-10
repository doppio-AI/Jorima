// /lib/crypto.ts
import crypto from "crypto";

// Generar par de llaves RSA al iniciar el servidor
const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
  modulusLength: 2048,
});

export { publicKey, privateKey };