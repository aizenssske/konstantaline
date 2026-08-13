import type { Metadata } from "next";
import { SalesClient } from "@/components/sales-client";

export const metadata: Metadata = { title: "Savdolar" };
export default function SalesPage() { return <SalesClient />; }
