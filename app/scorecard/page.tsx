import { initDB } from "@/lib/db";
import { sql } from "@vercel/postgres";

export const dynamic = "force-dynamic";

interface SignalRow {
  id: number;
  symbol: string;
  action: string;
  reason: string;
  confidence: string;
  entry_range: string | null;
  target_price: string | null;
  stop_loss: string | null;
  timeframe: string | null;
  generated_at: string;
}

function parsePrice(s: string | null): number | null {
  if (!s) return null;
  const match = s.match(/\$?([\d,.]+)/);
  return match ? parseFloat(match[1].replace(",", "")) : null;
}

async function getLatestPrice(symbol: string): Promise<number | null> {
  try {
    const result = await sql`SELECT close FROM market_data WHERE symbol = ${symbol} ORDER BY date DESC LIMIT 1`;
    return result.rows[0]?.close || null;
  } catch {
    return null;
  }
}

// Deduplicate signals — keep the most recent signal per symbol
async function getUniqueSignals(): Promise<SignalRow[]> {
  const result = await sql`
    SELECT DISTINCT ON (symbol) * FROM trade_signals
    ORDER BY symbol, generated_at DESC
  `;
  return result.rows as unknown as SignalRow[];
}

// Group signals into thematic buckets
function categorizeTheme(symbol: string, action: string, reason: string): string {
  const text = (action + " " + reason).toLowerCase();
  if (text.includes("trim") || text.includes("reduce") || text.includes("sell")) return "Divestiture / Trim";
  if (text.includes("semis") || text.includes("chip") || text.includes("hbm") || text.includes("gpu") || ["NVDA", "MU", "AVGO", "MRVL", "ANET", "AMAT", "SMH", "SOXX", "TSM", "AMD"].includes(symbol)) return "AI Semiconductor Cycle";
  if (text.includes("infrastructure") || text.includes("cooling") || text.includes("power") || text.includes("data center") || ["VRT", "CEG", "VST", "EQIX"].includes(symbol)) return "AI Infrastructure / Power";
  if (text.includes("software") || text.includes("enterprise") || text.includes("saas") || ["PLTR", "SNOW", "DDOG", "NET", "CRWD"].includes(symbol)) return "AI Software / Enterprise";
  if (text.includes("ipo") || text.includes("spacex")) return "IPO Positioning";
  return "Other / Macro";
}

export default async function ScorecardPage() {
  await initDB();
  const signals = await getUniqueSignals();

  const enriched = await Promise.all(
    signals.map(async (s) => {
      const currentPrice = await getLatestPrice(s.symbol);
      const entryPrice = parsePrice(s.entry_range);
      const targetPrice = parsePrice(s.target_price);
      const stopPrice = parsePrice(s.stop_loss);
      const isBuy = !(s.action.toLowerCase().includes("trim") || s.action.toLowerCase().includes("sell") || s.action.toLowerCase().includes("reduce"));
      const theme = categorizeTheme(s.symbol, s.action, s.reason);

      let status = "WATCHING";
      let pnl: number | null = null;

      if (currentPrice && entryPrice) {
        if (isBuy) {
          if (targetPrice && currentPrice >= targetPrice) { status = "TARGET HIT"; pnl = ((targetPrice - entryPrice) / entryPrice) * 100; }
          else if (stopPrice && currentPrice <= stopPrice) { status = "STOPPED OUT"; pnl = ((stopPrice - entryPrice) / entryPrice) * 100; }
          else if (currentPrice >= entryPrice) { status = "IN PROFIT"; pnl = ((currentPrice - entryPrice) / entryPrice) * 100; }
          else { status = "UNDERWATER"; pnl = ((currentPrice - entryPrice) / entryPrice) * 100; }
        } else {
          if (currentPrice <= entryPrice) { status = "CORRECT"; pnl = ((entryPrice - currentPrice) / entryPrice) * 100; }
          else { status = "WRONG"; pnl = ((entryPrice - currentPrice) / entryPrice) * 100; }
        }
      }

      const daysAgo = Math.floor((Date.now() - new Date(s.generated_at).getTime()) / (1000 * 60 * 60 * 24));

      return { ...s, currentPrice, entryPrice, targetPrice, stopPrice, status, pnl, isBuy, theme, daysAgo };
    })
  );

  // Group by theme
  const themes = new Map<string, typeof enriched>();
  for (const s of enriched) {
    if (!themes.has(s.theme)) themes.set(s.theme, []);
    themes.get(s.theme)!.push(s);
  }

  // Stats
  const withPnl = enriched.filter(s => s.pnl !== null);
  const winners = withPnl.filter(s => (s.pnl || 0) > 0);
  const winRate = withPnl.length > 0 ? (winners.length / withPnl.length * 100) : 0;
  const avgPnl = withPnl.length > 0 ? withPnl.reduce((sum, s) => sum + (s.pnl || 0), 0) / withPnl.length : 0;

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

                    {/* Thesis */}
                    <p className="text-slate-400 text-sm leading-relaxed">{s.reason?.slice(0, 250)}{(s.reason?.length || 0) > 250 ? "..." : ""}</p>

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
