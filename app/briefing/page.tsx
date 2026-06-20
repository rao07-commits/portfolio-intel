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

function BriefingView({ briefing, date }: { briefing: BriefingOutput; date: string }) {
  return (
    <div className="space-y-6">
      <div className="border-b border-slate-700 pb-4">
        <h2 className="text-2xl font-bold text-white">{formatDate(date)}</h2>
        <p className="text-slate-500 text-sm mt-1">Daily Market Briefing</p>
      </div>

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
                  <span className="ml-auto text-slate-500 text-xs">{s.confidence} confidence</span>
                </div>
                {(s.signalScore !== undefined || s.signalType || s.currentPrice !== undefined || s.priceChange1d !== undefined || s.priceChange5d !== undefined || s.dataQuality) && (
                  <div className="flex gap-2 flex-wrap text-xs text-slate-500 mb-2">
                    {s.signalScore !== undefined && s.signalScore !== null && <span>Score {Number(s.signalScore).toFixed(0)}</span>}
                    {s.signalType && <span>{s.signalType}</span>}
                    {s.currentPrice !== undefined && s.currentPrice !== null && <span>${Number(s.currentPrice).toFixed(2)}</span>}
                    {s.priceChange1d !== undefined && s.priceChange1d !== null && <span>1D {formatPct(s.priceChange1d)}</span>}
                    {s.priceChange5d !== undefined && s.priceChange5d !== null && <span>5D {formatPct(s.priceChange5d)}</span>}
                    {s.dataQuality && <span>Data: {s.dataQuality}</span>}
                  </div>
                )}
                {s.triggerReason && <p className="text-slate-300 text-sm mb-2"><span className="text-slate-500">Trigger:</span> {s.triggerReason}</p>}
                <p className="text-slate-400 text-sm mb-2">{s.reason}</p>
                {s.riskNotes && <p className="text-slate-500 text-sm mb-2"><span className="text-slate-400">Risk:</span> {s.riskNotes}</p>}
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {(s as Record<string, any>).marketMispricing && (
                  <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-3 mb-2">
                    <span className="text-amber-400 text-xs font-bold uppercase">Why the market has it wrong: </span>
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    <span className="text-slate-300 text-sm">{(s as Record<string, any>).marketMispricing}</span>
                  </div>
                )}
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
