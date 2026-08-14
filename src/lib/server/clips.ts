/**
 * Highlight detection: find the most clippable moments in a transcribed video.
 *
 * The differentiator vs. generic clipping tools: the prompt is seeded with THIS
 * creator's proven winners — recorded post metrics and their social-audit top
 * titles — and each suggested clip declares which winning pattern it matches.
 * Clips are chosen because they look like what already works for this channel,
 * not because they score well on a generic model.
 *
 * LLM-first with a deterministic fallback (hook-scored windows), same contract
 * as generation: no key or a failed call still produces usable suggestions.
 */

import { auditExemplars } from "./audit";
import { topPerformers, type TranscriptWord } from "./db";
import { llmComplete, scoreHook } from "./generate";

export interface ClipSuggestion {
  title: string;
  startSec: number;
  endSec: number;
  score: number;
  reason: string;
  matched: string | null;
}

const MIN_CLIP_SEC = 12;
const MAX_CLIP_SEC = 60;
const MAX_SUGGESTIONS = 6;

/**
 * Synthesize evenly-spaced word timings from a plain transcript — the fallback
 * for projects transcribed before timestamps were captured (or pasted by
 * hand). Approximate, but good enough to cut a clip and burn captions.
 */
export function estimateWords(transcript: string, durationSec: number): TranscriptWord[] {
  const tokens = transcript.split(/\s+/).filter(Boolean);
  if (!tokens.length || durationSec <= 0) return [];
  const per = durationSec / tokens.length;
  return tokens.map((w, i) => ({ w, s: i * per, e: (i + 1) * per }));
}

function stamp(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `[${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}]`;
}

/** Transcript with a [mm:ss] marker starting each ~8s line, so the model can
 *  cite real timestamps instead of hallucinating them. */
function timedTranscript(words: TranscriptWord[], maxChars = 24_000): string {
  const lines: string[] = [];
  let line: string[] = [];
  let lineStart = 0;
  for (const w of words) {
    if (!line.length) lineStart = w.s;
    line.push(w.w);
    if (w.e - lineStart >= 8) {
      lines.push(`${stamp(lineStart)} ${line.join(" ")}`);
      line = [];
    }
  }
  if (line.length) lines.push(`${stamp(lineStart)} ${line.join(" ")}`);
  let out = lines.join("\n");
  if (out.length > maxChars) out = out.slice(0, maxChars);
  return out;
}

const CLIPS_SCHEMA = {
  type: "object",
  properties: {
    clips: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string", description: "Hook-style caption/title for the clip, in the video's language" },
          startSec: { type: "number", description: "Clip start in seconds, aligned to a [mm:ss] marker or between two" },
          endSec: { type: "number", description: "Clip end in seconds" },
          score: { type: "number", description: "Virality potential 0-100" },
          reason: { type: "string", description: "One sentence: why this moment can carry a short" },
          matched: {
            type: ["string", "null"],
            description: "Which of the creator's proven winning patterns this clip matches, quoted or paraphrased — null if none",
          },
        },
        required: ["title", "startSec", "endSec", "score", "reason", "matched"],
      },
    },
  },
  required: ["clips"],
} as const;

function clamp(suggestions: ClipSuggestion[], durationSec: number): ClipSuggestion[] {
  const out: ClipSuggestion[] = [];
  for (const c of suggestions) {
    let start = Math.max(0, Math.min(c.startSec, durationSec - MIN_CLIP_SEC));
    let end = Math.min(durationSec, c.endSec);
    if (end - start < MIN_CLIP_SEC) end = Math.min(durationSec, start + MIN_CLIP_SEC);
    if (end - start > MAX_CLIP_SEC) end = start + MAX_CLIP_SEC;
    if (end - start < MIN_CLIP_SEC) continue;
    // Drop heavy overlaps with an already-accepted (higher-ranked) clip.
    if (out.some((o) => Math.min(o.endSec, end) - Math.max(o.startSec, start) > (end - start) / 2)) {
      continue;
    }
    start = Math.round(start * 10) / 10;
    end = Math.round(end * 10) / 10;
    out.push({
      title: c.title.slice(0, 120) || "Untitled clip",
      startSec: start,
      endSec: end,
      score: Math.max(1, Math.min(100, Math.round(c.score))),
      reason: c.reason.slice(0, 300),
      matched: c.matched ? c.matched.slice(0, 200) : null,
    });
    if (out.length >= MAX_SUGGESTIONS) break;
  }
  return out;
}

/** Deterministic fallback: hook-score ~30s sentence windows, keep the best
 *  non-overlapping ones. */
function detectDeterministic(words: TranscriptWord[], durationSec: number): ClipSuggestion[] {
  const windows: ClipSuggestion[] = [];
  const STEP = 15;
  for (let t = 0; t < Math.max(1, durationSec - MIN_CLIP_SEC); t += STEP) {
    const end = Math.min(durationSec, t + 30);
    const text = words
      .filter((w) => w.s >= t && w.s < end)
      .map((w) => w.w)
      .join(" ");
    if (text.split(/\s+/).length < 12) continue;
    const opener = text.split(/(?<=[.!?])\s+/)[0] ?? text.slice(0, 80);
    windows.push({
      title: opener.slice(0, 90),
      startSec: t,
      endSec: end,
      score: Math.min(100, scoreHook(opener) + 10),
      reason: "Strong opening line for a self-contained moment (deterministic pick).",
      matched: null,
    });
  }
  windows.sort((a, b) => b.score - a.score);
  return clamp(windows, durationSec).slice(0, 4);
}

export async function detectHighlights(
  email: string,
  title: string,
  words: TranscriptWord[],
  durationSec: number
): Promise<{ clips: ClipSuggestion[]; engine: string }> {
  // The creator's proven winners steer selection — the audit-informed moat.
  const winners = [
    ...topPerformers(email, 5).map((p) => p.assetName),
    ...auditExemplars(email, 5),
  ].filter(Boolean);

  const winnersBlock = winners.length
    ? `\n\nThis creator's PROVEN WINNING titles/hooks (from their measured post results and channel audit):\n${winners
        .map((w) => `- ${w}`)
        .join("\n")}\nPrefer moments that match these patterns, and set "matched" to the winning pattern a clip resembles.`
    : "";

  const system =
    "You are a short-form video editor who finds the most clippable moments in long-form content. " +
    "Pick self-contained segments 15-60 seconds long that open with a hook, deliver one complete idea, and would stop a scroll. " +
    "Use the [mm:ss] markers to report accurate startSec/endSec. Respond in the transcript's language.";

  const prompt = `Video title: ${title}\nDuration: ${Math.round(durationSec)}s\n\nTimestamped transcript:\n${timedTranscript(
    words
  )}${winnersBlock}\n\nReturn the ${MAX_SUGGESTIONS} best clips, ranked by virality potential.`;

  const res = await llmComplete(system, prompt, CLIPS_SCHEMA as unknown as Record<string, unknown>);
  if (res) {
    try {
      const parsed = JSON.parse(res.text) as { clips?: ClipSuggestion[] };
      if (Array.isArray(parsed.clips) && parsed.clips.length) {
        const clips = clamp(
          parsed.clips.map((c) => ({
            title: String(c.title ?? ""),
            startSec: Number(c.startSec ?? 0),
            endSec: Number(c.endSec ?? 0),
            score: Number(c.score ?? 50),
            reason: String(c.reason ?? ""),
            matched: c.matched ? String(c.matched) : null,
          })),
          durationSec
        );
        if (clips.length) return { clips, engine: res.engine };
      }
    } catch {
      /* fall through to deterministic */
    }
  }
  return { clips: detectDeterministic(words, durationSec), engine: "deterministic" };
}
