import { useState } from 'react';
import {
  X,
  FlaskConical,
  Upload,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileCheck,
  FileText,
  ShieldCheck,
  Download,
} from 'lucide-react';
import { ejecutarPruebaIdaYVuelta } from '../../lib/docxClone/docxEditor';

interface DocxDiagnosticoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DocxDiagnosticoModal({ isOpen, onClose }: DocxDiagnosticoModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [resultado, setResultado] = useState<{
    exito: boolean;
    detalles: string;
    stats: any;
    coberturaTablas?: any[];
  } | null>(null);

  if (!isOpen) return null;

  const handleTest = async () => {
    if (!file) return;
    setIsRunning(true);
    setResultado(null);

    try {
      const res = await ejecutarPruebaIdaYVuelta(file);
      setResultado(res);
    } catch (e: any) {
      setResultado({
        exito: false,
        detalles: 'Error: ' + e?.message,
        stats: null,
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="glass-effect w-full max-w-xl rounded-3xl border border-cyan-500/30 p-6 sm:p-8 text-white relative max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-400/30">
              <FlaskConical size={22} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Diagnóstico: Prueba de Ida y Vuelta DOCX</h3>
              <p className="text-xs text-slate-300">Verifica la conservación byte a byte de logos, tablas y formato</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10"
          >
            <X size={20} />
          </button>
        </div>

        <div className="mt-5 space-y-4">
          <p className="text-xs text-slate-300 leading-relaxed">
            Sube cualquier archivo Word (<span className="text-cyan-300 font-mono">.docx</span>) como{' '}
            <strong className="text-white">PA_3er_Grado_B_OCTUBRE.docx</strong>. El motor ejecutará el ciclo:{' '}
            <span className="font-mono text-cyan-300 text-[11px]">cargar → mapa → guardar sin alteraciones</span>, y
            comparará la integridad de logos, párrafos, tablas y celdas.
          </p>

          <div className="p-4 border-2 border-dashed border-white/10 hover:border-cyan-400/40 rounded-2xl text-center">
            <input
              type="file"
              accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              id="diagFileInput"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) setFile(e.target.files[0]);
              }}
            />
            <label htmlFor="diagFileInput" className="cursor-pointer flex flex-col items-center gap-2">
              <FileText size={28} className="text-cyan-400" />
              <span className="text-xs font-semibold text-slate-200">
                {file ? file.name : 'Haz clic para seleccionar el archivo Word de prueba'}
              </span>
              <span className="text-[10px] text-slate-400">Archivo .docx original</span>
            </label>
          </div>

          <button
            type="button"
            onClick={handleTest}
            disabled={!file || isRunning}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2"
          >
            {isRunning ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Ejecutando prueba de ida y vuelta...
              </>
            ) : (
              <>
                <ShieldCheck size={16} />
                Ejecutar Prueba de Integridad
              </>
            )}
          </button>

          {resultado && (
            <div
              className={`p-4 rounded-2xl border text-xs space-y-2 animate-in fade-in ${
                resultado.exito
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                  : 'bg-red-500/10 border-red-500/30 text-red-200'
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-sm">
                {resultado.exito ? (
                  <>
                    <CheckCircle2 size={18} className="text-emerald-400" />
                    <span>¡Prueba de Ida y Vuelta APROBADA!</span>
                  </>
                ) : (
                  <>
                    <AlertCircle size={18} className="text-red-400" />
                    <span>Fallo en la prueba de ida y vuelta</span>
                  </>
                )}
              </div>

              <p className="text-xs leading-relaxed opacity-90">{resultado.detalles}</p>

              {resultado.stats && (
                <div className="mt-3 pt-3 border-t border-white/10 grid grid-cols-2 gap-2 text-[11px] font-mono">
                  <div className="p-2 rounded bg-black/30">
                    <span className="text-slate-400 block">Párrafos:</span>
                    <span>{resultado.stats.parrafosOriginales} vs {resultado.stats.parrafosGenerados}</span>
                  </div>
                  <div className="p-2 rounded bg-black/30">
                    <span className="text-slate-400 block">Tablas:</span>
                    <span>{resultado.stats.tablasOriginales} vs {resultado.stats.tablasGeneradas}</span>
                  </div>
                  <div className="p-2 rounded bg-black/30">
                    <span className="text-slate-400 block">Logos/Imágenes:</span>
                    <span>{resultado.stats.archivosMediaOriginales} vs {resultado.stats.archivosMediaGenerados}</span>
                  </div>
                  <div className="p-2 rounded bg-black/30">
                    <span className="text-slate-400 block">Tamaño Bytes:</span>
                    <span>{resultado.stats.tamanoOriginalBytes} → {resultado.stats.tamanoGeneradoBytes}</span>
                  </div>
                </div>
              )}

              {/* INFORME DE COBERTURA POR TABLA */}
              {resultado.coberturaTablas && resultado.coberturaTablas.length > 0 && (
                <div className="mt-3 pt-3 border-t border-white/10 space-y-2">
                  <h4 className="text-xs font-bold text-cyan-300 uppercase tracking-wider">
                    Informe de Cobertura por Tabla
                  </h4>
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
                        {resultado.coberturaTablas.map((c: any) => (
                          <tr key={c.id} className="hover:bg-white/5">
                            <td className="p-2 font-bold text-white">{c.id}</td>
                            <td className="p-2 text-cyan-300 capitalize">{c.tipoDetectado.replace('_', ' ')}</td>
                            <td className="p-2 text-center text-slate-200">{c.celdasContenido}</td>
                            <td className="p-2 text-center text-emerald-400 font-bold">{c.celdasReemplazadas}</td>
                            <td className="p-2 text-center text-amber-300">{c.celdasSinCambio}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mt-6 pt-4 border-t border-white/10 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 text-xs font-semibold"
          >
            Cerrar Diagnóstico
          </button>
        </div>
      </div>
    </div>
  );
}
