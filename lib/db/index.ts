import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { DatabaseConfigError } from "./errors";
import { isDemoMode } from "./mode";
import { schema } from "./schema";
import { migrationsFolder, REQUIRED_TABLES, type SchemaStatus } from "./schema-status";

export { DatabaseConfigError } from "./errors";
export { isDemoMode } from "./mode";
export * from "./schema";
export {
  collectErrorText,
  isSchemaMissingError,
  publicDatabaseError,
  SCHEMA_MISSING_MESSAGE,
} from "./schema-status";

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

export async function inspectSchema(): Promise<SchemaStatus> {
  const rows = (await getSql()`
    select table_name
    from information_schema.tables
    where table_schema = 'public'
      and table_name in ('shops', 'sales', 'expenses', 'employees', 'salary_payments', 'telegram_links', 'telegram_link_codes')
  `) as Array<{ table_name: string }>;
  const present = new Set(rows.map((row) => row.table_name));
  const missing = REQUIRED_TABLES.filter((table) => !present.has(table));
  return { ready: missing.length === 0, missing: [...missing] };
}

let migratePromise: Promise<void> | null = null;

async function runMigrateIfNeeded() {
  const status = await inspectSchema();
  if (status.ready) return;
  const { migrate } = await import("drizzle-orm/neon-http/migrator");
  await migrate(getDb(), { migrationsFolder: migrationsFolder() });
}

export async function ensureMigrated() {
  if (isDemoMode()) return;
  if (!migratePromise) {
    migratePromise = runMigrateIfNeeded().catch((error) => {
      migratePromise = null;
      throw error;
    });
  }
  await migratePromise;
}

export async function readyDb() {
  await ensureMigrated();
  return getDb();
}
