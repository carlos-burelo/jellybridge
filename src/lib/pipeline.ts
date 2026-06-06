import { join, basename } from 'path';
import { unlinkSync, renameSync, copyFileSync, mkdirSync } from 'fs';
import { resolveMediafireUrl } from './mediafire';
import { downloadFile } from './downloader';
import { extractWithPasswords } from './extractor';
import { detectContentType } from './detector';
import { createDownload, updateDownload } from './store';
import { loadSettings } from './settings';
import type { Provider } from './store';

export async function startDownload(
  url: string,
  destinationId: string,
  provider: Provider = 'mediafire'
): Promise<string> {
  const settings = loadSettings();
  const destination = settings.destinations.find((d) => d.id === destinationId);
  if (!destination) throw new Error('Destination not found');

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
  try {
    renameSync(src, dest);
  } catch {
    // rename fails across filesystems — fallback to copy+delete
    copyFileSync(src, dest);
    unlinkSync(src);
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
    // Resolve direct URL based on provider
    const { directUrl, filename } =
      provider === 'mediafire' ? await resolveMediafireUrl(url) : (() => { throw new Error(`Unknown provider: ${provider}`); })();

    const contentType = detectContentType(filename);
    updateDownload(downloadId, { filename, contentType });

    filePath = await downloadFile(downloadId, directUrl, filename, tempDir);

    if (contentType === 'archive') {
      updateDownload(downloadId, { status: 'extracting', progress: 100 });
      await extractWithPasswords(filePath, destPath, passwords);
      unlinkSync(filePath);
      filePath = null;
    } else {
      // video or unknown — move directly
      updateDownload(downloadId, { status: 'moving', progress: 100 });
      await moveFile(filePath, destPath);
      filePath = null;
    }

    updateDownload(downloadId, { status: 'done', progress: 100 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    updateDownload(downloadId, { status: 'error', error: message });
  } finally {
    if (filePath) {
      try { unlinkSync(filePath); } catch { /* ignore */ }
    }
  }
}
