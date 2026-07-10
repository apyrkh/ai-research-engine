"use client";

import { useState } from "react";
import {
  isAnalyzeNodeId,
  type AnalyzeLogStep,
  type AnalyzeNodeId,
  type AnalyzeStateUpdatePayload,
  type StreamStatus,
} from "@/lib/types/analyze";
import { getPendingNode } from "@/lib/graph/analyzePipeline";
import { CheckCircleIcon, SpinnerIcon } from "@/components/StatusIcon";

export interface AnalyzeLogPanelProps {
  steps: AnalyzeLogStep[];
  status: StreamStatus;
}

const RUNNING_DESCRIPTIONS: Record<AnalyzeNodeId, string> = {
  fetch_sources: "Searching literature databases...",
  critic_analysis: "Analyzing findings across sources...",
  generate_report: "Compiling baseline analysis report...",
};

function getCompletedDescription(node: AnalyzeNodeId, state: AnalyzeStateUpdatePayload): string {
  switch (node) {
    case "fetch_sources": {
      const count = state.rawDocs?.length ?? 0;
      return `Successfully retrieved ${count} source text${count === 1 ? "" : "s"}.`;
    }
    case "critic_analysis": {
      const count = state.findings?.length ?? 0;
      return `Extracted ${count} key finding${count === 1 ? "" : "s"} from the retrieved sources.`;
    }
    case "generate_report":
      return "Baseline analysis report compiled and ready for review.";
    default:
      return RUNNING_DESCRIPTIONS[node];
  }
}

export function AnalyzeLogPanel({ steps, status }: AnalyzeLogPanelProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const isActive = status === "connecting" || status === "streaming";
  const pendingNode = isActive ? getPendingNode(steps) : null;

  if (steps.length === 0 && !pendingNode) {
    return (
      <p className="text-sm text-slate-500">
        Execution log will appear here once an analysis run starts.
      </p>
    );
  }

  return (
    <ol className="flex flex-col gap-2">
      {steps.map((step) => {
        if (!isAnalyzeNodeId(step.node)) return null;
        const state = step.state as AnalyzeStateUpdatePayload;
        const isExpanded = expandedId === step.id;

        return (
          <li key={step.id} className="rounded-lg border border-slate-700 bg-slate-900/60">
            <div className="flex items-start gap-3 px-4 py-3">
              <CheckCircleIcon className="mt-0.5 h-4 w-4 shrink-0 text-clinical-success" />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-slate-200">{getCompletedDescription(step.node, state)}</p>
                <button
                  type="button"
                  onClick={() => setExpandedId(isExpanded ? null : step.id)}
                  aria-expanded={isExpanded}
                  className="mt-1 text-xs font-medium text-clinical-cyan hover:underline"
                >
                  {isExpanded ? "Hide Technical Details" : "View Technical Details"}
                </button>
                {isExpanded && (
                  <div className="mt-2 rounded-md border border-slate-800 bg-slate-950/60 p-3">
                    <p className="mb-1 font-mono text-[11px] uppercase tracking-wide text-slate-500">
                      Node: {step.node}
                    </p>
                    <pre className="overflow-x-auto text-xs text-slate-300">
                      {JSON.stringify(step.state, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
              <span className="shrink-0 text-xs text-slate-500">
                {new Date(step.receivedAt).toLocaleTimeString()}
              </span>
            </div>
          </li>
        );
      })}
      {pendingNode && (
        <li className="rounded-lg border border-slate-700 bg-slate-900/60">
          <div className="flex items-center gap-3 px-4 py-3">
            <SpinnerIcon className="h-4 w-4 shrink-0 text-clinical-cyan" />
            <p className="flex-1 text-sm text-slate-300">{RUNNING_DESCRIPTIONS[pendingNode]}</p>
          </div>
        </li>
      )}
    </ol>
  );
}
