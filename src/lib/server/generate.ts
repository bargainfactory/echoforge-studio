/**
 * Content repurposing engine — turns one long-form input (a transcript/script,
 * plus the title) into multiple real, ready-to-post assets whose text is derived
 * from the actual input (not mock data).
 *
 * Today this runs a deterministic, dependency-free generator. It is written so
 * an LLM (Claude/GPT) can be dropped in for higher-quality output: set an API
 * key and implement `generateWithLLM`, and `generateAssets` will prefer it and
 * fall back to the deterministic engine on any error.
 */

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

/** Heuristic "virality" score used to pick hook-worthy sentences. */
function scoreHook(s: string): number {
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

/**
 * Deterministic generator. Produces clips + a LinkedIn carousel, a newsletter,
 * and an X thread whose contents are extracted/condensed from the transcript.
 */
export function generateAssetsDeterministic(
  title: string,
  transcript: string
): GeneratedAsset[] {
  const topic = shortTitle(title, 8);
  const sents = transcript ? splitSentences(transcript) : [];
  const source = sents.length
    ? sents
    : [`${topic}: the core ideas, condensed for short-form.`];
  const ranked = source
    .map((s, i) => ({ s, i, score: scoreHook(s) }))
    .sort((a, b) => b.score - a.score);

  const assets: GeneratedAsset[] = [];

  // --- Short-form clips (3–6) ---
  const clipCount = Math.min(6, Math.max(3, Math.round(source.length / 4) || 3));
  const platforms = ["YouTube Short", "TikTok Clip", "Instagram Reel"];
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

HOOK (0:00–0:03):
"${hook}"

BODY:
${source.slice(h.i, h.i + 2).join(" ")}

ON-SCREEN CAPTION: ${name}
CTA: Follow for more on ${topic}.
${hashtag(topic)} #shorts #creator`,
    });
  });

  // --- LinkedIn carousel ---
  const slides = ranked
    .slice(0, 7)
    .map((h, i) => `Slide ${i + 2}: ${condense(h.s, 110)}`);
  assets.push({
    name: `${shortTitle(topic)} — Carousel`,
    type: "LinkedIn Carousel",
    content: `📑 LinkedIn Carousel (9 slides)

Slide 1 (Hook): ${topic}
${slides.join("\n")}
Slide 9 (CTA): Save this for later — follow for more.`,
  });

  // --- Newsletter ---
  assets.push({
    name: `${shortTitle(topic)} — Newsletter`,
    type: "Newsletter",
    content: `✉️ Newsletter Edition

Subject: ${topic}

Here's the one idea worth your time this week.

${source.slice(0, 3).join(" ")}

Three takeaways:
${ranked
  .slice(0, 3)
  .map((h, i) => `${i + 1}. ${condense(h.s, 120)}`)
  .join("\n")}

That's it for this week — reply and tell me what landed.`,
  });

  // --- X / Twitter thread ---
  const tweets = ranked.slice(0, 8).map((h, i) => `${i + 2}/ ${condense(h.s, 240)}`);
  assets.push({
    name: `${shortTitle(topic)} — Thread`,
    type: "X Thread",
    content: `🧵 X / Twitter Thread

1/ ${topic} — a thread 👇
${tweets.join("\n")}
${tweets.length + 2}/ If this helped, repost the first tweet.`,
  });

  return assets;
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

/**
 * LLM upgrade path. Uses Anthropic (Claude) when an Anthropic key is configured
 * (env or the integrations store), else OpenAI when that key is present, else
 * returns null so the deterministic engine runs. Any error falls through.
 */
async function generateWithLLM(
  title: string,
  transcript: string
): Promise<GeneratedAsset[] | null> {
  // Resolve keys from env or the integrations store, without a static import
  // cycle at module load.
  const { resolveField } = await import("./integrations");
  const anthropicKey = resolveField("llm", "anthropicApiKey");
  const openaiKey = resolveField("llm", "openaiApiKey");

  const userPrompt = `Title: ${title}\n\nTranscript / script:\n${transcript || "(no transcript provided — infer from the title)"}`;

  if (anthropicKey) {
    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    const client = new Anthropic({ apiKey: anthropicKey });
    const res = await client.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 16000,
      thinking: { type: "adaptive" },
      system: LLM_SYSTEM,
      output_config: { format: { type: "json_schema", schema: LLM_SCHEMA } },
      messages: [{ role: "user", content: userPrompt }],
    });
    const text = res.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { text: string }).text)
      .join("");
    return parseAssets(text);
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
          { role: "system", content: LLM_SYSTEM + " Respond with a JSON object {\"assets\": [...]}." },
          { role: "user", content: userPrompt },
        ],
      }),
    });
    if (!resp.ok) return null;
    const data = await resp.json();
    return parseAssets(data?.choices?.[0]?.message?.content ?? "");
  }

  return null;
}

function parseAssets(text: string): GeneratedAsset[] | null {
  try {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start === -1 || end === -1) return null;
    const parsed = JSON.parse(text.slice(start, end + 1));
    const assets = Array.isArray(parsed) ? parsed : parsed.assets;
    if (!Array.isArray(assets)) return null;
    const clean = assets
      .filter((a) => a && a.name && a.type && a.content)
      .map((a) => ({
        name: String(a.name),
        type: String(a.type),
        content: String(a.content),
      }));
    return clean.length ? clean : null;
  } catch {
    return null;
  }
}

export async function generateAssets(
  title: string,
  transcript: string
): Promise<GeneratedAsset[]> {
  try {
    const llm = await generateWithLLM(title, transcript);
    if (llm && llm.length) return llm;
  } catch {
    /* fall back to deterministic */
  }
  return generateAssetsDeterministic(title, transcript);
}
