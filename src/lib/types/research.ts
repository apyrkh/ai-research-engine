export const RESEARCH_NODES = [
  "fetch_sources",
  "quality_filter",
  "critic_analysis",
  "resolve_conflict",
  "generate_report",
] as const;

export type ResearchNodeId = (typeof RESEARCH_NODES)[number];

export type StreamControlEvent = "done" | "error";

export type StreamEventNode = ResearchNodeId | StreamControlEvent;

// Mirrors ResearchStateUpdate from src/lib/graph/researchGraph.ts. Duplicated
// rather than imported because that module pulls in @langchain/langgraph and
// must stay server-only, out of the client bundle.
export interface ResearchStateUpdatePayload {
  topic?: string;
  rawDocs?: string[];
  validatedFacts?: string[];
  contradictions?: string[];
  finalReport?: string;
}

export interface ResearchErrorPayload {
  message: string;
}

export type ResearchStreamEvent =
  | { node: ResearchNodeId; state: ResearchStateUpdatePayload }
  | { node: "done"; state: Record<string, never> }
  | { node: "error"; state: ResearchErrorPayload };

// One entry per SSE event received, in arrival order. Single source of truth
// for both the log accordion and the derived graph coloring.
export interface ResearchLogStep {
  id: string;
  node: StreamEventNode;
  state: ResearchStateUpdatePayload | ResearchErrorPayload | Record<string, never>;
  receivedAt: number;
}

export type StreamStatus = "idle" | "connecting" | "streaming" | "done" | "error";

export function isResearchNodeId(node: string): node is ResearchNodeId {
  return (RESEARCH_NODES as readonly string[]).includes(node);
}
