import { join } from "node:path";
import { DatabaseConfigError } from "./errors";

export const REQUIRED_TABLES = ["shops", "sales", "expenses", "employees", "salary_payments"] as const;

export type SchemaStatus = {
  ready: boolean;
  missing: string[];
};

export const SCHEMA_MISSING_MESSAGE =
  "Neon ulangan, lekin jadvallar hali yaratilmagan. Sahifani bir ozdan keyin yangilang yoki `npm run db:migrate` ni ishga tushiring.";

export function collectErrorText(error: unknown) {
  const parts: string[] = [];
  const seen = new Set<unknown>();
  let current: unknown = error;
  while (current && !seen.has(current)) {
    seen.add(current);
    if (current instanceof Error) {
      parts.push(current.message);
      current = current.cause;
      continue;
    }
    if (typeof current === "object" && current && "message" in current) {
      parts.push(String((current as { message: unknown }).message));
      current = "cause" in current ? (current as { cause: unknown }).cause : undefined;
      continue;
    }
    break;
  }
  return parts.join(" \n ");
}

export function isSchemaMissingError(error: unknown) {
  return /does not exist|42P01/i.test(collectErrorText(error));
}

export function publicDatabaseError(error: unknown, fallback = "Serverda xatolik yuz berdi") {
  if (error instanceof DatabaseConfigError) return error.message;
  if (isSchemaMissingError(error)) return SCHEMA_MISSING_MESSAGE;
  if (error instanceof Error) {
    const cause = error.cause instanceof Error ? error.cause.message : "";
    if (cause && !/failed query/i.test(cause)) return cause;
    if (error.message && !/failed query/i.test(error.message)) return error.message;
  }
  return fallback;
}

export function migrationsFolder() {
  return join(process.cwd(), "drizzle");
}
