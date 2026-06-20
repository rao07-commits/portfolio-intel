import { sql } from "@vercel/postgres";
import { getHoldings } from "./db";
import { getUniqueSignals } from "./scorecard";

export type DataQuality = "high" | "medium" | "low";

export interface MarketHealthRow {
  symbol: string;
  latestDate: string | null;
  currentPrice: number | null;
  volume: number | null;
  priceChange1d: number | null;
  priceChange5d: number | null;
  priceChange30d: number | null;
  dataQuality: DataQuality;
  dataWarnings: string[];
}

export const BENCHMARK_SYMBOLS = ["SPY", "QQQ"] as const;

function pctChange(current: number | null, prior: number | null): number | null {
  if (current === null || prior === null || prior === 0) return null;
  return ((current - prior) / prior) * 100;
}

function daysSince(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return null;
  return Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
}

async function getMarketRows(symbol: string) {
  const result = await sql`
    SELECT symbol, date, close, volume, change_pct
    FROM market_data
    WHERE symbol = ${symbol}
    ORDER BY date DESC
    LIMIT 31
  `;
  return result.rows.map((r) => ({
    symbol: String(r.symbol),
    date: String(r.date).slice(0, 10),
    close: Number(r.close),
    volume: r.volume === null || r.volume === undefined ? null : Number(r.volume),
    changePct: r.change_pct === null || r.change_pct === undefined ? null : Number(r.change_pct),
  }));
}

export async function getTrackedMarketSymbols(): Promise<string[]> {
  const [holdings, signals] = await Promise.all([getHoldings(), getUniqueSignals()]);
  const symbols = new Set<string>();

  for (const h of holdings) {
    if (h.asset_type === "stock" || h.asset_type === "etf") {
      symbols.add(h.symbol.toUpperCase());
    }
  }
  for (const s of signals) symbols.add(s.symbol.toUpperCase());
  for (const s of BENCHMARK_SYMBOLS) symbols.add(s);

  return Array.from(symbols).filter(Boolean).sort();
}

export async function buildMarketHealthData(symbols?: string[]): Promise<MarketHealthRow[]> {
  const tracked = symbols && symbols.length > 0 ? symbols : await getTrackedMarketSymbols();

  return Promise.all(
    tracked.map(async (rawSymbol) => {
      const symbol = rawSymbol.toUpperCase();
      const rows = await getMarketRows(symbol);
      const latest = rows[0];
      const latestDate = latest?.date || null;
      const currentPrice = latest?.close ?? null;
      const staleDays = daysSince(latestDate);
      const warnings: string[] = [];

      if (!latest) warnings.push("missing market data");
      if (staleDays !== null && staleDays > 4) warnings.push(`stale price (${staleDays}d old)`);
      if (rows.length < 2) warnings.push("missing prior close");
      if (rows.length < 6) warnings.push("missing 5D history");
      if (rows.length < 21) warnings.push("missing 30D history");

      let dataQuality: DataQuality = "high";
      if (!latest || staleDays === null || staleDays > 4 || rows.length < 2) dataQuality = "low";
      else if (rows.length < 21) dataQuality = "medium";

      return {
        symbol,
        latestDate,
        currentPrice,
        volume: latest?.volume ?? null,
        priceChange1d: latest?.changePct ?? pctChange(currentPrice, rows[1]?.close ?? null),
        priceChange5d: pctChange(currentPrice, rows[5]?.close ?? null),
        priceChange30d: pctChange(currentPrice, rows[30]?.close ?? null),
        dataQuality,
        dataWarnings: warnings,
      };
    })
  );
}
