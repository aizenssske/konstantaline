import { config as loadEnv } from "dotenv";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { migrate } from "drizzle-orm/neon-http/migrator";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

loadEnv({ path: ".env.local" });
loadEnv();

const url = (process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL || "").trim();
if (!url) {
  console.log("DATABASE_URL yo‘q — migratsiya o‘tkazib yuborildi.");
  process.exit(0);
}

if (!url.startsWith("postgres://") && !url.startsWith("postgresql://")) {
  console.error("DATABASE_URL noto‘g‘ri formatda.");
  process.exit(1);
}

const migrationsFolder = resolve(dirname(fileURLToPath(import.meta.url)), "../drizzle");

try {
  console.log("Neon migratsiyasi boshlanmoqda...");
  const db = drizzle(neon(url));
  await migrate(db, { migrationsFolder });
  console.log("Neon migratsiyasi yakunlandi.");
} catch (error) {
  console.error("Neon migratsiyasi muvaffaqiyatsiz:", error);
  process.exit(1);
}
