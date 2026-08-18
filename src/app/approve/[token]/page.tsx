import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProjectByApproveToken, listAssets } from "@/lib/server/db";
import ApproveClient from "./approve-client";

export const metadata: Metadata = {
  title: "Content Review | Virafold",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * Client approval page: a no-login, token-scoped review surface for one
 * project's assets — the agency workflow's missing handshake.
 */
export default async function ApprovePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const proj = getProjectByApproveToken(token);
  if (!proj) notFound();

  const assets = listAssets(proj.email)
    .filter((a) => a.projectId === proj.projectId)
    .map((a) => ({ name: a.name, type: a.type, content: a.content ?? "" }));

  return <ApproveClient token={token} projectTitle={proj.title} assets={assets} />;
}
