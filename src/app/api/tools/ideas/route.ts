import { NextRequest, NextResponse } from "next/server";
import { scoreHook } from "@/lib/server/generate";
import { insertEvent } from "@/lib/server/db";
import { rateLimit, clientIp } from "@/lib/server/rate-limit";

export const dynamic = "force-dynamic";

// Proven title shapes; {n} takes the niche. Deterministic and free forever.
const PATTERNS = [
  "Why most {n} creators quit in 90 days",
  "5 {n} mistakes beginners always make",
  "How I'd start {n} from zero in 2026",
  "The truth about {n} nobody says out loud",
  "What 30 days of daily {n} actually did",
  "Stop doing this in {n} (do this instead)",
  "{n} myths that keep you small",
  "The 80/20 of {n}: what actually matters",
  "Beginner vs pro {n}: the 3 real differences",
  "{n} tools worth paying for (and the free ones)",
  "How {n} makes money — the honest numbers",
  "One week of {n} with zero experience",
];

export async function POST(req: NextRequest) {
  const gate = rateLimit(`ideas:${clientIp(req)}`, 20, 5 * 60 * 1000);
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
  const niche = String((body as Record<string, unknown>)?.niche ?? "")
    .trim()
    .slice(0, 80);
  if (!niche) return NextResponse.json({ error: "Enter your niche" }, { status: 400 });

  const ideas = PATTERNS.map((p) => {
    const title = p.replace(/\{n\}/g, niche);
    return { title, score: Math.max(5, Math.round((scoreHook(title) / 9) * 100)) };
  })
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  insertEvent("tool_ideas", "/tools/video-ideas", niche.slice(0, 40));
  return NextResponse.json({ ideas });
}
