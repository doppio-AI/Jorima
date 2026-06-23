import crypto from "crypto";

const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
  modulusLength: 2048,
  publicKeyEncoding: { type: "pkcs1", format: "pem" },
  privateKeyEncoding: { type: "pkcs1", format: "pem" },
});

console.log("RSA_PUBLIC_KEY=");
console.log(publicKey.replace(/\n/g, "\\n"));

console.log("\nRSA_PRIVATE_KEY=");
console.log(privateKey.replace(/\n/g, "\\n"));