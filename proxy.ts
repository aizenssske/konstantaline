import { jwtVerify } from "jose";
import { NextResponse, type NextRequest } from "next/server";

const protectedRoutes = ["/dashboard", "/sales", "/expenses", "/employees", "/reports", "/settings"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (!protectedRoutes.some((route) => pathname.startsWith(route))) return NextResponse.next();

  const token = request.cookies.get("moliya_session")?.value;
  const rawSecret = process.env.SESSION_SECRET || (process.env.NODE_ENV !== "production" ? "dev-only-change-this-secret-please" : "");
  let valid = false;
  if (token && rawSecret) {
    try {
      await jwtVerify(token, new TextEncoder().encode(rawSecret));
      valid = true;
    } catch {
      valid = false;
    }
  }
  if (valid) return NextResponse.next();

  const login = new URL("/login", request.url);
  login.searchParams.set("next", pathname);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ["/dashboard/:path*", "/sales/:path*", "/expenses/:path*", "/employees/:path*", "/reports/:path*", "/bot/:path*", "/settings/:path*"],
};
