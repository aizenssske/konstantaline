import { NextResponse } from "next/server";
import { ensureMigrated, inspectSchema, isDemoMode, pingDatabase } from "@/lib/db";
import { DatabaseConfigError } from "@/lib/db/errors";
import { SCHEMA_MISSING_MESSAGE } from "@/lib/db/schema-status";

export async function GET() {
  const time = new Date().toISOString();

  if (isDemoMode()) {
    return NextResponse.json({ status: "ok", database: "demo", schema: "demo", time });
  }

  try {
    await pingDatabase();
    await ensureMigrated();
    const schema = await inspectSchema();
    if (!schema.ready) {
      return NextResponse.json(
        {
          status: "error",
          database: "neon",
          schema: "missing",
          missing: schema.missing,
          error: SCHEMA_MISSING_MESSAGE,
          time,
        },
        { status: 503 },
      );
    }
    return NextResponse.json({ status: "ok", database: "neon", schema: "ready", time });
  } catch (error) {
    const message =
      error instanceof DatabaseConfigError
        ? error.message
        : error instanceof Error
          ? error.message
          : "Neon PostgreSQL bilan bog‘lanib bo‘lmadi";
    return NextResponse.json(
      { status: "error", database: "neon", schema: "unknown", error: message, time },
      { status: 503 },
    );
  }
}
