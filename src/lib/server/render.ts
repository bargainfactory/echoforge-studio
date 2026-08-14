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

// &HAABBGGRR — libass color order. DejaVu Sans ships with the server's ffmpeg
// (fontconfig falls back sensibly where it doesn't exist).
const STYLE_LINES: Record<CaptionStyle, { style: string; wordsPerChunk: number; upper: boolean }> = {
  bold: {
    style:
      "Style: Default,DejaVu Sans,96,&H00FFFFFF,&H00FFFFFF,&H00000000,&H80000000,1,0,0,0,100,100,0,0,1,7,0,2,60,60,640,1",
    wordsPerChunk: 3,
    upper: true,
  },
  neon: {
    style:
      "Style: Default,DejaVu Sans,88,&H00FFFFFF,&H00FFFFFF,&H00F755A8,&H80000000,1,0,0,0,100,100,0,0,1,5,2,2,60,60,640,1",
    wordsPerChunk: 3,
    upper: false,
  },
  clean: {
    style:
      "Style: Default,DejaVu Sans,64,&H00FFFFFF,&H00FFFFFF,&H00000000,&H80000000,0,0,0,0,100,100,0,0,1,3,0,2,80,80,260,1",
    wordsPerChunk: 4,
    upper: false,
  },
};

/** Build the .ass subtitle document for one clip window. */
export function buildAss(
  words: TranscriptWord[],
  clipStart: number,
  clipEnd: number,
  style: CaptionStyle
): string {
  const cfg = STYLE_LINES[style] ?? STYLE_LINES.bold;
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
    cfg.style,
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
    const ass = buildAss(words, clip.startSec, clip.endSec, clip.style as CaptionStyle);
    fs.writeFileSync(path.join(jobDir, "subs.ass"), ass, "utf8");

    const vf =
      "crop='min(iw,ih*9/16)':'min(ih,iw*16/9)',scale=1080:1920,ass=subs.ass";
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
          await renderOne(next);
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
