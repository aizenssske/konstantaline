import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-response";
import { createEmployee, listEmployees, listSalaryPayments } from "@/lib/repository";
import { requireApiAuth } from "@/lib/route-auth";
import { employeeSchema } from "@/lib/schemas";
import { currentMonthTashkent } from "@/lib/format";

export async function GET(request: Request) {
  const denied = await requireApiAuth(request);
  if (denied) return denied;
  try {
    const url = new URL(request.url);
    const shopId = url.searchParams.get("shop_id") || undefined;
    const month = url.searchParams.get("month") || currentMonthTashkent();
    const [employees, payments] = await Promise.all([
      listEmployees(shopId, url.searchParams.get("all") === "true"),
      listSalaryPayments({ shopId, month }),
    ]);
    return NextResponse.json({ employees, payments });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  const denied = await requireApiAuth(request);
  if (denied) return denied;
  try {
    const employee = await createEmployee(employeeSchema.parse(await request.json()));
    return NextResponse.json({ employee }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
