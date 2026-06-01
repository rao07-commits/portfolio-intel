export interface EarningsEvent {
  symbol: string;
  name: string;
  date: string; // YYYY-MM-DD
  timing: "BMO" | "AMC" | "TBD"; // before market open / after market close
  epsEstimate: number | null;
  revenueEstimate: string | null; // e.g. "$35.2B"
  category: "portfolio" | "watchlist" | "ai-adopter";
  significance: "high" | "medium" | "low";
  whatToWatch: string;
}

// This would ideally be fetched from Finnhub's earnings calendar API
// For now, hardcoded for current and next week — updated weekly
export function getUpcomingEarnings(): EarningsEvent[] {
  // Approximate earnings dates for holdings and watchlist
  // These need to be updated as actual dates are announced
  return [
    // Portfolio holdings — approximate next earnings dates
    {
      symbol: "NVDA", name: "NVIDIA", date: "2026-08-20", timing: "AMC",
      epsEstimate: 1.05, revenueEstimate: "$45B",
      category: "portfolio", significance: "high",
      whatToWatch: "Blackwell GPU ramp progress, data center revenue growth rate, HBM memory demand commentary. Any guidance on custom silicon competition from AVGO/MRVL.",
    },
    {
      symbol: "CRWD", name: "CrowdStrike", date: "2026-06-03", timing: "AMC",
      epsEstimate: 1.12, revenueEstimate: "$1.1B",
      category: "portfolio", significance: "high",
      whatToWatch: "ARR growth rate, module adoption (Falcon platform expansion), AI-native threat detection metrics. Customer adds post-outage recovery.",
    },
    {
      symbol: "APP", name: "AppLovin", date: "2026-08-06", timing: "AMC",
      epsEstimate: 1.85, revenueEstimate: "$1.4B",
      category: "portfolio", significance: "medium",
      whatToWatch: "AXON AI engine performance, e-commerce advertising growth, margin expansion from AI optimization of ad spend.",
    },
    {
      symbol: "MU", name: "Micron Technology", date: "2026-06-25", timing: "AMC",
      epsEstimate: 2.15, revenueEstimate: "$9.5B",
      category: "portfolio", significance: "high",
      whatToWatch: "HBM3E revenue and ASP guidance, NVDA Blackwell HBM attach rate commentary, memory pricing trajectory. Just hit $1T market cap — earnings must validate.",
    },

    // Watchlist / AI Adopter earnings
    {
      symbol: "JPM", name: "JPMorgan Chase", date: "2026-07-11", timing: "BMO",
      epsEstimate: 4.85, revenueEstimate: "$44B",
      category: "ai-adopter", significance: "high",
      whatToWatch: "AI efficiency ratio improvement, tech spend as % of revenue, IndexGPT/AI trading commentary. Jamie Dimon's macro outlook.",
    },
    {
      symbol: "WMT", name: "Walmart", date: "2026-08-15", timing: "BMO",
      epsEstimate: 0.65, revenueEstimate: "$170B",
      category: "ai-adopter", significance: "medium",
      whatToWatch: "Walmart Connect (ad revenue) growth rate, inventory shrinkage improvement from AI, e-commerce margin trend.",
    },
    {
      symbol: "CAT", name: "Caterpillar", date: "2026-07-29", timing: "BMO",
      epsEstimate: 5.50, revenueEstimate: "$17B",
      category: "ai-adopter", significance: "medium",
      whatToWatch: "Services/aftermarket revenue as % of total (AI maintenance contracts), autonomous fleet deployment updates, Cat Digital connected assets growth.",
    },
    {
      symbol: "DE", name: "Deere & Company", date: "2026-08-20", timing: "BMO",
      epsEstimate: 6.80, revenueEstimate: "$12B",
      category: "ai-adopter", significance: "medium",
      whatToWatch: "See & Spray adoption metrics, precision ag software attach rate, autonomous tractor commercial deployment timeline.",
    },
    {
      symbol: "PGR", name: "Progressive", date: "2026-07-16", timing: "AMC",
      epsEstimate: 3.25, revenueEstimate: "$18B",
      category: "ai-adopter", significance: "medium",
      whatToWatch: "Combined ratio vs. industry average (~98%). If PGR sustains <92%, it proves the AI pricing moat. Snapshot telematics enrollment growth.",
    },
    {
      symbol: "TMUS", name: "T-Mobile US", date: "2026-07-24", timing: "BMO",
      epsEstimate: 2.45, revenueEstimate: "$21B",
      category: "ai-adopter", significance: "medium",
      whatToWatch: "Postpaid phone net adds vs. AT&T/Verizon, AI customer service cost savings, IntentCX deployment metrics.",
    },

    // Trade signal names
    {
      symbol: "AVGO", name: "Broadcom", date: "2026-06-12", timing: "AMC",
      epsEstimate: 1.52, revenueEstimate: "$15B",
      category: "watchlist", significance: "high",
      whatToWatch: "Custom AI ASIC revenue (Google TPU, Meta), VMware integration margin, AI networking revenue. Critical for the 'custom silicon vs. NVDA GPU' thesis.",
    },
    {
      symbol: "VRT", name: "Vertiv Holdings", date: "2026-07-23", timing: "BMO",
      epsEstimate: 0.85, revenueEstimate: "$2.2B",
      category: "watchlist", significance: "high",
      whatToWatch: "Order backlog growth, liquid cooling revenue mix, data center thermal management pricing power. The 'physical constraint of AI' thesis validation.",
    },
    {
      symbol: "MRVL", name: "Marvell Technology", date: "2026-06-05", timing: "AMC",
      epsEstimate: 0.62, revenueEstimate: "$1.8B",
      category: "watchlist", significance: "high",
      whatToWatch: "Custom silicon backlog (Amazon Trainium, Google), AI networking/coherent optics revenue, data center revenue as % of total.",
    },
    {
      symbol: "ANET", name: "Arista Networks", date: "2026-07-28", timing: "AMC",
      epsEstimate: 2.35, revenueEstimate: "$1.9B",
      category: "watchlist", significance: "high",
      whatToWatch: "AI networking revenue (GPU cluster Ethernet switching), hyperscaler order book commentary, 400G/800G switch adoption rate.",
    },
    {
      symbol: "CEG", name: "Constellation Energy", date: "2026-08-01", timing: "BMO",
      epsEstimate: 2.80, revenueEstimate: "$6.5B",
      category: "watchlist", significance: "medium",
      whatToWatch: "Data center PPA (power purchase agreement) announcements, nuclear plant uptime, energy pricing in PJM market. AI power demand narrative.",
    },
  ];
}

export function getThisWeekEarnings(): EarningsEvent[] {
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay() + 1); // Monday
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6); // Sunday

  return getUpcomingEarnings().filter(e => {
    const d = new Date(e.date);
    return d >= weekStart && d <= weekEnd;
  });
}

export function getNextWeekEarnings(): EarningsEvent[] {
  const now = new Date();
  const nextMonday = new Date(now);
  nextMonday.setDate(now.getDate() - now.getDay() + 8);
  const nextSunday = new Date(nextMonday);
  nextSunday.setDate(nextMonday.getDate() + 6);

  return getUpcomingEarnings().filter(e => {
    const d = new Date(e.date);
    return d >= nextMonday && d <= nextSunday;
  });
}
