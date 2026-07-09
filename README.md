# AI Research Workflow Engine (PoC)

A production-ready Proof of Concept (PoC) demonstrating deterministic
multi-agent scientific literature analysis powered by Next.js 15+ and
LangGraph.

## The Core Problem & Solution

Traditional LLM wrappers and chat interfaces are fundamentally
non-deterministic, making them unreliable for rigorous clinical, scientific, or
R&D environments. They easily hallucinate, mix high-quality trials with
unverified small-sample pilots, and smooth over direct data contradictions in
narrative prose.

This engine enforces a strict, graph-driven assembly line (Workflow Engine)
that:
1. Validates source metadata against strict code-level schemas using structured
   outputs.
2. Isolates an Agent-Critic loop to actively scan for hidden data collisions
   and contradictory study results.
3. Branches execution conditionally to run an automated dispute-resolution
   sub-graph using methodological weighting protocols.

## Tech Stack

- Framework: Next.js (App Router)
- Orchestration: @langchain/langgraph
- Models: Google Gemini (Primary), OpenAI (Fallback)
- Runtime Targeting: Vercel Edge Runtime (to support infinite SSE streaming
  without lambda execution timeouts)
- Styling: Tailwind CSS (Clinical dark-theme design system)
- Language: TypeScript

## Architecture & Graph Layout

The pipeline is modeled as a stateful graph where each node updates a
centralized, structured research state:

[Start] -> fetch_sources -> quality_filter -> critic_analysis
                                                   |
                                        (Contradictions Found?)
                                         |-- Yes -> resolve_conflict --|
                                         |-- No  ----------------------┴──> generate_report -> [End]

### Execution Nodes:
- fetch_sources: Ingests clinical inputs and pulls raw literature text blocks.
- quality_filter: Extracts metrics (N sample size, duration) via strict JSON
  schemas and discards substandard papers.
- critic_analysis: An adversarial agent cross-references data to map direct
  empirical conflicts (e.g., biomarker trajectory collisions).
- resolve_conflict: Evaluates opposing claims against systemic weight
  guidelines (e.g., favoring meta-analyses over pilot studies).
- generate_report: Compiles findings, quality flags, and resolution logs into a
  structured verification matrix.

## Local Development

### Prerequisites Node.js (v18+)

### Setup
1. Clone the repository: git clone
https://github.com/apyrkh/ai-research-engine.git cd ai-research-engine

2. Install dependencies: npm install

3. Configure environment variables (.env.local): GEMINI_API_KEY=your_key_here
OPENAI_API_KEY=your_key_here

4. Run the development server: npm run dev

Open http://localhost:3000/research to access the interactive dashboard.

## AI Assistant Instructions Before modifying any files in this repository, AI
agents must read and strictly adhere to the guidelines specified in CLAUDE.md
and track progress via TASKS.md.
