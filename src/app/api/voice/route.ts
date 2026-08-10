import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server/auth";
import { getBrandVoice, setBrandVoice } from "@/lib/server/db";
import { rateLimit } from "@/lib/server/rate-limit";
import { DEFAULT_VOICE, type BrandVoice } from "@/lib/data";

export const dynamic = "force-dynamic";

// Free-text profile fields are prompt inputs — clamp them so a single profile
// can't balloon LLM prompts or the DB row.
const MAX_FIELD = 300;

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ voice: getBrandVoice(user.email) });
}

export async function PUT(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const gate = rateLimit(`voice:${user.email}`, 30, 10 * 60 * 1000);
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
  const clamp = (v: unknown) => String(v ?? "").slice(0, MAX_FIELD).trim();
  const voice: BrandVoice = {
    ...DEFAULT_VOICE,
    tone: clamp(b.tone),
    audience: clamp(b.audience),
    cta: clamp(b.cta),
    hashtags: clamp(b.hashtags),
    bannedWords: clamp(b.bannedWords),
    signature: clamp(b.signature),
    emojis: b.emojis === undefined ? true : Boolean(b.emojis),
  };

  setBrandVoice(user.email, voice);
  return NextResponse.json({ voice });
}
