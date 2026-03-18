"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { parseDeepgramMessage } from "@/services/transcription.service";
import type { TranscriptSegment } from "@/types/transcript";

type ConnectionStatus = "idle" | "connecting" | "live" | "error";

interface RecorderProps {
  onSegment: (segment: TranscriptSegment) => void;
  onStatusChange?: (status: ConnectionStatus) => void;
  onStop?: () => void;
  onResetCurrent?: () => void;
}

export default function Recorder({
  onSegment,
  onStatusChange,
  onStop,
  onResetCurrent,
}: RecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [status, setStatus] = useState<ConnectionStatus>("idle");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const speakerRef = useRef<"Agent" | "Customer">("Agent");

  const updateStatus = useCallback(
    (next: ConnectionStatus) => {
      setStatus(next);
      onStatusChange?.(next);
    },
    [onStatusChange],
  );

  useEffect(() => {
    return () => {
      mediaRecorderRef.current?.stop();
      mediaRecorderRef.current = null;
      socketRef.current?.close();
      socketRef.current = null;
    };
  }, []);

  const connectWebSocket = useCallback(
    async (stream: MediaStream) => {
      updateStatus("connecting");

      const res = await fetch("/api/deepgram");
      if (!res.ok) {
        updateStatus("error");
        return;
      }
      const { apiKey, websocketUrl } = (await res.json()) as {
        apiKey: string;
        websocketUrl: string;
      };

      const ws = new WebSocket(websocketUrl, ["token", apiKey]);
      socketRef.current = ws;

      ws.onopen = () => {
        updateStatus("live");
        if (onResetCurrent) onResetCurrent();

        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: "audio/webm;codecs=opus",
        });
        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.addEventListener("dataavailable", (event) => {
          if (event.data.size > 0 && ws.readyState === WebSocket.OPEN) {
            ws.send(event.data);
          }
        });

        mediaRecorder.start(250);
      };

      ws.onmessage = (message) => {
        if (typeof message.data !== "string") return;
        const segment = parseDeepgramMessage(
          message.data,
          speakerRef.current,
        );
        if (!segment) return;
        if (segment.isFinal) {
          speakerRef.current =
            speakerRef.current === "Agent" ? "Customer" : "Agent";
        }
        onSegment(segment);
      };

      ws.onerror = () => {
        updateStatus("error");
      };

      ws.onclose = () => {
        mediaRecorderRef.current?.stop();
        mediaRecorderRef.current = null;
        updateStatus("idle");
        onStop?.();
      };
    },
    [onResetCurrent, onSegment, onStop, updateStatus],
  );

  const startRecording = useCallback(async () => {
    if (isRecording) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
        },
      });
      setIsRecording(true);
      await connectWebSocket(stream);
    } catch {
      updateStatus("error");
      setIsRecording(false);
    }
  }, [connectWebSocket, isRecording, updateStatus]);

  const stopRecording = useCallback(() => {
    if (!isRecording) return;
    setIsRecording(false);
    mediaRecorderRef.current?.stop();
    socketRef.current?.close();
  }, [isRecording]);

  const label = isRecording
    ? "Stop Recording"
    : status === "connecting"
      ? "Connecting..."
      : "Start Recording";

  return (
    <div className="flex items-center gap-4">
      <div className="hidden items-center gap-1.5 text-xs text-slate-300 md:flex">
        <div className="flex h-6 w-10 items-center justify-center gap-1 rounded-full bg-slate-950/80 ring-1 ring-white/10">
          {Array.from({ length: 5 }).map((_, idx) => (
            <div
              key={idx}
              className={`waveform-bar w-[2px] rounded-full bg-cyan-300/70 ${
                isRecording ? "" : "opacity-30"
              }`}
            />
          ))}
        </div>
        <span className="text-[11px] uppercase tracking-wide text-slate-400">
          {isRecording ? "Listening..." : "Ready"}
        </span>
      </div>
      <button
        type="button"
        onClick={isRecording ? stopRecording : startRecording}
        className={`relative inline-flex items-center justify-center gap-3 rounded-full px-6 py-2.5 text-sm font-semibold text-slate-900 shadow-lg shadow-cyan-600/40 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 md:px-8 md:py-3 ${
          isRecording
            ? "bg-slate-100"
            : "accent-gradient hover:brightness-110 active:brightness-125"
        }`}
        disabled={status === "connecting"}
      >
        <span
          className={`flex h-8 w-8 items-center justify-center rounded-full ${
            isRecording
              ? "bg-rose-600/90 mic-pulse"
              : "bg-slate-950/80 border border-white/20"
          }`}
        >
          <span className="h-3.5 w-3.5 rounded-full bg-slate-100" />
        </span>
        <span>{label}</span>
      </button>
    </div>
  );
}

