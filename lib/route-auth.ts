import { NextResponse } from "next/server";
import { isApiAuthorized, isBotAuthorized } from "./auth";

export async function requireApiAuth(request: Request) {
  if (await isApiAuthorized(request)) return null;
  return NextResponse.json({ error: "Tizimga qayta kiring" }, { status: 401 });
}

export function requireBotAuth(request: Request) {
  if (isBotAuthorized(request)) return null;
  return NextResponse.json({ error: "Bot uchun ruxsat yo‘q" }, { status: 401 });
}
