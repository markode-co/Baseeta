import { ImageResponse } from "next/og";

export const size = { width: 192, height: 192 };
export const contentType = "image/png";

export default function Icon2() {
  return new ImageResponse(
    <div
      style={{
        width: 192,
        height: 192,
        background: "linear-gradient(145deg, #1d4ed8 0%, #2563eb 60%, #3b82f6 100%)",
        borderRadius: 43,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
      }}
    >
      <div style={{
        position: "absolute",
        inset: 7,
        borderRadius: 36,
        border: "1px solid rgba(255,255,255,0.12)",
        display: "flex",
      }} />

      <span
        style={{
          color: "white",
          fontSize: 118,
          fontWeight: 900,
          fontFamily: "Georgia, 'Times New Roman', serif",
          lineHeight: 1,
          marginTop: 20,
          display: "flex",
        }}
      >
        ب
      </span>

      <div style={{
        position: "absolute",
        top: 18,
        left: 18,
        width: 44,
        height: 44,
        background: "#22c55e",
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        border: "2px solid white",
      }}>
        <svg width="20" height="16" viewBox="0 0 28 22" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M3 11L10 18L25 3"
            stroke="white"
            strokeWidth="4.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
      </div>
    </div>,
    size
  );
}
