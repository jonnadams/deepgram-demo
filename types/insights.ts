export type SentimentLabel = "positive" | "neutral" | "negative";

export interface Insights {
  topics: string[];
  sentiment: SentimentLabel;
  actionItems: string[];
  lastUpdatedAt: string | null;
}

