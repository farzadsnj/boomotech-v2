import { ImageResponse } from "next/og";

export const alt = "BoomoTech — practical technology support and smarter systems";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(<div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "78px", background: "#1D3A49", color: "white", fontFamily: "Arial" }}><div style={{ display: "flex", alignItems: "center", gap: "18px", color: "#78C8E8", fontSize: 34, fontWeight: 700 }}>BoomoTech</div><div style={{ maxWidth: 940, fontSize: 70, fontWeight: 700, lineHeight: 1.06, letterSpacing: "-3px" }}>Practical technology support and smarter systems for your business.</div><div style={{ width: 220, height: 10, borderRadius: 10, background: "#0070B7" }} /></div>, size);
}
