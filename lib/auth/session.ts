import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE = "japar_admin_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 12;

const TOKEN_VERSION = "v1";

function getSecret(): string | null {
  return process.env.ADMIN_PANEL_PASSWORD || null;
}

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  // Uzunluk farkını sızdırmamak için önce sabit boyutlu özet alınır.
  const digestA = createHash("sha256").update(a).digest();
  const digestB = createHash("sha256").update(b).digest();
  return timingSafeEqual(digestA, digestB);
}

export function isAuthConfigured(): boolean {
  return getSecret() !== null;
}

export function isValidPassword(candidate: string): boolean {
  const secret = getSecret();
  return secret !== null && safeEqual(candidate, secret);
}

/** `v1.<bitiş zamanı>.<HMAC imzası>` biçiminde oturum belirteci üretir. */
export function createSessionToken(): string {
  const secret = getSecret();
  if (!secret) {
    throw new Error("ADMIN_PANEL_PASSWORD ortam değişkeni tanımlı olmalı.");
  }

  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS;
  const payload = `${TOKEN_VERSION}.${expiresAt}`;
  return `${payload}.${sign(payload, secret)}`;
}

export function verifySessionToken(token: string | undefined): boolean {
  const secret = getSecret();
  if (!secret || !token) return false;

  const [version, expiresAt, signature, ...rest] = token.split(".");
  if (version !== TOKEN_VERSION || !expiresAt || !signature || rest.length) {
    return false;
  }

  if (!safeEqual(signature, sign(`${version}.${expiresAt}`, secret))) {
    return false;
  }

  return Number(expiresAt) > Math.floor(Date.now() / 1000);
}
