"use client";

interface Signal {
  id: number;
  symbol: string;
  action: string;
  reason: string;
  confidence: string;
  entry_range: string | null;
  target_price: string | null;
  stop_loss: string | null;
  timeframe: string | null;
  generated_at: string;
}

interface Props {
  signals: Signal[];
}

function actionColor(action: string): string {
  const a = action.toLowerCase();
  if (a.includes("buy") || a.includes("add")) return "text-green-400 bg-green-400/10 border-green-400/30";
  if (a.includes("sell") || a.includes("trim")) return "text-red-400 bg-red-400/10 border-red-400/30";
  return "text-yellow-400 bg-yellow-400/10 border-yellow-400/30";
}

function confidenceBadge(confidence: string): string {
  const c = confidence.toLowerCase();
  if (c === "high") return "text-green-400";
  if (c === "medium") return "text-yellow-400";
  return "text-slate-400";
}

export default function TradeSignals({ signals }: Props) {
  if (signals.length === 0) {
    return (
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <h2 className="text-slate-400 text-sm font-medium mb-4">Trade Signals</h2>
        <p className="text-slate-500 text-sm">No active signals. Run the daily briefing to generate new signals.</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
      <h2 className="text-slate-400 text-sm font-medium mb-4">Active Trade Signals</h2>
      <div className="space-y-3">
        {signals.map((s) => (
          <div key={s.id} className="border border-slate-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase border ${actionColor(s.action)}`}>
                  {s.action}
                </span>
                <span className="text-white font-bold">{s.symbol}</span>
              </div>
              <span className={`text-xs font-medium ${confidenceBadge(s.confidence)}`}>
                {s.confidence} confidence
              </span>
            </div>
            <p className="text-slate-400 text-sm mb-2">{s.reason}</p>
            <div className="flex gap-4 text-xs text-slate-500">
              {s.entry_range && <span>Entry: {s.entry_range}</span>}
              {s.target_price && <span>Target: {s.target_price}</span>}
              {s.stop_loss && <span>Stop: {s.stop_loss}</span>}
              {s.timeframe && <span>{s.timeframe}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
