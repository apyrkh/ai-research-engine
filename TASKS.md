# TASKS.md - Project Roadmap & Task Tracker

## Phase 1: Environment Cleanup & Design System Setup
- [x] Task 1.1: Clean up Next.js default template artifacts (remove layout
  boilerplate, placeholder SVGs, reset global CSS).
- [x] Task 1.2: Define the medical color palette constants in
  tailwind.config.ts (Slate-900 baseline, Clinical Cyan/Teal for states,
  Surgical Green for success, Medical Amber/Red for collisions).
- [x] Task 1.3: Commit SPEC.md, CLAUDE.md, and this updated TASKS.md to the
  repository root.
- [x] Task 1.4: Perform an initial Vercel deployment (`vercel link` +
  `vercel deploy`) of the current scaffold to establish a live preview URL
  early, so subsequent phases can be tracked against real deploys instead of
  only local builds.

## Phase 2: Backend Architecture (LangGraph + Edge Streaming)
- [x] Task 2.1: Implement core LangGraph State schema and node signatures
  (fetch_sources, quality_filter, critic_analysis, resolve_conflict,
  generate_report).
- [x] Task 2.2: Implement routing logic (conditional edges) based on data
  contradictions.
- [x] Task 2.3: Create Next.js API Route Handler (/api/research) running on
  Edge Runtime, streaming live LangGraph state changes via SSE. Set up Google
  AI client with OpenAI fallback.

## Phase 3: Frontend Dashboard & Component Binding
- [x] Task 3.1: Create two-column layout shell for /research.
- [x] Task 3.2: Build dynamic Inline SVG Graph Component using the custom
  medical color states.
- [x] Task 3.3: Implement Interactive Log Panel with expanding accordions
  mapped to streamed SSE events.
- [x] Task 3.4: Connect Chat Input control panel to trigger the real HTTP
  stream execution.

### Phase 3 Optimization Patch: Clinical-grade UX Polish
- [x] Task 3.5: Replace the flat opacity pulse on the active SVG node with a
  continuous glow/blink animation (clinical-cyan for active, clinical-collision
  for conflict-flagged nodes).
- [x] Task 3.6: Refactor the Execution Log to show plain-language, non-technical
  descriptions per node (including a live "running" row inferred from stream
  state before the next node's event arrives) with status icons (spinner /
  success / warning), hiding raw JSON behind a per-row "View Technical Details"
  toggle.
- [x] Task 3.7: Replace the stacked Execution Log + Final Report layout with a
  tabbed right panel that auto-switches to the Report tab on completion, with a
  manual "View Final Research Report" CTA as a fallback.

## Phase 4: Verification & Deployment
- [x] Task 4.1: End-to-end local validation of full pipeline execution.
- [x] Task 4.1a: Fix layout bug where switching right-panel tabs (Execution Log
  / Final Report) reflowed and repositioned the prompt input panel. The left
  column is now a fixed-height flex-col (graph `flex-1 overflow-y-auto`, input
  panel `shrink-0` pinned beneath it) and the right column scrolls
  independently (`min-h-0 flex-1 overflow-y-auto`), so neither column's height
  depends on the other's content.
- [x] Task 4.2: Deploy to Vercel and verify Edge Stream behavior under live
  environment.

---

The PoC was verified end-to-end against the live Vercel environment
(https://ai-research-engine-beta.vercel.app): `/api/research` streams real SSE
chunks (`Transfer-Encoding: chunked`, correct `text/event-stream` headers)
through the full graph (`fetch_sources` → `quality_filter` → `critic_analysis`
→ `generate_report` → `done`), matching the local dev run. Note:
`quality_filter`'s sample-size regex mis-parses comma-formatted values (e.g.
`N=10,581` reads as `N=10`), causing false-positive "below threshold" flags —
tracked as a follow-up, not a blocker for this PoC.
