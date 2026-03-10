import { NextResponse } from "next/server";
import { getKeys } from "@/lib/rsa";

export async function GET() {

  const { publicKey } = getKeys();

  console.log("📤 Enviando Public Key al frontend");

  return NextResponse.json({
    publicKey
  });

}