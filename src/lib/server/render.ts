/**
 * Clip rendering: ffmpeg turns a stored source video + word timestamps into a
 * 1080x1920 vertical clip with burned-in captions (libass).
 *
 * Design constraints:
 * - CPU-bound on a small VPS → a single in-process worker renders one clip at
 *   a time off the DB queue; the scheduler tick re-kicks it after restarts.
 * - The .ass subtitle file sits in a per-job temp dir and ffmpeg runs with
 *   cwd there, so the filtergraph references a bare filename — no path
 *   escaping issues on either Windows (drive colons) or Linux.
 * - No ffmpeg installed (e.g. a fresh dev box) fails the job with a clear
 *   message instead of crashing anything.
 */

import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import {
  getProjectMedia,
  insertNotification,
  listQueuedClips,
  updateClip,
  type Clip,
  type TranscriptWord,
} from "./db";
import { estimateWords } from "./clips";

export const CAPTION_STYLES = ["bold", "neon", "clean"] as const;
export type CaptionStyle = (typeof CAPTION_STYLES)[number];

const RENDERS_DIR = path.join(process.cwd(), "data", "renders");

function fmtAssTime(sec: number): string {
  const s = Math.max(0, sec);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const rest = (s % 60).toFixed(2).padStart(5, "0");
  return `${h}:${String(m).padStart(2, "0")}:${rest}`;
}

function assEscape(text: string): string {
  return text.replace(/[{}\\]/g, "").replace(/\s+/g, " ").trim();
}

export const CAPTION_POSITIONS = ["top", "middle", "bottom"] as const;
export type CaptionPosition = (typeof CAPTION_POSITIONS)[number];

export const CROP_FOCUSES = ["left", "center", "right"] as const;
export type CropFocus = (typeof CROP_FOCUSES)[number];

// &HAABBGGRR — libass color order. DejaVu Sans ships with the server's ffmpeg
// (fontconfig falls back sensibly where it doesn't exist). MarginV/Alignment
// are composed per caption position — talking-head clips want captions off
// the speaker's face.
const STYLE_BASE: Record<
  CaptionStyle,
  { face: string; bottomMarginV: number; wordsPerChunk: number; upper: boolean }
> = {
  bold: {
    face: "DejaVu Sans,96,&H00FFFFFF,&H00FFFFFF,&H00000000,&H80000000,1,0,0,0,100,100,0,0,1,7,0",
    bottomMarginV: 640,
    wordsPerChunk: 3,
    upper: true,
  },
  neon: {
    face: "DejaVu Sans,88,&H00FFFFFF,&H00FFFFFF,&H00F755A8,&H80000000,1,0,0,0,100,100,0,0,1,5,2",
    bottomMarginV: 640,
    wordsPerChunk: 3,
    upper: false,
  },
  clean: {
    face: "DejaVu Sans,64,&H00FFFFFF,&H00FFFFFF,&H00000000,&H80000000,0,0,0,0,100,100,0,0,1,3,0",
    bottomMarginV: 260,
    wordsPerChunk: 4,
    upper: false,
  },
};

function styleLine(style: CaptionStyle, position: CaptionPosition): string {
  const base = STYLE_BASE[style] ?? STYLE_BASE.bold;
  // ASS numpad alignment: 8 = top-center, 5 = middle-center, 2 = bottom-center.
  const [align, marginV] =
    position === "top" ? [8, 140] : position === "middle" ? [5, 0] : [2, base.bottomMarginV];
  return `Style: Default,${base.face},${align},60,60,${marginV},1`;
}

/** Build the .ass subtitle document for one clip window. */
export function buildAss(
  words: TranscriptWord[],
  clipStart: number,
  clipEnd: number,
  style: CaptionStyle,
  position: CaptionPosition = "bottom"
): string {
  const cfg = STYLE_BASE[style] ?? STYLE_BASE.bold;
  const inRange = words.filter((w) => w.e > clipStart && w.s < clipEnd);

  const events: string[] = [];
  let chunk: TranscriptWord[] = [];
  const flush = () => {
    if (!chunk.length) return;
    const start = Math.max(0, chunk[0].s - clipStart);
    const end = Math.min(clipEnd - clipStart, chunk[chunk.length - 1].e - clipStart);
    if (end > start) {
      let text = assEscape(chunk.map((w) => w.w).join(" "));
      if (cfg.upper) text = text.toUpperCase();
      if (text) {
        events.push(`Dialogue: 0,${fmtAssTime(start)},${fmtAssTime(end)},Default,,0,0,0,,${text}`);
      }
    }
    chunk = [];
  };
  for (const w of inRange) {
    // A speaker change (diarized interviews) always starts a fresh caption.
    if (chunk.length && w.sp !== undefined && w.sp !== chunk[chunk.length - 1].sp) flush();
    chunk.push(w);
    const dur = chunk[chunk.length - 1].e - chunk[0].s;
    if (chunk.length >= cfg.wordsPerChunk || dur >= 2.2) flush();
  }
  flush();

  return [
    "[Script Info]",
    "ScriptType: v4.00+",
    "PlayResX: 1080",
    "PlayResY: 1920",
    "WrapStyle: 0",
    "ScaledBorderAndShadow: yes",
    "",
    "[V4+ Styles]",
    "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding",
    styleLine(style, position),
    "",
    "[Events]",
    "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text",
    ...events,
    "",
  ].join("\n");
}

function run(cmd: string, args: string[], cwd?: string): Promise<{ code: number; err: string }> {
  return new Promise((resolve) => {
    let err = "";
    let child;
    try {
      child = spawn(cmd, args, { cwd, windowsHide: true });
    } catch (e) {
      resolve({ code: -1, err: String(e) });
      return;
    }
    child.stderr?.on("data", (d) => {
      err += String(d);
      if (err.length > 8000) err = err.slice(-8000);
    });
    child.on("error", (e) => resolve({ code: -1, err: String(e) }));
    child.on("close", (code) => resolve({ code: code ?? -1, err }));
  });
}

/** Media duration via ffprobe; null when unavailable. */
export async function probeDuration(absPath: string): Promise<number | null> {
  return new Promise((resolve) => {
    let out = "";
    let child;
    try {
      child = spawn(
        "ffprobe",
        ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", absPath],
        { windowsHide: true }
      );
    } catch {
      resolve(null);
      return;
    }
    child.stdout?.on("data", (d) => (out += String(d)));
    child.on("error", () => resolve(null));
    child.on("close", () => {
      const n = parseFloat(out.trim());
      resolve(Number.isFinite(n) && n > 0 ? n : null);
    });
  });
}

async function renderOne(clip: Clip & { userEmail: string }): Promise<void> {
  const media = getProjectMedia(clip.userEmail, clip.projectId);
  if (!media?.storagePath) throw new Error("source video is no longer stored for this project");
  const srcAbs = path.join(process.cwd(), media.storagePath);
  if (!fs.existsSync(srcAbs)) throw new Error("source video file is missing on disk");

  const duration = media.durationSec ?? (await probeDuration(srcAbs));
  const words =
    media.words ??
    (media.transcript && duration ? estimateWords(media.transcript, duration) : []);

  fs.mkdirSync(RENDERS_DIR, { recursive: true });
  const jobDir = path.join(RENDERS_DIR, `tmp-${clip.id}`);
  fs.mkdirSync(jobDir, { recursive: true });
  const outAbs = path.join(RENDERS_DIR, `${clip.id}.mp4`);

  try {
    const ass = buildAss(
      words,
      clip.startSec,
      clip.endSec,
      clip.style as CaptionStyle,
      clip.position as CaptionPosition
    );
    fs.writeFileSync(path.join(jobDir, "subs.ass"), ass, "utf8");

    // Crop focus: where the subject sits in the source frame — left, center,
    // or right slice of the 9:16 cut (the pragmatic talking-head fix until
    // true face tracking).
    const cropX =
      clip.focus === "left" ? "0" : clip.focus === "right" ? "iw-ow" : "(iw-ow)/2";
    const vf = `crop='min(iw,ih*9/16)':'min(ih,iw*16/9)':${cropX}:'(ih-oh)/2',scale=1080:1920,ass=subs.ass`;
    const args = [
      "-y",
      "-ss",
      String(clip.startSec),
      "-i",
      srcAbs,
      "-t",
      String(Math.max(1, clip.endSec - clip.startSec)),
      "-vf",
      vf,
      "-c:v",
      "libx264",
      "-preset",
      "veryfast",
      "-crf",
      "23",
      "-c:a",
      "aac",
      "-b:a",
      "128k",
      "-movflags",
      "+faststart",
      outAbs,
    ];
    const res = await run("ffmpeg", args, jobDir);
    if (res.code !== 0) {
      const missing = res.err.includes("ENOENT");
      throw new Error(
        missing
          ? "ffmpeg is not installed on this server"
          : `ffmpeg exited ${res.code}: ${res.err.slice(-300)}`
      );
    }
    if (!fs.existsSync(outAbs) || fs.statSync(outAbs).size === 0) {
      throw new Error("render produced no output");
    }
    updateClip(clip.userEmail, clip.id, {
      status: "ready",
      outputPath: path.relative(process.cwd(), outAbs),
      error: null,
    });
    insertNotification(clip.userEmail, {
      id: `n-${crypto.randomUUID()}`,
      title: "Clip Ready",
      message: `"${clip.title}" rendered with captions — preview, download, or schedule it from Clip Studio.`,
      time: "Just now",
      read: false,
      type: "success",
    });
  } finally {
    fs.rmSync(jobDir, { recursive: true, force: true });
  }
}

/**
 * Script video: TTS narration + animated waveform + burned captions over a
 * branded dark canvas — a complete faceless video from typed text, no
 * recording involved. Enters the same queue and delivery path as clips.
 */
async function renderScriptVideo(clip: Clip & { userEmail: string }): Promise<void> {
  if (!clip.script?.trim()) throw new Error("script text is missing");

  const { synthesizeSpeech } = await import("./tts");
  const tts = await synthesizeSpeech(clip.script);
  if (!tts) {
    throw new Error(
      "no voiceover provider — connect an ElevenLabs or OpenAI key in the Operator Console"
    );
  }

  fs.mkdirSync(RENDERS_DIR, { recursive: true });
  const jobDir = path.join(RENDERS_DIR, `tmp-${clip.id}`);
  fs.mkdirSync(jobDir, { recursive: true });
  const outAbs = path.join(RENDERS_DIR, `${clip.id}.mp4`);

  try {
    const voicePath = path.join(jobDir, "voice.mp3");
    fs.writeFileSync(voicePath, tts.bytes);
    const duration = await probeDuration(voicePath);
    if (!duration) throw new Error("could not read the narration's duration");

    const words = estimateWords(clip.script, duration);
    const ass = buildAss(
      words,
      0,
      duration,
      clip.style as CaptionStyle,
      clip.position as CaptionPosition
    );
    fs.writeFileSync(path.join(jobDir, "subs.ass"), ass, "utf8");

    const args = [
      "-y",
      "-f",
      "lavfi",
      "-i",
      "color=c=0x140a24:s=1080x1920:r=30",
      "-i",
      "voice.mp3",
      "-filter_complex",
      "[1:a]showwaves=s=1080x220:mode=cline:rate=30:colors=0xa855f7|0x3b82f6[w];[0:v][w]overlay=0:1520[bg];[bg]ass=subs.ass[v]",
      "-map",
      "[v]",
      "-map",
      "1:a",
      "-shortest",
      "-c:v",
      "libx264",
      "-preset",
      "veryfast",
      "-crf",
      "23",
      "-c:a",
      "aac",
      "-b:a",
      "128k",
      "-movflags",
      "+faststart",
      outAbs,
    ];
    const res = await run("ffmpeg", args, jobDir);
    if (res.code !== 0) {
      throw new Error(
        res.err.includes("ENOENT")
          ? "ffmpeg is not installed on this server"
          : `ffmpeg exited ${res.code}: ${res.err.slice(-300)}`
      );
    }
    if (!fs.existsSync(outAbs) || fs.statSync(outAbs).size === 0) {
      throw new Error("render produced no output");
    }
    updateClip(clip.userEmail, clip.id, {
      status: "ready",
      outputPath: path.relative(process.cwd(), outAbs),
      error: null,
    });
    insertNotification(clip.userEmail, {
      id: `n-${crypto.randomUUID()}`,
      title: "Script Video Ready",
      message: `"${clip.title}" is narrated (${tts.provider}), captioned, and rendered — preview, download, or schedule it from the Clips tab.`,
      time: "Just now",
      read: false,
      type: "success",
    });
  } finally {
    fs.rmSync(jobDir, { recursive: true, force: true });
  }
}

declare global {
  // One render at a time, surviving dev-mode module reloads.
  var __virafoldRenderBusy: boolean | undefined;
}

/** Drain the render queue sequentially. Safe to call from anywhere, any time —
 *  returns immediately if a render is already in flight. */
export function kickRenderWorker(): void {
  if (globalThis.__virafoldRenderBusy) return;
  globalThis.__virafoldRenderBusy = true;
  (async () => {
    try {
      for (;;) {
        const next = listQueuedClips()[0];
        if (!next) break;
        updateClip(next.userEmail, next.id, { status: "rendering" });
        try {
          if (next.kind === "script") await renderScriptVideo(next);
          else await renderOne(next);
        } catch (e) {
          updateClip(next.userEmail, next.id, {
            status: "failed",
            error: String(e instanceof Error ? e.message : e).slice(0, 300),
          });
          insertNotification(next.userEmail, {
            id: `n-${crypto.randomUUID()}`,
            title: "Clip Render Failed",
            message: `"${next.title}" could not be rendered: ${String(
              e instanceof Error ? e.message : e
            ).slice(0, 160)}`,
            time: "Just now",
            read: false,
            type: "warning",
          });
        }
      }
    } finally {
      globalThis.__virafoldRenderBusy = false;
    }
  })();
}
