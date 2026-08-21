import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/server/auth";
import { adminTotals, eventCounts, getFlags, listErrorLogs, llmUsage } from "@/lib/server/db";

export const dynamic = "force-dynamic";

/** Admin: platform totals, funnel event counts, and operator flags. */
export async function GET() {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  return NextResponse.json({
    totals: adminTotals(),
    events: eventCounts(),
    flags: getFlags(),
    llm: llmUsage(),
    errors: listErrorLogs(20),
  });
}
