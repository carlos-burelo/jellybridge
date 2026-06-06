import { useState } from 'react';

type Provider = 'mediafire';

const PROVIDERS: { value: Provider; label: string; placeholder: string }[] = [
  {
    value: 'mediafire',
    label: 'MediaFire',
    placeholder: 'https://www.mediafire.com/file/...',
  },
];

interface Destination { id: string; name: string }
interface Props { destinations: Destination[] }

export default function DownloadForm({ destinations }: Props) {
  const [url, setUrl] = useState('');
  const [provider, setProvider] = useState<Provider>('mediafire');
  const [destId, setDestId] = useState(destinations[0]?.id ?? '');
  const [loading, setLoading] = useState(false);
  const [flash, setFlash] = useState<{ ok: boolean; text: string } | null>(null);

  const activeProvider = PROVIDERS.find((p) => p.value === provider)!;
  const noDestinations = destinations.length === 0;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || !destId) return;
    setLoading(true);
    setFlash(null);
    try {
      const res = await fetch('/api/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim(), destinationId: destId, provider }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setFlash({ ok: true, text: 'Descarga iniciada' });
      setUrl('');
    } catch (err: unknown) {
      setFlash({ ok: false, text: err instanceof Error ? err.message : String(err) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-5">
      {/* Provider + URL */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Fuente</label>
        <div className="flex gap-2">
          <select
            value={provider}
            onChange={(e) => setProvider(e.target.value as Provider)}
            className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 focus:border-blue-500 rounded-lg px-3 py-2.5 text-sm focus:outline-none transition-colors text-zinc-300 shrink-0"
          >
            {PROVIDERS.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder={activeProvider.placeholder}
            required
            className="flex-1 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 focus:border-blue-500 rounded-lg px-4 py-2.5 text-sm transition-colors focus:outline-none placeholder-zinc-600"
          />
        </div>
      </div>

      {/* Destination */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Destino</label>
        {noDestinations ? (
          <div className="flex items-center gap-2 bg-amber-950/30 border border-amber-900/50 rounded-lg px-4 py-3">
            <span className="text-amber-400 text-sm">Configura un destino en</span>
            <a href="/settings" className="text-amber-300 text-sm font-medium hover:text-amber-200 underline underline-offset-2">Ajustes</a>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {destinations.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => setDestId(d.id)}
                className={`text-left px-4 py-2.5 rounded-lg border text-sm transition-all ${
                  destId === d.id
                    ? 'bg-blue-600/20 border-blue-500/60 text-blue-300 font-medium'
                    : 'bg-zinc-900 border-zinc-800 hover:border-zinc-600 text-zinc-300'
                }`}
              >
                {d.name}
              </button>
            ))}
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={loading || noDestinations}
        className="bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-lg px-5 py-2.5 text-sm transition-colors"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <Spinner /> Iniciando…
          </span>
        ) : 'Iniciar descarga'}
      </button>

      {flash && (
        <div className={`text-sm px-4 py-2.5 rounded-lg border ${flash.ok ? 'bg-green-950/30 border-green-900/50 text-green-400' : 'bg-red-950/30 border-red-900/50 text-red-400'}`}>
          {flash.text}
        </div>
      )}
    </form>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}
