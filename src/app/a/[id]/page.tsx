import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublicAudit } from "@/lib/server/db";
import ShareAuditClient from "./share-client";

/** Public shareable audit score card: /a/[id]. */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const audit = getPublicAudit(id);
  if (!audit) return {};
  const title = `${audit.label} — Virality Grade ${audit.grade}/100 | Virafold`;
  const description = `${audit.label} scored ${audit.grade}/100 on the free Virafold channel audit. Hooks, consistency, timing, engagement — get your own grade in seconds.`;
  return {
    title,
    description,
    alternates: { canonical: `/a/${id}` },
    openGraph: {
      type: "website",
      url: `https://virafold.ai/a/${id}`,
      siteName: "Virafold",
      title,
      description,
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function ShareAuditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const audit = getPublicAudit(id);
  if (!audit) notFound();

  let report;
  try {
    report = JSON.parse(audit.report);
  } catch {
    notFound();
  }

  return <ShareAuditClient report={report} createdAt={audit.createdAt} />;
}
