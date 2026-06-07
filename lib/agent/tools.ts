import { tool, createSdkMcpServer } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";
import { getHoldings, getLatestMacro, getMacroSeries, getLatestPrices } from "../db";
import { computePortfolio, computeSectorExposure } from "../portfolio";
import { computeConcentration, generateRebalanceRecommendations, interpretMacroData } from "../allocation";
import { fetchTechNews, fetchUpcomingIPOs } from "../apis/finnhub";
import { fetchSectorPerformance } from "../apis/alpha-vantage";
import { FRED_SERIES, type FredSeriesId } from "../apis/fred";
import { buildSmartMoneyData, buildRecentSignalsData, buildPreviousBriefingData } from "./tool-data";

async function buildPortfolioWithPrices() {
  const [holdings, priceRows] = await Promise.all([getHoldings(), getLatestPrices()]);
  const prices: Record<string, number> = {};
  for (const row of priceRows) {
    prices[row.symbol] = row.close;
  }
  return computePortfolio(holdings, prices);
}

async function buildMacroData() {
  const data: Record<string, { date: string; value: number }[]> = {};
  for (const seriesId of Object.keys(FRED_SERIES) as FredSeriesId[]) {
    const rows = await getMacroSeries(seriesId, 10);
    data[seriesId] = rows.map((r) => ({ date: String(r.date), value: Number(r.value) }));
  }
  return data;
}

// Use shape objects (not z.object()) as the SDK expects
const emptyShape = {} as const;

const getPortfolioHoldings = tool(
  "get_portfolio_holdings",
  "Get current portfolio holdings with latest prices, weights, and P&L",
  emptyShape,
  async () => {
    const portfolio = await buildPortfolioWithPrices();
    return {
      content: [{ type: "text" as const, text: JSON.stringify(portfolio, null, 2) }],
    };
  }
);

const getMacroIndicators = tool(
  "get_macro_indicators",
  "Get latest FRED macro data (Fed funds, CPI, PPI, unemployment, GDP, yield curve, ISM, consumer sentiment, breakevens, mortgage rate)",
  emptyShape,
  async () => {
    const latest = await getLatestMacro();
    const seriesLabels = FRED_SERIES as Record<string, string>;
    const formatted = latest.map((row) => ({
      series: row.series_id,
      label: seriesLabels[row.series_id] || row.series_id,
      date: row.date,
      value: row.value,
    }));
    return {
      content: [{ type: "text" as const, text: JSON.stringify(formatted, null, 2) }],
    };
  }
);

const getSectorPerformance = tool(
  "get_sector_performance",
  "Get S&P 500 sector performance (real-time, 1D, 5D, 1M, 3M, YTD, 1Y)",
  emptyShape,
  async () => {
    try {
      const sectors = await fetchSectorPerformance();
      return {
        content: [{ type: "text" as const, text: JSON.stringify(sectors, null, 2) }],
      };
    } catch {
      const portfolio = await buildPortfolioWithPrices();
      const exposure = computeSectorExposure(portfolio);
      return {
        content: [{ type: "text" as const, text: JSON.stringify({ note: "Live sector data unavailable, showing portfolio sector exposure", exposure }, null, 2) }],
      };
    }
  }
);

const getMarketNews = tool(
  "get_market_news",
  "Get latest AI and tech market news headlines",
  { limit: z.number().optional().describe("Number of articles to return (default 10)") },
  async (args) => {
    const news = await fetchTechNews(args.limit || 10);
    const formatted = news.map((a) => ({
      headline: a.headline,
      source: a.source,
      summary: a.summary.slice(0, 200),
      url: a.url,
      datetime: new Date(a.datetime * 1000).toISOString(),
    }));
    return {
      content: [{ type: "text" as const, text: JSON.stringify(formatted, null, 2) }],
    };
  }
);

const getIpoCalendar = tool(
  "get_ipo_calendar",
  "Get upcoming IPOs for the next 3 months",
  emptyShape,
  async () => {
    const ipos = await fetchUpcomingIPOs();
    return {
      content: [{ type: "text" as const, text: JSON.stringify(ipos, null, 2) }],
    };
  }
);

const getConcentrationReport = tool(
  "get_concentration_report",
  "Analyze portfolio concentration risk (HHI, top positions, sector weights, flags)",
  emptyShape,
  async () => {
    const portfolio = await buildPortfolioWithPrices();
    const report = computeConcentration(portfolio);
    return {
      content: [{ type: "text" as const, text: JSON.stringify(report, null, 2) }],
    };
  }
);

const getRebalanceRecommendations = tool(
  "get_rebalance_recommendations",
  "Get actionable rebalancing recommendations (AMZN trim, AI/semis adds, cash deployment, sector rotation)",
  emptyShape,
  async () => {
    const portfolio = await buildPortfolioWithPrices();
    const macroData = await buildMacroData();
    const macroSignals = interpretMacroData(macroData);
    const recommendations = generateRebalanceRecommendations(portfolio, macroSignals);
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({ macroSignals, recommendations }, null, 2),
        },
      ],
    };
  }
);

const getSmartMoney = tool(
  "get_smart_money",
  "Get latest 13F positions of tracked prominent investors (Ackman, Pabrai, Gavin Baker, Coatue, Altimeter, Buffett, etc.): top positions, quarter-over-quarter changes, consensus names, and overlap with the user's holdings",
  emptyShape,
  async () => {
    const data = await buildSmartMoneyData();
    return {
      content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
    };
  }
);

const getRecentSignalsTool = tool(
  "get_recent_signals",
  "Get trade signals you issued in the last N days — check this BEFORE proposing signals to avoid repeating recommendations",
  { days: z.number().optional().describe("Lookback window in days (default 14)") },
  async (args) => {
    const data = await buildRecentSignalsData(args.days || 14);
    return {
      content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
    };
  }
);

const getPreviousBriefingTool = tool(
  "get_previous_briefing",
  "Get a trimmed view of yesterday's briefing — use it to lead with what CHANGED today and avoid repeating prior advice",
  emptyShape,
  async () => {
    const today = new Date().toISOString().split("T")[0];
    const data = await buildPreviousBriefingData(today);
    return {
      content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
    };
  }
);

export const portfolioServer = createSdkMcpServer({
  name: "portfolio-tools",
  version: "1.0.0",
  tools: [
    getPortfolioHoldings,
    getMacroIndicators,
    getSectorPerformance,
    getMarketNews,
    getIpoCalendar,
    getConcentrationReport,
    getRebalanceRecommendations,
    getSmartMoney,
    getRecentSignalsTool,
    getPreviousBriefingTool,
  ],
  alwaysLoad: true,
});
