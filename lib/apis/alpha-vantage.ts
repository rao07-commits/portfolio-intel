const AV_BASE = "https://www.alphavantage.co/query";

interface GlobalQuote {
  symbol: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  changePct: number;
}

export async function fetchQuote(symbol: string): Promise<GlobalQuote> {
  const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
  if (!apiKey) throw new Error("ALPHA_VANTAGE_API_KEY not set");

  const url = `${AV_BASE}?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Alpha Vantage error: ${res.status}`);

  const data = await res.json();

  if (data["Note"]) throw new Error("Alpha Vantage rate limit hit");
  if (data["Information"]) throw new Error("Alpha Vantage API limit reached");

  const q = data["Global Quote"];
  if (!q || !q["05. price"]) throw new Error(`No quote data for ${symbol}`);

  return {
    symbol: q["01. symbol"],
    open: parseFloat(q["02. open"]),
    high: parseFloat(q["03. high"]),
    low: parseFloat(q["04. low"]),
    close: parseFloat(q["05. price"]),
    volume: parseInt(q["06. volume"]),
    changePct: parseFloat(q["10. change percent"]?.replace("%", "") || "0"),
  };
}

export interface SectorPerformance {
  sector: string;
  realTimePerformance: number;
  oneDay: number;
  fiveDay: number;
  oneMonth: number;
  threeMonth: number;
  yearToDate: number;
  oneYear: number;
}

export async function fetchSectorPerformance(): Promise<SectorPerformance[]> {
  const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
  if (!apiKey) throw new Error("ALPHA_VANTAGE_API_KEY not set");

  const url = `${AV_BASE}?function=SECTOR&apikey=${apiKey}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Alpha Vantage error: ${res.status}`);

  const data = await res.json();
  if (data["Note"] || data["Information"]) throw new Error("Alpha Vantage rate limit");

  const realTime = data["Rank A: Real-Time Performance"] || {};
  const oneDay = data["Rank B: 1 Day Performance"] || {};
  const fiveDay = data["Rank C: 5 Day Performance"] || {};
  const oneMonth = data["Rank D: 1 Month Performance"] || {};
  const threeMonth = data["Rank E: 3 Month Performance"] || {};
  const ytd = data["Rank F: Year-to-Date (YTD) Performance"] || {};
  const oneYear = data["Rank G: 1 Year Performance"] || {};

  const sectors = Object.keys(realTime);
  return sectors.map((sector) => ({
    sector,
    realTimePerformance: parseFloat(realTime[sector]?.replace("%", "") || "0"),
    oneDay: parseFloat(oneDay[sector]?.replace("%", "") || "0"),
    fiveDay: parseFloat(fiveDay[sector]?.replace("%", "") || "0"),
    oneMonth: parseFloat(oneMonth[sector]?.replace("%", "") || "0"),
    threeMonth: parseFloat(threeMonth[sector]?.replace("%", "") || "0"),
    yearToDate: parseFloat(ytd[sector]?.replace("%", "") || "0"),
    oneYear: parseFloat(oneYear[sector]?.replace("%", "") || "0"),
  }));
}

export async function fetchQuotesBatch(symbols: string[]): Promise<GlobalQuote[]> {
  const quotes: GlobalQuote[] = [];
  const errors: string[] = [];

  for (const symbol of symbols) {
    try {
      quotes.push(await fetchQuote(symbol));
      // Alpha Vantage free tier: 25 req/day, pace requests
      await new Promise((r) => setTimeout(r, 1500));
    } catch (err) {
      errors.push(`${symbol}: ${err}`);
      // If rate-limited, stop trying
      if (String(err).includes("rate limit") || String(err).includes("API limit")) break;
    }
  }

  if (errors.length > 0) {
    console.warn("Alpha Vantage errors:", errors);
  }
  return quotes;
}
