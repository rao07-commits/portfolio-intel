const YF_BASE = "https://query1.finance.yahoo.com/v8/finance/chart";

interface YahooQuote {
  symbol: string;
  close: number;
  open: number;
  high: number;
  low: number;
  volume: number;
  changePct: number;
  previousClose: number;
}

export async function fetchYahooQuote(symbol: string): Promise<YahooQuote> {
  const res = await fetch(`${YF_BASE}/${symbol}?interval=1d&range=1d`, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
    },
  });
  if (!res.ok) throw new Error(`Yahoo Finance error: ${res.status}`);

  const data = await res.json();
  const result = data.chart?.result?.[0];
  if (!result) throw new Error(`No Yahoo data for ${symbol}`);

  const meta = result.meta;
  const quote = result.indicators?.quote?.[0];
  const lastIdx = (quote?.close?.length || 1) - 1;

  const close = quote?.close?.[lastIdx] || meta.regularMarketPrice;
  const previousClose = meta.previousClose || meta.chartPreviousClose;

  return {
    symbol: meta.symbol,
    close,
    open: quote?.open?.[lastIdx] || meta.regularMarketOpen || close,
    high: quote?.high?.[lastIdx] || meta.regularMarketDayHigh || close,
    low: quote?.low?.[lastIdx] || meta.regularMarketDayLow || close,
    volume: quote?.volume?.[lastIdx] || meta.regularMarketVolume || 0,
    previousClose,
    changePct: previousClose ? ((close - previousClose) / previousClose) * 100 : 0,
  };
}

export async function fetchYahooQuotesBatch(
  symbols: string[]
): Promise<YahooQuote[]> {
  const quotes: YahooQuote[] = [];
  const errors: string[] = [];

  for (const symbol of symbols) {
    try {
      quotes.push(await fetchYahooQuote(symbol));
      await new Promise((r) => setTimeout(r, 300));
    } catch (err) {
      errors.push(`${symbol}: ${err}`);
    }
  }

  if (errors.length > 0) {
    console.warn("Yahoo Finance errors:", errors);
  }
  return quotes;
}
