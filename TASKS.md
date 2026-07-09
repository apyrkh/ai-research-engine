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

## Phase 4: Verification & Deployment
- [ ] Task 4.1: End-to-end local validation of full pipeline execution.
- [ ] Task 4.2: Deploy to Vercel and verify Edge Stream behavior under live
  environment.
