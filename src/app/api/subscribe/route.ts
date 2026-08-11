import { NextRequest, NextResponse } from "next/server";
import { addSubscriber, getCreatorPageOwner } from "@/lib/server/db";
import { rateLimit, clientIp } from "@/lib/server/rate-limit";

export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/** Public email capture from a creator's link-in-bio page. */
export async function POST(req: NextRequest) {
  const gate = rateLimit(`subscribe:${clientIp(req)}`, 10, 10 * 60 * 1000);
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
  const email = String(b?.email ?? "").trim().toLowerCase();

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "A valid email is required" }, { status: 400 });
  }
  const found = getCreatorPageOwner(slug);
  if (!found) return NextResponse.json({ error: "Page not found" }, { status: 404 });

  addSubscriber(found.email, email, "link-in-bio");
  // Same response whether new or duplicate — no subscriber-list probing.
  return NextResponse.json({ ok: true });
}
