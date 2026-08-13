/**
 * Creator platform connections (OAuth 2.0) + real text-post delivery.
 *
 * X uses OAuth 2.0 + PKCE (S256) with refresh tokens; LinkedIn uses the
 * standard authorization-code flow. Operator app credentials come from the
 * "publishing" integration; each creator connects their own account, and
 * tokens live per-user in platform_accounts.
 *
 * Delivery today is text posts (X tweets, LinkedIn member posts) — the
 * formats Virafold's text assets can actually fill. Video platforms join
 * once the rendering pipeline exists.
 */

import { createHash, randomBytes } from "node:crypto";
import { resolveField } from "./integrations";
import {
  getPlatformAccount,
  upsertPlatformAccount,
  type PlatformAccount,
} from "./db";

export const CONNECTABLE = ["x", "linkedin"] as const;
export type ConnectablePlatform = (typeof CONNECTABLE)[number];

const BASE_URL = process.env.PUBLIC_BASE_URL || "https://virafold.ai";

export function redirectUri(platform: ConnectablePlatform): string {
  return `${BASE_URL}/api/connect/${platform}/callback`;
}

export function platformCreds(
  platform: ConnectablePlatform
): { clientId: string; clientSecret: string } | null {
  const clientId = resolveField(
    "publishing",
    platform === "x" ? "xClientId" : "linkedinClientId"
  );
  const clientSecret = resolveField(
    "publishing",
    platform === "x" ? "xClientSecret" : "linkedinClientSecret"
  );
  if (!clientId || !clientSecret) return null;
  return { clientId, clientSecret };
}

export function makeState(): string {
  return randomBytes(16).toString("hex");
}

export function makePkce(): { verifier: string; challenge: string } {
  const verifier = randomBytes(32).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  return { verifier, challenge };
}

export function authorizeUrl(
  platform: ConnectablePlatform,
  clientId: string,
  state: string,
  pkceChallenge?: string
): string {
  if (platform === "x") {
    const p = new URLSearchParams({
      response_type: "code",
      client_id: clientId,
      redirect_uri: redirectUri("x"),
      scope: "tweet.read tweet.write users.read offline.access",
      state,
      code_challenge: pkceChallenge ?? "",
      code_challenge_method: "S256",
    });
    return `https://twitter.com/i/oauth2/authorize?${p.toString()}`;
  }
  const p = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri("linkedin"),
    scope: "openid profile w_member_social",
    state,
  });
  return `https://www.linkedin.com/oauth/v2/authorization?${p.toString()}`;
}

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
}

async function form(url: string, params: Record<string, string>, basicAuth?: string) {
  const headers: Record<string, string> = {
    "Content-Type": "application/x-www-form-urlencoded",
  };
  if (basicAuth) headers.Authorization = `Basic ${basicAuth}`;
  const resp = await fetch(url, {
    method: "POST",
    headers,
    body: new URLSearchParams(params).toString(),
  });
  if (!resp.ok) throw new Error(`${url} -> ${resp.status}: ${await resp.text()}`);
  return (await resp.json()) as TokenResponse;
}

/** Exchange the authorization code, fetch identity, persist the connection. */
export async function completeConnection(
  email: string,
  platform: ConnectablePlatform,
  code: string,
  pkceVerifier?: string
): Promise<{ handle: string | null }> {
  const creds = platformCreds(platform);
  if (!creds) throw new Error("publishing app not configured");

  if (platform === "x") {
    const basic = Buffer.from(`${creds.clientId}:${creds.clientSecret}`).toString("base64");
    const tok = await form(
      "https://api.twitter.com/2/oauth2/token",
      {
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri("x"),
        code_verifier: pkceVerifier ?? "",
        client_id: creds.clientId,
      },
      basic
    );
    let externalId: string | null = null;
    let handle: string | null = null;
    try {
      const me = await fetch("https://api.twitter.com/2/users/me", {
        headers: { Authorization: `Bearer ${tok.access_token}` },
      }).then((r) => (r.ok ? r.json() : null));
      externalId = me?.data?.id ?? null;
      handle = me?.data?.username ? `@${me.data.username}` : null;
    } catch {
      /* identity is cosmetic; the connection still works */
    }
    upsertPlatformAccount(email, {
      platform: "x",
      accessToken: tok.access_token,
      refreshToken: tok.refresh_token ?? null,
      expiresAt: tok.expires_in ? Date.now() + tok.expires_in * 1000 : null,
      externalId,
      handle,
    });
    return { handle };
  }

  const tok = await form("https://www.linkedin.com/oauth/v2/accessToken", {
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri("linkedin"),
    client_id: creds.clientId,
    client_secret: creds.clientSecret,
  });
  let externalId: string | null = null;
  let handle: string | null = null;
  try {
    const me = await fetch("https://api.linkedin.com/v2/userinfo", {
      headers: { Authorization: `Bearer ${tok.access_token}` },
    }).then((r) => (r.ok ? r.json() : null));
    externalId = me?.sub ?? null;
    handle = me?.name ?? null;
  } catch {
    /* identity is cosmetic */
  }
  upsertPlatformAccount(email, {
    platform: "linkedin",
    accessToken: tok.access_token,
    refreshToken: tok.refresh_token ?? null,
    expiresAt: tok.expires_in ? Date.now() + tok.expires_in * 1000 : null,
    externalId,
    handle,
  });
  return { handle };
}

/** Returns a currently-valid access token, refreshing X tokens as needed. */
async function freshToken(
  email: string,
  acct: PlatformAccount
): Promise<string | null> {
  const stale = acct.expiresAt !== null && acct.expiresAt < Date.now() + 60_000;
  if (!stale) return acct.accessToken;
  if (acct.platform !== "x" || !acct.refreshToken) return null;

  const creds = platformCreds("x");
  if (!creds) return null;
  try {
    const basic = Buffer.from(`${creds.clientId}:${creds.clientSecret}`).toString("base64");
    const tok = await form(
      "https://api.twitter.com/2/oauth2/token",
      {
        grant_type: "refresh_token",
        refresh_token: acct.refreshToken,
        client_id: creds.clientId,
      },
      basic
    );
    upsertPlatformAccount(email, {
      ...acct,
      accessToken: tok.access_token,
      refreshToken: tok.refresh_token ?? acct.refreshToken,
      expiresAt: tok.expires_in ? Date.now() + tok.expires_in * 1000 : null,
    });
    return tok.access_token;
  } catch {
    return null;
  }
}

/**
 * Posts asset text to the creator's connected account. Returns null when no
 * usable connection exists (caller falls back to demo publish), otherwise a
 * success flag plus an error detail for honest notifications.
 */
export async function deliverPost(
  email: string,
  platform: string,
  text: string
): Promise<{ ok: boolean; detail: string } | null> {
  const key = platform.toLowerCase() === "x" ? "x" : platform.toLowerCase();
  if (key !== "x" && key !== "linkedin") return null;
  const acct = getPlatformAccount(email, key);
  if (!acct) return null;
  const token = await freshToken(email, acct);
  if (!token) return { ok: false, detail: "token expired — reconnect the account" };

  try {
    if (key === "x") {
      const resp = await fetch("https://api.twitter.com/2/tweets", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: text.slice(0, 280) }),
      });
      if (resp.ok) return { ok: true, detail: "posted to X" };
      return { ok: false, detail: `X API ${resp.status}` };
    }

    if (!acct.externalId) return { ok: false, detail: "missing LinkedIn member id — reconnect" };
    const resp = await fetch("https://api.linkedin.com/v2/ugcPosts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0",
      },
      body: JSON.stringify({
        author: `urn:li:person:${acct.externalId}`,
        lifecycleState: "PUBLISHED",
        specificContent: {
          "com.linkedin.ugc.ShareContent": {
            shareCommentary: { text: text.slice(0, 2900) },
            shareMediaCategory: "NONE",
          },
        },
        visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
      }),
    });
    if (resp.ok) return { ok: true, detail: "posted to LinkedIn" };
    return { ok: false, detail: `LinkedIn API ${resp.status}` };
  } catch (e) {
    return { ok: false, detail: String(e).slice(0, 120) };
  }
}
