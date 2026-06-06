import type { APIRoute } from 'astro';
import { subscribeLogs, getEntries } from '../../../lib/logger';

export const GET: APIRoute = () => {
  let unsub: (() => void) | undefined;
  let heartbeat: ReturnType<typeof setInterval> | undefined;

  const stream = new ReadableStream({
    start(controller) {
      const enc = new TextEncoder();
      const send = (payload: string) => {
        try { controller.enqueue(enc.encode(payload)); } catch { /* client gone */ }
      };

      // Send last 100 entries on connect
      for (const e of getEntries(100)) {
        send(`data: ${JSON.stringify(e)}\n\n`);
      }

      unsub = subscribeLogs((e) => send(`data: ${JSON.stringify(e)}\n\n`));
      heartbeat = setInterval(() => send(`: ping\n\n`), 25_000);
    },
    cancel() {
      unsub?.();
      if (heartbeat !== undefined) clearInterval(heartbeat);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
};
