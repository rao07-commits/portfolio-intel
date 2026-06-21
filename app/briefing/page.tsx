import Link from "next/link";
import { initDB, getAllBriefings, getLatestBriefing, getBriefingByDate } from "@/lib/db";
import type { BriefingOutput } from "@/lib/agent/briefing-agent";

export const dynamic = "force-dynamic";

function signalColor(action: string): string {
  const a = action.toLowerCase();
  if (a.includes("buy") || a.includes("add")) return "text-green-400 border-green-400/30 bg-green-400/10";
  if (a.includes("sell") || a.includes("trim")) return "text-red-400 border-red-400/30 bg-red-400/10";
  return "text-yellow-400 border-yellow-400/30 bg-yellow-400/10";
}

function riskColor(level: string): string {
  const map: Record<string, string> = { low: "text-green-400", moderate: "text-yellow-400", high: "text-orange-400", extreme: "text-red-400" };
  return map[level] || "text-slate-400";
}

function qualityColor(level: string | undefined): string {
  const map: Record<string, string> = {
    high: "text-green-400",
    primary: "text-green-400",
    medium: "text-yellow-400",
    mixed: "text-yellow-400",
    low: "text-red-400",
    stale: "text-red-400",
    missing: "text-red-400",
    unknown: "text-slate-400",
  };
  return map[String(level || "").toLowerCase()] || "text-slate-400";
}

function actionStatusColor(status: string | undefined): string {
  const map: Record<string, string> = {
    actionable: "text-green-400 border-green-400/30 bg-green-400/10",
    triggered: "text-green-400 border-green-400/30 bg-green-400/10",
    watch: "text-yellow-400 border-yellow-400/30 bg-yellow-400/10",
    observation: "text-slate-300 border-slate-500/30 bg-slate-500/10",
    no_action: "text-slate-300 border-slate-500/30 bg-slate-500/10",
    do_not_act: "text-red-400 border-red-400/30 bg-red-400/10",
    expired: "text-red-400 border-red-400/30 bg-red-400/10",
    blocked: "text-red-400 border-red-400/30 bg-red-400/10",
  };
  return map[String(status || "").toLowerCase()] || "text-slate-400 border-slate-500/30 bg-slate-500/10";
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });
}

function toDateKey(d: string): string {
  return new Date(d).toISOString().split("T")[0];
}

function renderValue(v: unknown): string {
  if (typeof v === "string") return v;
  if (typeof v === "object" && v !== null) {
    const obj = v as Record<string, unknown>;
    // Handle common agent patterns: {action, detail}, {shift, sector, rationale}, etc.
    const parts: string[] = [];
    if (obj.action) parts.push(String(obj.action));
    if (obj.shift) parts.push(String(obj.shift));
    if (obj.sector) parts.push(`[${obj.sector}]`);
    if (obj.detail) parts.push(String(obj.detail));
    if (obj.rationale) parts.push(String(obj.rationale));
    if (obj.to) parts.push(`Shift to ${obj.to}`);
    if (obj.from) parts.push(`from ${obj.from}`);
    if (parts.length > 0) return parts.join(" — ");
    // Fallback: render key-value pairs
    return Object.entries(obj)
      .filter(([, val]) => val !== null && val !== undefined)
      .map(([key, val]) => `${key}: ${val}`)
      .join(". ");
  }
  return String(v);
}

function formatPct(v: unknown): string {
  const n = Number(v);
  if (!Number.isFinite(n)) return "";
  return `${n > 0 ? "+" : ""}${n.toFixed(1)}%`;
}

const INVESTOR_DISCIPLINE_MODULES = [
  {
    name: "Data Health",
    detail: "Freshness, missing inputs, stale prices, and confidence limits.",
  },
  {
    name: "Action Discipline",
    detail: "Observation, watch, actionable, blocked, expired, or do-not-act states.",
  },
  {
    name: "Catalyst Calendar",
    detail: "Macro, Fed, earnings, IPO, and company events tied to portfolio relevance.",
  },
  {
    name: "Thesis Ledger",
    detail: "Active theses with catalyst, invalidation, next review, and confidence.",
  },
  {
    name: "Research Quarantine",
    detail: "Unresolved tickers, weak claims, rumors, and evidence still needed.",
  },
  {
    name: "Source Quality",
    detail: "Primary, high, medium, or low rating for evidence behind claims.",
  },
];

function hasInvestorDisciplineFields(briefing: BriefingOutput): boolean {
  return Boolean(
    briefing.dataHealth ||
      briefing.actionDiscipline ||
      briefing.portfolioRiskDashboard ||
      (briefing.catalystCalendar && briefing.catalystCalendar.length > 0) ||
      (briefing.thesisLedger && briefing.thesisLedger.length > 0) ||
      (briefing.researchBacklog && briefing.researchBacklog.length > 0) ||
      briefing.sourceQuality ||
      briefing.tradeSignals?.some((s) => s.actionStatus || s.variantPerception || s.sourceQuality)
  );
}

function BriefingView({ briefing, date }: { briefing: BriefingOutput; date: string }) {
  const hasNewFrameworkData = hasInvestorDisciplineFields(briefing);

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-700 pb-4">
        <h2 className="text-2xl font-bold text-white">{formatDate(date)}</h2>
        <p className="text-slate-500 text-sm mt-1">Daily Market Briefing</p>
      </div>

      {!hasNewFrameworkData && (
        <section className="bg-slate-800 rounded-xl p-6 border border-blue-400/30">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-white">Investor Discipline Framework</h3>
              <p className="text-slate-400 text-sm mt-1">
                This archived briefing was generated before the new sections were added. Future briefings will populate the modules below with live research.
              </p>
            </div>
            <span className="self-start rounded border border-yellow-400/30 bg-yellow-400/10 px-2 py-1 text-xs font-bold uppercase text-yellow-400">
              Pending next run
            </span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {INVESTOR_DISCIPLINE_MODULES.map((module) => (
              <div key={module.name} className="border border-slate-700 rounded-lg p-3">
                <div className="text-white text-sm font-semibold">{module.name}</div>
                <div className="text-slate-500 text-xs mt-1">{module.detail}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* What's New */}
      {(briefing.whatChanged?.summary || briefing.whatChanged?.items?.length > 0) && (
        <section className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-3">What&apos;s New Today</h3>
          {briefing.whatChanged.summary && <p className="text-slate-300 text-sm leading-relaxed mb-3">{briefing.whatChanged.summary}</p>}
          <div className="space-y-2">
            {briefing.whatChanged.items?.map((item, i) => (
              <div key={i} className="border-l-2 border-blue-400 pl-3 text-slate-300 text-sm">{renderValue(item)}</div>
            ))}
          </div>
        </section>
      )}

      {/* Data Health */}
      {briefing.dataHealth && ((briefing.dataHealth.items?.length || 0) > 0 || (briefing.dataHealth.warnings?.length || 0) > 0) && (
        <section className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-white">Data Health</h3>
            <span className={`text-xs uppercase font-bold ${qualityColor(briefing.dataHealth.overall)}`}>{briefing.dataHealth.overall}</span>
          </div>
          <div className="space-y-2">
            {briefing.dataHealth.items?.map((item, i) => (
              <div key={i} className="grid grid-cols-1 sm:grid-cols-[140px_90px_1fr] gap-2 border-b border-slate-700/50 pb-2 last:border-0">
                <span className="text-white text-sm font-semibold">{item.name}</span>
                <span className={`text-xs uppercase font-bold ${qualityColor(item.status)}`}>{item.status}</span>
                <span className="text-slate-400 text-sm">{item.detail}{item.updatedAt ? <span className="text-slate-600"> ({item.updatedAt})</span> : null}</span>
              </div>
            ))}
          </div>
          {briefing.dataHealth.warnings?.length > 0 && (
            <div className="mt-3 space-y-1">
              {briefing.dataHealth.warnings.map((w, i) => <div key={i} className="text-yellow-400 text-sm">- {renderValue(w)}</div>)}
            </div>
          )}
        </section>
      )}

      {/* Action Discipline */}
      {briefing.actionDiscipline && (briefing.actionDiscipline.summary || (briefing.actionDiscipline.actions?.length || 0) > 0) && (
        <section className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-white">Action Discipline</h3>
            <span className={`px-2 py-0.5 rounded border text-xs font-bold uppercase ${actionStatusColor(briefing.actionDiscipline.status)}`}>{briefing.actionDiscipline.status.replace(/_/g, " ")}</span>
          </div>
          {briefing.actionDiscipline.summary && <p className="text-slate-300 text-sm leading-relaxed mb-3">{briefing.actionDiscipline.summary}</p>}
          <div className="space-y-2">
            {briefing.actionDiscipline.actions?.map((a, i) => (
              <div key={i} className="border border-slate-700 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-white text-sm font-semibold">{a.label}</span>
                  <span className={`px-2 py-0.5 rounded border text-[10px] font-bold uppercase ${actionStatusColor(a.status)}`}>{a.status.replace(/_/g, " ")}</span>
                </div>
                {a.trigger && <p className="text-slate-400 text-xs mb-1"><span className="text-slate-500">Trigger:</span> {a.trigger}</p>}
                <p className="text-slate-400 text-sm">{a.detail}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Market Overview */}
      <section className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-3">Market Overview</h3>
        <p className="text-slate-300 text-sm leading-relaxed">{briefing.marketOverview?.summary || "No market summary available."}</p>
        {briefing.marketOverview?.indexMoves?.length > 0 && (
          <div className="flex gap-3 flex-wrap mt-4">
            {briefing.marketOverview.indexMoves.map((m, i) => (
              <div key={i} className="bg-slate-700/50 px-4 py-2 rounded-lg">
                <span className="text-slate-400 text-xs">{m.name}</span>
                <span className={`ml-2 font-bold ${String(m.change)?.startsWith("-") ? "text-red-400" : "text-green-400"}`}>{m.change}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Concentration Risk */}
      {briefing.concentrationRisk && (
        <section className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-white">Portfolio Risk</h3>
            <span className={`font-bold uppercase text-sm ${riskColor(briefing.concentrationRisk.level)}`}>
              {String(briefing.concentrationRisk.level).slice(0, 20)}
            </span>
          </div>
          {briefing.concentrationRisk.topPosition?.symbol && (
            <p className="text-slate-400 text-sm mb-2">
              Top position: <span className="text-white font-semibold">{briefing.concentrationRisk.topPosition.symbol}</span> at {Number(briefing.concentrationRisk.topPosition.weight || 0).toFixed(1)}%
            </p>
          )}
          {briefing.concentrationRisk.recommendations?.length > 0 && (
            <ul className="space-y-1 mt-2">
              {briefing.concentrationRisk.recommendations.map((r, i) => (
                <li key={i} className="text-slate-300 text-sm flex gap-2">
                  <span className="text-yellow-400">!</span> {typeof r === "string" ? r : renderValue(r)}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {/* Allocation Recommendations */}
      {briefing.allocationRecommendations && (
        <section className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-3">Allocation Actions</h3>
          <ul className="space-y-2 text-sm">
            {briefing.allocationRecommendations.amznTrim && (
              <li className="text-slate-300"><span className="text-red-400 font-semibold">AMZN:</span> {renderValue(briefing.allocationRecommendations.amznTrim)}</li>
            )}
            {briefing.allocationRecommendations.semisAction && (
              <li className="text-slate-300"><span className="text-blue-400 font-semibold">AI/Semis:</span> {renderValue(briefing.allocationRecommendations.semisAction)}</li>
            )}
            {briefing.allocationRecommendations.cashDeployment && (
              <li className="text-slate-300"><span className="text-green-400 font-semibold">Cash:</span> {renderValue(briefing.allocationRecommendations.cashDeployment)}</li>
            )}
            {briefing.allocationRecommendations.sectorShifts?.map((s, i) => (
              <li key={i} className="text-slate-300"><span className="text-purple-400 font-semibold">Rotate:</span> {renderValue(s)}</li>
            ))}
          </ul>
        </section>
      )}

      {/* News Headlines */}
      {briefing.newsHeadlines?.length > 0 && (
        <section className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-3">AI & Tech News</h3>
          <div className="space-y-3">
            {briefing.newsHeadlines.map((n, i) => (
              <div key={i} className="border-b border-slate-700/50 pb-3 last:border-0 last:pb-0">
                {n.url ? (
                  <a href={n.url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 font-semibold text-sm">{n.title}</a>
                ) : (
                  <span className="text-white font-semibold text-sm">{n.title}</span>
                )}
                <div className="text-slate-500 text-xs mt-1">{n.source} &middot; {n.relevance}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Trade Signals */}
      {briefing.tradeSignals?.length > 0 && (
        <section className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-3">Trade Signals</h3>
          <div className="space-y-3">
            {briefing.tradeSignals.map((s, i) => (
              <div key={i} className="border border-slate-700 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase border ${signalColor(s.action)}`}>{s.action}</span>
                  <span className="text-white font-bold">{s.symbol}</span>
                  {s.companyName && <span className="text-slate-500 text-xs">{s.companyName}</span>}
                  {s.actionStatus && <span className={`px-2 py-0.5 rounded border text-[10px] font-bold uppercase ${actionStatusColor(s.actionStatus)}`}>{s.actionStatus.replace(/_/g, " ")}</span>}
                  <span className="ml-auto text-slate-500 text-xs">{s.confidence} confidence</span>
                </div>
                {(s.signalScore !== undefined || s.signalType || s.currentPrice !== undefined || s.priceChange1d !== undefined || s.priceChange5d !== undefined || s.dataQuality || s.sourceQuality) && (
                  <div className="flex gap-2 flex-wrap text-xs text-slate-500 mb-2">
                    {s.signalScore !== undefined && s.signalScore !== null && <span>Score {Number(s.signalScore).toFixed(0)}</span>}
                    {s.signalType && <span>{s.signalType}</span>}
                    {s.currentPrice !== undefined && s.currentPrice !== null && <span>${Number(s.currentPrice).toFixed(2)}</span>}
                    {s.priceChange1d !== undefined && s.priceChange1d !== null && <span>1D {formatPct(s.priceChange1d)}</span>}
                    {s.priceChange5d !== undefined && s.priceChange5d !== null && <span>5D {formatPct(s.priceChange5d)}</span>}
                    {s.dataQuality && <span className={qualityColor(s.dataQuality)}>Data: {s.dataQuality}</span>}
                    {s.sourceQuality && <span className={qualityColor(s.sourceQuality)}>Source: {s.sourceQuality}</span>}
                  </div>
                )}
                {s.triggerReason && <p className="text-slate-300 text-sm mb-2"><span className="text-slate-500">Trigger:</span> {s.triggerReason}</p>}
                <p className="text-slate-400 text-sm mb-2">{s.reason}</p>
                {s.variantPerception && (
                  <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-3 mb-2">
                    <span className="text-amber-400 text-xs font-bold uppercase">Variant view: </span>
                    <span className="text-slate-300 text-sm">{s.variantPerception}</span>
                  </div>
                )}
                {s.riskNotes && <p className="text-slate-500 text-sm mb-2"><span className="text-slate-400">Risk:</span> {s.riskNotes}</p>}
                <div className="flex gap-4 text-xs text-slate-500">
                  {s.entryRange && <span>Entry: {s.entryRange}</span>}
                  {s.targetPrice && <span>Target: {s.targetPrice}</span>}
                  {s.stopLoss && <span>Stop: {s.stopLoss}</span>}
                  {s.timeframe && <span>{s.timeframe}</span>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Catalyst Calendar */}
      {briefing.catalystCalendar && briefing.catalystCalendar.length > 0 && (
        <section className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-3">Catalyst Calendar</h3>
          <div className="space-y-2">
            {briefing.catalystCalendar.map((c, i) => (
              <div key={i} className="grid grid-cols-1 sm:grid-cols-[96px_90px_1fr] gap-2 border-b border-slate-700/50 pb-3 last:border-0">
                <span className="text-white text-sm font-semibold">{c.date}</span>
                <span className="text-slate-500 text-xs uppercase">{c.type}</span>
                <div>
                  <div className="text-slate-200 text-sm font-semibold">{c.event}</div>
                  {c.symbols && c.symbols.length > 0 && <div className="text-slate-500 text-xs mt-1">{c.symbols.join(", ")}</div>}
                  <div className="text-slate-400 text-sm mt-1">{c.portfolioRelevance}</div>
                  <div className="text-slate-600 text-xs mt-1">{c.source}{c.source ? " | " : ""}{c.confidence} confidence</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Thesis Ledger */}
      {briefing.thesisLedger && briefing.thesisLedger.length > 0 && (
        <section className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-3">Thesis Ledger</h3>
          <div className="space-y-3">
            {briefing.thesisLedger.map((t, i) => (
              <div key={i} className="border border-slate-700 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-white font-bold">{t.symbol}</span>
                  <span className={`px-2 py-0.5 rounded border text-[10px] font-bold uppercase ${actionStatusColor(t.status)}`}>{t.status}</span>
                  {t.confidence && <span className={`text-xs ml-auto ${qualityColor(t.confidence)}`}>{t.confidence} confidence</span>}
                </div>
                <p className="text-slate-300 text-sm mb-2">{t.thesis}</p>
                {t.catalyst && <p className="text-slate-500 text-sm"><span className="text-slate-400">Catalyst:</span> {t.catalyst}</p>}
                {t.invalidation && <p className="text-slate-500 text-sm"><span className="text-slate-400">Invalidation:</span> {t.invalidation}</p>}
                {t.nextReview && <p className="text-slate-600 text-xs mt-2">Next review: {t.nextReview}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Research Backlog */}
      {briefing.researchBacklog && briefing.researchBacklog.length > 0 && (
        <section className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-1">Research Quarantine</h3>
          <p className="text-slate-500 text-xs mb-3">These items are intentionally not actionable until the missing evidence is resolved.</p>
          <div className="space-y-2">
            {briefing.researchBacklog.map((item, i) => (
              <div key={i} className="border border-slate-700 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-white text-sm font-semibold">{item.topic}</span>
                  <span className={`text-xs uppercase font-bold ${qualityColor(item.priority === "low" ? "unknown" : item.priority)}`}>{item.priority}</span>
                </div>
                <p className="text-slate-400 text-sm">{item.reason}</p>
                <p className="text-slate-600 text-xs mt-1">Needed: {item.neededEvidence}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Sector Rotation */}
      {briefing.sectorRotation && (briefing.sectorRotation.bullish?.length > 0 || briefing.sectorRotation.bearish?.length > 0) && (
        <section className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-3">Sector Rotation</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-green-400 font-semibold text-sm mb-2">Bullish</h4>
              {briefing.sectorRotation.bullish?.map((s, i) => (
                <div key={i} className="text-slate-300 text-sm mb-1">+ {s}</div>
              ))}
            </div>
            <div>
              <h4 className="text-red-400 font-semibold text-sm mb-2">Bearish</h4>
              {briefing.sectorRotation.bearish?.map((s, i) => (
                <div key={i} className="text-slate-300 text-sm mb-1">- {s}</div>
              ))}
            </div>
          </div>
          {briefing.sectorRotation.signals?.map((s, i) => (
            <p key={i} className="text-slate-500 text-xs mt-2">{s}</p>
          ))}
        </section>
      )}

      {/* Upcoming IPOs */}
      {briefing.upcomingIpos?.length > 0 && (
        <section className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-3">Upcoming IPOs</h3>
          <div className="space-y-2">
            {briefing.upcomingIpos.map((ipo, i) => (
              <div key={i} className="flex items-center justify-between border-b border-slate-700/50 pb-2 last:border-0">
                <div>
                  <span className="text-white font-semibold text-sm">{ipo.name}</span>
                  <span className="text-slate-500 text-xs ml-2">{ipo.sector}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 text-xs">{ipo.date}</span>
                  <div className="text-slate-500 text-xs">{ipo.relevance}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Portfolio Risk Dashboard */}
      {briefing.portfolioRiskDashboard && (
        <section className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-3">Portfolio Risk Dashboard</h3>
          {briefing.portfolioRiskDashboard.summary && <p className="text-slate-300 text-sm leading-relaxed mb-3">{briefing.portfolioRiskDashboard.summary}</p>}
          {briefing.portfolioRiskDashboard.exposures?.length > 0 && (
            <div className="grid gap-2 mb-4">
              {briefing.portfolioRiskDashboard.exposures.map((e, i) => (
                <div key={i} className="grid grid-cols-1 sm:grid-cols-[140px_110px_1fr] gap-2 border-b border-slate-700/50 pb-2 last:border-0">
                  <span className="text-white text-sm font-semibold">{e.name}</span>
                  <span className="text-slate-300 text-sm">{e.value}</span>
                  <span className="text-slate-500 text-sm">{e.riskLevel && <span className={riskColor(e.riskLevel)}>{e.riskLevel}: </span>}{e.note}</span>
                </div>
              ))}
            </div>
          )}
          {briefing.portfolioRiskDashboard.riskFlags?.length > 0 && (
            <div className="mb-4 space-y-1">
              {briefing.portfolioRiskDashboard.riskFlags.map((flag, i) => <div key={i} className="text-yellow-400 text-sm">- {renderValue(flag)}</div>)}
            </div>
          )}
          {briefing.portfolioRiskDashboard.scenarios?.length > 0 && (
            <div className="space-y-2">
              {briefing.portfolioRiskDashboard.scenarios.map((s, i) => (
                <div key={i} className="border-l-2 border-slate-600 pl-3">
                  <div className="text-white text-sm font-semibold">{s.scenario}</div>
                  <div className="text-slate-400 text-sm">{s.potentialImpact}</div>
                  {s.watchItem && <div className="text-slate-600 text-xs mt-1">Watch: {s.watchItem}</div>}
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Source Quality */}
      {briefing.sourceQuality && ((briefing.sourceQuality.sources?.length || 0) > 0 || (briefing.sourceQuality.notes?.length || 0) > 0) && (
        <section className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-white">Source Quality</h3>
            <span className={`text-xs uppercase font-bold ${qualityColor(briefing.sourceQuality.overall)}`}>{briefing.sourceQuality.overall}</span>
          </div>
          <div className="space-y-2">
            {briefing.sourceQuality.sources?.map((s, i) => (
              <div key={i} className="grid grid-cols-1 sm:grid-cols-[160px_80px_1fr] gap-2 border-b border-slate-700/50 pb-2 last:border-0">
                {s.url ? (
                  <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 text-sm font-semibold">{s.source}</a>
                ) : (
                  <span className="text-white text-sm font-semibold">{s.source}</span>
                )}
                <span className={`text-xs uppercase font-bold ${qualityColor(s.rating)}`}>{s.rating}</span>
                <span className="text-slate-400 text-sm">{s.use}</span>
              </div>
            ))}
          </div>
          {briefing.sourceQuality.notes?.length > 0 && (
            <div className="mt-3 space-y-1">
              {briefing.sourceQuality.notes.map((note, i) => <div key={i} className="text-slate-400 text-sm">- {renderValue(note)}</div>)}
            </div>
          )}
        </section>
      )}

      {/* Disclaimer */}
      <p className="text-slate-600 text-xs text-center italic">
        {briefing.disclaimer || "This is informational only, not financial advice. Always do your own research before making investment decisions."}
      </p>
    </div>
  );
}

export default async function BriefingPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  await initDB();
  const params = await searchParams;
  const selectedDate = params.date;

  const briefings = await getAllBriefings();

  let briefingRow;
  if (selectedDate) {
    briefingRow = await getBriefingByDate(selectedDate);
  }
  if (!briefingRow) {
    briefingRow = await getLatestBriefing();
  }

  const briefing = briefingRow?.content_json as BriefingOutput | null;
  const currentDate = briefingRow?.date ? toDateKey(briefingRow.date) : null;

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Daily Briefings</h1>
          <p className="text-slate-400 mt-1">AI-generated market intelligence and portfolio analysis</p>
          {briefingRow && (
            <div className="mt-3 inline-flex items-center gap-3 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2">
              <span className="text-blue-400 font-semibold text-sm">
                {formatDate(briefingRow.date)}
              </span>
              <span className="text-slate-600">|</span>
              <span className="text-slate-500 text-xs">
                Generated {new Date(briefingRow.created_at).toLocaleString("en-US", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "America/Los_Angeles" })} PT
              </span>
            </div>
          )}
        </div>

        {briefing && currentDate ? (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Briefing list sidebar */}
            <div className="lg:col-span-1">
              <h3 className="text-slate-400 text-sm font-medium mb-3">Archive</h3>
              <div className="space-y-1">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {briefings.map((b: any, i: number) => {
                  const dateKey = toDateKey(b.date);
                  const isActive = dateKey === currentDate;
                  return (
                    <Link
                      key={i}
                      href={`/briefing?date=${dateKey}`}
                      className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                        isActive
                          ? "bg-blue-500/10 text-blue-400 border border-blue-400/30"
                          : "text-slate-400 hover:bg-slate-700/50 hover:text-slate-200"
                      }`}
                    >
                      {new Date(b.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" })}
                      {b.email_sent && <span className="text-green-400 text-xs ml-2">sent</span>}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Main briefing content */}
            <div className="lg:col-span-3">
              <BriefingView briefing={briefing} date={currentDate} />
            </div>
          </div>
        ) : (
          <div className="bg-slate-800 rounded-xl p-8 border border-slate-700 text-center">
            <h2 className="text-xl font-bold mb-2">No Briefings Yet</h2>
            <p className="text-slate-400">The first briefing will be generated on the next weekday at 9:30 AM ET, or trigger one manually via the cron endpoint.</p>
          </div>
        )}
      </div>
    </div>
  );
}
