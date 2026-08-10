import { NextRequest, NextResponse } from "next/server";
import { generateAssetsDeterministic } from "@/lib/server/generate";
import { getFlags, insertEvent } from "@/lib/server/db";
import { rateLimit, clientIp } from "@/lib/server/rate-limit";

export const dynamic = "force-dynamic";

/**
 * Public, no-signup "try it": paste a transcript or a topic and get real,
 * content-derived assets back. Uses the deterministic engine only (no keys, no
 * cost, no DB writes) — the signup-gated flow upgrades to Claude/GPT quality.
 */
export async function POST(req: NextRequest) {
  if (!getFlags().generationEnabled) {
    return NextResponse.json(
      { error: "Generation is temporarily disabled" },
      { status: 503 }
    );
  }

  // Public endpoint — throttle per-IP to bound anonymous DB writes / compute.
  const gate = rateLimit(`try:${clientIp(req)}`, 20, 5 * 60 * 1000);
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
  const input = String(b?.input ?? "").trim().slice(0, 6000);
  const locale = String(b?.locale ?? "en").slice(0, 8);
  if (!input) {
    return NextResponse.json({ error: "Enter a topic or transcript" }, { status: 400 });
  }

  // Short input → treat as a topic/title; longer input → a transcript.
  const wordCount = input.split(/\s+/).length;
  const isTranscript = input.length > 80 || wordCount > 12;
  const title = isTranscript ? input.split(/\s+/).slice(0, 8).join(" ") : input;
  const transcript = isTranscript ? input : "";

  const assets = generateAssetsDeterministic(title, transcript, locale);
  insertEvent("try_generate", "/", JSON.stringify({ words: wordCount, assets: assets.length }));

  return NextResponse.json({ assets });
}
