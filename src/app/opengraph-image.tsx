import { ImageResponse } from "next/og";

export const alt = "Sonnet: your courses, deadlines and grades in one place";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 96,
          background: "#0a0a0a",
          color: "#fafafa",
        }}
      >
        <div style={{ fontSize: 112, fontWeight: 700, letterSpacing: -4 }}>Sonnet</div>
        <div style={{ fontSize: 44, color: "#a1a1a1", marginTop: 24, maxWidth: 900 }}>
          Everything due, how caught up you are, and an AI that knows your courses.
        </div>
      </div>
    ),
    size,
  );
}
