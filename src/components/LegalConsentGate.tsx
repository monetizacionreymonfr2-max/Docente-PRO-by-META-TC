import { useEffect, useState, type ReactNode } from 'react';
import { GraduationCap, ShieldCheck, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { DOCENTY_LEGAL_VERSION } from '../lib/legalVersions';

interface Props {
  userId: string;
  children: ReactNode;
}
type ConsentStatus = 'loading' | 'required' | 'accepted' | 'error';

export default function LegalConsentGate({ userId, children }: Props) {
  const [status, setStatus] = useState<ConsentStatus>('loading');
  const [checked, setChecked] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const checkConsent = async () => {
    setStatus('loading');
    setErrorMessage('');
    const { data, error } = await supabase
      .from('docenty_legal_acceptances')
      .select('id')
      .eq('user_id', userId)
      .eq('version', DOCENTY_LEGAL_VERSION)
      .limit(1);

    if (error) {
      setStatus('error');
      setErrorMessage('No pudimos verificar tu aceptación. Reintenta en unos momentos.');
      return;
    }
    setStatus(Array.isArray(data) && data.length ? 'accepted' : 'required');
  };

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const { data, error } = await supabase
        .from('docenty_legal_acceptances')
        .select('id')
        .eq('user_id', userId)
        .eq('version', DOCENTY_LEGAL_VERSION)
        .limit(1);
      if (cancelled) return;
      if (error) {
        setStatus('error');
        setErrorMessage('No pudimos verificar las condiciones de uso. Intenta de nuevo.');
      } else {
        setStatus(Array.isArray(data) && data.length ? 'accepted' : 'required');
      }
    };
    setStatus('loading');
    void load();
    return () => { cancelled = true; };
  }, [userId]);

  const acceptTerms = async () => {
    if (!checked || saving) return;
    setSaving(true);
    setErrorMessage('');
    const { error } = await supabase.rpc('accept_docenty_legal', { p_version: DOCENTY_LEGAL_VERSION });
    setSaving(false);
    if (error) {
      setErrorMessage('No se pudo registrar tu aceptación. Intenta nuevamente.');
      return;
    }
    setStatus('accepted');
  };

  if (status === 'accepted') return <>{children}</>;
  if (status === 'loading') {
    return (
      <div className="min-h-screen hex-bg flex flex-col items-center justify-center gap-3 text-cyan-300">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="text-sm">Verificando condiciones de uso...</span>
      </div>
    );
  }

  return (
    <main className="min-h-screen hex-bg text-white flex justify-center items-center p-4">
      <section className="max-w-lg w-full rounded-3xl border border-cyan-500/25 bg-[#201a32] shadow-2xl p-6 sm:p-9 space-y-5">
        <div className="flex gap-3 items-center"><GraduationCap className="text-cyan-400" size={27} />
          <span className="text-lg font-black">DOCENTY PRO</span>
        </div>
        <div className="flex gap-2 items-center text-cyan-300 text-xs font-bold uppercase tracking-widest">
          <ShieldCheck size={16} /> Condiciones del servicio
        </div>
        <h1 className="text-2xl font-black">Privacidad y condiciones actualizadas</h1>
        <p className="text-sm text-slate-300 leading-6">
          Antes de continuar, revisa nuestros términos y la política de privacidad. Identifican a Reymon Castillo como responsable,
          el correo monetizacionreymonfr2@gmail.com, el plazo general máximo de conservación de diez años y las reglas de
          pagos, renovaciones, reclamaciones y devoluciones.
        </p>
        <div className="flex flex-col gap-2 rounded-xl bg-white/5 border border-white/10 p-4">
          <a href="/legal/terminos" className="text-cyan-300 underline text-sm font-semibold">Leer términos, pagos y devoluciones</a>
          <a href="/legal/privacidad" className="text-cyan-300 underline text-sm font-semibold">Leer política de privacidad</a>
          <p className="text-slate-400 text-xs">Versión {DOCENTY_LEGAL_VERSION}</p>
        </div>
        {status === 'required' && (
          <>
            <label className="flex items-start gap-3 cursor-pointer text-sm leading-6">
              <input type="checkbox" checked={checked} onChange={e => setChecked(e.target.checked)}
                className="mt-1 h-4 w-4 accent-cyan-500 shrink-0" />
              <span>He leído y acepto los Términos y Condiciones y confirmo haber leído la Política de Privacidad.</span>
            </label>
            <button type="button" onClick={acceptTerms} disabled={!checked || saving}
              className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 py-3 rounded-xl font-bold text-sm">
              {saving ? 'Registrando aceptación...' : 'Aceptar y continuar'}
            </button>
          </>
        )}
        {errorMessage && <p role="alert" className="text-red-300 text-sm">{errorMessage}</p>}
        {status === 'error' && (
          <button type="button" onClick={checkConsent} className="w-full bg-cyan-700 px-4 py-3 rounded-xl font-bold text-sm">
            Reintentar verificación
          </button>
        )}
        <button type="button" onClick={() => supabase.auth.signOut()}
          className="w-full border border-white/15 text-slate-300 py-3 rounded-xl text-sm font-semibold hover:bg-white/5">
          No aceptar y cerrar sesión
        </button>
      </section>
    </main>
  );
}
