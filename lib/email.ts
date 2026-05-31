import { Resend } from "resend";
import type { BriefingOutput } from "./agent/briefing-agent";

function getResend() {
  if (!process.env.RESEND_API_KEY) return null;
  return new Resend(process.env.RESEND_API_KEY);
}

function signalColor(action: string): string {
  if (action.toLowerCase().includes("buy") || action.toLowerCase().includes("add")) return "#22c55e";
  if (action.toLowerCase().includes("sell") || action.toLowerCase().includes("trim")) return "#ef4444";
  return "#eab308";
}

function riskColor(level: string): string {
  const map: Record<string, string> = { low: "#22c55e", moderate: "#eab308", high: "#f97316", extreme: "#ef4444" };
  return map[level] || "#64748b";
}

function renderValue(v: unknown): string {
  if (typeof v === "string") return v;
  if (typeof v === "object" && v !== null) {
    const obj = v as Record<string, unknown>;
    const parts: string[] = [];
    if (obj.action) parts.push(String(obj.action));
    if (obj.shift) parts.push(String(obj.shift));
    if (obj.sector) parts.push(`[${obj.sector}]`);
    if (obj.detail) parts.push(String(obj.detail));
    if (obj.rationale) parts.push(String(obj.rationale));
    if (parts.length > 0) return parts.join(" — ");
    return Object.entries(obj)
      .filter(([, val]) => val !== null && val !== undefined)
      .map(([key, val]) => `${key}: ${val}`)
      .join(". ");
  }
  return String(v);
}

function safe(v: unknown): string {
  if (v === null || v === undefined) return "";
  return String(v);
}

export async function sendBriefingDigest(briefing: BriefingOutput, recipientEmail: string) {
  const resend = getResend();
  if (!resend) {
    console.warn("RESEND_API_KEY not set, skipping briefing email");
    return false;
  }

  const newsRows = briefing.newsHeadlines
    .slice(0, 5)
    .map((n) => `
      <tr style="border-bottom:1px solid #1e293b;">
        <td style="padding:10px 16px;">
          ${n.url ? `<a href="${n.url}" style="color:#60a5fa;text-decoration:none;font-weight:600;">${n.title}</a>` : `<span style="color:#f1f5f9;font-weight:600;">${n.title}</span>`}
          <div style="color:#94a3b8;font-size:12px;margin-top:2px;">${n.source} &middot; ${n.relevance}</div>
        </td>
      </tr>`)
    .join("");

  const signalRows = briefing.tradeSignals
    .map((s) => `
      <tr style="border-bottom:1px solid #1e293b;">
        <td style="padding:10px 16px;">
          <span style="color:${signalColor(s.action)};font-weight:700;font-size:14px;">${s.action.toUpperCase()}</span>
          <span style="color:#f1f5f9;font-weight:600;margin-left:8px;">${s.symbol}</span>
          <div style="color:#94a3b8;font-size:12px;margin-top:4px;">${s.reason}</div>
          <div style="color:#64748b;font-size:11px;margin-top:4px;">
            Entry: ${s.entryRange} &middot; Target: ${s.targetPrice} &middot; Stop: ${s.stopLoss} &middot; ${s.timeframe} &middot; Confidence: ${s.confidence}
          </div>
        </td>
      </tr>`)
    .join("");

  const allocationItems = [
    briefing.allocationRecommendations?.amznTrim,
    briefing.allocationRecommendations?.semisAction,
    briefing.allocationRecommendations?.cashDeployment,
    ...(briefing.allocationRecommendations?.sectorShifts || []),
  ]
    .filter(Boolean)
    .map((a) => `<li style="color:#cbd5e1;margin-bottom:6px;font-size:13px;">${renderValue(a)}</li>`)
    .join("");

  const ipoRows = briefing.upcomingIpos
    .slice(0, 5)
    .map((ipo) => `
      <tr style="border-bottom:1px solid #1e293b;">
        <td style="padding:8px 16px;color:#f1f5f9;font-weight:600;">${ipo.name}</td>
        <td style="padding:8px;color:#94a3b8;font-size:13px;">${ipo.date}</td>
        <td style="padding:8px;color:#94a3b8;font-size:13px;">${ipo.sector}</td>
        <td style="padding:8px;color:#94a3b8;font-size:13px;">${ipo.relevance}</td>
      </tr>`)
    .join("");

  const dateStr = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const html = `
    <div style="max-width:700px;margin:0 auto;background:#0f172a;color:#e2e8f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;padding:32px;border-radius:12px;">
      <div style="text-align:center;margin-bottom:32px;">
        <h1 style="color:#f1f5f9;font-size:24px;margin:0;">Portfolio Intelligence</h1>
        <p style="color:#64748b;font-size:14px;margin:8px 0 0;">${dateStr}</p>
      </div>

      <!-- Market Overview -->
      <h2 style="color:#f1f5f9;font-size:18px;margin:24px 0 12px;padding-bottom:8px;border-bottom:2px solid #334155;">Market Overview</h2>
      <p style="color:#cbd5e1;font-size:14px;line-height:1.6;">${briefing.marketOverview.summary}</p>
      ${briefing.marketOverview.indexMoves.length > 0 ? `
        <div style="display:flex;gap:16px;flex-wrap:wrap;margin-top:12px;">
          ${briefing.marketOverview.indexMoves.map((i) => `
            <div style="background:#1e293b;padding:12px 16px;border-radius:8px;min-width:120px;">
              <div style="color:#94a3b8;font-size:12px;">${i.name}</div>
              <div style="color:${i.change.startsWith("-") ? "#ef4444" : "#22c55e"};font-size:16px;font-weight:700;">${i.change}</div>
            </div>`).join("")}
        </div>` : ""}

      <!-- Concentration Risk -->
      <h2 style="color:#f1f5f9;font-size:18px;margin:24px 0 12px;padding-bottom:8px;border-bottom:2px solid #334155;">Portfolio Risk</h2>
      <div style="background:#1e293b;padding:16px;border-radius:8px;border-left:4px solid ${riskColor(safe(briefing.concentrationRisk?.level))};">
        <div style="color:#f1f5f9;font-weight:700;">Concentration: <span style="color:${riskColor(safe(briefing.concentrationRisk?.level))};text-transform:uppercase;">${safe(briefing.concentrationRisk?.level).slice(0, 30)}</span></div>
        <div style="color:#94a3b8;font-size:13px;margin-top:4px;">HHI: ${Number(briefing.concentrationRisk?.hhi || 0).toFixed(0)} &middot; Top: ${safe(briefing.concentrationRisk?.topPosition?.symbol) || "N/A"} at ${Number(briefing.concentrationRisk?.topPosition?.weight || 0).toFixed(1)}%</div>
        ${(briefing.concentrationRisk?.recommendations || []).map((r) => `<div style="color:#cbd5e1;font-size:13px;margin-top:4px;">- ${renderValue(r)}</div>`).join("")}
      </div>

      <!-- Allocation Recommendations -->
      <h2 style="color:#f1f5f9;font-size:18px;margin:24px 0 12px;padding-bottom:8px;border-bottom:2px solid #334155;">Allocation Actions</h2>
      <ul style="padding-left:20px;margin:0;">${allocationItems}</ul>

      <!-- AI/Tech News -->
      <h2 style="color:#f1f5f9;font-size:18px;margin:24px 0 12px;padding-bottom:8px;border-bottom:2px solid #334155;">AI & Tech News</h2>
      <table style="width:100%;border-collapse:collapse;"><tbody>${newsRows}</tbody></table>

      <!-- Trade Signals -->
      ${briefing.tradeSignals.length > 0 ? `
        <h2 style="color:#f1f5f9;font-size:18px;margin:24px 0 12px;padding-bottom:8px;border-bottom:2px solid #334155;">Trade Signals</h2>
        <table style="width:100%;border-collapse:collapse;"><tbody>${signalRows}</tbody></table>
      ` : ""}

      <!-- Upcoming IPOs -->
      ${briefing.upcomingIpos.length > 0 ? `
        <h2 style="color:#f1f5f9;font-size:18px;margin:24px 0 12px;padding-bottom:8px;border-bottom:2px solid #334155;">Upcoming IPOs</h2>
        <table style="width:100%;border-collapse:collapse;">
          <thead><tr style="border-bottom:2px solid #334155;">
            <th style="text-align:left;padding:8px 16px;color:#64748b;font-size:11px;text-transform:uppercase;">Company</th>
            <th style="text-align:left;padding:8px;color:#64748b;font-size:11px;text-transform:uppercase;">Date</th>
            <th style="text-align:left;padding:8px;color:#64748b;font-size:11px;text-transform:uppercase;">Sector</th>
            <th style="text-align:left;padding:8px;color:#64748b;font-size:11px;text-transform:uppercase;">Relevance</th>
          </tr></thead>
          <tbody>${ipoRows}</tbody>
        </table>
      ` : ""}

      <!-- Sector Rotation -->
      ${(briefing.sectorRotation?.signals?.length || 0) > 0 ? `
        <h2 style="color:#f1f5f9;font-size:18px;margin:24px 0 12px;padding-bottom:8px;border-bottom:2px solid #334155;">Sector Rotation</h2>
        <div style="display:flex;gap:16px;margin-bottom:12px;">
          <div style="flex:1;background:#1e293b;padding:12px;border-radius:8px;">
            <div style="color:#22c55e;font-weight:700;font-size:13px;margin-bottom:6px;">BULLISH</div>
            ${(briefing.sectorRotation?.bullish || []).map((s) => `<div style="color:#cbd5e1;font-size:13px;">+ ${s}</div>`).join("")}
          </div>
          <div style="flex:1;background:#1e293b;padding:12px;border-radius:8px;">
            <div style="color:#ef4444;font-weight:700;font-size:13px;margin-bottom:6px;">BEARISH</div>
            ${(briefing.sectorRotation?.bearish || []).map((s) => `<div style="color:#cbd5e1;font-size:13px;">- ${s}</div>`).join("")}
          </div>
        </div>
        ${(briefing.sectorRotation?.signals || []).map((s) => `<p style="color:#94a3b8;font-size:13px;margin:4px 0;">${s}</p>`).join("")}
      ` : ""}

      <!-- Disclaimer -->
      <div style="text-align:center;margin-top:32px;padding-top:16px;border-top:1px solid #334155;">
        <p style="color:#475569;font-size:11px;font-style:italic;">${briefing.disclaimer || "This is informational only, not financial advice. Always do your own research before making investment decisions."}</p>
      </div>
    </div>`;

  await resend.emails.send({
    from: "Portfolio Intel <onboarding@resend.dev>",
    to: recipientEmail,
    subject: `Daily Market Briefing - ${briefing.date}`,
    html,
  });

  console.log(`Briefing sent to ${recipientEmail}`);
  return true;
}
