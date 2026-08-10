/**
 * Automatic transcription of uploaded media, so a pasted transcript becomes
 * optional: drop a video/audio file and generation runs off what was actually
 * said in it.
 *
 * Provider order: Deepgram when a key is connected (handles large files),
 * else OpenAI Whisper via the existing LLM key (25 MB API limit). No key, or
 * any provider error, returns null and the caller proceeds without a
 * transcript — same graceful-fallback contract as the rest of the platform.
 */

import { resolveField } from "./integrations";

// Whisper's hard request cap. Deepgram takes the raw body far beyond this, so
// only the Whisper path enforces it.
const WHISPER_MAX_BYTES = 25 * 1024 * 1024;
// Keep even very long recordings within a sane LLM-prompt budget.
const MAX_TRANSCRIPT_CHARS = 60_000;

export interface TranscriptionResult {
  text: string;
  provider: "deepgram:nova-2" | "openai:whisper-1";
}

export async function transcribeMedia(
  bytes: Buffer,
  fileName: string,
  mimeType: string
): Promise<TranscriptionResult | null> {
  const deepgramKey = resolveField("transcription", "deepgramApiKey");
  const openaiKey = resolveField("llm", "openaiApiKey");

  if (deepgramKey) {
    try {
      const resp = await fetch(
        "https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true",
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
        const text: string | undefined =
          data?.results?.channels?.[0]?.alternatives?.[0]?.transcript;
        if (text && text.trim()) {
          return {
            text: text.trim().slice(0, MAX_TRANSCRIPT_CHARS),
            provider: "deepgram:nova-2",
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
      const resp = await fetch("https://api.openai.com/v1/audio/transcriptions", {
        method: "POST",
        headers: { Authorization: `Bearer ${openaiKey}` },
        body: form,
      });
      if (resp.ok) {
        const data = await resp.json();
        if (typeof data?.text === "string" && data.text.trim()) {
          return {
            text: data.text.trim().slice(0, MAX_TRANSCRIPT_CHARS),
            provider: "openai:whisper-1",
          };
        }
      }
    } catch {
      /* no transcription */
    }
  }

  return null;
}
