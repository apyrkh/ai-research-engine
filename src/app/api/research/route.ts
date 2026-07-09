import { researchGraph } from "@/lib/graph/researchGraph";

export const runtime = "edge";
export const dynamic = "force-dynamic";

interface ResearchRequestBody {
  topic: string;
}

function sseHeaders(): HeadersInit {
  return {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
  };
}

function sseErrorResponse(message: string, status: number): Response {
  return new Response(
    `data: ${JSON.stringify({ node: "error", state: { message } })}\n\n`,
    { status, headers: sseHeaders() }
  );
}

export async function POST(request: Request): Promise<Response> {
  let body: ResearchRequestBody;
  try {
    body = await request.json();
  } catch {
    return sseErrorResponse("Invalid JSON body", 400);
  }

  if (!body?.topic || typeof body.topic !== "string" || body.topic.trim().length === 0) {
    return sseErrorResponse("Missing required 'topic' string in request body", 400);
  }

  const topic = body.topic;
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const graphStream = await researchGraph.stream(
          { topic },
          { streamMode: "updates" }
        );

        for await (const chunk of graphStream) {
          for (const [node, state] of Object.entries(chunk)) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ node, state })}\n\n`)
            );
          }
        }

        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ node: "done", state: {} })}\n\n`)
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error during graph execution";
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ node: "error", state: { message } })}\n\n`)
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, { headers: sseHeaders() });
}
