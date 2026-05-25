import Anthropic from "@anthropic-ai/sdk";
import { getHoldings, getLatestMacro, getMacroSeries, getLatestPrices } from "../db";
import { computePortfolio, computeSectorExposure } from "../portfolio";
import { computeConcentration, generateRebalanceRecommendations, interpretMacroData } from "../allocation";
import { fetchTechNews, fetchUpcomingIPOs } from "../apis/finnhub";
import { fetchSectorPerformance } from "../apis/alpha-vantage";
import { FRED_SERIES, type FredSeriesId } from "../apis/fred";
import { BRIEFING_SYSTEM_PROMPT } from "./prompts";

export interface BriefingOutput {
  date: string;
  marketOverview: {
    summary: string;
    indexMoves: { name: string; change: string }[];
  };
  newsHeadlines: {
    title: string;
    source: string;
    relevance: string;
    url?: string;
  }[];
  portfolioPerformance: {
    totalValue: number;
    dayChange: number;
    dayChangePct: number;
    topMovers: { symbol: string; changePct: number }[];
  };
  concentrationRisk: {
    level: string;
    hhi: number;
    topPosition: { symbol: string; weight: number };
    recommendations: string[];
  };
  allocationRecommendations: {
    amznTrim: string;
    semisAction: string;
    cashDeployment: string;
    sectorShifts: string[];
  };
  sectorRotation: {
    bullish: string[];
    bearish: string[];
    signals: string[];
  };
  upcomingIpos: {
    name: string;
    date: string;
    sector: string;
    relevance: string;
  }[];
  tradeSignals: {
    symbol: string;
    action: string;
    reason: string;
    entryRange: string;
    targetPrice: string;
    stopLoss: string;
    timeframe: string;
    confidence: string;
  }[];
  disclaimer: string;
}

// Tool handlers — same logic as the MCP tools, but called directly
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

const toolHandlers: Record<string, (args: Record<string, unknown>) => Promise<string>> = {
  get_portfolio_holdings: async () => {
    const portfolio = await buildPortfolioWithPrices();
    return JSON.stringify(portfolio, null, 2);
  },
  get_macro_indicators: async () => {
    const latest = await getLatestMacro();
    const seriesLabels = FRED_SERIES as Record<string, string>;
    const formatted = latest.map((row) => ({
      series: row.series_id,
      label: seriesLabels[row.series_id] || row.series_id,
      date: row.date,
      value: row.value,
    }));
    return JSON.stringify(formatted, null, 2);
  },
  get_sector_performance: async () => {
    try {
      const sectors = await fetchSectorPerformance();
      return JSON.stringify(sectors, null, 2);
    } catch {
      const portfolio = await buildPortfolioWithPrices();
      const exposure = computeSectorExposure(portfolio);
      return JSON.stringify({ note: "Live sector data unavailable", exposure }, null, 2);
    }
  },
  get_market_news: async (args) => {
    const news = await fetchTechNews(Number(args.limit) || 10);
    const formatted = news.map((a) => ({
      headline: a.headline,
      source: a.source,
      summary: a.summary.slice(0, 200),
      url: a.url,
      datetime: new Date(a.datetime * 1000).toISOString(),
    }));
    return JSON.stringify(formatted, null, 2);
  },
  get_ipo_calendar: async () => {
    const ipos = await fetchUpcomingIPOs();
    return JSON.stringify(ipos, null, 2);
  },
  get_concentration_report: async () => {
    const portfolio = await buildPortfolioWithPrices();
    const report = computeConcentration(portfolio);
    return JSON.stringify(report, null, 2);
  },
  get_rebalance_recommendations: async () => {
    const portfolio = await buildPortfolioWithPrices();
    const macroData = await buildMacroData();
    const macroSignals = interpretMacroData(macroData);
    const recommendations = generateRebalanceRecommendations(portfolio, macroSignals);
    return JSON.stringify({ macroSignals, recommendations }, null, 2);
  },
};

const tools: Anthropic.Tool[] = [
  { name: "get_portfolio_holdings", description: "Get current portfolio holdings with latest prices, weights, and P&L", input_schema: { type: "object" as const, properties: {}, required: [] } },
  { name: "get_macro_indicators", description: "Get latest FRED macro data", input_schema: { type: "object" as const, properties: {}, required: [] } },
  { name: "get_sector_performance", description: "Get S&P 500 sector performance", input_schema: { type: "object" as const, properties: {}, required: [] } },
  { name: "get_market_news", description: "Get latest AI and tech market news", input_schema: { type: "object" as const, properties: { limit: { type: "number", description: "Number of articles (default 10)" } }, required: [] } },
  { name: "get_ipo_calendar", description: "Get upcoming IPOs for the next 3 months", input_schema: { type: "object" as const, properties: {}, required: [] } },
  { name: "get_concentration_report", description: "Analyze portfolio concentration risk", input_schema: { type: "object" as const, properties: {}, required: [] } },
  { name: "get_rebalance_recommendations", description: "Get actionable rebalancing recommendations", input_schema: { type: "object" as const, properties: {}, required: [] } },
];

export async function generateBriefing(): Promise<BriefingOutput> {
  const today = new Date().toISOString().split("T")[0];
  const client = new Anthropic();

  const messages: Anthropic.MessageParam[] = [
    {
      role: "user",
      content: `Today is ${today}. Generate my daily market briefing.\n\nUse the available tools to gather data, then produce a comprehensive briefing as JSON matching the BriefingOutput schema with these sections: marketOverview, newsHeadlines, portfolioPerformance, concentrationRisk, allocationRecommendations, sectorRotation, upcomingIpos, tradeSignals, disclaimer.`,
    },
  ];

  // Agentic loop — let Claude call tools until it produces the final response
  for (let turn = 0; turn < 15; turn++) {
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      system: BRIEFING_SYSTEM_PROMPT,
      tools,
      messages,
    });

    // If stop reason is "end_turn", extract the text response
    if (response.stop_reason === "end_turn") {
      const textBlock = response.content.find((b) => b.type === "text");
      if (textBlock && textBlock.type === "text") {
        return parseBriefingResponse(textBlock.text, today);
      }
      break;
    }

    // If stop reason is "tool_use", process tool calls
    if (response.stop_reason === "tool_use") {
      // Add assistant message with tool use blocks
      messages.push({ role: "assistant", content: response.content });

      // Process each tool call
      const toolResults: Anthropic.ToolResultBlockParam[] = [];
      for (const block of response.content) {
        if (block.type === "tool_use") {
          const handler = toolHandlers[block.name];
          if (handler) {
            try {
              const result = await handler(block.input as Record<string, unknown>);
              toolResults.push({ type: "tool_result", tool_use_id: block.id, content: result });
            } catch (err) {
              toolResults.push({ type: "tool_result", tool_use_id: block.id, content: `Error: ${err}`, is_error: true });
            }
          } else {
            toolResults.push({ type: "tool_result", tool_use_id: block.id, content: `Unknown tool: ${block.name}`, is_error: true });
          }
        }
      }

      messages.push({ role: "user", content: toolResults });
      continue;
    }

    break;
  }

  // Fallback: if we get here without a proper response, return a minimal briefing
  return fallbackBriefing(today);
}

function parseBriefingResponse(text: string, today: string): BriefingOutput {
  let jsonStr = text;
  const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1];
  }

  try {
    return JSON.parse(jsonStr.trim()) as BriefingOutput;
  } catch {
    return { ...fallbackBriefing(today), marketOverview: { summary: text.slice(0, 500), indexMoves: [] } };
  }
}

function fallbackBriefing(today: string): BriefingOutput {
  return {
    date: today,
    marketOverview: { summary: "Briefing generation incomplete.", indexMoves: [] },
    newsHeadlines: [],
    portfolioPerformance: { totalValue: 0, dayChange: 0, dayChangePct: 0, topMovers: [] },
    concentrationRisk: { level: "unknown", hhi: 0, topPosition: { symbol: "", weight: 0 }, recommendations: [] },
    allocationRecommendations: { amznTrim: "", semisAction: "", cashDeployment: "", sectorShifts: [] },
    sectorRotation: { bullish: [], bearish: [], signals: [] },
    upcomingIpos: [],
    tradeSignals: [],
    disclaimer: "This is informational only, not financial advice.",
  };
}
