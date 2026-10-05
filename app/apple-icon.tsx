import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** Home-screen icon for iPhones (Denise lives on her phone). */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: 180, height: 180, background: "#0b0d12", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg width="120" height="120" viewBox="0 0 32 32">
          <path d="M20.13 10.30A7.2 7.2 0 1 1 11.87 10.30" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" />
          <path d="M8.59 9.49L12.36 9.96L11.51 13.66" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    ),
    size,
  );
}
