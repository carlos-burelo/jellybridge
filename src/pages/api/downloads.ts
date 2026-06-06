import type { APIRoute } from 'astro';
import { getAllDownloads } from '../../lib/store';

export const GET: APIRoute = () => {
  return new Response(JSON.stringify(getAllDownloads()), {
    headers: { 'Content-Type': 'application/json' },
  });
};
