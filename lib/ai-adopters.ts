export interface AIAdopter {
  symbol: string;
  name: string;
  sector: string;
  marketCap: string;
  marketCapNum: number;
  index: "S&P 500" | "Russell 2000" | "Both";
  price: number;
  peRatio: number | null;
  fwdPE: number | null;
  evEbitda: number | null;
  return1Y: number;
  return5Y: number;
  fromHigh52: number;
  sizeCategory: "mega" | "large" | "mid" | "small";
  aiUseCase: string;
  aiMaturity: "early" | "scaling" | "embedded";
  marginImpact: string;
  currentMargin: number;
  marginTarget: string;
  aiInvestment: string;
  catalyst: string;
  risk: string;
  thesis: string;
  managementEdge: string;
}

// Selection criteria:
// 1. Management has a PROVEN track record of technology adoption across previous cycles
// 2. Non-tech S&P 500 company where AI is a cost/margin driver, not a product
// 3. NOT correlated to commodity prices (removed energy)
// 4. AI adoption is visible in financials or will be within 2-4 quarters

export const AI_ADOPTERS: AIAdopter[] = [
  // --- Financials ---
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
    thesis: "Banks trade on NII and credit quality. JPM's AI investment is creating a structural efficiency gap vs. peers that the market is slowly pricing but hasn't fully valued.",
    managementEdge: "Jamie Dimon has been the gold standard for bank tech adoption for 20 years. He built JPM's $17B/yr tech budget from scratch — was early on mobile banking, early on cloud migration, and now has 2,000+ AI engineers. He personally championed the firm's move to AWS, overrode internal resistance to kill legacy systems, and publicly called AI 'as important as electricity.' Under his leadership JPM acquired Nutmeg (robo-advisory), 55ip (AI tax optimization), and built COIN (contract intelligence) which processes 12,000 commercial credit agreements in seconds vs. 360,000 lawyer-hours. No other bank CEO has this tech conviction.",
  },
  {
    symbol: "PGR", name: "Progressive", sector: "Financials / Insurance",
    marketCap: "$155B", marketCapNum: 155, index: "S&P 500",
    price: 190.40, peRatio: 15.2, fwdPE: 18.5, evEbitda: null, return1Y: -31, return5Y: 14, fromHigh52: -34, sizeCategory: "large",
    aiUseCase: "Snapshot telematics + AI for personalized pricing, AI claims processing (photo-based damage assessment), AI underwriting models, fraud detection with NLP on claims narratives.",
    aiMaturity: "embedded",
    marginImpact: "AI-driven pricing precision improves combined ratio by 2-3 points. Photo claims processing reduces adjustment costs by 40%.",
    currentMargin: 14.2,
    marginTarget: "Combined ratio sustained below 92% (industry avg ~98%) through AI pricing advantage",
    aiInvestment: "Snapshot has 40B+ miles of driving data. Largest insurance telematics dataset in the world.",
    catalyst: "Sustained combined ratio outperformance vs. industry proves AI pricing is a structural advantage, not a cycle",
    risk: "Cat losses from climate events. Regulatory pressure on AI-based pricing (fairness concerns).",
    thesis: "The market doesn't fully price the AI moat. They have 40B+ miles of driving data that competitors can never replicate.",
    managementEdge: "Progressive was a tech-first insurer before AI existed. Tricia Griffith (CEO since 2016) came up through claims — she understood early that data beats intuition in underwriting. Progressive launched Snapshot telematics in 2011, a decade before competitors. They were the first insurer to sell online (1997), first with usage-based pricing, and first with AI photo claims estimation. The culture of 'test, measure, deploy' is baked into the DNA — they A/B test pricing models like a tech company. Peter Lewis (founder) set the tone: 'we're a technology company that happens to sell insurance.' That culture survived leadership transitions, which is the real moat.",
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
    thesis: "Market prices SCHW on net interest income. The AI angle is the advisory margin — AI advisors serve clients at 1/10th the cost of human advisors.",
    managementEdge: "Walt Bettinger (CEO 2008-2024) pioneered the zero-commission model that forced the entire industry to follow — a tech-enabled disruption play. He built Schwab Intelligent Portfolios as the first major robo-advisor from a traditional firm. Rick Wurster (CEO since 2024) came from the tech/strategy side and is accelerating AI deployment. Schwab has a 30-year track record of using technology to democratize finance — from online trading in the '90s to robo-advisory to AI planning. They consistently adopt tech waves 2-3 years before peers like Merrill or Morgan Stanley.",
  },

  // --- Healthcare ---
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
    thesis: "Market is focused on political risk and medical loss ratios. Missing the structural cost takeout from Optum's AI at scale.",
    managementEdge: "Andrew Witty (CEO) ran GlaxoSmithKline where he overhauled their R&D with data analytics before joining UNH. But the real tech DNA comes from Optum — built by acquiring and integrating 50+ health tech companies over 15 years. Optum's 50,000-person tech org is larger than most pure-play tech companies. UNH was deploying predictive analytics for population health management years before 'AI' became a buzzword. The Optum acquisition strategy (buying Change Healthcare for $13B, acquiring physician practices) is a deliberate platform play — owning the data layer of US healthcare. No other insurer has this vertical integration of tech + care delivery.",
  },
  {
    symbol: "HCA", name: "HCA Healthcare", sector: "Healthcare / Hospitals",
    marketCap: "$95B", marketCapNum: 95, index: "S&P 500",
    price: 378.54, peRatio: 16.8, fwdPE: 14.5, evEbitda: 10.2, return1Y: 0, return5Y: 12, fromHigh52: -31, sizeCategory: "large",
    aiUseCase: "Clinical AI for early disease detection, AI-assisted radiology, predictive staffing models, revenue cycle management automation. NLP auto-coding for medical billing.",
    aiMaturity: "scaling",
    marginImpact: "Revenue cycle AI reduces claim denials by 15-20% (~$500M+ revenue recovery). Predictive staffing cuts overtime by 10%.",
    currentMargin: 17.5,
    marginTarget: "19-21% EBITDA margin from billing automation and staffing optimization",
    aiInvestment: "Partnership with Google Cloud for clinical AI. Deploying ambient clinical documentation across 180+ hospitals.",
    catalyst: "Revenue cycle automation showing up in SG&A leverage — fewer billing staff, lower denial rates",
    risk: "Regulatory scrutiny on AI in healthcare decisions. Nursing shortage limits growth regardless of AI.",
    thesis: "Hospital stocks trade on volume and reimbursement. The market doesn't model the AI cost takeout — automating 30% of back-office expands margins 200-300bps.",
    managementEdge: "Sam Hazen (CEO since 2019) built HCA's data analytics capability from the ground up as COO. HCA was the FIRST hospital system to centralize clinical data across 180+ hospitals into a single data warehouse — a decade-long project that competitors haven't replicated. This data moat (50M+ patient encounters/year) is why Google Cloud chose HCA as their flagship healthcare AI partner. Hazen's predecessor, Milton Johnson, invested early in electronic health records and revenue cycle automation when peers were still on paper. HCA's scale (largest US hospital operator) means every AI deployment multiplies across 180+ facilities — a structural advantage smaller systems can't match.",
  },

  // --- Industrials ---
  {
    symbol: "DE", name: "Deere & Company", sector: "Industrials / Agriculture",
    marketCap: "$120B", marketCapNum: 120, index: "S&P 500",
    price: 542.18, peRatio: 20.5, fwdPE: 18.2, evEbitda: 14.1, return1Y: 8, return5Y: 8, fromHigh52: -18, sizeCategory: "large",
    aiUseCase: "See & Spray technology (AI weed detection reduces herbicide 77%), autonomous tractors, AI crop yield prediction, precision agriculture data platform.",
    aiMaturity: "embedded",
    marginImpact: "Precision ag commands 15-20% price premium over standard equipment. Recurring SaaS revenue from data platform subscriptions.",
    currentMargin: 20.8,
    marginTarget: "23-25% operating margin as precision ag software margins blend into hardware margins",
    aiInvestment: "Acquired Blue River Technology ($305M) for See & Spray. ExactEmerge planters with per-seed AI optimization.",
    catalyst: "See & Spray commercial adoption inflection — every farmer who sees 77% herbicide reduction becomes a customer",
    risk: "Farm income cyclicality. Farmer resistance to subscription models for equipment software.",
    thesis: "Market prices DE on farm equipment cycles. But Deere is becoming an AI data company — the precision ag moat widens as farmers can't switch once their data is in the Deere ecosystem.",
    managementEdge: "John May (CEO since 2019) came from Deere's Intelligent Solutions Group — he literally ran the precision ag tech division before becoming CEO. His first strategic act was acquiring Blue River Technology (computer vision for crops) from Stanford AI researchers. He reorganized Deere around 'smart industrial' instead of 'heavy equipment,' killed non-core businesses, and doubled down on autonomy and AI. Deere was deploying GPS-guided tractors in the early 2000s — 20 years of precision ag iteration. May's background means tech isn't a bolt-on initiative; the CEO IS the tech leader. Compare to peers like AGCO or CNH where tech is still a side project.",
  },
  {
    symbol: "CAT", name: "Caterpillar", sector: "Industrials / Heavy Equipment",
    marketCap: "$180B", marketCapNum: 180, index: "S&P 500",
    price: 875.87, peRatio: 22.1, fwdPE: 19.8, evEbitda: 15.5, return1Y: 149, return5Y: 29, fromHigh52: -6, sizeCategory: "large",
    aiUseCase: "Autonomous mining trucks and dozers, AI predictive maintenance, digital twins for construction sites, AI-powered parts demand forecasting.",
    aiMaturity: "scaling",
    marginImpact: "Autonomous mining reduces operator costs 15-20%. Predictive maintenance extends equipment life 25% and generates recurring service revenue.",
    currentMargin: 22.1,
    marginTarget: "24-26% operating margin from services/aftermarket AI monetization",
    aiInvestment: "300+ autonomous trucks deployed at mining sites. Cat Digital platform with 1.5M+ connected assets.",
    catalyst: "Services/aftermarket revenue growing 2x equipment sales — AI-driven maintenance contracts are recurring",
    risk: "Cyclical downturn in construction/mining. Already up 149% in 1 year — valuation stretched.",
    thesis: "Market prices CAT as cyclical. But the AI-connected fleet creates a software-like services business with 70%+ margin maintenance contracts on a $180B installed base.",
    managementEdge: "Jim Umpleby (CEO 2017-2024) drove the Cat Digital transformation — connecting 1.5M+ assets to the cloud for predictive analytics. He came from the energy division where he saw firsthand how downtime kills profitability, which drove the predictive maintenance obsession. Joe Creed (CEO since 2024) was CFO and deeply understands the margin story of services vs. equipment. CAT deployed autonomous haul trucks in Australian mines starting in 2013 — 10+ years of real-world autonomous operation data that no competitor has. Komatsu is the only peer attempting this at scale, and they're 5+ years behind on fleet size.",
  },
  {
    symbol: "CHRW", name: "C.H. Robinson", sector: "Industrials / Logistics",
    marketCap: "$14B", marketCapNum: 14, index: "S&P 500",
    price: 178.65, peRatio: 32.5, fwdPE: 24.1, evEbitda: 18.2, return1Y: 86, return5Y: 13, fromHigh52: -11, sizeCategory: "mid",
    aiUseCase: "AI-powered freight matching via Navisphere platform, route optimization, demand forecasting. ML matches shippers with carriers, reducing empty miles.",
    aiMaturity: "scaling",
    marginImpact: "Automating broker functions. Each 1% efficiency gain in matching = ~$50M in margin improvement.",
    currentMargin: 5.2,
    marginTarget: "7-9% operating margin as AI replaces manual brokerage operations",
    aiInvestment: "Invested $200M+ in Navisphere AI platform. Automating 30% of truckload transactions by end of 2026.",
    catalyst: "Q3 earnings showing broker headcount declining while transaction volume grows",
    risk: "Freight recession could mask AI margin gains. Amazon Freight competitive threat.",
    thesis: "Market prices CHRW as a cyclical freight broker. But AI is structurally changing the cost structure — if margins expand from 5% to 8%, earnings double on the same revenue.",
    managementEdge: "Dave Bozeman (CEO since 2023) came from Amazon where he ran Global Transportation — he built Amazon's logistics AI and automation strategy. Before Amazon, he was at Caterpillar leading their connected fleet analytics. He is literally an AI-in-logistics executive who has done this transformation twice at world-class companies. His hire was a signal that CHRW's board wants aggressive tech transformation. Since arriving, he's restructured the company around the Navisphere platform and publicly committed to automating 30% of transactions. Compare to XPO or Echo where CEOs come from traditional freight backgrounds.",
  },

  // --- Consumer ---
  {
    symbol: "WMT", name: "Walmart", sector: "Consumer Staples / Retail",
    marketCap: "$600B", marketCapNum: 600, index: "S&P 500",
    price: 115.75, peRatio: 38.5, fwdPE: 33.2, evEbitda: 18.5, return1Y: 19, return5Y: 20, fromHigh52: -14, sizeCategory: "mega",
    aiUseCase: "AI demand forecasting, automated inventory management, computer vision checkout, AI-powered ad platform (Walmart Connect), drone delivery optimization.",
    aiMaturity: "scaling",
    marginImpact: "AI inventory optimization reduces shrinkage 15-20%. Walmart Connect (AI-targeted ads) is 75%+ margin growing 30%+ YoY.",
    currentMargin: 4.2,
    marginTarget: "5.5-6.5% operating margin as high-margin AI ad revenue scales and supply chain AI reduces costs",
    aiInvestment: "$1.5B+ annual tech investment. Partnership with Microsoft for generative AI across operations.",
    catalyst: "Walmart Connect ad revenue crossing $5B run rate — proves the retail media AI flywheel",
    risk: "Consumer spending slowdown. Amazon competitive pressure on both retail and ads. Already at 38x P/E.",
    thesis: "Market values WMT as a low-margin grocer. But AI is creating two hidden businesses: a high-margin ad platform and an AI-optimized supply chain.",
    managementEdge: "Doug McMillon (CEO since 2014) transformed Walmart from a tech laggard into a tech leader. He personally drove the $3.3B Jet.com acquisition, hired Marc Lore (serial e-commerce entrepreneur), then hired Suresh Kumar (ex-Google Cloud VP) as CTO. When Kumar left, McMillon hired the head of Microsoft's Cloud+AI division. He built Walmart Global Tech from a cost center into a 20,000-person tech org that rivals Amazon's. McMillon understood early that Walmart's 4,700 stores are a logistics network that AI can optimize — a structural advantage over pure e-commerce. He also greenlit Walmart Connect (retail media) which is now a $3B+ revenue stream that didn't exist 5 years ago.",
  },

  // --- Telecom ---
  {
    symbol: "TMUS", name: "T-Mobile US", sector: "Communication Services / Telecom",
    marketCap: "$270B", marketCapNum: 270, index: "S&P 500",
    price: 187.53, peRatio: 21.5, fwdPE: 18.8, evEbitda: 10.5, return1Y: -22, return5Y: 6, fromHigh52: -28, sizeCategory: "mega",
    aiUseCase: "AI network optimization (self-healing networks), AI customer service (30%+ of inquiries), churn prediction, dynamic pricing, AI fraud detection.",
    aiMaturity: "embedded",
    marginImpact: "AI customer service reduces cost-per-interaction by 60%. Network AI reduces truck rolls by 25%. Churn reduction = $1B+ annual value.",
    currentMargin: 25.5,
    marginTarget: "28-30% EBITDA margin as AI reduces customer acquisition costs and network opex",
    aiInvestment: "IntentCX AI platform. Deploying AI across 100M+ customer interactions annually.",
    catalyst: "Postpaid net adds outperforming AT&T/Verizon while spending less on customer service — the AI margin advantage becomes visible",
    risk: "Spectrum competition. Regulatory pressure. Already -28% from highs.",
    thesis: "T-Mobile's AI advantage is in the cost structure — serving each customer at lower cost than AT&T/Verizon. The margin gap should widen.",
    managementEdge: "Mike Sievert (CEO since 2020) was the architect of T-Mobile's 'Un-carrier' disruption under John Legere — a fundamentally tech-driven strategy that used digital-first customer service when AT&T and Verizon still relied on retail stores. T-Mobile was the first US carrier to deploy AI customer service at scale (IntentCX), the first to launch 5G SA (standalone) network with AI optimization, and the first to use ML for network self-healing. The Sprint merger integration was managed as a tech integration — T-Mobile migrated 60M Sprint customers using automated AI systems, not manual processes. Neville Ray (CTO, now retired) built the most advanced AI-managed network in the US. The tech culture survived the Legere-to-Sievert transition.",
  },

  // --- Waste / Infrastructure ---
  {
    symbol: "WM", name: "Waste Management", sector: "Industrials / Waste",
    marketCap: "$85B", marketCapNum: 85, index: "S&P 500",
    price: 211.46, peRatio: 30.2, fwdPE: 27.5, evEbitda: 16.8, return1Y: -11, return5Y: 9, fromHigh52: -14, sizeCategory: "large",
    aiUseCase: "AI-optimized route planning, computer vision for recycling sorting, predictive fleet maintenance, smart bins with fill-level sensors.",
    aiMaturity: "scaling",
    marginImpact: "Route optimization saves 10-15% on fuel and labor. AI sorting increases recycling yield 20-30%.",
    currentMargin: 19.8,
    marginTarget: "22-24% operating margin as AI reduces labor per route and improves recycling economics",
    aiInvestment: "Partnered with NVIDIA for AI sorting facilities. Deploying autonomous collection in select markets.",
    catalyst: "Recycling revenue inflection as AI sorting captures higher-value materials",
    risk: "Capital intensity of AI upgrades. Down 11% in past year.",
    thesis: "Market treats WM as a boring utility. But AI is turning waste into a tech-enabled platform with operating leverage.",
    managementEdge: "Jim Fish (CEO since 2016) rebranded WM from a trash hauler to a 'technology company that handles waste.' He personally drove the NVIDIA partnership for AI-powered recycling facilities and championed the investment in autonomous collection trucks. Before WM, Fish held leadership roles in tech-forward industrial companies. He's been on CNBC explicitly saying 'we are deploying more AI than most tech companies you cover.' Under his leadership, WM built a centralized data platform across 26,000+ trucks and invested in computer vision sorting that no competitor has matched at scale. Republic Services is trying to follow but is 3-4 years behind on AI recycling.",
  },
];

export const SECTOR_CATEGORIES = [
  "Financials / Banking",
  "Financials / Insurance",
  "Financials / Brokerage",
  "Healthcare / Insurance",
  "Healthcare / Hospitals",
  "Industrials / Agriculture",
  "Industrials / Heavy Equipment",
  "Industrials / Logistics",
  "Consumer Staples / Retail",
  "Communication Services / Telecom",
  "Industrials / Waste",
] as const;

export const MATURITY_LABELS: Record<string, { label: string; color: string }> = {
  early: { label: "Early Stage", color: "text-yellow-400 bg-yellow-400/10 border-yellow-400/30" },
  scaling: { label: "Scaling", color: "text-blue-400 bg-blue-400/10 border-blue-400/30" },
  embedded: { label: "Embedded", color: "text-green-400 bg-green-400/10 border-green-400/30" },
};
