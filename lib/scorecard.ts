import { sql } from "@vercel/postgres";

// Shared scorecard logic — used by app/scorecard/page.tsx and the briefing
// email's Signal Scorecard section. Deterministic: computed in code, not by
// the agent.

export interface SignalRow {
  id: number;
  symbol: string;
  action: string;
  reason: string;
  confidence: string;
  entry_range: string | null;
  target_price: string | null;
  stop_loss: string | null;
  timeframe: string | null;
  generated_at: string;
}

export interface EnrichedSignal extends SignalRow {
  currentPrice: number | null;
  entryPrice: number | null;
  targetPrice: number | null;
  stopPrice: number | null;
  status: string;
  pnl: number | null;
  isBuy: boolean;
  theme: string;
  daysAgo: number;
}

export interface ScorecardStats {
  winRate: number;
  avgPnl: number;
  namesTracked: number;
  themeCount: number;
}

export function parsePrice(s: string | null): number | null {
  if (!s) return null;
  const match = s.match(/\$?([\d,.]+)/);
  return match ? parseFloat(match[1].replace(",", "")) : null;
}

export function isBuySignal(action: string): boolean {
  const a = action.toLowerCase();
  return !(a.includes("trim") || a.includes("sell") || a.includes("reduce"));
}

// Group signals into thematic buckets
export function categorizeTheme(symbol: string, action: string, reason: string): string {
  const text = (action + " " + reason).toLowerCase();
  if (text.includes("trim") || text.includes("reduce") || text.includes("sell")) return "Divestiture / Trim";
  if (text.includes("semis") || text.includes("chip") || text.includes("hbm") || text.includes("gpu") || ["NVDA", "MU", "AVGO", "MRVL", "ANET", "AMAT", "SMH", "SOXX", "TSM", "AMD"].includes(symbol)) return "AI Semiconductor Cycle";
  if (text.includes("infrastructure") || text.includes("cooling") || text.includes("power") || text.includes("data center") || ["VRT", "CEG", "VST", "EQIX"].includes(symbol)) return "AI Infrastructure / Power";
  if (text.includes("software") || text.includes("enterprise") || text.includes("saas") || ["PLTR", "SNOW", "DDOG", "NET", "CRWD"].includes(symbol)) return "AI Software / Enterprise";
  if (text.includes("ipo") || text.includes("spacex")) return "IPO Positioning";
  return "Other / Macro";
}

export function enrichSignal(s: SignalRow, currentPrice: number | null): EnrichedSignal {
  const entryPrice = parsePrice(s.entry_range);
  const targetPrice = parsePrice(s.target_price);
  const stopPrice = parsePrice(s.stop_loss);
  const isBuy = isBuySignal(s.action);
  const theme = categorizeTheme(s.symbol, s.action, s.reason);

  let status = "WATCHING";
  let pnl: number | null = null;

  if (currentPrice && entryPrice) {
    if (isBuy) {
      if (targetPrice && currentPrice >= targetPrice) { status = "TARGET HIT"; pnl = ((targetPrice - entryPrice) / entryPrice) * 100; }
      else if (stopPrice && currentPrice <= stopPrice) { status = "STOPPED OUT"; pnl = ((stopPrice - entryPrice) / entryPrice) * 100; }
      else if (currentPrice >= entryPrice) { status = "IN PROFIT"; pnl = ((currentPrice - entryPrice) / entryPrice) * 100; }
      else { status = "UNDERWATER"; pnl = ((currentPrice - entryPrice) / entryPrice) * 100; }
    } else {
      if (currentPrice <= entryPrice) { status = "CORRECT"; pnl = ((entryPrice - currentPrice) / entryPrice) * 100; }
      else { status = "WRONG"; pnl = ((entryPrice - currentPrice) / entryPrice) * 100; }
    }
  }

  const daysAgo = Math.floor((Date.now() - new Date(s.generated_at).getTime()) / (1000 * 60 * 60 * 24));

  return { ...s, currentPrice, entryPrice, targetPrice, stopPrice, status, pnl, isBuy, theme, daysAgo };
}

export function computeScorecardStats(enriched: EnrichedSignal[]): ScorecardStats {
  const withPnl = enriched.filter((s) => s.pnl !== null);
  const winners = withPnl.filter((s) => (s.pnl || 0) > 0);
  const winRate = withPnl.length > 0 ? (winners.length / withPnl.length) * 100 : 0;
  const avgPnl = withPnl.length > 0 ? withPnl.reduce((sum, s) => sum + (s.pnl || 0), 0) / withPnl.length : 0;
  const themeCount = new Set(enriched.map((s) => s.theme)).size;
  return { winRate, avgPnl, namesTracked: enriched.length, themeCount };
}

// Deduplicate signals — keep the most recent signal per symbol
export async function getUniqueSignals(): Promise<SignalRow[]> {
  const result = await sql`
    SELECT DISTINCT ON (symbol) * FROM trade_signals
    ORDER BY symbol, generated_at DESC
  `;
  return result.rows as unknown as SignalRow[];
}

async function getLatestPrice(symbol: string): Promise<number | null> {
  try {
    const result = await sql`SELECT close FROM market_data WHERE symbol = ${symbol} ORDER BY date DESC LIMIT 1`;
    return result.rows[0]?.close || null;
  } catch {
    return null;
  }
}

// Open signals enriched with current prices — the scorecard data set
export async function getOpenSignalsWithPrices(): Promise<EnrichedSignal[]> {
  const signals = await getUniqueSignals();
  return Promise.all(signals.map(async (s) => enrichSignal(s, await getLatestPrice(s.symbol))));
}
