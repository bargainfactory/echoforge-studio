/**
 * Content repurposing engine — turns one long-form input (a transcript/script,
 * plus the title) into multiple real, ready-to-post assets whose text is derived
 * from the actual input (not mock data).
 *
 * Today this runs a deterministic, dependency-free generator. It is written so
 * an LLM (Claude/GPT) can be dropped in for higher-quality output: set an API
 * key and implement `generateWithLLM`, and `generateAssets` will prefer it and
 * fall back to the deterministic engine on any error.
 *
 * Both paths honor the user's BrandVoice profile: tone/audience steer the LLM
 * prompt, while CTA/hashtags/signature/banned-words/emoji policy are applied
 * mechanically so they hold even in deterministic mode.
 */

import { labelsFor } from "./generate-labels";
import type { BrandVoice } from "@/lib/data";

export interface GeneratedAsset {
  name: string;
  type: string; // e.g. "YouTube Short", "LinkedIn Carousel", "Newsletter", "X Thread"
  content: string; // human-readable, ready-to-post body
}

function normalize(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function splitSentences(text: string): string[] {
  return normalize(text)
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function wordCount(s: string): number {
  return s.trim().split(/\s+/).filter(Boolean).length;
}

function condense(s: string, max = 140): string {
  const t = s.trim();
  return t.length > max ? t.slice(0, max - 1).trimEnd() + "…" : t;
}

function shortTitle(t: string, n = 5): string {
  return t.trim().split(/\s+/).slice(0, n).join(" ") || "Your content";
}

function hashtag(t: string): string {
  return "#" + t.replace(/[^a-zA-Z0-9]/g, "").slice(0, 18);
}

/** Heuristic "virality" score used to pick hook-worthy sentences. Also
 *  exported to score backlog ideas in the Ideas tab. */
export function scoreHook(s: string): number {
  let score = 0;
  if (/\?/.test(s)) score += 2;
  if (/\d/.test(s)) score += 2;
  if (
    /\b(how|why|secret|mistake|never|always|stop|start|truth|biggest|proven|step|steps|way|ways|hack|avoid|nobody|everyone)\b/i.test(
      s
    )
  )
    score += 3;
  const w = wordCount(s);
  if (w >= 6 && w <= 26) score += 2;
  else if (w > 26) score -= 1;
  return score;
}

// --- Brand voice application (mechanical transforms, engine-agnostic) ---

function stripEmojis(s: string): string {
  return s
    .replace(/[\p{Extended_Pictographic}\u{FE0F}\u{200D}]/gu, "")
    .replace(/ {2,}/g, " ")
    .replace(/^ +/gm, "");
}

function removeBanned(s: string, banned: string): string {
  const words = banned
    .split(/[,\n]/)
    .map((w) => w.trim())
    .filter(Boolean);
  let out = s;
  for (const w of words) {
    const esc = w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    out = out.replace(new RegExp(`\\b${esc}\\b`, "gi"), "").replace(/ {2,}/g, " ");
  }
  return out;
}

/**
 * Enforces the parts of the voice profile that can be applied to finished
 * text (banned words, emoji policy). Runs on LLM output too, as a backstop —
 * the model is instructed to comply, but this makes it a guarantee.
 */
export function applyVoice(
  assets: GeneratedAsset[],
  voice?: BrandVoice
): GeneratedAsset[] {
  if (!voice) return assets;
  return assets.map((a) => {
    let name = a.name;
    let content = a.content;
    if (voice.bannedWords.trim()) {
      name = removeBanned(name, voice.bannedWords);
      content = removeBanned(content, voice.bannedWords);
    }
    if (!voice.emojis) {
      name = stripEmojis(name);
      content = stripEmojis(content);
    }
    return { ...a, name: name.trim(), content: content.trim() };
  });
}

/** Renders the voice profile as prompt directives for the LLM path. */
function voiceBlock(voice?: BrandVoice): string {
  if (!voice) return "";
  const lines: string[] = [];
  if (voice.tone.trim()) lines.push(`Tone of voice: ${voice.tone.trim()}`);
  if (voice.audience.trim()) lines.push(`Target audience: ${voice.audience.trim()}`);
  if (voice.cta.trim()) lines.push(`Default call-to-action to use: ${voice.cta.trim()}`);
  if (voice.hashtags.trim()) lines.push(`Preferred hashtags: ${voice.hashtags.trim()}`);
  if (voice.bannedWords.trim())
    lines.push(`NEVER use these words/phrases: ${voice.bannedWords.trim()}`);
  if (voice.signature.trim())
    lines.push(`Sign-off / signature for newsletters and threads: ${voice.signature.trim()}`);
  if (!voice.emojis) lines.push("Do NOT use emojis anywhere.");
  return lines.length
    ? `\n\nBrand voice profile (follow strictly):\n- ${lines.join("\n- ")}`
    : "";
}

/**
 * Deterministic generator. Produces clips + a LinkedIn carousel, a newsletter,
 * and an X thread whose contents are extracted/condensed from the transcript.
 */
export function generateAssetsDeterministic(
  title: string,
  transcript: string,
  locale?: string,
  voice?: BrandVoice
): GeneratedAsset[] {
  const L = labelsFor(locale);
  const topic = shortTitle(title, 8);
  const sents = transcript ? splitSentences(transcript) : [];
  const source = sents.length ? sents : [`${topic}: ${L.fallback}`];
  const ranked = source
    .map((s, i) => ({ s, i, score: scoreHook(s) }))
    .sort((a, b) => b.score - a.score);

  const cta = voice?.cta.trim() || "";
  const tags = voice?.hashtags.trim() || "";
  const signature = voice?.signature.trim() || "";

  const assets: GeneratedAsset[] = [];

  // --- Short-form clips (3–6) ---
  const clipCount = Math.min(6, Math.max(3, Math.round(source.length / 4) || 3));
  const platforms = [L.typeYoutubeShort, L.typeTiktokClip, L.typeInstagramReel];
  ranked.slice(0, clipCount).forEach((h, idx) => {
    const hook = h.s;
    const name =
      hook.split(/\s+/).slice(0, 7).join(" ").replace(/[.,!?;:]+$/, "") + "…";
    const secs = 24 + ((idx * 7) % 36);
    const platform = platforms[idx % platforms.length];
    assets.push({
      name,
      type: platform,
      content: `🎬 ${platform} — ~0:${String(secs).padStart(2, "0")}

${L.hook}
"${hook}"

${L.body}
${source.slice(h.i, h.i + 2).join(" ")}

${L.caption} ${name}
${L.ctaWord}: ${cta || `${L.ctaFollow} ${topic}.`}
${tags || `${hashtag(topic)} ${L.hashtags}`}`,
    });
  });

  // --- LinkedIn carousel ---
  const slides = ranked
    .slice(0, 7)
    .map((h, i) => `${L.slide} ${i + 2}: ${condense(h.s, 110)}`);
  assets.push({
    name: `${shortTitle(topic)} — ${L.nameCarousel}`,
    type: L.typeCarousel,
    content: `📑 ${L.typeCarousel} (9 ${L.slidesWord})

${L.slide} 1 (${L.hookWord}): ${topic}
${slides.join("\n")}
${L.slide} 9 (${L.ctaWord}): ${cta || L.carouselCta}`,
  });

  // --- Newsletter ---
  assets.push({
    name: `${shortTitle(topic)} — ${L.nameNewsletter}`,
    type: L.typeNewsletter,
    content: `✉️ ${L.newsletterEdition}

${L.subject} ${topic}

${L.newsletterIntro}

${source.slice(0, 3).join(" ")}

${L.takeaways}
${ranked
  .slice(0, 3)
  .map((h, i) => `${i + 1}. ${condense(h.s, 120)}`)
  .join("\n")}

${L.newsletterOutro}${signature ? `\n\n${signature}` : ""}`,
  });

  // --- X / Twitter thread ---
  const tweets = ranked.slice(0, 8).map((h, i) => `${i + 2}/ ${condense(h.s, 240)}`);
  const close = [L.threadClose, cta, signature].filter(Boolean).join("\n");
  assets.push({
    name: `${shortTitle(topic)} — ${L.nameThread}`,
    type: L.typeThread,
    content: `🧵 ${L.threadHeader}

1/ ${topic} — ${L.threadOpen}
${tweets.join("\n")}
${tweets.length + 2}/ ${close}`,
  });

  return applyVoice(assets, voice);
}

const LLM_SYSTEM = `You are EchoForge's content-repurposing engine. Given a title and a transcript/script of long-form content, produce a set of ready-to-post short-form assets derived from the ACTUAL content (never generic filler).
Produce 8-10 assets spanning: several short-form video clips (each with a hook line, body, on-screen caption idea, and 2-3 hashtags), one LinkedIn carousel (numbered slides), one email newsletter edition, and one X/Twitter thread. Use the "type" field to label each (e.g. "YouTube Short", "TikTok Clip", "Instagram Reel", "LinkedIn Carousel", "Newsletter", "X Thread"). "content" is the full ready-to-post text. "name" is a short human label.`;

const LLM_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["assets"],
  properties: {
    assets: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["name", "type", "content"],
        properties: {
          name: { type: "string" },
          type: { type: "string" },
          content: { type: "string" },
        },
      },
    },
  },
} as const;

const REGEN_SYSTEM = `You are EchoForge's content-repurposing engine. Regenerate ONE existing short-form asset from the source transcript/script. Keep the same asset type and general format, but produce a fresh, improved version derived from the ACTUAL source content (never generic filler). If revision feedback is provided, applying it takes priority. "content" is the full ready-to-post text. "name" is a short human label.`;

const REGEN_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["name", "type", "content"],
  properties: {
    name: { type: "string" },
    type: { type: "string" },
    content: { type: "string" },
  },
} as const;

/**
 * Shared LLM call. Uses Anthropic (Claude) when an Anthropic key is configured
 * (env or the integrations store), else OpenAI when that key is present, else
 * returns null so the deterministic engine runs. Any error falls through.
 */
async function llmComplete(
  system: string,
  prompt: string,
  schema: Record<string, unknown>
): Promise<{ text: string; engine: string } | null> {
  // Resolve keys from env or the integrations store, without a static import
  // cycle at module load.
  const { resolveField } = await import("./integrations");
  const anthropicKey = resolveField("llm", "anthropicApiKey");
  const openaiKey = resolveField("llm", "openaiApiKey");

  if (anthropicKey) {
    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    const client = new Anthropic({ apiKey: anthropicKey });
    // Stream so adaptive thinking + the structured JSON output share a generous
    // token budget without risking an HTTP timeout or a mid-object truncation
    // that would silently drop us to the deterministic engine.
    const stream = client.messages.stream({
      model: "claude-opus-4-8",
      max_tokens: 32000,
      thinking: { type: "adaptive" },
      system,
      output_config: { format: { type: "json_schema", schema } },
      messages: [{ role: "user", content: prompt }],
    });
    const res = await stream.finalMessage();
    const text = res.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { text: string }).text)
      .join("");
    return { text, engine: "anthropic:claude-opus-4-8" };
  }

  if (openaiKey) {
    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system + " Respond with a single JSON object." },
          { role: "user", content: prompt },
        ],
      }),
    });
    if (!resp.ok) return null;
    const data = await resp.json();
    const text = data?.choices?.[0]?.message?.content;
    return text ? { text, engine: "openai:gpt-4o" } : null;
  }

  return null;
}

function langLine(locale?: string): string {
  return locale && locale !== "en"
    ? `\n\nWrite ALL asset names and content in this language (BCP-47 code): ${locale}.`
    : "";
}

export interface GenerationResult {
  assets: GeneratedAsset[];
  engine: string; // "deterministic" or the LLM identifier that produced them
}

function parseJsonLoose(text: string): unknown | null {
  try {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start === -1 || end === -1) return null;
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
}

function cleanAsset(a: unknown): GeneratedAsset | null {
  const r = a as Record<string, unknown> | null;
  if (!r || !r.name || !r.type || !r.content) return null;
  return { name: String(r.name), type: String(r.type), content: String(r.content) };
}

function parseAssets(text: string): GeneratedAsset[] | null {
  const parsed = parseJsonLoose(text);
  if (!parsed) return null;
  const assets = Array.isArray(parsed)
    ? parsed
    : (parsed as Record<string, unknown>).assets;
  if (!Array.isArray(assets)) return null;
  const clean = assets.map(cleanAsset).filter((a): a is GeneratedAsset => a !== null);
  return clean.length ? clean : null;
}

export async function generateAssets(
  title: string,
  transcript: string,
  locale?: string,
  voice?: BrandVoice
): Promise<GenerationResult> {
  try {
    const userPrompt = `Title: ${title}\n\nTranscript / script:\n${transcript || "(no transcript provided — infer from the title)"}${voiceBlock(voice)}${langLine(locale)}`;
    const res = await llmComplete(LLM_SYSTEM, userPrompt, LLM_SCHEMA);
    if (res) {
      const parsed = parseAssets(res.text);
      if (parsed && parsed.length) {
        return { assets: applyVoice(parsed, voice), engine: res.engine };
      }
    }
  } catch {
    /* fall back to deterministic */
  }
  return {
    assets: generateAssetsDeterministic(title, transcript, locale, voice),
    engine: "deterministic",
  };
}

/**
 * Regenerates a single asset in place. The LLM path rewrites it from the
 * project's source transcript, honoring the optional user feedback and the
 * brand voice. Without a connected key, the deterministic engine re-runs and
 * the best same-type candidate is returned (feedback cannot be honored there —
 * the UI labels that mode accordingly).
 */
const SCRIPT_SYSTEM = `You are EchoForge's long-form script writer. Given a content idea (title + optional notes), write a complete, ready-to-record long-form video/podcast script: a strong cold-open hook, a short intro, 4-6 clearly structured sections with concrete substance (specific examples, numbers, actionable steps — never generic filler), a recap, and a closing call to action. Write in a natural spoken voice, plain text with paragraph breaks, no markdown headers. Respond as {"script": "..."}.`;

const SCRIPT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["script"],
  properties: { script: { type: "string" } },
} as const;

/**
 * Idea → long-form script (the reverse of repurposing). LLM when keyed; a
 * structured outline template otherwise, so the flow works in demo mode and
 * upgrades in place.
 */
export async function generateScript(
  title: string,
  notes: string,
  locale?: string,
  voice?: BrandVoice
): Promise<{ script: string; engine: string }> {
  try {
    const prompt = `Idea: ${title}${notes.trim() ? `\n\nNotes / angle:\n${notes.trim()}` : ""}${voiceBlock(voice)}${langLine(locale)}`;
    const res = await llmComplete(SCRIPT_SYSTEM, prompt, SCRIPT_SCHEMA);
    if (res) {
      const parsed = parseJsonLoose(res.text) as { script?: unknown } | null;
      const script = typeof parsed?.script === "string" ? parsed.script.trim() : "";
      if (script) {
        return {
          script: applyVoice([{ name: title, type: "Script", content: script }], voice)[0]
            .content,
          engine: res.engine,
        };
      }
    }
  } catch {
    /* fall back to the outline template */
  }

  const topic = shortTitle(title, 10);
  const cta = voice?.cta.trim() || `If this was useful, follow for more on ${topic}.`;
  const noteLines = notes
    .split(/\n+/)
    .map((n) => n.trim())
    .filter(Boolean);
  const sections =
    noteLines.length >= 3
      ? noteLines.slice(0, 6)
      : [
          `The biggest misconception about ${topic} — and what is actually true.`,
          `The mistake almost everyone makes first, and how to avoid it.`,
          `A step-by-step way to approach ${topic}, starting today.`,
          `A concrete example of this working in practice.`,
          `How to know it is working: the signals worth tracking.`,
        ];
  const script = [
    `Why does ${topic} matter more than people think? Stay with me — by the end of this you'll know exactly what to do about it.`,
    `Quick context before we get into it: most advice on ${topic} skips the part that actually moves the needle. That's what this is about.`,
    ...sections.map((s, i) => `Part ${i + 1}. ${s}\n\nLet's break that down with specifics you can act on.`),
    `Quick recap: ${sections
      .slice(0, 3)
      .map((s) => condense(s, 80))
      .join(" ")}`,
    `${cta}${voice?.signature.trim() ? `\n\n${voice.signature.trim()}` : ""}`,
  ].join("\n\n");
  return {
    script: applyVoice([{ name: title, type: "Script", content: script }], voice)[0].content,
    engine: "deterministic",
  };
}

export async function regenerateAsset(
  current: { name: string; type: string; content: string },
  ctx: {
    title: string;
    transcript: string;
    locale?: string;
    voice?: BrandVoice;
    feedback?: string;
  }
): Promise<{ asset: GeneratedAsset; engine: string }> {
  try {
    const prompt = `Title: ${ctx.title}

Source transcript / script:
${ctx.transcript || "(none — infer from the title)"}

Asset to regenerate:
Type: ${current.type}
Name: ${current.name}
Current content:
${current.content}${ctx.feedback?.trim() ? `\n\nRevision feedback (apply this): ${ctx.feedback.trim()}` : ""}${voiceBlock(ctx.voice)}${langLine(ctx.locale)}`;
    const res = await llmComplete(REGEN_SYSTEM, prompt, REGEN_SCHEMA);
    if (res) {
      const parsed = cleanAsset(parseJsonLoose(res.text));
      // Keep the original type label so the asset stays grouped consistently.
      if (parsed) {
        return {
          asset: applyVoice([{ ...parsed, type: current.type }], ctx.voice)[0],
          engine: res.engine,
        };
      }
    }
  } catch {
    /* fall back to deterministic */
  }

  const det = generateAssetsDeterministic(
    ctx.title,
    ctx.transcript,
    ctx.locale,
    ctx.voice
  );
  const sameType = det.filter((a) => a.type === current.type);
  const pick =
    sameType.find((a) => a.content !== current.content) ??
    sameType[0] ??
    det.find((a) => a.content !== current.content) ??
    det[0];
  return {
    asset: pick ? { ...pick, type: current.type } : { ...current },
    engine: "deterministic",
  };
}
