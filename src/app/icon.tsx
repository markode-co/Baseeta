import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        width: 512,
        height: 512,
        background: "linear-gradient(145deg, #1d4ed8 0%, #2563eb 60%, #3b82f6 100%)",
        borderRadius: 115,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        boxShadow: "inset 0 2px 8px rgba(255,255,255,0.15)",
      }}
    >
      {/* Subtle inner glow ring */}
      <div style={{
        position: "absolute",
        inset: 18,
        borderRadius: 97,
        border: "2px solid rgba(255,255,255,0.12)",
        display: "flex",
      }} />

      {/* White ب letter */}
      <span
        style={{
          color: "white",
          fontSize: 310,
          fontWeight: 900,
          fontFamily: "Georgia, 'Times New Roman', serif",
          lineHeight: 1,
          marginTop: 55,
          display: "flex",
          textShadow: "0 4px 16px rgba(0,0,0,0.18)",
        }}
      >
        ب
      </span>

      {/* Green check badge — top-right */}
      <div style={{
        position: "absolute",
        top: 52,
        left: 52,
        width: 120,
        height: 120,
        background: "#22c55e",
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
        border: "5px solid white",
      }}>
        <svg width="56" height="44" viewBox="0 0 28 22" xmlns="http://www.w3.org/2000/svg">
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
