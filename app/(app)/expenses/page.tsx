import type { Metadata } from "next";
import { ExpensesClient } from "@/components/expenses-client";

export const metadata: Metadata = { title: "Xarajatlar" };
export default function ExpensesPage() { return <ExpensesClient />; }
