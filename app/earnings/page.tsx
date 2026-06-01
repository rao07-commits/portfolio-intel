import { getUpcomingEarnings, getThisWeekEarnings, getNextWeekEarnings } from "@/lib/earnings-calendar";

function categoryBadge(cat: string) {
  const colors: Record<string, string> = {
    portfolio: "bg-blue-500/10 text-blue-400 border-blue-400/30",
    watchlist: "bg-purple-500/10 text-purple-400 border-purple-400/30",
    "ai-adopter": "bg-teal-500/10 text-teal-400 border-teal-400/30",
  };
  const labels: Record<string, string> = {
    portfolio: "Held",
    watchlist: "Watchlist",
    "ai-adopter": "AI Adopter",
  };
  return { color: colors[cat] || "", label: labels[cat] || cat };
}

function sigColor(sig: string) {
  if (sig === "high") return "text-red-400";
  if (sig === "medium") return "text-yellow-400";
  return "text-slate-500";
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" });
}

function EarningsTable({ events, title }: { events: ReturnType<typeof getUpcomingEarnings>; title: string }) {
  if (events.length === 0) {
    return (
      <div className="mb-6">
        <h2 className="text-lg font-bold mb-3 text-slate-300">{title}</h2>
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 text-center">
          <p className="text-slate-500">No earnings this period for tracked names</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <h2 className="text-lg font-bold mb-3 text-slate-300">{title}</h2>
      <div className="space-y-3">
        {events.sort((a, b) => a.date.localeCompare(b.date)).map((e, i) => {
          const badge = categoryBadge(e.category);
          return (
            <div key={i} className="bg-slate-800 rounded-xl border border-slate-700 p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-white text-xl font-bold">{e.symbol}</span>
                  <span className="text-slate-400 text-sm">{e.name}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs border ${badge.color}`}>{badge.label}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-bold uppercase ${sigColor(e.significance)}`}>
                    {e.significance} impact
                  </span>
                  <div className="text-right">
                    <div className="text-white text-sm font-semibold">{formatDate(e.date)}</div>
                    <div className="text-slate-500 text-xs">{e.timing === "BMO" ? "Before Open" : e.timing === "AMC" ? "After Close" : "TBD"}</div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-3">
                {e.epsEstimate && (
                  <div className="bg-slate-700/30 rounded-lg px-3 py-2">
                    <span className="text-slate-500 text-xs">EPS Est.</span>
                    <span className="text-white font-bold ml-2">${e.epsEstimate.toFixed(2)}</span>
                  </div>
                )}
                {e.revenueEstimate && (
                  <div className="bg-slate-700/30 rounded-lg px-3 py-2">
                    <span className="text-slate-500 text-xs">Rev Est.</span>
                    <span className="text-white font-bold ml-2">{e.revenueEstimate}</span>
                  </div>
                )}
              </div>

              <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-3">
                <span className="text-blue-400 text-xs font-bold uppercase">What to watch</span>
                <p className="text-slate-300 text-sm mt-1">{e.whatToWatch}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function EarningsPage() {
  const thisWeek = getThisWeekEarnings();
  const nextWeek = getNextWeekEarnings();
  const all = getUpcomingEarnings();

  // Separate into upcoming (next 30 days) and later
  const now = new Date();
  const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const upcoming = all.filter(e => new Date(e.date) <= thirtyDays && !thisWeek.includes(e) && !nextWeek.includes(e));
  const later = all.filter(e => new Date(e.date) > thirtyDays);

  // Count by category
  const portfolioCount = all.filter(e => e.category === "portfolio").length;
  const watchlistCount = all.filter(e => e.category === "watchlist").length;
  const adoptersCount = all.filter(e => e.category === "ai-adopter").length;
  const highImpact = all.filter(e => e.significance === "high").length;

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Earnings Calendar</h1>
          <p className="text-slate-400 mt-1">Upcoming earnings for portfolio holdings, watchlist, and AI adopter picks</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
            <div className="text-slate-500 text-xs uppercase">Portfolio</div>
            <div className="text-blue-400 text-2xl font-bold">{portfolioCount}</div>
            <div className="text-slate-500 text-xs">holdings reporting</div>
          </div>
          <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
            <div className="text-slate-500 text-xs uppercase">Watchlist</div>
            <div className="text-purple-400 text-2xl font-bold">{watchlistCount}</div>
            <div className="text-slate-500 text-xs">signal names reporting</div>
          </div>
          <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
            <div className="text-slate-500 text-xs uppercase">AI Adopters</div>
            <div className="text-teal-400 text-2xl font-bold">{adoptersCount}</div>
            <div className="text-slate-500 text-xs">tracked companies</div>
          </div>
          <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
            <div className="text-slate-500 text-xs uppercase">High Impact</div>
            <div className="text-red-400 text-2xl font-bold">{highImpact}</div>
            <div className="text-slate-500 text-xs">critical reports</div>
          </div>
        </div>

        <EarningsTable events={thisWeek} title="This Week" />
        <EarningsTable events={nextWeek} title="Next Week" />
        <EarningsTable events={upcoming} title="Next 30 Days" />
        {later.length > 0 && <EarningsTable events={later} title="Later" />}
      </div>
    </div>
  );
}
