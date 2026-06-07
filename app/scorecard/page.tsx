import { initDB } from "@/lib/db";
import { getOpenSignalsWithPrices, computeScorecardStats, type EnrichedSignal } from "@/lib/scorecard";

export const dynamic = "force-dynamic";

export default async function ScorecardPage() {
  await initDB();
  const enriched = await getOpenSignalsWithPrices();

  // Group by theme
  const themes = new Map<string, EnrichedSignal[]>();
  for (const s of enriched) {
    if (!themes.has(s.theme)) themes.set(s.theme, []);
    themes.get(s.theme)!.push(s);
  }

  // Stats
  const { winRate, avgPnl } = computeScorecardStats(enriched);

  // Theme order
  const themeOrder = ["AI Semiconductor Cycle", "AI Infrastructure / Power", "AI Software / Enterprise", "IPO Positioning", "Divestiture / Trim", "Other / Macro"];

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Thematic Watchlist</h1>
          <p className="text-slate-400 mt-1">Medium-term secular themes and position tracking — not day trades</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
            <div className="text-slate-500 text-xs uppercase">Active Themes</div>
            <div className="text-white text-2xl font-bold">{themes.size}</div>
          </div>
          <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
            <div className="text-slate-500 text-xs uppercase">Names Tracked</div>
            <div className="text-white text-2xl font-bold">{enriched.length}</div>
          </div>
          <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
            <div className="text-slate-500 text-xs uppercase">Win Rate</div>
            <div className={`text-2xl font-bold ${winRate > 50 ? "text-green-400" : winRate > 0 ? "text-yellow-400" : "text-slate-500"}`}>{winRate.toFixed(0)}%</div>
          </div>
          <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
            <div className="text-slate-500 text-xs uppercase">Avg Return</div>
            <div className={`text-2xl font-bold ${avgPnl > 0 ? "text-green-400" : avgPnl < 0 ? "text-red-400" : "text-slate-500"}`}>{avgPnl > 0 ? "+" : ""}{avgPnl.toFixed(1)}%</div>
          </div>
        </div>

        {/* Themes */}
        {themeOrder.map(themeName => {
          const themeSignals = themes.get(themeName);
          if (!themeSignals || themeSignals.length === 0) return null;

          const themeColors: Record<string, string> = {
            "AI Semiconductor Cycle": "border-l-blue-500",
            "AI Infrastructure / Power": "border-l-amber-500",
            "AI Software / Enterprise": "border-l-purple-500",
            "IPO Positioning": "border-l-cyan-500",
            "Divestiture / Trim": "border-l-red-500",
            "Other / Macro": "border-l-slate-500",
          };

          return (
            <div key={themeName} className="mb-8">
              <h2 className="text-xl font-bold mb-4">{themeName}</h2>
              <div className="space-y-3">
                {themeSignals.map((s) => (
                  <div key={s.id} className={`bg-slate-800 rounded-xl border border-slate-700 border-l-4 ${themeColors[themeName] || "border-l-slate-500"} p-5`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className="text-white text-lg font-bold">{s.symbol}</span>
                        <span className={`text-xs font-bold uppercase ${
                          s.isBuy ? "text-green-400" : "text-red-400"
                        }`}>{s.action.slice(0, 30)}</span>
                        <span className="text-slate-600 text-xs">{s.confidence}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        {s.timeframe && (
                          <span className="text-slate-500 text-xs bg-slate-700/50 px-2 py-1 rounded">{s.timeframe}</span>
                        )}
                        <span className={`text-xs font-bold px-2 py-1 rounded ${
                          s.status === "TARGET HIT" ? "bg-green-500/10 text-green-400" :
                          s.status === "IN PROFIT" || s.status === "CORRECT" ? "bg-green-500/10 text-green-400/70" :
                          s.status === "STOPPED OUT" || s.status === "WRONG" ? "bg-red-500/10 text-red-400" :
                          s.status === "UNDERWATER" ? "bg-red-500/10 text-red-400/70" :
                          "bg-slate-500/10 text-slate-400"
                        }`}>
                          {s.status}
                        </span>
                      </div>
                    </div>

                    {/* Price row */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-3">
                      <div className="bg-slate-700/30 rounded px-3 py-1.5">
                        <span className="text-slate-500 text-[10px] uppercase">Entry</span>
                        <div className="text-slate-300 text-sm font-mono">{s.entryPrice ? `$${s.entryPrice.toFixed(0)}` : "—"}</div>
                      </div>
                      <div className="bg-slate-700/30 rounded px-3 py-1.5">
                        <span className="text-slate-500 text-[10px] uppercase">Current</span>
                        <div className="text-white text-sm font-mono font-bold">{s.currentPrice ? `$${s.currentPrice.toFixed(0)}` : "—"}</div>
                      </div>
                      <div className="bg-slate-700/30 rounded px-3 py-1.5">
                        <span className="text-slate-500 text-[10px] uppercase">Target</span>
                        <div className="text-green-400/70 text-sm font-mono">{s.targetPrice ? `$${s.targetPrice.toFixed(0)}` : "—"}</div>
                      </div>
                      <div className="bg-slate-700/30 rounded px-3 py-1.5">
                        <span className="text-slate-500 text-[10px] uppercase">Stop</span>
                        <div className="text-red-400/70 text-sm font-mono">{s.stopPrice ? `$${s.stopPrice.toFixed(0)}` : "—"}</div>
                      </div>
                      <div className="bg-slate-700/30 rounded px-3 py-1.5">
                        <span className="text-slate-500 text-[10px] uppercase">P&L</span>
                        <div className={`text-sm font-mono font-bold ${
                          (s.pnl || 0) > 0 ? "text-green-400" : (s.pnl || 0) < 0 ? "text-red-400" : "text-slate-500"
                        }`}>{s.pnl !== null ? `${s.pnl > 0 ? "+" : ""}${s.pnl.toFixed(1)}%` : "—"}</div>
                      </div>
                    </div>

                    {/* Full Thesis */}
                    <p className="text-slate-400 text-sm leading-relaxed">{s.reason}</p>

                    <div className="flex items-center gap-3 mt-2 text-xs text-slate-600">
                      <span>Added {s.daysAgo}d ago</span>
                      <span>|</span>
                      <span>{new Date(s.generated_at).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {enriched.length === 0 && (
          <div className="bg-slate-800 rounded-xl p-8 border border-slate-700 text-center">
            <h2 className="text-xl font-bold mb-2">No Signals Yet</h2>
            <p className="text-slate-400">Trade signals will appear here after the daily briefing runs. Signals are grouped by secular theme, not by date.</p>
          </div>
        )}
      </div>
    </div>
  );
}
