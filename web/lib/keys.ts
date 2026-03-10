import fs from "fs";
import path from "path";
import crypto from "crypto";

const keysDir = path.join(process.cwd(), "keys");
const publicKeyPath = path.join(keysDir, "public.pem");
const privateKeyPath = path.join(keysDir, "private.pem");

let publicKey: string;
let privateKey: string;

// Si las claves no existen, se generan
if (!fs.existsSync(publicKeyPath) || !fs.existsSync(privateKeyPath)) {

  console.log("🔑 Generando claves RSA...");

  const keys = crypto.generateKeyPairSync("rsa", {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: "spki",
      format: "pem",
    },
    privateKeyEncoding: {
      type: "pkcs1",
      format: "pem",
    },
  });

  // Crear carpeta si no existe
  if (!fs.existsSync(keysDir)) {
    fs.mkdirSync(keysDir);
  }

  fs.writeFileSync(publicKeyPath, keys.publicKey);
  fs.writeFileSync(privateKeyPath, keys.privateKey);

  publicKey = keys.publicKey;
  privateKey = keys.privateKey;

  console.log("✅ Claves generadas y guardadas");

} else {

  console.log("🔑 Cargando claves existentes");

  publicKey = fs.readFileSync(publicKeyPath, "utf8");
  privateKey = fs.readFileSync(privateKeyPath, "utf8");

}

export { publicKey, privateKey };