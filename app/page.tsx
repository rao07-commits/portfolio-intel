import PortfolioSummary from "./components/PortfolioSummary";
import TradeSignals from "./components/TradeSignals";
import { initDB, getHoldings, getLatestPrices, getActiveSignals } from "@/lib/db";
import { computePortfolio } from "@/lib/portfolio";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  await initDB();
  const [holdings, priceRows, signals] = await Promise.all([
    getHoldings(),
    getLatestPrices(),
    getActiveSignals(),
  ]);

  const prices: Record<string, number> = {};
  for (const row of priceRows) {
    prices[row.symbol] = row.close;
  }
  const portfolio = computePortfolio(holdings, prices);

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Portfolio Overview</h1>
          <p className="text-slate-400 mt-1">Real-time holdings, signals, and allocation intelligence</p>
        </div>

        {portfolio.holdings.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PortfolioSummary portfolio={portfolio} />
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            <TradeSignals signals={signals as any[]} />
          </div>
        ) : (
          <div className="bg-slate-800 rounded-xl p-8 border border-slate-700 text-center">
            <h2 className="text-xl font-bold mb-2">Getting Started</h2>
            <p className="text-slate-400 mb-4">Set up your portfolio to get started with automated intelligence.</p>
          </div>
        )}
      </div>
    </div>
  );
}
