import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

// "s." on ink, like the sidebar mark.
export function Mark({ px }: { px: number }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#121212",
        color: "#ecebe8",
        fontSize: px,
        fontWeight: 700,
        letterSpacing: -px / 20,
      }}
    >
      s.
    </div>
  );
}

export default function Icon() {
  return new ImageResponse(<Mark px={300} />, size);
}
