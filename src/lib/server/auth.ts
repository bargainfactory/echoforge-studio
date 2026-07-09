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
