import type { APIRoute } from 'astro';
import { subscribe, getAllDownloads } from '../../lib/store';

export const GET: APIRoute = () => {
  let unsub: (() => void) | undefined;
  let heartbeat: ReturnType<typeof setInterval> | undefined;

  const stream = new ReadableStream({
    start(controller) {
      const enc = new TextEncoder();

      const send = (payload: string) => {
        try {
          controller.enqueue(enc.encode(payload));
        } catch {
          // client disconnected
        }
      };

      // Send current state immediately on connect
      for (const d of getAllDownloads()) {
        send(`data: ${JSON.stringify(d)}\n\n`);
      }

      // Push updates
      unsub = subscribe((download) => {
        send(`data: ${JSON.stringify(download)}\n\n`);
      });

      // Keepalive every 25s (proxies kill idle SSE connections)
      heartbeat = setInterval(() => {
        send(`: ping\n\n`);
      }, 25_000);
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
      'X-Accel-Buffering': 'no', // disable nginx buffering (common in CasaOS)
    },
  });
};
