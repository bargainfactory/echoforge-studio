import { ImageResponse } from "next/og";
import { getPublicAudit } from "@/lib/server/db";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Virafold channel audit score card";

/** Per-share OG score card — the image that travels when a grade is posted. */
export default async function OpengraphImage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const audit = getPublicAudit(id);
  const label = audit?.label ?? "Channel audit";
  const grade = audit?.grade ?? 0;
  const gradeColor = grade >= 70 ? "#22c55e" : grade >= 45 ? "#eab308" : "#f87171";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0a0a12 0%, #12101f 60%, #1a1030 100%)",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", fontSize: 36, color: "#b8b3d7", marginBottom: 8 }}>
          Virality Grade
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 180,
            fontWeight: 800,
            color: gradeColor,
            lineHeight: 1,
          }}
        >
          {grade}
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 44,
            fontWeight: 700,
            color: "white",
            marginTop: 18,
            maxWidth: 1000,
          }}
        >
          {label.slice(0, 50)}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            marginTop: 34,
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: "linear-gradient(135deg, #a855f7, #3b82f6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: 26,
              fontWeight: 800,
            }}
          >
            V
          </div>
          <div style={{ display: "flex", fontSize: 30, color: "#7d7899" }}>
            Get your grade free — virafold.ai/audit
          </div>
        </div>
      </div>
    ),
    size
  );
}
