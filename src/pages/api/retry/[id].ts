import type { APIRoute } from 'astro';
import { retryDownload } from '../../../lib/pipeline';

export const POST: APIRoute = async ({ params }) => {
  try {
    await retryDownload(params.id!);
    return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: message }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }
};
