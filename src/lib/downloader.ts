import { createWriteStream, mkdirSync } from 'fs';
import { join } from 'path';
import { updateDownload } from './store';
import { logger } from './logger';

export async function downloadFile(
  downloadId: string,
  directUrl: string,
  filename: string,
  tempDir: string
): Promise<string> {
  mkdirSync(tempDir, { recursive: true });
  const destPath = join(tempDir, filename);

  logger.info('download', `Starting download: ${filename}`, directUrl);

  const res = await fetch(directUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36',
    },
  });

  if (!res.ok) {
    const msg = `Download failed: HTTP ${res.status}`;
    logger.error('download', msg, filename);
    throw new Error(msg);
  }

  const totalBytes = Number(res.headers.get('content-length') ?? 0);
  logger.info('download', `File size: ${totalBytes > 0 ? (totalBytes / 1024 / 1024).toFixed(1) + ' MB' : 'unknown'}`, filename);
  updateDownload(downloadId, { status: 'downloading', totalBytes });

  const writer = createWriteStream(destPath);
  let downloadedBytes = 0;

  if (!res.body) throw new Error('No response body');

  for await (const chunk of res.body as unknown as AsyncIterable<Uint8Array>) {
    writer.write(chunk);
    downloadedBytes += chunk.length;
    const progress = totalBytes > 0 ? Math.round((downloadedBytes / totalBytes) * 100) : 0;
    updateDownload(downloadId, { downloadedBytes, progress });
  }

  await new Promise<void>((resolve, reject) => {
    writer.end();
    writer.on('finish', resolve);
    writer.on('error', reject);
  });

  logger.info('download', `Download complete: ${filename}`, destPath);
  return destPath;
}
