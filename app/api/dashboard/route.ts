import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-response";
import { getDashboard } from "@/lib/repository";
import { requireApiAuth } from "@/lib/route-auth";

export async function GET(request: Request) {
  const denied = await requireApiAuth(request);
  if (denied) return denied;
  try {
    const url = new URL(request.url);
    const data = await getDashboard(url.searchParams.get("shop_id") || undefined);
    return NextResponse.json(data);
  } catch (error) {
    return apiError(error);
  }
}
