import { useState, useEffect } from 'react';
import { 
  Clock, 
  Calendar, 
  Plus, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Loader2,
  Infinity as InfinityIcon,
  CalendarDays
} from 'lucide-react';
import { SupabaseService } from '../lib/supabaseService';

export interface TargetSubscription {
  id: string; // UID or code ID
  email?: string;
  codeId?: string;
  currentExpiresAt?: any;
}

interface TimeAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  target: TargetSubscription | null;
  onSuccess: () => void;
}

export default function TimeAdjustmentModal({
  isOpen,
  onClose,
  target,
  onSuccess
}: TimeAdjustmentModalProps) {
  const [activeMode, setActiveMode] = useState<'add' | 'setExact' | 'date' | 'infinite'>('add');
  const [amountValue, setAmountValue] = useState<number>(30);
  const [amountUnit, setAmountUnit] = useState<'days' | 'months'>('days');
  const [exactDaysValue, setExactDaysValue] = useState<number>(30);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Parse current expiration
  const currentExpDate = (() => {
    if (!target?.currentExpiresAt) return null;
    const d = new Date(target.currentExpiresAt);
    return isNaN(d.getTime()) ? null : d;
  })();

  const now = new Date();
  const isCurrentlyExpired = !currentExpDate || currentExpDate.getTime() <= now.getTime();
  const currentDaysLeft = currentExpDate 
    ? Math.ceil((currentExpDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    : 0;
  const isLifetime = currentDaysLeft > 10000;

  // Reset form when target changes
  useEffect(() => {
    if (isOpen) {
      setActiveMode('add');
      setAmountValue(30);
      setAmountUnit('days');
      setExactDaysValue(30);
      setError(null);
      
      // Default date to 30 days from now
      const defaultDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      const yyyy = defaultDate.getFullYear();
      const mm = String(defaultDate.getMonth() + 1).padStart(2, '0');
      const dd = String(defaultDate.getDate()).padStart(2, '0');
      setSelectedDate(`${yyyy}-${mm}-${dd}`);
    }
  }, [isOpen, target]);

  if (!isOpen || !target) return null;

  // Compute live preview
  const computePreview = () => {
    let finalExpiration: Date;
    let daysResult = 0;
    let note = '';

    if (activeMode === 'infinite') {
      finalExpiration = new Date();
      finalExpiration.setFullYear(finalExpiration.getFullYear() + 100);
      return {
        daysResult: 99999,
        isInfinite: true,
        formattedDate: 'Sin Vencimiento (Acceso Permanente)',
        note: 'El usuario tendrá acceso vitalicio ininterrumpido.'
      };
    }

    if (activeMode === 'add') {
      const addedDays = amountUnit === 'months' ? amountValue * 30 : amountValue;
      if (addedDays <= 0) {
        return null;
      }

      // Si el usuario ya está vencido, se cuenta a partir de HOY
      if (isCurrentlyExpired) {
        finalExpiration = new Date(now.getTime() + addedDays * 24 * 60 * 60 * 1000);
        note = `Como la cuenta estaba vencida, el plazo inicia hoy para otorgarle exactamente ${addedDays} días.`;
      } else {
        // Si aún tiene días activos, se suman a su fecha actual
        finalExpiration = new Date(currentExpDate.getTime() + addedDays * 24 * 60 * 60 * 1000);
        note = `Se sumaron ${addedDays} días a sus ${currentDaysLeft} días activos restantes.`;
      }
    } else if (activeMode === 'setExact') {
      if (exactDaysValue <= 0) return null;
      finalExpiration = new Date(now.getTime() + exactDaysValue * 24 * 60 * 60 * 1000);
      note = `El contador del usuario marcará exactamente ${exactDaysValue} días a partir de este instante.`;
    } else {
      // date
      if (!selectedDate) return null;
      finalExpiration = new Date(`${selectedDate}T23:59:59`);
      if (isNaN(finalExpiration.getTime())) return null;
      const diffTime = finalExpiration.getTime() - now.getTime();
      const d = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      note = `Vencerá el día ${finalExpiration.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}.`;
    }

    const diff = finalExpiration.getTime() - now.getTime();
    daysResult = Math.ceil(diff / (1000 * 60 * 60 * 24));

    return {
      daysResult: daysResult > 0 ? daysResult : 0,
      isInfinite: false,
      formattedDate: finalExpiration.toLocaleDateString('es-ES', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      }),
      note
    };
  };

  const preview = computePreview();

  const handleSave = async () => {
    if (!preview) {
      setError('Por favor configure un valor válido.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (activeMode === 'infinite') {
        await SupabaseService.grantLifetimeAccess(target.id, target.codeId, target.email);
      } else if (activeMode === 'add') {
        const addedDays = amountUnit === 'months' ? amountValue * 30 : amountValue;
        await SupabaseService.updateProfileSubscription(
          target.id,
          addedDays,
          target.currentExpiresAt,
          target.codeId,
          target.email
        );
      } else if (activeMode === 'setExact') {
        await SupabaseService.setExactSubscription({
          uid: target.id,
          email: target.email,
          codeId: target.codeId,
          exactDaysFromNow: exactDaysValue
        });
      } else if (activeMode === 'date') {
        const endDay = new Date(`${selectedDate}T23:59:59`);
        await SupabaseService.setExactSubscription({
          uid: target.id,
          email: target.email,
          codeId: target.codeId,
          exactDateISO: endDay.toISOString()
        });
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error saving subscription:', err);
      setError(err?.message || 'Ocurrió un error al actualizar la suscripción.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 p-5 text-white flex items-center justify-between relative">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300 shrink-0">
              <Clock size={22} />
            </div>
            <div>
              <h3 className="text-base font-black tracking-tight text-white flex items-center gap-2">
                Ajustar Tiempo de Suscripción
              </h3>
              <p className="text-xs text-blue-200/80 truncate max-w-[280px] sm:max-w-xs font-mono font-medium">
                {target.email || target.codeId || target.id}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Current status banner */}
        <div className="px-5 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-xs">
          <span className="text-slate-500 font-medium">Estado actual del usuario:</span>
          <div className="flex items-center gap-2">
            {isLifetime ? (
              <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-700 font-bold text-[11px] uppercase tracking-wider">
                Vitalicio
              </span>
            ) : isCurrentlyExpired ? (
              <span className="px-2.5 py-0.5 rounded-full bg-red-100 text-red-700 font-bold text-[11px] uppercase tracking-wider">
                Vencido
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold text-[11px] tracking-wide">
                Quedan {currentDaysLeft} días
              </span>
            )}
            {currentExpDate && !isLifetime && (
              <span className="text-[11px] text-slate-400 hidden sm:inline">
                ({currentExpDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })})
              </span>
            )}
          </div>
        </div>

        {/* Mode Selector Tabs */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          <div className="grid grid-cols-4 gap-1.5 p-1 bg-slate-100 rounded-2xl">
            <button
              type="button"
              onClick={() => setActiveMode('add')}
              className={`py-2 px-1 text-[11px] sm:text-xs font-bold rounded-xl transition-all ${
                activeMode === 'add'
                  ? 'bg-white text-blue-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              + Sumar
            </button>
            <button
              type="button"
              onClick={() => setActiveMode('setExact')}
              className={`py-2 px-1 text-[11px] sm:text-xs font-bold rounded-xl transition-all ${
                activeMode === 'setExact'
                  ? 'bg-white text-blue-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Fijar Días
            </button>
            <button
              type="button"
              onClick={() => setActiveMode('date')}
              className={`py-2 px-1 text-[11px] sm:text-xs font-bold rounded-xl transition-all ${
                activeMode === 'date'
                  ? 'bg-white text-blue-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Fecha
            </button>
            <button
              type="button"
              onClick={() => setActiveMode('infinite')}
              className={`py-2 px-1 text-[11px] sm:text-xs font-bold rounded-xl transition-all ${
                activeMode === 'infinite'
                  ? 'bg-white text-purple-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Vitalicio
            </button>
          </div>

          {/* Mode 1: SUMAR TIEMPO */}
          {activeMode === 'add' && (
            <div className="space-y-4 animate-fadeIn">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Plazos rápidos más vendidos:
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {[
                    { label: '+7 Días', days: 7, unit: 'days' as const },
                    { label: '+15 Días', days: 15, unit: 'days' as const },
                    { label: '+1 Mes (30d)', days: 1, unit: 'months' as const },
                    { label: '+2 Meses (60d)', days: 2, unit: 'months' as const },
                    { label: '+3 Meses (90d)', days: 3, unit: 'months' as const },
                    { label: '+6 Meses', days: 6, unit: 'months' as const },
                    { label: '+1 Año (365d)', days: 365, unit: 'days' as const },
                  ].map((p, idx) => {
                    const isSelected = amountValue === p.days && amountUnit === p.unit;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setAmountValue(p.days);
                          setAmountUnit(p.unit);
                        }}
                        className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all text-center ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-500/20'
                            : 'bg-white border-slate-200 text-slate-700 hover:border-blue-300 hover:bg-blue-50/50'
                        }`}
                      >
                        {p.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Cantidad personalizada */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  O escribe la cantidad exacta a sumar:
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    value={amountValue || ''}
                    onChange={(e) => setAmountValue(Math.max(1, parseInt(e.target.value) || 0))}
                    className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-800 focus:outline-none focus:border-blue-500"
                    placeholder="Ej: 45"
                  />
                  <select
                    value={amountUnit}
                    onChange={(e) => setAmountUnit(e.target.value as any)}
                    className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-500"
                  >
                    <option value="days">Días</option>
                    <option value="months">Meses (x30 días)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Mode 2: FIJAR DÍAS EXACTOS DESDE HOY */}
          {activeMode === 'setExact' && (
            <div className="space-y-4 animate-fadeIn">
              <p className="text-xs text-slate-500 leading-relaxed">
                Establece directamente cuántos días restantes debe mostrar el contador a partir de hoy, sin importar la fecha que tenía antes.
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Seleccionar días exactos:
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[15, 30, 60, 90, 180, 365].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setExactDaysValue(d)}
                      className={`py-2 px-1 rounded-xl text-xs font-bold border transition-all ${
                        exactDaysValue === d
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-blue-300'
                      }`}
                    >
                      {d} Días
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  O escribe el número exacto de días:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    value={exactDaysValue || ''}
                    onChange={(e) => setExactDaysValue(Math.max(1, parseInt(e.target.value) || 0))}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-800 focus:outline-none focus:border-blue-500"
                    placeholder="Ej: 30"
                  />
                  <span className="text-xs font-bold text-slate-500 whitespace-nowrap">días restantes</span>
                </div>
              </div>
            </div>
          )}

          {/* Mode 3: FECHA EXACTA */}
          {activeMode === 'date' && (
            <div className="space-y-4 animate-fadeIn">
              <p className="text-xs text-slate-500">
                Selecciona la fecha calendario exacta en la que deseas que venza la suscripción.
              </p>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <label className="block text-xs font-bold text-slate-700">
                  Fecha de vencimiento:
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          )}

          {/* Mode 4: VITALICIO */}
          {activeMode === 'infinite' && (
            <div className="p-5 bg-purple-50 rounded-2xl border border-purple-200 text-center space-y-3 animate-fadeIn">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center mx-auto">
                <InfinityIcon size={24} />
              </div>
              <h4 className="text-sm font-black text-purple-900">Acceso Vitalicio / Permanente</h4>
              <p className="text-xs text-purple-700/80 leading-relaxed max-w-sm mx-auto">
                El usuario nunca perderá el acceso y su contador marcará siempre estatus permanente ilimitado.
              </p>
            </div>
          )}

          {/* LIVE PREVIEW BOX */}
          {preview && (
            <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50/60 rounded-2xl border border-blue-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-blue-900 flex items-center gap-1.5">
                  <Sparkles size={14} className="text-blue-600" />
                  Resultado en el contador:
                </span>
                <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-blue-600 text-white shadow-sm">
                  {preview.isInfinite ? 'VITALICIO' : `QUEDAN ${preview.daysResult} DÍAS`}
                </span>
              </div>
              <div className="text-xs text-blue-950 font-medium space-y-1 pt-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Fecha de vencimiento:</span>
                  <span className="font-bold text-slate-800">{preview.formattedDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Días que verá el usuario:</span>
                  <span className="font-extrabold text-blue-700">
                    {preview.isInfinite ? 'Acceso Permanente' : `${preview.daysResult} días exactos`}
                  </span>
                </div>
              </div>
              {preview.note && (
                <p className="text-[11px] text-blue-800/80 pt-1 border-t border-blue-200/50 leading-relaxed">
                  💡 {preview.note}
                </p>
              )}
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200/70 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSubmitting || !preview}
            className="px-5 py-2.5 rounded-xl text-xs font-black text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20 disabled:opacity-50 flex items-center gap-2 transition-all"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Actualizando...</span>
              </>
            ) : (
              <>
                <CheckCircle2 size={14} />
                <span>Aplicar y Actualizar Contador</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
