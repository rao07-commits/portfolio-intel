"use client";

import { TARGET_ALLOCATION } from "@/lib/allocation";
import type { SectorExposure } from "@/lib/portfolio";

interface Props {
  sectors: SectorExposure[];
}

const SECTOR_COLORS: Record<string, string> = {
  technology: "bg-blue-500",
  consumer_discretionary: "bg-purple-500",
  communication_services: "bg-indigo-500",
  financials: "bg-yellow-500",
  broad_market: "bg-slate-500",
  international: "bg-teal-500",
  commodities: "bg-amber-500",
  crypto: "bg-orange-500",
  cash: "bg-slate-400",
  other: "bg-slate-600",
};

export default function AllocationMap({ sectors }: Props) {
  return (
    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
      <h2 className="text-slate-400 text-sm font-medium mb-4">Sector Allocation vs Target</h2>
      <div className="space-y-3">
        {sectors.map((s) => {
          const target = TARGET_ALLOCATION[s.sector] || 0;
          const diff = s.weight - target;
          const isOver = diff > 3;
          const isUnder = diff < -3;

          return (
            <div key={s.sector}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-slate-300 text-sm">{s.label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 text-xs">Target: {target}%</span>
                  <span className={`text-sm font-semibold ${isOver ? "text-red-400" : isUnder ? "text-yellow-400" : "text-green-400"}`}>
                    {s.weight.toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="relative h-3 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${SECTOR_COLORS[s.sector] || "bg-slate-500"}`}
                  style={{ width: `${Math.min(s.weight, 100)}%` }}
                />
                {target > 0 && (
                  <div
                    className="absolute top-0 h-full w-0.5 bg-white/50"
                    style={{ left: `${Math.min(target, 100)}%` }}
                  />
                )}
              </div>
              <div className="flex gap-1 mt-1">
                {s.holdings.map((sym) => (
                  <span key={sym} className="text-slate-500 text-xs">{sym}</span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
