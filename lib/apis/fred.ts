const FRED_BASE = "https://api.stlouisfed.org/fred/series/observations";

export const FRED_SERIES = {
  FEDFUNDS: "Federal Funds Rate",
  DGS10: "10-Year Treasury Yield",
  DGS2: "2-Year Treasury Yield",
  CPIAUCSL: "CPI (All Urban Consumers)",
  PPIFIS: "PPI (Finished Goods)",
  UNRATE: "Unemployment Rate",
  GDP: "Gross Domestic Product",
  T10Y2Y: "10Y-2Y Treasury Spread",
  NAPM: "ISM Manufacturing PMI",
  UMCSENT: "Consumer Sentiment (UMich)",
  T10YIE: "10Y Breakeven Inflation",
  MORTGAGE30US: "30-Year Mortgage Rate",
  DCOILWTICO: "WTI Crude Oil",
  DTWEXBGS: "Trade Weighted US Dollar Index",
} as const;

export type FredSeriesId = keyof typeof FRED_SERIES;

interface FredObservation {
  date: string;
  value: string;
}

export async function fetchFredSeries(
  seriesId: FredSeriesId,
  limit = 60
): Promise<{ date: string; value: number }[]> {
  const apiKey = process.env.FRED_API_KEY;
  if (!apiKey) throw new Error("FRED_API_KEY not set");

  const url = `${FRED_BASE}?series_id=${seriesId}&api_key=${apiKey}&file_type=json&sort_order=desc&limit=${limit}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`FRED API error: ${res.status} ${res.statusText}`);

  const data = await res.json();
  return (data.observations as FredObservation[])
    .filter((o) => o.value !== ".")
    .map((o) => ({ date: o.date, value: parseFloat(o.value) }));
}

export async function fetchAllFredSeries(limit = 60) {
  const results: Record<string, { date: string; value: number }[]> = {};
  const errors: string[] = [];

  for (const seriesId of Object.keys(FRED_SERIES) as FredSeriesId[]) {
    try {
      results[seriesId] = await fetchFredSeries(seriesId, limit);
    } catch (err) {
      errors.push(`${seriesId}: ${err}`);
    }
  }

  return { results, errors };
}
