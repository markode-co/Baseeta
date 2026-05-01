import { ImageResponse } from "next/og";

export const size = { width: 192, height: 192 };
export const contentType = "image/png";

export default function Icon2() {
  return new ImageResponse(
    <div
      style={{
        width: 192,
        height: 192,
        background: "#2563eb",
        borderRadius: 42,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
      }}
    >
      <span
        style={{
          color: "white",
          fontSize: 120,
          fontWeight: 900,
          fontFamily: "Georgia, 'Times New Roman', serif",
          lineHeight: 1,
          marginTop: 20,
          display: "flex",
        }}
      >
        ب
      </span>
      <div style={{ position: "absolute", top: 26, left: 64, display: "flex" }}>
        <svg
          width="52"
          height="42"
          viewBox="0 0 28 22"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M2 11L9.5 18.5L26 2"
            stroke="#4ade80"
            strokeWidth="4"
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
