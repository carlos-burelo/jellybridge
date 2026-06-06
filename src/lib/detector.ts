export type ContentType = 'archive' | 'video' | 'unknown';

const ARCHIVE_EXTS = new Set(['.zip', '.rar', '.7z', '.tar', '.gz', '.bz2', '.xz', '.cbz', '.cbr']);
const VIDEO_EXTS = new Set(['.mp4', '.mkv', '.avi', '.mov', '.wmv', '.m4v', '.flv', '.webm', '.ts', '.m2ts', '.mpg', '.mpeg']);

export function detectContentType(filename: string): ContentType {
  const ext = filename.slice(filename.lastIndexOf('.')).toLowerCase();
  if (ARCHIVE_EXTS.has(ext)) return 'archive';
  if (VIDEO_EXTS.has(ext)) return 'video';
  return 'unknown';
}
