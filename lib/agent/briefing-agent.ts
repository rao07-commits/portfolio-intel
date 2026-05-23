import { query } from "@anthropic-ai/claude-agent-sdk";
import { portfolioServer } from "./tools";
import { BRIEFING_SYSTEM_PROMPT, BRIEFING_PROMPT } from "./prompts";

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

export async function generateBriefing(): Promise<BriefingOutput> {
  const today = new Date().toISOString().split("T")[0];

  const q = query({
    prompt: BRIEFING_PROMPT(today),
    options: {
      systemPrompt: BRIEFING_SYSTEM_PROMPT,
      model: "claude-sonnet-4-6",
      maxTurns: 15,
      tools: [], // Disable built-in tools
      mcpServers: {
        "portfolio-tools": portfolioServer,
      },
      permissionMode: "bypassPermissions",
      allowDangerouslySkipPermissions: true,
    },
  });

  let lastTextContent = "";

  for await (const message of q) {
    // Collect the final assistant text response
    if (message.type === "assistant" && message.message?.content) {
      for (const block of message.message.content) {
        if (block.type === "text") {
          lastTextContent = block.text;
        }
      }
    }
  }

  // Parse the JSON from the agent's response
  // The agent may wrap it in markdown code blocks
  let jsonStr = lastTextContent;
  const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1];
  }

  try {
    return JSON.parse(jsonStr.trim()) as BriefingOutput;
  } catch {
    // If parsing fails, create a minimal briefing with the raw text
    return {
      date: today,
      marketOverview: { summary: lastTextContent.slice(0, 500), indexMoves: [] },
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
}
