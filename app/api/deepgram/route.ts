import { NextResponse } from "next/server";

export async function GET() {
  const apiKey =
    process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY ?? process.env.DEEPGRAM_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "Deepgram API key is not configured." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    apiKey,
    websocketUrl:
      "wss://api.deepgram.com/v1/listen?model=nova-3&punctuate=true&interim_results=true",
  });
}

