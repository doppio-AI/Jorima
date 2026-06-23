import "dotenv/config";
import crypto from "crypto";

const correo = process.argv[2];
const contrasena = process.argv[3];

if (!correo || !contrasena) {
  console.error("Uso:");
  console.error("npx tsx scripts/generate-login-payload.ts correo@demo.com contraseña");
  process.exit(1);
}

const publicKeyFromEnv = process.env.RSA_PUBLIC_KEY;

if (!publicKeyFromEnv) {
  console.error("Falta RSA_PUBLIC_KEY en el archivo .env");
  process.exit(1);
}

const publicKey = publicKeyFromEnv.replace(/\\n/g, "\n");

const aesKey = crypto.randomBytes(32);
const iv = crypto.randomBytes(16);

const loginData = JSON.stringify({
  correo,
  contrasena,
});

const cipher = crypto.createCipheriv("aes-256-cbc", aesKey, iv);

let encryptedData = cipher.update(loginData, "utf8", "base64");
encryptedData += cipher.final("base64");

const encryptedKey = crypto
  .publicEncrypt(
    {
      key: publicKey,
      padding: crypto.constants.RSA_PKCS1_PADDING,
    },
    aesKey
  )
  .toString("base64");

const payload = {
  encryptedData,
  encryptedKey,
  iv: iv.toString("base64"),
};

console.log(JSON.stringify(payload, null, 2));