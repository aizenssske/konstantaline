import { NextResponse } from "next/server";
import { isDemoMode, pingDatabase } from "@/lib/db";
import { DatabaseConfigError } from "@/lib/db/errors";

export async function GET() {
  const time = new Date().toISOString();

  if (isDemoMode()) {
    return NextResponse.json({ status: "ok", database: "demo", time });
  }

  try {
    await pingDatabase();
    return NextResponse.json({ status: "ok", database: "neon", time });
  } catch (error) {
    const message =
      error instanceof DatabaseConfigError
        ? error.message
        : error instanceof Error
          ? error.message
          : "Neon PostgreSQL bilan bog‘lanib bo‘lmadi";
    return NextResponse.json(
      { status: "error", database: "neon", error: message, time },
      { status: 503 },
    );
  }
}
