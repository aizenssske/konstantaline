import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { DatabaseConfigError } from "./errors";
import { isDemoMode } from "./mode";
import { schema } from "./schema";

export { DatabaseConfigError } from "./errors";
export { isDemoMode } from "./mode";
export * from "./schema";

function createSql() {
  return neon(readDatabaseUrl());
}

function createDb(client: ReturnType<typeof createSql>) {
  return drizzle(client, { schema });
}

type SqlClient = ReturnType<typeof createSql>;
type Database = ReturnType<typeof createDb>;

const globalForDb = globalThis as unknown as {
  __moliyaNeonSql?: SqlClient;
  __moliyaDb?: Database;
};

function readDatabaseUrl() {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    throw new DatabaseConfigError();
  }
  if (!url.startsWith("postgres://") && !url.startsWith("postgresql://")) {
    throw new DatabaseConfigError(
      "DATABASE_URL noto‘g‘ri formatda. Neon pooled connection satrini kiriting va unga NEXT_PUBLIC_ prefiksi qo‘ymang.",
    );
  }
  return url;
}

export function getSql() {
  if (isDemoMode()) {
    throw new DatabaseConfigError("Demo rejimda Neon ulanishi ishlatilmaydi.");
  }
  globalForDb.__moliyaNeonSql ??= createSql();
  return globalForDb.__moliyaNeonSql;
}

export function getDb() {
  if (isDemoMode()) {
    throw new DatabaseConfigError("Demo rejimda Neon ulanishi ishlatilmaydi.");
  }
  globalForDb.__moliyaDb ??= createDb(getSql());
  return globalForDb.__moliyaDb;
}

export async function pingDatabase() {
  const rows = await getSql()`select 1 as ok`;
  const row = rows[0] as { ok?: number } | undefined;
  if (Number(row?.ok) !== 1) {
    throw new Error("Neon PostgreSQL javobi kutilganidek emas");
  }
  return true;
}
