"use client";

import { NODE_LABELS, RESEARCH_NODES, type ResearchNodeId } from "@/lib/types/research";

export interface GraphVisualizerProps {
  activeNode: ResearchNodeId | null;
  completedNodes: ReadonlySet<ResearchNodeId>;
  conflictNodes: ReadonlySet<ResearchNodeId>;
}

type VisualState = "idle" | "active" | "active-conflict" | "completed" | "completed-conflict";

const NODE_LAYOUT: Record<ResearchNodeId, { x: number; y: number }> = {
  fetch_sources: { x: 20, y: 142 },
  quality_filter: { x: 220, y: 142 },
  critic_analysis: { x: 420, y: 142 },
  resolve_conflict: { x: 620, y: 20 },
  generate_report: { x: 620, y: 244 },
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
  "active-conflict": {
    fill: "fill-slate-800",
    stroke: "stroke-clinical-collision",
    text: "text-clinical-collision",
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
  "completed-conflict": {
    fill: "fill-slate-800",
    stroke: "stroke-clinical-collision",
    text: "text-clinical-collision",
    extra: "",
    strokeWidth: 2,
  },
};

function getVisualState(node: ResearchNodeId, props: GraphVisualizerProps): VisualState {
  const isConflictCapable = node === "critic_analysis" || node === "resolve_conflict";
  const isConflict = isConflictCapable && props.conflictNodes.has(node);

  // The animated glow ("active"/"active-conflict") is reserved for the node
  // currently in flight. Once the run moves on (or finishes), a
  // conflict-flagged node still reads as red, but statically — it should
  // never keep blinking after it's no longer the active step.
  if (props.activeNode === node) return isConflict ? "active-conflict" : "active";
  if (props.completedNodes.has(node)) return isConflict ? "completed-conflict" : "completed";
  return "idle";
}

function center(node: ResearchNodeId): { x: number; y: number } {
  const { x, y } = NODE_LAYOUT[node];
  return { x: x + NODE_WIDTH / 2, y: y + NODE_HEIGHT / 2 };
}

export function GraphVisualizer(props: GraphVisualizerProps) {
  const fetchC = center("fetch_sources");
  const filterC = center("quality_filter");
  const criticC = center("critic_analysis");
  const resolveC = center("resolve_conflict");
  const reportC = center("generate_report");

  const edgeClass = "stroke-slate-600";

  return (
    <svg
      viewBox="0 0 800 340"
      className="w-full h-auto"
      role="img"
      aria-label="Research pipeline execution graph"
    >
      <defs>
        <marker
          id="graph-arrowhead"
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

      {/* fetch_sources -> quality_filter */}
      <line
        x1={fetchC.x + NODE_WIDTH / 2}
        y1={fetchC.y}
        x2={filterC.x - NODE_WIDTH / 2}
        y2={filterC.y}
        className={edgeClass}
        strokeWidth={2}
        markerEnd="url(#graph-arrowhead)"
      />

      {/* quality_filter -> critic_analysis */}
      <line
        x1={filterC.x + NODE_WIDTH / 2}
        y1={filterC.y}
        x2={criticC.x - NODE_WIDTH / 2}
        y2={criticC.y}
        className={edgeClass}
        strokeWidth={2}
        markerEnd="url(#graph-arrowhead)"
      />

      {/* critic_analysis -> resolve_conflict (conditional branch) */}
      <path
        d={`M ${criticC.x + NODE_WIDTH / 2} ${criticC.y} C ${criticC.x + NODE_WIDTH / 2 + 30} ${criticC.y}, ${resolveC.x - NODE_WIDTH / 2 - 30} ${resolveC.y}, ${resolveC.x - NODE_WIDTH / 2} ${resolveC.y}`}
        fill="none"
        className={edgeClass}
        strokeWidth={2}
        markerEnd="url(#graph-arrowhead)"
      />

      {/* critic_analysis -> generate_report (direct path) */}
      <path
        d={`M ${criticC.x + NODE_WIDTH / 2} ${criticC.y} C ${criticC.x + NODE_WIDTH / 2 + 30} ${criticC.y}, ${reportC.x - NODE_WIDTH / 2 - 30} ${reportC.y}, ${reportC.x - NODE_WIDTH / 2} ${reportC.y}`}
        fill="none"
        className={edgeClass}
        strokeWidth={2}
        markerEnd="url(#graph-arrowhead)"
      />

      {/* resolve_conflict -> generate_report */}
      <path
        d={`M ${resolveC.x} ${resolveC.y + NODE_HEIGHT / 2} C ${resolveC.x} ${resolveC.y + 90}, ${reportC.x} ${reportC.y - 90}, ${reportC.x} ${reportC.y - NODE_HEIGHT / 2}`}
        fill="none"
        className={edgeClass}
        strokeWidth={2}
        markerEnd="url(#graph-arrowhead)"
      />

      {RESEARCH_NODES.map((node) => {
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
