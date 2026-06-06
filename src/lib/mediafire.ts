export async function resolveMediafireUrl(pageUrl: string): Promise<{ directUrl: string; filename: string }> {
  const res = await fetch(pageUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36',
    },
  });

  if (!res.ok) throw new Error(`Failed to fetch MediaFire page: ${res.status}`);

  const html = await res.text();

  // Extract direct download link from aria-label="Download file" or href with download key
  const directMatch =
    html.match(/href="(https:\/\/download\d+\.mediafire\.com\/[^"]+)"/) ||
    html.match(/id="downloadButton"[^>]*href="([^"]+)"/) ||
    html.match(/"(https:\/\/download[^"]+mediafire\.com[^"]+)"/);

  if (!directMatch) throw new Error('Could not find direct download URL in MediaFire page');

  const directUrl = directMatch[1];

  // Extract filename
  const filenameMatch =
    html.match(/<div class="filename">([^<]+)<\/div>/) ||
    html.match(/class="dl-btn-label"[^>]*>([^<]+)</) ||
    html.match(/"filename":"([^"]+)"/) ||
    directUrl.match(/\/([^/?]+)\?/);

  const filename = filenameMatch ? filenameMatch[1].trim() : 'download';

  return { directUrl, filename };
}
