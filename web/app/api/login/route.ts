import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { getKeys } from "@/lib/rsa";

export const runtime = "nodejs";

interface LoginPayload {
  encryptedData?: string;
  encryptedKey?: string;
  iv?: string;
}

interface CredencialesDescifradas {
  correo?: string;
  contrasena?: string;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as LoginPayload;
    const { encryptedData, encryptedKey, iv } = body;

    if (!encryptedData || !encryptedKey || !iv) {
      return NextResponse.json(
        { error: "Datos incompletos" },
        { status: 400 }
      );
    }

    /* ── 1. Descifrar la llave AES con RSA ── */

    const { privateKey } = getKeys();

    let decryptedKeyBuffer: Buffer;

    try {
      decryptedKeyBuffer = crypto.privateDecrypt(
        {
          key: privateKey,
          padding: crypto.constants.RSA_PKCS1_PADDING,
        },
        Buffer.from(encryptedKey, "base64")
      );
    } catch (error) {
      console.error("No se pudo descifrar la llave AES:", error);

      return NextResponse.json(
        { error: "Solicitud de inicio de sesión inválida" },
        { status: 400 }
      );
    }

    let aesKey: Buffer;

    /*
     * El frontend puede mandar:
     * - La llave AES directamente como 32 bytes.
     * - La llave AES como texto hexadecimal de 64 caracteres.
     */
    if (decryptedKeyBuffer.length === 32) {
      aesKey = decryptedKeyBuffer;
    } else {
      const keyAsText = decryptedKeyBuffer.toString("utf8");

      if (
        keyAsText.length === 64 &&
        /^[0-9a-fA-F]{64}$/.test(keyAsText)
      ) {
        aesKey = Buffer.from(keyAsText, "hex");
      } else {
        return NextResponse.json(
          { error: "Llave de cifrado inválida" },
          { status: 400 }
        );
      }
    }

    /* ── 2. Descifrar las credenciales con AES-256-CBC ── */

    const ivBuffer = Buffer.from(iv, "base64");

    if (ivBuffer.length !== 16) {
      return NextResponse.json(
        { error: "Vector de inicialización inválido" },
        { status: 400 }
      );
    }

    let credenciales: CredencialesDescifradas;

    try {
      const decipher = crypto.createDecipheriv(
        "aes-256-cbc",
        aesKey,
        ivBuffer
      );

      let decrypted = decipher.update(
        encryptedData,
        "base64",
        "utf8"
      );

      decrypted += decipher.final("utf8");

      credenciales = JSON.parse(
        decrypted
      ) as CredencialesDescifradas;
    } catch (error) {
      console.error("No se pudieron descifrar las credenciales:", error);

      return NextResponse.json(
        { error: "Credenciales cifradas inválidas" },
        { status: 400 }
      );
    }

    const correo = credenciales.correo?.trim().toLowerCase();
    const contrasena = credenciales.contrasena;

    if (!correo || !contrasena) {
      return NextResponse.json(
        { error: "Correo y contraseña son obligatorios" },
        { status: 400 }
      );
    }

    /* ── 3. Validar al usuario ── */

    const user = await prisma.usuario.findUnique({
      where: { correo },
    });

    /*
     * Se utiliza el mismo mensaje cuando no existe el usuario
     * o cuando falla la contraseña para no revelar cuentas registradas.
     */
    if (!user) {
      return NextResponse.json(
        { error: "Credenciales inválidas" },
        { status: 401 }
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

    /* ── 4. Crear la sesión directamente, sin 2FA ── */

    const usuarioSesion = {
      id: user.usuario_id,
      usuario_id: user.usuario_id,
      tipo_usuario: user.tipo_usuario,
      correo: user.correo,
      nombre: user.nombre,
      apellido_paterno: user.apellido_paterno,
      apellido_materno: user.apellido_materno,
      edificio_id: user.edificio_id,
      turno: user.turno,
    };

    const usuarioPublico = {
      id: user.usuario_id,
      usuario_id: user.usuario_id,
      tipo_usuario: user.tipo_usuario,
      correo: user.correo,
      nombre: user.nombre,
      apellido_paterno: user.apellido_paterno,
      apellido_materno: user.apellido_materno,
      edificio_id: user.edificio_id,
      turno: user.turno,
    };

    const response = NextResponse.json(
      {
        ok: true,
        message: "Inicio de sesión exitoso",
        usuario: usuarioPublico,
      },
      { status: 200 }
    );

    const cookieOptions = {
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      path: "/",
      maxAge: 60 * 30,
    };

    /*
     * Cookie privada para las API.
     * El chatbot debe obtener el ID del usuario desde esta cookie.
     */
    response.cookies.set(
      "usuario",
      JSON.stringify(usuarioSesion),
      {
        ...cookieOptions,
        httpOnly: true,
      }
    );

    /*
     * Cookie pública para que el frontend pueda mostrar
     * nombre, rol u otros datos no sensibles.
     */
    response.cookies.set(
      "usuario_public",
      JSON.stringify(usuarioPublico),
      {
        ...cookieOptions,
        httpOnly: false,
      }
    );

    return response;
  } catch (error) {
    console.error("LOGIN ERROR:", error);

    return NextResponse.json(
      { error: "Error interno en el servidor" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  const response = NextResponse.json(
    {
      ok: true,
      message: "Logout exitoso",
    },
    { status: 200 }
  );

  const cookieOptions = {
    path: "/",
    maxAge: 0,
    expires: new Date(0),
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
  };

  response.cookies.set("usuario", "", {
    ...cookieOptions,
    httpOnly: true,
  });

  response.cookies.set("usuario_public", "", {
    ...cookieOptions,
    httpOnly: false,
  });

  return response;
}