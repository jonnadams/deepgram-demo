export type SpeakerLabel = "Agent" | "Customer";

export interface TranscriptSegment {
  id: string;
  speaker: SpeakerLabel;
  text: string;
  timestamp: number;
  isFinal: boolean;
}

export interface TranscriptSession {
  id: string;
  createdAt: string;
  text: string;
  segments: TranscriptSegment[];
  dominantSentiment: "positive" | "neutral" | "negative";
  topics: string[];
}

