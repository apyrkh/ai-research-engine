import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatOpenAI } from "@langchain/openai";

export function getChatModel(): ChatGoogleGenerativeAI | ChatOpenAI {
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

export function messageContentToText(content: unknown): string {
  return typeof content === "string" ? content : JSON.stringify(content);
}

export function parseJsonStringArray(
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
