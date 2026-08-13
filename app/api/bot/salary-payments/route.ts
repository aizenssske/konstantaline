import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-response";
import { createSalaryPayment } from "@/lib/repository";
import { requireBotAuth } from "@/lib/route-auth";
import { salaryPaymentSchema } from "@/lib/schemas";

export async function POST(request: Request) {
  const denied = requireBotAuth(request);
  if (denied) return denied;
  try {
    const payment = await createSalaryPayment(salaryPaymentSchema.parse(await request.json()));
    return NextResponse.json({ payment }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
