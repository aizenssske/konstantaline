import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { DatabaseConfigError } from "@/lib/db/errors";

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
  const message = error instanceof Error ? error.message : fallback;
  console.error(error);
  return NextResponse.json({ error: message || fallback }, { status: 500 });
}
