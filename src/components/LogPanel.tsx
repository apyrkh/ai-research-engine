"use client";

import { useState } from "react";
import {
  isResearchNodeId,
  type ResearchLogStep,
  type ResearchNodeId,
  type ResearchStateUpdatePayload,
  type StreamStatus,
} from "@/lib/types/research";
import { getPendingNode } from "@/lib/graph/pipeline";
import { CheckCircleIcon, SpinnerIcon, WarningIcon } from "@/components/StatusIcon";

export interface LogPanelProps {
  steps: ResearchLogStep[];
  status: StreamStatus;
}

const RUNNING_DESCRIPTIONS: Record<ResearchNodeId, string> = {
  fetch_sources: "Searching medical literature databases...",
  quality_filter: "Validating study methodologies and sample sizes...",
  critic_analysis: "Scanning for empirical contradictions or data collisions...",
  resolve_conflict: "Resolving data conflicts using methodological weighting...",
  generate_report: "Compiling final research overview matrix...",
};

function getCompletedDescription(node: ResearchNodeId, state: ResearchStateUpdatePayload): string {
  switch (node) {
    case "fetch_sources": {
      const count = state.rawDocs?.length ?? 0;
      return `Successfully retrieved ${count} clinical source text${count === 1 ? "" : "s"}.`;
    }
    case "quality_filter": {
      const facts = state.validatedFacts ?? [];
      const flagged = facts.filter((fact) => fact.startsWith("[FLAGGED")).length;
      return flagged > 0
        ? `Validated ${facts.length} studies; flagged ${flagged} below the sample-size threshold.`
        : `Validated ${facts.length} studies; all met the sample-size threshold.`;
    }
    case "critic_analysis": {
      const count = state.contradictions?.length ?? 0;
      return count > 0
        ? `Detected ${count} data collision${count === 1 ? "" : "s"} requiring resolution.`
        : "No contradictions found across validated sources.";
    }
    case "resolve_conflict":
      return "Applied methodological weighting to resolve the detected conflicts.";
    case "generate_report":
      return "Final research overview matrix compiled and ready for review.";
    default:
      return RUNNING_DESCRIPTIONS[node];
  }
}

type StepTone = "success" | "warning";

function getStepTone(node: ResearchNodeId, state: ResearchStateUpdatePayload): StepTone {
  if (node === "critic_analysis") {
    return (state.contradictions?.length ?? 0) > 0 ? "warning" : "success";
  }
  if (node === "resolve_conflict") return "warning";
  return "success";
}

function StepToneIcon({ tone }: { tone: StepTone }) {
  if (tone === "warning") {
    return <WarningIcon className="mt-0.5 h-4 w-4 shrink-0 text-clinical-collision" />;
  }
  return <CheckCircleIcon className="mt-0.5 h-4 w-4 shrink-0 text-clinical-success" />;
}

export function LogPanel({ steps, status }: LogPanelProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const isActive = status === "connecting" || status === "streaming";
  const pendingNode = isActive ? getPendingNode(steps) : null;

  if (steps.length === 0 && !pendingNode) {
    return (
      <p className="text-sm text-slate-500">
        Execution log will appear here once a research run starts.
      </p>
    );
  }

  return (
    <ol className="flex flex-col gap-2">
      {steps.map((step) => {
        if (!isResearchNodeId(step.node)) return null;
        const state = step.state as ResearchStateUpdatePayload;
        const tone = getStepTone(step.node, state);
        const isExpanded = expandedId === step.id;

        return (
          <li key={step.id} className="rounded-lg border border-slate-700 bg-slate-900/60">
            <div className="flex items-start gap-3 px-4 py-3">
              <StepToneIcon tone={tone} />
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
