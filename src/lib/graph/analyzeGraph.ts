import { Annotation, StateGraph, START, END } from "@langchain/langgraph";
import { getChatModel, messageContentToText, parseJsonStringArray } from "./llm";

export const AnalyzeStateAnnotation = Annotation.Root({
  topic: Annotation<string>,
  rawDocs: Annotation<string[]>({
    reducer: (left, right) => left.concat(right),
    default: () => [],
  }),
  findings: Annotation<string[]>({
    reducer: (left, right) => left.concat(right),
    default: () => [],
  }),
  finalReport: Annotation<string>({
    reducer: (_left, right) => right,
    default: () => "",
  }),
});

export type AnalyzeState = typeof AnalyzeStateAnnotation.State;
export type AnalyzeStateUpdate = typeof AnalyzeStateAnnotation.Update;

async function fetchSources(state: AnalyzeState): Promise<AnalyzeStateUpdate> {
  const model = getChatModel();
  const prompt = `You are a literature retrieval assistant performing a quick baseline scan.
Topic: "${state.topic}"

Return a JSON array (2 to 3 elements) of short structured text blocks (60-120 words each) that read like abstracts of real studies relevant to this topic. Each block must state: the study design, sample size (N=...), duration, and one key quantitative finding.
Respond with ONLY the JSON array of strings, no markdown fences, no commentary.`;

  const response = await model.invoke(prompt);
  const raw = messageContentToText(response.content);
  const docs = parseJsonStringArray(raw);

  return { rawDocs: docs };
}

async function criticAnalysis(state: AnalyzeState): Promise<AnalyzeStateUpdate> {
  const model = getChatModel();
  const prompt = `You are a research analyst performing a single-pass baseline review. Summarize the key findings from the following source excerpts for the topic "${state.topic}".

Excerpts:
${state.rawDocs.map((doc, i) => `${i + 1}. ${doc}`).join("\n")}

Respond with ONLY a JSON array of strings, each a one-sentence key finding drawn from the excerpts.`;

  const response = await model.invoke(prompt);
  const raw = messageContentToText(response.content);
  const findings = parseJsonStringArray(raw, { allowEmpty: true });

  return { findings };
}

async function generateReport(state: AnalyzeState): Promise<AnalyzeStateUpdate> {
  const lines: string[] = [
    `# Baseline Analysis: ${state.topic}`,
    "",
    "## Key Findings",
    ...state.findings.map((finding) => `- ${finding}`),
    "",
    "## Summary",
    `${state.findings.length} key finding(s) were extracted from ${state.rawDocs.length} source(s) in a single linear pass, with no conflict-resolution step.`,
  ];

  return { finalReport: lines.join("\n") };
}

export function buildAnalyzeGraph() {
  const graph = new StateGraph(AnalyzeStateAnnotation)
    .addNode("fetch_sources", fetchSources)
    .addNode("critic_analysis", criticAnalysis)
    .addNode("generate_report", generateReport)
    .addEdge(START, "fetch_sources")
    .addEdge("fetch_sources", "critic_analysis")
    .addEdge("critic_analysis", "generate_report")
    .addEdge("generate_report", END);

  return graph.compile();
}

export const analyzeGraph = buildAnalyzeGraph();
