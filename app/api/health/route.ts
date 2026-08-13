import { NextResponse } from "next/server";
import { isDemoMode } from "@/lib/supabase";

export function GET() {
  return NextResponse.json({ status: "ok", database: isDemoMode() ? "demo" : "supabase", time: new Date().toISOString() });
}
