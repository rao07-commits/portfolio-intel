import { initDB, getHoldings, getLatest13fByFund, get13fConsensus, type Sec13fHoldingRow } from "@/lib/db";
import { TRACKED_FUNDS } from "@/lib/13f/funds";

export const dynamic = "force-dynamic";

// Fallback when the holdings table is empty
const FALLBACK_USER_SYMBOLS = ["AMZN", "NVDA", "CRWD", "GOOG", "GOOGL", "APP", "ASTS", "HOOD", "EWY", "MU", "SPY", "GLD", "BTC"];

function changeBadge(changeType: string | null) {
  switch (changeType) {
    case "new":
      return <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-green-500/10 text-green-400">NEW</span>;
    case "added":
      return <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-green-500/10 text-green-400/70">ADDED</span>;
    case "trimmed":
      return <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-500/10 text-red-400/70">TRIMMED</span>;
    case "exited":
      return <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-500/10 text-red-400">EXITED</span>;
    default:
      return null;
  }
}

function fmtValue(v: number): string {
  if (v >= 1e9) return `$${(v / 1e9).toFixed(1)}B`;
  if (v >= 1e6) return `$${(v / 1e6).toFixed(0)}M`;
  return `$${(v / 1e3).toFixed(0)}K`;
}

export default async function SmartMoneyPage() {
  await initDB();

  const [holdings, consensus, ...fundHoldings] = await Promise.all([
    getHoldings(),
    get13fConsensus(),
    ...TRACKED_FUNDS.map((f) => getLatest13fByFund(f.cik, 15)),
  ]);

  const userSymbols = new Set(
    holdings.length > 0 ? holdings.map((h) => h.symbol.toUpperCase()) : FALLBACK_USER_SYMBOLS
  );
  // GOOG/GOOGL are interchangeable for overlap purposes
  if (userSymbols.has("GOOG")) userSymbols.add("GOOGL");

  const funds = TRACKED_FUNDS.map((f, i) => ({ fund: f, positions: fundHoldings[i] as Sec13fHoldingRow[] }));
  const hasData = funds.some((f) => f.positions.length > 0);

  const overlaps = funds
    .flatMap(({ fund, positions }) =>
      positions
        .filter((p) => p.ticker && p.shares > 0 && userSymbols.has(p.ticker.toUpperCase()))
        .map((p) => ({ fund: fund.name, ...p }))
    )
    .sort((a, b) => b.market_value - a.market_value);

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Smart Money — 13F Tracker</h1>
          <p className="text-slate-400 mt-1">
            Quarterly holdings of {TRACKED_FUNDS.length} tracked investors from SEC 13F filings.
            Filings lag quarter-end by up to 45 days; long-only US equity positions, no shorts.
          </p>
        </div>

        {!hasData && (
          <div className="bg-slate-800 rounded-xl p-8 border border-slate-700 text-center">
            <h2 className="text-xl font-bold mb-2">No 13F Data Yet</h2>
            <p className="text-slate-400">
              Run the sync to pull the latest filings: <code className="text-slate-300">GET /api/cron/13f-update</code> (with CRON_SECRET auth).
            </p>
          </div>
        )}

        {/* Overlap with your holdings */}
        {overlaps.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4">Held by You &amp; Smart Money</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {overlaps.map((o) => (
                <div key={`${o.fund}-${o.cusip}`} className="bg-slate-800 rounded-xl border border-slate-700 border-l-4 border-l-blue-500 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-white font-bold">{o.ticker}</span>
                    {changeBadge(o.change_type)}
                  </div>
                  <div className="text-slate-400 text-sm mt-1">{o.fund}</div>
                  <div className="text-slate-500 text-xs mt-1">
                    {fmtValue(o.market_value)} &middot; {Number(o.pct_of_portfolio).toFixed(1)}% of fund
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Consensus */}
        {consensus.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4">Consensus Positions (held by 2+ funds)</h2>
            <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700 text-slate-500 text-xs uppercase">
                    <th className="text-left px-4 py-2">Ticker</th>
                    <th className="text-left px-4 py-2">Issuer</th>
                    <th className="text-left px-4 py-2">Funds</th>
                    <th className="text-right px-4 py-2">Combined Value</th>
                  </tr>
                </thead>
                <tbody>
                  {consensus.map((c) => (
                    <tr key={String(c.ticker)} className="border-b border-slate-700/50">
                      <td className="px-4 py-2 font-bold text-white">
                        {String(c.ticker)}
                        {userSymbols.has(String(c.ticker).toUpperCase()) && (
                          <span className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400">YOU OWN</span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-slate-400">{String(c.issuer_name)}</td>
                      <td className="px-4 py-2 text-slate-400">{(c.funds as string[]).join(", ")}</td>
                      <td className="px-4 py-2 text-right text-slate-300 font-mono">{fmtValue(Number(c.combined_value))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Per-fund cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {funds.map(({ fund, positions }) => {
            const active = positions.filter((p) => p.shares > 0).slice(0, 10);
            const exited = positions.filter((p) => p.change_type === "exited");
            if (active.length === 0 && exited.length === 0) return null;
            const quarter = active[0]?.quarter_date || exited[0]?.quarter_date;

            return (
              <div key={fund.cik} className="bg-slate-800 rounded-xl border border-slate-700 p-5">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-white font-bold">{fund.name}</h3>
                    <div className="text-slate-500 text-xs">{fund.manager}</div>
                  </div>
                  <div className="text-slate-500 text-xs">
                    Q ending {quarter ? new Date(quarter).toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "UTC" }) : "—"}
                  </div>
                </div>
                <div className="space-y-1.5">
                  {active.map((p) => (
                    <div key={p.cusip} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-white font-semibold">{p.ticker || p.issuer_name.slice(0, 24)}</span>
                        {changeBadge(p.change_type)}
                        {p.ticker && userSymbols.has(p.ticker.toUpperCase()) && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400">YOU OWN</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs shrink-0">
                        <span className="text-slate-500 font-mono">{fmtValue(p.market_value)}</span>
                        <span className="text-slate-400 font-mono w-12 text-right">{Number(p.pct_of_portfolio).toFixed(1)}%</span>
                      </div>
                    </div>
                  ))}
                  {exited.length > 0 && (
                    <div className="pt-2 mt-2 border-t border-slate-700/50 text-xs text-slate-500">
                      Exited: {exited.map((p) => p.ticker || p.issuer_name.slice(0, 20)).join(", ")}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-slate-600 text-xs mt-8 italic">
          Source: SEC EDGAR 13F-HR filings. Informational only, not financial advice. 13Fs exclude
          shorts, options context, and non-US-listed positions, and are up to 45 days stale.
        </p>
      </div>
    </div>
  );
}
