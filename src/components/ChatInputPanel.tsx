"use client";

import { useState, type FormEvent } from "react";
import type { StreamStatus } from "@/lib/types/research";

export interface ChatInputPanelProps {
  status: StreamStatus;
  onSubmit: (topic: string) => void;
}

export function ChatInputPanel({ status, onSubmit }: ChatInputPanelProps) {
  const [topic, setTopic] = useState("");
  const isBusy = status === "connecting" || status === "streaming";

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = topic.trim();
    if (trimmed.length === 0 || isBusy) return;
    onSubmit(trimmed);
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 border-t border-slate-800 p-4">
      <input
        type="text"
        value={topic}
        onChange={(event) => setTopic(event.target.value)}
        placeholder="Enter a research topic..."
        disabled={isBusy}
        className="flex-1 rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-clinical-cyan focus:outline-none disabled:opacity-50"
      />
      <button
        type="submit"
        disabled={isBusy || topic.trim().length === 0}
        className="rounded-md bg-clinical-teal px-4 py-2 text-sm font-medium text-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isBusy ? "Running..." : "Run Research Pipeline"}
      </button>
    </form>
  );
}
