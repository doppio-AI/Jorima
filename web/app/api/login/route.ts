import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { getKeys } from "@/lib/rsa";

export async function POST(request: Request) {

  try {
    const body = await request.json();

    const { encryptedData, encryptedKey, iv } = body;

    //Validar que los datos necesarios hayan sido enviados
    if (!encryptedData || !encryptedKey || !iv) {

      return NextResponse.json(
        { error: "Datos incompletos" },
        { status: 400 }
      );

    }

      // Esta clave se usa para descifrar la clave AES enviada por el cliente.
    const { privateKey } = getKeys();

    //   El cliente cifró la clave AES usando la clave pública RSA.
    //   Aquí se usa la clave privada RSA para recuperar la clave AES original.
    const aesKeyHex = crypto.privateDecrypt(
      {
        key: privateKey,
        padding: crypto.constants.RSA_PKCS1_PADDING
      },
      Buffer.from(encryptedKey, "base64")
    ).toString();

    //   Convertimos la clave AES de hexadecimal a Buffer para poder usarla en el proceso de descifrado.
    const aesKey = Buffer.from(aesKeyHex, "hex");

    //   Se utiliza el algoritmo AES-256-CBC
    const decipher = crypto.createDecipheriv(
  "aes-256-cbc",
  aesKey,
  Buffer.from(iv, "base64")
);

    let decrypted =
      decipher.update(encryptedData, "base64", "utf8");

    decrypted += decipher.final("utf8");

    //   Los datos descifrados contienen el correo y la contraseña en formato JSON.
    const { correo, contrasena } = JSON.parse(decrypted);

    const user = await prisma.usuario.findUnique({
      where: { correo }
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

    const response = NextResponse.json({

      message: "Login exitoso",

      usuario: {
        id: user.usuario_id,
        nombre: user.nombre,
        correo: user.correo,
        tipo_usuario: user.tipo_usuario
      }

    });

    response.cookies.set("usuario", JSON.stringify({
      id: user.usuario_id,
      tipo_usuario: user.tipo_usuario
    }), {
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 24
    });

    response.cookies.set("usuario_public", encodeURIComponent(JSON.stringify({
      id: user.usuario_id,
      tipo_usuario: user.tipo_usuario
    })), {
      httpOnly: false,
      path: "/",
      maxAge: 60 * 60 * 24
    });

    return response;

  } catch (error) {

    console.error("LOGIN ERROR:", error);

    return NextResponse.json(
      { error: "Error interno en login" },
      { status: 500 }
    );

  }

}

export async function DELETE() {
  const response = NextResponse.json(
    { message: "Logout exitoso" },
    { status: 200 }
  );

  // Borrar cookie privada
  response.cookies.set("usuario", "", {
    httpOnly: true,
    path: "/",
    maxAge: 0,
    expires: new Date(0),
  });

  // Borrar cookie pública
  response.cookies.set("usuario_public", "", {
    path: "/",
    maxAge: 0,
    expires: new Date(0),
  });

  return response;
}