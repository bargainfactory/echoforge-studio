import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server/auth";
import { bestPlanFor, getCustomVoiceId, setCustomVoiceId } from "@/lib/server/db";
import { resolveField } from "@/lib/server/integrations";
import { rateLimit } from "@/lib/server/rate-limit";

export const dynamic = "force-dynamic";

const MAX_BYTES = 10 * 1024 * 1024;

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ voiceId: getCustomVoiceId(user.email) });
}

/**
 * Clone the creator's narration voice from a short reference clip (xAI
 * custom-voices, ≤120s). Every script video then narrates in their voice.
 */
export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Matches the pricing page: voice cloning unlocks at Starter.
  if (!["Starter", "Creator Pro", "Agency"].includes(bestPlanFor(user.email))) {
    return NextResponse.json(
      { error: "Voice cloning is a Starter-and-up feature — upgrade to clone your narration voice" },
      { status: 402 }
    );
  }

  // Cloning is a paid call and voices persist provider-side — keep it rare.
  const gate = rateLimit(`clone:${user.email}`, 3, 24 * 60 * 60 * 1000);
  if (!gate.ok) {
    return NextResponse.json(
      { error: "Voice cloning is limited to 3 attempts per day" },
      { status: 429, headers: { "Retry-After": String(gate.retryAfterSeconds) } }
    );
  }

  const xaiKey = resolveField("llm", "xaiApiKey");
  if (!xaiKey) {
    return NextResponse.json(
      { error: "Voice cloning needs the xAI key (Operator Console → AI generation)" },
      { status: 503 }
    );
  }

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!file || typeof file !== "object" || !("arrayBuffer" in file)) {
    return NextResponse.json({ error: "Attach an audio sample" }, { status: 400 });
  }
  const f = file as File;
  if (f.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "Keep the sample under 10 MB (30–120 seconds of clear speech is ideal)" },
      { status: 413 }
    );
  }

  const upstream = new FormData();
  upstream.append(
    "file",
    new Blob([new Uint8Array(await f.arrayBuffer())], { type: f.type || "audio/wav" }),
    f.name || "reference.wav"
  );
  upstream.append("name", `${user.name} — Virafold`.slice(0, 60));
  upstream.append("language", "en");

  try {
    const resp = await fetch("https://api.x.ai/v1/custom-voices", {
      method: "POST",
      headers: { Authorization: `Bearer ${xaiKey}` },
      body: upstream,
    });
    const data = await resp.json().catch(() => null);
    if (!resp.ok || !data?.voice_id) {
      return NextResponse.json(
        { error: `Cloning failed (${resp.status}) — use 30–120s of clear, single-speaker audio` },
        { status: 502 }
      );
    }
    setCustomVoiceId(user.email, String(data.voice_id));
    return NextResponse.json({ voiceId: String(data.voice_id) }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Could not reach the voice service" }, { status: 502 });
  }
}

/** Stop using the cloned voice (narration reverts to the default voice). */
export async function DELETE() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  setCustomVoiceId(user.email, null);
  return NextResponse.json({ voiceId: null });
}
