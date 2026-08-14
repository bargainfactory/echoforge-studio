import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server/auth";
import { getAsset, insertAssetRow, setAssetAbGroup } from "@/lib/server/db";
import { llmComplete } from "@/lib/server/generate";
import { rateLimit } from "@/lib/server/rate-limit";

export const dynamic = "force-dynamic";

const VARIANT_SCHEMA = {
  type: "object",
  properties: {
    variant: {
      type: "string",
      description:
        "The full asset content with ONLY the opening hook line rewritten in a meaningfully different style (question vs statement, curiosity vs bold claim). Everything after the hook stays identical.",
    },
  },
  required: ["variant"],
};

/**
 * A/B hook testing: clone the asset with an alternate opening hook. Schedule
 * both variants; once real metrics land for each, the scheduler declares the
 * winner and its hook feeds future generations via topPerformers.
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const gate = rateLimit(`ab:${user.email}`, 10, 60 * 60 * 1000);
  if (!gate.ok) {
    return NextResponse.json(
      { error: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(gate.retryAfterSeconds) } }
    );
  }

  const { id } = await params;
  const asset = getAsset(user.email, id);
  if (!asset?.content) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (asset.abGroup) {
    return NextResponse.json(
      { error: "This asset is already part of an A/B test" },
      { status: 409 }
    );
  }

  const res = await llmComplete(
    "You rewrite hooks for short-form content. Change ONLY the opening hook line; keep every other line byte-identical.",
    `Asset (${asset.type}):\n\n${asset.content}\n\nRewrite the opening hook in a clearly different style and return the full content.`,
    VARIANT_SCHEMA
  );
  if (!res) {
    return NextResponse.json(
      { error: "A/B variants need an LLM key — connect Anthropic, xAI, or OpenAI in Settings." },
      { status: 503 }
    );
  }
  let variant: string;
  try {
    variant = String((JSON.parse(res.text) as { variant?: string }).variant ?? "");
  } catch {
    variant = "";
  }
  if (!variant.trim() || variant.trim() === asset.content.trim()) {
    return NextResponse.json({ error: "Could not produce a distinct variant" }, { status: 502 });
  }

  const abGroup = asset.id;
  const variantId = `asset-${crypto.randomUUID()}`;
  insertAssetRow(user.email, {
    id: variantId,
    projectId: asset.projectId,
    name: `${asset.name} · Hook B`,
    type: asset.type,
    content: variant.trim(),
    abGroup,
  });
  setAssetAbGroup(user.email, asset.id, abGroup);

  return NextResponse.json({
    original: { ...asset, abGroup },
    variant: getAsset(user.email, variantId),
  });
}
