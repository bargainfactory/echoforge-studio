import { NextRequest, NextResponse } from "next/server";
import { scoreHook } from "@/lib/server/generate";
import { insertEvent } from "@/lib/server/db";
import { rateLimit, clientIp } from "@/lib/server/rate-limit";

export const dynamic = "force-dynamic";

/**
 * Free hook/title analyzer: deterministic scoring (the same scoreHook the
 * product uses for ideas and clip detection), factor-by-factor feedback, and
 * three pattern rewrites. Zero tokens — anonymous traffic costs nothing.
 */
export async function POST(req: NextRequest) {
  const gate = rateLimit(`hook:${clientIp(req)}`, 30, 5 * 60 * 1000);
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
  const text = String((body as Record<string, unknown>)?.text ?? "")
    .trim()
    .slice(0, 300);
  if (!text) return NextResponse.json({ error: "Enter a hook or title" }, { status: 400 });

  const words = text.split(/\s+/).length;
  const factors = [
    {
      label: "Asks a question",
      hit: /\?/.test(text),
      tip: "Questions open a loop the brain wants closed.",
    },
    {
      label: "Contains a number",
      hit: /\d/.test(text),
      tip: "Specific numbers signal concrete, finite value.",
    },
    {
      label: "Uses a proven power word",
      hit: /\b(how|why|secret|mistake|never|always|stop|start|truth|biggest|proven|step|steps|way|ways|hack|avoid|nobody|everyone)\b/i.test(
        text
      ),
      tip: "Words like why, mistake, never, proven reliably lift clicks.",
    },
    {
      label: "Right length (6–26 words)",
      hit: words >= 6 && words <= 26,
      tip:
        words < 6
          ? "Too short to carry a promise — add the payoff."
          : words > 26
            ? "Too long — feeds truncate it. Cut to the core tension."
            : "In the sweet spot.",
    },
  ];

  const raw = scoreHook(text);
  const score = Math.max(5, Math.round((raw / 9) * 100));

  // Pattern rewrites: the three highest-performing hook shapes with the
  // user's topic dropped in. Imperfect grammar beats an empty suggestion box.
  const core = text.replace(/[?!.]+$/, "").replace(/^(how to|why|the)\s+/i, "");
  const lower = core.charAt(0).toLowerCase() + core.slice(1);
  const rewrites = [
    `Why ${lower} (and what to do instead)`,
    `The #1 mistake people make with ${lower}`,
    `3 things nobody tells you about ${lower}`,
  ];

  insertEvent("tool_hook", "/tools/hook-analyzer", String(score));
  return NextResponse.json({ score, factors, rewrites });
}
