import type { APIRoute } from 'astro';
import { getEntries } from '../../lib/logger';
import type { LogLevel, LogCategory } from '../../lib/logger';

export const GET: APIRoute = ({ url }) => {
  const limit = Number(url.searchParams.get('limit') ?? 200);
  const level = url.searchParams.get('level') as LogLevel | null;
  const category = url.searchParams.get('category') as LogCategory | null;

  return new Response(JSON.stringify(getEntries(limit, level ?? undefined, category ?? undefined)), {
    headers: { 'Content-Type': 'application/json' },
  });
};
