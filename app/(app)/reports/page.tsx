import type { Metadata } from "next";
import { ReportsClient } from "@/components/reports-client";

export const metadata: Metadata = { title: "Hisobotlar" };
export default function ReportsPage() { return <ReportsClient />; }
