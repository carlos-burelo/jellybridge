import { execFile } from 'child_process';
import { promisify } from 'util';
import { mkdirSync } from 'fs';

const exec = promisify(execFile);

export async function extractWithPasswords(
  archivePath: string,
  destDir: string,
  passwords: string[]
): Promise<void> {
  mkdirSync(destDir, { recursive: true });

  const tryExtract = async (password?: string): Promise<boolean> => {
    const args = ['x', '-y', `-o${destDir}`, archivePath];
    if (password) args.push(`-p${password}`);

    try {
      await exec('7z', args);
      return true;
    } catch {
      return false;
    }
  };

  // Try without password first
  if (await tryExtract()) return;

  // Try each password
  for (const pwd of passwords) {
    if (await tryExtract(pwd)) return;
  }

  throw new Error('Extraction failed: wrong password or corrupt archive');
}
