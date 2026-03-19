"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { TranscriptSession } from "@/types/transcript";

interface SearchPanelProps {
  sessions: TranscriptSession[];
}

export default function SearchPanel({ sessions }: SearchPanelProps) {
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sessions;
    return sessions.filter((s) => s.text.toLowerCase().includes(q));
  }, [query, sessions]);

  return (
    <section className="glass-panel flex flex-col gap-3 p-4 md:p-5 lg:p-6">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold tracking-tight text-slate-50 md:text-base">
            Transcript Search
          </h2>
          <p className="text-[11px] text-slate-400 md:text-xs">
            Search across saved conversations (persisted in this browser).
          </p>
        </div>
        <span className="text-[11px] text-slate-500">
          {sessions.length} session{sessions.length === 1 ? "" : "s"}
        </span>
      </header>

      <div className="flex flex-col gap-3">
        <div className="relative">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-full border border-slate-700 bg-slate-950/70 px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 md:px-3.5 md:py-2.5 md:text-sm"
            placeholder="Search transcripts for keywords..."
          />
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[10px] text-slate-500 md:text-xs">
            ⌘K
          </span>
        </div>

        <div className="max-h-44 space-y-2 overflow-y-auto rounded-xl border border-white/5 bg-slate-950/70 p-2 text-xs shadow-inner shadow-black/40">
          {results.length === 0 ? (
            <p className="text-[11px] text-slate-500">
              {sessions.length === 0
                ? "Record a conversation to save and search it here."
                : "No matches found. Try another phrase."}
            </p>
          ) : (
            results.map((session) => (
              <Link
                key={session.id}
                href={`/session/${session.id}`}
                className="block rounded-lg border border-slate-800/70 bg-slate-900/60 px-2.5 py-2 transition hover:bg-slate-900/80 focus:outline-none focus:ring-2 focus:ring-cyan-400/60"
              >
                <header className="mb-1 flex items-center justify-between gap-2 text-[11px] text-slate-400">
                  <span>
                    {new Date(session.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    <span>{session.dominantSentiment}</span>
                  </span>
                </header>
                <p className="line-clamp-2 text-[11px] text-slate-200">
                  {session.text}
                </p>
              </Link>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
