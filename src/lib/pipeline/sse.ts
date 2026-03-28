import type { SSEEvent } from "@/types/pipeline";

export function createSSEStream() {
  const encoder = new TextEncoder();
  let controller: ReadableStreamDefaultController<Uint8Array> | null = null;

  const stream = new ReadableStream<Uint8Array>({
    start(c) {
      controller = c;
    },
    cancel() {
      controller = null;
    },
  });

  const send = (event: SSEEvent) => {
    if (!controller) return;
    try {
      const data = `event: ${event.event}\ndata: ${JSON.stringify(event.data)}\n\n`;
      controller.enqueue(encoder.encode(data));
    } catch {
      // Stream closed
    }
  };

  const close = () => {
    if (!controller) return;
    try {
      controller.close();
    } catch {
      // Already closed
    }
    controller = null;
  };

  return { stream, send, close };
}

export function createSSEResponse(stream: ReadableStream<Uint8Array>) {
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
