import { useState, useRef, useEffect } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import {
  Send,
  Loader2,
  Paperclip,
  Camera,
  RotateCcw,
  Download,
  FileDown,
  FileText,
  Sparkles,
  Bot,
  User,
  CheckCircle2,
  AlertCircle,
  FileUp,
  FolderOpen,
  BookOpen,
  Cpu,
  ChevronDown,
  X,
  Eye,
  ShieldCheck,
  Check,
  Plus,
  Trash2,
} from 'lucide-react';
import DocxPreviewViewer from '../components/formato/DocxPreviewViewer';
import { FormatoService, fileToBase64 } from '../lib/formatoService';
import { SupabaseService } from '../lib/supabaseService';
import { FormatoDocente } from '../types/formato';
import { PlantillaDocx, DocxMapa } from '../lib/docxClone/types';
import { cargarDocx, construirMapa, guardarDocx } from '../lib/docxClone/docxEditor';
import { analizarPlantillaDocx } from '../lib/docxClone/plantillaAnalyzer';
import {
  MensajeChatFormato,
  SnapshotDocx,
  AdjuntoSesion,
  ProyectoCargadoDocente,
  RevisionCoberturaDocx,
  enviarMensajeACamilaFormato,
  revisarDocumentoVivo,
} from '../lib/camilaFormato/camilaFormatoEngine';
import {
  getCamilaFormatoModel,
  setCamilaFormatoModel,
  listarModelosDisponibles,
  ModeloGeminiInfo,
} from '../lib/camilaFormato/camilaFormatoConfig';

export default function CamilaFormato() {
  const { teacherId, isAdmin } = useOutletContext<{ teacherId: string; isAdmin?: boolean }>();

  // Navegación de pestañas en móvil / tablet
  const [tabActiva, setTabActiva] = useState<'chat' | 'documento'>('chat');

  // Estado del documento vivo
  const [formatoActivo, setFormatoActivo] = useState<FormatoDocente | null>(null);
  const [archivoOriginalBuffer, setArchivoOriginalBuffer] = useState<ArrayBuffer | null>(null);
  const [docVivo, setDocVivo] = useState<Document | null>(null);
  const [zipVivo, setZipVivo] = useState<any | null>(null);
  const [docOrig, setDocOrig] = useState<Document | null>(null);
  const [mapaActual, setMapaActual] = useState<DocxMapa | null>(null);
  const [plantillaActual, setPlantillaActual] = useState<PlantillaDocx | null>(null);
  const [blobDocx, setBlobDocx] = useState<Blob | null>(null);

  // Pila de snapshots para deshacer (máx 10)
  const [snapshots, setSnapshots] = useState<SnapshotDocx[]>([]);

  // Proyecto activo cargado
  const [proyectoActivo, setProyectoActivo] = useState<ProyectoCargadoDocente | null>(null);

  // Adjuntos temporales en memoria
  const [adjuntos, setAdjuntos] = useState<AdjuntoSesion[]>([]);

  // Chat
  const [mensajes, setMensajes] = useState<MensajeChatFormato[]>([
    {
      id: 'bienvenida',
      emisor: 'camila',
      texto:
        '¡Hola! Soy Camila Formato. Elige o sube tu documento Word (.docx) oficial y cuéntame qué deseas hacer: vaciarlo con tu proyecto, cambiar una ficha, agregar semanas al cronograma o quitar materias.',
      fecha: new Date(),
    },
  ]);
  const [inputTexto, setInputTexto] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progresoDetalle, setProgresoDetalle] = useState<string | null>(null);

  // Modales
  const [modalProyectosOpen, setModalProyectosOpen] = useState(false);
  const [modalFormatosOpen, setModalFormatosOpen] = useState(false);
  const [modalRevisionOpen, setModalRevisionOpen] = useState(false);
  const [modalModelosOpen, setModalModelosOpen] = useState(false);
  const [modalAvisoPdfOpen, setModalAvisoPdfOpen] = useState(false);

  // Datos para modales
  const [proyectosGuardados, setProyectosGuardados] = useState<any[]>([]);
  const [formatosGuardados, setFormatosGuardados] = useState<FormatoDocente[]>([]);
  const [modelosDisponibles, setModelosDisponibles] = useState<ModeloGeminiInfo[]>([]);
  const [modeloSeleccionado, setModeloSeleccionado] = useState(getCamilaFormatoModel());
  const [revisionActual, setRevisionActual] = useState<RevisionCoberturaDocx | null>(null);

  // Referencias UI
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll del chat
  useEffect(() => {
    chatScrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensajes, isProcessing]);

  // Cargar formatos y modelos al inicio
  useEffect(() => {
    if (teacherId) {
      FormatoService.getFormatosByTeacher(teacherId).then((f) => {
        setFormatosGuardados(
          f.filter((item) => item.modo === 'clonar_docx' || item.archivoOriginalNombre?.toLowerCase().endsWith('.docx'))
        );
      });
      SupabaseService.getPlanificaciones(teacherId).then((p) => {
        setProyectosGuardados(p || []);
      });
    }
  }, [teacherId]);

  // Cargar formato activo en memoria
  const cargarFormatoEnSesion = async (formato: FormatoDocente, arrayBuffer?: ArrayBuffer) => {
    try {
      setIsProcessing(true);
      setProgresoDetalle('Cargando documento y analizando estructura...');

      let buf = arrayBuffer;
      if (!buf && formato.archivoPath) {
        buf = await FormatoService.downloadArchivoOriginal(formato.archivoPath);
      }

      if (!buf) {
        throw new Error('No se pudo obtener el archivo Word original.');
      }

      setArchivoOriginalBuffer(buf);

      const { doc: dOrig } = await cargarDocx(buf);
      const { zip: zVivo, doc: dVivo } = await cargarDocx(buf);

      const mapa = construirMapa(dVivo);
      let plantilla = formato.plantilla || null;

      if (!plantilla) {
        setProgresoDetalle('Identificando tablas y secciones curriculares...');
        plantilla = await analizarPlantillaDocx(mapa);
      }

      setDocOrig(dOrig);
      setDocVivo(dVivo);
      setZipVivo(zVivo);
      setMapaActual(mapa);
      setPlantillaActual(plantilla);
      setFormatoActivo(formato);

      const blobInicial = await guardarDocx(zVivo, dVivo);
      setBlobDocx(blobInicial);

      // Snapshot inicial
      const serializer = new XMLSerializer();
      setSnapshots([
        {
          id: 'snap-0',
          xml: serializer.serializeToString(dVivo),
          mapa,
          descripcion: 'Documento original cargado',
          timestamp: Date.now(),
        },
      ]);

      const rev = revisarDocumentoVivo(dOrig, dVivo, plantilla);
      setRevisionActual(rev);

      setMensajes((prev) => [
        ...prev,
        {
          id: `msg-${Date.now()}`,
          emisor: 'camila',
          texto: `¡Listo! He cargado **${formato.nombre}**. Su estructura contiene ${mapa.tablas.length} tablas y ${mapa.parrafos.length} secciones en el cuerpo.\n\n¿Qué te gustaría hacer con este formato?`,
          fecha: new Date(),
          revision: rev,
        },
      ]);
    } catch (e: any) {
      console.error('[CamilaFormato] Error al cargar formato:', e);
      setMensajes((prev) => [
        ...prev,
        {
          id: `msg-${Date.now()}`,
          emisor: 'camila',
          texto: `Ocurrió un error al cargar el archivo Word: ${e?.message || e}. Por favor intenta subirlo nuevamente.`,
          fecha: new Date(),
        },
      ]);
    } finally {
      setIsProcessing(false);
      setProgresoDetalle(null);
    }
  };

  // Manejador de subida de archivo desde el input
  const handleFileUpload = async (file: File) => {
    if (!file) return;

    const nombreLow = file.name.toLowerCase();

    // Si es un Word .docx
    if (nombreLow.endsWith('.docx')) {
      const arrayBuffer = await file.arrayBuffer();
      const nuevoFormato: FormatoDocente = {
        id: `local-${Date.now()}`,
        teacherId,
        nombre: file.name.replace(/\.[^/.]+$/, ''),
        tipoDocumento: 'PPA',
        archivoOriginalNombre: file.name,
        archivoMimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        tamanoBytes: file.size,
        modo: 'clonar_docx',
        estructura: {
          tipoDocumento: 'PPA',
          orientacion: 'vertical',
          encabezado: {},
          secciones: [],
          estilo: { colorPrincipal: '#1e3a8a' },
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await cargarFormatoEnSesion(nuevoFormato, arrayBuffer);
      return;
    }

    // Si es PDF o imagen
    if (nombreLow.endsWith('.pdf') || file.type.startsWith('image/')) {
      // Si el docente lo subió como formato nuevo, advertir que la copia exacta byte a byte requiere Word
      if (!docVivo) {
        setModalAvisoPdfOpen(true);
      } else {
        // Si ya hay un Word abierto, agregarlo como adjunto a la conversación para que Camila lo lea
        const b64 = await fileToBase64(file);
        const adj: AdjuntoSesion = {
          id: `adj-${Date.now()}`,
          nombre: file.name,
          tipo: file.type.startsWith('image/') ? 'imagen' : 'pdf',
          mimeType: file.type || (nombreLow.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg'),
          base64: b64,
          file,
        };
        setAdjuntos((prev) => [...prev, adj]);
      }
    }
  };

  // Deshacer el último cambio
  const handleDeshacer = async () => {
    if (snapshots.length <= 1 || !zipVivo) return;

    const nuevas = [...snapshots];
    const actual = nuevas.pop(); // descartar el estado actual
    const anterior = nuevas[nuevas.length - 1];

    if (!anterior) return;

    try {
      setIsProcessing(true);
      setProgresoDetalle('Revirtiendo cambios al estado anterior...');

      const parser = new DOMParser();
      const docRevertido = parser.parseFromString(anterior.xml, 'application/xml');
      const mapaRevertido = construirMapa(docRevertido);

      zipVivo.file('word/document.xml', anterior.xml);
      const nuevoBlob = await zipVivo.generateAsync({
        type: 'blob',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        compression: 'DEFLATE',
      });

      setDocVivo(docRevertido);
      setMapaActual(mapaRevertido);
      setBlobDocx(nuevoBlob);
      setSnapshots(nuevas);

      const rev = revisarDocumentoVivo(docOrig, docRevertido, plantillaActual);
      setRevisionActual(rev);

      setMensajes((prev) => [
        ...prev,
        {
          id: `msg-${Date.now()}`,
          emisor: 'camila',
          texto: `Listo, revertí el documento al paso: **"${anterior.descripcion}"**.`,
          fecha: new Date(),
          revision: rev,
        },
      ]);
    } catch (e: any) {
      console.error('[CamilaFormato] Error al deshacer:', e);
    } finally {
      setIsProcessing(false);
      setProgresoDetalle(null);
    }
  };

  // Enviar mensaje al motor conversacional
  const handleEnviarMensaje = async (textoAEnviar?: string) => {
    const texto = (textoAEnviar || inputTexto).trim();
    if ((!texto && adjuntos.length === 0) || isProcessing) return;

    if (!docVivo || !mapaActual || !zipVivo) {
      setMensajes((prev) => [
        ...prev,
        {
          id: `msg-${Date.now()}`,
          emisor: 'docente',
          texto,
          fecha: new Date(),
        },
        {
          id: `msg-${Date.now() + 1}`,
          emisor: 'camila',
          texto:
            'Aún no has seleccionado un formato Word (.docx). Por favor presiona **"Mis formatos"** o adjunta tu archivo Word para empezar a editarlo.',
          fecha: new Date(),
        },
      ]);
      setInputTexto('');
      return;
    }

    const adjuntosEnviados = [...adjuntos];
    setAdjuntos([]);
    setInputTexto('');

    // Agregar mensaje del usuario
    setMensajes((prev) => [
      ...prev,
      {
        id: `msg-${Date.now()}`,
        emisor: 'docente',
        texto,
        adjuntos: adjuntosEnviados.map((a) => ({ nombre: a.nombre, tipo: a.tipo })),
        fecha: new Date(),
      },
    ]);

    setIsProcessing(true);
    setProgresoDetalle('Camila está analizando el documento y redactando...');

    try {
      // Construir historial de turnos
      const historialTurnos: Array<{ rol: 'user' | 'model'; texto: string }> = mensajes
        .filter((m) => m.emisor === 'docente' || m.emisor === 'camila')
        .slice(-6)
        .map((m) => ({
          rol: m.emisor === 'docente' ? 'user' : 'model',
          texto: m.texto,
        }));

      const resultado = await enviarMensajeACamilaFormato({
        mensajeDocente: texto,
        historialTurnos,
        mapaActual,
        docVivo,
        zipVivo,
        docOrig,
        plantilla: plantillaActual,
        proyectoActivo,
        adjuntosMemoria: adjuntosEnviados,
        archivoOriginalData: archivoOriginalBuffer,
        onProgresoVaciarTodo: (paso) => setProgresoDetalle(paso),
      });

      // Actualizar estado del documento
      setBlobDocx(resultado.nuevoBlob);
      setMapaActual(resultado.nuevoMapa);
      setRevisionActual(resultado.revision);

      // Guardar snapshot para deshacer
      const serializer = new XMLSerializer();
      const nuevoXml = serializer.serializeToString(docVivo);
      setSnapshots((prev) => [
        ...prev.slice(-9), // conservar máx 10
        {
          id: `snap-${Date.now()}`,
          xml: nuevoXml,
          mapa: resultado.nuevoMapa,
          descripcion: texto.slice(0, 40) || 'Modificación realizada',
          timestamp: Date.now(),
        },
      ]);

      setMensajes((prev) => [
        ...prev,
        {
          id: `msg-${Date.now()}`,
          emisor: 'camila',
          texto: resultado.respuestaCamila,
          operacionesEjecutadas: resultado.operacionesEjecutadas,
          operacionesOmitidas: resultado.operacionesOmitidas,
          fecha: new Date(),
          revision: resultado.revision,
        },
      ]);
    } catch (err: any) {
      console.error('[CamilaFormato] Error en turno:', err);
      setMensajes((prev) => [
        ...prev,
        {
          id: `msg-${Date.now()}`,
          emisor: 'camila',
          texto: err?.message || 'Ocurrió un error al procesar tu solicitud. Por favor intenta de nuevo.',
          fecha: new Date(),
        },
      ]);
    } finally {
      setIsProcessing(false);
      setProgresoDetalle(null);
    }
  };

  // Descarga del archivo Word
  const handleDescargarDocx = () => {
    if (!blobDocx) return;
    const url = URL.createObjectURL(blobDocx);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${formatoActivo?.nombre || 'Planificacion'}_Editado.docx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Descarga PDF aproximada (impresión del navegador)
  const handleDescargarPdf = () => {
    window.print();
  };

  return (
    <div className="flex flex-col h-[calc(100dvh-5.2rem)] md:h-[calc(100vh-2rem)] max-w-7xl mx-auto p-1 sm:p-3 gap-2 sm:gap-3">
      {/* HEADER BAR */}
      <header className="flex flex-wrap items-center justify-between gap-2.5 p-3 sm:p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-teal-500 flex items-center justify-center text-white shadow-md shadow-cyan-500/20">
            <Bot size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black text-white tracking-tight">Camila Formato</h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-teal-500/20 text-teal-300 border border-teal-400/30">
                Word Vivo
              </span>
            </div>
            <p className="text-xs text-slate-300 flex items-center gap-1.5 truncate max-w-[240px] sm:max-w-md">
              {formatoActivo ? (
                <>
                  <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                  <span className="font-semibold text-white truncate">{formatoActivo.nombre}</span>
                </>
              ) : (
                <span className="text-slate-400">Sin formato cargado. Elige o sube tu Word (.docx).</span>
              )}
            </p>
          </div>
        </div>

        {/* CONTROLES DERECHA */}
        <div className="flex items-center gap-2">
          {/* Selector de modelo IA para Admin */}
          {isAdmin && (
            <button
              type="button"
              onClick={async () => {
                const list = await listarModelosDisponibles();
                setModelosDisponibles(list);
                setModalModelosOpen(true);
              }}
              className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-mono text-cyan-300 flex items-center gap-1.5 transition-all"
              title="Configurar Modelo Gemini"
            >
              <Cpu size={14} />
              <span className="hidden sm:inline">{modeloSeleccionado}</span>
            </button>
          )}

          {/* Botón Revisar Documento */}
          {revisionActual && (
            <button
              type="button"
              onClick={() => setModalRevisionOpen(true)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all ${
                revisionActual.aprobado
                  ? 'bg-emerald-500/10 border-emerald-400/30 text-emerald-300'
                  : 'bg-amber-500/10 border-amber-400/30 text-amber-300 hover:bg-amber-500/20'
              }`}
            >
              <ShieldCheck size={14} />
              <span className="hidden sm:inline">Revisar</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-black/30">
                {revisionActual.celdasSinCambio === 0 ? '100%' : `${revisionActual.celdasSinCambio} pend.`}
              </span>
            </button>
          )}

          {/* Selector de pestañas móvil */}
          <div className="flex lg:hidden rounded-xl bg-black/40 p-1 border border-white/10">
            <button
              type="button"
              onClick={() => setTabActiva('chat')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                tabActiva === 'chat' ? 'bg-cyan-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Chat
            </button>
            <button
              type="button"
              onClick={() => setTabActiva('documento')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                tabActiva === 'documento' ? 'bg-cyan-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Documento
            </button>
          </div>
        </div>
      </header>

      {/* BODY CONTENT: SPLIT EN DESKTOP, TABS EN MÓVIL */}
      <div className="flex-1 flex overflow-hidden gap-3">
        {/* PANEL IZQUIERDO: CHAT CON CAMILA */}
        <div
          className={`flex-1 flex flex-col rounded-2xl bg-slate-900/40 border border-white/10 overflow-hidden ${
            tabActiva === 'chat' ? 'flex' : 'hidden lg:flex'
          }`}
        >
          {/* BARRA SUPERIOR DE ACCIONES RÁPIDAS DEL CHAT */}
          <div className="p-2 sm:p-3 bg-white/5 border-b border-white/10 flex flex-wrap items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setModalFormatosOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-400/30 text-cyan-300 text-xs font-bold flex items-center gap-1.5 transition-all"
              >
                <FolderOpen size={14} />
                <span>Mis Formatos</span>
              </button>

              <button
                type="button"
                onClick={() => setModalProyectosOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 border border-teal-400/30 text-teal-300 text-xs font-bold flex items-center gap-1.5 transition-all"
              >
                <BookOpen size={14} />
                <span>Mis Proyectos</span>
              </button>
            </div>

            {proyectoActivo && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-teal-500/20 border border-teal-400/30 text-[11px] text-teal-200">
                <span className="font-bold truncate max-w-[120px] sm:max-w-[180px]">PPA: {proyectoActivo.titulo}</span>
                <button
                  type="button"
                  onClick={() => setProyectoActivo(null)}
                  className="hover:text-white"
                  title="Desvincular proyecto"
                >
                  <X size={12} />
                </button>
              </div>
            )}
          </div>

          {/* HISTORIAL DE MENSAJES */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3.5">
            {mensajes.map((m) => (
              <div
                key={m.id}
                className={`flex gap-2.5 max-w-[85%] sm:max-w-[78%] ${
                  m.emisor === 'docente' ? 'ml-auto flex-row-reverse' : 'mr-auto'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 text-white text-xs ${
                    m.emisor === 'docente'
                      ? 'bg-gradient-to-tr from-cyan-600 to-blue-600'
                      : 'bg-gradient-to-tr from-teal-600 to-emerald-600'
                  }`}
                >
                  {m.emisor === 'docente' ? <User size={15} /> : <Bot size={15} />}
                </div>

                <div
                  className={`p-3 rounded-2xl text-xs sm:text-[13px] leading-relaxed shadow-sm ${
                    m.emisor === 'docente'
                      ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-tr-none'
                      : 'bg-white/10 text-slate-100 border border-white/10 rounded-tl-none'
                  }`}
                >
                  {/* Texto principal */}
                  <div className="whitespace-pre-wrap">{m.texto}</div>

                  {/* Operaciones ejecutadas */}
                  {m.operacionesEjecutadas && m.operacionesEjecutadas.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-white/10 flex flex-wrap gap-1 text-[10px] font-mono">
                      {m.operacionesEjecutadas.map((op, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded bg-black/30 border border-white/10 text-emerald-300"
                        >
                          ✓ {op.tipo} {op.id ? `(${op.id})` : op.tablaId ? `(${op.tablaId})` : ''}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Operaciones omitidas */}
                  {m.operacionesOmitidas && m.operacionesOmitidas.length > 0 && (
                    <div className="mt-1.5 text-[10px] text-amber-300/90 font-mono">
                      {m.operacionesOmitidas.map((om, idx) => (
                        <div key={idx}>• {om}</div>
                      ))}
                    </div>
                  )}

                  {/* Adjuntos en el mensaje */}
                  {m.adjuntos && m.adjuntos.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {m.adjuntos.map((adj, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded bg-black/40 text-[10px] text-cyan-200 border border-cyan-400/20"
                        >
                          📎 {adj.nombre}
                        </span>
                      ))}
                    </div>
                  )}

                  <span className="block mt-1 text-[9px] opacity-60 text-right">
                    {new Date(m.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}

            {isProcessing && (
              <div className="flex gap-2.5 mr-auto max-w-[80%] items-center text-xs text-cyan-300">
                <div className="w-7 h-7 rounded-xl bg-teal-600 flex items-center justify-center text-white shrink-0">
                  <Loader2 size={15} className="animate-spin" />
                </div>
                <div className="p-3 rounded-2xl bg-white/10 border border-white/10 text-slate-300">
                  <span>{progresoDetalle || 'Camila está escribiendo...'}</span>
                </div>
              </div>
            )}

            <div ref={chatScrollRef} />
          </div>

          {/* CHIPS DE SUGERENCIAS */}
          <div className="px-3 py-2 bg-white/5 border-t border-white/10 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
            <button
              type="button"
              onClick={() => handleEnviarMensaje('Vacíalo con mi proyecto de aprendizaje')}
              disabled={isProcessing || !docVivo}
              className="px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-400/20 text-cyan-300 text-[11px] whitespace-nowrap transition-all disabled:opacity-40"
            >
              ⚡ Vaciar con mi proyecto
            </button>
            <button
              type="button"
              onClick={() => setModalRevisionOpen(true)}
              disabled={!docVivo}
              className="px-2.5 py-1 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 border border-teal-400/20 text-teal-300 text-[11px] whitespace-nowrap transition-all disabled:opacity-40"
            >
              🔍 Revisar el documento
            </button>
            <button
              type="button"
              onClick={() => handleEnviarMensaje('Quita el área de matemáticas')}
              disabled={isProcessing || !docVivo}
              className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-[11px] whitespace-nowrap transition-all disabled:opacity-40"
            >
              Quitar matemáticas
            </button>
            <button
              type="button"
              onClick={() => handleEnviarMensaje('Agrega una semana más al cronograma')}
              disabled={isProcessing || !docVivo}
              className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-[11px] whitespace-nowrap transition-all disabled:opacity-40"
            >
              +1 semana al cronograma
            </button>
            <button
              type="button"
              onClick={() => handleEnviarMensaje('Haz el diagnóstico más corto y preciso')}
              disabled={isProcessing || !docVivo}
              className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-[11px] whitespace-nowrap transition-all disabled:opacity-40"
            >
              Diagnóstico más corto
            </button>
          </div>

          {/* BARRA DE ADJUNTOS EN MEMORIA */}
          {adjuntos.length > 0 && (
            <div className="px-3 py-1.5 bg-cyan-950/40 border-t border-cyan-500/20 flex items-center gap-2 overflow-x-auto shrink-0">
              <span className="text-[10px] text-cyan-300 font-bold shrink-0">Adjuntos:</span>
              {adjuntos.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-cyan-500/20 border border-cyan-400/30 text-[11px] text-cyan-200"
                >
                  <span className="truncate max-w-[120px]">{a.nombre}</span>
                  <button
                    type="button"
                    onClick={() => setAdjuntos((prev) => prev.filter((item) => item.id !== a.id))}
                    className="hover:text-white"
                  >
                    <X size={11} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* INPUT BAR */}
          <div className="p-2 sm:p-3 bg-slate-900 border-t border-white/10 flex items-end gap-2 shrink-0 z-20">
            {/* Botón Adjuntar Archivo */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-all shrink-0 disabled:opacity-50 flex items-center justify-center cursor-pointer active:scale-95"
              title="Adjuntar Word, PDF o imagen"
            >
              <Paperclip size={18} />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".docx,.pdf,.jpg,.jpeg,.png,.webp"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFileUpload(f);
                e.target.value = '';
              }}
            />

            {/* Botón Cámara móvil */}
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              disabled={isProcessing}
              className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-all shrink-0 disabled:opacity-50 sm:hidden flex items-center justify-center cursor-pointer active:scale-95"
              title="Tomar foto con cámara"
            >
              <Camera size={18} />
            </button>
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFileUpload(f);
                e.target.value = '';
              }}
            />

            {/* Input de texto */}
            <textarea
              value={inputTexto}
              onChange={(e) => setInputTexto(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleEnviarMensaje();
                }
              }}
              placeholder={
                docVivo
                  ? 'Pídele a Camila: "vacíalo con 1er grado", "agrega una semana", "quita matemáticas"...'
                  : 'Primero selecciona un formato con "Mis Formatos" o adjunta tu Word...'
              }
              rows={1}
              className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400/50 resize-none max-h-24"
            />

            {/* Botón Enviar */}
            <button
              type="button"
              onClick={() => handleEnviarMensaje()}
              disabled={isProcessing || (!inputTexto.trim() && adjuntos.length === 0)}
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-white shadow-lg shadow-cyan-500/30 disabled:opacity-40 transition-all shrink-0 flex items-center justify-center cursor-pointer active:scale-95 z-30"
              title="Enviar mensaje"
            >
              {isProcessing ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            </button>
          </div>
        </div>

        {/* PANEL DERECHO: VISTA PREVIA Y DESCARGA DEL DOCUMENTO WORD */}
        <div
          className={`flex-1 flex flex-col rounded-2xl bg-slate-900/40 border border-white/10 overflow-hidden ${
            tabActiva === 'documento' ? 'flex' : 'hidden lg:flex'
          }`}
        >
          {/* BARRA DE HERRAMIENTAS DEL DOCUMENTO */}
          <div className="p-3 bg-white/5 border-b border-white/10 flex flex-wrap items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDeshacer}
                disabled={snapshots.length <= 1 || isProcessing}
                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-slate-300 flex items-center gap-1.5 transition-all disabled:opacity-30"
                title="Deshacer el último cambio aplicado"
              >
                <RotateCcw size={14} />
                <span>Deshacer {snapshots.length > 1 ? `(${snapshots.length - 1})` : ''}</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDescargarDocx}
                disabled={!blobDocx}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-emerald-600/30 disabled:opacity-40"
              >
                <Download size={14} />
                <span>Descargar Word</span>
              </button>

              <button
                type="button"
                onClick={handleDescargarPdf}
                disabled={!blobDocx}
                className="px-3 py-1.5 rounded-xl bg-red-600/20 hover:bg-red-600/40 border border-red-500/30 text-red-200 text-xs font-bold flex items-center gap-1.5 transition-all disabled:opacity-40"
                title="Imprimir / Exportar PDF aproximado"
              >
                <FileDown size={14} />
                <span>PDF</span>
              </button>
            </div>
          </div>

          {/* ÁREA DE VISUALIZACIÓN DEL WORD */}
          <div className="flex-1 overflow-auto p-3 flex flex-col items-center justify-center">
            {blobDocx ? (
              <div className="w-full h-full flex flex-col">
                <DocxPreviewViewer blob={blobDocx} className="flex-1 w-full" />
              </div>
            ) : (
              <div className="text-center p-8 space-y-4 max-w-sm">
                <div className="w-16 h-16 rounded-3xl bg-cyan-500/10 border border-cyan-400/20 flex items-center justify-center text-cyan-400 mx-auto">
                  <FileText size={32} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Ningún documento Word en pantalla</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Elige un formato guardado o sube tu archivo .docx para visualizarlo y editarlo en vivo.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setModalFormatosOpen(true)}
                  className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white text-xs font-bold transition-all shadow-md shadow-cyan-500/30"
                >
                  Abrir Mis Formatos
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL: MIS FORMATOS */}
      {modalFormatosOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-white/10 p-5 shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FolderOpen size={16} className="text-cyan-400" /> Mis Formatos Word
              </h3>
              <button
                type="button"
                onClick={() => setModalFormatosOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-3 space-y-2.5">
              {formatosGuardados.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">
                  No tienes formatos Word (.docx) guardados aún. Puedes subir uno nuevo abajo.
                </p>
              ) : (
                formatosGuardados.map((fmt) => (
                  <div
                    key={fmt.id}
                    onClick={() => {
                      cargarFormatoEnSesion(fmt);
                      setModalFormatosOpen(false);
                    }}
                    className={`p-3 rounded-2xl border text-left cursor-pointer transition-all flex items-center justify-between gap-3 ${
                      formatoActivo?.id === fmt.id
                        ? 'bg-cyan-500/20 border-cyan-400/50 text-white'
                        : 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-200'
                    }`}
                  >
                    <div className="truncate">
                      <span className="font-bold text-xs block text-white truncate">{fmt.nombre}</span>
                      <span className="text-[10px] text-slate-400 block truncate">{fmt.archivoOriginalNombre}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/20 text-cyan-300 shrink-0">
                      Cargar
                    </span>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  setModalFormatosOpen(false);
                  fileInputRef.current?.click();
                }}
                className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md shadow-cyan-600/30"
              >
                <FileUp size={15} /> Subir nuevo archivo Word (.docx)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: MIS PROYECTOS (PLANIFICACIONES) */}
      {modalProyectosOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-xl rounded-3xl bg-slate-900 border border-white/10 p-5 shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <BookOpen size={16} className="text-teal-400" /> Mis Proyectos Guardados
              </h3>
              <button
                type="button"
                onClick={() => setModalProyectosOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-3 space-y-2.5">
              {proyectosGuardados.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">
                  No tienes proyectos ni planificaciones guardadas en tu cuenta.
                </p>
              ) : (
                proyectosGuardados.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => {
                      const cargado: ProyectoCargadoDocente = {
                        id: p.id,
                        titulo: p.titulo || 'Proyecto de Aprendizaje',
                        gradoSeccion: p.proyecto || p.nivel || '1er Grado',
                        proposito: p.proposito || p.diagnostico || '',
                        diagnostico: p.diagnostico || '',
                        planesDiarios: p.planesDiarios || [],
                        resumenTexto: `${p.titulo} - ${p.proyecto}: ${p.proposito}`,
                      };
                      setProyectoActivo(cargado);
                      setModalProyectosOpen(false);
                      setMensajes((prev) => [
                        ...prev,
                        {
                          id: `msg-${Date.now()}`,
                          emisor: 'sistema',
                          texto: `Proyecto seleccionado: **${cargado.titulo}** (${cargado.gradoSeccion}). Puedes pedirle a Camila: *"Vacíalo con este proyecto"* o pedir cambios puntuales.`,
                          fecha: new Date(),
                        },
                      ]);
                    }}
                    className="p-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 text-slate-200 cursor-pointer transition-all flex items-start justify-between gap-3"
                  >
                    <div>
                      <span className="font-bold text-xs text-white block">{p.titulo}</span>
                      <span className="text-[11px] text-teal-300 block">{p.proyecto || p.nivel || 'Sin grado'}</span>
                      <p className="text-[10px] text-slate-400 line-clamp-2 mt-1">
                        {p.proposito || p.diagnostico || 'Sin contenido detallado'}
                      </p>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-teal-500/20 text-teal-300 text-[10px] font-bold shrink-0">
                      Elegir
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: REVISIÓN DEL DOCUMENTO */}
      {modalRevisionOpen && revisionActual && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-xl rounded-3xl bg-slate-900 border border-white/10 p-5 shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck size={16} className="text-cyan-400" /> Informe de Revisión y Cobertura
              </h3>
              <button
                type="button"
                onClick={() => setModalRevisionOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-3 space-y-3 text-xs">
              <div
                className={`p-3 rounded-2xl border ${
                  revisionActual.aprobado
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                    : 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                }`}
              >
                <span className="font-bold block text-sm">{revisionActual.aprobado ? '¡Aprobado al 100%!' : 'Atención pendiente'}</span>
                <p className="mt-1 leading-relaxed">{revisionActual.resumen}</p>
              </div>

              {/* Desglose de tablas */}
              {revisionActual.coberturaTablas.length > 0 && (
                <div className="space-y-1.5">
                  <h4 className="font-bold text-white uppercase text-[10px] tracking-wider">Desglose por Tabla</h4>
                  <div className="overflow-x-auto rounded-xl border border-white/10 bg-black/30">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-white/5 border-b border-white/10 font-mono text-slate-300">
                        <tr>
                          <th className="p-2">Tabla</th>
                          <th className="p-2">Tipo</th>
                          <th className="p-2 text-center">Contenido</th>
                          <th className="p-2 text-center">Nuevas</th>
                          <th className="p-2 text-center">Sin Cambio</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 font-mono">
                        {revisionActual.coberturaTablas.map((c) => (
                          <tr key={c.id}>
                            <td className="p-2 font-bold text-white">{c.id}</td>
                            <td className="p-2 text-cyan-300 capitalize">{c.tipoDetectado.replace('_', ' ')}</td>
                            <td className="p-2 text-center">{c.celdasContenido}</td>
                            <td className="p-2 text-center text-emerald-400 font-bold">{c.celdasReemplazadas}</td>
                            <td className="p-2 text-center text-amber-300">{c.celdasSinCambio}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Observaciones detalladas */}
              {revisionActual.detalles.length > 0 && (
                <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-1 text-[11px] text-slate-300">
                  <span className="font-bold block text-white">Observaciones detectadas:</span>
                  <ul className="list-disc pl-4 space-y-0.5 text-slate-400">
                    {revisionActual.detalles.map((d, idx) => (
                      <li key={idx}>{d}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-white/10 flex justify-end">
              <button
                type="button"
                onClick={() => setModalRevisionOpen(false)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: SELECCIONAR MODELO IA (ADMIN) */}
      {modalModelosOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-white/10 p-5 shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Cpu size={16} className="text-cyan-400" /> Modelos Gemini Disponibles
              </h3>
              <button
                type="button"
                onClick={() => setModalModelosOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-slate-400 py-2">
              Modelos activos consultados desde la API con soporte para <code>generateContent</code>:
            </p>

            <div className="flex-1 overflow-y-auto py-2 space-y-2">
              {modelosDisponibles.map((m) => (
                <div
                  key={m.id}
                  onClick={() => {
                    setModeloSeleccionado(m.id);
                    setCamilaFormatoModel(m.id);
                    setModalModelosOpen(false);
                  }}
                  className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                    modeloSeleccionado === m.id
                      ? 'bg-cyan-500/20 border-cyan-400 text-white'
                      : 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs">{m.displayName || m.id}</span>
                    {modeloSeleccionado === m.id && <Check size={14} className="text-cyan-400" />}
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 block mt-0.5">{m.id}</span>
                  {m.description && <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{m.description}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: AVISO SOBRE PDF Y FOTO */}
      {modalAvisoPdfOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-amber-500/30 p-5 shadow-2xl flex flex-col space-y-3 text-xs">
            <div className="flex items-center gap-2.5 text-amber-400 font-bold text-sm">
              <AlertCircle size={20} />
              <span>Copia Exacta en Word vs. Reconstrucción</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              La <strong>Copia Exacta Word</strong> funciona exclusivamente con archivos <code>.docx</code>, ya que
              edita los cuadros internos conservando logos y membretes originales.
            </p>
            <p className="text-slate-400 leading-relaxed">
              Para formatos en <strong>PDF o fotografías</strong>, te recomendamos utilizar la pantalla estándar de{' '}
              <Link to="/mi-formato" className="text-cyan-300 underline font-bold">
                Mi Formato
              </Link>{' '}
              que cuenta con el motor de reconstrucción visual, o subir la versión original en Word si la tienes en tu equipo.
            </p>
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setModalAvisoPdfOpen(false)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold transition-all"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
