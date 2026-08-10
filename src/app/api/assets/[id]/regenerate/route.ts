import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server/auth";
import {
  getAsset,
  getBrandVoice,
  getFlags,
  getProjectSource,
  updateAsset,
} from "@/lib/server/db";
import { regenerateAsset } from "@/lib/server/generate";
import { rateLimit } from "@/lib/server/rate-limit";

export const dynamic = "force-dynamic";

// Shares the generation bucket with /api/projects so total LLM spend per
// account stays bounded no matter which endpoint drives it.
const GEN_LIMIT = 20;
const GEN_WINDOW_MS = 60 * 60 * 1000;
const MAX_FEEDBACK = 500;

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
  const asset = getAsset(user.email, id);
  if (!asset) {
    return NextResponse.json({ error: "Asset not found" }, { status: 404 });
  }

  let feedback = "";
  let locale: string | undefined;
  try {
    const b = (await req.json()) as Record<string, unknown>;
    feedback = String(b?.feedback ?? "").slice(0, MAX_FEEDBACK);
    if (b?.locale) locale = String(b.locale).slice(0, 8);
  } catch {
    /* body is optional */
  }

  const source = getProjectSource(user.email, asset.projectId);
  const generated = await regenerateAsset(
    { name: asset.name, type: asset.type, content: asset.content ?? "" },
    {
      title: source?.title ?? asset.name,
      transcript: source?.transcript ?? "",
      locale,
      voice: getBrandVoice(user.email),
      feedback,
    }
  );

  const updated = updateAsset(user.email, id, {
    name: generated.name,
    content: generated.content,
  });
  return NextResponse.json({ asset: updated });
}
