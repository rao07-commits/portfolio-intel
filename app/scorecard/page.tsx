import { initDB } from "@/lib/db";
import { sql } from "@vercel/postgres";

export const dynamic = "force-dynamic";

interface SignalRow {
  id: number;
  symbol: string;
  action: string;
  reason: string;
  confidence: string;
  source: string;
  entry_range: string | null;
  target_price: string | null;
  stop_loss: string | null;
  timeframe: string | null;
  generated_at: string;
  executed: boolean;
}

function parsePrice(s: string | null): number | null {
  if (!s) return null;
  const match = s.match(/\$?([\d,.]+)/);
  return match ? parseFloat(match[1].replace(",", "")) : null;
}

function signalColor(action: string): string {
  const a = action.toLowerCase();
  if (a.includes("buy") || a.includes("add") || a.includes("initiate")) return "text-green-400";
  if (a.includes("sell") || a.includes("trim") || a.includes("reduce")) return "text-red-400";
  return "text-yellow-400";
}

async function getLatestPrice(symbol: string): Promise<number | null> {
  try {
    const result = await sql`
      SELECT close FROM market_data WHERE symbol = ${symbol} ORDER BY date DESC LIMIT 1
    `;
    return result.rows[0]?.close || null;
  } catch {
    return null;
  }
}

async function getAllSignals(): Promise<SignalRow[]> {
  const result = await sql`
    SELECT * FROM trade_signals ORDER BY generated_at DESC LIMIT 100
  `;
  return result.rows as unknown as SignalRow[];
}

export default async function ScorecardPage() {
  await initDB();
  const signals = await getAllSignals();

  // Enrich with current prices
  const enriched = await Promise.all(
    signals.map(async (s) => {
      const currentPrice = await getLatestPrice(s.symbol);
      const entryPrice = parsePrice(s.entry_range);
      const targetPrice = parsePrice(s.target_price);
      const stopPrice = parsePrice(s.stop_loss);
      const isBuy = s.action.toLowerCase().includes("buy") || s.action.toLowerCase().includes("add") || s.action.toLowerCase().includes("initiate");

      let status = "WATCHING";
      let pnl: number | null = null;

      if (currentPrice && entryPrice) {
        if (isBuy) {
          if (targetPrice && currentPrice >= targetPrice) {
            status = "TARGET HIT";
            pnl = ((targetPrice - entryPrice) / entryPrice) * 100;
          } else if (stopPrice && currentPrice <= stopPrice) {
            status = "STOPPED OUT";
            pnl = ((stopPrice - entryPrice) / entryPrice) * 100;
          } else if (currentPrice >= entryPrice) {
            status = "IN PROFIT";
            pnl = ((currentPrice - entryPrice) / entryPrice) * 100;
          } else {
            status = "UNDERWATER";
            pnl = ((currentPrice - entryPrice) / entryPrice) * 100;
          }
        } else {
          // Trim/sell signal — inverse logic
          if (currentPrice <= entryPrice) {
            status = "CORRECT";
            pnl = ((entryPrice - currentPrice) / entryPrice) * 100;
          } else {
            status = "WRONG";
            pnl = ((entryPrice - currentPrice) / entryPrice) * 100;
          }
        }
      }

      return { ...s, currentPrice, entryPrice, targetPrice, stopPrice, status, pnl, isBuy };
    })
  );

  // Stats
  const totalSignals = enriched.length;
  const withPnl = enriched.filter(s => s.pnl !== null);
  const winners = withPnl.filter(s => (s.pnl || 0) > 0);
  const winRate = withPnl.length > 0 ? (winners.length / withPnl.length * 100) : 0;
  const avgPnl = withPnl.length > 0 ? withPnl.reduce((sum, s) => sum + (s.pnl || 0), 0) / withPnl.length : 0;
  const targetHits = enriched.filter(s => s.status === "TARGET HIT").length;

  // Group by date
  const byDate = new Map<string, typeof enriched>();
  for (const s of enriched) {
    const date = new Date(s.generated_at).toISOString().split("T")[0];
    if (!byDate.has(date)) byDate.set(date, []);
    byDate.get(date)!.push(s);
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Signal Scorecard</h1>
          <p className="text-slate-400 mt-1">Track the hit rate of every trade signal the AI generates</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
          <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
            <div className="text-slate-500 text-xs uppercase">Total Signals</div>
            <div className="text-white text-2xl font-bold">{totalSignals}</div>
          </div>
          <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
            <div className="text-slate-500 text-xs uppercase">Win Rate</div>
            <div className={`text-2xl font-bold ${winRate > 50 ? "text-green-400" : "text-red-400"}`}>{winRate.toFixed(0)}%</div>
          </div>
          <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
            <div className="text-slate-500 text-xs uppercase">Avg P&L</div>
            <div className={`text-2xl font-bold ${avgPnl > 0 ? "text-green-400" : "text-red-400"}`}>{avgPnl > 0 ? "+" : ""}{avgPnl.toFixed(1)}%</div>
          </div>
          <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
            <div className="text-slate-500 text-xs uppercase">Targets Hit</div>
            <div className="text-green-400 text-2xl font-bold">{targetHits}</div>
          </div>
          <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
            <div className="text-slate-500 text-xs uppercase">Stopped Out</div>
            <div className="text-red-400 text-2xl font-bold">{enriched.filter(s => s.status === "STOPPED OUT").length}</div>
          </div>
        </div>

        {/* Signals by Date */}
        {Array.from(byDate.entries()).map(([date, signals]) => (
          <div key={date} className="mb-6">
            <h2 className="text-lg font-bold mb-3 text-slate-300">
              {new Date(date).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric", timeZone: "UTC" })}
            </h2>
            <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-3 px-4 text-slate-500 text-xs uppercase">Signal</th>
                    <th className="text-right py-3 px-2 text-slate-500 text-xs uppercase">Entry</th>
                    <th className="text-right py-3 px-2 text-slate-500 text-xs uppercase">Current</th>
                    <th className="text-right py-3 px-2 text-slate-500 text-xs uppercase">Target</th>
                    <th className="text-right py-3 px-2 text-slate-500 text-xs uppercase">Stop</th>
                    <th className="text-right py-3 px-2 text-slate-500 text-xs uppercase">P&L</th>
                    <th className="text-center py-3 px-2 text-slate-500 text-xs uppercase">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {signals.map((s) => (
                    <tr key={s.id} className="border-b border-slate-700/50 hover:bg-slate-700/20">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className={`font-bold ${signalColor(s.action)}`}>{s.symbol}</span>
                          <span className="text-slate-500 text-xs">{s.action}</span>
                        </div>
                        <p className="text-slate-600 text-xs mt-1 max-w-md truncate">{s.reason?.slice(0, 80)}</p>
                      </td>
                      <td className="py-3 px-2 text-right text-slate-400 font-mono text-xs">
                        {s.entryPrice ? `$${s.entryPrice.toFixed(0)}` : "—"}
                      </td>
                      <td className="py-3 px-2 text-right text-white font-mono text-xs">
                        {s.currentPrice ? `$${s.currentPrice.toFixed(0)}` : "—"}
                      </td>
                      <td className="py-3 px-2 text-right text-green-400/70 font-mono text-xs">
                        {s.targetPrice ? `$${s.targetPrice.toFixed(0)}` : "—"}
                      </td>
                      <td className="py-3 px-2 text-right text-red-400/70 font-mono text-xs">
                        {s.stopPrice ? `$${s.stopPrice.toFixed(0)}` : "—"}
                      </td>
                      <td className={`py-3 px-2 text-right font-mono text-xs font-bold ${
                        (s.pnl || 0) > 0 ? "text-green-400" : (s.pnl || 0) < 0 ? "text-red-400" : "text-slate-500"
                      }`}>
                        {s.pnl !== null ? `${s.pnl > 0 ? "+" : ""}${s.pnl.toFixed(1)}%` : "—"}
                      </td>
                      <td className="py-3 px-2 text-center">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                          s.status === "TARGET HIT" ? "bg-green-500/10 text-green-400" :
                          s.status === "IN PROFIT" ? "bg-green-500/10 text-green-400/70" :
                          s.status === "CORRECT" ? "bg-green-500/10 text-green-400" :
                          s.status === "STOPPED OUT" ? "bg-red-500/10 text-red-400" :
                          s.status === "UNDERWATER" ? "bg-red-500/10 text-red-400/70" :
                          s.status === "WRONG" ? "bg-red-500/10 text-red-400" :
                          "bg-slate-500/10 text-slate-400"
                        }`}>
                          {s.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}

        {totalSignals === 0 && (
          <div className="bg-slate-800 rounded-xl p-8 border border-slate-700 text-center">
            <h2 className="text-xl font-bold mb-2">No Signals Yet</h2>
            <p className="text-slate-400">Trade signals will appear here after the daily briefing runs.</p>
          </div>
        )}
      </div>
    </div>
  );
}
