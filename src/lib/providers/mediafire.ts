import { logger } from '../logger';

export async function resolve(pageUrl: string): Promise<{ directUrl: string; filename: string }> {
  logger.info('mediafire', `Resolving URL`, pageUrl);

  const res = await fetch(pageUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36',
    },
  });

  if (!res.ok) {
    const msg = `Failed to fetch MediaFire page: ${res.status}`;
    logger.error('mediafire', msg, pageUrl);
    throw new Error(msg);
  }

  const html = await res.text();

  const directMatch =
    html.match(/href="(https:\/\/download\d+\.mediafire\.com\/[^"]+)"/) ||
    html.match(/id="downloadButton"[^>]*href="([^"]+)"/) ||
    html.match(/"(https:\/\/download[^"]+mediafire\.com[^"]+)"/);

  if (!directMatch) {
    const msg = 'Could not find direct download URL in MediaFire page';
    logger.error('mediafire', msg, pageUrl);
    throw new Error(msg);
  }

  const directUrl = directMatch[1];

  const filenameMatch =
    html.match(/<div class="filename">([^<]+)<\/div>/) ||
    html.match(/class="dl-btn-label"[^>]*>([^<]+)</) ||
    html.match(/"filename":"([^"]+)"/) ||
    directUrl.match(/\/([^/?]+)\?/);

  const filename = filenameMatch ? filenameMatch[1].trim() : 'download';

  logger.info('mediafire', `Resolved: ${filename}`, directUrl);
  return { directUrl, filename };
}
