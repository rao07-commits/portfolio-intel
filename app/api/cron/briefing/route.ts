import { NextRequest, NextResponse } from "next/server";
import { initDB, saveBriefing, insertSignal } from "@/lib/db";
import { generateBriefing } from "@/lib/agent/briefing-agent";
import { sendBriefingDigest } from "@/lib/email";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await initDB();

    // 1. Run the Claude agent to generate the briefing
    const briefing = await generateBriefing();

    // 2. Store trade signals in the database
    for (const signal of briefing.tradeSignals) {
      await insertSignal({
        symbol: signal.symbol,
        action: signal.action,
        reason: signal.reason,
        confidence: signal.confidence,
        source: "agent",
        entry_range: signal.entryRange,
        target_price: signal.targetPrice,
        stop_loss: signal.stopLoss,
        timeframe: signal.timeframe,
      });
    }

    // 3. Save briefing to database
    const today = new Date().toISOString().split("T")[0];

    // 4. Send email digest
    const recipientEmail = process.env.DIGEST_EMAIL;
    let emailSent = false;
    if (recipientEmail) {
      emailSent = await sendBriefingDigest(briefing, recipientEmail);
    }

    await saveBriefing(today, briefing, emailSent);

    return NextResponse.json({
      success: true,
      date: today,
      newsCount: briefing.newsHeadlines.length,
      signalsCount: briefing.tradeSignals.length,
      ipoCount: briefing.upcomingIpos.length,
      concentrationLevel: briefing.concentrationRisk.level,
      emailSent,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Briefing generation failed:", err);
    return NextResponse.json(
      { error: "Briefing generation failed", details: String(err) },
      { status: 500 }
    );
  }
}
