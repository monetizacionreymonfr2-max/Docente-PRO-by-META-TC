import { useState, useMemo } from 'react';
import {
  X,
  Sparkles,
  Loader2,
  FileDown,
  Edit3,
  Check,
  AlertCircle,
  FileText,
  Table as TableIcon,
  RotateCcw,
  Building,
  GraduationCap,
  Calendar,
  Eye,
  Layers,
  ShieldCheck,
  Cpu,
  ChevronDown,
} from 'lucide-react';
import { FormatoDocente, SeccionGenerada } from '../../types/formato';
import { FormatoService } from '../../lib/formatoService';
import { exportarFormatoDocx } from '../../lib/formatoDocxExporter';
import { exportarFormatoPdf } from '../../lib/formatoPdfExporter';
import { FEATURE_FLAGS } from '../../config/features';
import { ejecutarClonacionDocx, ClonacionResultado } from '../../lib/docxClone/clonerPipeline';
import DocxPreviewViewer from './DocxPreviewViewer';

interface GenerarConFormatoModalProps {
  isOpen: boolean;
  onClose: () => void;
  formato: FormatoDocente;
  teacherId: string;
}

export default function GenerarConFormatoModal({
  isOpen,
  onClose,
  formato,
  teacherId,
}: GenerarConFormatoModalProps) {
  // Step: 'form' | 'generating' | 'preview'
  const [step, setStep] = useState<'form' | 'generating' | 'preview'>('form');

  // Teacher inputs
  const [institucion, setInstitucion] = useState(formato.estructura.encabezado?.institucion || '');
  const [docente, setDocente] = useState(formato.estructura.encabezado?.docente || '');
  const [gradoSeccion, setGradoSeccion] = useState(formato.estructura.encabezado?.grado || '3er Grado A');
  const [nivel, setNivel] = useState('Primaria');
  const [tema, setTema] = useState('');
  const [duracion, setDuracion] = useState('4 semanas');
  const [diagnostico, setDiagnostico] = useState('');
  const [instruccionesExtra, setInstruccionesExtra] = useState('');

  // Generation state
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [progressMessage, setProgressMessage] = useState<string>('');
  const [seccionesGeneradas, setSeccionesGeneradas] = useState<SeccionGenerada[]>([]);
  const [observaciones, setObservaciones] = useState<string>('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [fallbackNotice, setFallbackNotice] = useState<string | null>(null);

  // DOCX Clone states
  const [clonedBlob, setClonedBlob] = useState<Blob | null>(null);
  const [clonedResult, setClonedResult] = useState<ClonacionResultado | null>(null);
  const [activeTabPreview, setActiveTabPreview] = useState<'visual' | 'editor'>('visual');

  // Edit mode in preview
  const [editingSecIndex, setEditingSecIndex] = useState<number | null>(null);

  if (!isOpen) return null;

  // Genera nombre de archivo corto y descriptivo
  const generarNombreCorto = (extension: 'docx' | 'pdf') => {
    const tipo = formato.tipoDocumento === 'PPA' ? 'PPA' : 'Plan';
    const cleanGrado = gradoSeccion.replace(/[^a-zA-Z0-9]/g, '');
    const cleanTema = (tema || 'Escolar')
      .split(' ')
      .slice(0, 3)
      .join('_')
      .replace(/[^a-zA-Z0-9_]/g, '');
    return `${tipo}_${cleanGrado || 'Aula'}_${cleanTema}.${extension}`;
  };

  const handleGenerar = async () => {
    if (!tema.trim()) {
      setErrorMsg('Por favor ingresa el tema del proyecto o de la clase.');
      return;
    }

    setStep('generating');
    setErrorMsg(null);
    setFallbackNotice(null);
    setClonedBlob(null);
    setClonedResult(null);
    setProgressMessage('Iniciando vaciado curricular...');

    const isDocxClone =
      FEATURE_FLAGS.MI_FORMATO_CLONAR_ENABLED &&
      formato.modo === 'clonar_docx' &&
      formato.plantilla;

    if (isDocxClone) {
      try {
        setProgressMessage('Recuperando archivo original de plantilla Word...');
        const originalPath = formato.archivoPath || `${teacherId}/${formato.id}.docx`;
        const fileBuffer = await FormatoService.downloadArchivoOriginal(originalPath);

        if (fileBuffer) {
          setProgressMessage('Ejecutando copia exacta byte a byte y sustituyendo contenido...');
          const cloneRes = await ejecutarClonacionDocx(
            fileBuffer,
            formato.plantilla!,
            {
              institucion,
              docente,
              gradoSeccion,
              nivel,
              tema,
              duracion,
              diagnostico,
              instruccionesExtra,
            },
            (msg) => setProgressMessage(msg)
          );

          if (cloneRes.exito && cloneRes.blobDocx) {
            setClonedBlob(cloneRes.blobDocx);
            setClonedResult(cloneRes);
            setActiveTabPreview('visual');

            // Generar también secciones estándar en segundo plano para editor o PDF si el docente las requiere
            FormatoService.generarContenidoConFormato(formato, {
              institucion,
              docente,
              gradoSeccion,
              nivel,
              tema,
              duracion,
              diagnostico,
              instruccionesExtra,
            })
              .then((res) => {
                setSeccionesGeneradas(res.secciones);
                setObservaciones(res.observacionesPedagogicas || '');
              })
              .catch(() => {});

            setStep('preview');
            return;
          } else if (cloneRes.fallbackRequerido) {
            setFallbackNotice(cloneRes.mensaje || 'No pude copiar tu Word exacto, aquí está en el formato estándar.');
          }
        } else {
          setFallbackNotice('Plantilla original no encontrada en caché. Se generará en el formato estándar.');
        }
      } catch (cloneErr: any) {
        console.warn('Fallo en clonación directa, usando fallback estándar:', cloneErr);
        setFallbackNotice('No pude copiar tu Word exacto, aquí está en el formato estándar.');
      }
    }

    // Modo estándar de reconstrucción o fallback
    try {
      setProgressMessage('Camila está redactando y vaciando tu contenido según el currículo MPPE 2026-2027...');
      const result = await FormatoService.generarContenidoConFormato(formato, {
        institucion,
        docente,
        gradoSeccion,
        nivel,
        tema,
        duracion,
        diagnostico,
        instruccionesExtra,
      });

      setSeccionesGeneradas(result.secciones);
      setObservaciones(result.observacionesPedagogicas || '');
      setActiveTabPreview('editor');
      setStep('preview');
    } catch (err: any) {
      console.error('Error al generar con formato:', err);
      setErrorMsg(err?.message || 'Camila está ocupada, intenta en un minuto.');
      setStep('form');
    }
  };

  const handleDownloadDocx = async () => {
    try {
      setIsDownloading(true);
      if (clonedBlob) {
        // Descarga directa del blob clonado byte a byte
        const url = URL.createObjectURL(clonedBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = generarNombreCorto('docx');
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        return;
      }

      const datosGenerales: Record<string, string> = {
        Institución: institucion || formato.estructura.encabezado?.institucion || 'Institución Educativa',
        Docente: docente || 'Docente Responsable',
        'Grado y Sección': gradoSeccion,
        Nivel: nivel,
        'Tema o Proyecto': tema,
        Duración: duracion,
      };

      const blob = await exportarFormatoDocx(formato, seccionesGeneradas, datosGenerales, tema);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = generarNombreCorto('docx');
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e: any) {
      console.error('Error al exportar Word:', e);
      alert('Hubo un inconveniente al generar el Word. Intenta con la versión PDF.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadPdf = () => {
    try {
      setIsDownloading(true);
      const datosGenerales: Record<string, string> = {
        Institución: institucion || formato.estructura.encabezado?.institucion || 'Institución Educativa',
        Docente: docente || 'Docente Responsable',
        'Grado y Sección': gradoSeccion,
        Nivel: nivel,
        'Tema o Proyecto': tema,
        Duración: duracion,
      };

      const doc = exportarFormatoPdf(formato, seccionesGeneradas, datosGenerales, tema);
      doc.save(generarNombreCorto('pdf'));
    } catch (e: any) {
      console.error('Error al exportar PDF:', e);
      alert('Hubo un inconveniente al generar el PDF.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleUpdateSeccionTexto = (index: number, newText: string) => {
    const updated = [...seccionesGeneradas];
    updated[index].contenidoTexto = newText;
    setSeccionesGeneradas(updated);
  };

  const handleUpdateTableCell = (secIndex: number, rowIdx: number, colIdx: number, val: string) => {
    const updated = [...seccionesGeneradas];
    const sec = updated[secIndex];
    if (sec.contenidoTabla && sec.contenidoTabla[rowIdx]) {
      sec.contenidoTabla[rowIdx][colIdx] = val;
      setSeccionesGeneradas(updated);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="glass-effect w-full max-w-4xl rounded-3xl border border-cyan-500/30 shadow-2xl p-5 sm:p-8 text-white relative max-h-[92vh] overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-400/30">
              <Sparkles size={22} />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">Vaciado en Mi Formato</h2>
              <p className="text-xs text-slate-300">
                Formato activo:{' '}
                <span className="font-semibold text-cyan-300">{formato.nombre}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* STEP 1: FORM INPUTS */}
        {step === 'form' && (
          <div className="mt-5 space-y-4 flex-1">
            {errorMsg && (
              <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2.5">
                <AlertCircle size={16} className="shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-cyan-300 mb-1">
                  Tema del Proyecto / Planificación *
                </label>
                <input
                  type="text"
                  value={tema}
                  onChange={(e) => setTema(e.target.value)}
                  placeholder="Ej: Los seres vivos y la biodiversidad venezolana"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-cyan-300 mb-1">
                  Grado y Sección
                </label>
                <input
                  type="text"
                  value={gradoSeccion}
                  onChange={(e) => setGradoSeccion(e.target.value)}
                  placeholder="Ej: 3er Grado Sección B"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-cyan-300 mb-1">
                  Institución / Escuela
                </label>
                <input
                  type="text"
                  value={institucion}
                  onChange={(e) => setInstitucion(e.target.value)}
                  placeholder="Ej: U.E. Nacional Simón Bolívar"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-cyan-300 mb-1">
                  Nombre del Docente
                </label>
                <input
                  type="text"
                  value={docente}
                  onChange={(e) => setDocente(e.target.value)}
                  placeholder="Ej: Prof. María González"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-cyan-300 mb-1">
                  Nivel Educativo
                </label>
                <select
                  value={nivel}
                  onChange={(e) => setNivel(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-cyan-400"
                >
                  <option value="Primaria" className="bg-slate-900">Educación Primaria</option>
                  <option value="Preescolar" className="bg-slate-900">Educación Inicial / Preescolar</option>
                  <option value="Maternal" className="bg-slate-900">Educación Maternal</option>
                  <option value="Media" className="bg-slate-900">Educación Media General / Técnica</option>
                  <option value="Especial" className="bg-slate-900">Educación Especial</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-cyan-300 mb-1">
                  Duración Estimada
                </label>
                <input
                  type="text"
                  value={duracion}
                  onChange={(e) => setDuracion(e.target.value)}
                  placeholder="Ej: 4 semanas (1 mes)"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            {/* Diagnóstico */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-cyan-300 mb-1">
                Diagnóstico Pedagógico del Aula (Opcional)
              </label>
              <textarea
                rows={2}
                value={diagnostico}
                onChange={(e) => setDiagnostico(e.target.value)}
                placeholder="Ej: Los estudiantes muestran interés en actividades prácticas de ciencias y lectura..."
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-400 resize-none"
              />
            </div>

            {/* Instrucciones Extra */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-cyan-300 mb-1 flex items-center justify-between">
                <span>Instrucciones Especiales para Camila (Opcional)</span>
                <span className="text-[10px] text-slate-400 font-normal">Personaliza el vaciado</span>
              </label>
              <input
                type="text"
                value={instruccionesExtra}
                onChange={(e) => setInstruccionesExtra(e.target.value)}
                placeholder='Ej: "Sin inglés ni educación física", "Énfasis en matemáticas lúdicas", "Proyecto socioproductivo"'
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-400"
              />
            </div>

            {/* Info badge */}
            <div className="p-3.5 rounded-2xl bg-cyan-500/10 border border-cyan-400/20 text-cyan-200 text-xs flex items-center gap-3">
              <Sparkles size={16} className="text-cyan-400 shrink-0" />
              <span>
                Camila generará todo el contenido pedagógico de acuerdo al currículo MPPE 2026-2027 y lo
                vaciará en los <strong>{formato.estructura.secciones.length} cuadros y secciones exactas</strong> de tu formato.
              </span>
            </div>

            {/* Action buttons */}
            <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleGenerar}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold tracking-wide transition-all shadow-lg shadow-cyan-500/20 flex items-center gap-2"
              >
                <Sparkles size={16} />
                Vaciar en Mi Formato con Camila
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: GENERATING ANIMATION */}
        {step === 'generating' && (
          <div className="py-16 flex flex-col items-center justify-center text-center space-y-4 flex-1">
            <div className="relative">
              <div className="w-20 h-20 rounded-full border-4 border-cyan-500/20 border-t-cyan-400 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center text-cyan-400">
                <Sparkles size={28} />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Camila está redactando y vaciando tu contenido</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                {progressMessage || 'Llenando títulos exactos, ajustando tablas con altura automática y aplicando el currículo oficial MPPE 2026-2027...'}
              </p>
            </div>
            <div className="px-4 py-2 rounded-xl bg-cyan-500/10 border border-cyan-400/20 text-cyan-300 text-xs font-mono">
              {formato.modo === 'clonar_docx'
                ? 'Modo Copia Exacta Word: Mismos logos, orientación y fuentes'
                : 'Generando sección por sección en el formato escolar'}
            </div>
          </div>
        )}

        {/* STEP 3: PREVIEW & EDIT & DOWNLOAD */}
        {step === 'preview' && (
          <div className="mt-5 space-y-4 flex-1 flex flex-col overflow-hidden">
            {/* Aviso de Fallback si aplica */}
            {fallbackNotice && (
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2.5">
                <AlertCircle size={16} className="shrink-0" />
                <span>{fallbackNotice}</span>
              </div>
            )}

            {/* Action Bar for Downloads & Mode Toggle */}
            <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-400/30 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300">
                  <Check size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>{fallbackNotice ? 'Documento generado en formato estándar' : '¡Documento vaciado con éxito!'}</span>
                    {clonedBlob && !fallbackNotice && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                        Copia Exacta Word
                      </span>
                    )}
                  </h4>
                  <p className="text-xs text-slate-300">
                    {clonedBlob && !fallbackNotice
                      ? 'Tu archivo Word original fue editado byte a byte conservando membrete y estilo'
                      : 'Puedes editar cualquier texto o celda antes de descargar'}
                  </p>
                </div>
              </div>

              {/* Download Buttons */}
              <div className="flex items-center gap-2">
                {clonedBlob ? (
                  <button
                    type="button"
                    onClick={handleDownloadDocx}
                    disabled={isDownloading}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-emerald-600/30"
                  >
                    <ShieldCheck size={14} />
                    Descargar Copia Exacta Word (.docx)
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleDownloadDocx}
                    disabled={isDownloading}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-blue-600/30"
                  >
                    <FileDown size={14} />
                    Descargar Word (.docx)
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  disabled={isDownloading}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-red-600/30"
                >
                  <FileDown size={14} />
                  Descargar PDF
                </button>
              </div>
            </div>

            {/* Panel Plegable: Detalles Técnicos */}
            {clonedResult && (
              <details className="group rounded-2xl border border-white/10 bg-white/5 p-3 text-xs text-slate-300 transition-all shrink-0">
                <summary className="flex cursor-pointer items-center justify-between font-bold text-slate-200 hover:text-white select-none">
                  <span className="flex items-center gap-2">
                    <Cpu size={15} className="text-cyan-400" />
                    <span>Detalles técnicos y cobertura de tablas</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                      clonedResult.exito && !fallbackNotice
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
                    }`}>
                      {clonedResult.exito && !fallbackNotice ? 'Validación 100% Exitosa' : 'Modo Estándar'}
                    </span>
                  </span>
                  <ChevronDown size={14} className="text-slate-400 group-open:rotate-180 transition-transform" />
                </summary>

                <div className="mt-3 pt-3 border-t border-white/10 space-y-3">
                  {clonedResult.coberturaTablas && clonedResult.coberturaTablas.length > 0 ? (
                    <div className="overflow-x-auto rounded-xl border border-white/10 bg-black/40">
                      <table className="w-full text-left text-[11px]">
                        <thead className="bg-white/5 text-slate-300 border-b border-white/10 font-mono">
                          <tr>
                            <th className="p-2">Tabla</th>
                            <th className="p-2">Tipo Detectado</th>
                            <th className="p-2 text-center">Celdas Contenido</th>
                            <th className="p-2 text-center">Reemplazadas</th>
                            <th className="p-2 text-center">Sin Cambio</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 font-mono">
                          {clonedResult.coberturaTablas.map((c) => (
                            <tr key={c.id} className="hover:bg-white/5">
                              <td className="p-2 font-bold text-white">{c.id} ({c.titulo || 'Tabla'})</td>
                              <td className="p-2 text-cyan-300 capitalize">{c.tipoDetectado.replace('_', ' ')}</td>
                              <td className="p-2 text-center text-slate-200">{c.celdasContenido}</td>
                              <td className="p-2 text-center text-emerald-400 font-bold">{c.celdasReemplazadas}</td>
                              <td className="p-2 text-center text-amber-300">{c.celdasSinCambio}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400">Sin desglose tabular disponible.</p>
                  )}

                  {clonedResult.detallesValidacion && clonedResult.detallesValidacion.length > 0 && (
                    <div className="p-2.5 rounded-xl bg-black/30 border border-white/10 space-y-1 text-[11px]">
                      <span className="font-bold text-slate-300 block">Registro de validación:</span>
                      <ul className="list-disc pl-4 space-y-0.5 text-slate-400">
                        {clonedResult.detallesValidacion.map((d, dIdx) => (
                          <li key={dIdx}>{d}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </details>
            )}

            {/* View Mode Switcher if Cloned DOCX is Available */}
            {clonedBlob && (
              <div className="flex items-center justify-between border-b border-white/10 pb-2 shrink-0">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTabPreview('visual')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      activeTabPreview === 'visual'
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/30'
                        : 'bg-white/5 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Eye size={14} /> Vista Previa Word Exacta
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTabPreview('editor')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      activeTabPreview === 'editor'
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/30'
                        : 'bg-white/5 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Layers size={14} /> Ver Cuadros Curriculares
                  </button>
                </div>
                <span className="text-[11px] text-slate-400">
                  {clonedResult?.tiempoSegundos ? `Generado en ${clonedResult.tiempoSegundos}s` : 'Word listo para imprimir'}
                </span>
              </div>
            )}

            {/* Visual Preview Mode */}
            {clonedBlob && activeTabPreview === 'visual' && (
              <DocxPreviewViewer blob={clonedBlob} className="flex-1" />
            )}

            {/* Editable Preview Sections Container (Active if not visual tab, or if standard mode) */}
            {(!clonedBlob || activeTabPreview === 'editor') && (
              <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {seccionesGeneradas.map((sec, secIdx) => {
                const formatoSecOrig = formato.estructura.secciones.find((s) => s.id === sec.seccionId);
                const columnas = formatoSecOrig?.columnas || [];

                return (
                  <div
                    key={sec.seccionId || secIdx}
                    className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3"
                  >
                    <div className="flex items-center justify-between border-b border-white/10 pb-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center text-[10px]">
                          {secIdx + 1}
                        </span>
                        {sec.titulo}
                      </span>
                      <span className="text-[10px] uppercase font-bold text-slate-400 px-2 py-0.5 rounded bg-white/5">
                        {sec.tipo}
                      </span>
                    </div>

                    {/* Contenido tipo tabla */}
                    {sec.tipo === 'tabla' && sec.contenidoTabla && (
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs border border-white/10 text-left">
                          <thead>
                            <tr className="bg-white/10 text-slate-300">
                              {columnas.length > 0
                                ? columnas.map((c, i) => (
                                    <th key={i} className="p-2 border border-white/10 font-bold">
                                      {c}
                                    </th>
                                  ))
                                : (sec.contenidoTabla[0] || []).map((_, i) => (
                                    <th key={i} className="p-2 border border-white/10 font-bold">
                                      Columna {i + 1}
                                    </th>
                                  ))}
                            </tr>
                          </thead>
                          <tbody>
                            {sec.contenidoTabla.map((fila, rIdx) => (
                              <tr key={rIdx} className="hover:bg-white/[0.02]">
                                {fila.map((celda, cIdx) => (
                                  <td key={cIdx} className="p-1 border border-white/10">
                                    <textarea
                                      rows={2}
                                      value={celda}
                                      onChange={(e) =>
                                        handleUpdateTableCell(secIdx, rIdx, cIdx, e.target.value)
                                      }
                                      className="w-full bg-transparent p-1.5 rounded text-white text-xs resize-y focus:bg-white/10 focus:outline-none"
                                    />
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Contenido tipo párrafo o campo */}
                    {sec.tipo !== 'tabla' && (
                      <textarea
                        rows={4}
                        value={sec.contenidoTexto || ''}
                        onChange={(e) => handleUpdateSeccionTexto(secIdx, e.target.value)}
                        className="w-full p-3 rounded-xl bg-black/30 border border-white/10 text-white text-xs leading-relaxed focus:outline-none focus:border-cyan-400 resize-y"
                      />
                    )}
                  </div>
                );
              })}
            </div>
            )}

            {/* Footer with Back / Reset */}
            <div className="pt-4 border-t border-white/10 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => setStep('form')}
                className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 text-xs font-semibold flex items-center gap-1.5"
              >
                <RotateCcw size={14} /> Volver a configurar datos
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold"
              >
                Finalizar y Cerrar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
