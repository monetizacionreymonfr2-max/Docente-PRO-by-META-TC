import { useEffect, useRef, useState } from 'react';
import { renderAsync } from 'docx-preview';
import { Loader2, AlertCircle, Eye } from 'lucide-react';

interface DocxPreviewViewerProps {
  blob: Blob | null;
  className?: string;
}

export default function DocxPreviewViewer({ blob, className = '' }: DocxPreviewViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    async function renderDocx() {
      if (!blob || !containerRef.current) return;
      setIsLoading(true);
      setError(null);

      try {
        containerRef.current.innerHTML = '';
        await renderAsync(blob, containerRef.current, null, {
          inWrapper: false,
          ignoreWidth: false,
          ignoreHeight: false,
          breakPages: true,
          renderHeaders: true,
          renderFooters: true,
        });
      } catch (err: any) {
        if (!isCancelled) {
          console.error('Error al renderizar docx-preview:', err);
          setError('No se pudo generar la vista previa visual del documento.');
        }
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    }

    renderDocx();

    return () => {
      isCancelled = true;
    };
  }, [blob]);

  return (
    <div className={`relative flex flex-col bg-slate-900/60 rounded-2xl border border-white/10 overflow-hidden ${className}`}>
      <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/10 text-xs">
        <span className="font-bold text-cyan-300 flex items-center gap-1.5">
          <Eye size={14} /> Vista Previa Visual del Documento Word
        </span>
        <span className="text-[11px] text-slate-400 hidden sm:inline">Vista orientativa; revise el archivo final en Word</span>
      </div>

      <div className="relative flex-1 min-h-0 overflow-auto p-2 sm:p-4">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-10 backdrop-blur-xs">
            <div className="flex items-center gap-2 text-cyan-300 text-xs font-semibold">
              <Loader2 size={18} className="animate-spin text-cyan-400" />
              <span>Cargando vista previa del documento...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <div
          ref={containerRef}
          className="docx-preview-container bg-white text-black p-2 sm:p-8 rounded shadow-lg max-w-full overflow-x-auto min-h-[300px]"
          style={{ minHeight: '300px' }}
        />
      </div>
    </div>
  );
}
