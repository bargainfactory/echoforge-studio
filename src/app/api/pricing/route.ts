import { NextResponse } from "next/server";
import { getPricingConfig } from "@/lib/server/db";

export const dynamic = "force-dynamic";

/** Public: serves the pricing config (plans, one-offs, comparison strip). */
export async function GET() {
  return NextResponse.json(getPricingConfig());
}
