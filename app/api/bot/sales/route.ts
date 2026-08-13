import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-response";
import { createSale } from "@/lib/repository";
import { requireBotAuth } from "@/lib/route-auth";
import { saleSchema } from "@/lib/schemas";

export async function POST(request: Request) {
  const denied = requireBotAuth(request);
  if (denied) return denied;
  try {
    const sale = await createSale(saleSchema.parse(await request.json()));
    return NextResponse.json({ sale }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
