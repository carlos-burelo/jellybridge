import { useEffect, useState } from 'react';

type ContentType = 'archive' | 'video' | 'unknown';

interface Download {
  id: string;
  provider: string;
  url: string;
  filename: string;
  contentType: ContentType;
  destinationName: string;
  status: 'pending' | 'downloading' | 'extracting' | 'moving' | 'done' | 'error';
  progress: number;
  totalBytes: number;
  downloadedBytes: number;
  error?: string;
  createdAt: number;
}

const STATUS_META: Record<Download['status'], { label: string; dot: string; bar: string; text: string }> = {
  pending:     { label: 'Pendiente',   dot: 'bg-zinc-500',                    bar: 'bg-zinc-600',  text: 'text-zinc-400' },
  downloading: { label: 'Descargando', dot: 'bg-blue-400 animate-pulse',      bar: 'bg-blue-500',  text: 'text-blue-400' },
  extracting:  { label: 'Extrayendo',  dot: 'bg-amber-400 animate-pulse',     bar: 'bg-amber-500', text: 'text-amber-400' },
  moving:      { label: 'Moviendo',    dot: 'bg-purple-400 animate-pulse',    bar: 'bg-purple-500',text: 'text-purple-400' },
  done:        { label: 'Completado',  dot: 'bg-green-400',                   bar: 'bg-green-500', text: 'text-green-400' },
  error:       { label: 'Error',       dot: 'bg-red-500',                     bar: 'bg-red-500',   text: 'text-red-400' },
};

const CONTENT_BADGE: Record<ContentType, { label: string; cls: string }> = {
  archive: { label: 'Archivo',  cls: 'text-amber-400 bg-amber-950/40 border-amber-900/40' },
  video:   { label: 'Video',    cls: 'text-purple-400 bg-purple-950/40 border-purple-900/40' },
  unknown: { label: 'Archivo',  cls: 'text-zinc-400 bg-zinc-800/40 border-zinc-700/40' },
};

function formatBytes(bytes: number): string {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / 1024 ** i).toFixed(1)} ${units[i]}`;
}

function DownloadCard({ d }: { d: Download }) {
  const meta = STATUS_META[d.status];
  const isIndeterminate = d.status === 'extracting' || d.status === 'moving';
  const barWidth = isIndeterminate ? 100 : d.progress;
  const name = d.filename || new URL(d.url).hostname;
  const badge = d.contentType ? CONTENT_BADGE[d.contentType] : null;

  const statusNote =
    d.status === 'downloading' && d.totalBytes > 0
      ? `${formatBytes(d.downloadedBytes)} / ${formatBytes(d.totalBytes)}`
      : d.status === 'extracting' ? 'Descomprimiendo…'
      : d.status === 'moving' ? 'Moviendo a destino…'
      : d.status === 'done' ? 'Listo'
      : '';

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col gap-3 hover:border-zinc-700 transition-colors">
      <div className="flex items-start gap-3">
        <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${meta.dot}`} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-zinc-100 truncate">{name}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-zinc-500">{d.destinationName}</span>
            {badge && d.contentType !== 'unknown' && (
              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${badge.cls}`}>
                {badge.label}
              </span>
            )}
          </div>
        </div>
        <span className={`text-xs font-medium shrink-0 ${meta.text}`}>{meta.label}</span>
      </div>

      {d.status !== 'pending' && (
        <div className="space-y-1.5">
          <div className="w-full bg-zinc-800 rounded-full h-1">
            <div
              className={`h-1 rounded-full transition-all duration-500 ${meta.bar} ${isIndeterminate ? 'animate-pulse' : ''}`}
              style={{ width: `${barWidth}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-zinc-500">
            <span>{statusNote}</span>
            {d.status === 'downloading' && <span>{d.progress}%</span>}
          </div>
        </div>
      )}

      {d.error && (
        <p className="text-xs text-red-400 bg-red-950/30 border border-red-900/40 rounded-lg px-3 py-2">
          {d.error}
        </p>
      )}
    </div>
  );
}

export default function DownloadList({ initial }: { initial: Download[] }) {
  const [downloads, setDownloads] = useState<Map<string, Download>>(
    new Map(initial.map((d) => [d.id, d]))
  );
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    let es: EventSource;
    let retryTimeout: ReturnType<typeof setTimeout>;

    const connect = () => {
      es = new EventSource('/api/events');

      es.onopen = () => setConnected(true);

      es.onmessage = (e) => {
        const d: Download = JSON.parse(e.data);
        setDownloads((prev) => new Map(prev).set(d.id, d));
      };

      es.onerror = () => {
        setConnected(false);
        es.close();
        retryTimeout = setTimeout(connect, 3000);
      };
    };

    connect();

    return () => {
      clearTimeout(retryTimeout);
      es?.close();
    };
  }, []);

  const list = [...downloads.values()].sort((a, b) => b.createdAt - a.createdAt);

  return (
    <div className="flex flex-col gap-4">
      {/* Connection indicator */}
      <div className="flex items-center gap-2">
        <div className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-green-400' : 'bg-zinc-600'}`} />
        <span className="text-xs text-zinc-500">{connected ? 'En vivo' : 'Reconectando…'}</span>
      </div>

      {list.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-zinc-600 text-sm">Sin descargas aún.</p>
          <a href="/" className="text-blue-500 text-sm hover:text-blue-400 mt-1 inline-block">Iniciar una →</a>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {list.map((d) => <DownloadCard key={d.id} d={d} />)}
        </div>
      )}
    </div>
  );
}
