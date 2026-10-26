import { useEffect, useRef, useState } from 'react';
import { askCamilaClaude, type CamilaTurn } from '../../lib/camila/claudeClient';

const GREETING = 'Hola, soy Camila, la asistente virtual de DOCENTY PRO. ¿En qué puedo ayudarle?';

/** Chat experimental aislado. NO edita ni guarda documentos o memoria. */
export default function CamilaClaudeChat() {
  const [turns, setTurns] = useState<CamilaTurn[]>([]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const bottom = useRef<HTMLDivElement>(null);
  useEffect(() => { bottom.current?.scrollIntoView({ behavior: 'smooth' }); }, [turns]);

  async function send() {
    const content = draft.trim();
    if (!content || busy || content.length > 12000) return;
    const next: CamilaTurn[] = [...turns, { role: 'user', content }];
    setTurns(next);
    setDraft('');
    setError('');
    setBusy(true);
    try {
      const answer = await askCamilaClaude(next);
      setTurns([...next, { role: 'assistant', content: answer }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo conectar con Camila.');
    } finally { setBusy(false); }
  }

  return (
    <section className="flex flex-col min-h-[420px] h-full rounded-2xl border border-white/10 bg-slate-900/70 text-slate-100" aria-label="Conversación con Camila mediante Claude">
      <header className="p-4 border-b border-white/10">
        <h2 className="font-bold">Camila · Conversación con Claude</h2>
        <p className="text-xs text-slate-400">Versión de prueba: conversación únicamente. No modifica ni guarda documentos.</p>
      </header>
      <div className="flex-1 overflow-y-auto p-4 space-y-3" role="log" aria-live="polite">
        <p className="rounded-xl bg-white/10 p-3 text-sm">{GREETING}</p>
        {turns.map((turn, i) => (
          <div key={i} className={`flex ${turn.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <p className={`max-w-[90%] whitespace-pre-wrap rounded-xl p-3 text-sm ${turn.role === 'user' ? 'bg-cyan-800' : 'bg-white/10'}`}>{turn.content}</p>
          </div>
        ))}
        {busy && <p className="text-xs text-slate-400">Camila está preparando su respuesta…</p>}
        <div ref={bottom} />
      </div>
      {error && <p role="alert" className="px-4 py-2 text-sm text-amber-300">{error} Puede reintentar su mensaje.</p>}
      <div className="p-3 border-t border-white/10 flex gap-2">
        <textarea aria-label="Mensaje para Camila" value={draft} onChange={e => setDraft(e.target.value)} maxLength={12000} rows={2} placeholder="Escriba aquí su consulta educativa…" className="flex-1 min-w-0 rounded-xl bg-white/10 p-3 text-sm resize-none" disabled={busy} />
        <button type="button" onClick={send} disabled={busy || !draft.trim()} className="rounded-xl bg-cyan-600 px-4 py-2 text-sm font-bold disabled:opacity-50">Enviar</button>
      </div>
    </section>
  );
}
