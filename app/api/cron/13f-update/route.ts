import { NextRequest, NextResponse } from "next/server";
import { initDB } from "@/lib/db";
import { sync13f } from "@/lib/13f/sync";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await initDB();
    const summary = await sync13f();
    return NextResponse.json({
      success: summary.errors.length === 0,
      ...summary,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("13F sync failed:", err);
    return NextResponse.json({ error: "13F sync failed", details: String(err) }, { status: 500 });
  }
}
