/*
  API: Obtención de clave pública RSA

  Descripción:
  Este endpoint permite al frontend obtener la clave pública RSA del servidor.
  Esta clave se utiliza para cifrar la clave AES que protege las credenciales
  del usuario durante el proceso de login.

  En el esquema de cifrado híbrido utilizado en el sistema:
  
  1. El cliente genera una clave AES para cifrar las credenciales.
  2. Esa clave AES se cifra usando la clave pública RSA del servidor.
  3. El servidor posteriormente descifra la clave AES usando su clave privada.

  De esta forma se garantiza que solo el servidor pueda descifrar la información
  enviada por el cliente.
*/

import { NextResponse } from "next/server";
import { getKeys } from "@/lib/rsa"; // Función que obtiene el par de claves RSA

export async function GET() {

  /*
    1. Obtener las claves RSA del servidor
    La función getKeys devuelve tanto la clave pública como la privada.
    En este endpoint solo se envía la clave pública al cliente.
  */
  const { publicKey } = getKeys();

  /*
    2. Enviar la clave pública al frontend

    El frontend utilizará esta clave para cifrar la clave AES
    antes de enviarla al servidor durante el login.
  */
  return NextResponse.json({
    publicKey
  });

}