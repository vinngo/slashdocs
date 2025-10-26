import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, repo_id, stream } = body;

    // Extract the last user message as the question
    const lastUserMessage = messages
      .filter((msg: { role: string }) => msg.role === "user")
      .pop();

    console.log(lastUserMessage);

    if (!lastUserMessage) {
      return new Response(JSON.stringify({ error: "No user message found" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!repo_id) {
      return new Response(JSON.stringify({ error: "repo_id is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Backend expects question as a query parameter or form field
    const backendUrl = `http://127.0.0.1:8000/api/repos/${repo_id}/ask?question=${encodeURIComponent(lastUserMessage.content)}`;

    const response = await fetch(backendUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return new Response(
        JSON.stringify({
          error: errorData.detail || "Failed to get answer from backend",
        }),
        {
          status: response.status,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // If streaming is requested, stream back the response
    if (stream) {
      const encoder = new TextEncoder();
      const readable = new ReadableStream({
        async start(controller) {
          try {
            const data = await response.json();
            const answer = data.answer || "";

            console.log("Backend response:", data);
            console.log("Answer to stream:", answer);

            // Send the response as SSE chunks
            // First chunk: start of message
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: "control",
                  message_id: "msg-" + Date.now(),
                  status: "in_progress",
                })}\n\n`,
              ),
            );

            // Stream the answer word by word for a streaming effect
            const words = answer.split(" ");
            for (let i = 0; i < words.length; i++) {
              const word = words[i] + (i < words.length - 1 ? " " : "");
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({
                    type: "token",
                    message_id: "msg-" + Date.now(),
                    delta: word,
                  })}\n\n`,
                ),
              );
              // Small delay to simulate streaming
              await new Promise((resolve) => setTimeout(resolve, 50));
            }

            // Send citations if available
            if (data.sources && Array.isArray(data.sources)) {
              const citations = data.sources.map(
                (
                  source: {
                    file_path: string;
                    chunk_id: string;
                    similarity: number;
                  },
                  idx: number,
                ) => ({
                  id: source.chunk_id || `citation-${idx}`,
                  file_path: source.file_path,
                  snippet: `Similarity: ${(source.similarity * 100).toFixed(1)}%`,
                  repo_id: repo_id,
                  score: source.similarity,
                }),
              );

              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({
                    type: "citation",
                    message_id: "msg-" + Date.now(),
                    citations: citations,
                  })}\n\n`,
                ),
              );
            }

            // Final chunk: completion
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: "control",
                  message_id: "msg-" + Date.now(),
                  status: "completed",
                })}\n\n`,
              ),
            );

            controller.close();
          } catch (err) {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: "error",
                  message_id: "msg-" + Date.now(),
                  error: {
                    code: "STREAM_ERROR",
                    message:
                      err instanceof Error ? err.message : "Streaming failed",
                  },
                })}\n\n`,
              ),
            );
            controller.close();
          }
        },
      });

      return new Response(readable, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }

    // Non-streaming response
    const data = await response.json();
    return new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : "Failed to call LLM",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
