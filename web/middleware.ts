import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public endpoints
  if (
    pathname === "/" ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico")
  ) {
    return NextResponse.next();
  }

  const usuarioCookie = request.cookies.get("usuario")?.value;

  if (!usuarioCookie) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  try {
    const user = JSON.parse(usuarioCookie);
    const tipo = Number(user.tipo_usuario);

    if (pathname.startsWith("/administrador") && tipo !== 1) {
      return NextResponse.redirect(new URL("/usuarios", request.url));
    }

    if (pathname.startsWith("/usuarios") && tipo !== 2) {
      return NextResponse.redirect(new URL("/administrador", request.url));
    }

    return NextResponse.next();
  } catch (err) {
    return NextResponse.redirect(new URL("/", request.url));
  }
}

export const config = {
  matcher: ["/administrador/:path*", "/usuarios/:path*"]
};
