import { fetchAllData } from "@/app/lib/google";

export const dynamic = "force-dynamic";

const POLL_INTERVAL_MS = 30_000;

export async function GET(req: Request) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: any) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch {}
      };

      // Push initial data immediately
      send(await fetchAllData());

      // Push updates every 30s
      const interval = setInterval(async () => {
        try {
          send(await fetchAllData());
        } catch {
          try { controller.enqueue(encoder.encode(`: heartbeat\n\n`)); } catch {}
        }
      }, POLL_INTERVAL_MS);

      // Clean up when client disconnects
      req.signal.addEventListener("abort", () => {
        clearInterval(interval);
        try { controller.close(); } catch {}
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
