"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Recorder from "@/components/Recorder";
import TranscriptPanel from "@/components/TranscriptPanel";
import InsightsPanel from "@/components/InsightsPanel";
import SearchPanel from "@/components/SearchPanel";
import type {
  Insights,
  SentimentLabel,
} from "@/types/insights";
import type {
  TranscriptSegment,
  TranscriptSession,
} from "@/types/transcript";
import { requestInsights } from "@/services/insights.client";
import { loadSessions, saveSessions } from "@/lib/sessions-storage";

type ConnectionStatus = "idle" | "connecting" | "live" | "error";

export default function Home() {
  const [finalSegments, setFinalSegments] = useState<TranscriptSegment[]>(
    [],
  );
  const [interimSegment, setInterimSegment] = useState<
    TranscriptSegment | null
  >(null);
  const [status, setStatus] = useState<ConnectionStatus>("idle");
  const [insights, setInsights] = useState<Insights>({
    topics: [],
    sentiment: "neutral",
    actionItems: [],
    lastUpdatedAt: null,
  });
  const [sessions, setSessions] = useState<TranscriptSession[]>([]);
  const hasLoadedSessions = useRef(false);

  // Always render final transcript, and render interim only while recording is active.
  const segmentsForUI = useMemo(() => {
    if (status !== "live" && status !== "connecting") return finalSegments;
    if (!interimSegment) return finalSegments;
    return [...finalSegments, interimSegment];
  }, [finalSegments, interimSegment, status]);

  // Load persisted sessions from localStorage on mount (deferred to avoid sync setState in effect)
  useEffect(() => {
    const loaded = loadSessions();
    queueMicrotask(() => {
      setSessions(loaded);
      hasLoadedSessions.current = true;
    });
  }, []);

  // Persist sessions to localStorage whenever they change (after initial load)
  useEffect(() => {
    if (hasLoadedSessions.current) saveSessions(sessions);
  }, [sessions]);

  const fullTranscript = useMemo(() => {
    // Interim vs final separation avoids duplication:
    // - interim updates replace the same temporary segment in place
    // - final updates append only once to finalSegments
    const source =
      status === "live" || status === "connecting"
        ? interimSegment
          ? [...finalSegments, interimSegment]
          : finalSegments
        : finalSegments;
    return source.map((s) => s.text).join(" ").trim();
  }, [finalSegments, interimSegment, status]);

  useEffect(() => {
    if (!fullTranscript.trim()) return;

    let cancelled = false;

    const handle = setTimeout(async () => {
      try {
        const next = await requestInsights(fullTranscript);
        if (!cancelled) setInsights(next);
      } catch {
        // Keep existing insights on transient errors.
      }
    }, 2500);

    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [fullTranscript]);

  const handleSegment = useCallback((segment: TranscriptSegment) => {
    // Interim vs final separation is necessary because Deepgram streams
    // partial text repeatedly while the user speaks.
    if (segment.isFinal) {
      setInterimSegment(null);
      setFinalSegments((prev) => {
        const last = prev[prev.length - 1];
        // Prevent duplicate finals when Deepgram repeats identical final text.
        if (
          last &&
          last.speaker === segment.speaker &&
          last.text.trim() === segment.text.trim()
        ) {
          return prev;
        }
        return [...prev, segment];
      });
    } else {
      // Replace interim in place (do not append) to avoid repeated phrases.
      setInterimSegment(segment);
    }
  }, []);

  const handleRecordingStop = useCallback(() => {
    // Interim should not be persisted. Persist only finalized segments.
    setInterimSegment(null);
    if (!finalSegments.length) return;
    const text = finalSegments.map((s) => s.text).join(" ").trim();
    if (!text) return;

    const session: TranscriptSession = {
      id: `${Date.now()}`,
      createdAt: new Date().toISOString(),
      text,
      segments: finalSegments,
      dominantSentiment: insights.sentiment as SentimentLabel,
      topics: insights.topics,
      actionItems: insights.actionItems,
    };
    setSessions((prev) => [session, ...prev]);
  }, [finalSegments, insights]);

  const handleResetCurrent = useCallback(() => {
    setFinalSegments([]);
    setInterimSegment(null);
    setInsights({
      topics: [],
      sentiment: "neutral",
      actionItems: [],
      lastUpdatedAt: null,
    });
  }, []);

  return (
    <main className="flex min-h-screen flex-col px-4 py-6 text-slate-100 md:px-8 lg:px-12">
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6">
        <header className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500/20 ring-1 ring-sky-400/40">
              <span className="text-lg font-semibold tracking-tight text-sky-100">
                VI
              </span>
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-slate-50 md:text-2xl">
                Voice Intelligence
              </h1>
              <p className="text-xs text-slate-400 md:text-sm">
                Real-time transcription and AI-powered insights.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-slate-900/70 px-3 py-1.5 text-xs shadow-lg shadow-black/30">
              <span
                className={`h-2 w-2 rounded-full ${
                  status === "live"
                    ? "bg-emerald-400 shadow-[0_0_0_4px] shadow-emerald-400/40"
                    : status === "connecting"
                      ? "bg-amber-400"
                      : status === "error"
                        ? "bg-rose-500"
                        : "bg-slate-500"
                }`}
              />
              <span className="font-medium uppercase tracking-wide text-slate-200">
                {status === "live"
                  ? "Live"
                  : status === "connecting"
                    ? "Connecting"
                    : status === "error"
                      ? "Error"
                      : "Idle"}
              </span>
            </div>
          </div>
        </header>

        <section className="grid flex-1 grid-cols-1 gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)]">
          <TranscriptPanel
            segments={segmentsForUI}
            status={status}
          />
          <div className="flex flex-col gap-6">
            <InsightsPanel insights={insights} />
            <SearchPanel sessions={sessions} />
          </div>
        </section>

        <section className="mt-2 flex flex-col items-center justify-between gap-4 rounded-2xl border border-sky-500/20 bg-linear-to-r from-sky-900/50 via-slate-950 to-emerald-900/40 px-4 py-3 shadow-[0_-16px_60px_rgba(15,23,42,0.9)] md:flex-row md:px-6 lg:px-8">
          <div className="flex items-center gap-3 text-xs text-slate-300 md:text-sm">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-900/80 ring-1 ring-sky-500/40">
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-950">
                <div className="flex h-3 w-3 items-center justify-center rounded-full bg-emerald-400" />
              </div>
            </div>
            <div>
              <p className="font-medium text-slate-100">
                Speak naturally.
              </p>
              <p className="text-[11px] text-slate-400 md:text-xs">
                We stream audio to Deepgram&apos;s nova-3 model for low-latency
                transcription.
              </p>
            </div>
          </div>

          <Recorder
            onSegment={handleSegment}
            onStatusChange={setStatus}
            onStop={handleRecordingStop}
            onResetCurrent={handleResetCurrent}
          />
        </section>
      </div>
    </main>
  );
}
