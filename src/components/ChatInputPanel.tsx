"use client";

import { useState, type FormEvent, type KeyboardEvent } from "react";
import type { StreamStatus } from "@/lib/types/research";

export interface ChatInputPanelProps {
  status: StreamStatus;
  onSubmit: (topic: string) => void;
}

interface SuggestedPrompt {
  readonly label: string;
  readonly prompt: string;
}

const SUGGESTED_PROMPTS: readonly SuggestedPrompt[] = [
  {
    label: "Macros & Weight Loss",
    prompt:
      "Explain how Macros (Protein, Carbs, Fats) affect weight loss. Keep it concise, scientific, and format it as a bulleted list (one short sentence per macro).",
  },
  {
    label: "Low-Carb vs Low-Fat Diets",
    prompt:
      "Comparative effectiveness of low-carbohydrate vs. low-fat diets over a 12+ month horizon: Analyzing contradictions in meta-analyses.",
  },
  {
    label: "Sleep & Shift Work",
    prompt:
      "What interventions are most effective for improving sleep quality in night-shift healthcare workers?",
  },
];

export function ChatInputPanel({ status, onSubmit }: ChatInputPanelProps) {
  const [topic, setTopic] = useState<string>("");
  const isBusy = status === "connecting" || status === "streaming";

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = topic.trim();
    if (trimmed.length === 0 || isBusy) return;
    onSubmit(trimmed);
    setTopic("");
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 border-t border-slate-800 p-4">
      <div className="flex flex-wrap gap-2">
        {SUGGESTED_PROMPTS.map((suggestion) => (
          <button
            key={suggestion.label}
            type="button"
            disabled={isBusy}
            onClick={() => setTopic(suggestion.prompt)}
            className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs text-slate-300 transition-colors hover:border-clinical-cyan hover:text-clinical-cyan disabled:cursor-not-allowed disabled:opacity-50"
          >
            {suggestion.label}
          </button>
        ))}
      </div>

      <textarea
        value={topic}
        onChange={(event) => setTopic(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Enter a research topic or clinical hypothesis..."
        disabled={isBusy}
        rows={3}
        className="min-h-[4.5rem] w-full resize-y rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-clinical-cyan focus:outline-none disabled:opacity-50"
      />
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500">Enter to run &middot; Shift+Enter for a new line</p>
        <button
          type="submit"
          disabled={isBusy || topic.trim().length === 0}
          className="rounded-md bg-clinical-teal px-4 py-2 text-sm font-medium text-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isBusy ? "Running..." : "Run Pipeline"}
        </button>
      </div>
    </form>
  );
}
