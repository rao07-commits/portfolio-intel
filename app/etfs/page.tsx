import { ETF_DATA, CATEGORY_LABELS, CATEGORIES } from "@/lib/etf-data";

function returnColor(val: number | null): string {
  if (val === null) return "text-slate-500";
  if (val > 10) return "text-green-400";
  if (val > 0) return "text-green-400/70";
  if (val > -5) return "text-red-400/70";
  return "text-red-400";
}

function peColor(pe: number | null): string {
  if (pe === null) return "text-slate-500";
  if (pe < 12) return "text-green-400";
  if (pe < 18) return "text-green-400/70";
  if (pe < 25) return "text-slate-300";
  if (pe < 35) return "text-yellow-400";
  return "text-red-400";
}

function expenseColor(er: number): string {
  if (er <= 0.10) return "text-green-400";
  if (er <= 0.35) return "text-slate-300";
  if (er <= 0.60) return "text-yellow-400";
  return "text-red-400";
}

function formatReturn(val: number | null): string {
  if (val === null) return "—";
  return `${val > 0 ? "+" : ""}${val.toFixed(1)}%`;
}

export default function ETFsPage() {
  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Index & Country ETFs</h1>
          <p className="text-slate-400 mt-1">Expense ratios, valuations, and multi-year performance across global markets</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
            <div className="text-slate-500 text-xs uppercase">Cheapest ETF</div>
            <div className="text-white text-lg font-bold">VOO / VTI</div>
            <div className="text-green-400 text-sm">0.03% expense</div>
          </div>
          <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
            <div className="text-slate-500 text-xs uppercase">Best 5Y Return</div>
            <div className="text-white text-lg font-bold">SMH</div>
            <div className="text-green-400 text-sm">+28.9% annualized</div>
          </div>
          <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
            <div className="text-slate-500 text-xs uppercase">Cheapest Valuation</div>
            <div className="text-white text-lg font-bold">EWZ</div>
            <div className="text-green-400 text-sm">7.2x P/E (Brazil)</div>
          </div>
          <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
            <div className="text-slate-500 text-xs uppercase">Highest Yield</div>
            <div className="text-white text-lg font-bold">EWZ</div>
            <div className="text-green-400 text-sm">7.8% dividend yield</div>
          </div>
        </div>

        {/* ETF Tables by Category */}
        {CATEGORIES.map((cat) => {
          const etfs = ETF_DATA.filter((e) => e.category === cat);
          if (etfs.length === 0) return null;

          return (
            <div key={cat} className="mb-8">
              <h2 className="text-xl font-bold mb-4 text-white">{CATEGORY_LABELS[cat]}</h2>
              <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left py-3 px-4 text-slate-500 text-xs uppercase">ETF</th>
                      <th className="text-left py-3 px-2 text-slate-500 text-xs uppercase">Region</th>
                      <th className="text-right py-3 px-2 text-slate-500 text-xs uppercase">Expense</th>
                      <th className="text-right py-3 px-2 text-slate-500 text-xs uppercase">P/E</th>
                      <th className="text-right py-3 px-2 text-slate-500 text-xs uppercase">P/B</th>
                      <th className="text-right py-3 px-2 text-slate-500 text-xs uppercase">Yield</th>
                      <th className="text-right py-3 px-2 text-slate-500 text-xs uppercase">YTD</th>
                      <th className="text-right py-3 px-2 text-slate-500 text-xs uppercase">3Y Ann.</th>
                      <th className="text-right py-3 px-2 text-slate-500 text-xs uppercase">5Y Ann.</th>
                      <th className="text-right py-3 px-2 text-slate-500 text-xs uppercase">AUM</th>
                    </tr>
                  </thead>
                  <tbody>
                    {etfs.map((etf) => (
                      <tr key={etf.symbol} className="border-b border-slate-700/50 hover:bg-slate-700/20">
                        <td className="py-3 px-4">
                          <div className="flex flex-col">
                            <span className="text-white font-semibold">{etf.symbol}</span>
                            <span className="text-slate-500 text-xs">{etf.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-2 text-slate-400 text-xs">{etf.region}</td>
                        <td className={`py-3 px-2 text-right font-mono ${expenseColor(etf.expenseRatio)}`}>
                          {etf.expenseRatio.toFixed(2)}%
                        </td>
                        <td className={`py-3 px-2 text-right font-mono ${peColor(etf.peRatio)}`}>
                          {etf.peRatio?.toFixed(1) || "—"}
                        </td>
                        <td className="py-3 px-2 text-right font-mono text-slate-400">
                          {etf.pbRatio?.toFixed(1) || "—"}
                        </td>
                        <td className="py-3 px-2 text-right font-mono text-slate-300">
                          {etf.yield.toFixed(1)}%
                        </td>
                        <td className={`py-3 px-2 text-right font-mono ${returnColor(etf.returnYTD)}`}>
                          {formatReturn(etf.returnYTD)}
                        </td>
                        <td className={`py-3 px-2 text-right font-mono ${returnColor(etf.return3Y)}`}>
                          {formatReturn(etf.return3Y)}
                        </td>
                        <td className={`py-3 px-2 text-right font-mono ${returnColor(etf.return5Y)}`}>
                          {formatReturn(etf.return5Y)}
                        </td>
                        <td className="py-3 px-2 text-right text-slate-500 text-xs">
                          {etf.aum}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Expandable details row */}
                <div className="border-t border-slate-700">
                  {etfs.map((etf) => (
                    <div key={etf.symbol + "-detail"} className="px-4 py-3 border-b border-slate-700/30">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-white font-semibold text-sm">{etf.symbol}</span>
                          <span className="text-slate-500 text-xs ml-2">{etf.description}</span>
                        </div>
                        <div className="flex gap-1 flex-wrap justify-end">
                          {etf.topHoldings.map((h) => (
                            <span key={h} className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded">{h}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}

        {/* Valuation Comparison */}
        <div className="mb-8 bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h2 className="text-xl font-bold mb-4">Valuation Comparison: Country P/E Ratios</h2>
          <div className="space-y-3">
            {ETF_DATA
              .filter((e) => e.category === "country" && e.peRatio !== null)
              .sort((a, b) => (a.peRatio || 0) - (b.peRatio || 0))
              .map((etf) => {
                const maxPE = 30;
                const width = Math.min(((etf.peRatio || 0) / maxPE) * 100, 100);
                return (
                  <div key={etf.symbol} className="flex items-center gap-3">
                    <span className="text-slate-300 text-sm w-16 font-semibold">{etf.symbol}</span>
                    <span className="text-slate-500 text-xs w-24">{etf.region}</span>
                    <div className="flex-1 h-6 bg-slate-700 rounded-full overflow-hidden relative">
                      <div
                        className={`h-full rounded-full ${(etf.peRatio || 0) < 15 ? "bg-green-500" : (etf.peRatio || 0) < 20 ? "bg-yellow-500" : "bg-orange-500"}`}
                        style={{ width: `${width}%` }}
                      />
                      <span className="absolute right-2 top-0.5 text-xs text-white font-mono">
                        {etf.peRatio?.toFixed(1)}x
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
          <p className="text-slate-600 text-xs mt-3">Lower P/E = cheaper valuation. Green &lt;15x, Yellow 15-20x, Orange &gt;20x</p>
        </div>

        {/* 5-Year Performance Comparison */}
        <div className="mb-8 bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h2 className="text-xl font-bold mb-4">5-Year Annualized Returns</h2>
          <div className="space-y-3">
            {ETF_DATA
              .filter((e) => e.return5Y !== null)
              .sort((a, b) => (b.return5Y || 0) - (a.return5Y || 0))
              .slice(0, 15)
              .map((etf) => {
                const maxReturn = 30;
                const val = etf.return5Y || 0;
                const isPositive = val >= 0;
                const width = Math.min((Math.abs(val) / maxReturn) * 100, 100);
                return (
                  <div key={etf.symbol} className="flex items-center gap-3">
                    <span className="text-slate-300 text-sm w-12 font-semibold">{etf.symbol}</span>
                    <span className="text-slate-500 text-xs w-32 truncate">{etf.name}</span>
                    <div className="flex-1 h-6 bg-slate-700 rounded-full overflow-hidden relative">
                      <div
                        className={`h-full rounded-full ${isPositive ? "bg-green-500" : "bg-red-500"}`}
                        style={{ width: `${width}%` }}
                      />
                      <span className={`absolute right-2 top-0.5 text-xs font-mono ${isPositive ? "text-white" : "text-red-200"}`}>
                        {formatReturn(val)}
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Key Takeaways */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-800/50 rounded-xl p-6 border border-blue-500/20">
          <h2 className="text-lg font-semibold text-white mb-3">Key Takeaways</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h3 className="text-blue-400 font-semibold mb-2">For AI / Semis Exposure</h3>
              <ul className="space-y-1 text-slate-300">
                <li>SMH (0.35%) — best 5Y return at +28.9% ann., NVDA-heavy</li>
                <li>EWT (0.59%) — Taiwan = TSMC proxy, cheaper valuation than US semis</li>
                <li>EWY (0.59%) — South Korea = SK Hynix HBM play, P/E only 10.2x</li>
              </ul>
            </div>
            <div>
              <h3 className="text-blue-400 font-semibold mb-2">For Diversification</h3>
              <ul className="space-y-1 text-slate-300">
                <li>VXUS (0.07%) — cheapest total international, one-stop diversification</li>
                <li>VWO (0.08%) — cheapest EM, TSMC + Tencent + Samsung</li>
                <li>EWG (0.50%) — Germany fiscal stimulus re-rating, SAP is an AI play</li>
              </ul>
            </div>
            <div>
              <h3 className="text-blue-400 font-semibold mb-2">Deep Value</h3>
              <ul className="space-y-1 text-slate-300">
                <li>EWZ — Brazil at 7.2x P/E, 7.8% yield, but -4.1% 3Y return</li>
                <li>FXI — China at 11.5x P/E, beaten down but DeepSeek AI catalyst</li>
                <li>EWY — Korea at 10.2x P/E, HBM memory supercycle underappreciated</li>
              </ul>
            </div>
            <div>
              <h3 className="text-blue-400 font-semibold mb-2">Avoid / Red Flags</h3>
              <ul className="space-y-1 text-slate-300">
                <li>ARKK — 0.75% expense, -18.5% 3Y return, poor stock picking track record</li>
                <li>BOTZ — 0.68% expense for what you can build with NVDA + individual names</li>
                <li>GLD vs IAU — you hold GLD (0.40%) but IAU is identical at 0.25%</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
