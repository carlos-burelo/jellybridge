import { join, basename } from 'path';
import { unlinkSync, renameSync, copyFileSync, mkdirSync } from 'fs';
import { resolveMediafireUrl } from './mediafire';
import { downloadFile } from './downloader';
import { extractWithPasswords } from './extractor';
import { detectContentType } from './detector';
import { createDownload, updateDownload } from './store';
import { loadSettings } from './settings';
import { logger } from './logger';
import type { Provider } from './store';

export async function startDownload(
  url: string,
  destinationId: string,
  provider: Provider = 'mediafire'
): Promise<string> {
  const settings = loadSettings();
  const destination = settings.destinations.find((d) => d.id === destinationId);
  if (!destination) throw new Error('Destination not found');

  logger.info('system', `New download queued via ${provider}`, url);

  const download = createDownload({
    provider,
    url,
    filename: '',
    contentType: 'unknown',
    destinationId,
    destinationName: destination.name,
    status: 'pending',
    progress: 0,
    totalBytes: 0,
    downloadedBytes: 0,
  });

  runPipeline(download.id, url, provider, destination.path, settings.passwords, settings.tempDir);

  return download.id;
}

async function moveFile(src: string, destDir: string): Promise<void> {
  mkdirSync(destDir, { recursive: true });
  const dest = join(destDir, basename(src));
  logger.info('move', `Moving to ${destDir}`, src);
  try {
    renameSync(src, dest);
    logger.info('move', `Move complete (rename)`, dest);
  } catch {
    logger.debug('move', `rename failed (cross-device), fallback to copy+delete`);
    copyFileSync(src, dest);
    unlinkSync(src);
    logger.info('move', `Move complete (copy+delete)`, dest);
  }
}

async function runPipeline(
  downloadId: string,
  url: string,
  provider: Provider,
  destPath: string,
  passwords: string[],
  tempDir: string
): Promise<void> {
  let filePath: string | null = null;
  try {
    const { directUrl, filename } =
      provider === 'mediafire'
        ? await resolveMediafireUrl(url)
        : (() => { throw new Error(`Unknown provider: ${provider}`); })();

    const contentType = detectContentType(filename);
    logger.info('system', `Detected content type: ${contentType}`, filename);
    updateDownload(downloadId, { filename, contentType });

    filePath = await downloadFile(downloadId, directUrl, filename, tempDir);

    if (contentType === 'archive') {
      updateDownload(downloadId, { status: 'extracting', progress: 0 });
      await extractWithPasswords(filePath, destPath, passwords, (pct) => {
        updateDownload(downloadId, { progress: pct });
      });
      unlinkSync(filePath);
      filePath = null;
    } else {
      updateDownload(downloadId, { status: 'moving', progress: 100 });
      await moveFile(filePath, destPath);
      filePath = null;
    }

    logger.info('system', `Pipeline complete for: ${filename}`, destPath);
    updateDownload(downloadId, { status: 'done', progress: 100 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error('system', `Pipeline failed: ${message}`, url);
    updateDownload(downloadId, { status: 'error', error: message });
  } finally {
    if (filePath) {
      try { unlinkSync(filePath); } catch { /* ignore */ }
    }
  }
}
