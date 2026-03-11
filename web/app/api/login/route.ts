/*
  API: Login de usuario

  Descripción:
  Este endpoint recibe las credenciales del usuario cifradas desde el frontend.
  Utiliza un esquema de cifrado híbrido (RSA + AES) para proteger la información
  durante la transmisión. Primero se descifra la clave AES usando RSA y luego se
  utilizan esa clave y el IV para descifrar los datos del usuario.

  Posteriormente se busca al usuario en la base de datos y se valida la contraseña
  utilizando bcrypt. Si las credenciales son correctas se devuelve la información
  básica del usuario.
*/

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs"; // Librería para comparar contraseñas cifradas
import crypto from "crypto"; // Librería de Node para operaciones criptográficas
import { getKeys } from "@/lib/rsa"; // Función que obtiene las claves RSA del servidor

export async function POST(request: Request) {

  try {

    /*
      El frontend envía los datos cifrados en formato JSON.
    */
    const body = await request.json();

    const { encryptedData, encryptedKey, iv } = body;

    /*Validar que los datos necesarios hayan sido enviados
      encryptedData -> credenciales cifradas con AES
      encryptedKey -> clave AES cifrada con RSA
      iv -> vector de inicialización para AES*/
    if (!encryptedData || !encryptedKey || !iv) {

      return NextResponse.json(
        { error: "Datos incompletos" },
        { status: 400 }
      );

    }

    /*
      Esta clave se usa para descifrar la clave AES enviada por el cliente.
    */
    const { privateKey } = getKeys();

    /*
      El cliente cifró la clave AES usando la clave pública RSA.
      Aquí se usa la clave privada RSA para recuperar la clave AES original.
    */
    const aesKeyHex = crypto.privateDecrypt(
      {
        key: privateKey,
        padding: crypto.constants.RSA_PKCS1_PADDING
      },
      Buffer.from(encryptedKey, "base64")
    ).toString();

    /*
      Convertimos la clave AES de hexadecimal a Buffer
      para poder usarla en el proceso de descifrado.
    */
    const aesKey = Buffer.from(aesKeyHex, "hex");

    /*
      Se utiliza el algoritmo AES-256-CBC junto con:
      - la clave AES recuperada
      - el vector de inicialización (IV)
    */
    const decipher = crypto.createDecipheriv(
      "aes-256-cbc",
      aesKey,
      Buffer.from(iv, "base64")
    );

    let decrypted =
      decipher.update(encryptedData, "base64", "utf8");

    decrypted += decipher.final("utf8");

    /*
      Los datos descifrados contienen el correo y la contraseña
      en formato JSON.
    */
    const { correo, contrasena } = JSON.parse(decrypted);

    /*
      6. BUSCAR AL USUARIO EN LA BASE DE DATOS

      Se utiliza Prisma para buscar al usuario por su correo.
    */
    const user = await prisma.usuario.findUnique({
      where: { correo }
    });

    /*
      Si el usuario no existe se devuelve un error.
    */
    if (!user) {

      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );

    }

    /*
      La contraseña almacenada en la base de datos está cifrada
      con bcrypt. Por lo tanto se utiliza bcrypt.compare para
      verificar si coincide con la contraseña enviada.
    */
    const validPassword = await bcrypt.compare(
      contrasena,
      user.contrasena
    );

    /*
      Si la contraseña es incorrecta se devuelve un error.
    */
    if (!validPassword) {

      return NextResponse.json(
        { error: "Credenciales inválidas" },
        { status: 401 }
      );

    }

    /*
      Si las credenciales son correctas se devuelve la información
      básica del usuario.
    */
    return NextResponse.json({

      message: "Login exitoso",

      usuario: {
        id: user.usuario_id,
        nombre: user.nombre,
        correo: user.correo,
        tipo_usuario: user.tipo_usuario
      }

    });

  } catch (error) {

    /*
      Si ocurre algún error durante el proceso se captura aquí
      y se devuelve una respuesta con estado 500.
    */
    console.error("LOGIN ERROR:", error);

    return NextResponse.json(
      { error: "Error interno en login" },
      { status: 500 }
    );

  }

}