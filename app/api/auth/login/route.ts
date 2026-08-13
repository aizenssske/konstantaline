import { NextResponse } from "next/server";
import { createSessionToken, SESSION_COOKIE, validateCredentials } from "@/lib/auth";
import { z } from "zod";

const loginSchema = z.object({ username: z.string().min(1), password: z.string().min(1) });

export async function POST(request: Request) {
  try {
    const input = loginSchema.parse(await request.json());
    if (!validateCredentials(input.username, input.password)) {
      return NextResponse.json({ error: "Login yoki parol noto‘g‘ri" }, { status: 401 });
    }
    const token = await createSessionToken(input.username);
    const response = NextResponse.json({ ok: true });
    response.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });
    return response;
  } catch {
    return NextResponse.json({ error: "Login va parolni kiriting" }, { status: 400 });
  }
}
