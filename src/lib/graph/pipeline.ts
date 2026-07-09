import {
  type ResearchLogStep,
  type ResearchNodeId,
  type ResearchStateUpdatePayload,
} from "@/lib/types/research";

const LINEAR_PREFIX: ResearchNodeId[] = ["fetch_sources", "quality_filter", "critic_analysis"];

// The backend only emits an SSE event once a node finishes (see
// src/app/api/research/route.ts) — there is no "node started" event. This
// infers which node is currently in flight from the nodes seen so far, so
// the UI can show a live "running" state for a node before its own event
// arrives, rather than only reacting after the fact.
export function getPendingNode(steps: ResearchLogStep[]): ResearchNodeId | null {
  const seenNodes = new Set(steps.map((step) => step.node));

  for (const node of LINEAR_PREFIX) {
    if (!seenNodes.has(node)) return node;
  }

  const criticStep = steps.find((step) => step.node === "critic_analysis");
  if (!criticStep) return null;

  const contradictions = (criticStep.state as ResearchStateUpdatePayload).contradictions ?? [];
  const routesToResolveConflict = contradictions.length > 0;

  if (routesToResolveConflict && !seenNodes.has("resolve_conflict")) return "resolve_conflict";
  if (!seenNodes.has("generate_report")) return "generate_report";

  return null;
}
