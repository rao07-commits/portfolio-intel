import { NextRequest, NextResponse } from "next/server";
import { initDB, getAllBriefings, getBriefingByDate, getLatestBriefing } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await initDB();
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");

    if (date) {
      const briefing = await getBriefingByDate(date);
      if (!briefing) return NextResponse.json({ error: "No briefing for this date" }, { status: 404 });
      return NextResponse.json(briefing);
    }

    const latest = searchParams.get("latest");
    if (latest === "true") {
      const briefing = await getLatestBriefing();
      if (!briefing) return NextResponse.json({ error: "No briefings yet" }, { status: 404 });
      return NextResponse.json(briefing);
    }

    const all = await getAllBriefings();
    return NextResponse.json(all);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
