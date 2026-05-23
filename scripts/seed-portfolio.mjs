import { createPool } from "@vercel/postgres";

const HOLDINGS = [
  { symbol: "AMZN", name: "Amazon", quantity: 0, avg_cost: 0, asset_type: "stock", account: "robinhood", sector: "consumer_discretionary" },
  { symbol: "NVDA", name: "NVIDIA", quantity: 0, avg_cost: 0, asset_type: "stock", account: "robinhood", sector: "technology" },
  { symbol: "CRWD", name: "CrowdStrike", quantity: 0, avg_cost: 0, asset_type: "stock", account: "robinhood", sector: "technology" },
  { symbol: "GOOG", name: "Alphabet", quantity: 0, avg_cost: 0, asset_type: "stock", account: "robinhood", sector: "communication_services" },
  { symbol: "APP", name: "AppLovin", quantity: 0, avg_cost: 0, asset_type: "stock", account: "robinhood", sector: "technology" },
  { symbol: "ASTS", name: "AST SpaceMobile", quantity: 0, avg_cost: 0, asset_type: "stock", account: "robinhood", sector: "communication_services" },
  { symbol: "HOOD", name: "Robinhood Markets", quantity: 0, avg_cost: 0, asset_type: "stock", account: "robinhood", sector: "financials" },
  { symbol: "EWY", name: "iShares MSCI South Korea ETF", quantity: 0, avg_cost: 0, asset_type: "etf", account: "robinhood", sector: "international" },
  { symbol: "MU", name: "Micron Technology", quantity: 0, avg_cost: 0, asset_type: "stock", account: "robinhood", sector: "technology" },
  { symbol: "SPY", name: "SPDR S&P 500 ETF", quantity: 0, avg_cost: 0, asset_type: "etf", account: "robinhood", sector: "broad_market" },
  { symbol: "GLD", name: "SPDR Gold Shares", quantity: 0, avg_cost: 0, asset_type: "etf", account: "robinhood", sector: "commodities" },
  { symbol: "BTC", name: "Bitcoin", quantity: 0, avg_cost: 0, asset_type: "crypto", account: "crypto", sector: "crypto" },
  { symbol: "TDF", name: "Target Date Fund (401K)", quantity: 0, avg_cost: 0, asset_type: "fund", account: "401k", sector: "broad_market" },
  { symbol: "CASH", name: "Cash", quantity: 0, avg_cost: 1, asset_type: "cash", account: "robinhood", sector: "cash" },
];

async function seed() {
  const pool = createPool({ connectionString: process.env.POSTGRES_URL });
  console.log("Seeding portfolio...");

  for (const h of HOLDINGS) {
    await pool.sql`
      INSERT INTO holdings (symbol, name, quantity, avg_cost, asset_type, account, sector)
      VALUES (${h.symbol}, ${h.name}, ${h.quantity}, ${h.avg_cost}, ${h.asset_type}, ${h.account}, ${h.sector})
      ON CONFLICT (symbol) DO NOTHING
    `;
    console.log(`  ${h.symbol} - ${h.name}`);
  }

  console.log("Portfolio seeded! Update quantities and cost basis via the UI or API.");
  await pool.end();
}

seed().catch(console.error);
