import { NextRequest, NextResponse } from "next/server";
import { getCreatorPageOwner, userAnalytics } from "@/lib/server/db";

export const dynamic = "force-dynamic";

/**
 * Public JSON for the link-in-bio page and media kit. Never exposes the
 * owner's email — only the page content and aggregate workspace stats.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const found = getCreatorPageOwner(slug.toLowerCase());
  if (!found) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const analytics = userAnalytics(found.email);
  return NextResponse.json({
    page: found.page,
    stats: {
      assets: analytics.totals.assets,
      published: analytics.totals.published,
      platforms: analytics.platforms.map((p) => p.platform),
    },
  });
}
