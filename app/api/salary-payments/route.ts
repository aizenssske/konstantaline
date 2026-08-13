import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-response";
import { createSalaryPayment, listSalaryPayments } from "@/lib/repository";
import { requireApiAuth } from "@/lib/route-auth";
import { salaryPaymentSchema } from "@/lib/schemas";

export async function GET(request: Request) {
  const denied = await requireApiAuth(request);
  if (denied) return denied;
  try {
    const url = new URL(request.url);
    const payments = await listSalaryPayments({
      shopId: url.searchParams.get("shop_id") || undefined,
      employeeId: url.searchParams.get("employee_id") || undefined,
      month: url.searchParams.get("month") || undefined,
    });
    return NextResponse.json({ payments });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  const denied = await requireApiAuth(request);
  if (denied) return denied;
  try {
    const payment = await createSalaryPayment(salaryPaymentSchema.parse(await request.json()));
    return NextResponse.json({ payment }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
