import { createClient } from "@deepgram/sdk";

export function getDeepgramClient() {
  const apiKey =
    process.env.DEEPGRAM_API_KEY ?? process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY;

  if (!apiKey) {
    throw new Error("Missing DEEPGRAM_API_KEY or NEXT_PUBLIC_DEEPGRAM_API_KEY");
  }

  return createClient(apiKey);
}

