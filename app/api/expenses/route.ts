import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-response";
import { createExpense, listExpenses } from "@/lib/repository";
import { requireApiAuth } from "@/lib/route-auth";
import { expenseSchema } from "@/lib/schemas";

export async function GET(request: Request) {
  const denied = await requireApiAuth(request);
  if (denied) return denied;
  try {
    const url = new URL(request.url);
    const expenses = await listExpenses({
      shopId: url.searchParams.get("shop_id") || undefined,
      from: url.searchParams.get("from") || undefined,
      to: url.searchParams.get("to") || undefined,
    });
    return NextResponse.json({ expenses });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  const denied = await requireApiAuth(request);
  if (denied) return denied;
  try {
    const expense = await createExpense(expenseSchema.parse(await request.json()));
    return NextResponse.json({ expense }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
