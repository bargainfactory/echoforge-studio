/**
 * Automatic transcription of uploaded media, so a pasted transcript becomes
 * optional: drop a video/audio file and generation runs off what was actually
 * said in it.
 *
 * Provider order: Deepgram when a key is connected (handles large files),
 * else OpenAI Whisper via the existing LLM key (25 MB API limit). No key, or
 * any provider error, returns null and the caller proceeds without a
 * transcript — same graceful-fallback contract as the rest of the platform.
 *
 * Both providers also return word-level timestamps and total duration when
 * available — the raw material Clip Studio needs for highlight detection and
 * caption burning.
 */

import { resolveField } from "./integrations";
import type { TranscriptWord } from "./db";

// Whisper's hard request cap. Deepgram takes the raw body far beyond this, so
// only the Whisper path enforces it.
const WHISPER_MAX_BYTES = 25 * 1024 * 1024;
// Keep even very long recordings within a sane LLM-prompt budget.
const MAX_TRANSCRIPT_CHARS = 60_000;
// ~3h of speech; bounds the JSON blob stored per project.
const MAX_WORDS = 30_000;

export interface TranscriptionResult {
  text: string;
  provider: "deepgram:nova-2" | "xai:stt" | "openai:whisper-1";
  words: TranscriptWord[] | null;
  durationSec: number | null;
}

/** Defensive parse of xAI STT word timings — accepts the common shapes and
 *  returns null (→ even-spacing estimator) when the format is unfamiliar. */
function parseXaiWords(data: unknown): TranscriptWord[] | null {
  const d = data as Record<string, unknown>;
  const raw: unknown[] | null = Array.isArray(d?.words)
    ? (d.words as unknown[])
    : Array.isArray(d?.segments)
      ? (d.segments as Record<string, unknown>[]).flatMap((s) =>
          Array.isArray(s?.words) ? (s.words as unknown[]) : []
        )
      : null;
  if (!raw?.length) return null;
  const words = raw
    .slice(0, MAX_WORDS)
    .map((x) => {
      const w = x as Record<string, unknown>;
      const sp =
        typeof w.speaker === "number"
          ? w.speaker
          : typeof w.speaker_id === "number"
            ? w.speaker_id
            : undefined;
      return {
        w: String(w.word ?? w.text ?? ""),
        s: Number(w.start ?? w.start_time ?? 0),
        e: Number(w.end ?? w.end_time ?? 0),
        ...(sp !== undefined ? { sp } : {}),
      };
    })
    .filter((x) => x.w);
  return words.length ? words : null;
}

export async function transcribeMedia(
  bytes: Buffer,
  fileName: string,
  mimeType: string
): Promise<TranscriptionResult | null> {
  const deepgramKey = resolveField("transcription", "deepgramApiKey");
  const xaiKey = resolveField("llm", "xaiApiKey");
  const openaiKey = resolveField("llm", "openaiApiKey");

  if (deepgramKey) {
    try {
      const resp = await fetch(
        "https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true&diarize=true",
        {
          method: "POST",
          headers: {
            Authorization: `Token ${deepgramKey}`,
            "Content-Type": mimeType || "application/octet-stream",
          },
          body: new Uint8Array(bytes),
        }
      );
      if (resp.ok) {
        const data = await resp.json();
        const alt = data?.results?.channels?.[0]?.alternatives?.[0];
        const text: string | undefined = alt?.transcript;
        if (text && text.trim()) {
          let words: TranscriptWord[] | null = null;
          if (Array.isArray(alt?.words)) {
            words = (alt.words as Record<string, unknown>[])
              .slice(0, MAX_WORDS)
              .map((w) => ({
                w: String(w.punctuated_word ?? w.word ?? ""),
                s: Number(w.start ?? 0),
                e: Number(w.end ?? 0),
                // Speaker index from diarization — unlocks interview features.
                ...(typeof w.speaker === "number" ? { sp: w.speaker } : {}),
              }))
              .filter((w) => w.w);
          }
          const durationSec =
            typeof data?.metadata?.duration === "number" ? data.metadata.duration : null;
          return {
            text: text.trim().slice(0, MAX_TRANSCRIPT_CHARS),
            provider: "deepgram:nova-2",
            words: words?.length ? words : null,
            durationSec,
          };
        }
      }
    } catch {
      /* fall through to Whisper */
    }
  }

  // xAI STT: word-level timestamps + diarization on the key most accounts
  // already have; $0.10/hour batch, no small-file cap.
  if (xaiKey) {
    try {
      const form = new FormData();
      form.append(
        "file",
        new Blob([new Uint8Array(bytes)], { type: mimeType || "application/octet-stream" }),
        fileName || "upload.mp4"
      );
      const resp = await fetch("https://api.x.ai/v1/stt", {
        method: "POST",
        headers: { Authorization: `Bearer ${xaiKey}` },
        body: form,
      });
      if (resp.ok) {
        const data = await resp.json();
        if (typeof data?.text === "string" && data.text.trim()) {
          const words = parseXaiWords(data);
          const durationSec =
            typeof data?.duration === "number"
              ? data.duration
              : words?.length
                ? words[words.length - 1].e
                : null;
          return {
            text: data.text.trim().slice(0, MAX_TRANSCRIPT_CHARS),
            provider: "xai:stt" as TranscriptionResult["provider"],
            words,
            durationSec,
          };
        }
      }
    } catch {
      /* fall through to Whisper */
    }
  }

  if (openaiKey && bytes.length <= WHISPER_MAX_BYTES) {
    try {
      const form = new FormData();
      form.append(
        "file",
        new Blob([new Uint8Array(bytes)], { type: mimeType || "application/octet-stream" }),
        fileName || "upload.mp4"
      );
      form.append("model", "whisper-1");
      // verbose_json + word granularity → timestamps for caption burning.
      form.append("response_format", "verbose_json");
      form.append("timestamp_granularities[]", "word");
      const resp = await fetch("https://api.openai.com/v1/audio/transcriptions", {
        method: "POST",
        headers: { Authorization: `Bearer ${openaiKey}` },
        body: form,
      });
      if (resp.ok) {
        const data = await resp.json();
        if (typeof data?.text === "string" && data.text.trim()) {
          let words: TranscriptWord[] | null = null;
          if (Array.isArray(data?.words)) {
            words = (data.words as Record<string, unknown>[])
              .slice(0, MAX_WORDS)
              .map((w) => ({
                w: String(w.word ?? ""),
                s: Number(w.start ?? 0),
                e: Number(w.end ?? 0),
              }))
              .filter((w) => w.w);
          }
          const durationSec = typeof data?.duration === "number" ? data.duration : null;
          return {
            text: data.text.trim().slice(0, MAX_TRANSCRIPT_CHARS),
            provider: "openai:whisper-1",
            words: words?.length ? words : null,
            durationSec,
          };
        }
      }
    } catch {
      /* no transcription */
    }
  }

  return null;
}
