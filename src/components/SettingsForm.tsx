import { useState } from 'react';

interface Destination { id: string; name: string; path: string }
interface Settings { passwords: string[]; destinations: Destination[]; tempDir: string }

export default function SettingsForm({ initial }: { initial: Settings }) {
  const [settings, setSettings] = useState<Settings>(initial);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');

  const [newPwd, setNewPwd] = useState('');
  const [newDestName, setNewDestName] = useState('');
  const [newDestPath, setNewDestPath] = useState('');

  const save = async () => {
    setSaveState('saving');
    await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    setSaveState('saved');
    setTimeout(() => setSaveState('idle'), 2000);
  };

  const addPassword = () => {
    const v = newPwd.trim();
    if (!v) return;
    setSettings((s) => ({ ...s, passwords: [...s.passwords, v] }));
    setNewPwd('');
  };

  const addDestination = () => {
    if (!newDestName.trim() || !newDestPath.trim()) return;
    setSettings((s) => ({
      ...s,
      destinations: [...s.destinations, { id: crypto.randomUUID(), name: newDestName.trim(), path: newDestPath.trim() }],
    }));
    setNewDestName('');
    setNewDestPath('');
  };

  return (
    <div className="flex flex-col gap-10">

      {/* Passwords */}
      <section className="flex flex-col gap-4">
        <div>
          <h2 className="text-sm font-semibold text-zinc-200">Contraseñas</h2>
          <p className="text-xs text-zinc-500 mt-0.5">Se prueban en orden hasta que una funcione.</p>
        </div>

        {settings.passwords.length > 0 && (
          <ul className="flex flex-col gap-1.5">
            {settings.passwords.map((p, i) => (
              <li key={i} className="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-lg px-3.5 py-2.5 group">
                <span className="text-sm font-mono text-zinc-300">{p}</span>
                <button
                  onClick={() => setSettings((s) => ({ ...s, passwords: s.passwords.filter((_, j) => j !== i) }))}
                  className="text-zinc-600 hover:text-red-400 text-xs transition-colors opacity-0 group-hover:opacity-100"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="flex gap-2">
          <input
            type="text"
            value={newPwd}
            onChange={(e) => setNewPwd(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addPassword()}
            placeholder="Nueva contraseña…"
            className="flex-1 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 focus:border-blue-500 rounded-lg px-3.5 py-2 text-sm focus:outline-none transition-colors placeholder-zinc-600"
          />
          <button onClick={addPassword} className="bg-zinc-800 hover:bg-zinc-700 text-sm px-4 py-2 rounded-lg transition-colors text-zinc-300">
            Agregar
          </button>
        </div>
      </section>

      {/* Destinations */}
      <section className="flex flex-col gap-4">
        <div>
          <h2 className="text-sm font-semibold text-zinc-200">Carpetas destino</h2>
          <p className="text-xs text-zinc-500 mt-0.5">Si tus medios están en unidad externa usa <code className="text-zinc-400">/mnt/tu-disco/Películas</code></p>
        </div>

        {settings.destinations.length > 0 && (
          <ul className="flex flex-col gap-1.5">
            {settings.destinations.map((d) => (
              <li key={d.id} className="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-lg px-3.5 py-2.5 gap-3 group">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-zinc-200">{d.name}</p>
                  <p className="text-xs text-zinc-500 font-mono truncate">{d.path}</p>
                </div>
                <button
                  onClick={() => setSettings((s) => ({ ...s, destinations: s.destinations.filter((x) => x.id !== d.id) }))}
                  className="text-zinc-600 hover:text-red-400 text-xs transition-colors shrink-0 opacity-0 group-hover:opacity-100"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="flex flex-col gap-2">
          <input
            type="text"
            value={newDestName}
            onChange={(e) => setNewDestName(e.target.value)}
            placeholder="Nombre (ej: Películas)"
            className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 focus:border-blue-500 rounded-lg px-3.5 py-2 text-sm focus:outline-none transition-colors placeholder-zinc-600"
          />
          <input
            type="text"
            value={newDestPath}
            onChange={(e) => setNewDestPath(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addDestination()}
            placeholder="/DATA/Media/Películas"
            className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 focus:border-blue-500 rounded-lg px-3.5 py-2 text-sm font-mono focus:outline-none transition-colors placeholder-zinc-600"
          />
          <button onClick={addDestination} className="bg-zinc-800 hover:bg-zinc-700 text-sm px-4 py-2 rounded-lg transition-colors text-zinc-300 self-start">
            Agregar destino
          </button>
        </div>
      </section>

      {/* Temp dir */}
      <section className="flex flex-col gap-3">
        <div>
          <h2 className="text-sm font-semibold text-zinc-200">Directorio temporal</h2>
          <p className="text-xs text-zinc-500 mt-0.5">Donde se guardan archivos antes de extraer. Debe existir dentro del contenedor.</p>
        </div>
        <input
          type="text"
          value={settings.tempDir}
          onChange={(e) => setSettings((s) => ({ ...s, tempDir: e.target.value }))}
          className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 focus:border-blue-500 rounded-lg px-3.5 py-2 text-sm font-mono focus:outline-none transition-colors"
        />
      </section>

      {/* Save */}
      <button
        onClick={save}
        disabled={saveState === 'saving'}
        className={`self-start font-semibold rounded-lg px-5 py-2.5 text-sm transition-all ${
          saveState === 'saved'
            ? 'bg-green-600/20 border border-green-700/50 text-green-400'
            : 'bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50'
        }`}
      >
        {saveState === 'saving' ? 'Guardando…' : saveState === 'saved' ? '✓ Guardado' : 'Guardar'}
      </button>
    </div>
  );
}
