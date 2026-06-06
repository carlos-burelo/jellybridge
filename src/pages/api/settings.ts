import type { APIRoute } from 'astro';
import { loadSettings, saveSettings } from '../../lib/settings';

export const GET: APIRoute = () => {
  return new Response(JSON.stringify(loadSettings()), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    saveSettings(body);
    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
};
