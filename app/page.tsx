import PortfolioSummary from "./components/PortfolioSummary";
import TradeSignals from "./components/TradeSignals";

async function fetchPortfolio() {
  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";
  try {
    const res = await fetch(`${baseUrl}/api/portfolio`, { cache: "no-store" });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

async function fetchSignals() {
  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";
  try {
    const res = await fetch(`${baseUrl}/api/signals`, { cache: "no-store" });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const [portfolio, signals] = await Promise.all([
    fetchPortfolio(),
    fetchSignals(),
  ]);

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Portfolio Overview</h1>
          <p className="text-slate-400 mt-1">Real-time holdings, signals, and allocation intelligence</p>
        </div>

        {portfolio && portfolio.holdings?.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PortfolioSummary portfolio={portfolio} />
            <TradeSignals signals={signals} />
          </div>
        ) : (
          <div className="bg-slate-800 rounded-xl p-8 border border-slate-700 text-center">
            <h2 className="text-xl font-bold mb-2">Getting Started</h2>
            <p className="text-slate-400 mb-4">Set up your portfolio to get started with automated intelligence.</p>
            <div className="text-left max-w-lg mx-auto space-y-3 text-sm text-slate-300">
              <div className="bg-slate-700/50 rounded-lg p-4">
                <span className="text-blue-400 font-mono">1.</span> Deploy to Vercel and add Postgres storage
              </div>
              <div className="bg-slate-700/50 rounded-lg p-4">
                <span className="text-blue-400 font-mono">2.</span> Set environment variables (FRED_API_KEY, FINNHUB_API_KEY, ALPHA_VANTAGE_API_KEY, ANTHROPIC_API_KEY, RESEND_API_KEY, DIGEST_EMAIL)
              </div>
              <div className="bg-slate-700/50 rounded-lg p-4">
                <span className="text-blue-400 font-mono">3.</span> Run <code className="text-green-400">npm run db:setup</code> then <code className="text-green-400">npm run db:seed</code>
              </div>
              <div className="bg-slate-700/50 rounded-lg p-4">
                <span className="text-blue-400 font-mono">4.</span> Update holdings with quantities via <code className="text-green-400">POST /api/portfolio</code>
              </div>
              <div className="bg-slate-700/50 rounded-lg p-4">
                <span className="text-blue-400 font-mono">5.</span> Trigger first data fetch: <code className="text-green-400">GET /api/cron/market-data</code>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
