import { NextResponse } from "next/server";
import { analyzeInsights } from "@/services/insights.service";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as
    | { transcript?: string }
    | null;

  const transcript = body?.transcript ?? "";

  if (!transcript.trim()) {
    return NextResponse.json(
      { error: "Transcript text is required." },
      { status: 400 },
    );
  }

  const insights = await analyzeInsights(transcript);

  return NextResponse.json(insights);
}

