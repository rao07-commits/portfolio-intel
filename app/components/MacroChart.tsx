"use client";

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface MacroChartProps {
  title: string;
  data: { date: string; value: number }[];
  color?: string;
  unit?: string;
  currentValue?: number;
  trend?: "up" | "down" | "flat";
  implication?: string;
}

export default function MacroChart({
  title,
  data,
  color = "#3b82f6",
  unit = "",
  currentValue,
  trend,
  implication,
}: MacroChartProps) {
  const trendArrow = trend === "up" ? "\u2191" : trend === "down" ? "\u2193" : "\u2192";
  const trendColor = trend === "up" ? "text-red-400" : trend === "down" ? "text-green-400" : "text-slate-400";

  const chartData = [...data].reverse();

  return (
    <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-slate-300 text-sm font-medium">{title}</h3>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-white text-2xl font-bold">
              {currentValue !== undefined ? currentValue.toFixed(2) : data[0]?.value.toFixed(2)}
              {unit}
            </span>
            {trend && (
              <span className={`text-lg ${trendColor}`}>{trendArrow}</span>
            )}
          </div>
        </div>
      </div>

      <div className="h-24">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id={`grad-${title.replace(/\s/g, "")}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" hide />
            <YAxis hide domain={["auto", "auto"]} />
            <Tooltip
              contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "8px", color: "#e2e8f0", fontSize: "12px" }}
              formatter={(value: unknown) => [`${Number(value).toFixed(2)}${unit}`, title]}
              labelFormatter={(label) => String(label)}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              fill={`url(#grad-${title.replace(/\s/g, "")})`}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {implication && (
        <p className="text-slate-500 text-xs mt-2 italic">{implication}</p>
      )}
    </div>
  );
}
