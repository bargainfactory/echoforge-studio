import { cookies } from "next/headers";
import {
  SESSION_COOKIE,
  verifySessionToken,
  payloadToUser,
  type SessionUser,
} from "@/lib/auth/session";

/**
 * Resolves the authenticated user for a route handler by verifying the signed
 * session cookie. Returns null when there is no valid session.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  const payload = await verifySessionToken(token);
  return payload ? payloadToUser(payload) : null;
}

/**
 * Platform administrators are defined by the `ADMIN_EMAILS` environment
 * variable (comma-separated). Admin-only surfaces — anything that writes shared,
 * cross-tenant configuration such as API keys and payment secrets — must gate on
 * this, not merely on an authenticated session.
 *
 * Secure default: when `ADMIN_EMAILS` is unset there are NO admins, so global
 * integration secrets can only be provisioned via environment variables, never
 * by a signed-up user. Set `ADMIN_EMAILS` to enable in-app configuration.
 */
export function isAdminEmail(email: string | undefined | null): boolean {
  if (!email) return false;
  const raw = process.env.ADMIN_EMAILS;
  if (!raw) return false;
  const allow = raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return allow.includes(email.toLowerCase());
}

/**
 * Resolves the authenticated user only when they are a platform administrator.
 * Returns null for anonymous requests and for signed-in non-admin users alike.
 */
export async function getAdminUser(): Promise<SessionUser | null> {
  const user = await getSessionUser();
  return user && isAdminEmail(user.email) ? user : null;
}
