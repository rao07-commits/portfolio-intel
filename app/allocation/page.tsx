import AllocationMap from "../components/AllocationMap";
import { initDB, getHoldings, getLatestPrices, getLatestMacro, getLatestBriefing } from "@/lib/db";
import { computePortfolio, computeSectorExposure } from "@/lib/portfolio";
import { computeConcentration, generateRebalanceRecommendations, interpretMacroData, TARGET_ALLOCATION } from "@/lib/allocation";
import { FRED_SERIES, type FredSeriesId } from "@/lib/apis/fred";
import { getMacroSeries } from "@/lib/db";
import type { BriefingOutput } from "@/lib/agent/briefing-agent";

export const dynamic = "force-dynamic";

function riskBadge(level: string) {
  const colors: Record<string, string> = {
    low: "bg-green-500/10 text-green-400 border-green-400/30",
    moderate: "bg-yellow-500/10 text-yellow-400 border-yellow-400/30",
    high: "bg-orange-500/10 text-orange-400 border-orange-400/30",
    extreme: "bg-red-500/10 text-red-400 border-red-400/30",
  };
  return colors[level] || colors.moderate;
}

function urgencyColor(urgency: string) {
  if (urgency === "high") return "border-l-red-400";
  if (urgency === "medium") return "border-l-yellow-400";
  return "border-l-slate-500";
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
    if (obj.to) parts.push(`Shift to ${obj.to}`);
    if (obj.from) parts.push(`from ${obj.from}`);
    if (parts.length > 0) return parts.join(" — ");
    return Object.entries(obj)
      .filter(([, val]) => val !== null && val !== undefined)
      .map(([key, val]) => `${key}: ${val}`)
      .join(". ");
  }
  return String(v);
}

export default async function AllocationPage() {
  await initDB();

  const [holdings, priceRows, latestBriefingRow] = await Promise.all([
    getHoldings(),
    getLatestPrices(),
    getLatestBriefing(),
  ]);

  // Build macro data for rotation signals
  const macroData: Record<string, { date: string; value: number }[]> = {};
  for (const seriesId of Object.keys(FRED_SERIES) as FredSeriesId[]) {
    const rows = await getMacroSeries(seriesId, 10);
    macroData[seriesId] = rows.map((r) => ({ date: String(r.date), value: Number(r.value) }));
  }

  const prices: Record<string, number> = {};
  for (const row of priceRows) {
    prices[row.symbol] = row.close;
  }

  const portfolio = computePortfolio(holdings, prices);
  const sectors = computeSectorExposure(portfolio);
  const concentration = computeConcentration(portfolio);
  const macroSignals = interpretMacroData(macroData);
  const recommendations = generateRebalanceRecommendations(portfolio, macroSignals);
  const briefing = latestBriefingRow?.content_json as BriefingOutput | null;
  const latestMacro = await getLatestMacro();

  // Build macro map for display
  const macroMap: Record<string, number> = {};
  for (const row of latestMacro) {
    macroMap[row.series_id] = Number(row.value);
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Asset Allocation</h1>
          <p className="text-slate-400 mt-1">Portfolio strategy, macro context, and rebalancing recommendations</p>
        </div>

        {/* Macro Environment Summary */}
        <div className="mb-6 bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h2 className="text-lg font-semibold text-white mb-4">Macro Environment</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { label: "Fed Funds", value: macroMap["FEDFUNDS"], unit: "%", signal: macroSignals.fedFundsDirection === "falling" ? "green" : macroSignals.fedFundsDirection === "rising" ? "red" : "slate" },
              { label: "CPI", value: macroMap["CPIAUCSL"], unit: "", signal: macroSignals.cpiFalling ? "green" : "red" },
              { label: "Unemployment", value: macroMap["UNRATE"], unit: "%", signal: macroSignals.unemploymentRising ? "red" : "green" },
              { label: "Yield Curve", value: macroMap["T10Y2Y"], unit: "%", signal: macroSignals.yieldCurveSteepening ? "green" : "red" },
              { label: "Sentiment", value: macroMap["UMCSENT"], unit: "", signal: macroSignals.consumerSentimentFalling ? "red" : "green" },
            ].map((m, i) => (
              <div key={i} className="bg-slate-700/50 rounded-lg p-3">
                <div className="text-slate-500 text-xs uppercase">{m.label}</div>
                <div className={`text-xl font-bold ${m.signal === "green" ? "text-green-400" : m.signal === "red" ? "text-red-400" : "text-slate-300"}`}>
                  {m.value?.toFixed(1) || "—"}{m.unit}
                </div>
              </div>
            ))}
          </div>

          {/* Macro interpretation */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div>
              <h3 className="text-green-400 font-semibold text-xs uppercase mb-2">Favorable</h3>
              {macroSignals.cpiFalling && <p className="text-slate-300">CPI declining — supports rate cuts, favors growth/tech</p>}
              {macroSignals.yieldCurveSteepening && <p className="text-slate-300">Yield curve steepening — positive for financials and cyclicals</p>}
              {macroSignals.fedFundsDirection === "falling" && <p className="text-slate-300">Fed easing — tailwind for equities</p>}
              {!macroSignals.cpiFalling && !macroSignals.yieldCurveSteepening && macroSignals.fedFundsDirection !== "falling" && (
                <p className="text-slate-500 italic">No strong bullish macro signals currently</p>
              )}
            </div>
            <div>
              <h3 className="text-red-400 font-semibold text-xs uppercase mb-2">Risk Signals</h3>
              {macroSignals.consumerSentimentFalling && <p className="text-slate-300">Consumer sentiment falling — reduce consumer discretionary</p>}
              {macroSignals.unemploymentRising && <p className="text-slate-300">Unemployment rising — early slowdown warning</p>}
              {macroSignals.inflationAboveTarget && <p className="text-slate-300">Inflation above 2.5% target — limits Fed cuts</p>}
              {!macroSignals.consumerSentimentFalling && !macroSignals.unemploymentRising && !macroSignals.inflationAboveTarget && (
                <p className="text-slate-500 italic">No major risk signals</p>
              )}
            </div>
          </div>
        </div>

        {/* AI-Generated Allocation Strategy from latest briefing */}
        {briefing?.allocationRecommendations && (
          <div className="mb-6 bg-gradient-to-br from-slate-800 to-slate-800/50 rounded-xl p-6 border border-blue-500/20">
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-lg font-semibold text-white">AI Allocation Strategy</h2>
              <span className="text-xs text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded">Latest Briefing</span>
            </div>
            <div className="space-y-4">
              {briefing.allocationRecommendations.amznTrim && (
                <div className="border-l-4 border-l-red-400 bg-slate-700/30 rounded-r-lg p-4">
                  <span className="text-red-400 text-xs font-bold uppercase">AMZN Divestiture</span>
                  <p className="text-slate-300 text-sm mt-1">{renderValue(briefing.allocationRecommendations.amznTrim)}</p>
                </div>
              )}
              {briefing.allocationRecommendations.semisAction && (
                <div className="border-l-4 border-l-blue-400 bg-slate-700/30 rounded-r-lg p-4">
                  <span className="text-blue-400 text-xs font-bold uppercase">AI / Semis Strategy</span>
                  <p className="text-slate-300 text-sm mt-1">{renderValue(briefing.allocationRecommendations.semisAction)}</p>
                </div>
              )}
              {briefing.allocationRecommendations.cashDeployment && (
                <div className="border-l-4 border-l-green-400 bg-slate-700/30 rounded-r-lg p-4">
                  <span className="text-green-400 text-xs font-bold uppercase">Cash Deployment Plan</span>
                  <p className="text-slate-300 text-sm mt-1">{renderValue(briefing.allocationRecommendations.cashDeployment)}</p>
                </div>
              )}
              {briefing.allocationRecommendations.sectorShifts?.length > 0 && (
                <div className="border-l-4 border-l-purple-400 bg-slate-700/30 rounded-r-lg p-4">
                  <span className="text-purple-400 text-xs font-bold uppercase">Sector Rotation</span>
                  <div className="mt-2 space-y-2">
                    {briefing.allocationRecommendations.sectorShifts.map((s, i) => (
                      <p key={i} className="text-slate-300 text-sm">{renderValue(s)}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sector Rotation from briefing */}
            {briefing.sectorRotation && (briefing.sectorRotation.bullish?.length > 0 || briefing.sectorRotation.bearish?.length > 0) && (
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-4">
                  <h3 className="text-green-400 font-semibold text-sm mb-2">Bullish Sectors</h3>
                  {briefing.sectorRotation.bullish?.map((s, i) => (
                    <p key={i} className="text-slate-300 text-sm mb-1">+ {s}</p>
                  ))}
                </div>
                <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-4">
                  <h3 className="text-red-400 font-semibold text-sm mb-2">Bearish Sectors</h3>
                  {briefing.sectorRotation.bearish?.map((s, i) => (
                    <p key={i} className="text-slate-300 text-sm mb-1">- {s}</p>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Target vs Current Allocation Table */}
        <div className="mb-6 bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h2 className="text-lg font-semibold text-white mb-4">Target vs Current Allocation</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-2 text-slate-500 text-xs uppercase">Sector</th>
                  <th className="text-right py-2 text-slate-500 text-xs uppercase">Current</th>
                  <th className="text-right py-2 text-slate-500 text-xs uppercase">Target</th>
                  <th className="text-right py-2 text-slate-500 text-xs uppercase">Diff</th>
                  <th className="text-left py-2 pl-4 text-slate-500 text-xs uppercase">Action</th>
                </tr>
              </thead>
              <tbody>
                {sectors.map((s) => {
                  const target = TARGET_ALLOCATION[s.sector] || 0;
                  const diff = s.weight - target;
                  const isOver = diff > 3;
                  const isUnder = diff < -3;
                  return (
                    <tr key={s.sector} className="border-b border-slate-700/50">
                      <td className="py-3">
                        <span className="text-slate-300">{s.label}</span>
                        <span className="text-slate-600 text-xs ml-2">{s.holdings.join(", ")}</span>
                      </td>
                      <td className="py-3 text-right text-slate-300 font-mono">{s.weight.toFixed(1)}%</td>
                      <td className="py-3 text-right text-slate-500 font-mono">{target}%</td>
                      <td className={`py-3 text-right font-mono font-semibold ${isOver ? "text-red-400" : isUnder ? "text-yellow-400" : "text-green-400"}`}>
                        {diff > 0 ? "+" : ""}{diff.toFixed(1)}%
                      </td>
                      <td className="py-3 pl-4">
                        {isOver && <span className="text-red-400 text-xs font-semibold">TRIM</span>}
                        {isUnder && <span className="text-yellow-400 text-xs font-semibold">ADD</span>}
                        {!isOver && !isUnder && <span className="text-green-400 text-xs">OK</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Concentration Risk */}
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-slate-400 text-sm font-medium">Concentration Risk</h2>
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${riskBadge(concentration.riskLevel)}`}>
                {concentration.riskLevel}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-slate-700/50 rounded-lg p-3">
                <div className="text-slate-500 text-xs uppercase">HHI Index</div>
                <div className="text-white text-2xl font-bold">{concentration.hhi.toFixed(0)}</div>
                <div className="text-slate-500 text-xs">0-10000 scale</div>
              </div>
              {concentration.topPosition && (
                <div className="bg-slate-700/50 rounded-lg p-3">
                  <div className="text-slate-500 text-xs uppercase">Top Position</div>
                  <div className="text-white text-2xl font-bold">{concentration.topPosition.symbol}</div>
                  <div className="text-slate-500 text-xs">{concentration.topPosition.weight.toFixed(1)}% of portfolio</div>
                </div>
              )}
            </div>
            {concentration.flags.length > 0 && (
              <div className="space-y-2">
                {concentration.flags.map((flag, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <span className="text-yellow-400 mt-0.5">!</span>
                    <span className="text-slate-300">{flag}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sector Allocation Visual */}
          <AllocationMap sectors={sectors} />
        </div>

        {/* Rebalancing Recommendations */}
        <div className="mt-6 bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h2 className="text-slate-400 text-sm font-medium mb-4">System Rebalancing Actions</h2>
          <div className="space-y-3">
            {recommendations.map((action, i) => (
              <div key={i} className={`border-l-4 ${urgencyColor(action.urgency)} bg-slate-700/30 rounded-r-lg p-4`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold uppercase text-slate-500">{action.type}</span>
                  {action.symbol && <span className="text-white font-semibold">{action.symbol}</span>}
                  {action.sector && <span className="text-slate-400 text-sm">{action.sector}</span>}
                  <span className={`ml-auto text-xs font-medium ${
                    action.urgency === "high" ? "text-red-400" : action.urgency === "medium" ? "text-yellow-400" : "text-slate-500"
                  }`}>
                    {action.urgency} priority
                  </span>
                </div>
                <p className="text-slate-300 text-sm">{action.reason}</p>
                {action.suggestedPct && (
                  <p className="text-slate-500 text-xs mt-1">Suggested: {action.suggestedPct.toFixed(1)}% of portfolio</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
