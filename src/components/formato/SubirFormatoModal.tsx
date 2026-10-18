import { useState, useRef } from 'react';
import {
  X,
  Upload,
  FileText,
  Image as ImageIcon,
  Camera,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { TipoDocumentoFormato, FormatoEstructura } from '../../types/formato';
import { FormatoService } from '../../lib/formatoService';
import { FEATURE_FLAGS } from '../../config/features';

interface SubirFormatoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFormatParsed: (data: {
    nombre: string;
    tipo: TipoDocumentoFormato;
    file: File;
    estructura: FormatoEstructura;
  }) => void;
  defaultTipo?: TipoDocumentoFormato;
}

export default function SubirFormatoModal({
  isOpen,
  onClose,
  onFormatParsed,
  defaultTipo = 'PPA',
}: SubirFormatoModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [nombre, setNombre] = useState('');
  const [tipo, setTipo] = useState<TipoDocumentoFormato>(defaultTipo);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState('');
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileSelect = (selectedFile: File) => {
    setError(null);
    if (selectedFile.size > FEATURE_FLAGS.MAX_FORMATO_FILE_SIZE) {
      setError('El archivo excede el tamaño máximo permitido de 10 MB.');
      return;
    }

    const ext = '.' + selectedFile.name.split('.').pop()?.toLowerCase();
    const isImage = selectedFile.type.startsWith('image/');
    if (!FEATURE_FLAGS.ALLOWED_EXTENSIONS.includes(ext) && !isImage) {
      setError('Formato no admitido. Selecciona un archivo PDF, Word (.docx) o imagen (JPG, PNG, WEBP).');
      return;
    }

    setFile(selectedFile);
    if (!nombre.trim()) {
      // Nombre inicial sin la extensión
      const cleanName = selectedFile.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
      setNombre(cleanName);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleAnalizar = async () => {
    if (!file) {
      setError('Por favor selecciona un archivo de formato.');
      return;
    }
    if (!nombre.trim()) {
      setError('Ingresa un nombre identificador para este formato.');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setAnalysisProgress('Leyendo archivo y extrayendo estructura visual...');

    try {
      setTimeout(() => {
        setAnalysisProgress('Camila está analizando membrete, títulos y columnas con IA multimodal...');
      }, 1500);

      const estructura = await FormatoService.analizarFormato(file, nombre, tipo);

      onFormatParsed({
        nombre: nombre.trim(),
        tipo,
        file,
        estructura,
      });
    } catch (err: any) {
      console.error('Error al analizar formato:', err);
      setError(err?.message || 'No se pudo analizar el formato. Intenta nuevamente.');
    } finally {
      setIsAnalyzing(false);
      setAnalysisProgress('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="glass-effect w-full max-w-lg rounded-3xl border border-cyan-500/30 shadow-2xl p-6 sm:p-8 text-white relative max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-400/30">
              <Upload size={22} />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">Subir Mi Formato</h2>
              <p className="text-xs text-slate-300">Camila adaptará tus planificaciones a este diseño</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isAnalyzing}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <div className="mt-6 space-y-5">
          {/* Tipo de Documento */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-cyan-300 mb-2">
              Tipo de Planificación del Formato
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'PPA', label: 'Proyecto PPA' },
                { id: 'planificacion_diaria', label: 'Plan Diario' },
                { id: 'planificacion_semanal', label: 'Plan Semanal' },
                { id: 'planificacion_mensual', label: 'Plan Mensual' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setTipo(opt.id as TipoDocumentoFormato)}
                  disabled={isAnalyzing}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all text-left ${
                    tipo === opt.id
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                      : 'border-white/10 text-slate-400 hover:bg-white/5'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Nombre identificador */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-cyan-300 mb-1.5">
              Nombre para guardar este formato
            </label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              disabled={isAnalyzing}
              placeholder="Ej: Formato PPA Escuela Andrés Bello"
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 text-sm transition-all"
            />
          </div>

          {/* Dropzone / Upload Area */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-cyan-300 mb-2">
              Archivo del Formato (PDF, Word .docx o Foto)
            </label>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
                isDragging
                  ? 'border-cyan-400 bg-cyan-500/10'
                  : file
                  ? 'border-emerald-500/40 bg-emerald-500/5'
                  : 'border-white/20 bg-white/[0.02] hover:bg-white/[0.05]'
              }`}
            >
              {file ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <CheckCircle2 size={28} />
                  </div>
                  <p className="text-sm font-bold text-white truncate max-w-xs">{file.name}</p>
                  <p className="text-xs text-slate-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  <button
                    type="button"
                    onClick={() => setFile(null)}
                    disabled={isAnalyzing}
                    className="text-xs text-red-400 hover:underline mt-1"
                  >
                    Cambiar archivo
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2.5">
                  <div className="p-3.5 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-400/20">
                    <FileText size={28} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-200">
                      Arrastra tu archivo aquí o usa los botones
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      PDF, Word (.docx) o imágenes JPG/PNG/WEBP (máx. 10 MB)
                    </p>
                  </div>

                  <div className="flex items-center gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/10 flex items-center gap-1.5 transition-all"
                    >
                      <Upload size={14} /> Seleccionar archivo
                    </button>
                    {/* Botón para foto directa desde celular */}
                    <button
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                      className="px-4 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs font-semibold border border-cyan-400/30 flex items-center gap-1.5 transition-all"
                    >
                      <Camera size={14} /> Tomar Foto
                    </button>
                  </div>
                </div>
              )}

              {/* Hidden Inputs */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/*"
                onChange={(e) => {
                  if (e.target.files?.[0]) handleFileSelect(e.target.files[0]);
                }}
                className="hidden"
              />
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={(e) => {
                  if (e.target.files?.[0]) handleFileSelect(e.target.files[0]);
                }}
                className="hidden"
              />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-2.5 text-red-300 text-xs animate-shake">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Analysis Progress */}
          {isAnalyzing && (
            <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-400/30 flex items-center gap-3 text-cyan-200 text-xs">
              <Loader2 size={18} className="animate-spin text-cyan-400 shrink-0" />
              <div className="overflow-hidden">
                <p className="font-bold">Analizando formato con Camila...</p>
                <p className="text-[11px] text-cyan-300/80 truncate">{analysisProgress}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="mt-8 pt-4 border-t border-white/10 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isAnalyzing}
            className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 text-xs font-semibold transition-all"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleAnalizar}
            disabled={!file || !nombre.trim() || isAnalyzing}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 text-white text-xs font-bold tracking-wide transition-all shadow-lg shadow-cyan-500/20 flex items-center gap-2"
          >
            {isAnalyzing ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Analizando formato...
              </>
            ) : (
              <>
                <Sparkles size={16} />
                Analizar con Camila
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
