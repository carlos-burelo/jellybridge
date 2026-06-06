import { useEffect, useRef, useState } from 'react';

type LogLevel = 'info' | 'warn' | 'error' | 'debug';
type LogCategory = 'system' | 'mediafire' | 'download' | 'extract' | 'move' | 'sse';

interface LogEntry {
  id: string;
  ts: number;
  level: LogLevel;
  category: LogCategory;
  message: string;
  detail?: string;
}

const LEVEL_STYLE: Record<LogLevel, string> = {
  info:  'text-blue-400',
  warn:  'text-amber-400',
  error: 'text-red-400',
  debug: 'text-zinc-500',
};

const LEVEL_BG: Record<LogLevel, string> = {
  info:  'bg-blue-950/30 border-blue-900/30',
  warn:  'bg-amber-950/30 border-amber-900/30',
  error: 'bg-red-950/40 border-red-900/40',
  debug: 'bg-transparent border-transparent',
};

const CATEGORY_STYLE: Record<LogCategory, string> = {
  system:    'text-zinc-400',
  mediafire: 'text-purple-400',
  download:  'text-blue-400',
  extract:   'text-amber-400',
  move:      'text-green-400',
  sse:       'text-zinc-500',
};

const ALL_LEVELS: LogLevel[] = ['info', 'warn', 'error', 'debug'];
const ALL_CATEGORIES: LogCategory[] = ['system', 'mediafire', 'download', 'extract', 'move', 'sse'];

function fmt(ts: number) {
  return new Date(ts).toLocaleTimeString('es', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export default function LogViewer({ initial }: { initial: LogEntry[] }) {
  const [logs, setLogs] = useState<LogEntry[]>(initial);
  const [connected, setConnected] = useState(false);
  const [filterLevel, setFilterLevel] = useState<LogLevel | 'all'>('all');
  const [filterCat, setFilterCat] = useState<LogCategory | 'all'>('all');
  const [autoScroll, setAutoScroll] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let es: EventSource;
    let retry: ReturnType<typeof setTimeout>;

    const connect = () => {
      es = new EventSource('/api/logs/stream');
      es.onopen = () => setConnected(true);
      es.onmessage = (e) => {
        const entry: LogEntry = JSON.parse(e.data);
        setLogs((prev) => {
          const next = [...prev, entry];
          return next.length > 500 ? next.slice(-500) : next;
        });
      };
      es.onerror = () => {
        setConnected(false);
        es.close();
        retry = setTimeout(connect, 3000);
      };
    };

    connect();
    return () => { clearTimeout(retry); es?.close(); };
  }, []);

  useEffect(() => {
    if (autoScroll) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs, autoScroll]);

  const onScroll = () => {
    const el = containerRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
    setAutoScroll(atBottom);
  };

  const filtered = logs.filter((e) =>
    (filterLevel === 'all' || e.level === filterLevel) &&
    (filterCat === 'all' || e.category === filterCat)
  );

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${connected ? 'bg-green-400' : 'bg-zinc-600'}`} />
        <span className="text-xs text-zinc-500 mr-2">{connected ? 'En vivo' : 'Reconectando…'}</span>

        <select
          value={filterLevel}
          onChange={(e) => setFilterLevel(e.target.value as LogLevel | 'all')}
          className="bg-zinc-900 border border-zinc-800 rounded-md px-2 py-1 text-xs text-zinc-300 focus:outline-none"
        >
          <option value="all">Todos los niveles</option>
          {ALL_LEVELS.map((l) => <option key={l} value={l}>{l.toUpperCase()}</option>)}
        </select>

        <select
          value={filterCat}
          onChange={(e) => setFilterCat(e.target.value as LogCategory | 'all')}
          className="bg-zinc-900 border border-zinc-800 rounded-md px-2 py-1 text-xs text-zinc-300 focus:outline-none"
        >
          <option value="all">Todas las categorías</option>
          {ALL_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>

        <button
          onClick={() => setLogs([])}
          className="ml-auto text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          Limpiar vista
        </button>
        <button
          onClick={() => setAutoScroll(true)}
          className={`text-xs transition-colors ${autoScroll ? 'text-blue-400' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          Auto-scroll
        </button>
      </div>

      {/* Log list */}
      <div
        ref={containerRef}
        onScroll={onScroll}
        className="flex-1 overflow-y-auto rounded-xl border border-zinc-800 bg-zinc-950 font-mono text-xs"
      >
        {filtered.length === 0 && (
          <p className="text-zinc-600 p-4">Sin logs.</p>
        )}
        {filtered.map((e) => (
          <div
            key={e.id}
            onClick={() => e.detail && toggleExpand(e.id)}
            className={`flex flex-col border-b border-zinc-800/50 px-3 py-1.5 ${e.detail ? 'cursor-pointer hover:bg-zinc-900/50' : ''} ${e.level === 'error' ? LEVEL_BG.error : e.level === 'warn' ? LEVEL_BG.warn : ''}`}
          >
            <div className="flex items-baseline gap-2 min-w-0">
              <span className="text-zinc-600 shrink-0">{fmt(e.ts)}</span>
              <span className={`font-bold shrink-0 w-10 ${LEVEL_STYLE[e.level]}`}>{e.level.toUpperCase().slice(0,4)}</span>
              <span className={`shrink-0 w-20 ${CATEGORY_STYLE[e.category]}`}>{e.category}</span>
              <span className="text-zinc-200 truncate">{e.message}</span>
              {e.detail && <span className="ml-auto text-zinc-600 shrink-0">{expanded.has(e.id) ? '▲' : '▼'}</span>}
            </div>
            {e.detail && expanded.has(e.id) && (
              <pre className="mt-1 ml-32 text-zinc-400 whitespace-pre-wrap break-all text-[10px] leading-relaxed">
                {e.detail}
              </pre>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <p className="text-xs text-zinc-600">{filtered.length} entradas · Click en una línea para ver detalle</p>
    </div>
  );
}
