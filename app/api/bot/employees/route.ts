import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-response";
import { listEmployees } from "@/lib/repository";
import { requireBotAuth } from "@/lib/route-auth";

export async function GET(request: Request) {
  const denied = requireBotAuth(request);
  if (denied) return denied;
  try {
    const url = new URL(request.url);
    return NextResponse.json({ employees: await listEmployees(url.searchParams.get("shop_id") || undefined) });
  } catch (error) {
    return apiError(error);
  }
}
