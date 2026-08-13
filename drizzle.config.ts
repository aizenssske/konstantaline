import { config as loadEnv } from "dotenv";
import { defineConfig } from "drizzle-kit";

loadEnv({ path: ".env.local" });
loadEnv();

const migrationUrl = (process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL || "").trim();
const needsLiveDatabase = process.argv.some((arg) => ["migrate", "studio", "push", "pull"].includes(arg));

if (needsLiveDatabase && !migrationUrl) {
  console.error(
    "DATABASE_URL_UNPOOLED yoki DATABASE_URL sozlanmagan. Migratsiya va Drizzle Studio uchun Neon direct connection kerak.",
  );
  process.exit(1);
}

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    // generate does not need a live database; migrate/studio use the unpooled URL.
    url: migrationUrl || "postgresql://127.0.0.1:5432/postgres",
  },
  strict: true,
  verbose: true,
  migrations: {
    table: "__drizzle_migrations",
    schema: "drizzle",
  },
});
