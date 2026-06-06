import { spawn } from 'child_process';
import { mkdirSync } from 'fs';
import { logger } from './logger';

type ProgressCallback = (pct: number) => void;

function run7z(args: string[], onProgress?: ProgressCallback): Promise<{ ok: boolean; output: string }> {
  return new Promise((resolve) => {
    const proc = spawn('7z', [...args, '-bsp1', '-bse1'], { stdio: ['ignore', 'pipe', 'pipe'] });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (chunk: Buffer) => {
      const text = chunk.toString();
      stdout += text;
      const matches = text.match(/(\d{1,3})%/g);
      if (matches && onProgress) {
        const last = parseInt(matches[matches.length - 1]);
        if (!isNaN(last)) onProgress(last);
      }
    });

    proc.stderr.on('data', (chunk: Buffer) => { stderr += chunk.toString(); });

    proc.on('close', (code) => resolve({ ok: code === 0, output: stdout + stderr }));
    proc.on('error', (err) => resolve({ ok: false, output: err.message }));
  });
}

export async function extractWithPasswords(
  archivePath: string,
  destDir: string,
  passwords: string[],
  onProgress?: ProgressCallback
): Promise<void> {
  mkdirSync(destDir, { recursive: true });

  const baseArgs = ['x', '-y', `-o${destDir}`, archivePath];

  logger.info('extract', `Starting extraction`, archivePath);

  // Try without password first
  const first = await run7z(baseArgs, onProgress);
  if (first.ok) {
    logger.info('extract', `Extracted successfully (no password)`, archivePath);
    return;
  }
  logger.debug('extract', `No-password attempt failed`, first.output.trim().slice(0, 200));

  // Try each password
  for (let i = 0; i < passwords.length; i++) {
    const pwd = passwords[i];
    onProgress?.(0);
    logger.debug('extract', `Trying password ${i + 1}/${passwords.length}`);
    const result = await run7z([...baseArgs, `-p${pwd}`], onProgress);
    if (result.ok) {
      logger.info('extract', `Extracted successfully with password ${i + 1}`, archivePath);
      return;
    }
    logger.debug('extract', `Password ${i + 1} failed`, result.output.trim().slice(0, 200));
  }

  const msg = passwords.length > 0
    ? `Extraction failed: tried ${passwords.length} password(s), all wrong or corrupt archive`
    : 'Extraction failed: archive requires a password — add one in Settings';

  logger.error('extract', msg, archivePath);
  throw new Error(msg);
}
