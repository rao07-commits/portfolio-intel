import { HoldingRow } from "./db";

export interface HoldingWithPrice extends HoldingRow {
  current_price: number;
  market_value: number;
  weight: number;
  gain_loss: number;
  gain_loss_pct: number;
}

export interface PortfolioSummary {
  totalValue: number;
  totalCost: number;
  totalGainLoss: number;
  totalGainLossPct: number;
  holdings: HoldingWithPrice[];
}

export function computePortfolio(
  holdings: HoldingRow[],
  prices: Record<string, number>
): PortfolioSummary {
  const withPrices: HoldingWithPrice[] = holdings.map((h) => {
    const price = prices[h.symbol] || h.avg_cost || 0;
    const marketValue = h.quantity * price;
    const costBasis = h.quantity * h.avg_cost;
    return {
      ...h,
      current_price: price,
      market_value: marketValue,
      weight: 0, // computed below
      gain_loss: marketValue - costBasis,
      gain_loss_pct: costBasis > 0 ? ((marketValue - costBasis) / costBasis) * 100 : 0,
    };
  });

  const totalValue = withPrices.reduce((sum, h) => sum + h.market_value, 0);
  const totalCost = withPrices.reduce((sum, h) => sum + h.quantity * h.avg_cost, 0);

  for (const h of withPrices) {
    h.weight = totalValue > 0 ? (h.market_value / totalValue) * 100 : 0;
  }

  return {
    totalValue,
    totalCost,
    totalGainLoss: totalValue - totalCost,
    totalGainLossPct: totalCost > 0 ? ((totalValue - totalCost) / totalCost) * 100 : 0,
    holdings: withPrices.sort((a, b) => b.weight - a.weight),
  };
}

// Sector mapping for concentration analysis
export const SECTOR_LABELS: Record<string, string> = {
  technology: "Technology",
  consumer_discretionary: "Consumer Discretionary",
  communication_services: "Communication Services",
  financials: "Financials",
  broad_market: "Broad Market",
  international: "International",
  commodities: "Commodities",
  crypto: "Crypto",
  cash: "Cash",
  other: "Other",
};

export interface SectorExposure {
  sector: string;
  label: string;
  weight: number;
  holdings: string[];
}

export function computeSectorExposure(portfolio: PortfolioSummary): SectorExposure[] {
  const sectorMap: Record<string, { weight: number; holdings: string[] }> = {};

  for (const h of portfolio.holdings) {
    if (!sectorMap[h.sector]) {
      sectorMap[h.sector] = { weight: 0, holdings: [] };
    }
    sectorMap[h.sector].weight += h.weight;
    sectorMap[h.sector].holdings.push(h.symbol);
  }

  return Object.entries(sectorMap)
    .map(([sector, data]) => ({
      sector,
      label: SECTOR_LABELS[sector] || sector,
      weight: data.weight,
      holdings: data.holdings,
    }))
    .sort((a, b) => b.weight - a.weight);
}
