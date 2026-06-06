import { spawn } from 'child_process';
import { mkdirSync } from 'fs';
import { extname } from 'path';
import { logger } from './logger';

type ProgressCallback = (pct: number) => void;

function runCommand(
  cmd: string,
  args: string[],
  onProgress?: ProgressCallback
): Promise<{ ok: boolean; output: string }> {
  return new Promise((resolve) => {
    const proc = spawn(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let out = '';

    const onData = (chunk: Buffer) => {
      const text = chunk.toString();
      out += text;
      if (onProgress) {
        const matches = text.match(/(\d{1,3})%/g);
        if (matches) {
          const last = parseInt(matches[matches.length - 1]);
          if (!isNaN(last)) onProgress(last);
        }
      }
    };

    proc.stdout.on('data', onData);
    proc.stderr.on('data', onData);
    proc.on('close', (code) => resolve({ ok: code === 0, output: out }));
    proc.on('error', (err) => resolve({ ok: false, output: err.message }));
  });
}

function is7zNative(archivePath: string): boolean {
  const ext = extname(archivePath).toLowerCase();
  return ['.zip', '.7z', '.tar', '.gz', '.bz2', '.xz'].includes(ext);
}

async function tryUnrar(
  archivePath: string,
  destDir: string,
  password?: string,
  onProgress?: ProgressCallback
): Promise<{ ok: boolean; output: string }> {
  // unrar x -p<pwd> -y -inul <archive> <destdir>
  const args = ['x', '-y', '-inul'];
  if (password) args.push(`-p${password}`);
  else args.push('-p-'); // explicitly no password
  args.push(archivePath, destDir);
  return runCommand('unrar', args, onProgress);
}

async function try7z(
  archivePath: string,
  destDir: string,
  password?: string,
  onProgress?: ProgressCallback
): Promise<{ ok: boolean; output: string }> {
  const args = ['x', '-y', `-o${archivePath.includes(' ') ? `"${destDir}"` : destDir}`, archivePath, '-bsp1', '-bse1'];
  if (password) args.push(`-p${password}`);
  return runCommand('7z', args, onProgress);
}

export async function extractWithPasswords(
  archivePath: string,
  destDir: string,
  passwords: string[],
  onProgress?: ProgressCallback
): Promise<void> {
  mkdirSync(destDir, { recursive: true });

  const useUnrar = !is7zNative(archivePath);
  const extractor = useUnrar ? 'unrar' : '7z';
  const tryExtract = useUnrar ? tryUnrar : try7z;

  logger.info('extract', `Starting extraction with ${extractor}`, archivePath);

  // Try without password first
  const first = await tryExtract(archivePath, destDir, undefined, onProgress);
  if (first.ok) {
    logger.info('extract', `Extracted successfully (no password)`, archivePath);
    return;
  }
  logger.debug('extract', `No-password attempt failed`, first.output.trim().slice(0, 300));

  // Try each password
  for (let i = 0; i < passwords.length; i++) {
    onProgress?.(0);
    logger.debug('extract', `Trying password ${i + 1}/${passwords.length}`);
    const result = await tryExtract(archivePath, destDir, passwords[i], onProgress);
    if (result.ok) {
      logger.info('extract', `Extracted successfully with password ${i + 1}`, archivePath);
      return;
    }
    logger.debug('extract', `Password ${i + 1} failed`, result.output.trim().slice(0, 300));
  }

  const msg = passwords.length > 0
    ? `Extraction failed: tried ${passwords.length} password(s) — all wrong or corrupt archive`
    : 'Extraction failed: archive requires a password — add one in Settings';

  logger.error('extract', msg, archivePath);
  throw new Error(msg);
}
