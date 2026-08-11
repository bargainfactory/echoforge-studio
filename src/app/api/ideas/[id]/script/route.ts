import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server/auth";
import { getBrandVoice, getFlags, getIdea, updateIdea } from "@/lib/server/db";
import { generateScript } from "@/lib/server/generate";
import { rateLimit } from "@/lib/server/rate-limit";

export const dynamic = "force-dynamic";

// Script writing may invoke a paid LLM — share the platform generation bucket.
const GEN_LIMIT = 20;
const GEN_WINDOW_MS = 60 * 60 * 1000;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!getFlags().generationEnabled) {
    return NextResponse.json(
      { error: "Generation is temporarily disabled by the operator" },
      { status: 503 }
    );
  }
  const gate = rateLimit(`gen:${user.email}`, GEN_LIMIT, GEN_WINDOW_MS);
  if (!gate.ok) {
    return NextResponse.json(
      { error: "Generation limit reached. Please try again later." },
      { status: 429, headers: { "Retry-After": String(gate.retryAfterSeconds) } }
    );
  }

  const { id } = await params;
  const idea = getIdea(user.email, id);
  if (!idea) return NextResponse.json({ error: "Idea not found" }, { status: 404 });

  let locale: string | undefined;
  try {
    const b = (await req.json()) as Record<string, unknown>;
    if (b?.locale) locale = String(b.locale).slice(0, 8);
  } catch {
    /* body optional */
  }

  const { script } = await generateScript(
    idea.title,
    idea.notes,
    locale,
    getBrandVoice(user.email)
  );
  const updated = updateIdea(user.email, id, { script, status: "scripted" });
  return NextResponse.json({ idea: updated });
}
