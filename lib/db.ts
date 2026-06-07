import { sql } from "@vercel/postgres";

export async function initDB() {
  await sql`
    CREATE TABLE IF NOT EXISTS holdings (
      id SERIAL PRIMARY KEY,
      symbol TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      quantity REAL NOT NULL DEFAULT 0,
      avg_cost REAL NOT NULL DEFAULT 0,
      asset_type TEXT NOT NULL DEFAULT 'stock',
      account TEXT NOT NULL DEFAULT 'robinhood',
      sector TEXT NOT NULL DEFAULT 'other',
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS macro_indicators (
      id SERIAL PRIMARY KEY,
      series_id TEXT NOT NULL,
      date DATE NOT NULL,
      value REAL NOT NULL,
      fetched_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(series_id, date)
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS market_data (
      id SERIAL PRIMARY KEY,
      symbol TEXT NOT NULL,
      date DATE NOT NULL,
      open REAL,
      high REAL,
      low REAL,
      close REAL NOT NULL,
      volume BIGINT,
      change_pct REAL,
      UNIQUE(symbol, date)
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS trade_signals (
      id SERIAL PRIMARY KEY,
      symbol TEXT NOT NULL,
      action TEXT NOT NULL,
      reason TEXT,
      confidence TEXT,
      source TEXT DEFAULT 'agent',
      entry_range TEXT,
      target_price TEXT,
      stop_loss TEXT,
      timeframe TEXT,
      generated_at TIMESTAMP DEFAULT NOW(),
      expires_at TIMESTAMP,
      executed BOOLEAN DEFAULT FALSE
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS briefings (
      id SERIAL PRIMARY KEY,
      date DATE NOT NULL UNIQUE,
      content_json JSONB NOT NULL,
      email_sent BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS sec_13f_holdings (
      id SERIAL PRIMARY KEY,
      cik TEXT NOT NULL,
      fund_name TEXT NOT NULL,
      quarter_date DATE NOT NULL,
      cusip TEXT NOT NULL,
      issuer_name TEXT NOT NULL,
      ticker TEXT,
      shares BIGINT,
      market_value BIGINT,
      pct_of_portfolio REAL,
      change_type TEXT,
      change_pct REAL,
      fetched_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(cik, quarter_date, cusip)
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS sec_13f_filings (
      id SERIAL PRIMARY KEY,
      cik TEXT NOT NULL,
      accession TEXT NOT NULL UNIQUE,
      quarter_date DATE NOT NULL,
      filing_date DATE NOT NULL,
      fund_name TEXT NOT NULL,
      processed_at TIMESTAMP DEFAULT NOW()
    );
  `;

  await sql`CREATE INDEX IF NOT EXISTS idx_macro_series ON macro_indicators(series_id, date DESC);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_market_symbol ON market_data(symbol, date DESC);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_signals_date ON trade_signals(generated_at DESC);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_13f_cik_quarter ON sec_13f_holdings(cik, quarter_date DESC);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_13f_ticker ON sec_13f_holdings(ticker);`;
}

// --- Holdings ---

export interface HoldingRow {
  id: number;
  symbol: string;
  name: string;
  quantity: number;
  avg_cost: number;
  asset_type: string;
  account: string;
  sector: string;
  updated_at: string;
}

export async function upsertHolding(h: Omit<HoldingRow, "id" | "updated_at">) {
  await sql`
    INSERT INTO holdings (symbol, name, quantity, avg_cost, asset_type, account, sector, updated_at)
    VALUES (${h.symbol}, ${h.name}, ${h.quantity}, ${h.avg_cost}, ${h.asset_type}, ${h.account}, ${h.sector}, NOW())
    ON CONFLICT (symbol) DO UPDATE SET
      name = EXCLUDED.name,
      quantity = EXCLUDED.quantity,
      avg_cost = EXCLUDED.avg_cost,
      asset_type = EXCLUDED.asset_type,
      account = EXCLUDED.account,
      sector = EXCLUDED.sector,
      updated_at = NOW()
  `;
}

export async function getHoldings(): Promise<HoldingRow[]> {
  const result = await sql`SELECT * FROM holdings ORDER BY symbol`;
  return result.rows as HoldingRow[];
}

// --- Macro Indicators ---

export async function upsertMacro(seriesId: string, date: string, value: number) {
  await sql`
    INSERT INTO macro_indicators (series_id, date, value, fetched_at)
    VALUES (${seriesId}, ${date}, ${value}, NOW())
    ON CONFLICT (series_id, date) DO UPDATE SET
      value = EXCLUDED.value,
      fetched_at = NOW()
  `;
}

export async function getMacroSeries(seriesId: string, limit = 60) {
  const result = await sql`
    SELECT date, value FROM macro_indicators
    WHERE series_id = ${seriesId}
    ORDER BY date DESC
    LIMIT ${limit}
  `;
  return result.rows;
}

export async function getLatestMacro() {
  const result = await sql`
    SELECT DISTINCT ON (series_id) series_id, date, value
    FROM macro_indicators
    ORDER BY series_id, date DESC
  `;
  return result.rows;
}

// --- Market Data ---

export async function upsertMarketData(d: {
  symbol: string;
  date: string;
  open: number | null;
  high: number | null;
  low: number | null;
  close: number;
  volume: number | null;
  change_pct: number | null;
}) {
  await sql`
    INSERT INTO market_data (symbol, date, open, high, low, close, volume, change_pct)
    VALUES (${d.symbol}, ${d.date}, ${d.open}, ${d.high}, ${d.low}, ${d.close}, ${d.volume}, ${d.change_pct})
    ON CONFLICT (symbol, date) DO UPDATE SET
      open = EXCLUDED.open,
      high = EXCLUDED.high,
      low = EXCLUDED.low,
      close = EXCLUDED.close,
      volume = EXCLUDED.volume,
      change_pct = EXCLUDED.change_pct
  `;
}

export async function getMarketData(symbol: string, limit = 30) {
  const result = await sql`
    SELECT * FROM market_data
    WHERE symbol = ${symbol}
    ORDER BY date DESC
    LIMIT ${limit}
  `;
  return result.rows;
}

export async function getLatestPrices() {
  const result = await sql`
    SELECT DISTINCT ON (symbol) symbol, date, close, change_pct
    FROM market_data
    ORDER BY symbol, date DESC
  `;
  return result.rows;
}

// --- Trade Signals ---

export async function insertSignal(s: {
  symbol: string;
  action: string;
  reason: string;
  confidence: string;
  source?: string;
  entry_range?: string;
  target_price?: string;
  stop_loss?: string;
  timeframe?: string;
  expires_at?: string;
}) {
  await sql`
    INSERT INTO trade_signals (symbol, action, reason, confidence, source, entry_range, target_price, stop_loss, timeframe, expires_at)
    VALUES (${s.symbol}, ${s.action}, ${s.reason}, ${s.confidence}, ${s.source || "agent"}, ${s.entry_range || null}, ${s.target_price || null}, ${s.stop_loss || null}, ${s.timeframe || null}, ${s.expires_at || null})
  `;
}

export async function getActiveSignals() {
  const result = await sql`
    SELECT * FROM trade_signals
    WHERE executed = FALSE
    AND (expires_at IS NULL OR expires_at > NOW())
    ORDER BY generated_at DESC
  `;
  return result.rows;
}

export async function getRecentSignals(days = 14) {
  const result = await sql`
    SELECT symbol, action, reason, confidence, generated_at FROM trade_signals
    WHERE generated_at > NOW() - (${days} || ' days')::interval
    ORDER BY generated_at DESC
  `;
  return result.rows;
}

// --- Briefings ---

export async function saveBriefing(date: string, contentJson: object, emailSent: boolean) {
  const jsonStr = JSON.stringify(contentJson);
  // Delete any existing briefings for this date — match both '2026-05-30' and '2026-05-30 00:00:00' formats
  const datePrefix = date.slice(0, 10);
  await sql`DELETE FROM briefings WHERE CAST(date AS text) LIKE ${datePrefix + '%'}`;
  await sql`DELETE FROM briefings WHERE CAST(date AS text) = ${datePrefix}`;
  await sql`INSERT INTO briefings (date, content_json, email_sent, created_at) VALUES (${datePrefix}, ${jsonStr}, ${emailSent}, NOW())`;
}

export async function getLatestBriefing() {
  const result = await sql`
    SELECT * FROM briefings ORDER BY created_at DESC LIMIT 1
  `;
  return result.rows[0] || null;
}

export async function getAllBriefings(limit = 30) {
  const result = await sql`
    SELECT id, date, email_sent, created_at FROM briefings
    ORDER BY created_at DESC LIMIT ${limit}
  `;
  return result.rows;
}

export async function getBriefingByDate(date: string) {
  const result = await sql`
    SELECT * FROM briefings WHERE CAST(date AS text) LIKE ${date + '%'} LIMIT 1
  `;
  return result.rows[0] || null;
}

// Latest briefing strictly before the given date — the agent's "yesterday" view
export async function getPreviousBriefing(beforeDate: string) {
  const result = await sql`
    SELECT * FROM briefings WHERE date < ${beforeDate}
    ORDER BY date DESC LIMIT 1
  `;
  return result.rows[0] || null;
}

// --- SEC 13F ---

export interface Sec13fHoldingRow {
  id: number;
  cik: string;
  fund_name: string;
  quarter_date: string;
  cusip: string;
  issuer_name: string;
  ticker: string | null;
  shares: number;
  market_value: number;
  pct_of_portfolio: number;
  change_type: string | null;
  change_pct: number | null;
}

export async function hasProcessedAccession(accession: string): Promise<boolean> {
  const result = await sql`SELECT 1 FROM sec_13f_filings WHERE accession = ${accession} LIMIT 1`;
  return result.rows.length > 0;
}

export async function insertFiling(f: {
  cik: string;
  accession: string;
  quarter_date: string;
  filing_date: string;
  fund_name: string;
}) {
  await sql`
    INSERT INTO sec_13f_filings (cik, accession, quarter_date, filing_date, fund_name)
    VALUES (${f.cik}, ${f.accession}, ${f.quarter_date}, ${f.filing_date}, ${f.fund_name})
    ON CONFLICT (accession) DO NOTHING
  `;
}

export async function upsert13fHolding(h: {
  cik: string;
  fund_name: string;
  quarter_date: string;
  cusip: string;
  issuer_name: string;
  ticker: string | null;
  shares: number;
  market_value: number;
  pct_of_portfolio: number;
  change_type: string | null;
  change_pct: number | null;
}) {
  await sql`
    INSERT INTO sec_13f_holdings (cik, fund_name, quarter_date, cusip, issuer_name, ticker, shares, market_value, pct_of_portfolio, change_type, change_pct)
    VALUES (${h.cik}, ${h.fund_name}, ${h.quarter_date}, ${h.cusip}, ${h.issuer_name}, ${h.ticker}, ${h.shares}, ${h.market_value}, ${h.pct_of_portfolio}, ${h.change_type}, ${h.change_pct})
    ON CONFLICT (cik, quarter_date, cusip) DO UPDATE SET
      issuer_name = EXCLUDED.issuer_name,
      ticker = EXCLUDED.ticker,
      shares = EXCLUDED.shares,
      market_value = EXCLUDED.market_value,
      pct_of_portfolio = EXCLUDED.pct_of_portfolio,
      change_type = EXCLUDED.change_type,
      change_pct = EXCLUDED.change_pct,
      fetched_at = NOW()
  `;
}

// Latest quarter's holdings for one fund, largest positions first
export async function getLatest13fByFund(cik: string, limit = 50): Promise<Sec13fHoldingRow[]> {
  const result = await sql`
    SELECT * FROM sec_13f_holdings
    WHERE cik = ${cik}
      AND quarter_date = (SELECT MAX(quarter_date) FROM sec_13f_holdings WHERE cik = ${cik})
    ORDER BY market_value DESC
    LIMIT ${limit}
  `;
  return result.rows as unknown as Sec13fHoldingRow[];
}

// Prior quarter's holdings for one fund (for QoQ diffing)
export async function getPrior13fByFund(cik: string, beforeQuarter: string): Promise<Sec13fHoldingRow[]> {
  const result = await sql`
    SELECT * FROM sec_13f_holdings
    WHERE cik = ${cik}
      AND quarter_date = (
        SELECT MAX(quarter_date) FROM sec_13f_holdings
        WHERE cik = ${cik} AND quarter_date < ${beforeQuarter}
      )
  `;
  return result.rows as unknown as Sec13fHoldingRow[];
}

// Tickers held by >= 2 tracked funds in their latest quarters
export async function get13fConsensus() {
  const result = await sql`
    WITH latest AS (
      SELECT h.* FROM sec_13f_holdings h
      INNER JOIN (
        SELECT cik, MAX(quarter_date) AS max_q FROM sec_13f_holdings GROUP BY cik
      ) m ON h.cik = m.cik AND h.quarter_date = m.max_q
      WHERE h.ticker IS NOT NULL AND h.shares > 0
    )
    SELECT ticker, MAX(issuer_name) AS issuer_name,
           COUNT(DISTINCT cik) AS fund_count,
           ARRAY_AGG(DISTINCT fund_name) AS funds,
           SUM(market_value) AS combined_value
    FROM latest
    GROUP BY ticker
    HAVING COUNT(DISTINCT cik) >= 2
    ORDER BY fund_count DESC, combined_value DESC
  `;
  return result.rows;
}
