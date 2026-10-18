import { useNavigate } from 'react-router-dom';
import { FileUp, Sparkles } from 'lucide-react';
import { FEATURE_FLAGS } from '../../config/features';

interface FormatoBadgeButtonProps {
  tipo?: 'PPA' | 'planificacion_diaria' | 'planificacion_semanal' | 'planificacion_mensual';
  className?: string;
}

/**
 * Botón aditivo no intrusivo para acceder a "Mi Formato" desde cualquier pantalla de Docenty PRO.
 */
export default function FormatoBadgeButton({ tipo = 'PPA', className = '' }: FormatoBadgeButtonProps) {
  const navigate = useNavigate();

  // Si la feature flag está desactivada, no se renderiza nada
  if (!FEATURE_FLAGS.MI_FORMATO_ENABLED) return null;

  return (
    <button
      type="button"
      onClick={() => navigate('/mi-formato', { state: { preselectedTipo: tipo } })}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500/20 to-blue-600/20 hover:from-cyan-500/30 hover:to-blue-600/30 border border-cyan-400/40 text-cyan-200 text-xs font-bold tracking-wide transition-all shadow-sm hover:shadow-cyan-500/20 hover:scale-[1.02] active:scale-95 group ${className}`}
      title="Subir o vaciar tu planificación en el formato exacto de tu escuela"
    >
      <FileUp size={14} className="text-cyan-400 group-hover:rotate-6 transition-transform" />
      <span>Mi Formato Escolar</span>
      <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-cyan-400/20 text-cyan-300 text-[10px] uppercase font-black">
        <Sparkles size={9} /> PRO
      </span>
    </button>
  );
}
