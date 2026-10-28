import { useState, useEffect } from 'react';
import { useOutletContext, useLocation, Link } from 'react-router-dom';
import {
  FileUp,
  Plus,
  Trash2,
  Edit2,
  Sparkles,
  Building,
  AlertCircle,
  ShieldAlert,
  ChevronRight,
  Table as TableIcon,
  Loader2,
  RefreshCw,
  FlaskConical,
} from 'lucide-react';
import { FormatoDocente, TipoDocumentoFormato, FormatoEstructura } from '../types/formato';
import { FormatoService } from '../lib/formatoService';
import { FEATURE_FLAGS } from '../config/features';
import SubirFormatoModal from '../components/formato/SubirFormatoModal';
import ConfirmarEstructuraModal from '../components/formato/ConfirmarEstructuraModal';
import GenerarConFormatoModal from '../components/formato/GenerarConFormatoModal';
import DocxDiagnosticoModal from '../components/formato/DocxDiagnosticoModal';

export default function MiFormato() {
  const { isGuest = false, teacherId = '' } =
    useOutletContext<{ isGuest?: boolean; generationsCount?: number; teacherId?: string }>() || {};

  const location = useLocation();
  const preselectedTipo = (location.state as any)?.preselectedTipo as TipoDocumentoFormato | undefined;

  const [formatos, setFormatos] = useState<FormatoDocente[]>([]);
  const [filterTipo, setFilterTipo] = useState<string>(preselectedTipo || 'todos');
  const [isLoading, setIsLoading] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);

  // Modals state
  const [isSubirModalOpen, setIsSubirModalOpen] = useState(false);
  const [parsedDataForConfirmation, setParsedDataForConfirmation] = useState<{
    nombre: string;
    tipo: TipoDocumentoFormato;
    file: File;
    estructura: FormatoEstructura;
  } | null>(null);

  const [activeFormatoForGeneration, setActiveFormatoForGeneration] = useState<FormatoDocente | null>(null);
  const [isDiagnosticoOpen, setIsDiagnosticoOpen] = useState(false);

  // Rename state
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  // Delete confirm
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Cargar formatos de Supabase
  const loadFormatos = async () => {
    if (!teacherId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setActionError(null);
    try {
      const list = await FormatoService.getFormatosByTeacher(teacherId);
      setFormatos(list);
    } catch (err: any) {
      console.error('Error al cargar formatos de Supabase:', err);
      setActionError('No se pudieron sincronizar sus formatos. Revise su conexión e inténtelo nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFormatos();
  }, [teacherId]);

  // Si la feature flag está apagada
  if (!FEATURE_FLAGS.MI_FORMATO_ENABLED) {
    return (
      <div className="glass-effect rounded-3xl p-8 text-center max-w-lg mx-auto border border-white/10 mt-12">
        <ShieldAlert size={48} className="text-amber-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Módulo no disponible temporalmente</h2>
        <p className="text-sm text-slate-300">
          La función "Mi Formato" se encuentra en mantenimiento o deshabilitada por configuración.
        </p>
      </div>
    );
  }

  // Si es usuario invitado (no Pro)
  if (isGuest) {
    return (
      <div className="glass-effect rounded-3xl p-8 sm:p-12 text-center max-w-xl mx-auto border border-cyan-500/30 shadow-2xl mt-8">
        <div className="w-16 h-16 rounded-3xl bg-cyan-500/20 text-cyan-400 border border-cyan-400/30 flex items-center justify-center mx-auto mb-6">
          <Sparkles size={32} />
        </div>
        <h2 className="text-2xl font-black text-white tracking-tight uppercase">
          Función Exclusiva <span className="text-cyan-400">Docenty PRO</span>
        </h2>
        <p className="text-slate-300 text-sm mt-3 leading-relaxed">
          La herramienta <strong>"Mi Formato"</strong> permite subir el PDF, Word o foto del formato oficial de tu escuela para que Camila vacíe tus proyectos pedagógicos y planificaciones exactamente en tus cuadros y títulos.
        </p>
        <p className="text-xs text-cyan-300 mt-2 font-medium">
          Activa tu código PRO para desbloquear formatos ilimitados y sincronización permanente en la nube.
        </p>
        <div className="mt-6 flex justify-center">
          <Link
            to="/home"
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-cyan-500/20"
          >
            Volver al Inicio
          </Link>
        </div>
      </div>
    );
  }

  const handleFormatParsed = (data: {
    nombre: string;
    tipo: TipoDocumentoFormato;
    file: File;
    estructura: FormatoEstructura;
  }) => {
    setIsSubirModalOpen(false);
    setParsedDataForConfirmation(data);
  };

  const handleConfirmFormato = async (formatoFinal: FormatoDocente) => {
    setActionError(null);
    try {
      await FormatoService.saveFormato(teacherId, formatoFinal);
      await loadFormatos();
      setParsedDataForConfirmation(null);
    } catch (err: any) {
      console.error('Error al guardar formato en Supabase:', err);
      throw err;
    }
  };

  const handleSaveRename = async (formatoId: string) => {
    if (!newName.trim()) {
      setRenamingId(null);
      return;
    }
    setIsProcessingAction(true);
    setActionError(null);
    try {
      await FormatoService.renombrarFormato(teacherId, formatoId, newName);
      await loadFormatos();
      setRenamingId(null);
      setNewName('');
    } catch (err: any) {
      setActionError('No se pudo renombrar el formato.');
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleDelete = async (formatoId: string) => {
    setIsProcessingAction(true);
    setActionError(null);
    try {
      await FormatoService.eliminarFormato(teacherId, formatoId);
      await loadFormatos();
      setDeletingId(null);
    } catch (err: any) {
      setActionError('No se pudo eliminar el formato.');
    } finally {
      setIsProcessingAction(false);
    }
  };

  const filteredFormatos = formatos.filter((f) => {
    if (filterTipo === 'todos') return true;
    return f.tipoDocumento === filterTipo;
  });

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Hero Header */}
      <div className="glass-effect rounded-3xl p-6 sm:p-8 border border-cyan-500/30 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-400/30 text-cyan-300 text-xs font-black uppercase tracking-wider mb-3">
              <Sparkles size={13} />
              <span>Innovación Docenty PRO 2026-2027</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Mi Formato <span className="text-cyan-400">Escolar</span>
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-2 leading-relaxed">
              Suba el formato de su institución (PDF, Word o imagen). Camila identificará sus tablas,
              títulos y secciones para ayudarle a preparar sus planificaciones respetando su estructura.
              Podrá revisar los cambios con Camila antes de descargar el documento.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto md:shrink-0">
            {FEATURE_FLAGS.MI_FORMATO_CLONAR_ENABLED && (
              <button
                type="button"
                onClick={() => setIsDiagnosticoOpen(true)}
                className="px-3.5 py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-cyan-300 hover:text-white border border-cyan-400/20 transition-all flex items-center gap-1.5 text-xs font-semibold"
                title="Diagnóstico de integridad DOCX (Prueba de ida y vuelta)"
              >
                <FlaskConical size={16} />
                <span className="hidden sm:inline">Diagnóstico DOCX</span>
              </button>
            )}

            <button
              type="button"
              onClick={loadFormatos}
              disabled={isLoading}
              className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-all"
              title="Actualizar mis formatos guardados"
            >
              <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
            </button>

            <button
              type="button"
              onClick={() => setIsSubirModalOpen(true)}
              className="flex-1 sm:flex-none px-5 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs sm:text-sm tracking-wide shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-95"
            >
              <Plus size={18} />
              <span>Subir Nuevo Formato</span>
            </button>
          </div>
        </div>
      </div>

      {/* Alerta de error si ocurre */}
      {actionError && (
        <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2.5">
          <AlertCircle size={16} className="shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'todos', label: 'Todos los Formatos' },
            { id: 'PPA', label: 'PPA' },
            { id: 'planificacion_diaria', label: 'Plan Diario' },
            { id: 'planificacion_semanal', label: 'Plan Semanal' },
            { id: 'planificacion_mensual', label: 'Plan Mensual' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterTipo(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filterTipo === tab.id
                  ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-400/40 shadow-sm'
                  : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white border border-white/5'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <span className="text-xs text-slate-400">
          {isLoading
            ? 'Cargando documentos...'
            : `${filteredFormatos.length} formato${filteredFormatos.length === 1 ? '' : 's'} en tu cuenta`}
        </span>
      </div>

      {/* Formats Grid / Loading */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center text-center space-y-3">
          <Loader2 size={36} className="animate-spin text-cyan-400" />
          <p className="text-xs text-slate-400">Cargando sus formatos escolares guardados...</p>
        </div>
      ) : filteredFormatos.length === 0 ? (
        <div className="glass-effect rounded-3xl p-10 text-center border border-white/10">
          <div className="w-16 h-16 rounded-2xl bg-white/5 text-slate-400 border border-white/10 flex items-center justify-center mx-auto mb-4">
            <FileUp size={28} />
          </div>
          <h3 className="text-base font-bold text-white mb-1">Aún no has subido formatos</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mb-5 leading-relaxed">
            Puedes subir el formato que te exige tu escuela o circuito escolar en PDF, Word (.docx) o incluso una foto tomada desde tu celular. Se guardará de forma permanente en tu cuenta.
          </p>
          <button
            type="button"
            onClick={() => setIsSubirModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/30 text-cyan-300 text-xs font-bold transition-all"
          >
            <Plus size={16} /> Subir mi primer formato
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredFormatos.map((formato) => {
            const isRenaming = renamingId === formato.id;
            const seccionesCount = formato.estructura.secciones?.length || 0;
            const tablasCount =
              formato.estructura.secciones?.filter((s) => s.tipo === 'tabla').length || 0;

            return (
              <div
                key={formato.id}
                className="glass-effect rounded-3xl p-5 sm:p-6 border border-white/10 hover:border-cyan-500/40 transition-all flex flex-col justify-between group shadow-lg"
              >
                <div>
                  {/* Top card bar */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-cyan-500/15 border border-cyan-400/30 text-cyan-300">
                      {formato.tipoDocumento === 'PPA' ? 'PPA' : formato.tipoDocumento.replace('_', ' ')}
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setRenamingId(formato.id);
                          setNewName(formato.nombre);
                        }}
                        disabled={isProcessingAction}
                        className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                        title="Renombrar formato"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => setDeletingId(formato.id)}
                        disabled={isProcessingAction}
                        className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-colors"
                        title="Eliminar formato"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Title / Rename input */}
                  {isRenaming ? (
                    <div className="flex items-center gap-2 mb-3">
                      <input
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className="w-full px-2.5 py-1 text-xs rounded-lg bg-black/40 border border-cyan-400 text-white"
                        autoFocus
                      />
                      <button
                        onClick={() => handleSaveRename(formato.id)}
                        disabled={isProcessingAction}
                        className="px-2 py-1 bg-cyan-500 text-black text-[10px] font-bold rounded"
                      >
                        Guardar
                      </button>
                    </div>
                  ) : (
                    <h3 className="text-base font-bold text-white mb-1 group-hover:text-cyan-300 transition-colors line-clamp-1">
                      {formato.nombre}
                    </h3>
                  )}

                  {/* Institution detected */}
                  <p className="text-xs text-slate-400 flex items-center gap-1.5 mb-3 truncate">
                    <Building size={13} className="text-slate-500 shrink-0" />
                    <span>{formato.estructura.encabezado?.institucion || 'Institución Escolar'}</span>
                  </p>

                  {/* Badges details */}
                  <div className="flex flex-wrap gap-2 text-[11px] text-slate-300 mb-4">
                    <span className="px-2 py-1 rounded-md bg-white/5 border border-white/5 flex items-center gap-1">
                      <TableIcon size={12} className="text-cyan-400" />
                      {tablasCount} {tablasCount === 1 ? 'tabla' : 'tablas'}
                    </span>
                    <span className="px-2 py-1 rounded-md bg-white/5 border border-white/5">
                      {seccionesCount} secciones
                    </span>
                    <span className="px-2 py-1 rounded-md bg-white/5 border border-white/5 capitalize">
                      {formato.estructura.orientacion}
                    </span>
                  </div>
                </div>

                {/* Bottom action button */}
                <div className="pt-3 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setActiveFormatoForGeneration(formato)}
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500/20 to-blue-600/20 hover:from-cyan-500/30 hover:to-blue-600/30 border border-cyan-400/40 text-cyan-200 text-xs font-bold tracking-wide transition-all flex items-center justify-center gap-2 group/btn"
                  >
                    <Sparkles size={14} className="text-cyan-400 group-hover/btn:rotate-12 transition-transform" />
                    <span>Vaciar Planificación en este Formato</span>
                    <ChevronRight size={14} className="group-hover/btn:translate-x-0.5 transition-transform" />
                  </button>
                  {formato.archivoOriginalNombre?.toLowerCase().endsWith('.docx') && (
                    <Link
                      to="/camila-formato"
                      state={{ formatoId: formato.id }}
                      className="mt-2 w-full py-2.5 px-4 rounded-xl border border-teal-400/30 bg-teal-500/10 hover:bg-teal-500/20 text-teal-200 text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                    >
                      <Sparkles size={14} /> Trabajar este Word con Camila
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="glass-effect w-full max-w-sm rounded-3xl border border-red-500/30 p-6 text-white text-center">
            <div className="w-12 h-12 rounded-2xl bg-red-500/20 text-red-400 border border-red-500/30 flex items-center justify-center mx-auto mb-4">
              <Trash2 size={24} />
            </div>
            <h4 className="text-base font-bold text-white mb-2">¿Eliminar este formato?</h4>
            <p className="text-xs text-slate-300 mb-6">
              Esta acción no se puede deshacer. El formato se eliminará de su biblioteca privada de DOCENTY PRO.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setDeletingId(null)}
                disabled={isProcessingAction}
                className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deletingId)}
                disabled={isProcessingAction}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center gap-1.5"
              >
                {isProcessingAction && <Loader2 size={14} className="animate-spin" />}
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      <SubirFormatoModal
        isOpen={isSubirModalOpen}
        onClose={() => setIsSubirModalOpen(false)}
        onFormatParsed={handleFormatParsed}
        defaultTipo={(filterTipo !== 'todos' ? filterTipo : 'PPA') as TipoDocumentoFormato}
      />

      {/* Confirmation Modal */}
      {parsedDataForConfirmation && (
        <ConfirmarEstructuraModal
          isOpen={Boolean(parsedDataForConfirmation)}
          onClose={() => setParsedDataForConfirmation(null)}
          onConfirm={handleConfirmFormato}
          initialData={parsedDataForConfirmation}
          teacherId={teacherId}
        />
      )}

      {/* Generation Modal */}
      {activeFormatoForGeneration && (
        <GenerarConFormatoModal
          isOpen={Boolean(activeFormatoForGeneration)}
          onClose={() => setActiveFormatoForGeneration(null)}
          formato={activeFormatoForGeneration}
          teacherId={teacherId}
        />
      )}

      {/* Diagnóstico DOCX Modal */}
      <DocxDiagnosticoModal
        isOpen={isDiagnosticoOpen}
        onClose={() => setIsDiagnosticoOpen(false)}
      />
    </div>
  );
}
