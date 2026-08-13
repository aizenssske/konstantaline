import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { DatabaseConfigError } from "@/lib/db/errors";
import { publicDatabaseError } from "@/lib/db/schema-status";

export function apiError(error: unknown, fallback = "Serverda xatolik yuz berdi") {
  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: error.issues[0]?.message ?? "Ma’lumotlarni tekshiring" },
      { status: 400 },
    );
  }
  if (error instanceof DatabaseConfigError) {
    return NextResponse.json({ error: error.message }, { status: 503 });
  }
  console.error(error);
  return NextResponse.json({ error: publicDatabaseError(error, fallback) }, { status: 500 });
}
