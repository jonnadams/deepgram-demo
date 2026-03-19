import { useEffect, useRef } from "react";
import type { TranscriptSegment } from "@/types/transcript";

type ConnectionStatus = "idle" | "connecting" | "live" | "error";

interface TranscriptPanelProps {
  segments: TranscriptSegment[];
  status: ConnectionStatus;
  mode?: "live" | "history";
  headerSubtitle?: string;
  modelLabel?: string;
}

function formatTime(timestampSeconds: number): string {
  const totalSeconds = Math.floor(timestampSeconds);
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

export default function TranscriptPanel({
  segments,
  status,
  mode = "live",
  headerSubtitle,
  modelLabel = "nova-3",
}: TranscriptPanelProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [segments]);

  return (
    <section className="glass-panel flex min-h-[320px] max-h-[60vh] flex-col p-4 md:p-5 lg:p-6">
      <header className="mb-3 flex items-center justify-between gap-3 md:mb-4">
        <div>
          <h2 className="text-sm font-semibold tracking-tight text-slate-50 md:text-base">
            {mode === "live" ? "Live Transcript" : "Conversation History"}
          </h2>
          <p className="text-[11px] text-slate-400 md:text-xs">
            {headerSubtitle ??
              (mode === "live"
                ? status === "live"
                  ? "Streaming from your microphone in real time."
                  : "Click Start Recording to begin streaming audio."
                : "Transcript for the selected recording.")}
          </p>
        </div>
        <div className="inline-flex items-center gap-1 rounded-full bg-slate-900/80 px-2.5 py-1 text-[11px] text-slate-300 ring-1 ring-white/10">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          <span>{modelLabel}</span>
        </div>
      </header>

      <div
        ref={containerRef}
        className="relative min-h-0 flex-1 overflow-y-auto rounded-xl border border-white/5 bg-slate-950/60 px-3 py-3 text-sm shadow-inner shadow-black/40 md:px-4 md:py-4"
      >
        {segments.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-xs text-slate-500">
            <p className="font-medium text-slate-300">
              No transcript yet.
            </p>
            <p className="max-w-xs text-[11px] text-slate-500">
              Start recording to see live words appear as Deepgram transcribes
              your audio stream.
            </p>
          </div>
        )}

        <div className="space-y-2">
          {segments.map((segment) => (
            <div
              key={segment.id}
              className="group flex gap-3 rounded-lg px-2 py-1.5 transition hover:bg-slate-900/60"
            >
              <div className="mt-0.5 flex flex-col items-end gap-1">
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${
                    segment.speaker === "Agent"
                      ? "bg-sky-500/15 text-sky-200 ring-1 ring-sky-400/30"
                      : "bg-emerald-500/10 text-emerald-200 ring-1 ring-emerald-400/25"
                  }`}
                >
                  {segment.speaker}
                </span>
                <span className="text-[10px] text-slate-500">
                  {formatTime(segment.timestamp)}
                </span>
              </div>
              <p
                className={`flex-1 text-xs leading-relaxed text-slate-100 md:text-sm ${
                  segment.isFinal ? "" : "opacity-80 italic"
                }`}
              >
                {segment.text}
                {!segment.isFinal && (
                  <span className="ml-1 inline-block h-[3px] w-6 animate-pulse rounded-full bg-cyan-400/70 align-middle" />
                )}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

