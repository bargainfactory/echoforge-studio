/**
 * Stateless, signed session tokens + password hashing.
 *
 * Everything here uses only the Web Crypto API (`crypto.subtle`) and base64url,
 * so the exact same code runs in Node route handlers AND in Edge middleware.
 * The session cookie is an HMAC-SHA256 signed payload the client cannot forge;
 * passwords are hashed with PBKDF2-SHA256 and verified in constant time.
 */

export const SESSION_COOKIE = "ef_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export interface SessionPayload {
  sub: string; // email
  name: string;
  initials: string;
  plan: string;
  iat: number;
  exp: number;
}

export interface SessionUser {
  name: string;
  email: string;
  initials: string;
  plan: string;
}

const encoder = new TextEncoder();
const decoder = new TextDecoder();

// Web Crypto's typed signatures pin BufferSource to ArrayBuffer-backed views;
// our Uint8Arrays are ArrayBuffer-backed at runtime, so this bridges the types.
const bs = (u: Uint8Array): BufferSource => u as unknown as BufferSource;

function toB64Url(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromB64Url(s: string): Uint8Array {
  let t = s.replace(/-/g, "+").replace(/_/g, "/");
  while (t.length % 4) t += "=";
  const bin = atob(t);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function getSecret(): string {
  const s = process.env.SESSION_SECRET;
  if (s && s.length >= 16) return s;
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "SESSION_SECRET must be set (>=16 chars) in production. Refusing to sign sessions with a known dev key."
    );
  }
  // Development-only fallback so `next dev` works without setup.
  console.warn(
    "[auth] SESSION_SECRET is not set — using an insecure development key. Set SESSION_SECRET before deploying."
  );
  return "virafold-dev-insecure-session-key";
}

async function hmacKey(): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    bs(encoder.encode(getSecret())),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

export function initialsFor(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "?"
  );
}

export async function createSessionToken(
  user: SessionUser
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const payload: SessionPayload = {
    sub: user.email,
    name: user.name,
    initials: user.initials,
    plan: user.plan,
    iat: now,
    exp: now + SESSION_MAX_AGE,
  };
  const body = toB64Url(encoder.encode(JSON.stringify(payload)));
  const key = await hmacKey();
  const sig = new Uint8Array(
    await crypto.subtle.sign("HMAC", key, bs(encoder.encode(body)))
  );
  return `${body}.${toB64Url(sig)}`;
}

export async function verifySessionToken(
  token: string | undefined | null
): Promise<SessionPayload | null> {
  if (!token) return null;
  const dot = token.indexOf(".");
  if (dot <= 0) return null;
  const body = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  try {
    const key = await hmacKey();
    const ok = await crypto.subtle.verify(
      "HMAC",
      key,
      bs(fromB64Url(sig)),
      bs(encoder.encode(body))
    );
    if (!ok) return null;
    const payload = JSON.parse(
      decoder.decode(fromB64Url(body))
    ) as SessionPayload;
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export function payloadToUser(p: SessionPayload): SessionUser {
  return { name: p.name, email: p.sub, initials: p.initials, plan: p.plan };
}

// --- Password hashing (PBKDF2-SHA256) ---

const PBKDF2_ITERATIONS = 100_000;

async function pbkdf2(password: string, salt: Uint8Array): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    bs(encoder.encode(password)),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: bs(salt), iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
    key,
    256
  );
  return new Uint8Array(bits);
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const derived = await pbkdf2(password, salt);
  return `pbkdf2$${PBKDF2_ITERATIONS}$${toB64Url(salt)}$${toB64Url(derived)}`;
}

export async function verifyPassword(
  password: string,
  stored: string
): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 4 || parts[0] !== "pbkdf2") return false;
  const salt = fromB64Url(parts[2]);
  const expected = fromB64Url(parts[3]);
  const derived = await pbkdf2(password, salt);
  if (derived.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < derived.length; i++) diff |= derived[i] ^ expected[i];
  return diff === 0;
}
