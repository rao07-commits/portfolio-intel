import { createPool } from "@vercel/postgres";

async function setup() {
  const pool = createPool({ connectionString: process.env.POSTGRES_URL });
  console.log("Creating tables...");

  await pool.sql`CREATE TABLE IF NOT EXISTS holdings (
    id SERIAL PRIMARY KEY, symbol TEXT NOT NULL UNIQUE, name TEXT NOT NULL,
    quantity REAL NOT NULL DEFAULT 0, avg_cost REAL NOT NULL DEFAULT 0,
    asset_type TEXT NOT NULL DEFAULT 'stock', account TEXT NOT NULL DEFAULT 'robinhood',
    sector TEXT NOT NULL DEFAULT 'other', updated_at TIMESTAMP DEFAULT NOW());`;

  await pool.sql`CREATE TABLE IF NOT EXISTS macro_indicators (
    id SERIAL PRIMARY KEY, series_id TEXT NOT NULL, date DATE NOT NULL,
    value REAL NOT NULL, fetched_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(series_id, date));`;

  await pool.sql`CREATE TABLE IF NOT EXISTS market_data (
    id SERIAL PRIMARY KEY, symbol TEXT NOT NULL, date DATE NOT NULL,
    open REAL, high REAL, low REAL, close REAL NOT NULL,
    volume BIGINT, change_pct REAL, UNIQUE(symbol, date));`;

  await pool.sql`CREATE TABLE IF NOT EXISTS trade_signals (
    id SERIAL PRIMARY KEY, symbol TEXT NOT NULL, action TEXT NOT NULL,
    reason TEXT, confidence TEXT, source TEXT DEFAULT 'agent',
    entry_range TEXT, target_price TEXT, stop_loss TEXT, timeframe TEXT,
    generated_at TIMESTAMP DEFAULT NOW(), expires_at TIMESTAMP,
    executed BOOLEAN DEFAULT FALSE);`;

  await pool.sql`CREATE TABLE IF NOT EXISTS briefings (
    id SERIAL PRIMARY KEY, date DATE NOT NULL UNIQUE,
    content_json JSONB NOT NULL, email_sent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW());`;

  await pool.sql`CREATE INDEX IF NOT EXISTS idx_macro_series ON macro_indicators(series_id, date DESC);`;
  await pool.sql`CREATE INDEX IF NOT EXISTS idx_market_symbol ON market_data(symbol, date DESC);`;
  await pool.sql`CREATE INDEX IF NOT EXISTS idx_signals_date ON trade_signals(generated_at DESC);`;

  console.log("Database setup complete!");
  await pool.end();
}

setup().catch(console.error);
