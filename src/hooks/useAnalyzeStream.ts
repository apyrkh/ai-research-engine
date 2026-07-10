"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import {
  isAnalyzeNodeId,
  type AnalyzeLogStep,
  type AnalyzeNodeId,
  type AnalyzeStateUpdatePayload,
  type AnalyzeStreamEvent,
  type StreamStatus,
} from "@/lib/types/analyze";
import { getPendingNode } from "@/lib/graph/analyzePipeline";

export interface DerivedGraphState {
  activeNode: AnalyzeNodeId | null;
  completedNodes: ReadonlySet<AnalyzeNodeId>;
}

function deriveGraphState(steps: AnalyzeLogStep[], status: StreamStatus): DerivedGraphState {
  const nodeSteps = steps.filter(
    (step): step is AnalyzeLogStep & { node: AnalyzeNodeId } => isAnalyzeNodeId(step.node)
  );

  // activeNode is the node currently in flight (inferred, since the backend
  // only emits completion events — see getPendingNode), not the last one
  // that already reported in. This is what makes the very first node
  // (fetch_sources) glow immediately on submit instead of only after it
  // finishes.
  const isRunning = status === "connecting" || status === "streaming";
  const activeNode = isRunning ? getPendingNode(nodeSteps) : null;

  const completedNodes = new Set<AnalyzeNodeId>(nodeSteps.map((step) => step.node));

  return { activeNode, completedNodes };
}

export interface UseAnalyzeStreamResult {
  status: StreamStatus;
  steps: AnalyzeLogStep[];
  errorMessage: string | null;
  finalReport: string | null;
  graphState: DerivedGraphState;
  activeQuery: string | null;
  submit: (topic: string) => void;
  reset: () => void;
}

export function useAnalyzeStream(): UseAnalyzeStreamResult {
  const [steps, setSteps] = useState<AnalyzeLogStep[]>([]);
  const [status, setStatus] = useState<StreamStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeQuery, setActiveQuery] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const stepCountRef = useRef(0);

  const appendStep = useCallback((step: Omit<AnalyzeLogStep, "id">) => {
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

      let parsed: AnalyzeStreamEvent;
      try {
        parsed = JSON.parse(dataLines.join("\n")) as AnalyzeStreamEvent;
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
      if (isAnalyzeNodeId(parsed.node)) {
        appendStep({ node: parsed.node, state: parsed.state, receivedAt: Date.now() });
      }
    },
    [appendStep]
  );

  const runStream = useCallback(
    async (topic: string, signal: AbortSignal) => {
      let response: Response;
      try {
        response = await fetch("/api/analyze", {
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
      setActiveQuery(topic);

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
    setActiveQuery(null);
  }, []);

  const finalReport = useMemo(() => {
    const reportStep = [...steps].reverse().find((step) => step.node === "generate_report");
    if (!reportStep) return null;
    const state = reportStep.state as AnalyzeStateUpdatePayload;
    return typeof state.finalReport === "string" ? state.finalReport : null;
  }, [steps]);

  const graphState = useMemo(() => deriveGraphState(steps, status), [steps, status]);

  return { status, steps, errorMessage, finalReport, graphState, activeQuery, submit, reset };
}
