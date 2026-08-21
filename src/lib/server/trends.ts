/**
 * Trend Radar: a weekly Grok live-search scan of the creator's niche — what's
 * moving on X and the web right now — landing as scored ideas in their
 * backlog plus one notification. No repurposing competitor has live-trend
 * awareness; this is the xAI-specific edge.
 *
 * Honest-by-design: if live search is unavailable (no key, API rejects the
 * search parameters), we do NOTHING rather than deliver hallucinated
 * "trends".
 */

import { getBrandVoice, insertEvent, insertIdea, insertNotification } from "./db";
import { scoreHook } from "./generate";

interface Trend {
  topic: string;
  why: string;
  hook: string;
}

export async function runTrendRadar(email: string): Promise<boolean> {
  const { resolveField } = await import("./integrations");
  const key = resolveField("llm", "xaiApiKey");
  if (!key) return false;

  const voice = getBrandVoice(email);
  const niche = (voice.audience || "").trim();
  if (!niche) return false; // no niche context → nothing meaningful to scan

  try {
    const resp = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "grok-4",
        response_format: { type: "json_object" },
        // xAI Live Search: pull current X/web signal instead of model memory.
        search_parameters: { mode: "on" },
        messages: [
          {
            role: "system",
            content:
              'You are a trend scout for content creators. Using CURRENT web and X search results only, find 3 topics or hook patterns trending THIS WEEK relevant to the creator\'s audience. For each: "topic" (what is trending), "why" (one sentence, cite what you saw), "hook" (a ready-to-use video title riding the trend, 6-14 words). Respond as {"trends":[{"topic","why","hook"}]}. If you cannot find genuinely current signals, return {"trends":[]}.',
          },
          {
            role: "user",
            content: `Creator's audience/niche: ${niche.slice(0, 300)}`,
          },
        ],
      }),
    });
    if (!resp.ok) {
      insertEvent("trend_radar_fail", email, String(resp.status));
      return false;
    }
    const data = await resp.json();
    const text = data?.choices?.[0]?.message?.content ?? "";
    const parsed = JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1)) as {
      trends?: Trend[];
    };
    const trends = (parsed.trends ?? [])
      .filter((t) => t?.hook && t?.topic)
      .slice(0, 3);
    if (!trends.length) return false;

    for (const t of trends) {
      insertIdea(email, {
        id: `idea-${crypto.randomUUID()}`,
        title: String(t.hook).slice(0, 200),
        notes: `🔥 Trend Radar: ${String(t.topic).slice(0, 200)} — ${String(t.why).slice(0, 400)}`,
        script: "",
        score: Math.min(10, Math.max(1, scoreHook(String(t.hook)))),
        status: "idea",
      });
    }
    insertNotification(email, {
      id: `n-${crypto.randomUUID()}`,
      title: "Trend Radar",
      message: `${trends.length} trending angle${trends.length === 1 ? "" : "s"} in your niche this week — dropped into your Ideas backlog: ${trends
        .map((t) => `"${t.topic}"`)
        .join(", ")}.`,
      time: "Just now",
      read: false,
      type: "info",
    });
    insertEvent("trend_radar", email, String(trends.length));
    return true;
  } catch {
    return false;
  }
}
