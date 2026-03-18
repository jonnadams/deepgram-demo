import type { TranscriptSegment } from "@/types/transcript";

interface DeepgramAlternative {
  transcript?: string;
}

interface DeepgramChannel {
  alternatives?: DeepgramAlternative[];
}

interface DeepgramResult {
  channel?: DeepgramChannel;
  is_final?: boolean;
  speech_final?: boolean;
  start?: number;
}

interface DeepgramMessage {
  type?: string;
  channel_index?: number[];
  timestamp?: number;
  duration?: number;
  is_final?: boolean;
  speech_final?: boolean;
  start?: number;
  metadata?: unknown;
  error?: unknown;
  alternatives?: DeepgramAlternative[];
  channel?: DeepgramChannel;
  result?: DeepgramResult;
}

let counter = 0;

export function parseDeepgramMessage(
  raw: string,
  currentSpeaker: "Agent" | "Customer",
): TranscriptSegment | null {
  let data: DeepgramMessage | undefined;
  try {
    data = JSON.parse(raw) as DeepgramMessage;
  } catch {
    return null;
  }

  const transcript =
    data.channel?.alternatives?.[0]?.transcript ??
    data.result?.channel?.alternatives?.[0]?.transcript ??
    "";
  if (!transcript.trim()) return null;

  counter += 1;

  const startSeconds = data.start ?? data.result?.start;
  const timestampSeconds =
    typeof startSeconds === "number" ? startSeconds : Date.now() / 1000;

  const isFinal = Boolean(
    data.is_final ?? data.speech_final ?? data.result?.is_final ?? data.result?.speech_final,
  );

  const segment: TranscriptSegment = {
    id: `seg-${counter}`,
    speaker: currentSpeaker,
    text: transcript.trim(),
    timestamp: timestampSeconds,
    isFinal,
  };

  return segment;
}

