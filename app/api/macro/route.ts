import { NextRequest, NextResponse } from "next/server";
import { initDB, getMacroSeries, getLatestMacro } from "@/lib/db";
import { FRED_SERIES } from "@/lib/apis/fred";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await initDB();
    const { searchParams } = new URL(req.url);
    const seriesId = searchParams.get("series");

    if (seriesId) {
      const limit = parseInt(searchParams.get("limit") || "60");
      const data = await getMacroSeries(seriesId, limit);
      return NextResponse.json({
        series: seriesId,
        label: (FRED_SERIES as Record<string, string>)[seriesId] || seriesId,
        data,
      });
    }

    // Return latest values for all series
    const latest = await getLatestMacro();
    const formatted = latest.map((row) => ({
      series: row.series_id,
      label: (FRED_SERIES as Record<string, string>)[row.series_id] || row.series_id,
      date: row.date,
      value: row.value,
    }));

    return NextResponse.json(formatted);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
