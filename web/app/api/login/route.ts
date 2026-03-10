import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { getKeys } from "@/lib/rsa";

export async function POST(request: Request) {

  try {

    const body = await request.json();

    console.log("📥 BODY RECIBIDO:", body);

    const { encryptedData, encryptedKey, iv } = body;

    if (!encryptedData || !encryptedKey || !iv) {

      return NextResponse.json(
        { error: "Datos incompletos" },
        { status: 400 }
      );

    }

    const { privateKey } = getKeys();

    /* ===============================
       1️⃣ DESCIFRAR CLAVE AES CON RSA
    =============================== */

    const aesKeyHex = crypto.privateDecrypt(
      {
        key: privateKey,
        padding: crypto.constants.RSA_PKCS1_PADDING
      },
      Buffer.from(encryptedKey, "base64")
    ).toString();

    console.log("🔑 AES KEY HEX:", aesKeyHex);

    const aesKey = Buffer.from(aesKeyHex, "hex");

    /* ===============================
       2️⃣ DESCIFRAR DATOS CON AES
    =============================== */

    const decipher = crypto.createDecipheriv(
      "aes-256-cbc",
      aesKey,
      Buffer.from(iv, "base64")
    );

    let decrypted =
      decipher.update(encryptedData, "base64", "utf8");

    decrypted += decipher.final("utf8");

    console.log("📦 DATOS DESCIFRADOS:", decrypted);

    const { correo, contrasena } = JSON.parse(decrypted);

    /* ===============================
       3️⃣ LOGIN NORMAL
    =============================== */

    const user = await prisma.usuario.findUnique({
      where: {
        correo: correo,
      },
    });

    if (!user) {

      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );

    }

    const validPassword = await bcrypt.compare(
      contrasena,
      user.contrasena
    );

    if (!validPassword) {

      return NextResponse.json(
        { error: "Credenciales inválidas" },
        { status: 401 }
      );

    }

    console.log("✅ LOGIN EXITOSO:", correo);

    return NextResponse.json({

      message: "Login exitoso",

      usuario: {
        id: user.usuario_id,
        nombre: user.nombre,
        correo: user.correo,
        tipo_usuario: user.tipo_usuario,
      },

    });

  } catch (error) {

    console.error("❌ ERROR LOGIN:", error);

    return NextResponse.json(
      { error: "Error interno en login" },
      { status: 500 }
    );

  }

}