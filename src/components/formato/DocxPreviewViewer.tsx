import { useEffect, useRef, useState } from 'react';
import { renderAsync } from 'docx-preview';
import { Loader2, AlertCircle, Eye } from 'lucide-react';

interface DocxPreviewViewerProps {
  blob: Blob | null;
  className?: string;
}

export default function DocxPreviewViewer({ blob, className = '' }: DocxPreviewViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [anchoNatural, setAnchoNatural] = useState(0);
  const [anchoDisponible, setAnchoDisponible] = useState(0);
  const [ajustarAlAncho, setAjustarAlAncho] = useState(true);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const medir = () => {
      // El ancho útil excluye el relleno del visor, de modo que el documento
      // ajustado no provoque una barra horizontal innecesaria.
      const estilo = window.getComputedStyle(viewport);
      const relleno = parseFloat(estilo.paddingLeft) + parseFloat(estilo.paddingRight);
      setAnchoDisponible(Math.max(0, viewport.clientWidth - relleno));
    };
    medir();
    const observer = new ResizeObserver(medir);
    observer.observe(viewport);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let isCancelled = false;

    async function renderDocx() {
      if (!blob || !containerRef.current) return;
      setIsLoading(true);
      setError(null);
      setAnchoNatural(0);

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
        if (!isCancelled && containerRef.current) {
          // docx-preview dibuja páginas Word de ancho fijo. Medimos el ancho
          // original antes de aplicar zoom para conservar tablas y márgenes.
          setAnchoNatural(Math.ceil(containerRef.current.scrollWidth));
        }
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

  const escala = ajustarAlAncho && anchoNatural && anchoDisponible
    ? Math.min(1, (anchoDisponible - 4) / anchoNatural)
    : 1;

  return (
    <div className={`relative flex flex-col bg-slate-900/60 rounded-2xl border border-white/10 overflow-hidden ${className}`}>
      <div className="flex items-center justify-between gap-2 px-3 sm:px-4 py-2 bg-white/5 border-b border-white/10 text-xs">
        <span className="font-bold text-cyan-300 flex items-center gap-1.5">
          <Eye size={14} className="shrink-0" /> Vista previa del documento
        </span>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] text-slate-400 hidden xl:inline">Vista orientativa; revise el archivo final en Word</span>
          <button
            type="button"
            onClick={() => setAjustarAlAncho((valor) => !valor)}
            className="rounded-lg border border-cyan-400/30 bg-cyan-400/10 px-2 py-1 text-[11px] font-bold text-cyan-200 hover:bg-cyan-400/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300"
            aria-label={ajustarAlAncho ? 'Ver documento a tamaño real' : 'Ajustar documento al ancho de pantalla'}
          >
            {ajustarAlAncho ? '100 %' : 'Ajustar'}
          </button>
        </div>
      </div>

      <div ref={viewportRef} className="relative flex-1 min-h-0 overflow-auto p-2 sm:p-4">
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
          className="docx-preview-container bg-white text-black p-2 sm:p-8 rounded shadow-lg min-h-[300px]"
          style={{ width: anchoNatural ? `${anchoNatural}px` : 'max-content', zoom: escala }}
        />
      </div>
    </div>
  );
}
