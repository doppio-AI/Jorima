import crypto from "crypto";

let keys: any = null;

export function getKeys() {

  if (!keys) {

    keys = crypto.generateKeyPairSync("rsa", {

      modulusLength: 2048,

      publicKeyEncoding: {
        type: "pkcs1",
        format: "pem"
      },

      privateKeyEncoding: {
        type: "pkcs1",
        format: "pem"
      }

    });

  }

  return keys;

}