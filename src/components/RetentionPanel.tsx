import { useEffect, useState } from 'react';
import { SupabaseService } from '../lib/supabaseService';
import { isExpiredPro, isReactivationCampaignOpen, REACTIVATION_DAYS, REACTIVATION_PRICE_USD, REACTIVATION_MESSAGE } from '../lib/reactivation';

interface RetentionUser {
  id: string;
  email: string;
  role: string;
  planType?: string;
  access_level?: string;
  expiresAt?: string;
}

export default function RetentionPanel({ users, loading, loaded }: { users: RetentionUser[]; loading: boolean; loaded: boolean }) {
  const [blocked, setBlocked] = useState<Set<string> | null>(null);
  const [filter, setFilter] = useState('');
  const [status, setStatus] = useState('');
  const [blacklistError, setBlacklistError] = useState(false);
  useEffect(() => {
    let cancelled = false;
    setBlocked(null);
    setBlacklistError(false);
    SupabaseService.getBlacklist().then(items => {
      if (!cancelled) setBlocked(new Set(items.map(item => String(item.email || '').trim().toLowerCase())));
    }).catch(() => { if (!cancelled) setBlacklistError(true); });
    return () => { cancelled = true; };
  }, [users]);

  const now = Date.now();
  const open = isReactivationCampaignOpen(now);
  const candidates = blocked === null ? [] : users.filter(u => isExpiredPro(u, now) && u.email && !blocked.has(u.email.trim().toLowerCase())).sort((a,b) => Date.parse(b.expiresAt!) - Date.parse(a.expiresAt!));
  const recent = candidates.filter(u => now - Date.parse(u.expiresAt!) <= 7 * 86400000).length;
  const visible = candidates.filter(u => u.email.toLowerCase().includes(filter.trim().toLowerCase()));
  const ready = loaded && !loading && blocked !== null;
  async function copyMessage() {
    try {
      await navigator.clipboard.writeText(REACTIVATION_MESSAGE);
      setStatus('Mensaje copiado.');
    } catch { setStatus('No se pudo copiar. Puedes seleccionar el texto manualmente.'); }
  }

  return <section className="bg-white rounded-3xl border border-blue-100 shadow-sm p-5 sm:p-8 space-y-5">
    <div>
      <h2 className="text-lg font-black text-gray-900">Centro de retención docente</h2>
      <p className="text-sm text-slate-600 mt-1">Campaña de reactivación hasta el 31/12/2026: ${REACTIVATION_PRICE_USD} por {REACTIVATION_DAYS} días (30 + 7). {open ? 'Periodo de campaña vigente.' : 'Periodo de campaña cerrado.'}</p>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <div className="bg-blue-50 rounded-xl p-4"><p className="text-xs font-bold text-slate-600">Pro vencidos elegibles</p><p className="text-2xl font-black text-blue-800">{ready ? candidates.length : '—'}</p></div>
      <div className="bg-slate-50 rounded-xl p-4"><p className="text-xs font-bold text-slate-600">Vencidos hace 7 días o menos</p><p className="text-2xl font-black text-slate-800">{ready ? recent : '—'}</p></div>
      <div className="bg-emerald-50 rounded-xl p-4"><p className="text-xs font-bold text-slate-600">Meta de recuperación</p><p className="text-2xl font-black text-emerald-800">20 docentes</p></div>
    </div>
    <p className="text-xs text-slate-600">Confirma autorización de contacto y elegibilidad antes de enviar. Tras verificar el pago, utiliza el ajuste de suscripción existente para asignar exactamente 37 días desde hoy y verifica la fecha guardada. No se envían mensajes ni se activan cuentas automáticamente.</p>
    <details className="rounded-xl border border-slate-200 p-3">
      <summary className="cursor-pointer font-bold text-sm text-slate-800">Mensaje de campaña</summary>
      <p className="text-sm text-slate-700 mt-3">{REACTIVATION_MESSAGE}</p>
      <button type="button" disabled={!open} onClick={copyMessage} className="mt-3 rounded-lg bg-blue-600 text-white font-bold px-3 py-2 text-xs disabled:opacity-50">Copiar mensaje</button>
      <p role="status" className="text-xs text-slate-600 mt-2">{status}</p>
    </details>
    {blacklistError ? <p role="alert" className="text-sm text-red-700">No se pudo verificar la lista de bloqueos. Contactos deshabilitados. Sincroniza el panel.</p> : !ready ? <p className="text-sm text-slate-600">Verificando docentes y bloqueos…</p> : <>
      <label className="block text-sm font-bold text-slate-700">Buscar docente<input type="search" value={filter} onChange={e=>setFilter(e.target.value)} className="block w-full border border-slate-200 rounded-xl p-3 mt-1 text-sm text-gray-900" placeholder="Correo electrónico"/></label>
      <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
        {visible.length === 0 && <p className="text-sm text-slate-600 py-3">No hay candidatos para mostrar.</p>}
        {visible.map(u => <div key={u.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
          <div className="min-w-0"><p className="text-sm font-bold text-gray-900 break-all">{u.email}</p><p className="text-xs text-slate-600">Venció hace {Math.floor((now-Date.parse(u.expiresAt!))/86400000)} días</p></div>
          {open && <a className="text-xs font-bold text-blue-700 underline" href={'mailto:'+encodeURIComponent(u.email)+'?subject='+encodeURIComponent('Regresa a DOCENTY PRO')+'&body='+encodeURIComponent(REACTIVATION_MESSAGE)}>Preparar correo</a>}
        </div>)}
      </div>
    </>}
  </section>;
}
