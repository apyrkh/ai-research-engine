"use client";

import { useState } from "react";
import type { ResearchLogStep } from "@/lib/types/research";

export interface LogPanelProps {
  steps: ResearchLogStep[];
}

export function LogPanel({ steps }: LogPanelProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (steps.length === 0) {
    return (
      <p className="text-sm text-slate-500">
        Execution log will appear here once a research run starts.
      </p>
    );
  }

  return (
    <ol className="flex flex-col gap-2">
      {steps.map((step) => {
        const isExpanded = expandedId === step.id;
        return (
          <li key={step.id} className="rounded-lg border border-slate-700 bg-slate-900/60">
            <button
              type="button"
              onClick={() => setExpandedId(isExpanded ? null : step.id)}
              aria-expanded={isExpanded}
              className="flex w-full items-center justify-between px-4 py-3 text-left"
            >
              <span className="font-mono text-sm text-slate-200">{step.node}</span>
              <span className="text-xs text-slate-500">
                {new Date(step.receivedAt).toLocaleTimeString()}
              </span>
            </button>
            {isExpanded && (
              <pre className="overflow-x-auto border-t border-slate-800 px-4 py-3 text-xs text-slate-300">
                {JSON.stringify(step.state, null, 2)}
              </pre>
            )}
          </li>
        );
      })}
    </ol>
  );
}
