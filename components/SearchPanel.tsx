import type { TranscriptSession } from "@/types/transcript";

interface SearchPanelProps {
  sessions: TranscriptSession[];
}

export default function SearchPanel({ sessions }: SearchPanelProps) {
  // Transcript search UI/logic is temporarily disabled.
  // (Keeping the component in place so you can re-enable quickly later.)
  void sessions;
  return null;
}

