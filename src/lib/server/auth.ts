import { cookies } from "next/headers";
import {
  SESSION_COOKIE,
  verifySessionToken,
  payloadToUser,
  initialsFor,
  type SessionUser,
} from "@/lib/auth/session";

/** Acting-as cookie: which client account a manager is currently operating. */
export const ACTING_COOKIE = "vf_acting_as";

/**
 * The signed-in identity itself — ignores any acting-as delegation. Use for
 * admin gating, delegation management, and anywhere the *real* actor matters.
 */
export async function getRealSessionUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  const payload = await verifySessionToken(token);
  return payload ? payloadToUser(payload) : null;
}

/**
 * Resolves the effective user for a route handler. When a manager has an
 * acting-as cookie AND an active management link to that client, every
 * feature operates on the client's account — projects, voice, connections,
 * metrics — because the whole codebase keys off this email. The delegation
 * is re-verified on every request, so revoking a link takes effect
 * immediately. Returns null when there is no valid session.
 */
export async function getSessionUser(): Promise<
  (SessionUser & { actingFor?: string }) | null
> {
  const real = await getRealSessionUser();
  if (!real) return null;

  const store = await cookies();
  const acting = store.get(ACTING_COOKIE)?.value?.trim().toLowerCase();
  if (!acting || acting === real.email.toLowerCase()) return real;

  const { isActiveManager, findUser } = await import("./db");
  if (!isActiveManager(real.email, acting)) return real;
  const client = findUser(acting);
  if (!client) return real;

  return {
    email: client.email,
    name: client.name,
    initials: initialsFor(client.name),
    plan: client.plan,
    // The real actor, for audit trails and UI banners.
    actingFor: real.email,
  };
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
 * Gates on the REAL identity — admin power never transfers through acting-as,
 * and an admin acting as a client still administers as themselves.
 */
export async function getAdminUser(): Promise<SessionUser | null> {
  const user = await getRealSessionUser();
  return user && isAdminEmail(user.email) ? user : null;
}
