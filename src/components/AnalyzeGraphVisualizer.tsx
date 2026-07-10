"use client";

import { ANALYZE_NODES, NODE_LABELS, type AnalyzeNodeId } from "@/lib/types/analyze";

export interface AnalyzeGraphVisualizerProps {
  activeNode: AnalyzeNodeId | null;
  completedNodes: ReadonlySet<AnalyzeNodeId>;
}

type VisualState = "idle" | "active" | "completed";

const NODE_LAYOUT: Record<AnalyzeNodeId, { x: number; y: number }> = {
  fetch_sources: { x: 20, y: 40 },
  critic_analysis: { x: 320, y: 40 },
  generate_report: { x: 620, y: 40 },
};

const NODE_WIDTH = 150;
const NODE_HEIGHT = 56;

const VISUAL_STATE_CLASSES: Record<
  VisualState,
  { fill: string; stroke: string; text: string; extra: string; strokeWidth: number }
> = {
  idle: { fill: "fill-slate-800", stroke: "stroke-slate-600", text: "", extra: "", strokeWidth: 2 },
  active: {
    fill: "fill-slate-800",
    stroke: "stroke-clinical-cyan",
    text: "text-clinical-cyan",
    extra: "animate-node-glow",
    strokeWidth: 3,
  },
  completed: {
    fill: "fill-slate-800",
    stroke: "stroke-clinical-success",
    text: "text-clinical-success",
    extra: "",
    strokeWidth: 2,
  },
};

function getVisualState(node: AnalyzeNodeId, props: AnalyzeGraphVisualizerProps): VisualState {
  if (props.activeNode === node) return "active";
  if (props.completedNodes.has(node)) return "completed";
  return "idle";
}

function center(node: AnalyzeNodeId): { x: number; y: number } {
  const { x, y } = NODE_LAYOUT[node];
  return { x: x + NODE_WIDTH / 2, y: y + NODE_HEIGHT / 2 };
}

export function AnalyzeGraphVisualizer(props: AnalyzeGraphVisualizerProps) {
  const fetchC = center("fetch_sources");
  const criticC = center("critic_analysis");
  const reportC = center("generate_report");

  const edgeClass = "stroke-slate-600";

  return (
    <svg
      viewBox="0 0 800 136"
      className="w-full h-auto"
      role="img"
      aria-label="Analyze baseline pipeline execution graph"
    >
      <defs>
        <marker
          id="analyze-graph-arrowhead"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" className="fill-slate-600" />
        </marker>
      </defs>

      {/* fetch_sources -> critic_analysis */}
      <line
        x1={fetchC.x + NODE_WIDTH / 2}
        y1={fetchC.y}
        x2={criticC.x - NODE_WIDTH / 2}
        y2={criticC.y}
        className={edgeClass}
        strokeWidth={2}
        markerEnd="url(#analyze-graph-arrowhead)"
      />

      {/* critic_analysis -> generate_report */}
      <line
        x1={criticC.x + NODE_WIDTH / 2}
        y1={criticC.y}
        x2={reportC.x - NODE_WIDTH / 2}
        y2={reportC.y}
        className={edgeClass}
        strokeWidth={2}
        markerEnd="url(#analyze-graph-arrowhead)"
      />

      {ANALYZE_NODES.map((node) => {
        const { x, y } = NODE_LAYOUT[node];
        const { x: cx, y: cy } = center(node);
        const visualState = getVisualState(node, props);
        const classes = VISUAL_STATE_CLASSES[visualState];

        return (
          <g key={node}>
            <rect
              x={x}
              y={y}
              width={NODE_WIDTH}
              height={NODE_HEIGHT}
              rx={8}
              strokeWidth={classes.strokeWidth}
              className={`${classes.fill} ${classes.stroke} ${classes.text} ${classes.extra} transition-colors`}
            />
            <text
              x={cx}
              y={cy}
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-slate-200 text-xs font-mono select-none"
            >
              {NODE_LABELS[node]}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
