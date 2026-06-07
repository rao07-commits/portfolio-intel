import { getHoldings, getLatest13fByFund, get13fConsensus, getRecentSignals, getPreviousBriefing } from "../db";
import { TRACKED_FUNDS } from "../13f/funds";

// Shared data builders for the three memory/smart-money tools, used by both
// lib/agent/briefing-agent.ts (raw SDK) and lib/agent/tools.ts (MCP server).
// Outputs are aggressively trimmed to keep agent prompt tokens in check.

export async function buildSmartMoneyData() {
  const [holdings, consensus, ...fundHoldings] = await Promise.all([
    getHoldings(),
    get13fConsensus(),
    ...TRACKED_FUNDS.map((f) => getLatest13fByFund(f.cik, 15)),
  ]);

  const userSymbols = new Set(holdings.map((h) => h.symbol.toUpperCase()));

  const funds = TRACKED_FUNDS.map((f, i) => {
    const positions = fundHoldings[i];
    const active = positions.filter((p) => p.shares > 0).slice(0, 10);
    return {
      fund: f.name,
      manager: f.manager,
      quarter: active[0]?.quarter_date || null,
      topPositions: active.map((p) => ({
        ticker: p.ticker || p.issuer_name,
        pctOfFund: Number(Number(p.pct_of_portfolio).toFixed(1)),
        change: p.change_type,
      })),
      exited: positions.filter((p) => p.change_type === "exited").map((p) => p.ticker || p.issuer_name),
    };
  }).filter((f) => f.topPositions.length > 0 || f.exited.length > 0);

  // A filing is "new" for briefing purposes if fetched within the last 7 days
  const hasRecentChanges = fundHoldings.some((positions) =>
    positions.some((p) => p.change_type && p.change_type !== "unchanged")
  );

  return {
    note: "Quarterly SEC 13F data — up to 45 days stale; long-only US equity, no shorts.",
    hasData: funds.length > 0,
    hasRecentChanges,
    funds,
    consensus: consensus.slice(0, 15).map((c) => ({
      ticker: c.ticker,
      fundCount: Number(c.fund_count),
      funds: c.funds,
      userOwns: userSymbols.has(String(c.ticker).toUpperCase()),
    })),
  };
}

export async function buildRecentSignalsData(days = 14) {
  const rows = await getRecentSignals(days);
  return {
    note: `Trade signals you issued in the last ${days} days. Do NOT re-pitch these names unless the thesis materially changed.`,
    signals: rows.map((r) => ({
      symbol: r.symbol,
      action: r.action,
      date: String(r.generated_at).slice(0, 10),
      reason: String(r.reason || "").slice(0, 150),
    })),
  };
}

export async function buildPreviousBriefingData(today: string) {
  const row = await getPreviousBriefing(today);
  if (!row) return { note: "No previous briefing found.", previous: null };

  const content = typeof row.content_json === "string" ? JSON.parse(row.content_json) : row.content_json;
  // Trimmed view — enough to compute deltas without blowing up the context
  return {
    note: "Yesterday's briefing (trimmed). Lead today's briefing with what CHANGED vs this.",
    previous: {
      date: String(row.date).slice(0, 10),
      marketSummary: content?.marketOverview?.summary || "",
      allocationRecommendations: content?.allocationRecommendations || null,
      signalSymbols: (content?.tradeSignals || []).map((s: { symbol: string }) => s.symbol),
      sectorRotation: {
        bullish: content?.sectorRotation?.bullish || [],
        bearish: content?.sectorRotation?.bearish || [],
      },
    },
  };
}
