import type { APIRoute } from 'astro';
import { startDownload } from '../../lib/pipeline';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { url, destinationId, provider = 'mediafire' } = await request.json();
    if (!url || !destinationId) {
      return new Response(JSON.stringify({ error: 'url and destinationId required' }), { status: 400 });
    }
    const id = await startDownload(url, destinationId, provider);
    return new Response(JSON.stringify({ id }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
};
