import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server/auth";
import { addSubscriber } from "@/lib/server/db";
import { rateLimit } from "@/lib/server/rate-limit";

export const dynamic = "force-dynamic";

const EMAIL_RE = /[^\s,;"'<>]+@[^\s,;"'<>]+\.[^\s,;"'<>]+/g;
const MAX_PER_IMPORT = 1000;

/**
 * Bring-your-list importer: accepts any pasted text (CSV export, newline
 * list, address-book dump), extracts every email, and dedupes into the
 * subscriber list. Lowering the cost of moving IN is how the list becomes
 * the system of record.
 */
export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const gate = rateLimit(`subimport:${user.email}`, 10, 10 * 60 * 1000);
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
  const text = String((body as Record<string, unknown>)?.text ?? "");
  if (!text.trim()) {
    return NextResponse.json({ error: "Paste a list of emails" }, { status: 400 });
  }

  const found = [...new Set((text.match(EMAIL_RE) ?? []).map((e) => e.toLowerCase()))];
  const capped = found.slice(0, MAX_PER_IMPORT);
  let added = 0;
  for (const email of capped) {
    if (addSubscriber(user.email, email, "import")) added++;
  }
  return NextResponse.json({
    found: found.length,
    added,
    skipped: capped.length - added,
    truncated: found.length > MAX_PER_IMPORT,
  });
}
