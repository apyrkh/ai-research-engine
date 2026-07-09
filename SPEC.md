# Architecture Specification: Research Workflow Engine (PoC)

## 1. System Concept
**Goal:** Provide a production-ready blueprint for a deterministic LLM
orchestration platform (powered by LangGraph) that automates deep scientific
literature analysis and applied research.

**Core Value Proposition:** Move away from unpredictable, non-deterministic AI
chat interfaces. This engine enforces a strict, code-driven assembly line
(Workflow Engine). It handles data extraction via schemas, actively maps
contradictory evidence, and completely neutralizes hallucinations through an
isolated Agent-Critic loop.

**PoC Demonstration Topic:** "Comparative effectiveness of low-carbohydrate vs.
low-fat diets over a 12+ month horizon: Analyzing contradictions in
meta-analyses." This provides a clean battlefield to showcase genuine data
collision resolution without alienating users with overly cryptic virology
jargon during the initial software pitch.

---

## 2. Graph Architecture & State Definition

The engine uses a live LangGraph graph instance. State is preserved globally
inside a single thread context, allowing conditional edges to evaluate data
attributes before routing.

### Research State Schema:
*   **topic** (String): The primary input research question or focus area.
*   **rawDocs** (Array of Strings): Text blocks extracted from target files or papers.
*   **validatedFacts** (Array of Objects): Verified facts extracted using structured LLM schemas.
*   **contradictions** (Array of Objects): Detected conflicts between data points.
*   **finalReport** (String): The compiled Markdown artifact containing the knowledge matrix.
*   **currentStep** (String): ID of the active node executing in the graph.

---

### Pipeline A: Linear Express Analysis
A simple, fallback sequence used to demonstrate the pitfalls of basic LLM generation wrappers:
[Start] ➔ Node: fetch_sources ➔ Node: simple_extraction ➔ Node: compile_report ➔ [End]

---

### Pipeline B: Deep Verified Research (The Core Product)
A complex, cyclic graph featuring automated validation and edge routing:

*   **Node 1: fetch_sources**
    *   *Logic:* Processes the input query, pulls text blocks from local
        resource folders (mimicking PubMed datasets), and updates the rawDocs
        state array.
*   **Node 2: quality_filter**
    *   *Logic:* Uses a structured output schema (e.g., withStructuredOutput)
        to extract specific metadata attributes from each paper: sample size
        (N) and duration. Code-level checks evaluate these variables. If a
        paper drops below threshold (e.g., N < 50), the graph automatically
        flags the item in the logs.
*   **Node 3: critic_analysis**
    *   *Logic:* Cross-references all validated facts. An adversarial agent
        searches for explicit data contradictions (e.g., Study A claims LDL
        rises, Study B claims LDL falls).
*   **Conditional Edge (Router)**
    *   *Logic:* If the contradictions array is populated, the execution graph
        routes directly to Node 4 (resolve_conflict). If the state is clear of
        contradictions, it routes straight to Node 5 (generate_report).
*   **Node 4: resolve_conflict**
    *   *Logic:* Evaluates conflicting data points against methodological
        weight guidelines. Large systemic meta-analyses are automatically
        favored over short-term pilot studies. The collision is documented with
        its mathematical resolution.
*   **Node 5: generate_report**
    *   *Logic:* Combines the structured findings, warning flags, and the
        conflict resolution logs into a comprehensive final Markdown matrix.

---

## 3. UI Architecture (Screen: `/research`)

The frontend application uses a flexible two-column layout that shifts dynamically based on data stream weight.

---
┌───────────────────────────────────────────────┬────────────────────────┐
│ LEFT COLUMN                                   │ RIGHT COLUMN           │
│                                               │                        │
│ TOP (~2/3): Graph Visualization Panel         │ Interactive Run Log    │
│ [ Workflow Selector: Simple / With Critic ]   │ (Step Accordions)      │
│                                               │                        │
│ ┌───────────────────────────────────────────┐ │ ───────────────        │
│ │                                           │ │ 📁 Step 1: Search      │
│ │       Interactive SVG Diagram             │ │ ───────────────        │
│ │       (Active Node Highlighted)           │ │ ⚙️ Step 2: Filter      │
│ │                                           │ │   └─ [Error Log]       │
│ └───────────────────────────────────────────┘ │ ───────────────        │
│                                               │ │ 📝 Step 3: Synthesis │
│ ───────────────────────────────────────────── │                        │
│ BOTTOM (~1/3): Control Panel / Chat Input     │                        │
│ Textarea for Prompt Input                     │                        │
│ [ Button: "Run Research Pipeline" ]           │                        │
└───────────────────────────────────────────────┴────────────────────────┘
---

### Left Column Component Mapping
*   **Top Layout (Approx. 2/3 Vertical Space):**
    *   *Workflow Toggles:* Tabs allowing instant switching between Pipeline A
        and Pipeline B schemas.
    *   *Inline SVG Component:* A custom vector node layout. Fill colors map
        instantly to the live `currentStep` state string: gray for idle,
        animated blue for processing, green for success, and red for active
        conflict discovery.
*   **Bottom Layout (Approx. 1/3 Vertical Space):**
    *   *Chat & Parameter Workspace:* A text canvas pre-loaded with the default
        diet hypothesis prompt, paired with the execution trigger button.

### Right Column Component Mapping
*   *Interactive Log Stream:* A list of expandable accordion elements mapped
    directly to the graph execution cycle. As nodes finish computing, their
    respective accordions unpack raw data fragments: system warnings,
    structured JSON shapes, or real-time markdown blocks.

---

## 4. Live Demonstration Playbook

*   **Step 1: The Wrapper Problem (Pipeline A)** Run the linear workflow first.
    Expand the right log. Point out how the standard LLM reads conflicting
    materials and immediately generates smooth, narrative prose that completely
    ignores sample flaws and hidden methodology bias.
*   **Step 2: Activating Deterministic Control (Pipeline B)** Switch to
    Pipeline B and click execute. The SVG nodes blink and progress down the
    graph branches. The log accordions populate sequentially as the LangGraph
    state streams state chunks onto the screen.
*   **Step 3: Proving Content Integrity** Open Step 2 and Step 3 in the
    execution logs. Show the customer the exact string where the quality filter
    flagged a short-term trial, and how the Critic caught a core data
    collision. Prove how the graph conditionally veered off-course into the
    resolution sub-graph to settle the dispute using hard programmatic logic
    rather than an AI guess.
*   **Step 4: The Conversion Pivot** Present the clean, finalized matrix
    output. Transition to their enterprise business needs: Explain that the
    layout stays intact while the diet variables swap out for Ebola strains,
    proprietary internal research logs, or custom virucidal compliance
    protocols.
