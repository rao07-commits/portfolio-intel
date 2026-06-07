import { getHoldings, getLatestPrices } from "./db";
import { getUniqueSignals } from "./scorecard";
import { fetchMetricsBatch } from "./apis/finnhub";

// Valuation snapshot for the email — holdings + active watchlist names with
// P/E, forward P/E, and position within the 52-week range. Deterministic:
// computed in code, not by the agent.

export interface ValuationRow {
  symbol: string;
  price: number | null;
  peTTM: number | null;
  forwardPE: number | null;
  range52Position: number | null; // 0 = at 52wk low, 1 = at 52wk high
}

const MAX_SYMBOLS = 20;
// Metrics don't apply to non-equity assets
const SKIP_SYMBOLS = new Set(["BTC", "GLD", "SPY", "EWY", "CASH"]);

export async function getValuationSnapshot(): Promise<ValuationRow[]> {
  const [holdings, signals, priceRows] = await Promise.all([
    getHoldings(),
    getUniqueSignals(),
    getLatestPrices(),
  ]);

  const prices = new Map<string, number>(priceRows.map((r) => [String(r.symbol), Number(r.close)]));

  // Holdings first, then watchlist names from open signals
  const symbols: string[] = [];
  for (const h of holdings) {
    const s = h.symbol.toUpperCase();
    if (!SKIP_SYMBOLS.has(s) && !symbols.includes(s)) symbols.push(s);
  }
  for (const sig of signals) {
    const s = sig.symbol.toUpperCase();
    if (!SKIP_SYMBOLS.has(s) && !symbols.includes(s)) symbols.push(s);
  }

  const capped = symbols.slice(0, MAX_SYMBOLS);
  const metrics = await fetchMetricsBatch(capped);

  return metrics.map((m) => {
    const price = prices.get(m.symbol) ?? null;
    let range52Position: number | null = null;
    if (price !== null && m.week52High !== null && m.week52Low !== null && m.week52High > m.week52Low) {
      range52Position = (price - m.week52Low) / (m.week52High - m.week52Low);
    }
    return {
      symbol: m.symbol,
      price,
      peTTM: m.peTTM,
      forwardPE: m.forwardPE,
      range52Position,
    };
  });
}
