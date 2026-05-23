import { NextResponse } from "next/server";
import { initDB, getActiveSignals } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await initDB();
    const signals = await getActiveSignals();
    return NextResponse.json(signals);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
