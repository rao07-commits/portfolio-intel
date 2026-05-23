"use client";

import type { PortfolioSummary as PortfolioSummaryType } from "@/lib/portfolio";

interface Props {
  portfolio: PortfolioSummaryType;
}

function formatCurrency(n: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
}

export default function PortfolioSummary({ portfolio }: Props) {
  const isPositive = portfolio.totalGainLoss >= 0;

  return (
    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
      <h2 className="text-slate-400 text-sm font-medium mb-4">Portfolio Summary</h2>
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <div className="text-slate-500 text-xs uppercase">Total Value</div>
          <div className="text-white text-3xl font-bold">{formatCurrency(portfolio.totalValue)}</div>
        </div>
        <div>
          <div className="text-slate-500 text-xs uppercase">Total P&L</div>
          <div className={`text-2xl font-bold ${isPositive ? "text-green-400" : "text-red-400"}`}>
            {isPositive ? "+" : ""}{formatCurrency(portfolio.totalGainLoss)}
            <span className="text-sm ml-1">({portfolio.totalGainLossPct.toFixed(1)}%)</span>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {portfolio.holdings.slice(0, 10).map((h) => (
          <div key={h.symbol} className="flex items-center justify-between py-2 border-b border-slate-700/50">
            <div className="flex items-center gap-3">
              <span className="text-white font-semibold text-sm w-12">{h.symbol}</span>
              <span className="text-slate-400 text-xs">{h.name}</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-slate-300 text-sm">{formatCurrency(h.market_value)}</div>
                <div className="text-slate-500 text-xs">{h.weight.toFixed(1)}%</div>
              </div>
              <div className={`text-xs font-medium w-16 text-right ${h.gain_loss_pct >= 0 ? "text-green-400" : "text-red-400"}`}>
                {h.gain_loss_pct >= 0 ? "+" : ""}{h.gain_loss_pct.toFixed(1)}%
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
