import { prisma } from "@/lib/prisma";

let ensureSchemaPromise: Promise<void> | null = null;

async function applyHelpContentSchema() {
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "public"."reporte"
    ADD COLUMN IF NOT EXISTS "mime_type" VARCHAR(150)
  `);

  await prisma.$executeRawUnsafe(`
    ALTER TABLE "public"."reporte"
    ADD COLUMN IF NOT EXISTS "tamano_bytes" INTEGER
  `);

  await prisma.$executeRawUnsafe(`
    ALTER TABLE "public"."reporte"
    ADD COLUMN IF NOT EXISTS "archivo_binario" BYTEA
  `);
}

export async function ensureHelpContentSchema() {
  if (!ensureSchemaPromise) {
    ensureSchemaPromise = applyHelpContentSchema().catch((error) => {
      ensureSchemaPromise = null;
      throw error;
    });
  }

  return ensureSchemaPromise;
}