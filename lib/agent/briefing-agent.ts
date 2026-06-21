import Anthropic from "@anthropic-ai/sdk";
import { readFileSync } from "fs";
import { join } from "path";
import { getHoldings, getLatestMacro, getMacroSeries, getLatestPrices } from "../db";
import { computePortfolio, computeSectorExposure } from "../portfolio";
import { computeConcentration, generateRebalanceRecommendations, interpretMacroData } from "../allocation";
import { fetchTechNews, fetchUpcomingIPOs } from "../apis/finnhub";
import { fetchSectorPerformance } from "../apis/alpha-vantage";
import { FRED_SERIES, type FredSeriesId } from "../apis/fred";
import { BRIEFING_SYSTEM_PROMPT } from "./prompts";
import { buildSmartMoneyData, buildRecentSignalsData, buildPreviousBriefingData } from "./tool-data";
import { getThisWeekEarnings } from "../earnings-calendar";
import { buildMarketHealthData, type DataQuality } from "../market-health";

function loadPortfolioBriefingSkills(): string {
  try {
    return readFileSync(join(process.cwd(), "skills.md"), "utf8");
  } catch (err) {
    console.warn("Unable to load skills.md briefing playbook:", err);
    return "";
  }
}

export interface BriefingOutput {
  date: string;
  dataHealth?: {
    overall: DataQuality | "unknown";
    items: {
      name: string;
      status: DataQuality | "missing" | "stale" | "unknown";
      detail: string;
      updatedAt?: string;
    }[];
    warnings: string[];
  };
  // Delta-focused lead — what is genuinely different vs yesterday's briefing
  whatChanged: {
    summary: string;
    items: string[];
  };
  actionDiscipline?: {
    status: "no_action" | "watch" | "triggered" | "expired" | "blocked";
    summary: string;
    actions: {
      label: string;
      status: "observation" | "watch" | "actionable" | "do_not_act" | "expired" | "blocked";
      trigger?: string;
      detail: string;
    }[];
  };
  // False = nothing crossed a trigger today (position cap, new cash, macro flip)
  allocationTriggered: boolean;
  // Only populated when get_smart_money shows new filings/changes (quarterly)
  smartMoney?: {
    hasNewFilings: boolean;
    highlights: string[];
  };
  // Mon = week-ahead, Fri = week-recap, Tue-Thu = lean (omitted)
  dayOfWeekFlavor?: {
    type: "week-ahead" | "week-recap" | "lean";
    content: string[];
  };
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
  portfolioRiskDashboard?: {
    summary: string;
    exposures: { name: string; value: string; riskLevel?: string; note?: string }[];
    riskFlags: string[];
    scenarios: { scenario: string; potentialImpact: string; watchItem?: string }[];
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
  catalystCalendar?: {
    date: string;
    event: string;
    type: "macro" | "earnings" | "company" | "ipo" | "fed" | "economic" | "other";
    symbols?: string[];
    source?: string;
    confidence: "high" | "medium" | "low";
    portfolioRelevance: string;
  }[];
  thesisLedger?: {
    symbol: string;
    thesis: string;
    status: "active" | "watch" | "strengthening" | "weakening" | "invalidated" | "expired";
    catalyst?: string;
    invalidation?: string;
    nextReview?: string;
    confidence?: "high" | "medium" | "low";
  }[];
  researchBacklog?: {
    topic: string;
    priority: "high" | "medium" | "low";
    reason: string;
    neededEvidence: string;
  }[];
  sourceQuality?: {
    overall: "high" | "medium" | "low" | "mixed";
    notes: string[];
    sources: {
      source: string;
      rating: "primary" | "high" | "medium" | "low";
      use: string;
      url?: string;
    }[];
  };
  tradeSignals: {
    symbol: string;
    companyName?: string;
    action: string;
    actionStatus?: "observation" | "watch" | "actionable" | "do_not_act" | "expired" | "blocked";
    reason: string;
    variantPerception?: string;
    currentPrice?: number | null;
    priceChange1d?: number | null;
    priceChange5d?: number | null;
    signalScore?: number | null;
    signalType?: string;
    triggerReason?: string;
    dataQuality?: DataQuality;
    sourceQuality?: "primary" | "high" | "medium" | "low";
    riskNotes?: string;
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
  get_market_health: async (args) => {
    const symbols = Array.isArray(args.symbols) ? args.symbols.map(String) : undefined;
    const data = await buildMarketHealthData(symbols);
    return JSON.stringify(
      {
        note: "Market data validation layer. Low dataQuality means do not issue confident signals for that ticker.",
        data,
      },
      null,
      2
    );
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
  get_smart_money: async () => {
    const data = await buildSmartMoneyData();
    return JSON.stringify(data, null, 2);
  },
  get_recent_signals: async (args) => {
    const data = await buildRecentSignalsData(Number(args.days) || 14);
    return JSON.stringify(data, null, 2);
  },
  get_previous_briefing: async () => {
    const today = new Date().toISOString().split("T")[0];
    const data = await buildPreviousBriefingData(today);
    return JSON.stringify(data, null, 2);
  },
};

const tools: Anthropic.Tool[] = [
  { name: "get_portfolio_holdings", description: "Get current portfolio holdings with latest prices, weights, and P&L", input_schema: { type: "object" as const, properties: {}, required: [] } },
  { name: "get_macro_indicators", description: "Get latest FRED macro data", input_schema: { type: "object" as const, properties: {}, required: [] } },
  { name: "get_sector_performance", description: "Get S&P 500 sector performance", input_schema: { type: "object" as const, properties: {}, required: [] } },
  { name: "get_market_news", description: "Get latest AI and tech market news", input_schema: { type: "object" as const, properties: { limit: { type: "number", description: "Number of articles (default 10)" } }, required: [] } },
  { name: "get_market_health", description: "Get recent price changes and data-quality checks for portfolio, signal, and benchmark symbols", input_schema: { type: "object" as const, properties: { symbols: { type: "array", items: { type: "string" }, description: "Optional symbols to validate; defaults to tracked portfolio/signals plus SPY/QQQ" } }, required: [] } },
  { name: "get_ipo_calendar", description: "Get upcoming IPOs for the next 3 months", input_schema: { type: "object" as const, properties: {}, required: [] } },
  { name: "get_concentration_report", description: "Analyze portfolio concentration risk", input_schema: { type: "object" as const, properties: {}, required: [] } },
  { name: "get_rebalance_recommendations", description: "Get actionable rebalancing recommendations", input_schema: { type: "object" as const, properties: {}, required: [] } },
  { name: "get_smart_money", description: "Get latest 13F positions of tracked prominent investors (Ackman, Pabrai, Gavin Baker, Coatue, Altimeter, Buffett, etc.): top positions, quarter-over-quarter changes, consensus names, and overlap with the user's holdings", input_schema: { type: "object" as const, properties: {}, required: [] } },
  { name: "get_recent_signals", description: "Get trade signals you issued in the last N days — check this BEFORE proposing signals to avoid repeating recommendations", input_schema: { type: "object" as const, properties: { days: { type: "number", description: "Lookback window in days (default 14)" } }, required: [] } },
  { name: "get_previous_briefing", description: "Get a trimmed view of yesterday's briefing — use it to lead with what CHANGED today and avoid repeating prior advice", input_schema: { type: "object" as const, properties: {}, required: [] } },
];

const REQUIRED_RESEARCH_TOOLS = [
  "get_previous_briefing",
  "get_recent_signals",
  "get_portfolio_holdings",
  "get_macro_indicators",
  "get_sector_performance",
  "get_market_news",
  "get_market_health",
  "get_ipo_calendar",
  "get_concentration_report",
  "get_rebalance_recommendations",
  "get_smart_money",
] as const;

async function buildRequiredResearchContext() {
  const results = await Promise.all(
    REQUIRED_RESEARCH_TOOLS.map(async (name) => {
      const startedAt = Date.now();
      try {
        const args = name === "get_market_news" ? { limit: 15 } : {};
        const content = await toolHandlers[name](args);
        let parsed: unknown = content;
        try {
          parsed = JSON.parse(content);
        } catch {
          // Keep raw text for unexpected non-JSON tool output.
        }
        return {
          tool: name,
          ok: true,
          elapsedMs: Date.now() - startedAt,
          data: parsed,
        };
      } catch (err) {
        return {
          tool: name,
          ok: false,
          elapsedMs: Date.now() - startedAt,
          error: String(err),
        };
      }
    })
  );

  return JSON.stringify(
    {
      note: "Mandatory preloaded research context. Use this first, then call tools again only when you need clarification or fresher detail.",
      generatedAt: new Date().toISOString(),
      results,
    },
    null,
    2
  );
}

export async function generateBriefing(): Promise<BriefingOutput> {
  const today = new Date().toISOString().split("T")[0];

  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY not set");
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const weekday = new Date().toLocaleDateString("en-US", { weekday: "long", timeZone: "America/New_York" });
  const flavorHint =
    weekday === "Monday"
      ? `Today is Monday — include dayOfWeekFlavor type "week-ahead": the setup for the week (key macro releases, this week's earnings for holdings/watchlist, positioning into them). This week's known earnings: ${JSON.stringify(getThisWeekEarnings().map((e) => ({ symbol: e.symbol, date: e.date, whatToWatch: e.whatToWatch.slice(0, 120) })))}`
      : weekday === "Friday"
        ? `Today is Friday — include dayOfWeekFlavor type "week-recap": how the week's calls and themes played out, what resolved, what to watch next week.`
        : `Today is ${weekday} — keep it lean; omit dayOfWeekFlavor.`;

  const requiredResearchContext = await buildRequiredResearchContext();
  const portfolioBriefingSkills = loadPortfolioBriefingSkills();

  const messages: Anthropic.MessageParam[] = [
    {
      role: "user",
      content: `Today is ${today} (${weekday}). Generate my daily market briefing.\n\n${flavorHint}\n\nThe core research has already been preloaded below so the briefing cannot omit required inputs. Treat any failed tool result as a data-availability caveat, not permission to invent missing facts.\n\n<required_research_context>\n${requiredResearchContext}\n</required_research_context>\n\nYou may call the available tools again for clarification. If you do, start with get_previous_briefing and get_recent_signals. Respond with ONLY a JSON object (no preamble, no code fences, no explanation before or after). The JSON must match this schema: { date, dataHealth?: { overall, items: [{name,status,detail,updatedAt?}], warnings: [] }, whatChanged: { summary, items: [] }, actionDiscipline?: { status, summary, actions: [{label,status,trigger?,detail}] }, allocationTriggered: boolean, smartMoney?: { hasNewFilings: boolean, highlights: [] }, dayOfWeekFlavor?: { type: "week-ahead"|"week-recap"|"lean", content: [] }, marketOverview: { summary, indexMoves: [{name, change}] }, newsHeadlines: [{title, source, relevance, url?}], portfolioPerformance: { totalValue, dayChange, dayChangePct, topMovers: [{symbol, changePct}] }, concentrationRisk: { level, hhi, topPosition: {symbol, weight}, recommendations: [] }, portfolioRiskDashboard?: { summary, exposures: [{name,value,riskLevel?,note?}], riskFlags: [], scenarios: [{scenario,potentialImpact,watchItem?}] }, allocationRecommendations: { amznTrim, semisAction, cashDeployment, sectorShifts: [] }, sectorRotation: { bullish: [], bearish: [], signals: [] }, upcomingIpos: [{name, date, sector, relevance}], catalystCalendar?: [{date,event,type,symbols?,source?,confidence,portfolioRelevance}], thesisLedger?: [{symbol,thesis,status,catalyst?,invalidation?,nextReview?,confidence?}], researchBacklog?: [{topic,priority,reason,neededEvidence}], sourceQuality?: { overall, notes: [], sources: [{source,rating,use,url?}] }, tradeSignals: [{symbol, companyName?, action, actionStatus?, reason, variantPerception?, currentPrice?, priceChange1d?, priceChange5d?, signalScore?, signalType?, triggerReason?, dataQuality?, sourceQuality?, riskNotes?, entryRange, targetPrice, stopLoss, timeframe, confidence}], disclaimer }. Keep summaries concise. Limit to top 5 news, top 5 IPOs, top 5 trade signals, top 6 catalysts, top 6 thesis ledger entries, and top 5 research backlog items.`,
    },
  ];

  // Agentic loop — let Claude call tools until it produces the final response
  for (let turn = 0; turn < 15; turn++) {
    console.log(`Briefing agent turn ${turn + 1}...`);

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 16384,
      system: `${BRIEFING_SYSTEM_PROMPT}\n\n## Portfolio Briefing Playbook\n${portfolioBriefingSkills}`,
      tools,
      messages,
    });

    const hasToolUse = response.content.some((b) => b.type === "tool_use");
    const textBlock = response.content.find((b) => b.type === "text");

    // If no tool calls, extract the text response (regardless of stop_reason)
    if (!hasToolUse) {
      if (textBlock && textBlock.type === "text") {
        return parseBriefingResponse(textBlock.text, today);
      }
      throw new Error(`No text or tool_use in response. stop_reason=${response.stop_reason}`);
    }

    // Process tool calls
    {
      messages.push({ role: "assistant", content: response.content });

      // Process each tool call
      const toolResults: Anthropic.ToolResultBlockParam[] = [];
      for (const block of response.content) {
        if (block.type === "tool_use") {
          console.log(`Tool call: ${block.name}`);
          const handler = toolHandlers[block.name];
          if (handler) {
            try {
              const result = await handler(block.input as Record<string, unknown>);
              console.log(`Tool ${block.name} returned ${result.length} chars`);
              toolResults.push({ type: "tool_result", tool_use_id: block.id, content: result });
            } catch (err) {
              console.error(`Tool ${block.name} failed:`, err);
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
  }

  throw new Error(`Agent loop completed without valid output. Total messages: ${messages.length}`);
}

function parseBriefingResponse(text: string, today: string): BriefingOutput {
  let jsonStr = text;

  // Try to extract JSON from markdown code blocks
  const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1];
  }

  // Try to find JSON object in the text
  const objectMatch = jsonStr.match(/\{[\s\S]*\}/);
  if (objectMatch) {
    jsonStr = objectMatch[0];
  }

  try {
    const parsed = JSON.parse(jsonStr.trim()) as BriefingOutput;
    parsed.date = parsed.date || today;
    parsed.disclaimer = parsed.disclaimer || "This is informational only, not financial advice.";
    parsed.tradeSignals = (parsed.tradeSignals || []).map((s) =>
      normalizeTradeSignal(s as unknown as Record<string, unknown>)
    );
    parsed.whatChanged = parsed.whatChanged || { summary: "", items: [] };
    parsed.allocationTriggered = parsed.allocationTriggered ?? true;
    parsed.dataHealth = normalizeDataHealth(parsed.dataHealth as unknown as Record<string, unknown> | undefined);
    parsed.actionDiscipline = normalizeActionDiscipline(parsed.actionDiscipline as unknown as Record<string, unknown> | undefined);
    parsed.portfolioRiskDashboard = normalizePortfolioRiskDashboard(parsed.portfolioRiskDashboard as unknown as Record<string, unknown> | undefined);
    parsed.catalystCalendar = normalizeCatalystCalendar(parsed.catalystCalendar as unknown[]);
    parsed.thesisLedger = normalizeThesisLedger(parsed.thesisLedger as unknown[]);
    parsed.researchBacklog = normalizeResearchBacklog(parsed.researchBacklog as unknown[]);
    parsed.sourceQuality = normalizeSourceQuality(parsed.sourceQuality as unknown as Record<string, unknown> | undefined);
    return parsed;
  } catch {
    // If JSON parsing fails, return a briefing with the raw text as summary
    console.error("Failed to parse briefing JSON. Raw text:", text.slice(0, 500));
    return {
      ...fallbackBriefing(today),
      marketOverview: { summary: text.slice(0, 1000), indexMoves: [] },
    };
  }
}

// The model sometimes emits the signal thesis under a different key (thesis/rationale/
// variantPerception) — coerce to `reason` so the email never renders "undefined".
function normalizeTradeSignal(s: Record<string, unknown>): BriefingOutput["tradeSignals"][number] {
  const dataQuality = normalizeDataQuality(s.dataQuality ?? s.data_quality);
  const action = String(s.action ?? "");
  const actionStatus = normalizeActionStatus(s.actionStatus ?? s.action_status ?? s.status, action, dataQuality);
  return {
    symbol: String(s.symbol ?? ""),
    companyName: optionalString(s.companyName ?? s.company_name),
    action,
    actionStatus,
    reason: String(s.reason ?? s.thesis ?? s.rationale ?? s.variantPerception ?? ""),
    variantPerception: optionalString(s.variantPerception ?? s.variant_perception ?? s.marketMispricing ?? s.market_mispricing),
    currentPrice: optionalNumber(s.currentPrice ?? s.current_price),
    priceChange1d: optionalNumber(s.priceChange1d ?? s.price_change_1d),
    priceChange5d: optionalNumber(s.priceChange5d ?? s.price_change_5d),
    signalScore: optionalNumber(s.signalScore ?? s.signal_score),
    signalType: optionalString(s.signalType ?? s.signal_type),
    triggerReason: optionalString(s.triggerReason ?? s.trigger_reason),
    dataQuality,
    sourceQuality: normalizeSignalSourceQuality(s.sourceQuality ?? s.source_quality),
    riskNotes: optionalString(s.riskNotes ?? s.risk_notes),
    entryRange: String(s.entryRange ?? ""),
    targetPrice: String(s.targetPrice ?? ""),
    stopLoss: String(s.stopLoss ?? ""),
    timeframe: String(s.timeframe ?? ""),
    confidence: String(s.confidence ?? "medium"),
  };
}

function optionalString(v: unknown): string | undefined {
  if (v === null || v === undefined || v === "") return undefined;
  return String(v);
}

function optionalNumber(v: unknown): number | null | undefined {
  if (v === null || v === undefined || v === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function normalizeDataQuality(v: unknown): DataQuality | undefined {
  const q = String(v ?? "").toLowerCase();
  if (q === "high" || q === "medium" || q === "low") return q;
  return undefined;
}

function normalizeDataHealth(v: Record<string, unknown> | undefined): BriefingOutput["dataHealth"] | undefined {
  if (!v) return undefined;
  const items = Array.isArray(v.items)
    ? v.items.map((item) => {
        const obj = asRecord(item);
        return {
          name: String(obj.name ?? ""),
          status: normalizeDataHealthStatus(obj.status),
          detail: String(obj.detail ?? ""),
          updatedAt: optionalString(obj.updatedAt ?? obj.updated_at),
        };
      }).filter((item) => item.name || item.detail)
    : [];
  return {
    overall: normalizeOverallDataQuality(v.overall),
    items,
    warnings: toStringArray(v.warnings),
  };
}

function normalizeActionDiscipline(v: Record<string, unknown> | undefined): BriefingOutput["actionDiscipline"] | undefined {
  if (!v) return undefined;
  const actions = Array.isArray(v.actions)
    ? v.actions.map((item) => {
        const obj = asRecord(item);
        return {
          label: String(obj.label ?? obj.name ?? ""),
          status: normalizeActionStatus(obj.status),
          trigger: optionalString(obj.trigger),
          detail: String(obj.detail ?? obj.reason ?? ""),
        };
      }).filter((item) => item.label || item.detail)
    : [];
  return {
    status: normalizeActionDisciplineStatus(v.status),
    summary: String(v.summary ?? ""),
    actions,
  };
}

function normalizePortfolioRiskDashboard(v: Record<string, unknown> | undefined): BriefingOutput["portfolioRiskDashboard"] | undefined {
  if (!v) return undefined;
  const exposures = Array.isArray(v.exposures)
    ? v.exposures.map((item) => {
        const obj = asRecord(item);
        return {
          name: String(obj.name ?? ""),
          value: String(obj.value ?? ""),
          riskLevel: optionalString(obj.riskLevel ?? obj.risk_level),
          note: optionalString(obj.note),
        };
      }).filter((item) => item.name || item.value)
    : [];
  const scenarios = Array.isArray(v.scenarios)
    ? v.scenarios.map((item) => {
        const obj = asRecord(item);
        return {
          scenario: String(obj.scenario ?? ""),
          potentialImpact: String(obj.potentialImpact ?? obj.potential_impact ?? obj.impact ?? ""),
          watchItem: optionalString(obj.watchItem ?? obj.watch_item),
        };
      }).filter((item) => item.scenario || item.potentialImpact)
    : [];
  return {
    summary: String(v.summary ?? ""),
    exposures,
    riskFlags: toStringArray(v.riskFlags ?? v.risk_flags),
    scenarios,
  };
}

function normalizeCatalystCalendar(v: unknown[] | undefined): BriefingOutput["catalystCalendar"] {
  if (!Array.isArray(v)) return [];
  return v.map((item) => {
    const obj = asRecord(item);
    return {
      date: String(obj.date ?? ""),
      event: String(obj.event ?? ""),
      type: normalizeCatalystType(obj.type),
      symbols: toStringArray(obj.symbols),
      source: optionalString(obj.source),
      confidence: normalizeConfidence(obj.confidence),
      portfolioRelevance: String(obj.portfolioRelevance ?? obj.portfolio_relevance ?? obj.relevance ?? ""),
    };
  }).filter((item) => item.date || item.event || item.portfolioRelevance);
}

function normalizeThesisLedger(v: unknown[] | undefined): BriefingOutput["thesisLedger"] {
  if (!Array.isArray(v)) return [];
  return v.map((item) => {
    const obj = asRecord(item);
    return {
      symbol: String(obj.symbol ?? ""),
      thesis: String(obj.thesis ?? ""),
      status: normalizeThesisStatus(obj.status),
      catalyst: optionalString(obj.catalyst),
      invalidation: optionalString(obj.invalidation),
      nextReview: optionalString(obj.nextReview ?? obj.next_review),
      confidence: normalizeConfidence(obj.confidence),
    };
  }).filter((item) => item.symbol || item.thesis);
}

function normalizeResearchBacklog(v: unknown[] | undefined): BriefingOutput["researchBacklog"] {
  if (!Array.isArray(v)) return [];
  return v.map((item) => {
    const obj = asRecord(item);
    return {
      topic: String(obj.topic ?? ""),
      priority: normalizePriority(obj.priority),
      reason: String(obj.reason ?? ""),
      neededEvidence: String(obj.neededEvidence ?? obj.needed_evidence ?? obj.evidence ?? ""),
    };
  }).filter((item) => item.topic || item.reason || item.neededEvidence);
}

function normalizeSourceQuality(v: Record<string, unknown> | undefined): BriefingOutput["sourceQuality"] | undefined {
  if (!v) return undefined;
  const sources = Array.isArray(v.sources)
    ? v.sources.map((item) => {
        const obj = asRecord(item);
        return {
          source: String(obj.source ?? ""),
          rating: normalizeSourceRating(obj.rating),
          use: String(obj.use ?? obj.usage ?? ""),
          url: optionalString(obj.url),
        };
      }).filter((item) => item.source || item.use)
    : [];
  return {
    overall: normalizeOverallSourceQuality(v.overall),
    notes: toStringArray(v.notes),
    sources,
  };
}

function asRecord(v: unknown): Record<string, unknown> {
  return typeof v === "object" && v !== null ? (v as Record<string, unknown>) : {};
}

function toStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((item) => item !== null && item !== undefined && item !== "").map(String);
}

function normalizeOverallDataQuality(v: unknown): DataQuality | "unknown" {
  const q = normalizeDataQuality(v);
  return q || "unknown";
}

function normalizeDataHealthStatus(v: unknown): DataQuality | "missing" | "stale" | "unknown" {
  const q = normalizeDataQuality(v);
  if (q) return q;
  const status = String(v ?? "").toLowerCase();
  if (status === "missing" || status === "stale") return status;
  return "unknown";
}

function normalizeActionDisciplineStatus(v: unknown): NonNullable<BriefingOutput["actionDiscipline"]>["status"] {
  const status = String(v ?? "").toLowerCase().replace(/ /g, "_");
  if (status === "no_action" || status === "watch" || status === "triggered" || status === "expired" || status === "blocked") return status;
  return "watch";
}

function normalizeActionStatus(
  v: unknown,
  action = "",
  dataQuality?: DataQuality
): NonNullable<BriefingOutput["actionDiscipline"]>["actions"][number]["status"] {
  const status = String(v ?? "").toLowerCase().replace(/ /g, "_");
  if (status === "observation" || status === "watch" || status === "actionable" || status === "do_not_act" || status === "expired" || status === "blocked") return status;
  if (dataQuality === "low") return "watch";
  const a = action.toLowerCase();
  if (["buy", "add", "trim", "sell", "exit", "initiate"].some((word) => a.includes(word))) return "actionable";
  if (["avoid", "do not"].some((word) => a.includes(word))) return "do_not_act";
  if (["research", "watch"].some((word) => a.includes(word))) return "watch";
  return "observation";
}

function normalizeSignalSourceQuality(v: unknown): NonNullable<BriefingOutput["tradeSignals"][number]["sourceQuality"]> | undefined {
  const rating = normalizeSourceRating(v);
  return rating === "primary" || rating === "high" || rating === "medium" || rating === "low" ? rating : undefined;
}

function normalizeSourceRating(v: unknown): "primary" | "high" | "medium" | "low" {
  const rating = String(v ?? "").toLowerCase();
  if (rating === "primary" || rating === "high" || rating === "medium" || rating === "low") return rating;
  return "medium";
}

function normalizeOverallSourceQuality(v: unknown): "high" | "medium" | "low" | "mixed" {
  const rating = String(v ?? "").toLowerCase();
  if (rating === "high" || rating === "medium" || rating === "low" || rating === "mixed") return rating;
  return "mixed";
}

function normalizeCatalystType(v: unknown): NonNullable<BriefingOutput["catalystCalendar"]>[number]["type"] {
  const type = String(v ?? "").toLowerCase();
  if (type === "macro" || type === "earnings" || type === "company" || type === "ipo" || type === "fed" || type === "economic" || type === "other") return type;
  return "other";
}

function normalizeThesisStatus(v: unknown): NonNullable<BriefingOutput["thesisLedger"]>[number]["status"] {
  const status = String(v ?? "").toLowerCase();
  if (status === "active" || status === "watch" || status === "strengthening" || status === "weakening" || status === "invalidated" || status === "expired") return status;
  return "watch";
}

function normalizeConfidence(v: unknown): "high" | "medium" | "low" {
  const confidence = String(v ?? "").toLowerCase();
  if (confidence === "high" || confidence === "medium" || confidence === "low") return confidence;
  return "medium";
}

function normalizePriority(v: unknown): "high" | "medium" | "low" {
  const priority = String(v ?? "").toLowerCase();
  if (priority === "high" || priority === "medium" || priority === "low") return priority;
  return "medium";
}

function fallbackBriefing(today: string): BriefingOutput {
  return {
    date: today,
    whatChanged: { summary: "", items: [] },
    allocationTriggered: false,
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
