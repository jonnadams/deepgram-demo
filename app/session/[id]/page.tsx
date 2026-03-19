"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import InsightsPanel from "@/components/InsightsPanel";
import TranscriptPanel from "@/components/TranscriptPanel";
import type { Insights } from "@/types/insights";
import type { TranscriptSession } from "@/types/transcript";
import { loadSessions } from "@/lib/sessions-storage";

function formatSavedSubtitle(createdAt: string): string {
  const d = new Date(createdAt);
  return d.toLocaleString([], {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function SessionPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  // Load the persisted session once on first render.
  const [session] = useState<TranscriptSession | null>(() => {
    const sessions = loadSessions();
    return sessions.find((s) => s.id === id) ?? null;
  });

  const insights = useMemo<Insights | null>(() => {
    if (!session) return null;
    return {
      topics: session.topics,
      sentiment: session.dominantSentiment,
      actionItems: session.actionItems,
      lastUpdatedAt: session.createdAt,
    };
  }, [session]);

  const savedSubtitle = session ? formatSavedSubtitle(session.createdAt) : "";

  return (
    <main className="flex min-h-screen flex-col px-4 py-6 text-slate-100 md:px-8 lg:px-12">
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6">
        <header className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="rounded-full border border-white/10 bg-slate-900/60 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-900/80"
            >
              Back
            </Link>
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-slate-50 md:text-2xl">
                Conversation History
              </h1>
              <p className="text-xs text-slate-400 md:text-sm">
                {session ? savedSubtitle : "Loading session..."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-full bg-slate-900/60 px-3 py-1.5 text-[11px] text-slate-300 ring-1 ring-white/10">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Persisted in this browser
          </div>
        </header>

        {!session || !insights ? (
          <section className="glass-panel flex min-h-[320px] flex-col p-6">
            <p className="text-sm text-slate-200">
              This session could not be found. Record a new conversation or
              check localStorage for persisted sessions.
            </p>
          </section>
        ) : (
          <section className="grid flex-1 grid-cols-1 gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)]">
            <TranscriptPanel
              segments={session.segments}
              status="idle"
              mode="history"
              headerSubtitle={`Saved recording • ${savedSubtitle}`}
              modelLabel="nova-3"
            />
            <div className="flex flex-col gap-6">
              <InsightsPanel insights={insights} />
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

