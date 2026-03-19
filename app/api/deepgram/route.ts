import { NextResponse } from "next/server";

export async function GET() {
  const apiKey = process.env.DEEPGRAM_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "DEEPGRAM_API_KEY is not configured." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    apiKey,
    websocketUrl:
      "wss://api.deepgram.com/v1/listen?model=nova-3&punctuate=true&interim_results=true&eot_threshold=0.7&eot_timeout_ms=5000",
  });
}

