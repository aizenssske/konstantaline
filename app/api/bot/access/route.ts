import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError } from "@/lib/api-response";
import { requireBotAuth } from "@/lib/route-auth";
import { isTelegramLinked } from "@/lib/telegram";

export async function GET(request: Request) {
  const denied = requireBotAuth(request);
  if (denied) return denied;
  try {
    const telegramId = z.coerce.number().int().positive().parse(new URL(request.url).searchParams.get("telegram_id"));
    const linked = await isTelegramLinked(telegramId);
    return NextResponse.json({ allowed: linked, linked });
  } catch (error) {
    return apiError(error);
  }
}
