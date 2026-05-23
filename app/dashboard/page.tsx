import MacroChart from "../components/MacroChart";
import { FRED_SERIES } from "@/lib/apis/fred";

const CHART_CONFIG: Record<string, { color: string; unit: string; implication: string }> = {
  FEDFUNDS: { color: "#3b82f6", unit: "%", implication: "Falling rates favor growth/tech" },
  CPIAUCSL: { color: "#ef4444", unit: "%", implication: "Falling CPI supports rate cuts" },
  PPIFIS: { color: "#f97316", unit: "", implication: "Leading indicator for CPI" },
  UNRATE: { color: "#eab308", unit: "%", implication: "Rising unemployment triggers defensive rotation" },
  GDP: { color: "#22c55e", unit: "B", implication: "GDP growth supports cyclicals" },
  T10Y2Y: { color: "#8b5cf6", unit: "%", implication: "Steepening favors financials; inversion signals recession" },
  NAPM: { color: "#06b6d4", unit: "", implication: ">50 = expansion, <50 = contraction" },
  UMCSENT: { color: "#ec4899", unit: "", implication: "Falling sentiment reduces consumer discretionary outlook" },
  T10YIE: { color: "#f43f5e", unit: "%", implication: "Rising breakevens support commodities/TIPS" },
  MORTGAGE30US: { color: "#14b8a6", unit: "%", implication: "Lower rates support housing/REITs" },
};

async function fetchMacroData() {
  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";

  try {
    const res = await fetch(`${baseUrl}/api/macro`, {
      cache: "no-store",
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

async function fetchSeriesData(seriesId: string) {
  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";

  try {
    const res = await fetch(`${baseUrl}/api/macro?series=${seriesId}&limit=24`, {
      cache: "no-store",
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.data || [];
  } catch {
    return [];
  }
}

export default async function DashboardPage() {
  const latestData = await fetchMacroData();
  const latestMap: Record<string, number> = {};
  for (const item of latestData) {
    latestMap[item.series] = item.value;
  }

  // Fetch historical data for each series
  const seriesIds = Object.keys(FRED_SERIES);
  const seriesData: Record<string, { date: string; value: number }[]> = {};
  for (const id of seriesIds) {
    seriesData[id] = await fetchSeriesData(id);
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Macro Dashboard</h1>
          <p className="text-slate-400 mt-1">FRED economic indicators and sector rotation signals</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {seriesIds.map((id) => {
            const config = CHART_CONFIG[id] || { color: "#3b82f6", unit: "", implication: "" };
            const label = (FRED_SERIES as Record<string, string>)[id] || id;
            const data = seriesData[id] || [];

            // Determine trend
            let trend: "up" | "down" | "flat" = "flat";
            if (data.length >= 2) {
              const diff = data[0]?.value - data[1]?.value;
              if (diff > 0.01) trend = "up";
              else if (diff < -0.01) trend = "down";
            }

            return (
              <MacroChart
                key={id}
                title={label}
                data={data}
                color={config.color}
                unit={config.unit}
                currentValue={latestMap[id]}
                trend={trend}
                implication={config.implication}
              />
            );
          })}
        </div>

        {/* Sector Rotation Summary */}
        <div className="mt-8 bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h2 className="text-xl font-bold mb-4">Rotation Signals</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h3 className="text-green-400 font-semibold mb-2">Favorable Conditions</h3>
              <ul className="space-y-1 text-slate-300">
                {latestMap["T10Y2Y"] > 0 && <li>+ Yield curve positive: financials/cyclicals favored</li>}
                {latestMap["NAPM"] > 50 && <li>+ ISM above 50: manufacturing expanding</li>}
                {latestMap["FEDFUNDS"] < 5 && <li>+ Accommodative rates: growth/tech supported</li>}
                {latestMap["UMCSENT"] > 70 && <li>+ Consumer sentiment healthy: discretionary OK</li>}
              </ul>
            </div>
            <div>
              <h3 className="text-red-400 font-semibold mb-2">Risk Signals</h3>
              <ul className="space-y-1 text-slate-300">
                {latestMap["T10Y2Y"] < 0 && <li>- Yield curve inverted: recession risk elevated</li>}
                {latestMap["CPIAUCSL"] > 3 && <li>- CPI above 3%: inflation concerns persist</li>}
                {latestMap["UNRATE"] > 5 && <li>- Unemployment above 5%: labor market weakening</li>}
                {latestMap["UMCSENT"] < 60 && <li>- Consumer sentiment weak: reduce discretionary</li>}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
