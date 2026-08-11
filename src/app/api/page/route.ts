import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server/auth";
import { getCreatorPageByEmail, upsertCreatorPage } from "@/lib/server/db";
import { rateLimit } from "@/lib/server/rate-limit";
import type { CreatorPage } from "@/lib/server/db";

export const dynamic = "force-dynamic";

const SLUG_RE = /^[a-z0-9-]{3,30}$/;
const MAX_LINKS = 8;
const MAX_RATES = 6;

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ page: getCreatorPageByEmail(user.email) });
}

export async function PUT(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const gate = rateLimit(`page:${user.email}`, 30, 10 * 60 * 1000);
  if (!gate.ok) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(gate.retryAfterSeconds) } }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const b = body as Record<string, unknown>;

  const slug = String(b?.slug ?? "").trim().toLowerCase();
  if (!SLUG_RE.test(slug)) {
    return NextResponse.json(
      { error: "URL must be 3-30 characters: lowercase letters, numbers, dashes" },
      { status: 400 }
    );
  }
  const displayName = String(b?.displayName ?? "").trim().slice(0, 80);
  if (!displayName) {
    return NextResponse.json({ error: "Display name is required" }, { status: 400 });
  }

  const links = (Array.isArray(b?.links) ? b.links : [])
    .slice(0, MAX_LINKS)
    .map((l) => ({
      label: String((l as Record<string, unknown>)?.label ?? "").trim().slice(0, 60),
      url: String((l as Record<string, unknown>)?.url ?? "").trim().slice(0, 300),
    }))
    // Only http(s) destinations — a public page must never link javascript: etc.
    .filter((l) => l.label && /^https?:\/\//i.test(l.url));

  const rates = (Array.isArray(b?.rates) ? b.rates : [])
    .slice(0, MAX_RATES)
    .map((r) => ({
      platform: String((r as Record<string, unknown>)?.platform ?? "").trim().slice(0, 40),
      price: Math.max(0, Number((r as Record<string, unknown>)?.price) || 0),
    }))
    .filter((r) => r.platform && r.price > 0);

  const page: CreatorPage = {
    slug,
    displayName,
    bio: String(b?.bio ?? "").trim().slice(0, 500),
    links,
    rates,
    enabled: b?.enabled === undefined ? true : Boolean(b.enabled),
  };

  if (!upsertCreatorPage(user.email, page)) {
    return NextResponse.json({ error: "That URL is already taken" }, { status: 409 });
  }
  return NextResponse.json({ page: getCreatorPageByEmail(user.email) });
}
