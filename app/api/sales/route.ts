import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-response";
import { createSale, listSales } from "@/lib/repository";
import { requireApiAuth } from "@/lib/route-auth";
import { saleSchema } from "@/lib/schemas";

export async function GET(request: Request) {
  const denied = await requireApiAuth(request);
  if (denied) return denied;
  try {
    const url = new URL(request.url);
    const sales = await listSales({
      shopId: url.searchParams.get("shop_id") || undefined,
      from: url.searchParams.get("from") || undefined,
      to: url.searchParams.get("to") || undefined,
    });
    return NextResponse.json({ sales });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  const denied = await requireApiAuth(request);
  if (denied) return denied;
  try {
    const sale = await createSale(saleSchema.parse(await request.json()));
    return NextResponse.json({ sale }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
