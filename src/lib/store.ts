export type DownloadStatus = 'pending' | 'downloading' | 'extracting' | 'moving' | 'done' | 'error';
export type Provider = 'mediafire';
export type ContentType = 'archive' | 'video' | 'unknown';

export interface Download {
  id: string;
  provider: Provider;
  url: string;
  filename: string;
  contentType: ContentType;
  destinationId: string;
  destinationName: string;
  status: DownloadStatus;
  progress: number;
  totalBytes: number;
  downloadedBytes: number;
  error?: string;
  createdAt: number;
}

const downloads = new Map<string, Download>();
const listeners = new Set<(d: Download) => void>();

export function createDownload(data: Omit<Download, 'id' | 'createdAt'>): Download {
  const id = crypto.randomUUID();
  const download: Download = { ...data, id, createdAt: Date.now() };
  downloads.set(id, download);
  return download;
}

export function updateDownload(id: string, patch: Partial<Download>): Download | undefined {
  const d = downloads.get(id);
  if (!d) return undefined;
  const updated = { ...d, ...patch };
  downloads.set(id, updated);
  listeners.forEach((fn) => fn(updated));
  return updated;
}

export function getDownload(id: string): Download | undefined {
  return downloads.get(id);
}

export function getAllDownloads(): Download[] {
  return [...downloads.values()].sort((a, b) => b.createdAt - a.createdAt);
}

export function subscribe(fn: (d: Download) => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
