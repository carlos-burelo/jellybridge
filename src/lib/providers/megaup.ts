import { logger } from '../logger';

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.5',
};

export async function resolve(pageUrl: string): Promise<{ directUrl: string; filename: string }> {
  logger.info('megaup', `Resolving URL`, pageUrl);

  const res = await fetch(pageUrl, { headers: HEADERS });
  if (!res.ok) throw new Error(`MegaUp page fetch failed: ${res.status}`);
  const html = await res.text();

  // MegaUp embeds the direct URL inside JS: href='https://download.megaup.net/?url=...'
  const match =
    html.match(/href='(https:\/\/download\.megaup\.net\/\?url=[^']+)'/) ||
    html.match(/href="(https:\/\/download\.megaup\.net\/\?url=[^"]+)"/);

  if (!match) {
    logger.error('megaup', 'Direct URL not found in page JS', pageUrl);
    logger.debug('megaup', 'Page HTML (first 3000 chars)', html.slice(0, 3000));
    throw new Error('Could not find MegaUp download URL — check logs for HTML');
  }

  const directUrl = match[1];

  const titleMatch = html.match(/<title>([^<|]+)/);
  const filename = titleMatch
    ? titleMatch[1].trim().replace(/\s*[-|]\s*megaup.*$/i, '').trim()
    : pageUrl.split('/').pop() ?? 'download';

  logger.info('megaup', `Resolved: ${filename}`, directUrl);
  return { directUrl, filename };
}
