import { appendFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

export type LogLevel = 'info' | 'warn' | 'error' | 'debug';
export type LogCategory = 'system' | 'mediafire' | 'download' | 'extract' | 'move' | 'sse';

export interface LogEntry {
  id: string;
  ts: number;
  level: LogLevel;
  category: LogCategory;
  message: string;
  detail?: string;
}

const LOG_PATH = join(process.cwd(), 'data', 'logs.jsonl');
const MAX_MEMORY = 500;

const entries: LogEntry[] = [];
const listeners = new Set<(e: LogEntry) => void>();

let logFileReady = false;

function ensureLogFile() {
  if (logFileReady) return;
  try {
    mkdirSync(join(process.cwd(), 'data'), { recursive: true });
    logFileReady = true;
  } catch { /* ignore */ }
}

function shortId() {
  return Math.random().toString(36).slice(2, 10);
}

export function log(level: LogLevel, category: LogCategory, message: string, detail?: string) {
  const entry: LogEntry = { id: shortId(), ts: Date.now(), level, category, message, detail };

  entries.push(entry);
  if (entries.length > MAX_MEMORY) entries.shift();

  listeners.forEach((fn) => fn(entry));

  ensureLogFile();
  try {
    appendFileSync(LOG_PATH, JSON.stringify(entry) + '\n', 'utf-8');
  } catch { /* ignore */ }

  const prefix = `[${new Date(entry.ts).toISOString()}] [${level.toUpperCase()}] [${category}]`;
  if (level === 'error') console.error(prefix, message, detail ?? '');
  else console.log(prefix, message, detail ?? '');
}

export const logger = {
  info:  (cat: LogCategory, msg: string, detail?: string) => log('info',  cat, msg, detail),
  warn:  (cat: LogCategory, msg: string, detail?: string) => log('warn',  cat, msg, detail),
  error: (cat: LogCategory, msg: string, detail?: string) => log('error', cat, msg, detail),
  debug: (cat: LogCategory, msg: string, detail?: string) => log('debug', cat, msg, detail),
};

export function getEntries(limit = 200, level?: LogLevel, category?: LogCategory): LogEntry[] {
  return entries
    .filter((e) => (!level || e.level === level) && (!category || e.category === category))
    .slice(-limit);
}

export function subscribeLogs(fn: (e: LogEntry) => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
