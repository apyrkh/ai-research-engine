export const ANALYZE_NODES = ["fetch_sources", "critic_analysis", "generate_report"] as const;

export type AnalyzeNodeId = (typeof ANALYZE_NODES)[number];

export type StreamControlEvent = "done" | "error";

export type StreamEventNode = AnalyzeNodeId | StreamControlEvent;

// Mirrors AnalyzeStateUpdate from src/lib/graph/analyzeGraph.ts. Duplicated
// rather than imported because that module pulls in @langchain/langgraph and
// must stay server-only, out of the client bundle.
export interface AnalyzeStateUpdatePayload {
  topic?: string;
  rawDocs?: string[];
  findings?: string[];
  finalReport?: string;
}

export interface AnalyzeErrorPayload {
  message: string;
}

export type AnalyzeStreamEvent =
  | { node: AnalyzeNodeId; state: AnalyzeStateUpdatePayload }
  | { node: "done"; state: Record<string, never> }
  | { node: "error"; state: AnalyzeErrorPayload };

// One entry per SSE event received, in arrival order. Single source of truth
// for both the log list and the derived graph coloring.
export interface AnalyzeLogStep {
  id: string;
  node: StreamEventNode;
  state: AnalyzeStateUpdatePayload | AnalyzeErrorPayload | Record<string, never>;
  receivedAt: number;
}

export type StreamStatus = "idle" | "connecting" | "streaming" | "done" | "error";

export function isAnalyzeNodeId(node: string): node is AnalyzeNodeId {
  return (ANALYZE_NODES as readonly string[]).includes(node);
}

export const NODE_LABELS: Record<AnalyzeNodeId, string> = {
  fetch_sources: "Fetch Sources",
  critic_analysis: "Critic Analysis",
  generate_report: "Generate Report",
};

// The right-hand panel of /analyze is a two-tab view: the live execution
// log, and the final Markdown report once generate_report completes.
export type RightPanelTab = "log" | "report";
