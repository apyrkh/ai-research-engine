"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import {
  isResearchNodeId,
  type ResearchLogStep,
  type ResearchNodeId,
  type ResearchStateUpdatePayload,
  type ResearchStreamEvent,
  type StreamStatus,
} from "@/lib/types/research";
import { getPendingNode } from "@/lib/graph/pipeline";

export interface DerivedGraphState {
  activeNode: ResearchNodeId | null;
  completedNodes: ReadonlySet<ResearchNodeId>;
  conflictNodes: ReadonlySet<ResearchNodeId>;
}

function deriveGraphState(steps: ResearchLogStep[], status: StreamStatus): DerivedGraphState {
  const nodeSteps = steps.filter(
    (step): step is ResearchLogStep & { node: ResearchNodeId } => isResearchNodeId(step.node)
  );

  // activeNode is the node currently in flight (inferred, since the backend
  // only emits completion events — see getPendingNode), not the last one
  // that already reported in. This is what makes the very first node
  // (fetch_sources) glow immediately on submit instead of only after it
  // finishes.
  const isRunning = status === "connecting" || status === "streaming";
  const activeNode = isRunning ? getPendingNode(nodeSteps) : null;

  const completedNodes = new Set<ResearchNodeId>(nodeSteps.map((step) => step.node));

  const conflictNodes = new Set<ResearchNodeId>();
  for (const step of nodeSteps) {
    if (step.node === "critic_analysis") {
      const contradictions = (step.state as ResearchStateUpdatePayload).contradictions;
      if (Array.isArray(contradictions) && contradictions.length > 0) {
        conflictNodes.add("critic_analysis");
      }
    }
    if (step.node === "resolve_conflict") {
      conflictNodes.add("resolve_conflict");
    }
  }

  return { activeNode, completedNodes, conflictNodes };
}

export interface UseResearchStreamResult {
  status: StreamStatus;
  steps: ResearchLogStep[];
  errorMessage: string | null;
  finalReport: string | null;
  graphState: DerivedGraphState;
  submit: (topic: string) => void;
  reset: () => void;
}

export function useResearchStream(): UseResearchStreamResult {
  const [steps, setSteps] = useState<ResearchLogStep[]>([]);
  const [status, setStatus] = useState<StreamStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const stepCountRef = useRef(0);

  const appendStep = useCallback((step: Omit<ResearchLogStep, "id">) => {
    const id = `${step.node}-${stepCountRef.current}`;
    stepCountRef.current += 1;
    setSteps((prev) => [...prev, { ...step, id }]);
  }, []);

  const processRecord = useCallback(
    (record: string) => {
      const dataLines = record
        .split("\n")
        .filter((line) => line.startsWith("data:"))
        .map((line) => line.slice(5).trimStart());

      if (dataLines.length === 0) return;

      let parsed: ResearchStreamEvent;
      try {
        parsed = JSON.parse(dataLines.join("\n")) as ResearchStreamEvent;
      } catch {
        return;
      }

      if (parsed.node === "done") {
        setStatus("done");
        return;
      }
      if (parsed.node === "error") {
        setStatus("error");
        setErrorMessage(parsed.state.message);
        return;
      }
      if (isResearchNodeId(parsed.node)) {
        appendStep({ node: parsed.node, state: parsed.state, receivedAt: Date.now() });
      }
    },
    [appendStep]
  );

  const runStream = useCallback(
    async (topic: string, signal: AbortSignal) => {
      let response: Response;
      try {
        response = await fetch("/api/research", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ topic }),
          signal,
        });
      } catch (err) {
        if (signal.aborted) return;
        setStatus("error");
        setErrorMessage(err instanceof Error ? err.message : "Network error");
        return;
      }

      if (!response.body) {
        setStatus("error");
        setErrorMessage("No response body received from server");
        return;
      }

      setStatus("streaming");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          const records = buffer.split("\n\n");
          buffer = records.pop() ?? "";

          for (const record of records) {
            processRecord(record);
          }
        }
        if (buffer.trim().length > 0) {
          processRecord(buffer);
        }
      } catch (err) {
        if (signal.aborted) return;
        setStatus("error");
        setErrorMessage(err instanceof Error ? err.message : "Stream read error");
      }
    },
    [processRecord]
  );

  const submit = useCallback(
    (topic: string) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      stepCountRef.current = 0;
      setSteps([]);
      setErrorMessage(null);
      setStatus("connecting");

      void runStream(topic, controller.signal);
    },
    [runStream]
  );

  const reset = useCallback(() => {
    abortRef.current?.abort();
    stepCountRef.current = 0;
    setSteps([]);
    setErrorMessage(null);
    setStatus("idle");
  }, []);

  const finalReport = useMemo(() => {
    const reportStep = [...steps].reverse().find((step) => step.node === "generate_report");
    if (!reportStep) return null;
    const state = reportStep.state as ResearchStateUpdatePayload;
    return typeof state.finalReport === "string" ? state.finalReport : null;
  }, [steps]);

  const graphState = useMemo(() => deriveGraphState(steps, status), [steps, status]);

  return { status, steps, errorMessage, finalReport, graphState, submit, reset };
}
