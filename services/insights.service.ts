import type { Insights } from "@/types/insights";
import OpenAI from "openai";
import { z } from "zod";

const STOPWORDS = new Set([
  "the",
  "a",
  "an",
  "and",
  "or",
  "but",
  "with",
  "for",
  "of",
  "to",
  "in",
  "on",
  "at",
  "is",
  "are",
  "was",
  "were",
]);

const POSITIVE_KEYWORDS = ["great", "good", "love", "happy", "awesome", "nice"];
const NEGATIVE_KEYWORDS = ["bad", "angry", "upset", "hate", "issue", "problem"];

const LLMInsightsSchema = z.object({
  topics: z.array(z.string().min(1)).max(7),
  sentiment: z.enum(["positive", "neutral", "negative"]),
  actionItems: z.array(z.string().min(1)).max(7),
});

const responseJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    topics: {
      type: "array",
      description: "Detected conversation topics (most salient first).",
      items: { type: "string" },
      maxItems: 7,
    },
    sentiment: {
      type: "string",
      description: "Overall sentiment inferred from the transcript.",
      enum: ["positive", "neutral", "negative"],
    },
    actionItems: {
      type: "array",
      description: "Concrete next actions mentioned or implied.",
      items: { type: "string" },
      maxItems: 7,
    },
  },
  required: ["topics", "sentiment", "actionItems"],
} as const;

function heuristicAnalyzeInsights(transcript: string): Insights {
  const lower = transcript.toLowerCase();

  let score = 0;
  for (const word of POSITIVE_KEYWORDS) {
    if (lower.includes(word)) score += 1;
  }
  for (const word of NEGATIVE_KEYWORDS) {
    if (lower.includes(word)) score -= 1;
  }

  const sentiment: Insights["sentiment"] =
    score > 0 ? "positive" : score < 0 ? "negative" : "neutral";

  const tokens = lower
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t && !STOPWORDS.has(t));

  const freq = new Map<string, number>();
  for (const token of tokens) {
    freq.set(token, (freq.get(token) ?? 0) + 1);
  }

  const topics = Array.from(freq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([word]) => word);

  const actionItems: string[] = [];
  if (lower.includes("follow up") || lower.includes("follow-up")) {
    actionItems.push("Schedule a follow-up conversation.");
  }
  if (lower.includes("send") && lower.includes("email")) {
    actionItems.push("Send a recap email with key points.");
  }
  if (lower.includes("demo") || lower.includes("walkthrough")) {
    actionItems.push("Arrange a product demo or walkthrough.");
  }
  if (lower.includes("next step") || lower.includes("next steps")) {
    actionItems.push("Clarify and confirm next steps with the customer.");
  }

  return {
    topics,
    sentiment,
    actionItems,
    lastUpdatedAt: new Date().toISOString(),
  };
}

export async function analyzeInsights(transcript: string): Promise<Insights> {
  const openAiKey = process.env.OPENAI_API_KEY;

  // Keep the dashboard usable without an LLM key.
  if (!openAiKey) return heuristicAnalyzeInsights(transcript);

  const client = new OpenAI({ apiKey: openAiKey });

  const prompt = [
    "Extract structured voice insights from the transcript.",
    "Return only the JSON object matching the provided schema.",
    "Use topics/action items that are explicit or strongly implied by the conversation.",
    "Sentiment must be one of: positive, neutral, negative.",
  ].join(" ");

  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.2,
    messages: [
      { role: "system", content: prompt },
      {
        role: "user",
        content:
          `Transcript:\n` +
          transcript.slice(0, 12000) +
          `\n\nReturn topics, sentiment, and actionItems.`,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "voice_insights",
        schema: responseJsonSchema,
        strict: true,
      },
    },
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) return heuristicAnalyzeInsights(transcript);

  const parsed = JSON.parse(content) as unknown;
  const validated = LLMInsightsSchema.safeParse(parsed);
  if (!validated.success) return heuristicAnalyzeInsights(transcript);

  return {
    ...validated.data,
    lastUpdatedAt: new Date().toISOString(),
  };
}

