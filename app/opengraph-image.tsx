import { ImageResponse } from "next/og";

export const alt = "FollowUp: every job request, one morning list";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** The preview card shown when the link is shared (WhatsApp, LinkedIn, Slack). */
export default function OpenGraphImage() {
  const rows = [
    { name: "Russo's Pizzeria", why: "Freezer down · 2 h ago", hot: true },
    { name: "Northside Cold Storage", why: "Quote not sent · 3 days" },
    { name: "Turner Warehouse", why: "No reply on $2,400 quote" },
  ];
  return new ImageResponse(
    (
      <div style={{ width: 1200, height: 630, background: "#f7f8fa", display: "flex", padding: 72, gap: 56, fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 56, height: 56, borderRadius: 14, background: "#0b0d12", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="40" height="40" viewBox="0 0 32 32"><path d="M20.13 10.30A7.2 7.2 0 1 1 11.87 10.30" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" /><path d="M8.59 9.49L12.36 9.96L11.51 13.66" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" /></svg>
            </div>
            <div style={{ fontSize: 36, fontWeight: 700, color: "#0b0d12" }}>FollowUp</div>
          </div>
          <div style={{ fontSize: 72, fontWeight: 700, color: "#0b0d12", lineHeight: 1.02, marginTop: 40, letterSpacing: -2 }}>Every job request. One morning list.</div>
          <div style={{ fontSize: 28, color: "#3b4250", marginTop: 24 }}>Know who to call today, and why.</div>
        </div>
        <div style={{ width: 420, display: "flex", flexDirection: "column", justifyContent: "center", gap: 14 }}>
          {rows.map((r) => (
            <div key={r.name} style={{ display: "flex", flexDirection: "column", background: r.hot ? "#fef0f0" : "#fff", border: `2px solid ${r.hot ? "#f8d7d8" : "#e6e8ee"}`, borderRadius: 16, padding: "20px 24px" }}>
              <div style={{ fontSize: 26, fontWeight: 700, color: "#0b0d12" }}>{r.name}</div>
              <div style={{ fontSize: 22, color: r.hot ? "#c2262e" : "#6e7687", marginTop: 4 }}>{r.why}</div>
            </div>
          ))}
        </div>
      </div>
    ),
    size,
  );
}
