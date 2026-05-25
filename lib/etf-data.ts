export interface ETFInfo {
  symbol: string;
  name: string;
  category: "us_index" | "sector" | "country" | "region" | "bond" | "commodity" | "thematic";
  expenseRatio: number; // as percentage e.g. 0.03 = 0.03%
  aum: string; // approximate AUM
  yield: number; // trailing 12m yield %
  peRatio: number | null; // P/E ratio
  pbRatio: number | null; // P/B ratio
  return3Y: number | null; // annualized 3-year return %
  return5Y: number | null; // annualized 5-year return %
  returnYTD: number | null; // YTD return %
  topHoldings: string[]; // top 5 holdings
  description: string;
  region: string;
}

// Performance data from Yahoo Finance as of May 2026
// Valuations approximate from fund fact sheets — verify before trading
export const ETF_DATA: ETFInfo[] = [
  // --- US Index ---
  {
    symbol: "SPY", name: "SPDR S&P 500 ETF", category: "us_index",
    expenseRatio: 0.09, aum: "$570B", yield: 1.2, peRatio: 24.5, pbRatio: 4.8,
    return3Y: 21.2, return5Y: 12.2, returnYTD: 12.3,
    topHoldings: ["AAPL", "MSFT", "NVDA", "AMZN", "META"],
    description: "Tracks the S&P 500 index — 500 largest US companies",
    region: "United States",
  },
  {
    symbol: "QQQ", name: "Invesco Nasdaq-100 ETF", category: "us_index",
    expenseRatio: 0.20, aum: "$310B", yield: 0.5, peRatio: 33.2, pbRatio: 9.1,
    return3Y: 28.6, return5Y: 16.6, returnYTD: 15.1,
    topHoldings: ["AAPL", "MSFT", "NVDA", "AMZN", "AVGO"],
    description: "Tracks the Nasdaq-100 — tech-heavy large-cap growth index",
    region: "United States",
  },
  {
    symbol: "IWM", name: "iShares Russell 2000 ETF", category: "us_index",
    expenseRatio: 0.19, aum: "$72B", yield: 1.1, peRatio: 15.8, pbRatio: 1.9,
    return3Y: 17.2, return5Y: 5.2, returnYTD: 4.2,
    topHoldings: ["SMCI", "ONTO", "FN", "INSM", "FTNT"],
    description: "Tracks the Russell 2000 — US small-cap index",
    region: "United States",
  },
  {
    symbol: "VTI", name: "Vanguard Total Stock Market ETF", category: "us_index",
    expenseRatio: 0.03, aum: "$420B", yield: 1.3, peRatio: 23.1, pbRatio: 4.2,
    return3Y: 20.8, return5Y: 11.1, returnYTD: 11.8,
    topHoldings: ["AAPL", "MSFT", "NVDA", "AMZN", "META"],
    description: "Total US stock market — large, mid, and small cap combined",
    region: "United States",
  },
  {
    symbol: "VOO", name: "Vanguard S&P 500 ETF", category: "us_index",
    expenseRatio: 0.03, aum: "$500B", yield: 1.2, peRatio: 24.5, pbRatio: 4.8,
    return3Y: 21.2, return5Y: 12.2, returnYTD: 12.3,
    topHoldings: ["AAPL", "MSFT", "NVDA", "AMZN", "META"],
    description: "Vanguard's S&P 500 tracker — lowest cost option",
    region: "United States",
  },

  // --- US Sector ---
  {
    symbol: "SMH", name: "VanEck Semiconductor ETF", category: "sector",
    expenseRatio: 0.35, aum: "$23B", yield: 0.5, peRatio: 30.5, pbRatio: 7.8,
    return3Y: 62.6, return5Y: 36.5, returnYTD: 22.1,
    topHoldings: ["NVDA", "TSM", "AVGO", "AMD", "ASML"],
    description: "Concentrated semiconductor exposure — AI/HBM/foundry cycle",
    region: "Global (US-listed)",
  },
  {
    symbol: "SOXX", name: "iShares Semiconductor ETF", category: "sector",
    expenseRatio: 0.35, aum: "$14B", yield: 0.6, peRatio: 28.3, pbRatio: 6.9,
    return3Y: 53.6, return5Y: 30.6, returnYTD: 20.4,
    topHoldings: ["NVDA", "AVGO", "AMD", "QCOM", "TXN"],
    description: "Broader semiconductor exposure — more equal-weighted than SMH",
    region: "Global (US-listed)",
  },
  {
    symbol: "XLK", name: "Technology Select Sector SPDR", category: "sector",
    expenseRatio: 0.09, aum: "$71B", yield: 0.6, peRatio: 32.1, pbRatio: 11.2,
    return3Y: 25.4, return5Y: 20.3, returnYTD: 16.5,
    topHoldings: ["AAPL", "MSFT", "NVDA", "AVGO", "CRM"],
    description: "S&P 500 technology sector — mega-cap tech focused",
    region: "United States",
  },
  {
    symbol: "XLE", name: "Energy Select Sector SPDR", category: "sector",
    expenseRatio: 0.09, aum: "$38B", yield: 3.4, peRatio: 12.8, pbRatio: 2.1,
    return3Y: 14.2, return5Y: 11.8, returnYTD: -2.1,
    topHoldings: ["XOM", "CVX", "COP", "EOG", "SLB"],
    description: "S&P 500 energy sector — oil, gas, and energy services",
    region: "United States",
  },
  {
    symbol: "XLF", name: "Financial Select Sector SPDR", category: "sector",
    expenseRatio: 0.09, aum: "$45B", yield: 1.5, peRatio: 16.2, pbRatio: 2.0,
    return3Y: 8.9, return5Y: 12.1, returnYTD: 9.8,
    topHoldings: ["BRK.B", "JPM", "V", "MA", "BAC"],
    description: "S&P 500 financials — banks, insurance, fintech",
    region: "United States",
  },

  // --- Country ETFs ---
  {
    symbol: "EWY", name: "iShares MSCI South Korea ETF", category: "country",
    expenseRatio: 0.59, aum: "$4.2B", yield: 1.8, peRatio: 14.5, pbRatio: 1.2,
    return3Y: 43.8, return5Y: 15.0, returnYTD: 8.2,
    topHoldings: ["Samsung", "SK Hynix", "Hyundai", "Naver", "Celltrion"],
    description: "South Korea — heavy semis (Samsung, SK Hynix HBM). Massive 3Y run driven by AI memory demand.",
    region: "South Korea",
  },
  {
    symbol: "EWJ", name: "iShares MSCI Japan ETF", category: "country",
    expenseRatio: 0.50, aum: "$15B", yield: 1.6, peRatio: 15.8, pbRatio: 1.5,
    return3Y: 14.6, return5Y: 6.1, returnYTD: 6.1,
    topHoldings: ["Toyota", "Sony", "Mitsubishi UFJ", "Keyence", "Tokyo Electron"],
    description: "Japan large-cap — auto, electronics, industrials, yen play",
    region: "Japan",
  },
  {
    symbol: "FXI", name: "iShares China Large-Cap ETF", category: "country",
    expenseRatio: 0.74, aum: "$6.8B", yield: 2.3, peRatio: 11.5, pbRatio: 1.3,
    return3Y: 8.2, return5Y: -4.7, returnYTD: 12.5,
    topHoldings: ["Alibaba", "Tencent", "Meituan", "CCB", "JD.com"],
    description: "China large-cap — 3Y recovered but 5Y still negative. DeepSeek AI catalyst.",
    region: "China",
  },
  {
    symbol: "KWEB", name: "KraneShares CSI China Internet ETF", category: "country",
    expenseRatio: 0.69, aum: "$6.1B", yield: 0.3, peRatio: 18.5, pbRatio: 2.4,
    return3Y: 0.1, return5Y: -17.3, returnYTD: 18.3,
    topHoldings: ["Tencent", "Alibaba", "PDD", "Meituan", "Baidu"],
    description: "Chinese internet — 5Y -17.3% annualized destruction despite recent bounce",
    region: "China",
  },
  {
    symbol: "EWZ", name: "iShares MSCI Brazil ETF", category: "country",
    expenseRatio: 0.59, aum: "$5.2B", yield: 7.8, peRatio: 7.2, pbRatio: 1.4,
    return3Y: 6.7, return5Y: -0.7, returnYTD: -8.5,
    topHoldings: ["Vale", "Petrobras", "Itau", "B3", "Bradesco"],
    description: "Brazil — cheapest P/E at 7.2x, highest yield at 7.8%, but flat 5Y returns",
    region: "Brazil",
  },
  {
    symbol: "INDA", name: "iShares MSCI India ETF", category: "country",
    expenseRatio: 0.65, aum: "$9.5B", yield: 0.6, peRatio: 22.5, pbRatio: 3.8,
    return3Y: 5.7, return5Y: 2.1, returnYTD: -2.1,
    topHoldings: ["Reliance", "HDFC Bank", "Infosys", "ICICI Bank", "TCS"],
    description: "India — expensive (22.5x P/E) with disappointing 5Y at only 2.1% annualized",
    region: "India",
  },
  {
    symbol: "EWT", name: "iShares MSCI Taiwan ETF", category: "country",
    expenseRatio: 0.59, aum: "$6.5B", yield: 2.1, peRatio: 16.2, pbRatio: 2.5,
    return3Y: 28.7, return5Y: 9.8, returnYTD: 11.5,
    topHoldings: ["TSMC", "MediaTek", "Hon Hai", "Delta Electronics", "CTBC"],
    description: "Taiwan — TSMC dominates (~22% weight), pure semiconductor supply chain proxy",
    region: "Taiwan",
  },
  {
    symbol: "EWG", name: "iShares MSCI Germany ETF", category: "country",
    expenseRatio: 0.50, aum: "$2.8B", yield: 2.4, peRatio: 14.1, pbRatio: 1.6,
    return3Y: 13.8, return5Y: 3.6, returnYTD: 18.4,
    topHoldings: ["SAP", "Siemens", "Allianz", "Deutsche Telekom", "Munich Re"],
    description: "Germany — fiscal stimulus re-rating underway, SAP is an AI play",
    region: "Germany",
  },

  // --- Regional ---
  {
    symbol: "VWO", name: "Vanguard FTSE Emerging Markets ETF", category: "region",
    expenseRatio: 0.08, aum: "$82B", yield: 3.1, peRatio: 12.8, pbRatio: 1.7,
    return3Y: 13.9, return5Y: 2.3, returnYTD: 6.5,
    topHoldings: ["TSMC", "Tencent", "Samsung", "Alibaba", "Reliance"],
    description: "Broad emerging markets — cheapest EM exposure at 0.08%",
    region: "Emerging Markets",
  },
  {
    symbol: "EFA", name: "iShares MSCI EAFE ETF", category: "region",
    expenseRatio: 0.32, aum: "$56B", yield: 2.8, peRatio: 15.2, pbRatio: 1.9,
    return3Y: 12.4, return5Y: 5.2, returnYTD: 10.2,
    topHoldings: ["Novo Nordisk", "ASML", "Nestle", "Shell", "SAP"],
    description: "Developed markets ex-US — Europe, Japan, Australia",
    region: "Developed International",
  },
  {
    symbol: "VXUS", name: "Vanguard Total International Stock ETF", category: "region",
    expenseRatio: 0.07, aum: "$68B", yield: 2.9, peRatio: 14.1, pbRatio: 1.8,
    return3Y: 14.7, return5Y: 5.1, returnYTD: 8.8,
    topHoldings: ["TSMC", "Novo Nordisk", "Samsung", "ASML", "Tencent"],
    description: "Total international — developed + emerging, lowest cost at 0.07%",
    region: "Global ex-US",
  },

  // --- Thematic AI/Infrastructure ---
  {
    symbol: "BOTZ", name: "Global X Robotics & AI ETF", category: "thematic",
    expenseRatio: 0.68, aum: "$2.5B", yield: 0.3, peRatio: 35.2, pbRatio: 5.1,
    return3Y: 12.8, return5Y: 12.1, returnYTD: 14.2,
    topHoldings: ["NVDA", "Intuitive Surgical", "Keyence", "ABB", "Fanuc"],
    description: "Robotics and AI — broad AI thematic but high expense ratio",
    region: "Global",
  },
  {
    symbol: "ARKK", name: "ARK Innovation ETF", category: "thematic",
    expenseRatio: 0.75, aum: "$6.8B", yield: 0.0, peRatio: null, pbRatio: null,
    return3Y: -18.5, return5Y: -2.1, returnYTD: 8.4,
    topHoldings: ["TSLA", "COIN", "ROKU", "PLTR", "RBLX"],
    description: "Disruptive innovation — 0.75% expense for -18.5% 3Y annualized loss",
    region: "United States",
  },

  // --- Commodity ---
  {
    symbol: "GLD", name: "SPDR Gold Shares", category: "commodity",
    expenseRatio: 0.40, aum: "$75B", yield: 0.0, peRatio: null, pbRatio: null,
    return3Y: 31.5, return5Y: 18.6, returnYTD: 15.2,
    topHoldings: ["Physical Gold Bullion"],
    description: "Gold — +31.5% annualized over 3Y, geopolitical + inflation hedge",
    region: "Global",
  },
  {
    symbol: "IAU", name: "iShares Gold Trust", category: "commodity",
    expenseRatio: 0.25, aum: "$32B", yield: 0.0, peRatio: null, pbRatio: null,
    return3Y: 31.7, return5Y: 18.8, returnYTD: 15.2,
    topHoldings: ["Physical Gold Bullion"],
    description: "Gold — identical to GLD but 15bps cheaper (0.25% vs 0.40%)",
    region: "Global",
  },
  {
    symbol: "SLV", name: "iShares Silver Trust", category: "commodity",
    expenseRatio: 0.50, aum: "$12B", yield: 0.0, peRatio: null, pbRatio: null,
    return3Y: 46.9, return5Y: 21.6, returnYTD: 18.5,
    topHoldings: ["Physical Silver Bullion"],
    description: "Silver — massive run, +46.9% 3Y annualized. Industrial AI demand + precious metal",
    region: "Global",
  },
];

export const CATEGORY_LABELS: Record<string, string> = {
  us_index: "US Index",
  sector: "US Sector",
  country: "Country",
  region: "Regional",
  thematic: "Thematic / AI",
  commodity: "Commodity",
  bond: "Fixed Income",
};

export const CATEGORIES = ["us_index", "sector", "country", "region", "thematic", "commodity"] as const;
