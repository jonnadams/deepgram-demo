"use client";

import type { Insights } from "@/types/insights";

export async function requestInsights(transcript: string): Promise<Insights> {
  const res = await fetch("/api/analyze", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ transcript }),
  });

  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as
      | { error?: string }
      | null;
    throw new Error(data?.error ?? "Failed to analyze transcript.");
  }

  return (await res.json()) as Insights;
}

