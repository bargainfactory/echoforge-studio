import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server/auth";
import { setScheduledStatus, listScheduledPosts } from "@/lib/server/db";
import { isConfigured } from "@/lib/server/integrations";

export const dynamic = "force-dynamic";

/** Publish now (or cancel via ?action=cancel). Real delivery to the platform
 *  requires a connected publishing app + the user's platform account; when
 *  publishing isn't connected this marks the post published in demo mode. */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const action = req.nextUrl.searchParams.get("action");
  const status = action === "cancel" ? "canceled" : "published";

  const post = setScheduledStatus(user.email, id, status);
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    post,
    connected: isConfigured("publishing"),
    posts: listScheduledPosts(user.email),
  });
}
