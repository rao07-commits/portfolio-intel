import AllocationMap from "../components/AllocationMap";
import { computeSectorExposure } from "@/lib/portfolio";
import { computeConcentration, generateRebalanceRecommendations } from "@/lib/allocation";

async function fetchData() {
  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";

  try {
    const [portfolioRes, macroRes] = await Promise.all([
      fetch(`${baseUrl}/api/portfolio`, { cache: "no-store" }),
      fetch(`${baseUrl}/api/macro`, { cache: "no-store" }),
    ]);

    const portfolio = portfolioRes.ok ? await portfolioRes.json() : null;
    const macro = macroRes.ok ? await macroRes.json() : [];

    return { portfolio, macro };
  } catch {
    return { portfolio: null, macro: [] };
  }
}

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

export default async function AllocationPage() {
  const { portfolio } = await fetchData();

  if (!portfolio || !portfolio.holdings) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">No Portfolio Data</h1>
          <p className="text-slate-400">Run the market data cron first, then seed your portfolio via the API.</p>
        </div>
      </div>
    );
  }

  const sectors = computeSectorExposure(portfolio);
  const concentration = computeConcentration(portfolio);

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Portfolio Allocation</h1>
          <p className="text-slate-400 mt-1">Concentration analysis and rebalancing recommendations</p>
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

          {/* Sector Allocation */}
          <AllocationMap sectors={sectors} />
        </div>

        {/* Rebalancing Recommendations */}
        <div className="mt-6 bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h2 className="text-slate-400 text-sm font-medium mb-4">Rebalancing Actions</h2>
          <div className="space-y-3">
            {generateRebalanceRecommendations(portfolio).map((action, i) => (
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
