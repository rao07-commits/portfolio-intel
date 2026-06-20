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

function uniqueArticles(articles: NewsArticle[]): NewsArticle[] {
  const seen = new Set<string>();
  const unique: NewsArticle[] = [];

  for (const article of articles) {
    const key = article.url || String(article.id) || article.headline;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(article);
  }

  return unique;
}

export async function fetchTechNews(limit = 20): Promise<NewsArticle[]> {
  const [technology, general] = await Promise.all(
    ["technology", "general"].map(async (category) => {
      const res = await fetch(`${FINNHUB_BASE}/news?category=${category}`, {
        headers: headers(),
      });
      if (!res.ok) throw new Error(`Finnhub ${category} news error: ${res.status}`);
      return (await res.json()) as NewsArticle[];
    })
  );

  const articles = uniqueArticles([...technology, ...general]);

  const aiKeywords = /\b(ai|artificial intelligence|machine learning|gpu|nvidia|openai|anthropic|llm|semiconductor|chip|data center|hyperscaler|cloud|power|nuclear|memory|hbm)\b/i;
  const macroKeywords = /\b(fed|fomc|rates?|inflation|cpi|ppi|jobs?|payroll|unemployment|gdp|treasury|yield|dollar|oil|gold|copper|china|europe|japan)\b/i;
  const portfolioKeywords = /\b(amzn|amazon|nvda|nvidia|crwd|crowdstrike|goog|google|alphabet|applovin|app|asts|hood|robinhood|micron|mu|bitcoin|btc)\b/i;
  const qualitySources = /\b(reuters|bloomberg|financial times|ft|wall street journal|wsj|barron's|seeking alpha|the information|morningstar|marketwatch|investing\.com)\b/i;

  return articles
    .map((article, index) => {
      const text = `${article.headline} ${article.summary} ${article.source}`;
      let score = 0;
      if (portfolioKeywords.test(text)) score += 5;
      if (aiKeywords.test(text)) score += 4;
      if (macroKeywords.test(text)) score += 3;
      if (qualitySources.test(article.source)) score += 2;
      score += Math.max(0, 20 - index) / 100;
      return { article, score };
    })
    .sort((a, b) => b.score - a.score)
    .map(({ article }) => article)
    .slice(0, limit);
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
