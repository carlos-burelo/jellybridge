import type { APIRoute } from 'astro';
import { readdirSync } from 'fs';
import { join, resolve, normalize } from 'path';

export const GET: APIRoute = ({ url }) => {
  const raw = url.searchParams.get('path') ?? '/';
  const target = resolve(normalize(raw));

  // Prevent path traversal — must be absolute and stay within the container root
  if (!target.startsWith('/')) {
    return new Response(JSON.stringify({ error: 'Invalid path' }), { status: 400 });
  }

  try {
    const entries = readdirSync(target, { withFileTypes: true })
      .filter((e) => e.isDirectory() && !e.name.startsWith('.'))
      .map((e) => ({ name: e.name, path: join(target, e.name) }))
      .sort((a, b) => a.name.localeCompare(b.name));

    return new Response(JSON.stringify({ path: target, entries }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(JSON.stringify({ error: 'Cannot read directory' }), { status: 500 });
  }
};
