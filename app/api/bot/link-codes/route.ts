import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-response";
import { requireBotAuth } from "@/lib/route-auth";
import { telegramLinkCodeRequestSchema } from "@/lib/schemas";
import { createTelegramLinkCode } from "@/lib/telegram";

export async function POST(request: Request) {
  const denied = requireBotAuth(request);
  if (denied) return denied;
  try {
    const result = await createTelegramLinkCode(telegramLinkCodeRequestSchema.parse(await request.json()));
    if (result.alreadyLinked) {
      return NextResponse.json({ already_linked: true });
    }
    return NextResponse.json(
      { already_linked: false, code: result.code, expires_at: result.expires_at, ttl_seconds: 60 },
      { status: 201 },
    );
  } catch (error) {
    return apiError(error);
  }
}
