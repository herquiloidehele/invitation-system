import { createHash, randomBytes } from "node:crypto";

const TOKEN_RE = /^[A-Za-z0-9_-]{43}$/;

/** 32 random bytes, base64url — the same strength as check-in tokens. */
export function generateIntakeToken(): string {
  return randomBytes(32).toString("base64url");
}

/** Cheap shape check before touching the database. */
export function isIntakeTokenShape(token: unknown): token is string {
  return typeof token === "string" && TOKEN_RE.test(token);
}

/** Salted hash so abuse can be traced without storing raw IPs. */
export function hashIp(ip: string | null | undefined, secret: string): string | null {
  if (!ip) return null;
  return createHash("sha256").update(`${ip}:${secret}`).digest("hex");
}
