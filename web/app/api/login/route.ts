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

/* ── 1. Descifrar llave AES con RSA ── */
    const { privateKey } = getKeys();

    const decryptedKeyBuffer = crypto.privateDecrypt(
      {
        key: privateKey,
        padding: crypto.constants.RSA_PKCS1_PADDING
      },
      Buffer.from(encryptedKey, "base64")
    );

    // --- DEBUG: Esto te dirá qué está llegando ---
    const llaveEnTexto = decryptedKeyBuffer.toString();
    console.log("CONTENIDO DE LA LLAVE DESCIFRADA:", llaveEnTexto);
    console.log("TAMAÑO ORIGINAL:", decryptedKeyBuffer.length);

    let aesKey: Buffer;

    // Caso A: El frontend mandó un Hexadecimal de 64 caracteres
    if (decryptedKeyBuffer.length === 64) {
      aesKey = Buffer.from(llaveEnTexto, "hex");
    } 
    // Caso B: El frontend mandó la llave correcta de 32 bytes
    else if (decryptedKeyBuffer.length === 32) {
      aesKey = decryptedKeyBuffer;
    }
    // Caso C: Algo salió mal y llegó algo de otro tamaño (como tus 6 bytes)
    else {
      console.error(`ERROR: Tamaño inesperado (${decryptedKeyBuffer.length} bytes).`);
      // Intentamos rellenar con ceros solo para que el código no crashee y puedas ver el log
      aesKey = Buffer.alloc(32);
      decryptedKeyBuffer.copy(aesKey); 
    }

    /* ── 2. Descifrar los datos con AES-256-CBC ── */
    const decipher = crypto.createDecipheriv(
      "aes-256-cbc",
      aesKey,
      Buffer.from(iv, "base64")
    );

    let decrypted = decipher.update(encryptedData, "base64", "utf8");
    decrypted += decipher.final("utf8");

    const { correo, contrasena } = JSON.parse(decrypted);

    /* ── 3. Validar usuario en BD ── */
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

    /* ── 4. Lógica de 2FA ── */
    const codigo = Math.floor(100000 + Math.random() * 900000).toString();
    const fechaExpiracion = new Date(Date.now() + 5 * 60 * 1000);

    // Transacción de Prisma: Invalidar viejos y crear el nuevo
    await prisma.$transaction([
      prisma.codigo_verificacion.updateMany({
        where: { usuario_id: user.usuario_id, usado: false },
        data: { usado: true },
      }),
      prisma.codigo_verificacion.create({
        data: {
          usuario_id: user.usuario_id,
          codigo,
          fecha_expiracion: fechaExpiracion,
        },
      })
    ]);

    /* ── 5. Enviar a n8n ── */
    try {
      // Usamos un timeout para que Vercel no se quede colgado si n8n no responde
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      await fetch(N8N_2FA_WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          correo: user.correo,
          codigo,
          nombre: user.nombre,
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
    } catch (n8nError) {
      console.error("Error enviando código a n8n:", n8nError);
      // Opcional: Podrías decidir si dejar pasar al usuario o no si n8n falla.
      // Aquí devolvemos error porque si no llega el código, el usuario no podrá entrar.
      return NextResponse.json(
        { error: "No se pudo enviar el correo de verificación" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Código enviado a tu correo",
      usuario_id: user.usuario_id,
      correo: user.correo,
    });

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
    { message: "Logout exitoso" },
    { status: 200 }
  );

  const cookieOptions = {
    path: "/",
    maxAge: 0,
    expires: new Date(0),
  };

  response.cookies.set("usuario", "", { ...cookieOptions, httpOnly: true });
  response.cookies.set("usuario_public", "", cookieOptions);

  return response;
}