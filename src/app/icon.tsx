import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        width: 512,
        height: 512,
        background: "#2563eb",
        borderRadius: 110,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
      }}
    >
      {/* White ب letter */}
      <span
        style={{
          color: "white",
          fontSize: 320,
          fontWeight: 900,
          fontFamily: "Georgia, 'Times New Roman', serif",
          lineHeight: 1,
          marginTop: 50,
          display: "flex",
        }}
      >
        ب
      </span>

      {/* Green checkmark — top center, overlapping the letter */}
      <div
        style={{
          position: "absolute",
          top: 68,
          left: 170,
          display: "flex",
        }}
      >
        <svg
          width="140"
          height="110"
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
