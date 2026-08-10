import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/server/auth";
import { getPricingConfig, insertAudit, setPricingConfig } from "@/lib/server/db";
import type { PricingConfig } from "@/lib/server/pricing";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return NextResponse.json({ pricing: getPricingConfig() });
}

/**
 * Replaces the live pricing config. The shape is validated structurally (plans
 * with priceIds and numeric-or-Free prices) so a malformed payload can't brick
 * the public pricing page.
 */
export async function PUT(req: NextRequest) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const cfg = body as PricingConfig;
  const plansOk =
    Array.isArray(cfg?.plans) &&
    cfg.plans.length > 0 &&
    cfg.plans.every(
      (p) =>
        typeof p?.priceId === "string" &&
        p.priceId.length > 0 &&
        (typeof p.price === "number" || p.price === "Free") &&
        Array.isArray(p.features)
    );
  const oneOffsOk =
    Array.isArray(cfg?.oneOffs) &&
    cfg.oneOffs.every((o) => typeof o?.id === "string" && typeof o?.price === "number");
  if (!plansOk || !oneOffsOk || !Array.isArray(cfg?.comparison)) {
    return NextResponse.json({ error: "Malformed pricing config" }, { status: 400 });
  }

  setPricingConfig(cfg);
  insertAudit(
    admin.email,
    "pricing.update",
    cfg.plans.map((p) => `${p.priceId}=${p.price}`).join(", ")
  );
  return NextResponse.json({ pricing: getPricingConfig() });
}
