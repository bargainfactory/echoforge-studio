import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Virafold — One idea, folded into everything.";

/** Branded Open Graph card, generated at request time — no design assets needed. */
export default function OpengraphImage() {
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
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 24,
          }}
        >
          <div
            style={{
              width: 84,
              height: 84,
              borderRadius: 20,
              background: "linear-gradient(135deg, #a855f7, #3b82f6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: 52,
              fontWeight: 800,
            }}
          >
            V
          </div>
          <div style={{ display: "flex", fontSize: 96, fontWeight: 800, color: "white" }}>
            Virafold
          </div>
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 32,
            fontSize: 36,
            color: "#b8b3d7",
          }}
        >
          One idea, folded into everything.
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 18,
            fontSize: 26,
            color: "#7d7899",
          }}
        >
          AI content repurposing for faceless creators — virafold.ai
        </div>
      </div>
    ),
    size
  );
}
