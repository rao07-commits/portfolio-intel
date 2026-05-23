import { PortfolioSummary, computeSectorExposure, SectorExposure } from "./portfolio";

// --- Target Allocation ---

export const TARGET_ALLOCATION: Record<string, number> = {
  technology: 30,         // Mega-cap tech + semis
  broad_market: 20,       // Index / diversified
  communication_services: 10,
  consumer_discretionary: 5,
  international: 10,
  financials: 5,
  commodities: 5,         // Gold, etc.
  crypto: 5,
  cash: 10,
};

// --- Concentration Risk ---

export interface ConcentrationReport {
  hhi: number;                      // Herfindahl-Hirschman Index (0-10000)
  riskLevel: "low" | "moderate" | "high" | "extreme";
  topPosition: { symbol: string; weight: number } | null;
  sectorConcentration: SectorExposure[];
  flags: string[];
}

export function computeConcentration(portfolio: PortfolioSummary): ConcentrationReport {
  const flags: string[] = [];

  // HHI: sum of squared weights
  const hhi = portfolio.holdings.reduce((sum, h) => sum + h.weight * h.weight, 0);

  // Top position check
  const top = portfolio.holdings[0] || null;
  if (top && top.weight > 25) {
    flags.push(`${top.symbol} is ${top.weight.toFixed(1)}% of portfolio — target max 15%`);
  }

  // Sector concentration
  const sectors = computeSectorExposure(portfolio);
  for (const s of sectors) {
    if (s.sector !== "cash" && s.sector !== "broad_market" && s.weight > 40) {
      flags.push(`${s.label} sector at ${s.weight.toFixed(1)}% — consider diversifying`);
    }
  }

  // Cash drag
  const cashSector = sectors.find((s) => s.sector === "cash");
  if (cashSector && cashSector.weight > 15) {
    flags.push(`Cash at ${cashSector.weight.toFixed(1)}% — consider deploying into underweight sectors`);
  }

  let riskLevel: ConcentrationReport["riskLevel"] = "low";
  if (hhi > 2500) riskLevel = "extreme";
  else if (hhi > 1500) riskLevel = "high";
  else if (hhi > 1000) riskLevel = "moderate";

  return {
    hhi,
    riskLevel,
    topPosition: top ? { symbol: top.symbol, weight: top.weight } : null,
    sectorConcentration: sectors,
    flags,
  };
}

// --- Rebalancing Recommendations ---

export interface RebalanceAction {
  type: "trim" | "add" | "deploy_cash" | "ipo_reserve" | "rotate";
  symbol?: string;
  sector?: string;
  reason: string;
  urgency: "low" | "medium" | "high";
  suggestedPct?: number; // % of portfolio to allocate/trim
}

export function generateRebalanceRecommendations(
  portfolio: PortfolioSummary,
  macroSignals?: MacroSignals
): RebalanceAction[] {
  const actions: RebalanceAction[] = [];
  const sectors = computeSectorExposure(portfolio);

  // 1. AMZN divestiture pacing
  const amzn = portfolio.holdings.find((h) => h.symbol === "AMZN");
  if (amzn && amzn.weight > 15) {
    const trimPct = Math.min(5, amzn.weight - 15); // Trim at most 5% per cycle
    actions.push({
      type: "trim",
      symbol: "AMZN",
      reason: `AMZN at ${amzn.weight.toFixed(1)}% — trim ${trimPct.toFixed(1)}% toward 15% target. Pace over multiple months for tax efficiency.`,
      urgency: amzn.weight > 30 ? "high" : "medium",
      suggestedPct: trimPct,
    });
  }

  // 2. AI/Semis underweight detection
  const aiSemisSymbols = ["NVDA", "MU", "AMD", "AVGO", "TSM", "SMCI"];
  const aiSemisWeight = portfolio.holdings
    .filter((h) => aiSemisSymbols.includes(h.symbol))
    .reduce((sum, h) => sum + h.weight, 0);

  if (aiSemisWeight < 15) {
    actions.push({
      type: "add",
      sector: "technology",
      reason: `AI/Semis exposure at ${aiSemisWeight.toFixed(1)}% — consider adding to NVDA, MU, or broad semis ETF (SMH/SOXX) toward 15% target.`,
      urgency: "high",
      suggestedPct: 15 - aiSemisWeight,
    });
  }

  // 3. Cash deployment
  const cashHolding = portfolio.holdings.find((h) => h.asset_type === "cash");
  if (cashHolding && cashHolding.weight > 15) {
    // Find underweight sectors
    const underweight = sectors
      .filter((s) => {
        const target = TARGET_ALLOCATION[s.sector] || 0;
        return target > 0 && s.weight < target - 3;
      })
      .map((s) => `${s.label} (${s.weight.toFixed(0)}% vs ${TARGET_ALLOCATION[s.sector]}% target)`);

    actions.push({
      type: "deploy_cash",
      reason: `Cash at ${cashHolding.weight.toFixed(1)}%. DCA into underweight sectors: ${underweight.join(", ") || "broad market index"}.`,
      urgency: "medium",
      suggestedPct: cashHolding.weight - 10, // Deploy down to 10% cash
    });
  }

  // 4. IPO set-aside
  const currentIpoReserve = portfolio.holdings
    .filter((h) => h.symbol.startsWith("IPO_"))
    .reduce((sum, h) => sum + h.weight, 0);

  if (currentIpoReserve < 2) {
    actions.push({
      type: "ipo_reserve",
      reason: "Reserve 2-3% of portfolio for upcoming AI/tech IPOs. Deploy from cash or AMZN trim proceeds.",
      urgency: "low",
      suggestedPct: 2 - currentIpoReserve,
    });
  }

  // 5. Macro-driven sector rotation
  if (macroSignals) {
    if (macroSignals.yieldCurveSteepening) {
      actions.push({
        type: "rotate",
        sector: "financials",
        reason: "Yield curve steepening — favorable for financials and cyclicals.",
        urgency: "medium",
      });
    }
    if (macroSignals.cpiFalling) {
      actions.push({
        type: "rotate",
        sector: "technology",
        reason: "CPI declining — favors growth/tech as rate cut expectations increase.",
        urgency: "medium",
      });
    }
    if (macroSignals.unemploymentRising) {
      actions.push({
        type: "rotate",
        reason: "Unemployment rising — consider adding defensive sectors (healthcare, utilities, staples).",
        urgency: "high",
      });
    }
    if (macroSignals.consumerSentimentFalling) {
      actions.push({
        type: "rotate",
        reason: "Consumer sentiment declining — reduce consumer discretionary exposure.",
        urgency: "medium",
      });
    }
  }

  // 6. Sector over/underweight
  for (const s of sectors) {
    const target = TARGET_ALLOCATION[s.sector];
    if (!target) continue;
    if (s.weight > target + 10) {
      actions.push({
        type: "trim",
        sector: s.sector,
        reason: `${s.label} overweight: ${s.weight.toFixed(1)}% vs ${target}% target.`,
        urgency: "medium",
      });
    }
  }

  return actions.sort((a, b) => {
    const urgencyOrder = { high: 0, medium: 1, low: 2 };
    return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
  });
}

// --- Macro Signal Interpretation ---

export interface MacroSignals {
  yieldCurveSteepening: boolean;
  cpiFalling: boolean;
  unemploymentRising: boolean;
  consumerSentimentFalling: boolean;
  fedFundsDirection: "rising" | "falling" | "flat";
  inflationAboveTarget: boolean;
}

export function interpretMacroData(
  latestMacro: Record<string, { date: string; value: number }[]>
): MacroSignals {
  const getDirection = (series: { date: string; value: number }[]): "rising" | "falling" | "flat" => {
    if (!series || series.length < 2) return "flat";
    const recent = series[0].value;
    const prior = series[Math.min(2, series.length - 1)].value;
    const change = ((recent - prior) / Math.abs(prior || 1)) * 100;
    if (change > 1) return "rising";
    if (change < -1) return "falling";
    return "flat";
  };

  const latest = (id: string) => latestMacro[id]?.[0]?.value ?? 0;

  return {
    yieldCurveSteepening: getDirection(latestMacro["T10Y2Y"]) === "rising",
    cpiFalling: getDirection(latestMacro["CPIAUCSL"]) === "falling",
    unemploymentRising: getDirection(latestMacro["UNRATE"]) === "rising",
    consumerSentimentFalling: getDirection(latestMacro["UMCSENT"]) === "falling",
    fedFundsDirection: getDirection(latestMacro["FEDFUNDS"]),
    inflationAboveTarget: latest("CPIAUCSL") > 2.5,
  };
}
