import crypto from "crypto";

let publicKey: string;
let privateKey: string;

export function getKeys() {

  if (!publicKey || !privateKey) {

    console.log("🔐 Generando claves RSA...");

    const keys = crypto.generateKeyPairSync("rsa", {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: "spki",
        format: "pem"
      },
      privateKeyEncoding: {
        type: "pkcs8",
        format: "pem"
      }
    });

    publicKey = keys.publicKey;
    privateKey = keys.privateKey;

    console.log("✅ PUBLIC KEY GENERADA");
    console.log(publicKey);

  }

  return { publicKey, privateKey };
}