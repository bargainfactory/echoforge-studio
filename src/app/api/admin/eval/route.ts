import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/server/auth";
import { insertAudit } from "@/lib/server/db";
import { evalTier, type LlmTier } from "@/lib/server/generate";

export const dynamic = "force-dynamic";

/** Run the golden generation through every tier — the safe-swap gate.
 *  Operator-triggered; costs three LLM calls per run. */
export async function POST() {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const tiers: LlmTier[] = ["flagship", "standard", "fast"];
  const results = [];
  for (const tier of tiers) {
    results.push(await evalTier(tier));
  }
  insertAudit(
    admin.email,
    "llm.eval",
    results.map((r) => `${r.tier}=${r.engine ?? "none"}(${r.ok ? "ok" : "FAIL"})`).join(" ")
  );
  return NextResponse.json({ results });
}
