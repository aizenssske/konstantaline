import { randomInt } from "node:crypto";
import { and, desc, eq, isNull } from "drizzle-orm";
import { getDemoStore, withNewRecord } from "./demo-store";
import { isDemoMode, readyDb } from "./db";
import { telegramLinkCodes, telegramLinks } from "./db/schema";
import type { TelegramLink, TelegramLinkCode } from "./types";

const CODE_TTL_MS = 60_000;

function asIso(value: unknown) {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? value : parsed.toISOString();
  }
  return new Date().toISOString();
}

function normalizeLink(row: typeof telegramLinks.$inferSelect): TelegramLink {
  return {
    id: row.id,
    telegram_id: Number(row.telegram_id),
    username: row.username,
    first_name: row.first_name,
    linked_at: asIso(row.linked_at),
    created_at: asIso(row.created_at),
  };
}

function makeCode() {
  return String(randomInt(100000, 1000000));
}

export async function listTelegramLinks(): Promise<TelegramLink[]> {
  if (isDemoMode()) {
    return [...getDemoStore().telegramLinks].sort((a, b) => b.linked_at.localeCompare(a.linked_at));
  }
  const rows = await (await readyDb()).select().from(telegramLinks).orderBy(desc(telegramLinks.linked_at));
  return rows.map(normalizeLink);
}

export async function isTelegramLinked(telegramId: number): Promise<boolean> {
  if (isDemoMode()) {
    return getDemoStore().telegramLinks.some((item) => item.telegram_id === telegramId);
  }
  const rows = await (await readyDb())
    .select({ id: telegramLinks.id })
    .from(telegramLinks)
    .where(eq(telegramLinks.telegram_id, telegramId))
    .limit(1);
  return rows.length > 0;
}

export async function createTelegramLinkCode(input: {
  telegram_id: number;
  username?: string;
  first_name?: string;
}): Promise<{ alreadyLinked: boolean; code?: string; expires_at?: string }> {
  if (!Number.isInteger(input.telegram_id) || input.telegram_id <= 0) {
    throw new Error("Telegram ID noto‘g‘ri");
  }
  if (await isTelegramLinked(input.telegram_id)) {
    return { alreadyLinked: true };
  }

  const now = Date.now();
  const expiresAt = new Date(now + CODE_TTL_MS).toISOString();
  const payload = {
    code: makeCode(),
    telegram_id: input.telegram_id,
    username: (input.username ?? "").replace(/^@/, "").trim(),
    first_name: (input.first_name ?? "").trim(),
    expires_at: expiresAt,
    used_at: null as string | null,
  };

  if (isDemoMode()) {
    const store = getDemoStore();
    store.telegramLinkCodes = store.telegramLinkCodes.filter(
      (item) => item.telegram_id !== input.telegram_id || item.used_at,
    );
    const record = withNewRecord(payload) as TelegramLinkCode;
    store.telegramLinkCodes.unshift(record);
    return { alreadyLinked: false, code: record.code, expires_at: record.expires_at };
  }

  const db = await readyDb();
  await db.delete(telegramLinkCodes).where(
    and(eq(telegramLinkCodes.telegram_id, input.telegram_id), isNull(telegramLinkCodes.used_at)),
  );
  const [row] = await db.insert(telegramLinkCodes).values(payload).returning();
  if (!row) throw new Error("Kod yaratib bo‘lmadi");
  return { alreadyLinked: false, code: row.code, expires_at: asIso(row.expires_at) };
}

export async function redeemTelegramLinkCode(code: string): Promise<TelegramLink> {
  const normalized = code.replace(/\D/g, "");
  if (normalized.length !== 6) throw new Error("Kod 6 xonali bo‘lishi kerak");

  if (isDemoMode()) {
    const store = getDemoStore();
    const record = store.telegramLinkCodes.find((item) => item.code === normalized && !item.used_at);
    if (!record) throw new Error("Kod topilmadi yoki allaqachon ishlatilgan");
    if (new Date(record.expires_at).getTime() < Date.now()) throw new Error("Kod muddati tugagan. Botdan yangi /kod oling.");
    record.used_at = new Date().toISOString();
    const existing = store.telegramLinks.find((item) => item.telegram_id === record.telegram_id);
    if (existing) return existing;
    const link = withNewRecord({
      telegram_id: record.telegram_id,
      username: record.username,
      first_name: record.first_name,
      linked_at: new Date().toISOString(),
    }) as TelegramLink;
    store.telegramLinks.unshift(link);
    return link;
  }

  const db = await readyDb();
  const [record] = await db
    .select()
    .from(telegramLinkCodes)
    .where(and(eq(telegramLinkCodes.code, normalized), isNull(telegramLinkCodes.used_at)))
    .limit(1);
  if (!record) throw new Error("Kod topilmadi yoki allaqachon ishlatilgan");
  if (new Date(record.expires_at).getTime() < Date.now()) {
    throw new Error("Kod muddati tugagan. Botdan yangi /kod oling.");
  }

  await db
    .update(telegramLinkCodes)
    .set({ used_at: new Date().toISOString() })
    .where(eq(telegramLinkCodes.id, record.id));

  const [existing] = await db
    .select()
    .from(telegramLinks)
    .where(eq(telegramLinks.telegram_id, record.telegram_id))
    .limit(1);
  if (existing) return normalizeLink(existing);

  const [link] = await db
    .insert(telegramLinks)
    .values({
      telegram_id: record.telegram_id,
      username: record.username,
      first_name: record.first_name,
    })
    .returning();
  if (!link) throw new Error("Telegram profilni ulab bo‘lmadi");
  return normalizeLink(link);
}

export async function unlinkTelegram(id: string) {
  if (isDemoMode()) {
    const store = getDemoStore();
    const before = store.telegramLinks.length;
    store.telegramLinks = store.telegramLinks.filter((item) => item.id !== id);
    if (store.telegramLinks.length === before) throw new Error("Ulangan profil topilmadi");
    return;
  }
  const deleted = await (await readyDb()).delete(telegramLinks).where(eq(telegramLinks.id, id)).returning({ id: telegramLinks.id });
  if (!deleted.length) throw new Error("Ulangan profil topilmadi");
}
