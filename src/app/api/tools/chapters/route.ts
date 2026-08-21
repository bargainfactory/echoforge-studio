import { NextRequest, NextResponse } from "next/server";
import { scoreHook } from "@/lib/server/generate";
import { insertEvent } from "@/lib/server/db";
import { rateLimit, clientIp } from "@/lib/server/rate-limit";

export const dynamic = "force-dynamic";

function stamp(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  return h > 0
    ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
    : `${m}:${String(s).padStart(2, "0")}`;
}

/**
 * Free podcast chapters + show notes: paste a transcript, get timestamped
 * chapters (word-share estimated at ~150 wpm unless a duration is given),
 * takeaway notes, and pull-quotes. Deterministic — free forever.
 */
export async function POST(req: NextRequest) {
  const gate = rateLimit(`chap:${clientIp(req)}`, 15, 5 * 60 * 1000);
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
  const transcript = String(b?.transcript ?? "").trim().slice(0, 60_000);
  const durationMin = Number(b?.durationMin) || 0;
  if (transcript.split(/\s+/).length < 100) {
    return NextResponse.json(
      { error: "Paste at least ~100 words of transcript" },
      { status: 400 }
    );
  }

  const sents = transcript.split(/(?<=[.!?])\s+/).filter((s) => s.trim().length > 0);
  const totalWords = transcript.split(/\s+/).length;
  const totalSec = durationMin > 0 ? durationMin * 60 : (totalWords / 150) * 60;

  // Chapters: equal sentence bands; each titled by its strongest hook line.
  const n = Math.max(4, Math.min(8, Math.round(totalSec / 300)));
  const per = Math.ceil(sents.length / n);
  const chapters: { time: string; title: string }[] = [];
  let wordsSoFar = 0;
  for (let i = 0; i < sents.length; i += per) {
    const band = sents.slice(i, i + per);
    const best = [...band].sort((a, c) => scoreHook(c) - scoreHook(a))[0] ?? band[0];
    chapters.push({
      time: stamp((wordsSoFar / totalWords) * totalSec),
      title: best.replace(/[.!?]+$/, "").split(/\s+/).slice(0, 10).join(" "),
    });
    wordsSoFar += band.join(" ").split(/\s+/).length;
  }
  if (chapters.length) chapters[0].time = "0:00"; // platform convention

  const ranked = [...sents].sort((a, c) => scoreHook(c) - scoreHook(a));
  const notes = ranked.slice(0, 5).map((s) => s.trim());
  const quotes = ranked
    .filter((s) => s.split(/\s+/).length >= 8 && s.split(/\s+/).length <= 30)
    .slice(0, 3)
    .map((s) => `“${s.trim().replace(/[.!?]+$/, "")}”`);

  insertEvent("tool_chapters", "/tools/podcast-chapters", String(chapters.length));
  return NextResponse.json({ chapters, notes, quotes });
}
