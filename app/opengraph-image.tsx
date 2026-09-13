import { ImageResponse } from "next/og";
import { SITE } from "@/lib/site";

export const alt = SITE.description;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const dynamic = "force-static";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          padding: "80px 96px",
          background: "#f7f4ee",
          color: "#26231d",
          fontFamily: "serif",
        }}
      >
        <div
          style={{ display: "flex", alignItems: "center", gap: 14, fontFamily: "sans-serif", fontSize: 30, fontWeight: 600, letterSpacing: "-0.01em" }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: "#26231d",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
              <rect x="5" y="5" width="22" height="22" rx="5.5" stroke="#f7f4ee" strokeWidth="2.6" />
              <path d="M10 12h12" stroke="#f7f4ee" strokeWidth="2" strokeDasharray="3.4 3" strokeLinecap="round" />
              <path d="M10 23h12" stroke="#d07a4a" strokeWidth="2" strokeDasharray="1.8 1.6" strokeLinecap="round" />
            </svg>
          </div>
          BlurIt
        </div>

        <div style={{ display: "flex", flex: 1, flexDirection: "column", justifyContent: "center" }}>
          <div style={{ fontSize: 84, lineHeight: 1.05, fontWeight: 500, maxWidth: 980 }}>
            Blur anything you don&apos;t want to share.
          </div>
          <div style={{ marginTop: 34, fontSize: 32, color: "#57534a", lineHeight: 1.4, maxWidth: 760, fontFamily: "sans-serif" }}>
            Faces, text, screenshots, and license plates — hidden in your browser. No uploads.
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}