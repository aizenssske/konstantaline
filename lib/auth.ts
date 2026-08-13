import { timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "moliya_session";
const WEEK = 60 * 60 * 24 * 7;

function secret() {
  const value = process.env.SESSION_SECRET || (process.env.NODE_ENV !== "production" ? "dev-only-change-this-secret-please" : "");
  if (!value) throw new Error("SESSION_SECRET sozlanmagan");
  return new TextEncoder().encode(value);
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) return false;
  return timingSafeEqual(leftBuffer, rightBuffer);
}

export function validateCredentials(username: string, password: string) {
  const expectedUsername = process.env.ADMIN_USERNAME || (process.env.NODE_ENV !== "production" ? "admin" : "");
  const expectedPassword = process.env.ADMIN_PASSWORD || (process.env.NODE_ENV !== "production" ? "admin12345" : "");
  return Boolean(expectedUsername && expectedPassword) && safeEqual(username, expectedUsername) && safeEqual(password, expectedPassword);
}

export async function createSessionToken(username: string) {
  return new SignJWT({ username, role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${WEEK}s`)
    .sign(secret());
}

export async function verifySessionToken(token?: string) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return typeof payload.username === "string" ? { username: payload.username } : null;
  } catch {
    return null;
  }
}

export async function getSessionUser() {
  const cookieStore = await cookies();
  return verifySessionToken(cookieStore.get(SESSION_COOKIE)?.value);
}

export async function isApiAuthorized(request: Request) {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${SESSION_COOKIE}=([^;]+)`));
  return Boolean(await verifySessionToken(match?.[1]));
}

export function isBotAuthorized(request: Request) {
  const configured = process.env.BOT_API_SECRET;
  if (!configured) return false;
  const header = request.headers.get("authorization");
  const provided = header?.startsWith("Bearer ") ? header.slice(7) : "";
  return safeEqual(provided, configured);
}
