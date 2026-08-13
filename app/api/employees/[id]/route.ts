import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError } from "@/lib/api-response";
import { updateEmployee } from "@/lib/repository";
import { requireApiAuth } from "@/lib/route-auth";

const schema = z.object({
  full_name: z.string().trim().min(3).max(100).optional(),
  role: z.string().trim().min(2).max(80).optional(),
  phone: z.string().trim().max(30).optional(),
  monthly_salary: z.coerce.number().positive().optional(),
  is_active: z.boolean().optional(),
});

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const denied = await requireApiAuth(request);
  if (denied) return denied;
  try {
    const { id } = await context.params;
    const employee = await updateEmployee(id, schema.parse(await request.json()));
    return NextResponse.json({ employee });
  } catch (error) {
    return apiError(error);
  }
}
