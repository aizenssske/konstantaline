import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError } from "@/lib/api-response";
import { currentMonthTashkent } from "@/lib/format";
import { getMonthlyReport } from "@/lib/repository";
import { requireApiAuth } from "@/lib/route-auth";

export async function GET(request: Request) {
  const denied = await requireApiAuth(request);
  if (denied) return denied;
  try {
    const url = new URL(request.url);
    const month = z.string().regex(/^\d{4}-\d{2}$/).parse(url.searchParams.get("month") || currentMonthTashkent());
    const data = await getMonthlyReport(month, url.searchParams.get("shop_id") || undefined);
    return NextResponse.json(data);
  } catch (error) {
    return apiError(error);
  }
}
