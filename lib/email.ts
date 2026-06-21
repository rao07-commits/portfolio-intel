import { Resend } from "resend";
import type { BriefingOutput } from "./agent/briefing-agent";
import type { EnrichedSignal } from "./scorecard";
import type { ValuationRow } from "./valuation";
import type { EarningsEvent } from "./earnings-calendar";

// Deterministic sections computed in code by the cron route (NOT by the agent)
export interface DigestExtras {
  scorecard?: EnrichedSignal[];
  valuation?: ValuationRow[];
  earnings?: EarningsEvent[];
}

function getResend() {
  if (!process.env.RESEND_API_KEY) return null;
  return new Resend(process.env.RESEND_API_KEY);
}

function signalColor(action: string): string {
  const a = action.toLowerCase();
  if (["buy", "add", "long", "initiate", "accumulate", "start"].some((w) => a.includes(w))) return "#22c55e";
  if (["sell", "trim", "exit", "reduce"].some((w) => a.includes(w))) return "#ef4444";
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

function fmtPct(v: unknown): string {
  const n = Number(v);
  if (!Number.isFinite(n)) return "";
  return `${n > 0 ? "+" : ""}${n.toFixed(1)}%`;
}

function dataQualityColor(q: string | undefined): string {
  if (q === "high") return "#22c55e";
  if (q === "medium") return "#eab308";
  if (q === "low") return "#ef4444";
  if (q === "missing" || q === "stale") return "#ef4444";
  return "#64748b";
}

function sourceQualityColor(q: string | undefined): string {
  if (q === "primary" || q === "high") return "#22c55e";
  if (q === "medium" || q === "mixed") return "#eab308";
  if (q === "low") return "#ef4444";
  return "#64748b";
}

function actionStatusColor(status: string | undefined): string {
  if (status === "actionable" || status === "triggered") return "#22c55e";
  if (status === "watch" || status === "observation" || status === "no_action") return "#eab308";
  if (status === "do_not_act" || status === "expired" || status === "blocked") return "#ef4444";
  return "#64748b";
}

// Concentration math is only meaningful when holdings have real quantities
// (all-zero quantities → hhi 0 / weight NaN). Gate the section instead of
// rendering "HHI: NaN · Top: AMZN at NaN%".
function isConcentrationValid(risk: BriefingOutput["concentrationRisk"] | undefined): boolean {
  if (!risk) return false;
  const hhi = Number(risk.hhi);
  const weight = Number(risk.topPosition?.weight);
  return Number.isFinite(hhi) && hhi > 0 && Number.isFinite(weight) && weight > 0;
}

const H2 = `color:#f1f5f9;font-size:18px;margin:24px 0 12px;padding-bottom:8px;border-bottom:2px solid #334155;`;
const ROW = `border-bottom:1px solid #1e293b;`;

function sectionHeading(title: string): string {
  return `<h2 style="${H2}">${title}</h2>`;
}

// --- Section renderers ---

function renderWhatChanged(briefing: BriefingOutput): string {
  const wc = briefing.whatChanged;
  if (!wc || (!wc.summary && (!wc.items || wc.items.length === 0))) return "";
  return `
    ${sectionHeading("What's New Today")}
    ${wc.summary ? `<p style="color:#e2e8f0;font-size:14px;line-height:1.6;font-weight:500;">${wc.summary}</p>` : ""}
    ${(wc.items || []).map((i) => `<div style="color:#cbd5e1;font-size:13px;margin:6px 0;padding-left:12px;border-left:3px solid #3b82f6;">${renderValue(i)}</div>`).join("")}`;
}

function renderDataHealth(briefing: BriefingOutput): string {
  const health = briefing.dataHealth;
  if (!health || ((!health.items || health.items.length === 0) && (!health.warnings || health.warnings.length === 0))) return "";
  const rows = (health.items || []).slice(0, 8).map((item) => `
    <tr style="${ROW}">
      <td style="padding:7px 16px;color:#f1f5f9;font-size:13px;font-weight:600;">${safe(item.name)}</td>
      <td style="padding:7px 8px;color:${dataQualityColor(item.status)};font-size:11px;font-weight:700;text-transform:uppercase;">${safe(item.status)}</td>
      <td style="padding:7px 8px;color:#94a3b8;font-size:12px;">${safe(item.detail)}${item.updatedAt ? ` <span style="color:#475569;">(${safe(item.updatedAt)})</span>` : ""}</td>
    </tr>`).join("");
  const warnings = (health.warnings || []).map((w) => `<div style="color:#eab308;font-size:12px;margin-top:5px;">- ${renderValue(w)}</div>`).join("");
  return `
    ${sectionHeading("Data Health")}
    <div style="color:#94a3b8;font-size:12px;margin-bottom:8px;">Overall: <span style="color:${dataQualityColor(health.overall)};font-weight:700;text-transform:uppercase;">${safe(health.overall)}</span></div>
    ${rows ? `<table style="width:100%;border-collapse:collapse;"><tbody>${rows}</tbody></table>` : ""}
    ${warnings}`;
}

function renderActionDiscipline(briefing: BriefingOutput): string {
  const discipline = briefing.actionDiscipline;
  if (!discipline || (!discipline.summary && (!discipline.actions || discipline.actions.length === 0))) return "";
  const rows = (discipline.actions || []).slice(0, 6).map((a) => `
    <tr style="${ROW}">
      <td style="padding:8px 16px;color:#f1f5f9;font-size:13px;font-weight:600;">${safe(a.label)}</td>
      <td style="padding:8px;color:${actionStatusColor(a.status)};font-size:11px;font-weight:700;text-transform:uppercase;">${safe(a.status).replace(/_/g, " ")}</td>
      <td style="padding:8px;color:#94a3b8;font-size:12px;">${a.trigger ? `<strong style="color:#cbd5e1;">Trigger:</strong> ${safe(a.trigger)}<br>` : ""}${safe(a.detail)}</td>
    </tr>`).join("");
  return `
    ${sectionHeading("Action Discipline")}
    <p style="color:#cbd5e1;font-size:13px;line-height:1.5;margin:0 0 8px;">${safe(discipline.summary)}</p>
    <div style="color:#94a3b8;font-size:12px;margin-bottom:8px;">Status: <span style="color:${actionStatusColor(discipline.status)};font-weight:700;text-transform:uppercase;">${safe(discipline.status).replace(/_/g, " ")}</span></div>
    ${rows ? `<table style="width:100%;border-collapse:collapse;"><tbody>${rows}</tbody></table>` : ""}`;
}

function renderScorecard(scorecard: EnrichedSignal[] | undefined): string {
  if (!scorecard || scorecard.length === 0) return "";
  const withPnl = scorecard.filter((s) => s.pnl !== null);
  const winners = withPnl.filter((s) => (s.pnl || 0) > 0);
  const winRate = withPnl.length > 0 ? (winners.length / withPnl.length) * 100 : 0;
  const sorted = [...scorecard].sort((a, b) => (b.pnl ?? -Infinity) - (a.pnl ?? -Infinity));

  const rows = sorted
    .slice(0, 12)
    .map((s) => {
      const pnlColor = (s.pnl || 0) > 0 ? "#22c55e" : (s.pnl || 0) < 0 ? "#ef4444" : "#64748b";
      return `
      <tr style="${ROW}">
        <td style="padding:6px 16px;color:#f1f5f9;font-weight:600;font-size:13px;">${s.symbol}</td>
        <td style="padding:6px 8px;color:${signalColor(s.action)};font-size:11px;font-weight:700;">${s.action.slice(0, 20).toUpperCase()}</td>
        <td style="padding:6px 8px;color:${pnlColor};font-size:13px;font-weight:700;font-family:monospace;">${s.pnl !== null ? `${s.pnl > 0 ? "+" : ""}${s.pnl.toFixed(1)}%` : "—"}</td>
        <td style="padding:6px 8px;color:#94a3b8;font-size:11px;">${s.status}</td>
        <td style="padding:6px 8px;color:#64748b;font-size:11px;">${s.daysAgo}d</td>
      </tr>`;
    })
    .join("");

  return `
    ${sectionHeading("Signal Scorecard")}
    <p style="color:#94a3b8;font-size:12px;margin:0 0 8px;">How past calls are doing &middot; Win rate: <span style="color:${winRate >= 50 ? "#22c55e" : "#eab308"};font-weight:700;">${winRate.toFixed(0)}%</span> across ${withPnl.length} priced signals</p>
    <table style="width:100%;border-collapse:collapse;"><tbody>${rows}</tbody></table>`;
}

function renderValuation(valuation: ValuationRow[] | undefined): string {
  if (!valuation || valuation.length === 0) return "";
  const fmt = (n: number | null, digits = 1) => (n !== null && Number.isFinite(n) ? n.toFixed(digits) : "—");
  const rows = valuation
    .map((v) => {
      const pos = v.range52Position;
      const posColor = pos === null ? "#64748b" : pos > 0.85 ? "#ef4444" : pos < 0.3 ? "#22c55e" : "#94a3b8";
      return `
      <tr style="${ROW}">
        <td style="padding:6px 16px;color:#f1f5f9;font-weight:600;font-size:13px;">${v.symbol}</td>
        <td style="padding:6px 8px;color:#94a3b8;font-size:12px;font-family:monospace;">${v.price !== null ? `$${v.price.toFixed(2)}` : "—"}</td>
        <td style="padding:6px 8px;color:#94a3b8;font-size:12px;font-family:monospace;">${fmt(v.peTTM)}</td>
        <td style="padding:6px 8px;color:#94a3b8;font-size:12px;font-family:monospace;">${fmt(v.forwardPE)}</td>
        <td style="padding:6px 8px;color:${posColor};font-size:12px;font-family:monospace;">${pos !== null ? `${(pos * 100).toFixed(0)}%` : "—"}</td>
      </tr>`;
    })
    .join("");

  return `
    ${sectionHeading("Valuation Snapshot")}
    <table style="width:100%;border-collapse:collapse;">
      <thead><tr style="border-bottom:2px solid #334155;">
        <th style="text-align:left;padding:6px 16px;color:#64748b;font-size:10px;text-transform:uppercase;">Symbol</th>
        <th style="text-align:left;padding:6px 8px;color:#64748b;font-size:10px;text-transform:uppercase;">Price</th>
        <th style="text-align:left;padding:6px 8px;color:#64748b;font-size:10px;text-transform:uppercase;">P/E (TTM)</th>
        <th style="text-align:left;padding:6px 8px;color:#64748b;font-size:10px;text-transform:uppercase;">Fwd P/E</th>
        <th style="text-align:left;padding:6px 8px;color:#64748b;font-size:10px;text-transform:uppercase;">52wk Range</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <p style="color:#475569;font-size:10px;margin:4px 16px;">52wk Range: 0% = at 52-week low, 100% = at 52-week high</p>`;
}

function renderTradeSignals(briefing: BriefingOutput): string {
  if (briefing.tradeSignals.length === 0) return "";
  const rows = briefing.tradeSignals
    .map((s) => {
      const raw = s.reason ?? (s as Record<string, unknown>).thesis ?? (s as Record<string, unknown>).rationale;
      const reason = raw ? renderValue(raw) : "";
      const meta: string[] = [];
      if (s.signalScore !== undefined && s.signalScore !== null) meta.push(`Score ${Number(s.signalScore).toFixed(0)}`);
      if (s.signalType) meta.push(s.signalType);
      if (s.actionStatus) meta.push(`Status ${s.actionStatus.replace(/_/g, " ")}`);
      if (s.currentPrice !== undefined && s.currentPrice !== null) meta.push(`Price $${Number(s.currentPrice).toFixed(2)}`);
      if (s.priceChange1d !== undefined && s.priceChange1d !== null) meta.push(`1D ${fmtPct(s.priceChange1d)}`);
      if (s.priceChange5d !== undefined && s.priceChange5d !== null) meta.push(`5D ${fmtPct(s.priceChange5d)}`);
      const dq = s.dataQuality;
      const sq = s.sourceQuality;
      return `
      <tr style="${ROW}">
        <td style="padding:10px 16px;">
          <span style="color:${signalColor(s.action)};font-weight:700;font-size:14px;">${s.action.toUpperCase()}</span>
          <span style="color:#f1f5f9;font-weight:600;margin-left:8px;">${s.symbol}</span>
          ${s.companyName ? `<span style="color:#64748b;font-size:12px;margin-left:6px;">${s.companyName}</span>` : ""}
          ${meta.length > 0 || dq || sq ? `<div style="color:#64748b;font-size:11px;margin-top:4px;">${meta.join(" &middot; ")}${dq ? `${meta.length > 0 ? " &middot; " : ""}<span style="color:${dataQualityColor(dq)};font-weight:700;">Data: ${dq}</span>` : ""}${sq ? `${meta.length > 0 || dq ? " &middot; " : ""}<span style="color:${sourceQualityColor(sq)};font-weight:700;">Source: ${sq}</span>` : ""}</div>` : ""}
          ${s.triggerReason ? `<div style="color:#cbd5e1;font-size:12px;margin-top:4px;"><strong>Trigger:</strong> ${s.triggerReason}</div>` : ""}
          ${reason ? `<div style="color:#94a3b8;font-size:12px;margin-top:4px;">${reason}</div>` : ""}
          ${s.variantPerception ? `<div style="color:#cbd5e1;font-size:12px;margin-top:4px;"><strong>Variant view:</strong> ${s.variantPerception}</div>` : ""}
          ${s.riskNotes ? `<div style="color:#94a3b8;font-size:12px;margin-top:4px;"><strong>Risk:</strong> ${s.riskNotes}</div>` : ""}
          <div style="color:#64748b;font-size:11px;margin-top:4px;">
            Entry: ${safe(s.entryRange)} &middot; Target: ${safe(s.targetPrice)} &middot; Stop: ${safe(s.stopLoss)} &middot; ${safe(s.timeframe)} &middot; Confidence: ${safe(s.confidence)}
          </div>
        </td>
      </tr>`;
    })
    .join("");
  return `
    ${sectionHeading("Trade Signals")}
    <table style="width:100%;border-collapse:collapse;"><tbody>${rows}</tbody></table>`;
}

function renderCatalystCalendar(briefing: BriefingOutput): string {
  const catalysts = briefing.catalystCalendar || [];
  if (catalysts.length === 0) return "";
  const rows = catalysts.slice(0, 6).map((c) => `
    <tr style="${ROW}">
      <td style="padding:8px 16px;color:#f1f5f9;font-size:12px;font-weight:700;white-space:nowrap;">${safe(c.date)}</td>
      <td style="padding:8px;color:#94a3b8;font-size:12px;text-transform:uppercase;">${safe(c.type)}</td>
      <td style="padding:8px;color:#f1f5f9;font-size:13px;font-weight:600;">${safe(c.event)}${c.symbols?.length ? `<div style="color:#64748b;font-size:11px;margin-top:2px;">${c.symbols.join(", ")}</div>` : ""}</td>
      <td style="padding:8px;color:#94a3b8;font-size:12px;">${safe(c.portfolioRelevance)}${c.source ? `<div style="color:#475569;font-size:10px;margin-top:2px;">${safe(c.source)} &middot; ${safe(c.confidence)}</div>` : ""}</td>
    </tr>`).join("");
  return `
    ${sectionHeading("Catalyst Calendar")}
    <table style="width:100%;border-collapse:collapse;"><tbody>${rows}</tbody></table>`;
}

function renderThesisLedger(briefing: BriefingOutput): string {
  const theses = briefing.thesisLedger || [];
  if (theses.length === 0) return "";
  const rows = theses.slice(0, 6).map((t) => `
    <tr style="${ROW}">
      <td style="padding:9px 16px;color:#f1f5f9;font-size:13px;font-weight:700;">${safe(t.symbol)}</td>
      <td style="padding:9px 8px;color:${actionStatusColor(t.status)};font-size:11px;font-weight:700;text-transform:uppercase;">${safe(t.status)}</td>
      <td style="padding:9px 8px;color:#94a3b8;font-size:12px;">
        <div style="color:#cbd5e1;font-size:13px;">${safe(t.thesis)}</div>
        ${t.catalyst ? `<div style="margin-top:3px;"><strong style="color:#cbd5e1;">Catalyst:</strong> ${safe(t.catalyst)}</div>` : ""}
        ${t.invalidation ? `<div style="margin-top:3px;"><strong style="color:#cbd5e1;">Invalidation:</strong> ${safe(t.invalidation)}</div>` : ""}
        ${t.nextReview || t.confidence ? `<div style="color:#64748b;font-size:11px;margin-top:3px;">${t.nextReview ? `Review: ${safe(t.nextReview)}` : ""}${t.nextReview && t.confidence ? " &middot; " : ""}${t.confidence ? `Confidence: ${safe(t.confidence)}` : ""}</div>` : ""}
      </td>
    </tr>`).join("");
  return `
    ${sectionHeading("Thesis Ledger")}
    <table style="width:100%;border-collapse:collapse;"><tbody>${rows}</tbody></table>`;
}

function renderResearchBacklog(briefing: BriefingOutput): string {
  const backlog = briefing.researchBacklog || [];
  if (backlog.length === 0) return "";
  const rows = backlog.slice(0, 5).map((item) => `
    <tr style="${ROW}">
      <td style="padding:8px 16px;color:#f1f5f9;font-size:13px;font-weight:600;">${safe(item.topic)}</td>
      <td style="padding:8px;color:${item.priority === "high" ? "#ef4444" : item.priority === "medium" ? "#eab308" : "#64748b"};font-size:11px;font-weight:700;text-transform:uppercase;">${safe(item.priority)}</td>
      <td style="padding:8px;color:#94a3b8;font-size:12px;">${safe(item.reason)}<div style="color:#64748b;font-size:11px;margin-top:3px;">Needed: ${safe(item.neededEvidence)}</div></td>
    </tr>`).join("");
  return `
    ${sectionHeading("Research Quarantine")}
    <p style="color:#64748b;font-size:12px;margin:0 0 8px;">These items are intentionally not actionable until the missing evidence is resolved.</p>
    <table style="width:100%;border-collapse:collapse;"><tbody>${rows}</tbody></table>`;
}

function renderAllocation(briefing: BriefingOutput): string {
  if (!briefing.allocationTriggered) {
    return `
      ${sectionHeading("Allocation Actions")}
      <p style="color:#64748b;font-size:13px;font-style:italic;">No allocation changes warranted today — no caps crossed, no macro signals flipped.</p>`;
  }
  const items = [
    briefing.allocationRecommendations?.amznTrim,
    briefing.allocationRecommendations?.semisAction,
    briefing.allocationRecommendations?.cashDeployment,
    ...(briefing.allocationRecommendations?.sectorShifts || []),
  ]
    .filter(Boolean)
    .map((a) => `<li style="color:#cbd5e1;margin-bottom:6px;font-size:13px;">${renderValue(a)}</li>`)
    .join("");
  if (!items) return "";
  return `
    ${sectionHeading("Allocation Actions")}
    <ul style="padding-left:20px;margin:0;">${items}</ul>`;
}

function renderSmartMoney(briefing: BriefingOutput): string {
  const sm = briefing.smartMoney;
  if (!sm || !sm.hasNewFilings || !sm.highlights || sm.highlights.length === 0) return "";
  return `
    ${sectionHeading("Smart Money — New 13F Filings")}
    ${sm.highlights.map((h) => `<div style="color:#cbd5e1;font-size:13px;margin:6px 0;padding-left:12px;border-left:3px solid #a855f7;">${renderValue(h)}</div>`).join("")}`;
}

function renderDayFlavor(briefing: BriefingOutput, earnings: EarningsEvent[] | undefined): string {
  const flavor = briefing.dayOfWeekFlavor;
  if (!flavor || flavor.type === "lean" || !flavor.content || flavor.content.length === 0) return "";
  const title = flavor.type === "week-ahead" ? "The Week Ahead" : "Week in Review";

  const earningsTable =
    flavor.type === "week-ahead" && earnings && earnings.length > 0
      ? `<table style="width:100%;border-collapse:collapse;margin-top:8px;"><tbody>${earnings
          .map(
            (e) => `
        <tr style="${ROW}">
          <td style="padding:6px 16px;color:#f1f5f9;font-weight:600;font-size:13px;">${e.symbol}</td>
          <td style="padding:6px 8px;color:#94a3b8;font-size:12px;">${e.date} ${e.timing}</td>
          <td style="padding:6px 8px;color:#94a3b8;font-size:12px;">${e.whatToWatch.slice(0, 140)}</td>
        </tr>`
          )
          .join("")}</tbody></table>`
      : "";

  return `
    ${sectionHeading(title)}
    ${flavor.content.map((c) => `<p style="color:#cbd5e1;font-size:13px;margin:6px 0;">${renderValue(c)}</p>`).join("")}
    ${earningsTable}`;
}

function renderMarketOverview(briefing: BriefingOutput): string {
  return `
    ${sectionHeading("Market Overview")}
    <p style="color:#cbd5e1;font-size:14px;line-height:1.6;">${briefing.marketOverview.summary}</p>
    ${briefing.marketOverview.indexMoves.length > 0 ? `
      <div style="display:flex;gap:16px;flex-wrap:wrap;margin-top:12px;">
        ${briefing.marketOverview.indexMoves.map((i) => `
          <div style="background:#1e293b;padding:12px 16px;border-radius:8px;min-width:120px;">
            <div style="color:#94a3b8;font-size:12px;">${i.name}</div>
            <div style="color:${i.change.startsWith("-") ? "#ef4444" : "#22c55e"};font-size:16px;font-weight:700;">${i.change}</div>
          </div>`).join("")}
      </div>` : ""}`;
}

function renderNews(briefing: BriefingOutput): string {
  if (briefing.newsHeadlines.length === 0) return "";
  const rows = briefing.newsHeadlines
    .slice(0, 5)
    .map((n) => `
      <tr style="${ROW}">
        <td style="padding:10px 16px;">
          ${n.url ? `<a href="${n.url}" style="color:#60a5fa;text-decoration:none;font-weight:600;">${n.title}</a>` : `<span style="color:#f1f5f9;font-weight:600;">${n.title}</span>`}
          <div style="color:#94a3b8;font-size:12px;margin-top:2px;">${n.source} &middot; ${n.relevance}</div>
        </td>
      </tr>`)
    .join("");
  return `
    ${sectionHeading("AI & Tech News")}
    <table style="width:100%;border-collapse:collapse;"><tbody>${rows}</tbody></table>`;
}

function renderIpos(briefing: BriefingOutput): string {
  if (briefing.upcomingIpos.length === 0) return "";
  const rows = briefing.upcomingIpos
    .slice(0, 5)
    .map((ipo) => `
      <tr style="${ROW}">
        <td style="padding:8px 16px;color:#f1f5f9;font-weight:600;">${ipo.name}</td>
        <td style="padding:8px;color:#94a3b8;font-size:13px;">${ipo.date}</td>
        <td style="padding:8px;color:#94a3b8;font-size:13px;">${ipo.sector}</td>
        <td style="padding:8px;color:#94a3b8;font-size:13px;">${ipo.relevance}</td>
      </tr>`)
    .join("");
  return `
    ${sectionHeading("Upcoming IPOs")}
    <table style="width:100%;border-collapse:collapse;">
      <thead><tr style="border-bottom:2px solid #334155;">
        <th style="text-align:left;padding:8px 16px;color:#64748b;font-size:11px;text-transform:uppercase;">Company</th>
        <th style="text-align:left;padding:8px;color:#64748b;font-size:11px;text-transform:uppercase;">Date</th>
        <th style="text-align:left;padding:8px;color:#64748b;font-size:11px;text-transform:uppercase;">Sector</th>
        <th style="text-align:left;padding:8px;color:#64748b;font-size:11px;text-transform:uppercase;">Relevance</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
}

function renderSectorRotation(briefing: BriefingOutput): string {
  if ((briefing.sectorRotation?.signals?.length || 0) === 0) return "";
  return `
    ${sectionHeading("Sector Rotation")}
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
    ${(briefing.sectorRotation?.signals || []).map((s) => `<p style="color:#94a3b8;font-size:13px;margin:4px 0;">${s}</p>`).join("")}`;
}

function renderPortfolioRisk(briefing: BriefingOutput): string {
  if (isConcentrationValid(briefing.concentrationRisk)) {
    return `
      ${sectionHeading("Portfolio Risk")}
      <div style="background:#1e293b;padding:16px;border-radius:8px;border-left:4px solid ${riskColor(safe(briefing.concentrationRisk?.level))};">
        <div style="color:#f1f5f9;font-weight:700;">Concentration: <span style="color:${riskColor(safe(briefing.concentrationRisk?.level))};text-transform:uppercase;">${safe(briefing.concentrationRisk?.level).slice(0, 30)}</span></div>
        <div style="color:#94a3b8;font-size:13px;margin-top:4px;">HHI: ${Number(briefing.concentrationRisk?.hhi || 0).toFixed(0)} &middot; Top: ${safe(briefing.concentrationRisk?.topPosition?.symbol) || "N/A"} at ${Number(briefing.concentrationRisk?.topPosition?.weight || 0).toFixed(1)}%</div>
        ${(briefing.concentrationRisk?.recommendations || []).map((r) => `<div style="color:#cbd5e1;font-size:13px;margin-top:4px;">- ${renderValue(r)}</div>`).join("")}
      </div>`;
  }
  return `
    ${sectionHeading("Portfolio Risk")}
    <div style="background:#1e293b;padding:12px 16px;border-radius:8px;border-left:4px solid #eab308;">
      <div style="color:#eab308;font-size:13px;">Position-sizing data unavailable &mdash; seed share quantities via POST /api/portfolio to enable concentration analysis.</div>
    </div>`;
}

function renderPortfolioRiskDashboard(briefing: BriefingOutput): string {
  const dashboard = briefing.portfolioRiskDashboard;
  if (!dashboard || (!dashboard.summary && (dashboard.exposures || []).length === 0 && (dashboard.riskFlags || []).length === 0 && (dashboard.scenarios || []).length === 0)) return "";
  const exposures = (dashboard.exposures || []).slice(0, 6).map((e) => `
    <tr style="${ROW}">
      <td style="padding:7px 16px;color:#f1f5f9;font-size:13px;font-weight:600;">${safe(e.name)}</td>
      <td style="padding:7px 8px;color:#cbd5e1;font-size:12px;">${safe(e.value)}</td>
      <td style="padding:7px 8px;color:${riskColor(safe(e.riskLevel))};font-size:11px;font-weight:700;text-transform:uppercase;">${safe(e.riskLevel)}</td>
      <td style="padding:7px 8px;color:#94a3b8;font-size:12px;">${safe(e.note)}</td>
    </tr>`).join("");
  const flags = (dashboard.riskFlags || []).map((flag) => `<div style="color:#eab308;font-size:12px;margin-top:5px;">- ${renderValue(flag)}</div>`).join("");
  const scenarios = (dashboard.scenarios || []).slice(0, 4).map((s) => `
    <div style="border-left:3px solid #64748b;padding-left:10px;margin:8px 0;">
      <div style="color:#f1f5f9;font-size:13px;font-weight:600;">${safe(s.scenario)}</div>
      <div style="color:#94a3b8;font-size:12px;margin-top:2px;">${safe(s.potentialImpact)}</div>
      ${s.watchItem ? `<div style="color:#64748b;font-size:11px;margin-top:2px;">Watch: ${safe(s.watchItem)}</div>` : ""}
    </div>`).join("");
  return `
    ${sectionHeading("Portfolio Risk Dashboard")}
    ${dashboard.summary ? `<p style="color:#cbd5e1;font-size:13px;line-height:1.5;margin:0 0 8px;">${safe(dashboard.summary)}</p>` : ""}
    ${exposures ? `<table style="width:100%;border-collapse:collapse;"><tbody>${exposures}</tbody></table>` : ""}
    ${flags}
    ${scenarios ? `<div style="margin-top:10px;">${scenarios}</div>` : ""}`;
}

function renderSourceQuality(briefing: BriefingOutput): string {
  const sourceQuality = briefing.sourceQuality;
  if (!sourceQuality || ((sourceQuality.sources || []).length === 0 && (sourceQuality.notes || []).length === 0)) return "";
  const rows = (sourceQuality.sources || []).slice(0, 8).map((s) => `
    <tr style="${ROW}">
      <td style="padding:7px 16px;color:#f1f5f9;font-size:13px;font-weight:600;">${s.url ? `<a href="${s.url}" style="color:#60a5fa;text-decoration:none;">${safe(s.source)}</a>` : safe(s.source)}</td>
      <td style="padding:7px 8px;color:${sourceQualityColor(s.rating)};font-size:11px;font-weight:700;text-transform:uppercase;">${safe(s.rating)}</td>
      <td style="padding:7px 8px;color:#94a3b8;font-size:12px;">${safe(s.use)}</td>
    </tr>`).join("");
  const notes = (sourceQuality.notes || []).map((note) => `<div style="color:#94a3b8;font-size:12px;margin-top:5px;">- ${renderValue(note)}</div>`).join("");
  return `
    ${sectionHeading("Source Quality")}
    <div style="color:#94a3b8;font-size:12px;margin-bottom:8px;">Overall: <span style="color:${sourceQualityColor(sourceQuality.overall)};font-weight:700;text-transform:uppercase;">${safe(sourceQuality.overall)}</span></div>
    ${rows ? `<table style="width:100%;border-collapse:collapse;"><tbody>${rows}</tbody></table>` : ""}
    ${notes}`;
}

export async function sendBriefingDigest(
  briefing: BriefingOutput,
  recipientEmail: string,
  extras: DigestExtras = {}
) {
  const resend = getResend();
  if (!resend) {
    console.warn("RESEND_API_KEY not set, skipping briefing email");
    return false;
  }

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

      ${renderWhatChanged(briefing)}
      ${renderDataHealth(briefing)}
      ${renderActionDiscipline(briefing)}
      ${renderScorecard(extras.scorecard)}
      ${renderValuation(extras.valuation)}
      ${renderTradeSignals(briefing)}
      ${renderCatalystCalendar(briefing)}
      ${renderThesisLedger(briefing)}
      ${renderResearchBacklog(briefing)}
      ${renderAllocation(briefing)}
      ${renderSmartMoney(briefing)}
      ${renderDayFlavor(briefing, extras.earnings)}
      ${renderMarketOverview(briefing)}
      ${renderNews(briefing)}
      ${renderIpos(briefing)}
      ${renderSectorRotation(briefing)}
      ${renderPortfolioRiskDashboard(briefing)}
      ${renderPortfolioRisk(briefing)}
      ${renderSourceQuality(briefing)}

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
