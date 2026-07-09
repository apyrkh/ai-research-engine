# CLAUDE.md - AI Assistant Guidelines

## Project Context
- Repository: https://github.com/apyrkh/ai-research-engine
- Stack: Next.js (App Router), Node.js, TypeScript, Tailwind CSS,
  @langchain/langgraph
- LLM Providers: Google AI Studio SDK (Primary), OpenAI SDK (Fallback)
- Deployment Platform: Vercel (Edge Runtime target)
- Core Architecture: Deterministic multi-agent research workflow engine with
  live SVG graph state visualization.

## Engineering Standards
- Task Tracking: Always read `TASKS.md` before writing code to verify the
  current target. Upon successful completion of any task, immediately update
  `TASKS.md` to mark it as completed `[x]`. If unforeseen technical sub-tasks
  emerge, you may propose them in `TASKS.md` for user approval, but the core
  focus must strictly remain on the minimal PoC delivery. Do not execute
  unapproved tasks.
- Deployment Platform: Vercel (Edge Runtime target).
- Edge Configurations: 
  * Always include `export const runtime = 'edge'` in streaming route handlers
    to bypass Serverless function timeouts.
  * Always include `export const dynamic = 'force-dynamic'` to prevent Vercel
    from caching the API response.
  * Explicitly set headers for Server-Sent Events (SSE): `Content-Type:
    text/event-stream`, `Cache-Control: no-cache, no-transform`, `Connection:
    keep-alive`. The `no-transform` header is required to bypass Vercel's
    automated compression layers which break chunk streaming.
- Code Quality: Pure functions where possible, strict TypeScript types, zero
  placeholders, semantic Tailwind styling.
- State Hydration: Strict streaming via SSE. No long-polling or fake setTimeout
  animations on the backend.

## Common Commands
- Dev Server: npm run dev
- Build Project: npm run build
- Type Check: npx tsc --noEmit
