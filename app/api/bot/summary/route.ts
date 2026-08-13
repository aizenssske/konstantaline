import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-response";
import { currentMonthTashkent } from "@/lib/format";
import { getDashboard, getMonthlyReport } from "@/lib/repository";
import { requireBotAuth } from "@/lib/route-auth";

export async function GET(request: Request) {
  const denied = requireBotAuth(request);
  if (denied) return denied;
  try {
    const url = new URL(request.url);
    const shopId = url.searchParams.get("shop_id") || undefined;
    if (url.searchParams.get("period") === "month") {
      return NextResponse.json(await getMonthlyReport(url.searchParams.get("month") || currentMonthTashkent(), shopId));
    }
    return NextResponse.json(await getDashboard(shopId));
  } catch (error) {
    return apiError(error);
  }
}
