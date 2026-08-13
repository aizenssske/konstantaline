import type { Metadata } from "next";
import { EmployeesClient } from "@/components/employees-client";

export const metadata: Metadata = { title: "Ishchilar" };
export default function EmployeesPage() { return <EmployeesClient />; }
