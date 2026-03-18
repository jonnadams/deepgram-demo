import type { Insights } from "@/types/insights";

interface InsightsPanelProps {
  insights: Insights;
}

export default function InsightsPanel({ insights }: InsightsPanelProps) {
  const updatedLabel = insights.lastUpdatedAt
    ? new Date(insights.lastUpdatedAt).toLocaleTimeString()
    : "Waiting for audio";

  const hasSentiment =
    insights.lastUpdatedAt !== null ||
    insights.topics.length > 0 ||
    insights.actionItems.length > 0;

  return (
    <section className="glass-panel flex flex-col gap-4 p-4 md:p-5 lg:p-6">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold tracking-tight text-slate-50 md:text-base">
            AI Insights
          </h2>
          <p className="text-[11px] text-slate-400 md:text-xs">
            Lightweight heuristics over the live transcript.
          </p>
        </div>
        <span className="rounded-full bg-slate-900/80 px-2.5 py-1 text-[11px] text-slate-300 ring-1 ring-white/10">
          Updated {updatedLabel}
        </span>
      </header>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-cyan-500/20 bg-slate-950/70 p-3 text-xs shadow-inner shadow-black/40">
          <h3 className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-cyan-300">
            Topics
          </h3>
          {insights.topics.length === 0 ? (
            <p className="text-[11px] text-slate-500">
              Start speaking to surface recurring topics.
            </p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {insights.topics.map((topic) => (
                <span
                  key={topic}
                  className="inline-flex items-center rounded-full bg-cyan-500/10 px-2 py-0.5 text-[11px] text-cyan-100 ring-1 ring-cyan-500/30"
                >
                  {topic}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-sky-500/20 bg-slate-950/70 p-3 text-xs shadow-inner shadow-black/40">
          <h3 className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-sky-300">
            Sentiment
          </h3>
          {hasSentiment ? (
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide ${
                  insights.sentiment === "positive"
                    ? "bg-emerald-500/10 text-emerald-200 ring-1 ring-emerald-500/30"
                    : insights.sentiment === "negative"
                      ? "bg-rose-500/10 text-rose-200 ring-1 ring-rose-500/30"
                      : "bg-slate-700/60 text-slate-100 ring-1 ring-slate-500/40"
                }`}
              >
                {insights.sentiment}
              </span>
            </div>
          ) : (
            <p className="text-[11px] text-slate-500">
              Sentiment will appear as you speak.
            </p>
          )}
        </div>

        <div className="rounded-xl border border-emerald-500/20 bg-slate-950/70 p-3 text-xs shadow-inner shadow-black/40">
          <h3 className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-emerald-300">
            Action Items
          </h3>
          {insights.actionItems.length === 0 ? (
            <p className="text-[11px] text-slate-500">
              Clear follow-ups will appear here as you speak.
            </p>
          ) : (
            <ul className="space-y-1.5 text-[11px] text-slate-200">
              {insights.actionItems.map((item, idx) => (
                <li key={`${item}-${idx}`} className="flex gap-2">
                  <span className="mt-[3px] h-1 w-1 rounded-full bg-emerald-300" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}

