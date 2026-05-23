import { NextRequest, NextResponse } from "next/server";
import { initDB, getHoldings, upsertHolding, getLatestPrices } from "@/lib/db";
import { computePortfolio } from "@/lib/portfolio";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await initDB();
    const holdings = await getHoldings();
    const priceRows = await getLatestPrices();
    const prices: Record<string, number> = {};
    for (const row of priceRows) {
      prices[row.symbol] = row.close;
    }
    const portfolio = computePortfolio(holdings, prices);
    return NextResponse.json(portfolio);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await initDB();
    const body = await req.json();
    const { symbol, name, quantity, avg_cost, asset_type, account, sector } = body;

    if (!symbol || !name) {
      return NextResponse.json({ error: "symbol and name are required" }, { status: 400 });
    }

    await upsertHolding({
      symbol: symbol.toUpperCase(),
      name,
      quantity: quantity || 0,
      avg_cost: avg_cost || 0,
      asset_type: asset_type || "stock",
      account: account || "robinhood",
      sector: sector || "other",
    });

    return NextResponse.json({ success: true, symbol });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
