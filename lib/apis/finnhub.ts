const FINNHUB_BASE = "https://finnhub.io/api/v1";

function headers() {
  const apiKey = process.env.FINNHUB_API_KEY;
  if (!apiKey) throw new Error("FINNHUB_API_KEY not set");
  return { "X-Finnhub-Token": apiKey };
}

export interface NewsArticle {
  category: string;
  datetime: number;
  headline: string;
  id: number;
  image: string;
  related: string;
  source: string;
  summary: string;
  url: string;
}

export async function fetchTechNews(limit = 20): Promise<NewsArticle[]> {
  const res = await fetch(`${FINNHUB_BASE}/news?category=technology`, {
    headers: headers(),
  });
  if (!res.ok) throw new Error(`Finnhub news error: ${res.status}`);

  const articles: NewsArticle[] = await res.json();
  // Filter for AI-related headlines
  const aiKeywords = /\b(ai|artificial intelligence|machine learning|gpu|nvidia|openai|anthropic|llm|semiconductor|chip|data center)\b/i;
  const aiArticles = articles.filter(
    (a) => aiKeywords.test(a.headline) || aiKeywords.test(a.summary)
  );

  // Return AI articles first, then general tech
  return [...aiArticles, ...articles.filter((a) => !aiArticles.includes(a))].slice(0, limit);
}

export interface IPO {
  symbol: string;
  name: string;
  date: string;
  numberOfShares: number;
  totalSharesValue: number;
  price: string;
  status: string;
}

export async function fetchUpcomingIPOs(): Promise<IPO[]> {
  const today = new Date().toISOString().split("T")[0];
  const threeMonthsOut = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const res = await fetch(
    `${FINNHUB_BASE}/calendar/ipo?from=${today}&to=${threeMonthsOut}`,
    { headers: headers() }
  );
  if (!res.ok) throw new Error(`Finnhub IPO error: ${res.status}`);

  const data = await res.json();
  return (data.ipoCalendar || []) as IPO[];
}

export interface StockMetrics {
  symbol: string;
  peTTM: number | null;
  forwardPE: number | null;
  week52High: number | null;
  week52Low: number | null;
}

export async function fetchMetrics(symbol: string): Promise<StockMetrics> {
  const res = await fetch(`${FINNHUB_BASE}/stock/metric?symbol=${symbol}&metric=all`, {
    headers: headers(),
  });
  if (!res.ok) throw new Error(`Finnhub metric error: ${res.status}`);

  const data = await res.json();
  const m = data?.metric || {};
  return {
    symbol,
    peTTM: m.peTTM ?? m.peBasicExclExtraTTM ?? null,
    forwardPE: m.forwardPE ?? m.peNormalizedAnnual ?? null,
    week52High: m["52WeekHigh"] ?? null,
    week52Low: m["52WeekLow"] ?? null,
  };
}

export async function fetchMetricsBatch(symbols: string[]): Promise<StockMetrics[]> {
  const results: StockMetrics[] = [];
  const errors: string[] = [];
  for (const symbol of symbols) {
    try {
      results.push(await fetchMetrics(symbol));
      await new Promise((r) => setTimeout(r, 1100)); // free tier: 60 req/min
    } catch (err) {
      errors.push(`${symbol}: ${err}`);
    }
  }
  if (errors.length > 0) console.warn("Finnhub metrics errors:", errors);
  return results;
}

export interface AnalystRecommendation {
  symbol: string;
  buy: number;
  hold: number;
  sell: number;
  strongBuy: number;
  strongSell: number;
  period: string;
}

export async function fetchRecommendations(
  symbol: string
): Promise<AnalystRecommendation[]> {
  const res = await fetch(
    `${FINNHUB_BASE}/stock/recommendation?symbol=${symbol}`,
    { headers: headers() }
  );
  if (!res.ok) throw new Error(`Finnhub recommendation error: ${res.status}`);

  return res.json();
}
