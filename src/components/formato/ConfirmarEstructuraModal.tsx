import { useState } from 'react';
import {
  X,
  CheckCircle,
  Building,
  Columns,
  Table as TableIcon,
  Palette,
  Sparkles,
  Edit2,
  Save,
  Check,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { FormatoDocente, FormatoEstructura, TipoDocumentoFormato } from '../../types/formato';

interface ConfirmarEstructuraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (formatoFinal: FormatoDocente) => Promise<void> | void;
  initialData: {
    nombre: string;
    tipo: TipoDocumentoFormato;
    file: File;
    estructura: FormatoEstructura;
  };
  teacherId: string;
}

export default function ConfirmarEstructuraModal({
  isOpen,
  onClose,
  onConfirm,
  initialData,
  teacherId,
}: ConfirmarEstructuraModalProps) {
  const [nombre, setNombre] = useState(initialData.nombre);
  const [estructura, setEstructura] = useState<FormatoEstructura>(initialData.estructura);
  const [isEditingHeaders, setIsEditingHeaders] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError(null);

    const nuevoFormato: FormatoDocente = {
      id: '', // Supabase generará el UUID o se asignará en el servicio
      teacherId,
      nombre: nombre.trim() || 'Mi Formato Escolar',
      tipoDocumento: initialData.tipo,
      archivoOriginalNombre: initialData.file.name,
      archivoMimeType: initialData.file.type,
      tamanoBytes: initialData.file.size,
      estructura,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await onConfirm(nuevoFormato);
    } catch (err: any) {
      console.error('Error al guardar formato:', err);
      setSaveError(
        err?.message || 'No se pudo guardar el formato en la base de datos. Tu análisis no se ha perdido.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="glass-effect w-full max-w-2xl rounded-3xl border border-cyan-500/30 shadow-2xl p-6 sm:p-8 text-white relative max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-400/30">
              <Sparkles size={22} />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">Lo que Camila entendió de tu formato</h2>
              <p className="text-xs text-slate-300">Revisa la estructura antes de guardarla en Supabase (solo se analiza una vez)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSaving}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Mensaje de error si falla guardar */}
        {saveError && (
          <div className="mt-4 p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2.5">
            <AlertCircle size={16} className="shrink-0" />
            <span>{saveError}</span>
          </div>
        )}

        {/* Resumen Pedagógico */}
        {estructura.resumenPedagogico && (
          <div className="mt-5 p-4 rounded-2xl bg-cyan-500/10 border border-cyan-400/20 text-cyan-200 text-xs leading-relaxed">
            <p className="font-bold text-cyan-300 flex items-center gap-1.5 mb-1">
              <Sparkles size={14} /> Resumen de Camila:
            </p>
            {estructura.resumenPedagogico}
          </div>
        )}

        <div className="mt-5 space-y-5">
          {/* Nombre y Membrete */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
                <Building size={14} /> Encabezado y Datos Institucionales
              </span>
              <button
                type="button"
                onClick={() => setIsEditingHeaders(!isEditingHeaders)}
                disabled={isSaving}
                className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
              >
                {isEditingHeaders ? (
                  <>
                    <Save size={12} /> Listo
                  </>
                ) : (
                  <>
                    <Edit2 size={12} /> Editar membrete
                  </>
                )}
              </button>
            </div>

            {isEditingHeaders ? (
              <div className="space-y-2 text-xs">
                <div>
                  <label className="text-slate-400 block mb-1">Nombre del Formato:</label>
                  <input
                    type="text"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-black/40 border border-white/10 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Institución / Escuela:</label>
                  <input
                    type="text"
                    value={estructura.encabezado?.institucion || ''}
                    onChange={(e) =>
                      setEstructura({
                        ...estructura,
                        encabezado: { ...estructura.encabezado, institucion: e.target.value },
                      })
                    }
                    className="w-full px-3 py-1.5 rounded-lg bg-black/40 border border-white/10 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Título del Documento:</label>
                  <input
                    type="text"
                    value={estructura.encabezado?.tituloDocumento || ''}
                    onChange={(e) =>
                      setEstructura({
                        ...estructura,
                        encabezado: { ...estructura.encabezado, tituloDocumento: e.target.value },
                      })
                    }
                    className="w-full px-3 py-1.5 rounded-lg bg-black/40 border border-white/10 text-white"
                  />
                </div>
              </div>
            ) : (
              <div className="text-xs space-y-1 text-slate-300">
                <p>
                  <strong className="text-white">Nombre guardado:</strong> {nombre}
                </p>
                <p>
                  <strong className="text-white">Institución:</strong>{' '}
                  {estructura.encabezado?.institucion || 'Detectada en formato'}
                </p>
                <p>
                  <strong className="text-white">Orientación de página:</strong>{' '}
                  <span className="capitalize">{estructura.orientacion}</span>
                </p>
              </div>
            )}
          </div>

          {/* Secciones Detectadas */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
                <Columns size={14} /> Secciones y Tablas Exactas ({estructura.secciones.length})
              </span>
              <span className="text-[11px] text-slate-400">Orden original conservado</span>
            </div>

            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
              {estructura.secciones.map((sec, idx) => (
                <div
                  key={sec.id || idx}
                  className="p-3.5 rounded-xl bg-white/5 border border-white/10 hover:border-cyan-500/30 transition-all text-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold flex items-center justify-center text-[10px]">
                        {idx + 1}
                      </span>
                      <span className="font-bold text-white uppercase">{sec.titulo}</span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                        sec.tipo === 'tabla'
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-400/30'
                          : sec.tipo === 'lista'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
                          : 'bg-purple-500/20 text-purple-300 border border-purple-400/30'
                      }`}
                    >
                      {sec.tipo}
                    </span>
                  </div>

                  {/* Si es tabla, mostramos las columnas detectadas */}
                  {sec.tipo === 'tabla' && sec.columnas && sec.columnas.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-white/5">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide flex items-center gap-1 mb-1">
                        <TableIcon size={12} /> Columnas exactas de la tabla:
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {sec.columnas.map((col, cIdx) => (
                          <span
                            key={cIdx}
                            className="px-2 py-1 rounded-md bg-white/10 text-slate-200 text-[11px] border border-white/5"
                          >
                            {col}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {sec.instruccion && (
                    <p className="text-[11px] text-slate-400 mt-1 italic">{sec.instruccion}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Estilo detectado */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 text-xs">
            <span className="text-slate-300 flex items-center gap-2">
              <Palette size={14} className="text-cyan-400" /> Color institucional detectado:
            </span>
            <div className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded-full border border-white/30"
                style={{ backgroundColor: estructura.estilo?.colorPrincipal || '#1e3a8a' }}
              />
              <span className="font-mono text-slate-400">{estructura.estilo?.colorPrincipal || '#1e3a8a'}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 text-xs font-semibold transition-all"
          >
            Atrás
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 disabled:opacity-50 text-white text-xs font-bold tracking-wide transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Guardando en Supabase...
              </>
            ) : (
              <>
                <Check size={16} />
                Confirmar y Guardar Formato
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
