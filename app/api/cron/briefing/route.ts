import { NextRequest, NextResponse } from "next/server";
import { initDB, saveBriefing, insertSignal } from "@/lib/db";
import { generateBriefing } from "@/lib/agent/briefing-agent";
import { sendBriefingDigest, type DigestExtras } from "@/lib/email";
import { getOpenSignalsWithPrices } from "@/lib/scorecard";
import { getValuationSnapshot } from "@/lib/valuation";
import { getThisWeekEarnings } from "@/lib/earnings-calendar";

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
    let briefing;
    try {
      briefing = await generateBriefing();
    } catch (agentErr) {
      return NextResponse.json({
        error: "Agent failed",
        details: String(agentErr),
        stack: agentErr instanceof Error ? agentErr.stack : undefined,
      }, { status: 500 });
    }

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

    // 3. Save briefing to database FIRST (before email, so we don't lose data)
    const today = new Date().toISOString().split("T")[0];
    try {
      await saveBriefing(today, briefing, false);
    } catch (saveErr) {
      return NextResponse.json({ error: "Save failed", details: String(saveErr) }, { status: 500 });
    }

    // 4. Compute deterministic email sections (scorecard, valuation, earnings)
    // — these change daily by construction and never depend on the agent
    const extras: DigestExtras = {};
    try {
      extras.scorecard = await getOpenSignalsWithPrices();
    } catch (err) {
      console.warn("Scorecard extras failed:", err);
    }
    try {
      extras.valuation = await getValuationSnapshot();
    } catch (err) {
      console.warn("Valuation extras failed:", err);
    }
    const weekday = new Date().toLocaleDateString("en-US", { weekday: "long", timeZone: "America/New_York" });
    if (weekday === "Monday") {
      extras.earnings = getThisWeekEarnings();
    }

    // 5. Send email digest
    const recipientEmail = process.env.DIGEST_EMAIL;
    let emailSent = false;
    if (recipientEmail) {
      emailSent = (await sendBriefingDigest(briefing, recipientEmail, extras)) || false;
      if (emailSent) {
        await saveBriefing(today, briefing, true);
      }
    }

    return NextResponse.json({
      success: true,
      date: today,
      newsCount: briefing.newsHeadlines.length,
      signalsCount: briefing.tradeSignals.length,
      ipoCount: briefing.upcomingIpos.length,
      concentrationLevel: briefing.concentrationRisk.level,
      emailSent,
      briefingSummary: briefing.marketOverview.summary.slice(0, 300),
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
