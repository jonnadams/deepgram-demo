import type { TranscriptSession } from "@/types/transcript";

const STORAGE_KEY = "voice-intelligence-sessions";

function normalizeSession(value: unknown): TranscriptSession | null {
  if (typeof value !== "object" || value === null) return null;

  const v = value as Record<string, unknown>;
  const id = v.id;
  const createdAt = v.createdAt;
  const text = v.text;
  const segments = v.segments;
  const dominantSentiment = v.dominantSentiment;
  const topics = v.topics;
  const actionItems = v.actionItems;

  if (typeof id !== "string") return null;
  if (typeof createdAt !== "string") return null;
  if (typeof text !== "string") return null;
  if (!Array.isArray(segments)) return null;
  if (dominantSentiment !== "positive" && dominantSentiment !== "neutral" && dominantSentiment !== "negative") {
    return null;
  }
  if (!Array.isArray(topics)) return null;

  const normalizedActionItems =
    Array.isArray(actionItems) ? actionItems.filter((x) => typeof x === "string") : [];

  return {
    id,
    createdAt,
    text,
    segments: segments as TranscriptSession["segments"],
    dominantSentiment: dominantSentiment as TranscriptSession["dominantSentiment"],
    topics: topics as TranscriptSession["topics"],
    actionItems: normalizedActionItems,
  };
}

export function loadSessions(): TranscriptSession[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    const normalized = parsed.map(normalizeSession).filter((s): s is TranscriptSession => s !== null);
    return normalized;
  } catch {
    return [];
  }
}

export function saveSessions(sessions: TranscriptSession[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  } catch {
    // Ignore quota or other storage errors
  }
}
