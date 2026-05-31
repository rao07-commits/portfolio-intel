export interface AIAdopter {
  symbol: string;
  name: string;
  sector: string;
  marketCap: string;
  marketCapNum: number; // in billions, for sorting
  index: "S&P 500" | "Russell 2000" | "Both";
  price: number; // approximate current price
  peRatio: number | null; // trailing P/E
  fwdPE: number | null; // forward P/E
  evEbitda: number | null; // EV/EBITDA
  return1Y: number; // 1-year return %
  return5Y: number; // 5-year annualized return %
  fromHigh52: number; // % from 52-week high (negative)
  sizeCategory: "mega" | "large" | "mid" | "small"; // for position sizing guidance
  aiUseCase: string;
  aiMaturity: "early" | "scaling" | "embedded";
  marginImpact: string;
  currentMargin: number; // operating margin %
  marginTarget: string;
  aiInvestment: string;
  catalyst: string;
  risk: string;
  thesis: string;
}

export const AI_ADOPTERS: AIAdopter[] = [
  // --- Logistics & Supply Chain ---
  {
    symbol: "CHRW", name: "C.H. Robinson", sector: "Industrials / Logistics",
    marketCap: "$14B", marketCapNum: 14, index: "S&P 500",
    price: 178.65, peRatio: 32.5, fwdPE: 24.1, evEbitda: 18.2, return1Y: 86, return5Y: 13, fromHigh52: -11, sizeCategory: "mid",
    aiUseCase: "AI-powered freight matching, route optimization, and demand forecasting. Their Navisphere platform uses ML to match shippers with carriers, reducing empty miles and improving pricing.",
    aiMaturity: "scaling",
    marginImpact: "Automating broker functions that currently require human intermediaries. Each 1% efficiency gain in matching = ~$50M in margin improvement.",
    currentMargin: 5.2,
    marginTarget: "7-9% operating margin as AI replaces manual brokerage operations",
    aiInvestment: "Invested $200M+ in Navisphere AI platform. Automating 30% of truckload transactions by end of 2026.",
    catalyst: "Q3 earnings showing broker headcount declining while transaction volume grows — proves the AI leverage story",
    risk: "Freight recession could mask AI margin gains. Amazon Freight competitive threat.",
    thesis: "Market prices CHRW as a cyclical freight broker at 15x earnings. But AI is structurally changing the cost structure — fewer brokers, faster matching, better pricing. If margins expand from 5% to 8%, earnings double on the same revenue.",
  },
  {
    symbol: "WM", name: "Waste Management", sector: "Industrials / Waste",
    marketCap: "$85B", marketCapNum: 85, index: "S&P 500",
    price: 211.46, peRatio: 30.2, fwdPE: 27.5, evEbitda: 16.8, return1Y: -11, return5Y: 9, fromHigh52: -14, sizeCategory: "large",
    aiUseCase: "AI-optimized route planning for collection trucks, computer vision for sorting recyclables, predictive maintenance on fleet. Smart bins with fill-level sensors.",
    aiMaturity: "scaling",
    marginImpact: "Route optimization alone saves 10-15% on fuel and labor. AI sorting increases recycling yield by 20-30%, turning waste streams into revenue.",
    currentMargin: 19.8,
    marginTarget: "22-24% operating margin as AI reduces labor per route and improves recycling economics",
    aiInvestment: "Partnered with NVIDIA for AI sorting facilities. Deploying autonomous collection trucks in select markets.",
    catalyst: "Recycling revenue inflection as AI sorting captures higher-value materials from mixed waste streams",
    risk: "Capital intensity of AI infrastructure upgrades. Regulatory changes on recycling mandates.",
    thesis: "Market treats WM as a boring utility at 30x earnings. But AI is turning waste into a tech-enabled platform — route optimization, robotic sorting, and predictive maintenance are creating operating leverage that utility investors don't model.",
  },

  // --- Healthcare ---
  {
    symbol: "HCA", name: "HCA Healthcare", sector: "Healthcare / Hospitals",
    marketCap: "$95B", marketCapNum: 95, index: "S&P 500",
    price: 378.54, peRatio: 16.8, fwdPE: 14.5, evEbitda: 10.2, return1Y: 0, return5Y: 12, fromHigh52: -31, sizeCategory: "large",
    aiUseCase: "Clinical AI for early disease detection, AI-assisted radiology, predictive staffing models, revenue cycle management automation. Using NLP to auto-code medical records for billing.",
    aiMaturity: "scaling",
    marginImpact: "Revenue cycle AI reduces claim denials by 15-20% (~$500M+ revenue recovery). Predictive staffing cuts overtime by 10%.",
    currentMargin: 17.5,
    marginTarget: "19-21% EBITDA margin from billing automation and staffing optimization",
    aiInvestment: "Partnership with Google Cloud for clinical AI. Deploying ambient clinical documentation across 180+ hospitals.",
    catalyst: "Revenue cycle automation showing up in SG&A leverage — fewer billing staff, lower denial rates",
    risk: "Regulatory scrutiny on AI in healthcare decisions. Nursing shortage limits growth regardless of AI.",
    thesis: "Hospital stocks trade on volume and reimbursement rates. The market doesn't model the AI cost takeout story — if HCA automates 30% of back-office functions, margins expand 200-300bps on flat revenue.",
  },
  {
    symbol: "UNH", name: "UnitedHealth Group", sector: "Healthcare / Insurance",
    marketCap: "$420B", marketCapNum: 420, index: "S&P 500",
    price: 380.31, peRatio: 17.5, fwdPE: 15.2, evEbitda: 13.1, return1Y: 28, return5Y: -1, fromHigh52: -5, sizeCategory: "mega",
    aiUseCase: "AI claims processing, fraud detection, member health prediction, prior authorization automation via Optum. Using LLMs for clinical documentation and care management.",
    aiMaturity: "embedded",
    marginImpact: "Prior auth automation alone saves $2B+ annually across the system. Fraud detection AI prevents $1B+ in fraudulent claims.",
    currentMargin: 8.5,
    marginTarget: "9.5-10.5% operating margin as Optum AI scales across claims, pharmacy, and care delivery",
    aiInvestment: "Optum has 50,000+ technologists. Deploying ambient AI documentation across 70,000+ physician practices.",
    catalyst: "Optum Health margins inflecting as AI reduces per-member cost of care management",
    risk: "Political/regulatory risk on healthcare AI decision-making. DOJ antitrust scrutiny.",
    thesis: "Market is focused on political risk and medical loss ratios. Missing the structural cost takeout from Optum's AI at scale — the largest healthcare AI deployment in the world.",
  },

  // --- Financial Services ---
  {
    symbol: "JPM", name: "JPMorgan Chase", sector: "Financials / Banking",
    marketCap: "$680B", marketCapNum: 680, index: "S&P 500",
    price: 299.31, peRatio: 14.2, fwdPE: 13.8, evEbitda: null, return1Y: 13, return5Y: 13, fromHigh52: -11, sizeCategory: "mega",
    aiUseCase: "LLM-powered research analysis (IndexGPT), AI fraud detection, algorithmic trading optimization, AI-assisted lending decisions, contract analysis with NLP.",
    aiMaturity: "embedded",
    marginImpact: "AI fraud detection saves $300M+/year. AI-assisted trading generates incremental alpha. Contract analysis automation reduces legal costs by 30%.",
    currentMargin: 38.2,
    marginTarget: "40-42% efficiency ratio improvement as AI automates middle/back office",
    aiInvestment: "$17B annual tech budget, 2,000+ AI/ML engineers. CEO Dimon calls AI 'as transformational as the printing press.'",
    catalyst: "Efficiency ratio improvement visible in quarterly earnings — AI headcount displacement in operations",
    risk: "Already priced as a premium bank. Regulatory constraints on AI in lending decisions.",
    thesis: "Banks trade on NII and credit quality. JPM's AI investment is creating a structural efficiency gap vs. peers that the market is slowly pricing but hasn't fully valued — the ROE expansion from AI automation is a multi-year story.",
  },
  {
    symbol: "SCHW", name: "Charles Schwab", sector: "Financials / Brokerage",
    marketCap: "$135B", marketCapNum: 135, index: "S&P 500",
    price: 87.35, peRatio: 25.8, fwdPE: 19.2, evEbitda: null, return1Y: 0, return5Y: 3, fromHigh52: -19, sizeCategory: "large",
    aiUseCase: "AI-powered financial planning (Schwab Intelligent Portfolios), conversational AI for client service, AI-driven tax-loss harvesting, predictive client retention models.",
    aiMaturity: "scaling",
    marginImpact: "Each client interaction automated by AI saves $5-8. With 35M+ accounts, even 20% automation = $350M+ annual savings.",
    currentMargin: 42.0,
    marginTarget: "45-48% pre-tax margin as AI scales client service and planning automation",
    aiInvestment: "Schwab Intelligent Portfolios manages $80B+ with AI. Deploying LLM-based advisors for mass affluent segment.",
    catalyst: "Client asset growth without proportional headcount growth — visible in comp/revenue ratio",
    risk: "Rate sensitivity on cash sorting. Competition from Robinhood/Wealthfront AI-native platforms.",
    thesis: "Market prices SCHW on net interest income and asset gathering. The AI angle is the advisory margin — AI advisors serve clients at 1/10th the cost of human advisors, expanding the addressable market to mass affluent without adding headcount.",
  },

  // --- Retail & Consumer ---
  {
    symbol: "WMT", name: "Walmart", sector: "Consumer Staples / Retail",
    marketCap: "$600B", marketCapNum: 600, index: "S&P 500",
    price: 115.75, peRatio: 38.5, fwdPE: 33.2, evEbitda: 18.5, return1Y: 19, return5Y: 20, fromHigh52: -14, sizeCategory: "mega",
    aiUseCase: "AI demand forecasting, automated inventory management, computer vision for checkout-free stores, AI-powered ad platform (Walmart Connect), drone delivery optimization.",
    aiMaturity: "scaling",
    marginImpact: "AI inventory optimization reduces shrinkage by 15-20%. Walmart Connect (AI-targeted ads) is a 75%+ margin business growing 30%+ YoY.",
    currentMargin: 4.2,
    marginTarget: "5.5-6.5% operating margin as high-margin AI ad revenue scales and supply chain AI reduces costs",
    aiInvestment: "$1.5B+ annual tech investment. Partnership with Microsoft for generative AI across operations.",
    catalyst: "Walmart Connect ad revenue crossing $5B run rate — proves the retail media AI flywheel",
    risk: "Consumer spending slowdown. Amazon competitive pressure on both retail and ads.",
    thesis: "Market values WMT as a low-margin grocer. But AI is creating two hidden businesses inside Walmart: a high-margin ad platform (like Amazon's) and an AI-optimized supply chain that structurally lowers costs. The sum-of-parts story is underappreciated.",
  },
  {
    symbol: "ORLY", name: "O'Reilly Automotive", sector: "Consumer Discretionary / Auto Parts",
    marketCap: "$70B", marketCapNum: 70, index: "S&P 500",
    price: 86.88, peRatio: 28.5, fwdPE: 25.1, evEbitda: 19.2, return1Y: -4, return5Y: 19, fromHigh52: -19, sizeCategory: "large",
    aiUseCase: "AI-powered parts lookup and vehicle diagnostics, predictive inventory stocking per store based on local vehicle fleet age data, AI-optimized pricing and promotions.",
    aiMaturity: "early",
    marginImpact: "Predictive stocking reduces excess inventory by 10-15% while improving in-stock rates. AI diagnostics increase average ticket by guiding customers to the right parts.",
    currentMargin: 20.5,
    marginTarget: "22-24% operating margin from inventory optimization and AI-assisted selling",
    aiInvestment: "Deploying AI parts lookup across 6,000+ stores. ML-driven demand forecasting replacing manual ordering.",
    catalyst: "Same-store sales outperformance driven by AI diagnostics increasing parts-per-transaction",
    risk: "EV adoption long-term reduces parts demand. Macro consumer weakness.",
    thesis: "Auto parts is seen as a boring, mature industry. But AI is the next productivity lever — predicting which parts each store needs, helping customers diagnose problems, and optimizing pricing. Whoever deploys AI best wins share in a fragmented market.",
  },

  // --- Industrials & Manufacturing ---
  {
    symbol: "CAT", name: "Caterpillar", sector: "Industrials / Heavy Equipment",
    marketCap: "$180B", marketCapNum: 180, index: "S&P 500",
    price: 875.87, peRatio: 22.1, fwdPE: 19.8, evEbitda: 15.5, return1Y: 149, return5Y: 29, fromHigh52: -6, sizeCategory: "large",
    aiUseCase: "Autonomous mining trucks and dozers, AI predictive maintenance for heavy equipment fleet, digital twins for construction site optimization, AI-powered parts demand forecasting.",
    aiMaturity: "scaling",
    marginImpact: "Autonomous mining reduces operator costs by 15-20%. Predictive maintenance extends equipment life 25% and generates recurring service revenue.",
    currentMargin: 22.1,
    marginTarget: "24-26% operating margin from services/aftermarket AI monetization",
    aiInvestment: "300+ autonomous trucks deployed at mining sites. Cat Digital platform with 1.5M+ connected assets.",
    catalyst: "Services/aftermarket revenue growing 2x equipment sales — AI-driven maintenance contracts are recurring",
    risk: "Cyclical downturn in construction/mining. China infrastructure slowdown.",
    thesis: "Market prices CAT as a cyclical equipment maker. But the AI-connected fleet story is creating a software-like services business — predictive maintenance contracts with 70%+ margins on top of a $180B installed base. The market doesn't give CAT credit for recurring revenue.",
  },
  {
    symbol: "DE", name: "Deere & Company", sector: "Industrials / Agriculture",
    marketCap: "$120B", marketCapNum: 120, index: "S&P 500",
    price: 542.18, peRatio: 20.5, fwdPE: 18.2, evEbitda: 14.1, return1Y: 8, return5Y: 8, fromHigh52: -18, sizeCategory: "large",
    aiUseCase: "See & Spray technology (AI-powered precision weed detection reduces herbicide use 77%), autonomous tractors, AI crop yield prediction, precision agriculture data platform.",
    aiMaturity: "embedded",
    marginImpact: "Precision agriculture commands 15-20% price premium over standard equipment. Recurring SaaS revenue from data platform subscriptions.",
    currentMargin: 20.8,
    marginTarget: "23-25% operating margin as precision ag software margins blend into hardware margins",
    aiInvestment: "Acquired Blue River Technology ($305M) for See & Spray. ExactEmerge planters with per-seed AI optimization.",
    catalyst: "See & Spray commercial adoption inflection — every farmer who sees 77% herbicide reduction becomes a customer",
    risk: "Farm income cyclicality. Farmer resistance to subscription models for equipment software.",
    thesis: "Market prices DE on farm equipment cycles and crop prices. But Deere is becoming an AI data company — the precision ag moat is widening as farmers can't switch once their data is in the Deere ecosystem. Software revenue is invisible in current financials but growing.",
  },

  // --- Energy & Utilities ---
  {
    symbol: "SLB", name: "SLB (Schlumberger)", sector: "Energy / Oilfield Services",
    marketCap: "$60B", marketCapNum: 60, index: "S&P 500",
    price: 54.55, peRatio: 12.8, fwdPE: 11.5, evEbitda: 8.2, return1Y: 62, return5Y: 11, fromHigh52: -6, sizeCategory: "large",
    aiUseCase: "AI-powered drilling optimization (Lumi AI platform), digital twins for reservoir modeling, predictive equipment maintenance, automated well planning using generative AI.",
    aiMaturity: "scaling",
    marginImpact: "AI drilling optimization reduces non-productive time by 30-40%. Digital services growing 20%+ YoY with 60%+ margins vs. 15% for traditional services.",
    currentMargin: 17.2,
    marginTarget: "20-22% operating margin as digital/AI services mix increases from 15% to 30% of revenue",
    aiInvestment: "Launched Lumi AI platform with NVIDIA partnership. Deploying autonomous drilling across major basins.",
    catalyst: "Digital revenue crossing 25% of total — triggers re-rating from 'cyclical oilfield' to 'tech-enabled energy services'",
    risk: "Oil price decline reduces drilling activity regardless of AI efficiency gains.",
    thesis: "Market values SLB like a commodity services company at 12x earnings. But the digital transformation is real — AI-optimized drilling is a platform business with recurring revenue and expanding margins. As digital mix increases, the multiple should re-rate.",
  },

  // --- Telecom / Media ---
  {
    symbol: "TMUS", name: "T-Mobile US", sector: "Communication Services / Telecom",
    marketCap: "$270B", marketCapNum: 270, index: "S&P 500",
    price: 187.53, peRatio: 21.5, fwdPE: 18.8, evEbitda: 10.5, return1Y: -22, return5Y: 6, fromHigh52: -28, sizeCategory: "mega",
    aiUseCase: "AI-powered network optimization (self-healing networks), AI customer service (handling 30%+ of inquiries), churn prediction, dynamic pricing, AI fraud detection.",
    aiMaturity: "embedded",
    marginImpact: "AI customer service reduces cost-per-interaction by 60%. Network AI reduces truck rolls by 25%. Churn reduction from AI retention = $1B+ annual value.",
    currentMargin: 25.5,
    marginTarget: "28-30% EBITDA margin as AI reduces customer acquisition costs and network opex",
    aiInvestment: "IntentCX AI platform. Deploying AI across 100M+ customer interactions annually.",
    catalyst: "Postpaid phone net adds outperforming AT&T/Verizon while spending less on customer service — the AI margin advantage becomes visible",
    risk: "Spectrum competition. Regulatory pressure on pricing.",
    thesis: "Telecom trades on subscribers and ARPU. T-Mobile's AI advantage is in the cost structure — serving each customer at a lower cost than AT&T/Verizon. The margin gap should widen as AI scales, and the stock should trade at a premium multiple.",
  },

  // --- Insurance ---
  {
    symbol: "PGR", name: "Progressive", sector: "Financials / Insurance",
    marketCap: "$155B", marketCapNum: 155, index: "S&P 500",
    price: 190.40, peRatio: 15.2, fwdPE: 18.5, evEbitda: null, return1Y: -31, return5Y: 14, fromHigh52: -34, sizeCategory: "large",
    aiUseCase: "Snapshot telematics + AI for personalized pricing, AI claims processing (photo-based damage assessment), AI underwriting models, fraud detection with NLP on claims narratives.",
    aiMaturity: "embedded",
    marginImpact: "AI-driven pricing precision improves combined ratio by 2-3 points. Photo claims processing reduces adjustment costs by 40%.",
    currentMargin: 14.2,
    marginTarget: "Combined ratio sustained below 92% (industry avg ~98%) through AI pricing advantage",
    aiInvestment: "Snapshot has 40B+ miles of driving data. Largest insurance telematics dataset in the world — the AI training data moat.",
    catalyst: "Sustained combined ratio outperformance vs. industry proves AI pricing is a structural advantage, not a cycle",
    risk: "Cat losses from climate events. Regulatory pressure on AI-based pricing (fairness concerns).",
    thesis: "Progressive already trades at a premium, but the market doesn't fully price the AI moat. They have 40B+ miles of driving data that competitors can never replicate. This data advantage widens every day and makes their pricing permanently more accurate than legacy insurers.",
  },

  // --- Food & Beverage ---
  {
    symbol: "PEP", name: "PepsiCo", sector: "Consumer Staples / Food & Beverage",
    marketCap: "$210B", marketCapNum: 210, index: "S&P 500",
    price: 144.19, peRatio: 22.8, fwdPE: 19.5, evEbitda: 16.2, return1Y: 9, return5Y: 0, fromHigh52: -15, sizeCategory: "mega",
    aiUseCase: "AI-powered demand sensing for snack/beverage inventory, AI-optimized DSD (direct store delivery) routing, generative AI for product development and flavor testing, AI quality control in manufacturing.",
    aiMaturity: "early",
    marginImpact: "Demand sensing reduces waste by 10-15%. Route optimization saves 8-12% on distribution costs. AI product development accelerates innovation cycles.",
    currentMargin: 14.8,
    marginTarget: "16-18% operating margin as AI reduces distribution and manufacturing waste",
    aiInvestment: "Partnered with Palantir for supply chain AI. Deploying computer vision quality control across 200+ plants.",
    catalyst: "Supply chain cost savings showing up in gross margin expansion despite commodity inflation",
    risk: "GLP-1 drugs reducing snack consumption. Currency headwinds mask margin improvement.",
    thesis: "Consumer staples trade on revenue growth which is slowing. The AI story is on the cost side — distribution, manufacturing, and waste reduction. If PEP can expand margins 200bps through AI while peers can't, the relative valuation gap widens.",
  },
];

export const SECTOR_CATEGORIES = [
  "Industrials / Logistics",
  "Industrials / Waste",
  "Industrials / Heavy Equipment",
  "Industrials / Agriculture",
  "Healthcare / Hospitals",
  "Healthcare / Insurance",
  "Financials / Banking",
  "Financials / Brokerage",
  "Financials / Insurance",
  "Consumer Staples / Retail",
  "Consumer Staples / Food & Beverage",
  "Consumer Discretionary / Auto Parts",
  "Energy / Oilfield Services",
  "Communication Services / Telecom",
] as const;

export const MATURITY_LABELS: Record<string, { label: string; color: string }> = {
  early: { label: "Early Stage", color: "text-yellow-400 bg-yellow-400/10 border-yellow-400/30" },
  scaling: { label: "Scaling", color: "text-blue-400 bg-blue-400/10 border-blue-400/30" },
  embedded: { label: "Embedded", color: "text-green-400 bg-green-400/10 border-green-400/30" },
};
