import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-response";
import { createShop, listShops } from "@/lib/repository";
import { requireApiAuth } from "@/lib/route-auth";
import { shopSchema } from "@/lib/schemas";
import { isDemoMode } from "@/lib/db";

export async function GET(request: Request) {
  const denied = await requireApiAuth(request);
  if (denied) return denied;
  try {
    const url = new URL(request.url);
    const shops = await listShops(url.searchParams.get("all") === "true");
    return NextResponse.json({ shops, demoMode: isDemoMode() });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  const denied = await requireApiAuth(request);
  if (denied) return denied;
  try {
    const shop = await createShop(shopSchema.parse(await request.json()));
    return NextResponse.json({ shop }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
