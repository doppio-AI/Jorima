import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { getKeys } from "@/lib/rsa";

const N8N_2FA_WEBHOOK = "https://159.65.111.84.sslip.io/webhook/Jorima-2FA";

export async function POST(request: Request) {

  try {
    const body = await request.json();
    const { encryptedData, encryptedKey, iv } = body;

    if (!encryptedData || !encryptedKey || !iv) {
      return NextResponse.json(
        { error: "Datos incompletos" },
        { status: 400 }
      );
    }

    /* ── Descifrar credenciales ── */
    const { privateKey } = getKeys();

    const aesKeyHex = crypto.privateDecrypt(
      {
        key: privateKey,
        padding: crypto.constants.RSA_PKCS1_PADDING
      },
      Buffer.from(encryptedKey, "base64")
    ).toString();

    const aesKey = Buffer.from(aesKeyHex, "hex");

    const decipher = crypto.createDecipheriv(
      "aes-256-cbc",
      aesKey,
      Buffer.from(iv, "base64")
    );

    let decrypted = decipher.update(encryptedData, "base64", "utf8");
    decrypted += decipher.final("utf8");

    const { correo, contrasena } = JSON.parse(decrypted);

    /* ── Validar usuario ── */
    const user = await prisma.usuario.findUnique({
      where: { correo }
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    const validPassword = await bcrypt.compare(contrasena, user.contrasena);

    if (!validPassword) {
      return NextResponse.json(
        { error: "Credenciales inválidas" },
        { status: 401 }
      );
    }

    /* ── Generar código de 6 dígitos ── */
    const codigo = Math.floor(100000 + Math.random() * 900000).toString();

    /* ── Calcular fecha de expiración (5 minutos) ── */
    const fechaExpiracion = new Date(Date.now() + 5 * 60 * 1000);

    /* ── Invalidar códigos anteriores no usados del usuario ── */
    await prisma.codigo_verificacion.updateMany({
      where: {
        usuario_id: user.usuario_id,
        usado: false,
      },
      data: { usado: true },
    });

    /* ── Guardar nuevo código en BD ── */
    await prisma.codigo_verificacion.create({
      data: {
        usuario_id: user.usuario_id,
        codigo,
        fecha_expiracion: fechaExpiracion,
      },
    });

    /* ── Enviar código por correo a través de n8n ── */
    try {
      await fetch(N8N_2FA_WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          correo: user.correo,
          codigo,
          nombre: user.nombre,
        }),
      });
    } catch (n8nError) {
      console.error("Error enviando código a n8n:", n8nError);
      return NextResponse.json(
        { error: "Error al enviar el código de verificación" },
        { status: 500 }
      );
    }

    /* ── Responder con éxito (sin crear sesión todavía) ── */
    return NextResponse.json({
      message: "Código enviado a tu correo",
      usuario_id: user.usuario_id,
      correo: user.correo,
    });

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

  response.cookies.set("usuario", "", {
    httpOnly: true,
    path: "/",
    maxAge: 0,
    expires: new Date(0),
  });

  response.cookies.set("usuario_public", "", {
    path: "/",
    maxAge: 0,
    expires: new Date(0),
  });

  return response;
}