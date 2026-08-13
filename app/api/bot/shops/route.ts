import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-response";
import { listShops } from "@/lib/repository";
import { requireBotAuth } from "@/lib/route-auth";

export async function GET(request: Request) {
  const denied = requireBotAuth(request);
  if (denied) return denied;
  try {
    return NextResponse.json({ shops: await listShops() });
  } catch (error) {
    return apiError(error);
  }
}
