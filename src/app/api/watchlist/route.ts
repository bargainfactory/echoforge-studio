import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server/auth";
import { bestPlanFor, deleteWatch, insertWatch, listWatchlist } from "@/lib/server/db";
import { checkWatchEntry } from "@/lib/server/watch";
import { rateLimit } from "@/lib/server/rate-limit";

export const dynamic = "force-dynamic";

const MAX_WATCHED = 5;

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ entries: listWatchlist(user.email) });
}

/** Pin a competitor channel; runs the first audit immediately. */
export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Matches the pricing page: the watchlist polls YouTube on a schedule, so
  // it unlocks with any paid plan.
  if (bestPlanFor(user.email) === "Free") {
    return NextResponse.json(
      { error: "The channel watchlist is a paid-plan feature — upgrade to auto-track channels" },
      { status: 402 }
    );
  }

  // Each check spends YouTube quota.
  const gate = rateLimit(`watch:${user.email}`, 10, 60 * 60 * 1000);
  if (!gate.ok) {
    return NextResponse.json(
      { error: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(gate.retryAfterSeconds) } }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const handle = String((body as Record<string, unknown>)?.handle ?? "")
    .trim()
    .slice(0, 200);
  if (!handle) return NextResponse.json({ error: "Enter a channel handle" }, { status: 400 });

  const existing = listWatchlist(user.email);
  if (existing.length >= MAX_WATCHED) {
    return NextResponse.json(
      { error: `Watchlist is limited to ${MAX_WATCHED} channels — remove one first` },
      { status: 422 }
    );
  }

  const id = `w-${crypto.randomUUID()}`;
  insertWatch(user.email, id, handle);
  const entry = listWatchlist(user.email).find((e) => e.id === id);
  if (entry) {
    const ok = await checkWatchEntry(user.email, entry);
    if (!ok) {
      deleteWatch(user.email, id);
      return NextResponse.json(
        { error: "Could not audit that channel — check the handle (and the YouTube key)" },
        { status: 422 }
      );
    }
  }
  return NextResponse.json({ entries: listWatchlist(user.email) }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const id = String((body as Record<string, unknown>)?.id ?? "");
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });
  deleteWatch(user.email, id);
  return NextResponse.json({ entries: listWatchlist(user.email) });
}
