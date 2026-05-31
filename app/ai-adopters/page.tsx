import { AI_ADOPTERS, MATURITY_LABELS } from "@/lib/ai-adopters";

function marginBar(current: number, targetStr: string) {
  // Parse target like "7-9%" or "22-24%"
  const match = targetStr.match(/(\d+)/);
  const targetLow = match ? parseInt(match[1]) : current;
  const expansion = targetLow - current;
  const maxMargin = 50;

  return (
    <div className="mt-2">
      <div className="flex items-center gap-2 text-xs mb-1">
        <span className="text-slate-500">Current: {current}%</span>
        <span className="text-slate-600">|</span>
        <span className="text-green-400">Target: {targetStr}</span>
        {expansion > 0 && (
          <span className="text-green-400 font-semibold ml-auto">+{expansion.toFixed(0)}bps potential</span>
        )}
      </div>
      <div className="h-3 bg-slate-700 rounded-full overflow-hidden relative">
        <div
          className="h-full bg-slate-500 rounded-full"
          style={{ width: `${Math.min((current / maxMargin) * 100, 100)}%` }}
        />
        <div
          className="absolute top-0 h-full bg-green-500/30 rounded-full"
          style={{
            left: `${Math.min((current / maxMargin) * 100, 100)}%`,
            width: `${Math.min((expansion / maxMargin) * 100, 50)}%`
          }}
        />
      </div>
    </div>
  );
}

export default function AIAdoptersPage() {
  // Group by sector
  const sectors = new Map<string, typeof AI_ADOPTERS>();
  for (const a of AI_ADOPTERS) {
    const group = a.sector.split(" / ")[0]; // "Industrials", "Healthcare", etc.
    if (!sectors.has(group)) sectors.set(group, []);
    sectors.get(group)!.push(a);
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">AI Margin Expansion Plays</h1>
          <p className="text-slate-400 mt-1">
            Non-tech S&P 500 companies embedding AI into operations — the market prices them as traditional businesses, but AI is structurally changing their cost structures
          </p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
            <div className="text-slate-500 text-xs uppercase">Companies Tracked</div>
            <div className="text-white text-2xl font-bold">{AI_ADOPTERS.length}</div>
            <div className="text-slate-500 text-xs">S&P 500 non-tech AI adopters</div>
          </div>
          <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
            <div className="text-slate-500 text-xs uppercase">AI Embedded</div>
            <div className="text-green-400 text-2xl font-bold">{AI_ADOPTERS.filter(a => a.aiMaturity === "embedded").length}</div>
            <div className="text-slate-500 text-xs">Most advanced adopters</div>
          </div>
          <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
            <div className="text-slate-500 text-xs uppercase">Scaling AI</div>
            <div className="text-blue-400 text-2xl font-bold">{AI_ADOPTERS.filter(a => a.aiMaturity === "scaling").length}</div>
            <div className="text-slate-500 text-xs">Deploying across operations</div>
          </div>
          <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
            <div className="text-slate-500 text-xs uppercase">Early Stage</div>
            <div className="text-yellow-400 text-2xl font-bold">{AI_ADOPTERS.filter(a => a.aiMaturity === "early").length}</div>
            <div className="text-slate-500 text-xs">Biggest re-rating potential</div>
          </div>
        </div>

        {/* Position Sizing Guide */}
        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700 mb-6">
          <h3 className="text-white font-semibold text-sm mb-3">Position Sizing Guide by Market Cap</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="bg-purple-500/5 border border-purple-500/20 rounded-lg p-3">
              <span className="text-purple-400 font-bold">Mega ($200B+)</span>
              <p className="text-slate-400 mt-1">3-5% position. Low volatility, high liquidity. Core holdings.</p>
              <p className="text-slate-500 mt-1">UNH, JPM, WMT, TMUS, PEP</p>
            </div>
            <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-3">
              <span className="text-blue-400 font-bold">Large ($50-200B)</span>
              <p className="text-slate-400 mt-1">2-4% position. Moderate vol, good liquidity.</p>
              <p className="text-slate-500 mt-1">WM, HCA, SCHW, CAT, DE, PGR, ORLY</p>
            </div>
            <div className="bg-teal-500/5 border border-teal-500/20 rounded-lg p-3">
              <span className="text-teal-400 font-bold">Mid ($10-50B)</span>
              <p className="text-slate-400 mt-1">1-2% position. Higher vol, less liquidity. Satellite positions.</p>
              <p className="text-slate-500 mt-1">CHRW</p>
            </div>
            <div className="bg-slate-500/5 border border-slate-500/20 rounded-lg p-3">
              <span className="text-slate-400 font-bold">Small (&lt;$10B)</span>
              <p className="text-slate-400 mt-1">0.5-1% position. High vol, speculative. Size for risk.</p>
              <p className="text-slate-500 mt-1">Future Russell 2000 additions</p>
            </div>
          </div>
        </div>

        {/* Maturity Legend */}
        <div className="flex gap-4 mb-6 text-xs">
          {Object.entries(MATURITY_LABELS).map(([key, { label, color }]) => (
            <span key={key} className={`px-3 py-1 rounded-full border ${color}`}>{label}</span>
          ))}
        </div>

        {/* Companies by Sector */}
        {Array.from(sectors.entries()).map(([sectorGroup, companies]) => (
          <div key={sectorGroup} className="mb-8">
            <h2 className="text-xl font-bold mb-4">{sectorGroup}</h2>
            <div className="space-y-4">
              {companies.map((company) => {
                const maturity = MATURITY_LABELS[company.aiMaturity];
                return (
                  <div key={company.symbol} className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                    {/* Header */}
                    <div className="p-5">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className="text-white text-xl font-bold">{company.symbol}</span>
                          <span className="text-slate-400 text-sm">{company.name}</span>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                            company.sizeCategory === "mega" ? "bg-purple-500/10 text-purple-400" :
                            company.sizeCategory === "large" ? "bg-blue-500/10 text-blue-400" :
                            company.sizeCategory === "mid" ? "bg-teal-500/10 text-teal-400" :
                            "bg-slate-500/10 text-slate-400"
                          }`}>
                            {company.marketCap}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${maturity.color}`}>
                            {maturity.label}
                          </span>
                        </div>
                      </div>

                      {/* Valuation Row */}
                      <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-3">
                        <div className="bg-slate-700/40 rounded-lg px-3 py-2">
                          <div className="text-slate-500 text-[10px] uppercase">Price</div>
                          <div className="text-white font-bold">${company.price.toFixed(0)}</div>
                        </div>
                        <div className="bg-slate-700/40 rounded-lg px-3 py-2">
                          <div className="text-slate-500 text-[10px] uppercase">P/E</div>
                          <div className={`font-bold ${(company.peRatio || 99) < 18 ? "text-green-400" : (company.peRatio || 99) < 28 ? "text-slate-300" : "text-yellow-400"}`}>
                            {company.peRatio?.toFixed(1) || "—"}x
                          </div>
                        </div>
                        <div className="bg-slate-700/40 rounded-lg px-3 py-2">
                          <div className="text-slate-500 text-[10px] uppercase">Fwd P/E</div>
                          <div className={`font-bold ${(company.fwdPE || 99) < 16 ? "text-green-400" : (company.fwdPE || 99) < 25 ? "text-slate-300" : "text-yellow-400"}`}>
                            {company.fwdPE?.toFixed(1) || "—"}x
                          </div>
                        </div>
                        <div className="bg-slate-700/40 rounded-lg px-3 py-2">
                          <div className="text-slate-500 text-[10px] uppercase">EV/EBITDA</div>
                          <div className="text-slate-300 font-bold">{company.evEbitda?.toFixed(1) || "—"}x</div>
                        </div>
                        <div className="bg-slate-700/40 rounded-lg px-3 py-2">
                          <div className="text-slate-500 text-[10px] uppercase">1Y Return</div>
                          <div className={`font-bold ${company.return1Y > 0 ? "text-green-400" : "text-red-400"}`}>
                            {company.return1Y > 0 ? "+" : ""}{company.return1Y}%
                          </div>
                        </div>
                        <div className="bg-slate-700/40 rounded-lg px-3 py-2">
                          <div className="text-slate-500 text-[10px] uppercase">From 52W High</div>
                          <div className={`font-bold ${company.fromHigh52 > -10 ? "text-slate-300" : company.fromHigh52 > -25 ? "text-yellow-400" : "text-red-400"}`}>
                            {company.fromHigh52}%
                          </div>
                        </div>
                      </div>

                      {/* AI Use Case */}
                      <p className="text-slate-300 text-sm leading-relaxed mb-3">{company.aiUseCase}</p>

                      {/* Margin Bar */}
                      {marginBar(company.currentMargin, company.marginTarget)}

                      {/* Details Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                        <div className="bg-slate-700/30 rounded-lg p-3">
                          <span className="text-green-400 text-xs font-bold uppercase">Margin Impact</span>
                          <p className="text-slate-300 text-sm mt-1">{company.marginImpact}</p>
                        </div>
                        <div className="bg-slate-700/30 rounded-lg p-3">
                          <span className="text-blue-400 text-xs font-bold uppercase">AI Investment</span>
                          <p className="text-slate-300 text-sm mt-1">{company.aiInvestment}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                        <div className="bg-slate-700/30 rounded-lg p-3">
                          <span className="text-purple-400 text-xs font-bold uppercase">Catalyst</span>
                          <p className="text-slate-300 text-sm mt-1">{company.catalyst}</p>
                        </div>
                        <div className="bg-slate-700/30 rounded-lg p-3">
                          <span className="text-red-400 text-xs font-bold uppercase">Risk</span>
                          <p className="text-slate-300 text-sm mt-1">{company.risk}</p>
                        </div>
                      </div>

                      {/* Why Market Has It Wrong */}
                      <div className="mt-3 bg-amber-500/5 border border-amber-500/20 rounded-lg p-4">
                        <span className="text-amber-400 text-xs font-bold uppercase">Why the market has it wrong</span>
                        <p className="text-slate-300 text-sm mt-1">{company.thesis}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Screening Methodology */}
        <div className="mt-8 bg-gradient-to-br from-slate-800 to-slate-800/50 rounded-xl p-6 border border-blue-500/20">
          <h2 className="text-lg font-semibold text-white mb-3">Screening Methodology</h2>
          <div className="text-sm text-slate-300 space-y-2">
            <p>These are <strong>non-tech S&P 500 companies</strong> where AI adoption is a margin expansion catalyst, not a product. The market prices these as traditional businesses in their sectors, missing the structural cost reduction from AI.</p>
            <p><strong>What to look for in earnings:</strong></p>
            <ul className="list-disc pl-5 space-y-1 text-slate-400">
              <li>Operating margin expanding faster than revenue growth — sign of AI cost leverage</li>
              <li>Headcount flat/declining while revenue grows — AI replacing manual processes</li>
              <li>Mentions of &ldquo;automation,&rdquo; &ldquo;AI,&rdquo; &ldquo;digital&rdquo; increasing in earnings calls</li>
              <li>Capex shifting from physical to digital/software — AI infrastructure investment</li>
              <li>New high-margin revenue streams (data, ads, SaaS) enabled by AI</li>
            </ul>
            <p className="text-slate-500 italic mt-3">This is informational only, not financial advice. AI adoption timelines and margin impacts are estimates based on company disclosures and industry analysis.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
