import { NextRequest, NextResponse } from "next/server";
import { initDB, upsertMacro, upsertMarketData, getHoldings } from "@/lib/db";
import { fetchAllFredSeries } from "@/lib/apis/fred";
import { fetchYahooQuotesBatch } from "@/lib/apis/yahoo-finance";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await initDB();

    // 1. Fetch FRED macro data
    const { results: fredData, errors: fredErrors } = await fetchAllFredSeries(60);
    let macroInserted = 0;
    for (const [seriesId, observations] of Object.entries(fredData)) {
      for (const obs of observations) {
        await upsertMacro(seriesId, obs.date, obs.value);
        macroInserted++;
      }
    }

    // 2. Fetch market data for portfolio holdings
    const holdings = await getHoldings();
    const symbols = holdings
      .filter((h) => h.asset_type === "stock" || h.asset_type === "etf")
      .map((h) => h.symbol);

    const quotes = await fetchYahooQuotesBatch(symbols);
    const today = new Date().toISOString().split("T")[0];
    let quotesInserted = 0;
    const quoteErrors: string[] = [];

    for (const q of quotes) {
      try {
        await upsertMarketData({
          symbol: q.symbol,
          date: today,
          open: q.open,
          high: q.high,
          low: q.low,
          close: q.close,
          volume: q.volume,
          change_pct: q.changePct,
        });
        quotesInserted++;
      } catch (err) {
        quoteErrors.push(`${q.symbol}: ${err}`);
      }
    }

    return NextResponse.json({
      success: true,
      macroSeriesFetched: Object.keys(fredData).length,
      macroObservationsInserted: macroInserted,
      quotesFetched: quotesInserted,
      symbolsRequested: symbols.length,
      quotesReturned: quotes.length,
      fredErrors: fredErrors.length,
      quoteErrors,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Market data fetch failed:", err);
    return NextResponse.json(
      { error: "Market data fetch failed", details: String(err) },
      { status: 500 }
    );
  }
}
