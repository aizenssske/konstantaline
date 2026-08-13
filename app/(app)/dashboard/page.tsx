import type { Metadata } from "next";
import { DashboardClient } from "@/components/dashboard-client";

export const metadata: Metadata = { title: "Bosh sahifa" };

export default function DashboardPage() {
  return <DashboardClient />;
}
