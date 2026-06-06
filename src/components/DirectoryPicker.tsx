import { useState, useEffect, useCallback } from 'react';

interface Entry { name: string; path: string }
interface BrowseResult { path: string; entries: Entry[] }

interface Props {
  value: string;
  onChange: (path: string) => void;
}

const ROOT = '/';

function parentOf(path: string): string {
  const parts = path.split('/').filter(Boolean);
  if (parts.length === 0) return ROOT;
  return '/' + parts.slice(0, -1).join('/') || ROOT;
}

export default function DirectoryPicker({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [currentPath, setCurrentPath] = useState(ROOT);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const browse = useCallback(async (path: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/browse?path=${encodeURIComponent(path)}`);
      const data: BrowseResult & { error?: string } = await res.json();
      if (!res.ok || data.error) throw new Error(data.error ?? 'Error');
      setCurrentPath(data.path);
      setEntries(data.entries);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) browse(currentPath);
  }, [open]);

  const select = () => {
    onChange(currentPath);
    setOpen(false);
  };

  const atRoot = currentPath === ROOT;

  return (
    <div className="relative">
      {/* Trigger */}
      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="/ruta/al/directorio"
          className="flex-1 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 focus:border-blue-500 rounded-lg px-3.5 py-2 text-sm font-mono focus:outline-none transition-colors placeholder-zinc-600"
        />
        <button
          type="button"
          onClick={() => { setCurrentPath(value && value !== '' ? value : ROOT); setOpen(true); }}
          title="Explorar directorios"
          className="bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-300 transition-colors shrink-0"
        >
          <FolderIcon />
        </button>
      </div>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/60" />
          <div
            className="relative bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-md shadow-2xl flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-800">
              <button
                onClick={() => browse(parentOf(currentPath))}
                disabled={atRoot || loading}
                className="text-zinc-400 hover:text-white disabled:opacity-30 transition-colors"
              >
                <ChevronLeft />
              </button>
              <p className="text-xs font-mono text-zinc-300 truncate flex-1">{currentPath}</p>
              <button onClick={() => setOpen(false)} className="text-zinc-500 hover:text-white transition-colors">
                <CloseIcon />
              </button>
            </div>

            {/* Entries */}
            <div className="overflow-y-auto max-h-72 py-1">
              {loading && (
                <div className="flex justify-center py-8">
                  <svg className="animate-spin h-5 w-5 text-zinc-500" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                </div>
              )}
              {!loading && error && (
                <p className="text-xs text-red-400 px-4 py-4">{error}</p>
              )}
              {!loading && !error && entries.length === 0 && (
                <p className="text-xs text-zinc-500 px-4 py-4">Sin subcarpetas.</p>
              )}
              {!loading && !error && entries.map((e) => (
                <button
                  key={e.path}
                  onClick={() => browse(e.path)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-zinc-800 transition-colors text-left group"
                >
                  <FolderIcon className="text-zinc-500 group-hover:text-blue-400 shrink-0 transition-colors" />
                  <span className="text-sm text-zinc-200 truncate">{e.name}</span>
                  <ChevronRight className="ml-auto text-zinc-600 shrink-0" />
                </button>
              ))}
            </div>

            {/* Footer */}
            <div className="border-t border-zinc-800 px-4 py-3 flex items-center justify-between gap-3">
              <p className="text-xs text-zinc-500 truncate">{currentPath}</p>
              <button
                onClick={select}
                className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-4 py-1.5 rounded-lg transition-colors shrink-0"
              >
                Seleccionar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FolderIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={`w-4 h-4 ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
    </svg>
  );
}

function ChevronLeft({ className = '' }: { className?: string }) {
  return (
    <svg className={`w-4 h-4 ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
    </svg>
  );
}

function ChevronRight({ className = '' }: { className?: string }) {
  return (
    <svg className={`w-4 h-4 ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}
