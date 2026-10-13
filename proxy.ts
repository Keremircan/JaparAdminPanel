import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth/session";

export function proxy(request: NextRequest) {
  const isAuthenticated = verifySessionToken(
    request.cookies.get(SESSION_COOKIE)?.value,
  );
  const isLoginPage = request.nextUrl.pathname === "/login";

  if (isLoginPage) {
    return isAuthenticated
      ? NextResponse.redirect(new URL("/", request.url))
      : NextResponse.next();
  }

  if (!isAuthenticated) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Statik dosyalar dışındaki her istek korunur; yeni eklenen sayfalar
  // ayrıca listelenmeden kapsama girer.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.[\\w]+$).*)"],
};
