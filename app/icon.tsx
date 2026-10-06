import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 7,
          background: "#2563eb",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#ffffff",
          fontSize: 20,
          fontWeight: 900,
          fontFamily: "sans-serif",
          letterSpacing: "-1px",
        }}
      >
        M
      </div>
    ),
    { ...size },
  );
}
