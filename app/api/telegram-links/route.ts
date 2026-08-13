import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-response";
import { requireApiAuth } from "@/lib/route-auth";
import { telegramLinkRedeemSchema } from "@/lib/schemas";
import { listTelegramLinks, redeemTelegramLinkCode } from "@/lib/telegram";

export async function GET(request: Request) {
  const denied = await requireApiAuth(request);
  if (denied) return denied;
  try {
    return NextResponse.json({ links: await listTelegramLinks() });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  const denied = await requireApiAuth(request);
  if (denied) return denied;
  try {
    const { code } = telegramLinkRedeemSchema.parse(await request.json());
    const link = await redeemTelegramLinkCode(code);
    return NextResponse.json({ link }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
