import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-response";
import { updateShop } from "@/lib/repository";
import { requireApiAuth } from "@/lib/route-auth";
import { z } from "zod";

const schema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  address: z.string().trim().max(200).optional(),
  is_active: z.boolean().optional(),
});

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const denied = await requireApiAuth(request);
  if (denied) return denied;
  try {
    const { id } = await context.params;
    const shop = await updateShop(id, schema.parse(await request.json()));
    return NextResponse.json({ shop });
  } catch (error) {
    return apiError(error);
  }
}
