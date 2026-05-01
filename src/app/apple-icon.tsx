import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: 180,
        height: 180,
        background: "#2563eb",
        borderRadius: 40,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
      }}
    >
      <span
        style={{
          color: "white",
          fontSize: 112,
          fontWeight: 900,
          fontFamily: "Georgia, 'Times New Roman', serif",
          lineHeight: 1,
          marginTop: 18,
          display: "flex",
        }}
      >
        ب
      </span>
      <div style={{ position: "absolute", top: 24, left: 60, display: "flex" }}>
        <svg width="50" height="38" viewBox="0 0 28 22" xmlns="http://www.w3.org/2000/svg">
          <path d="M2 11L9.5 18.5L26 2" stroke="#4ade80" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
      </div>
    </div>,
    size
  );
}
