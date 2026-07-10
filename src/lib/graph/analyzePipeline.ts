import { ANALYZE_NODES, type AnalyzeLogStep, type AnalyzeNodeId } from "@/lib/types/analyze";

// Strictly linear 3-node pipeline with no conditional edges, so the
// "currently pending" node is simply the first one in fixed order not yet
// seen in the completed-step history (see the analogous, branch-aware
// version for /research in src/lib/graph/pipeline.ts).
export function getPendingNode(steps: AnalyzeLogStep[]): AnalyzeNodeId | null {
  const seenNodes = new Set(steps.map((step) => step.node));

  for (const node of ANALYZE_NODES) {
    if (!seenNodes.has(node)) return node;
  }

  return null;
}
