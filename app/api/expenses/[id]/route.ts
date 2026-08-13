import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-response";
import { deleteExpense } from "@/lib/repository";
import { requireApiAuth } from "@/lib/route-auth";

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const denied = await requireApiAuth(request);
  if (denied) return denied;
  try {
    const { id } = await context.params;
    await deleteExpense(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
