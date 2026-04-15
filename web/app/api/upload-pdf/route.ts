import { NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "No se recibió un archivo válido" },
        { status: 400 }
      );
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "Solo se permiten archivos PDF" },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const baseName = file.name.replace(/\.pdf$/i, "");
    const publicId = `jorima/pdfs/${Date.now()}-${baseName}`;

    const uploadResult = await new Promise<any>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "jorima/pdfs",
          resource_type: "image",
          format: "pdf",
          public_id: `${Date.now()}-${baseName}`,
          overwrite: false,
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      );

      stream.end(buffer);
    });

    return NextResponse.json({
      message: "PDF subido correctamente",
      url: uploadResult.secure_url,
      public_id: uploadResult.public_id,
      resource_type: uploadResult.resource_type,
      format: uploadResult.format,
    });
  } catch (error) {
    console.error("Error al subir PDF:", error);

    return NextResponse.json(
      { error: "Error interno al subir el PDF" },
      { status: 500 }
    );
  }
}