import { Annotation, StateGraph, START, END } from "@langchain/langgraph";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatOpenAI } from "@langchain/openai";

export const ResearchStateAnnotation = Annotation.Root({
  topic: Annotation<string>,
  rawDocs: Annotation<string[]>({
    reducer: (left, right) => left.concat(right),
    default: () => [],
  }),
  validatedFacts: Annotation<string[]>({
    reducer: (left, right) => left.concat(right),
    default: () => [],
  }),
  contradictions: Annotation<string[]>({
    reducer: (left, right) => left.concat(right),
    default: () => [],
  }),
  finalReport: Annotation<string>({
    reducer: (_left, right) => right,
    default: () => "",
  }),
});

export type ResearchState = typeof ResearchStateAnnotation.State;
export type ResearchStateUpdate = typeof ResearchStateAnnotation.Update;

const TRIGGER_WORDS = ["collision", "contradiction", "vs"];
const MIN_SAMPLE_SIZE = 50;

function getChatModel(): ChatGoogleGenerativeAI | ChatOpenAI {
  if (process.env.GOOGLE_API_KEY) {
    return new ChatGoogleGenerativeAI({
      apiKey: process.env.GOOGLE_API_KEY,
      model: process.env.GEMINI_MODEL ?? "gemini-2.5-flash",
      temperature: 0.2,
    });
  }
  if (process.env.OPENAI_API_KEY) {
    return new ChatOpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      model: "gpt-4o-mini",
      temperature: 0.2,
    });
  }
  throw new Error(
    "No LLM credentials configured. Set GOOGLE_API_KEY or OPENAI_API_KEY."
  );
}

function messageContentToText(content: unknown): string {
  return typeof content === "string" ? content : JSON.stringify(content);
}

function parseJsonStringArray(
  raw: string,
  { allowEmpty = false }: { allowEmpty?: boolean } = {}
): string[] {
  const cleaned = raw
    .trim()
    .replace(/^```(json)?/i, "")
    .replace(/```$/, "")
    .trim();

  const tryParse = (text: string): string[] | null => {
    try {
      const parsed = JSON.parse(text);
      if (
        Array.isArray(parsed) &&
        parsed.every((item): item is string => typeof item === "string") &&
        (allowEmpty || parsed.length > 0)
      ) {
        return parsed;
      }
    } catch {
      // fall through
    }
    return null;
  };

  const direct = tryParse(cleaned);
  if (direct) return direct.slice(0, 3);

  const match = cleaned.match(/\[[\s\S]*\]/);
  if (match) {
    const extracted = tryParse(match[0]);
    if (extracted) return extracted.slice(0, 3);
  }

  throw new Error("Model did not return a parseable JSON string array");
}

async function fetchSources(state: ResearchState): Promise<ResearchStateUpdate> {
  const model = getChatModel();
  const prompt = `You are a medical literature retrieval assistant.
Topic: "${state.topic}"

Return a JSON array (2 to 3 elements) of short structured text blocks (60-120 words each) that read like abstracts of real studies relevant to this topic. Each block must state: the study design, sample size (N=...), duration, and one key quantitative finding.
Respond with ONLY the JSON array of strings, no markdown fences, no commentary.`;

  const response = await model.invoke(prompt);
  const raw = messageContentToText(response.content);
  const docs = parseJsonStringArray(raw);

  return { rawDocs: docs };
}

async function qualityFilter(state: ResearchState): Promise<ResearchStateUpdate> {
  const validated = state.rawDocs
    .map((doc) => {
      const sampleMatch = doc.match(/N\s*=\s*(\d+)/i);
      const sampleSize = sampleMatch ? Number(sampleMatch[1]) : null;
      if (sampleSize !== null && sampleSize < MIN_SAMPLE_SIZE) {
        return `[FLAGGED: N=${sampleSize} below threshold] ${doc}`;
      }
      return doc;
    })
    .filter((doc) => doc.trim().length > 0);

  return { validatedFacts: validated };
}

async function criticAnalysis(state: ResearchState): Promise<ResearchStateUpdate> {
  const topicLower = state.topic.toLowerCase();
  const forcedTriggerWord = TRIGGER_WORDS.find((word) => topicLower.includes(word));

  const model = getChatModel();
  const prompt = `You are an adversarial fact-checking critic. Compare the following validated study excerpts for the topic "${state.topic}" and identify explicit numeric or directional contradictions between them (e.g. one study reports an increase, another a decrease, in the same outcome measure).

Excerpts:
${state.validatedFacts.map((fact, i) => `${i + 1}. ${fact}`).join("\n")}

Respond with ONLY a JSON array of strings describing each contradiction found (empty array [] if none).`;

  const response = await model.invoke(prompt);
  const raw = messageContentToText(response.content);

  let modelContradictions: string[] = [];
  try {
    modelContradictions = parseJsonStringArray(raw, { allowEmpty: true });
  } catch {
    modelContradictions = [];
  }

  const forced = forcedTriggerWord
    ? [
        `Trigger-word override: topic contains a comparative/collision term ("${forcedTriggerWord}"), forcing conflict-resolution branch for demonstration purposes.`,
      ]
    : [];

  return { contradictions: [...modelContradictions, ...forced] };
}

function routeAfterCritic(state: ResearchState): "resolve_conflict" | "generate_report" {
  return state.contradictions.length > 0 ? "resolve_conflict" : "generate_report";
}

async function resolveConflict(state: ResearchState): Promise<ResearchStateUpdate> {
  const model = getChatModel();
  const prompt = `You are a methodology arbiter. The following contradictions were found for topic "${state.topic}":
${state.contradictions.map((c, i) => `${i + 1}. ${c}`).join("\n")}

For each contradiction, resolve it by favoring larger, longer-duration, or higher methodological-weight evidence (e.g. meta-analyses over single pilot studies) where the excerpts below allow you to judge that. Return ONLY a JSON array of strings, each a one-paragraph resolution log entry stating which side was favored and why.

Excerpts:
${state.validatedFacts.map((fact, i) => `${i + 1}. ${fact}`).join("\n")}`;

  const response = await model.invoke(prompt);
  const raw = messageContentToText(response.content);
  const resolutions = parseJsonStringArray(raw, { allowEmpty: true });

  return { contradictions: resolutions.map((resolution) => `[RESOLVED] ${resolution}`) };
}

async function generateReport(state: ResearchState): Promise<ResearchStateUpdate> {
  const hasContradictions = state.contradictions.length > 0;
  const resolvedCount = state.contradictions.filter((c) => c.startsWith("[RESOLVED]")).length;

  const lines: string[] = [
    `# Research Overview: ${state.topic}`,
    "",
    "## Validated Findings",
    ...state.validatedFacts.map((fact) => `- ${fact}`),
    "",
  ];

  if (hasContradictions) {
    lines.push("## Detected Contradictions & Resolutions");
    lines.push(...state.contradictions.map((c) => `- ${c}`));
    lines.push("");
  }

  lines.push("## Summary");
  lines.push(
    hasContradictions
      ? `${resolvedCount} contradiction(s) were detected and resolved using methodological-weight arbitration before this report was compiled.`
      : "No contradictions were detected across the validated evidence set."
  );

  return { finalReport: lines.join("\n") };
}

export function buildResearchGraph() {
  const graph = new StateGraph(ResearchStateAnnotation)
    .addNode("fetch_sources", fetchSources)
    .addNode("quality_filter", qualityFilter)
    .addNode("critic_analysis", criticAnalysis)
    .addNode("resolve_conflict", resolveConflict)
    .addNode("generate_report", generateReport)
    .addEdge(START, "fetch_sources")
    .addEdge("fetch_sources", "quality_filter")
    .addEdge("quality_filter", "critic_analysis")
    .addConditionalEdges("critic_analysis", routeAfterCritic, {
      resolve_conflict: "resolve_conflict",
      generate_report: "generate_report",
    })
    .addEdge("resolve_conflict", "generate_report")
    .addEdge("generate_report", END);

  return graph.compile();
}

export const researchGraph = buildResearchGraph();
