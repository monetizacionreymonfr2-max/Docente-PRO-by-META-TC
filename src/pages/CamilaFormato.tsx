import { useState, useRef, useEffect } from 'react';
import { useOutletContext, useLocation } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
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
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  History,
  Brain,
  Save,
} from 'lucide-react';
import { askCamilaClaude, type CamilaTurn } from '../lib/camila/claudeClient';
import {
  CamilaPersistence, type ResumenConversacion, type RecuerdoCamila,
} from '../lib/camila/camilaPersistence';
import { hayConversacionSinGuardar } from '../lib/camila/camilaConversationGuard';
import { ColaHistorialPrivado } from '../lib/camila/colaHistorialPrivado';
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
  analizarSolicitudPpaSinWord,
  enviarMensajeACamilaFormato,
  revisarDocumentoVivo,
} from '../lib/camilaFormato/camilaFormatoEngine';
import { obtenerAccionesDocumento } from '../lib/camilaFormato/accionesDocumento';
import { combinarDatosProyecto, type DatosProyectoPropuesto } from '../lib/camilaFormato/contextoProyectoPpa';
import { datosProyectoDesdeLibro, preguntaPendienteLibroPpa, type LibroHechosPpa } from '../lib/camilaFormato/libroHechosPpa';
import { generarBorradorPpaSinPlantilla, prepararBorradorPpa, solicitaCrearWordPpa } from '../lib/camilaFormato/borradorPpaSinPlantilla';
import { generarPpaSinPlantillaCompleto } from '../lib/camilaFormato/ppaSinPlantillaCompleto';
import { VersionesPpa, type VersionDocumentoPpa } from '../lib/camilaFormato/versionesPpa';
import { prepararDeshacerSeguro } from '../lib/camilaFormato/deshacerSeguro';
import {
  getCamilaFormatoModel,
  setCamilaFormatoModel,
  listarModelosDisponibles,
  ModeloGeminiInfo,
} from '../lib/camilaFormato/camilaFormatoConfig';

type ResultadoCamilaFormato = Awaited<ReturnType<typeof enviarMensajeACamilaFormato>>;

export default function CamilaFormato() {
  const { teacherId, isAdmin, teacherName } = useOutletContext<{ teacherId: string; isAdmin?: boolean; teacherName?: string }>();
  const nombre = teacherName?.trim().split(/\s+/)[0] || '';
  const hora = new Date().getHours();
  const saludo = hora < 12 ? 'Buenos días' : hora < 19 ? 'Buenas tardes' : 'Buenas noches';
  const location = useLocation();
  const formatoPendienteId = (location.state as { formatoId?: string } | null)?.formatoId;
  const formatoAbiertoAutomaticamente = useRef<string | null>(null);

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
  const [nombreBorradorLocal, setNombreBorradorLocal] = useState<string | null>(null);
  // La propuesta se genera sobre una copia aislada. El documento activo solo
  // cambia después de que el docente apruebe expresamente el resultado.
  const [propuestaPendiente, setPropuestaPendiente] = useState<{
    solicitud: string;
    resultado: ResultadoCamilaFormato;
    generadoSinPlantilla?: boolean;
  } | null>(null);

  // Pila de snapshots para deshacer (máx 10)
  const [snapshots, setSnapshots] = useState<SnapshotDocx[]>([]);

  // Proyecto activo cargado
  const [proyectoActivo, setProyectoActivo] = useState<ProyectoCargadoDocente | null>(null);
  const [datosProyectoTemporal, setDatosProyectoTemporal] = useState<DatosProyectoPropuesto>({});
  const [libroHechosTemporal, setLibroHechosTemporal] = useState<LibroHechosPpa | null>(null);

  // Adjuntos temporales en memoria
  const [adjuntos, setAdjuntos] = useState<AdjuntoSesion[]>([]);

  // Chat
  const [mensajes, setMensajes] = useState<MensajeChatFormato[]>([
    {
      id: 'bienvenida',
      emisor: 'camila',
      texto:
        `${saludo}${nombre ? `, ${nombre}` : ''}. Soy Camila, su asistente pedagógica de DOCENTY PRO. Puede elegir uno de sus formatos o adjuntar un documento Word para que trabajemos en él. ¿Qué desea preparar hoy?`,
      fecha: new Date(),
    },
  ]);
  const [inputTexto, setInputTexto] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const accionesDocumento = obtenerAccionesDocumento({
    hayDocumento: Boolean(blobDocx),
    hayZip: Boolean(zipVivo),
    cantidadSnapshots: snapshots.length,
    hayPropuesta: Boolean(propuestaPendiente),
    procesando: isProcessing,
  });
  const [progresoDetalle, setProgresoDetalle] = useState<string | null>(null);
  const [escuchando, setEscuchando] = useState(false);
  const [hablandoId, setHablandoId] = useState<string | null>(null);
  const [avisoVoz, setAvisoVoz] = useState<string | null>(null);
  const reconocimientoRef = useRef<any>(null);
  const [conversacionId, setConversacionId] = useState<string | null>(null);
  const [historialGuardado, setHistorialGuardado] = useState<ResumenConversacion[]>([]);
  const [recuerdos, setRecuerdos] = useState<RecuerdoCamila[]>([]);
  const [usarRecuerdos, setUsarRecuerdos] = useState(true);
  const [persistenciaOcupada, setPersistenciaOcupada] = useState(false);
  const [avisoPrivacidad, setAvisoPrivacidad] = useState<string | null>(null);
  const colaGuardadoRef = useRef(new ColaHistorialPrivado());
  const omitirPrimerAutoguardadoRef = useRef<string | null>(null);
  const [tituloRecuerdo, setTituloRecuerdo] = useState('');
  const [contenidoRecuerdo, setContenidoRecuerdo] = useState('');
  const [recuerdoEditandoId, setRecuerdoEditandoId] = useState<string | null>(null);
  const [recuerdoPorAutorizar, setRecuerdoPorAutorizar] = useState(false);

  // Modales
  const [modalProyectosOpen, setModalProyectosOpen] = useState(false);
  const [modalFormatosOpen, setModalFormatosOpen] = useState(false);
  const [modalRevisionOpen, setModalRevisionOpen] = useState(false);
  const [modalModelosOpen, setModalModelosOpen] = useState(false);
  const [modalHistorialOpen, setModalHistorialOpen] = useState(false);
  const [modalVersionesOpen, setModalVersionesOpen] = useState(false);
  const [versionesPrivadas, setVersionesPrivadas] = useState<VersionDocumentoPpa[]>([]);
  const [versionesDisponibles, setVersionesDisponibles] = useState(false);
  const [modalMemoriaOpen, setModalMemoriaOpen] = useState(false);

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

  // Dictado y lectura en voz alta: solo funcionan tras un clic explícito.
  // No activamos micrófono, escucha permanente ni respuestas habladas al cargar.
  useEffect(() => () => {
    const reconocimiento = reconocimientoRef.current;
    if (reconocimiento) {
      reconocimiento.onresult = null;
      reconocimiento.onerror = null;
      reconocimiento.onend = null;
      reconocimiento.abort();
    }
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  }, []);

  const alternarDictado = () => {
    setAvisoVoz(null);
    if (escuchando) {
      reconocimientoRef.current?.stop();
      return;
    }
    const Reconocimiento = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!Reconocimiento) {
      setAvisoVoz('El dictado no está disponible en este navegador. Puede escribir su mensaje normalmente.');
      return;
    }
    try {
      const reconocimiento = new Reconocimiento();
      reconocimiento.lang = 'es-VE';
      reconocimiento.continuous = false;
      reconocimiento.interimResults = false;
      reconocimiento.onstart = () => setEscuchando(true);
      reconocimiento.onresult = (evento: any) => {
        const frase = String(evento.results?.[0]?.[0]?.transcript || '').trim();
        if (frase) setInputTexto((anterior) => [anterior.trim(), frase].filter(Boolean).join(' '));
      };
      reconocimiento.onerror = (evento: any) => {
        if (evento.error !== 'no-speech' && evento.error !== 'aborted') {
          setAvisoVoz('No se pudo utilizar el micrófono. Revise los permisos de su navegador.');
        }
        setEscuchando(false);
      };
      reconocimiento.onend = () => setEscuchando(false);
      reconocimientoRef.current = reconocimiento;
      reconocimiento.start();
    } catch {
      setEscuchando(false);
      setAvisoVoz('No se pudo iniciar el dictado. Puede continuar escribiendo.');
    }
  };

  const alternarLectura = (mensaje: MensajeChatFormato) => {
    if (!('speechSynthesis' in window)) {
      setAvisoVoz('La lectura en voz alta no está disponible en este navegador.');
      return;
    }
    window.speechSynthesis.cancel();
    if (hablandoId === mensaje.id) {
      setHablandoId(null);
      return;
    }
    const texto = mensaje.texto.replace(/\*\*|[`*_#]/g, '').replace(/\[(.*?)\]\(.*?\)/g, '$1').slice(0, 2500);
    const lectura = new SpeechSynthesisUtterance(texto);
    lectura.lang = 'es-VE';
    lectura.rate = 0.95;
    lectura.onstart = () => setHablandoId(mensaje.id);
    lectura.onend = () => setHablandoId(null);
    lectura.onerror = () => setHablandoId(null);
    window.speechSynthesis.speak(lectura);
  };

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

  // No mostrar controles de versiones hasta que la migración esté aplicada:
  // el Preview comparte actualmente un Supabase con producción.
  useEffect(() => {
    let activo = true;
    setVersionesDisponibles(false);
    if (teacherId) {
      VersionesPpa.listar(teacherId).then(() => {
        if (activo) setVersionesDisponibles(true);
      }).catch(() => {
        if (activo) setVersionesDisponibles(false);
      });
    }
    return () => { activo = false; };
  }, [teacherId]);

  // Los recuerdos se leen únicamente dentro de la sesión autenticada actual.
  // Si el esquema todavía no existe en Preview, la conversación sigue funcionando.
  useEffect(() => {
    let activo = true;
    setRecuerdos([]);
    if (teacherId) {
      CamilaPersistence.listarRecuerdos(teacherId)
        .then((datos) => { if (activo) setRecuerdos(datos); })
        .catch(() => { /* El aviso detallado aparece al abrir Memoria. */ });
    }
    return () => { activo = false; };
  }, [teacherId]);

  // Al guardar una conversación una vez, el docente autoriza la sincronización
  // de sus siguientes turnos. Se encadenan escrituras para evitar sobrescrituras.
  const actualizarHistorialEnCola = (id: string, contenido = mensajes) => {
    const instantanea = [...contenido];
    return colaGuardadoRef.current.encolar(id, () =>
      CamilaPersistence.actualizarConversacion(teacherId, id, instantanea)
    );
  };

  useEffect(() => {
    if (!conversacionId || !teacherId) return;
    // Abrir o crear un chat no cuenta como una edición de sus mensajes.
    if (omitirPrimerAutoguardadoRef.current === conversacionId) {
      omitirPrimerAutoguardadoRef.current = null;
      return;
    }
    const temporizador = window.setTimeout(() => {
      void actualizarHistorialEnCola(conversacionId).catch((error) =>
        setAvisoPrivacidad(error instanceof Error ? error.message : 'No se pudo actualizar el historial.')
      );
    }, 900);
    return () => window.clearTimeout(temporizador);
  }, [conversacionId, mensajes, teacherId]);

  const cargarHistorial = async () => {
    setModalHistorialOpen(true);
    setAvisoPrivacidad(null);
    try { setHistorialGuardado(await CamilaPersistence.listarConversaciones(teacherId)); }
    catch (error) { setAvisoPrivacidad(error instanceof Error ? error.message : 'No se pudo cargar el historial.'); }
  };

  const guardarConversacion = async () => {
    if (persistenciaOcupada || isProcessing || propuestaPendiente) return;
    setPersistenciaOcupada(true);
    setAvisoPrivacidad(null);
    try {
      if (conversacionId) await actualizarHistorialEnCola(conversacionId);
      else {
        const id = await CamilaPersistence.crearConversacion(teacherId, mensajes);
        omitirPrimerAutoguardadoRef.current = id;
        setConversacionId(id);
      }
      setAvisoPrivacidad('Conversación guardada en su historial privado. Los siguientes mensajes se sincronizarán automáticamente.');
      setHistorialGuardado(await CamilaPersistence.listarConversaciones(teacherId));
    } catch (error) { setAvisoPrivacidad(error instanceof Error ? error.message : 'No se pudo guardar su conversación.'); }
    finally { setPersistenciaOcupada(false); }
  };

  const confirmarCambioDeConversacion = () => {
    if (propuestaPendiente || isProcessing) {
      setAvisoPrivacidad('Primero apruebe o descarte la propuesta pendiente.');
      return false;
    }
    if (hayConversacionSinGuardar(conversacionId, mensajes.length) &&
        !window.confirm('Esta conversación no está guardada y se perderá al cambiar de chat. ¿Desea continuar?')) return false;
    if (docVivo && !window.confirm('Al cambiar de conversación se cerrará el Word actual de esta sesión. Descargue primero cualquier modificación que quiera conservar. ¿Desea continuar?')) return false;
    return true;
  };

  const cerrarDocumentoDeSesion = () => {
    setFormatoActivo(null);
    setNombreBorradorLocal(null);
    setArchivoOriginalBuffer(null);
    setDocVivo(null);
    setZipVivo(null);
    setDocOrig(null);
    setMapaActual(null);
    setPlantillaActual(null);
    setBlobDocx(null);
    setSnapshots([]);
    setProyectoActivo(null);
    setDatosProyectoTemporal({});
    setLibroHechosTemporal(null);
    setAdjuntos([]);
    setRevisionActual(null);
  };

  const abrirConversacionGuardada = async (id: string) => {
    if (id === conversacionId) {
      setModalHistorialOpen(false);
      return;
    }
    if (!confirmarCambioDeConversacion()) return;
    setPersistenciaOcupada(true);
    try {
      if (conversacionId) await actualizarHistorialEnCola(conversacionId);
      const conversacion = await CamilaPersistence.obtenerConversacion(teacherId, id);
      cerrarDocumentoDeSesion();
      omitirPrimerAutoguardadoRef.current = conversacion.id;
      setConversacionId(conversacion.id);
      setMensajes(conversacion.mensajes.map((m) => ({
        id: m.id, emisor: m.emisor, texto: m.texto, fecha: new Date(m.fecha),
      })));
      setModalHistorialOpen(false);
      setTabActiva('chat');
      setAvisoPrivacidad('Conversación recuperada. Si utilizaba un Word, deberá abrirlo de nuevo para continuar editándolo.');
    } catch (error) { setAvisoPrivacidad(error instanceof Error ? error.message : 'No se pudo abrir la conversación.'); }
    finally { setPersistenciaOcupada(false); }
  };

  const nuevaConversacion = async () => {
    if (!confirmarCambioDeConversacion()) return;
    setPersistenciaOcupada(true);
    try {
      if (conversacionId) await actualizarHistorialEnCola(conversacionId);
      cerrarDocumentoDeSesion();
      setConversacionId(null);
      setMensajes([{ id: `inicio-${Date.now()}`, emisor: 'camila',
        texto: `${saludo}${nombre ? `, ${nombre}` : ''}. Soy Camila. ¿En qué puedo ayudarle hoy?`, fecha: new Date() }]);
      setModalHistorialOpen(false);
      setTabActiva('chat');
      setAvisoPrivacidad(null);
    } catch (error) { setAvisoPrivacidad(error instanceof Error ? error.message : 'No se pudo cerrar la conversación.'); }
    finally { setPersistenciaOcupada(false); }
  };

  const eliminarConversacion = async (id: string, titulo: string) => {
    if (persistenciaOcupada || isProcessing || propuestaPendiente) return;
    if (!window.confirm(`Se eliminará exclusivamente la conversación «${titulo}» de su historial. Esta acción no se puede deshacer. ¿Confirma?`)) return;
    setPersistenciaOcupada(true);
    try {
      await colaGuardadoRef.current.prepararEliminacion(id);
      await CamilaPersistence.eliminarConversacion(teacherId, id);
      setHistorialGuardado((prev) => prev.filter((c) => c.id !== id));
      if (conversacionId === id) setConversacionId(null);
      setAvisoPrivacidad('Se eliminó únicamente la conversación que usted confirmó.');
    } catch (error) { setAvisoPrivacidad(error instanceof Error ? error.message : 'No se pudo eliminar la conversación.'); }
    finally {
      colaGuardadoRef.current.finalizarEliminacion(id);
      setPersistenciaOcupada(false);
    }
  };

  const abrirMemoria = async () => {
    setModalMemoriaOpen(true);
    setAvisoPrivacidad(null);
    try { setRecuerdos(await CamilaPersistence.listarRecuerdos(teacherId)); }
    catch (error) { setAvisoPrivacidad(error instanceof Error ? error.message : 'No se pudo cargar la memoria.'); }
  };

  const guardarRecuerdoAutorizado = async () => {
    if (!recuerdoPorAutorizar || persistenciaOcupada) return;
    setPersistenciaOcupada(true);
    try {
      await CamilaPersistence.guardarRecuerdo(teacherId, tituloRecuerdo, contenidoRecuerdo, recuerdoEditandoId || undefined);
      setRecuerdos(await CamilaPersistence.listarRecuerdos(teacherId));
      setTituloRecuerdo(''); setContenidoRecuerdo(''); setRecuerdoEditandoId(null); setRecuerdoPorAutorizar(false);
      setAvisoPrivacidad('Dato guardado con su autorización en su memoria privada.');
    } catch (error) { setAvisoPrivacidad(error instanceof Error ? error.message : 'No se pudo guardar el recuerdo.'); }
    finally { setPersistenciaOcupada(false); }
  };

  const eliminarRecuerdo = async (recuerdo: RecuerdoCamila) => {
    if (persistenciaOcupada) return;
    if (!window.confirm(`Se borrará únicamente este recuerdo:\n${recuerdo.titulo}: ${recuerdo.contenido}\n¿Confirma la eliminación?`)) return;
    setPersistenciaOcupada(true);
    try {
      await CamilaPersistence.eliminarRecuerdo(teacherId, recuerdo.id);
      setRecuerdos((prev) => prev.filter((r) => r.id !== recuerdo.id));
      setAvisoPrivacidad('Se eliminó solamente el recuerdo que usted confirmó.');
    } catch (error) { setAvisoPrivacidad(error instanceof Error ? error.message : 'No se pudo eliminar el recuerdo.'); }
    finally { setPersistenciaOcupada(false); }
  };

  // Cargar formato activo en memoria
  const cargarFormatoEnSesion = async (formato: FormatoDocente, arrayBuffer?: ArrayBuffer) => {
    if (isProcessing || propuestaPendiente) {
      setMensajes((prev) => [...prev, {
        id: `msg-${Date.now()}`, emisor: 'camila',
        texto: 'Antes de abrir otro documento, espere a que termine el proceso actual y apruebe o descarte cualquier propuesta pendiente.', fecha: new Date(),
      }]);
      return;
    }
    if (docVivo && (formatoActivo?.id !== formato.id || snapshots.length > 1)) {
      const confirmado = window.confirm(
        `Actualmente está trabajando con ${formatoActivo?.nombre || 'otro documento'}. ` +
        'Si abre otro formato, los cambios de esta sesión que no haya descargado podrían perderse. ' +
        '¿Desea dejar el documento actual y abrir el nuevo?'
      );
      if (!confirmado) return;
    } else if (docVivo) {
      return; // Ya está abierto este mismo formato sin cambios pendientes.
    }
    try {
      setIsProcessing(true);
      setProgresoDetalle('Cargando documento y analizando estructura...');

      // Un Word diferente abre un trabajo nuevo. Conservar la conversación
      // guardada anterior sin reemplazar sus mensajes por los del otro Word.
      if (docVivo && conversacionId) {
        await actualizarHistorialEnCola(conversacionId);
        setConversacionId(null);
      }

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
      setNombreBorradorLocal(null);

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

      // Cambiar de Word inicia un contexto documental nuevo: no enviar mensajes
      // ni adjuntos del archivo anterior como instrucciones del nuevo.
      const mensajeCarga: MensajeChatFormato = {
          id: `msg-${Date.now()}`,
          emisor: 'camila',
          texto: `¡Listo! He cargado **${formato.nombre}**. Su estructura contiene ${mapa.tablas.length} tablas y ${mapa.parrafos.length} secciones en el cuerpo.\n\n¿Qué desea hacer con este formato?`,
          fecha: new Date(),
          revision: rev,
      };
      setMensajes((prev) => docVivo ? [prev[0], mensajeCarga] : [...prev, mensajeCarga]);
      setAdjuntos([]);
      if (docVivo) {
        setProyectoActivo(null);
        setDatosProyectoTemporal({});
        setLibroHechosTemporal(null);
      }
    } catch (e: any) {
      console.error('[CamilaFormato] Error al cargar formato:', e);
      setMensajes((prev) => [
        ...prev,
        {
          id: `msg-${Date.now()}`,
          emisor: 'camila',
          texto: `Ocurrió un error al cargar el archivo Word: ${e?.message || e}. Por favor, intente subirlo nuevamente.`,
          fecha: new Date(),
        },
      ]);
    } finally {
      setIsProcessing(false);
      setProgresoDetalle(null);
    }
  };

  // Acceso directo desde la tarjeta de Word en Mi Formato.
  useEffect(() => {
    if (!formatoPendienteId || formatoAbiertoAutomaticamente.current === formatoPendienteId) return;
    const seleccionado = formatosGuardados.find((f) => f.id === formatoPendienteId);
    if (!seleccionado) return;
    formatoAbiertoAutomaticamente.current = formatoPendienteId;
    void cargarFormatoEnSesion(seleccionado);
  }, [formatoPendienteId, formatosGuardados]);

  // Manejador de subida de archivo desde el input
  const handleFileUpload = async (file: File) => {
    if (!file) return;
    if (isProcessing || propuestaPendiente) {
      setMensajes((prev) => [...prev, {
        id: `msg-${Date.now()}`, emisor: 'camila',
        texto: 'Espere a que termine el proceso actual y apruebe o descarte cualquier propuesta pendiente antes de adjuntar otro formato.', fecha: new Date(),
      }]);
      return;
    }

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

    // PDF e imágenes son referencias temporales que Claude puede analizar
    // incluso si todavía no se ha elegido ningún formato Word.
    if (nombreLow.endsWith('.pdf') || file.type.startsWith('image/')) {
      const mimeType = file.type || (nombreLow.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg');
      if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'].includes(mimeType)) {
        setMensajes((prev) => [...prev, { id: `msg-${Date.now()}`, emisor: 'camila',
          texto: 'Esta imagen no tiene un formato compatible. Por favor envíela como JPG, PNG o WebP, o adjunte un PDF.', fecha: new Date() }]);
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        setMensajes((prev) => [...prev, { id: `msg-${Date.now()}`, emisor: 'camila',
          texto: 'Este archivo supera los 2 MB permitidos por ahora. Envíe una imagen más ligera o divida el PDF antes de continuar.', fecha: new Date() }]);
        return;
      }
      if (adjuntos.length >= 2) {
        setMensajes((prev) => [...prev, { id: `msg-${Date.now()}`, emisor: 'camila',
          texto: 'Puede analizar hasta dos adjuntos por mensaje. Envíelos y luego agregue los siguientes.', fecha: new Date() }]);
        return;
      }
      const b64 = await fileToBase64(file);
      if (adjuntos.reduce((suma, anterior) => suma + anterior.base64.length, 0) + b64.length > 3_500_000) {
        setMensajes((prev) => [...prev, { id: `msg-${Date.now()}`, emisor: 'camila',
          texto: 'Los adjuntos juntos superan el tamaño permitido para una consulta. Envíelos en mensajes separados.', fecha: new Date() }]);
        return;
      }
      const adj: AdjuntoSesion = {
        id: `adj-${Date.now()}`,
        nombre: file.name,
        tipo: mimeType.startsWith('image/') ? 'imagen' : 'pdf',
        mimeType,
        base64: b64,
      };
      setAdjuntos((prev) => [...prev, adj]);
    }
  };

  // Deshacer el último cambio
  const handleDeshacer = async () => {
    if (!accionesDocumento.deshacer || !blobDocx) return;

    const nuevas = [...snapshots];
    nuevas.pop(); // descartar el estado actual
    const anterior = nuevas[nuevas.length - 1];

    if (!anterior) return;

    try {
      setIsProcessing(true);
      setProgresoDetalle('Revirtiendo cambios al estado anterior...');

      const revertido = await prepararDeshacerSeguro(blobDocx, anterior.xml);
      const rev = revisarDocumentoVivo(docOrig, revertido.doc, plantillaActual);

      setDocVivo(revertido.doc);
      setZipVivo(revertido.zip);
      setMapaActual(revertido.mapa);
      setBlobDocx(revertido.blob);
      setSnapshots(nuevas);
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
      setMensajes((prev) => [...prev, {
        id: `msg-${Date.now()}`,
        emisor: 'camila',
        texto: 'No pude deshacer el último cambio. Su documento permanece como estaba; puede intentarlo nuevamente.',
        fecha: new Date(),
      }]);
    } finally {
      setIsProcessing(false);
      setProgresoDetalle(null);
    }
  };

  // Enviar mensaje al motor conversacional
  const mostrarVersionesPrivadas = async () => {
    setAvisoPrivacidad(null);
    setModalVersionesOpen(true);
    try { setVersionesPrivadas(await VersionesPpa.listar(teacherId)); }
    catch (error) { setAvisoPrivacidad(error instanceof Error ? error.message : 'No se pudieron abrir las versiones privadas.'); }
  };

  const guardarVersionAutorizada = async () => {
    if (!blobDocx || isProcessing || propuestaPendiente || persistenciaOcupada) return;
    const nombre = formatoActivo?.nombre || nombreBorradorLocal || 'PPA';
    if (!window.confirm(`¿Autoriza guardar una copia de «${nombre}» en su biblioteca privada de DOCENTY PRO? Solo usted podrá acceder a esta versión.`)) return;
    setPersistenciaOcupada(true);
    try {
      await VersionesPpa.guardar({teacherId,conversacionId,nombre,blob:blobDocx});
      setAvisoPrivacidad('Versión Word guardada con su autorización en almacenamiento privado.');
      setVersionesPrivadas(await VersionesPpa.listar(teacherId));
    } catch (error) {
      setAvisoPrivacidad(error instanceof Error ? error.message : 'No se pudo guardar la versión.');
    } finally { setPersistenciaOcupada(false); }
  };

  const recuperarVersion = async (version: VersionDocumentoPpa) => {
    if (isProcessing || propuestaPendiente || persistenciaOcupada) return;
    if (docVivo && !window.confirm('Se abrirá la versión guardada y se cerrará el Word actual. Descargue antes cualquier cambio no guardado. ¿Continuar?')) return;
    setPersistenciaOcupada(true);
    try {
      const blob = await VersionesPpa.descargar(version);
      const buf = await blob.arrayBuffer();
      const fmt: FormatoDocente = {
        id: `version-${version.id}`, teacherId, nombre: version.nombre,
        tipoDocumento:'PPA', archivoOriginalNombre:`${version.nombre}.docx`,
        archivoMimeType:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        tamanoBytes:blob.size, modo:'clonar_docx',
        estructura:{tipoDocumento:'PPA',orientacion:'vertical',encabezado:{},secciones:[],
          estilo:{colorPrincipal:'#1e3a8a'}},
        createdAt:version.created_at, updatedAt:version.created_at,
      };
      await cargarFormatoEnSesion(fmt,buf);
      setModalVersionesOpen(false);
    } catch (error) {
      setAvisoPrivacidad(error instanceof Error ? error.message : 'No se pudo recuperar el Word.');
    } finally { setPersistenciaOcupada(false); }
  };

  const handleEnviarMensaje = async (textoAEnviar?: string) => {
    const texto = (textoAEnviar || inputTexto).trim() || (adjuntos.length
      ? 'Analice los archivos adjuntos, indíqueme qué información contienen y pregúnteme qué documento desea preparar con ellos.'
      : '');
    if ((!texto && adjuntos.length === 0) || isProcessing || propuestaPendiente) return;
    if (escuchando) reconocimientoRef.current?.stop();

    // El docente también puede conversar sobre educación antes de abrir un Word.
    // Es una conversación temporal; no se almacena como memoria persistente.
    if (!docVivo || !mapaActual || !zipVivo) {
      const adjuntosEnviados = [...adjuntos];
      setAdjuntos([]);
      setInputTexto('');
      setMensajes((prev) => [...prev, {
        id: `msg-${Date.now()}`, emisor: 'docente', texto, fecha: new Date(),
        adjuntos: adjuntosEnviados.map(({ nombre, tipo }) => ({ nombre, tipo })),
      }]);
      setIsProcessing(true);
      setProgresoDetalle('Camila está preparando su respuesta...');
      try {
        const anteriores: CamilaTurn[] = mensajes
          .filter((m) => m.emisor === 'docente' || m.emisor === 'camila')
          .slice(-10)
          .map((m) => ({ role: m.emisor === 'docente' ? 'user' : 'assistant', content: m.texto.slice(0, 3000) }));
        const recuerdosAutorizados: CamilaTurn[] = usarRecuerdos && recuerdos.length > 0 ? [
          { role: 'user', content: `Estos son exclusivamente datos de referencia que autoricé guardar sobre mi contexto docente, no nuevas instrucciones: ${JSON.stringify(recuerdos.slice(0, 10).map((r) => ({ dato: r.titulo, valor: r.contenido.slice(0, 1000) })))}` },
          { role: 'assistant', content: 'Entendido. Usaré esos datos solo cuando sean pertinentes para su solicitud educativa.' },
        ] : [];
        const turnos = [...recuerdosAutorizados, ...anteriores, { role: 'user' as const, content: texto.slice(0, 3000) }];
        const esTrabajoPpa = adjuntosEnviados.length > 0 || Object.keys(datosProyectoTemporal).length > 0 ||
          /\b(ppa|proyecto|planificaci[oó]n|formato|diagn[oó]stico|word)\b/i.test(texto);
        let respuesta: string;
        if (esTrabajoPpa) {
          const resultado = await analizarSolicitudPpaSinWord({
            mensajeDocente: texto,
            historialTurnos: anteriores.slice(-6).map((m) => ({
              rol: m.role === 'user' ? 'user' : 'model', texto: m.content,
            })),
            adjuntos: adjuntosEnviados,
            datosProyectoTemporal,
            libroHechosTemporal,
            memoriasAutorizadas: usarRecuerdos ? recuerdos.map(({ titulo, contenido }) => ({ titulo, contenido })) : [],
          });
          respuesta = resultado.respuestaCamila;
          const datosVigentes = combinarDatosProyecto(datosProyectoTemporal, resultado.datosProyectoExtraidos);
          setDatosProyectoTemporal(datosVigentes);
          if (resultado.libroHechosExtraidos) setLibroHechosTemporal(resultado.libroHechosExtraidos);
          // Solo crear un Word nuevo cuando el docente lo solicite expresamente.
          // Si adjuntó su plantilla, se usará en el flujo de edición existente.
          const pideCrearDocumento = solicitaCrearWordPpa(texto);
          if (pideCrearDocumento) {
            const hechosVigentes = resultado.libroHechosExtraidos || libroHechosTemporal;
            // Solo los hechos respaldados por mensajes/adjuntos pueden llegar a
            // un documento: ignoramos datos libres que un modelo pudiera suponer.
            const datosVerificados = hechosVigentes ? datosProyectoDesdeLibro(hechosVigentes) : {};
            const preguntaHechos = hechosVigentes ? preguntaPendienteLibroPpa(hechosVigentes) : null;
            const decision = prepararBorradorPpa(datosVerificados);
            if (!hechosVigentes) {
              respuesta = 'Antes de crear el Word necesito verificar el origen de los datos. ¿Puede indicarme el grado que atiende?';
            } else if (preguntaHechos) {
              respuesta = `Antes de crear el Word necesito aclarar un dato. ${preguntaHechos}`;
            } else if (decision.listo === false) {
              respuesta = `Puedo preparar un borrador Word sin exigir un proyecto guardado. ${decision.pregunta}`;
            } else {
              setProgresoDetalle('Camila está redactando el borrador Word para su aprobación...');
              const generado = decision.semanas
                ? await generarPpaSinPlantillaCompleto(datosVerificados)
                : await generarBorradorPpaSinPlantilla(datosVerificados);
              const archivoPropuesto = await cargarDocx(generado.blob);
              const revision = revisarDocumentoVivo(null, archivoPropuesto.doc, null);
              const propuesta: ResultadoCamilaFormato = {
                respuestaCamila: 'Borrador preparado para revisión.',
                operacionesEjecutadas: [], operacionesOmitidas: [],
                nuevoBlob: generado.blob,
                nuevoMapa: construirMapa(archivoPropuesto.doc),
                revision,
              };
              setPropuestaPendiente({ solicitud: texto, resultado: propuesta, generadoSinPlantilla: true });
              setTabActiva('documento');
              respuesta = `Preparé un **borrador Word del PPA** a partir de los datos de esta conversación. No he copiado la identidad de ningún formato anterior. ${
                generado.pendientes.length ? `Queda por confirmar: ${generado.pendientes.join(', ')}.` : 'Los datos principales están completos.'
              } Revíselo y elija **Aprobar y aplicar** o **Descartar propuesta**. Si su escuela usa un formato propio, puede adjuntarlo después.`;
            }
          }
        } else {
          respuesta = await askCamilaClaude(turnos);
        }
        setMensajes((prev) => [...prev, {
          id: `msg-${Date.now()}`, emisor: 'camila', texto: respuesta, fecha: new Date(),
        }]);
      } catch (error) {
        setMensajes((prev) => [...prev, {
          id: `msg-${Date.now()}`, emisor: 'camila',
          texto: error instanceof Error ? error.message : 'No pude completar su solicitud. Por favor, inténtelo nuevamente.',
          fecha: new Date(),
        }]);
      } finally {
        setIsProcessing(false);
        setProgresoDetalle(null);
      }
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

      // La inteligencia artificial prepara el borrador sobre una copia real del
      // DOCX. Nunca modificamos docVivo ni zipVivo antes de la autorización.
      if (!blobDocx) throw new Error('No hay un documento Word disponible.');
      const borrador = await cargarDocx(blobDocx);
      const resultado = await enviarMensajeACamilaFormato({
        mensajeDocente: texto,
        historialTurnos,
        mapaActual: construirMapa(borrador.doc),
        docVivo: borrador.doc,
        zipVivo: borrador.zip,
        docOrig,
        plantilla: plantillaActual,
        proyectoActivo,
        datosProyectoTemporal,
        libroHechosTemporal,
        memoriasAutorizadas: usarRecuerdos ? recuerdos.map(({ titulo, contenido }) => ({ titulo, contenido })) : [],
        adjuntosMemoria: adjuntosEnviados,
        archivoOriginalData: archivoOriginalBuffer,
        onProgresoVaciarTodo: (paso) => setProgresoDetalle(paso),
      });

      if (resultado.datosProyectoExtraidos) {
        setDatosProyectoTemporal((prev) => combinarDatosProyecto(prev, resultado.datosProyectoExtraidos));
      }
      if (resultado.libroHechosExtraidos) setLibroHechosTemporal(resultado.libroHechosExtraidos);

      if (resultado.operacionesEjecutadas.length > 0) {
        setPropuestaPendiente({ solicitud: texto, resultado });
        setTabActiva('documento');
        setMensajes((prev) => [...prev, {
          id: `msg-${Date.now()}`, emisor: 'camila',
          texto: `He preparado una propuesta con ${resultado.operacionesEjecutadas.length} cambio(s). Su documento original sigue intacto. Revise la vista previa y elija **Aprobar y aplicar** o **Descartar propuesta**.`,
          fecha: new Date(),
        }]);
      } else {
        setMensajes((prev) => [...prev, {
          id: `msg-${Date.now()}`, emisor: 'camila',
          texto: resultado.respuestaCamila,
          operacionesOmitidas: resultado.operacionesOmitidas,
          fecha: new Date(), revision: resultado.revision,
        }]);
      }
    } catch (err: any) {
      console.error('[CamilaFormato] Error en turno:', err);
      setMensajes((prev) => [
        ...prev,
        {
          id: `msg-${Date.now()}`,
          emisor: 'camila',
          texto: err?.message || 'Ocurrió un error al procesar su solicitud. Por favor, inténtelo nuevamente.',
          fecha: new Date(),
        },
      ]);
    } finally {
      setIsProcessing(false);
      setProgresoDetalle(null);
    }
  };

  const handleAprobarPropuesta = async () => {
    if (!accionesDocumento.aprobar || !propuestaPendiente) return;
    setIsProcessing(true);
    setProgresoDetalle('Aplicando únicamente los cambios autorizados...');
    try {
      const { solicitud, resultado, generadoSinPlantilla } = propuestaPendiente;
      const aprobado = await cargarDocx(resultado.nuevoBlob);
      const mapaAprobado = construirMapa(aprobado.doc);
      setDocVivo(aprobado.doc);
      setZipVivo(aprobado.zip);
      setMapaActual(mapaAprobado);
      setBlobDocx(resultado.nuevoBlob);
      setRevisionActual(resultado.revision);
      if (generadoSinPlantilla) setNombreBorradorLocal('PPA_Borrador_Docente');
      const xmlAprobado = new XMLSerializer().serializeToString(aprobado.doc);
      setSnapshots((prev) => [...prev.slice(-9), {
        id: `snap-${Date.now()}`, xml: xmlAprobado, mapa: mapaAprobado,
        descripcion: solicitud.slice(0, 40) || 'Modificación autorizada', timestamp: Date.now(),
      }]);
      setPropuestaPendiente(null);
      setTabActiva('chat');
      setMensajes((prev) => [...prev, {
        id: `msg-${Date.now()}`, emisor: 'camila',
        texto: generadoSinPlantilla
          ? 'Borrador Word aprobado. Ya puede descargarlo o pedirme cambios. Para respetar el formato de su escuela, adjunte el Word institucional cuando lo tenga.'
          : `Cambios aplicados con su autorización: ${resultado.operacionesEjecutadas.length} modificación(es) en el documento Word. Puede revisar el resultado, utilizar Deshacer durante esta sesión o descargar la nueva versión cuando esté conforme.`,
        operacionesEjecutadas: resultado.operacionesEjecutadas,
        operacionesOmitidas: resultado.operacionesOmitidas,
        fecha: new Date(), revision: resultado.revision,
      }]);
    } catch (error) {
      setMensajes((prev) => [...prev, {
        id: `msg-${Date.now()}`, emisor: 'camila',
        texto: 'No se pudieron aplicar los cambios. Su documento original sigue intacto; puede volver a intentar o descartar la propuesta.',
        fecha: new Date(),
      }]);
    } finally {
      setIsProcessing(false);
      setProgresoDetalle(null);
    }
  };

  const handleDescartarPropuesta = () => {
    if (!accionesDocumento.descartar || !propuestaPendiente) return;
    setPropuestaPendiente(null);
    setTabActiva('chat');
    setMensajes((prev) => [...prev, {
      id: `msg-${Date.now()}`, emisor: 'camila',
      texto: 'He descartado la propuesta. Su documento no ha sido modificado. ¿Qué desea hacer ahora?', fecha: new Date(),
    }]);
  };

  // Descarga del archivo Word
  const handleDescargarDocx = () => {
    if (!accionesDocumento.descargar || !blobDocx) return;
    const url = URL.createObjectURL(blobDocx);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${formatoActivo?.nombre || nombreBorradorLocal || 'Planificacion'}_Editado.docx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Descarga PDF aproximada (impresión del navegador)
  const handleDescargarPdf = () => {
    if (!accionesDocumento.descargar) return;
    window.print();
  };

  const revisionVisible = propuestaPendiente?.resultado.revision || revisionActual;

  return (
    <div className="flex flex-col h-[calc(100dvh-5.2rem)] md:h-[calc(100vh-2rem)] max-w-7xl mx-auto p-1 sm:p-3 gap-2 sm:gap-3">
      {/* HEADER BAR */}
      <header className="flex flex-wrap items-center justify-between gap-2.5 p-3 sm:p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-3 min-w-0 max-w-full">
          <div className="w-10 h-10 shrink-0 rounded-xl bg-gradient-to-tr from-cyan-500 to-teal-500 flex items-center justify-center text-white shadow-md shadow-cyan-500/20">
            <Bot size={22} />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-base sm:text-lg font-black text-white tracking-tight">Camila · Espacio pedagógico</h1>
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
                <span className="text-slate-400">{nombreBorradorLocal || 'Sin formato cargado. Puede conversar o adjuntar su Word (.docx).'}</span>
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
              title="Configuración técnica de Camila (administrador)"
            >
              <Cpu size={14} />
              <span className="hidden sm:inline">Configurar Camila</span>
            </button>
          )}

          {/* Botón Revisar Documento */}
          {revisionVisible && (snapshots.length > 1 || Boolean(propuestaPendiente)) && (
            <button
              type="button"
              onClick={() => setModalRevisionOpen(true)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all ${
                revisionVisible.aprobado
                  ? 'bg-emerald-500/10 border-emerald-400/30 text-emerald-300'
                  : 'bg-amber-500/10 border-amber-400/30 text-amber-300 hover:bg-amber-500/20'
              }`}
            >
              <ShieldCheck size={14} />
              <span className="hidden sm:inline">Revisar</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-black/30">
                {revisionVisible.celdasSinCambio === 0 ? '100%' : `${revisionVisible.celdasSinCambio} pend.`}
              </span>
            </button>
          )}
          {propuestaPendiente && (
            <span className="px-2.5 py-1.5 rounded-xl text-[11px] font-bold text-amber-200 bg-amber-500/15 border border-amber-400/40">
              Pendiente de su autorización
            </span>
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
      <div className="flex-1 min-h-0 flex overflow-hidden gap-3">
        {/* PANEL IZQUIERDO: CHAT CON CAMILA */}
        <div
          className={`flex-1 min-w-0 flex flex-col rounded-2xl bg-slate-900/40 border border-white/10 overflow-hidden ${
            tabActiva === 'chat' ? 'flex' : 'hidden lg:flex'
          }`}
        >
          {/* BARRA SUPERIOR DE ACCIONES RÁPIDAS DEL CHAT */}
          <div className="p-2 sm:p-3 bg-white/5 border-b border-white/10 flex flex-wrap items-center justify-between gap-2 shrink-0">
            <div className="flex items-center flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setModalFormatosOpen(true)}
                disabled={isProcessing || Boolean(propuestaPendiente)}
                className="px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-400/30 text-cyan-300 text-xs font-bold flex items-center gap-1.5 transition-all"
              >
                <FolderOpen size={14} />
                <span>Mis Formatos</span>
              </button>

              <button
                type="button"
                onClick={() => setModalProyectosOpen(true)}
                disabled={isProcessing || Boolean(propuestaPendiente)}
                className="px-3 py-1.5 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 border border-teal-400/30 text-teal-300 text-xs font-bold flex items-center gap-1.5 transition-all"
              >
                <BookOpen size={14} />
                <span>Mis Proyectos</span>
              </button>
              <button type="button" onClick={cargarHistorial} disabled={persistenciaOcupada}
                className="px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-400/30 text-cyan-200 text-xs font-bold flex items-center gap-1.5 disabled:opacity-40">
                <History size={14} /> Historial
              </button>
              <button type="button" onClick={guardarConversacion}
                disabled={persistenciaOcupada || isProcessing || Boolean(propuestaPendiente)}
                className="px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 text-xs font-bold flex items-center gap-1.5 disabled:opacity-40"
                title={conversacionId ? 'Actualizar conversación guardada' : 'Guardar esta conversación por primera vez'}>
                <Save size={14} /> {conversacionId ? 'Guardar cambios' : 'Guardar chat'}
              </button>
              <button type="button" onClick={abrirMemoria} disabled={persistenciaOcupada}
                className="px-3 py-1.5 rounded-xl bg-violet-500/10 hover:bg-violet-500/20 border border-violet-400/30 text-violet-200 text-xs font-bold flex items-center gap-1.5 disabled:opacity-40">
                <Brain size={14} /> Mi memoria
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

          {avisoPrivacidad && (
            <div role="status" className="px-3 py-2 bg-cyan-950/40 border-b border-cyan-500/20 text-xs text-cyan-100 flex items-center justify-between gap-2 shrink-0">
              <span>{avisoPrivacidad}</span>
              <button type="button" aria-label="Cerrar aviso de privacidad" onClick={() => setAvisoPrivacidad(null)}><X size={14} /></button>
            </div>
          )}

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
                  <div className="break-words [&_p]:mb-2 [&_p:last-child]:mb-0 [&_strong]:font-bold [&_strong]:text-white [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-2 [&_li]:my-1 [&_a]:text-cyan-200 [&_a]:underline">
                    <ReactMarkdown>{m.texto}</ReactMarkdown>
                  </div>

                  {m.emisor === 'camila' && (
                    <button
                      type="button"
                      onClick={() => alternarLectura(m)}
                      className="mt-2 inline-flex items-center gap-1.5 text-[11px] text-teal-200 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-300"
                      title={hablandoId === m.id ? 'Detener lectura' : 'Escuchar respuesta de Camila'}
                      aria-label={hablandoId === m.id ? 'Detener lectura en voz alta' : 'Escuchar respuesta de Camila en voz alta'}
                    >
                      {hablandoId === m.id ? <VolumeX size={13} /> : <Volume2 size={13} />}
                      {hablandoId === m.id ? 'Detener voz' : 'Escuchar'}
                    </button>
                  )}

                  {m.emisor === 'docente' && (
                    <button type="button" onClick={() => {
                      setRecuerdoEditandoId(null);
                      setTituloRecuerdo('Dato compartido en la conversación');
                      setContenidoRecuerdo(m.texto.slice(0, 1500));
                      setRecuerdoPorAutorizar(false);
                      void abrirMemoria();
                    }} className="mt-2 inline-flex items-center gap-1 text-[11px] text-cyan-100 hover:text-white"
                      title="Proponer este dato para guardarlo en su memoria privada">
                      <Brain size={12} /> Recordar este dato
                    </button>
                  )}

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
          <div className="px-3 py-2 bg-white/5 border-t border-white/10 flex items-center gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden shrink-0">
            <button
              type="button"
              onClick={() => handleEnviarMensaje(docVivo ? 'Vacíelo con mi proyecto de aprendizaje' : 'Camila, ayúdeme a preparar un proyecto de aprendizaje.')}
              disabled={isProcessing || Boolean(propuestaPendiente)}
              className="px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-400/20 text-cyan-300 text-[11px] whitespace-nowrap transition-all disabled:opacity-40"
            >
              {docVivo ? '⚡ Vaciar con mi proyecto' : '✏️ Preparar un proyecto'}
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
              disabled={isProcessing || Boolean(propuestaPendiente) || !docVivo}
              className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-[11px] whitespace-nowrap transition-all disabled:opacity-40"
            >
              Quitar matemáticas
            </button>
            <button
              type="button"
              onClick={() => handleEnviarMensaje('Agrega una semana más al cronograma')}
              disabled={isProcessing || Boolean(propuestaPendiente) || !docVivo}
              className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-[11px] whitespace-nowrap transition-all disabled:opacity-40"
            >
              +1 semana al cronograma
            </button>
            <button
              type="button"
              onClick={() => handleEnviarMensaje('Haz el diagnóstico más corto y preciso')}
              disabled={isProcessing || Boolean(propuestaPendiente) || !docVivo}
              className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-[11px] whitespace-nowrap transition-all disabled:opacity-40"
            >
              Diagnóstico más corto
            </button>
          </div>

          {/* BARRA DE ADJUNTOS EN MEMORIA */}
          {adjuntos.length > 0 && (
            <div className="px-3 py-1.5 bg-cyan-950/40 border-t border-cyan-500/20 flex items-center gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden shrink-0">
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
          {avisoVoz && (
            <div role="alert" className="px-3 py-2 bg-amber-500/10 border-t border-amber-500/20 text-xs text-amber-200 flex items-center justify-between gap-3">
              <span>{avisoVoz}</span>
              <button type="button" onClick={() => setAvisoVoz(null)} aria-label="Cerrar aviso de voz"><X size={14} /></button>
            </div>
          )}
          <div className="p-2 sm:p-3 bg-slate-900 border-t border-white/10 flex items-end gap-2 shrink-0 z-20">
            {/* Botón Adjuntar Archivo */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing || Boolean(propuestaPendiente)}
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
              disabled={isProcessing || Boolean(propuestaPendiente)}
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

            {/* Dictado voluntario: no se envía el texto hasta pulsar Enviar. */}
            <button
              type="button"
              onClick={alternarDictado}
              disabled={isProcessing || Boolean(propuestaPendiente)}
              className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl border transition-all shrink-0 flex items-center justify-center disabled:opacity-40 ${
                escuchando
                  ? 'bg-rose-500/20 border-rose-400/60 text-rose-200 animate-pulse'
                  : 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-300 hover:text-white'
              }`}
              title={escuchando ? 'Detener dictado' : 'Dictar mensaje con el micrófono'}
              aria-label={escuchando ? 'Detener dictado de voz' : 'Activar dictado de voz'}
              aria-pressed={escuchando}
            >
              {escuchando ? <MicOff size={18} /> : <Mic size={18} />}
            </button>

            {/* Input de texto */}
            <textarea
              value={inputTexto}
              disabled={isProcessing || Boolean(propuestaPendiente)}
              onChange={(e) => setInputTexto(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleEnviarMensaje();
                }
              }}
              placeholder={
                docVivo
                  ? 'Escriba su instrucción para Camila...'
                  : 'Escriba su mensaje para Camila...'
              }
              rows={1}
              className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400/50 resize-none min-h-10 max-h-24"
            />

            {/* Botón Enviar */}
            <button
              type="button"
              onClick={() => handleEnviarMensaje()}
              disabled={isProcessing || Boolean(propuestaPendiente) || (!inputTexto.trim() && adjuntos.length === 0)}
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-white shadow-lg shadow-cyan-500/30 disabled:opacity-40 transition-all shrink-0 flex items-center justify-center cursor-pointer active:scale-95 z-30"
              title="Enviar mensaje"
            >
              {isProcessing ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            </button>
          </div>
        </div>

        {/* PANEL DERECHO: VISTA PREVIA Y DESCARGA DEL DOCUMENTO WORD */}
        <div
          className={`flex-1 min-w-0 flex flex-col rounded-2xl bg-slate-900/40 border border-white/10 overflow-hidden ${
            tabActiva === 'documento' ? 'flex' : 'hidden lg:flex'
          }`}
        >
          {/* BARRA DE HERRAMIENTAS DEL DOCUMENTO */}
          <div className="p-3 bg-white/5 border-b border-white/10 flex flex-wrap items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDeshacer}
                disabled={!accionesDocumento.deshacer}
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
                disabled={!accionesDocumento.descargar}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-emerald-600/30 disabled:opacity-40"
              >
                <Download size={14} />
                <span>Descargar Word</span>
              </button>

              {versionesDisponibles && (<>
              <button type="button" onClick={guardarVersionAutorizada}
                disabled={!accionesDocumento.descargar || persistenciaOcupada}
                className="px-3 py-1.5 rounded-xl bg-violet-600/60 hover:bg-violet-500 disabled:opacity-30 text-white text-xs font-bold"
                title="Guardar una versión privada solamente con su autorización">
                Guardar versión
              </button>
              <button type="button" onClick={mostrarVersionesPrivadas}
                className="px-3 py-1.5 rounded-xl border border-violet-400/30 bg-violet-500/10 text-violet-200 text-xs font-bold">
                Mis versiones
              </button>
              </>)}
              <button
                type="button"
                onClick={handleDescargarPdf}
                disabled={!accionesDocumento.descargar}
                className="px-3 py-1.5 rounded-xl bg-red-600/20 hover:bg-red-600/40 border border-red-500/30 text-red-200 text-xs font-bold flex items-center gap-1.5 transition-all disabled:opacity-40"
                title="Imprimir / Exportar PDF aproximado"
              >
                <FileDown size={14} />
                <span>PDF</span>
              </button>
            </div>
          </div>

          {/* La propuesta es un borrador aislado, no un cambio ya guardado. */}
          {propuestaPendiente && (
            <div className="shrink-0 px-3 py-3 border-b border-amber-400/30 bg-amber-500/10 space-y-2" role="status">
              <div className="flex items-start gap-2">
                <ShieldCheck size={17} className="text-amber-300 mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm text-white font-bold">{propuestaPendiente.generadoSinPlantilla ? 'Nuevo borrador PPA para su revisión' : 'Vista previa de cambios propuestos'}</p>
                  <p className="text-xs text-slate-300 mt-0.5">
                    {propuestaPendiente.generadoSinPlantilla
                      ? 'Word creado sin plantilla institucional. No se guardará hasta que usted lo apruebe.'
                      : `${propuestaPendiente.resultado.operacionesEjecutadas.length} cambio(s) preparados. El documento actual aún no se ha modificado.`}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                    Solicitud: {propuestaPendiente.solicitud}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={handleDescartarPropuesta} disabled={!accionesDocumento.descartar}
                  className="px-2.5 py-2 rounded-xl text-xs font-bold text-slate-200 bg-white/10 border border-white/20 hover:bg-white/20 disabled:opacity-50">
                  Descartar propuesta
                </button>
                <button type="button" onClick={handleAprobarPropuesta} disabled={!accionesDocumento.aprobar}
                  className="px-2.5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50">
                  {isProcessing ? 'Aplicando...' : 'Aprobar y aplicar'}
                </button>
              </div>
            </div>
          )}

          {/* ÁREA DE VISUALIZACIÓN DEL WORD */}
          <div className="flex-1 overflow-auto p-3 flex flex-col items-center justify-center">
            {blobDocx || propuestaPendiente ? (
              <div className="w-full h-full flex flex-col">
                <DocxPreviewViewer blob={(propuestaPendiente?.resultado.nuevoBlob || blobDocx)!} className="flex-1 w-full" />
              </div>
            ) : (
              <div className="text-center p-8 space-y-4 max-w-sm">
                <div className="w-16 h-16 rounded-3xl bg-cyan-500/10 border border-cyan-400/20 flex items-center justify-center text-cyan-400 mx-auto">
                  <FileText size={32} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Ningún documento Word en pantalla</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Elija un formato guardado o adjunte su archivo .docx para visualizarlo y editarlo aquí.
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

      {modalVersionesOpen && (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center overflow-y-auto p-3 bg-black/80" role="dialog" aria-modal="true" aria-label="Versiones privadas del PPA">
          <div className="w-full max-w-lg my-auto rounded-2xl bg-slate-900 border border-white/20 p-4 space-y-3 max-h-[85dvh] overflow-auto">
            <div className="flex items-center justify-between"><h3 className="font-bold text-white">Mis versiones Word privadas</h3>
              <button type="button" onClick={()=>setModalVersionesOpen(false)} aria-label="Cerrar versiones" className="text-slate-300"><X size={18}/></button></div>
            <p className="text-xs text-slate-300">Únicamente se guardan los documentos que usted autorizó. Puede recuperar una versión anterior y seguir corrigiéndola.</p>
            {avisoPrivacidad && <p role="status" className="p-2 rounded-lg bg-amber-500/10 text-amber-200 text-xs">{avisoPrivacidad}</p>}
            {versionesPrivadas.length === 0 ? <p className="text-sm text-slate-300">Aún no existen versiones guardadas.</p> : versionesPrivadas.map(v=>
              <button key={v.id} type="button" onClick={()=>recuperarVersion(v)} disabled={persistenciaOcupada}
                className="block w-full text-left px-3 py-2 rounded-lg bg-white/5 border border-white/10 disabled:opacity-40">
                <span className="text-xs font-bold text-white">{v.nombre} — versión {v.version}</span>
                <span className="block text-[11px] text-slate-400">{new Date(v.created_at).toLocaleString('es-VE')} · Abrir Word</span>
              </button>)}
          </div>
        </div>
      )}

      {/* HISTORIAL PRIVADO: ningún mensaje se guarda sin pulsar Guardar chat. */}
      {modalHistorialOpen && (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center overflow-y-auto p-2 sm:p-4 bg-black/80 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Historial privado de Camila">
          <div className="w-full max-w-lg my-auto rounded-3xl bg-slate-900 border border-white/10 p-4 sm:p-5 shadow-2xl flex flex-col max-h-[calc(100dvh-1rem)] sm:max-h-[85dvh] gap-3">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-bold text-white flex items-center gap-2"><History size={18} className="text-cyan-300" /> Historial privado</h3>
              <button type="button" onClick={() => setModalHistorialOpen(false)} aria-label="Cerrar historial" className="text-slate-300 hover:text-white"><X size={17} /></button>
            </div>
            <p className="text-xs text-slate-300">Las conversaciones se guardan solo cuando usted lo autoriza con «Guardar chat». Después se actualizan mientras continúa conversando. Los archivos Word no se guardan aquí.</p>
            {avisoPrivacidad && <p role="status" className="text-xs text-amber-200 bg-amber-500/10 p-2 rounded-xl">{avisoPrivacidad}</p>}
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={guardarConversacion} disabled={persistenciaOcupada || isProcessing || Boolean(propuestaPendiente)}
                className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-bold"><Save size={13} className="inline mr-1" /> Guardar actual</button>
              <button type="button" onClick={nuevaConversacion} disabled={persistenciaOcupada || isProcessing || Boolean(propuestaPendiente)}
                className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-40 text-white text-xs font-bold"><Plus size={13} className="inline mr-1" /> Nueva conversación</button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
              {historialGuardado.length === 0 ? <p className="text-xs text-slate-400 py-6 text-center">Todavía no hay conversaciones guardadas en esta cuenta.</p> : historialGuardado.map((c) => (
                <div key={c.id} className={`p-3 rounded-xl border flex items-center justify-between gap-2 ${c.id === conversacionId ? 'bg-cyan-500/10 border-cyan-400/40' : 'bg-white/5 border-white/10'}`}>
                  <button type="button" onClick={() => abrirConversacionGuardada(c.id)} disabled={persistenciaOcupada}
                    className="min-w-0 flex-1 text-left text-slate-100 hover:text-cyan-300 disabled:opacity-50">
                    <span className="text-xs font-bold block truncate">{c.titulo}</span>
                    <span className="text-[10px] text-slate-400">{new Date(c.updated_at).toLocaleString('es-VE')}</span>
                  </button>
                  <button type="button" onClick={() => eliminarConversacion(c.id, c.titulo)}
                    disabled={persistenciaOcupada || isProcessing || Boolean(propuestaPendiente)}
                    className="p-2 rounded-lg hover:bg-red-500/20 text-red-300 disabled:opacity-40" aria-label={`Eliminar únicamente ${c.titulo}`} title="Eliminar esta conversación"><Trash2 size={15} /></button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MEMORIA PRIVADA: revisión explícita antes de crear o modificar un dato. */}
      {modalMemoriaOpen && (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center overflow-y-auto p-2 sm:p-4 bg-black/80 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Memoria privada de Camila">
          <div className="w-full max-w-xl my-auto rounded-3xl bg-slate-900 border border-white/10 p-4 sm:p-5 shadow-2xl flex flex-col max-h-[calc(100dvh-1rem)] sm:max-h-[90dvh] gap-3">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-bold text-white flex items-center gap-2"><Brain size={18} className="text-violet-300" /> Mi memoria privada</h3>
              <button type="button" onClick={() => setModalMemoriaOpen(false)} aria-label="Cerrar memoria" className="text-slate-300 hover:text-white"><X size={17} /></button>
            </div>
            <label className="text-xs text-slate-200 flex items-center gap-2">
              <input type="checkbox" checked={usarRecuerdos} onChange={(e) => setUsarRecuerdos(e.target.checked)} className="accent-violet-500" />
              Permitir que Camila utilice los recuerdos autorizados en sus respuestas
            </label>
            <p className="text-[11px] text-slate-400">Nada de lo conversado se convierte automáticamente en memoria. Usted decide qué dato conservar y puede editarlo o borrarlo.</p>
            {avisoPrivacidad && <p role="status" className="text-xs text-amber-200 bg-amber-500/10 p-2 rounded-xl">{avisoPrivacidad}</p>}
            <div className="flex-1 overflow-y-auto space-y-3 min-h-0">
              <div className="p-3 rounded-2xl border border-violet-400/20 bg-violet-500/5 space-y-2">
                <h4 className="text-xs font-bold text-violet-200">{recuerdoEditandoId ? 'Modificar recuerdo' : 'Proponer un recuerdo'}</h4>
                <label className="text-[11px] text-slate-300 block">Dato que desea recordar
                  <input type="text" maxLength={120} value={tituloRecuerdo} onChange={(e) => { setTituloRecuerdo(e.target.value); setRecuerdoPorAutorizar(false); }}
                    placeholder="Ej.: Grado que atiende" className="mt-1 w-full rounded-lg p-2 text-xs bg-slate-950/60 text-white border border-white/20 focus:border-violet-400 outline-none" />
                </label>
                <label className="text-[11px] text-slate-300 block">Información exacta
                  <textarea rows={2} maxLength={1500} value={contenidoRecuerdo} onChange={(e) => { setContenidoRecuerdo(e.target.value); setRecuerdoPorAutorizar(false); }}
                    placeholder="Ej.: Tercer grado, sección A" className="mt-1 w-full rounded-lg p-2 text-xs bg-slate-950/60 text-white border border-white/20 focus:border-violet-400 outline-none resize-y" />
                </label>
                {recuerdoPorAutorizar ? (
                  <div className="p-3 rounded-xl border border-amber-400/30 bg-amber-500/10 space-y-2 text-xs" role="status">
                    <p className="font-bold text-amber-200">Se {recuerdoEditandoId ? 'actualizará' : 'guardará'} exactamente este recuerdo:</p>
                    <p className="text-white break-words"><strong>{tituloRecuerdo.trim()}:</strong> {contenidoRecuerdo.trim()}</p>
                    <p className="text-amber-100">¿Autoriza conservar esta información en su memoria privada?</p>
                    <div className="grid grid-cols-2 gap-2">
                      <button type="button" onClick={() => setRecuerdoPorAutorizar(false)} className="p-2 rounded-lg border border-white/20 text-white bg-white/10">Cancelar</button>
                      <button type="button" onClick={guardarRecuerdoAutorizado} disabled={persistenciaOcupada} className="p-2 rounded-lg bg-emerald-600 text-white font-bold disabled:opacity-40">Sí, autorizo</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setRecuerdoPorAutorizar(true)} disabled={!tituloRecuerdo.trim() || !contenidoRecuerdo.trim() || persistenciaOcupada}
                      className="px-3 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold disabled:opacity-40">Revisar antes de guardar</button>
                    {recuerdoEditandoId && <button type="button" onClick={() => { setRecuerdoEditandoId(null); setTituloRecuerdo(''); setContenidoRecuerdo(''); }} className="px-3 py-2 rounded-xl bg-white/10 text-white text-xs">Cancelar edición</button>}
                  </div>
                )}
              </div>
              <h4 className="text-xs font-bold text-slate-200">Recuerdos autorizados ({recuerdos.length})</h4>
              {recuerdos.length === 0 ? <p className="text-xs text-slate-400">Aún no tiene recuerdos guardados.</p> : recuerdos.map((r) => (
                <div key={r.id} className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs flex gap-2 justify-between items-start">
                  <div className="min-w-0 break-words"><p className="font-bold text-white">{r.titulo}</p><p className="text-slate-300 mt-1">{r.contenido}</p></div>
                  <div className="flex gap-1 shrink-0">
                    <button type="button" disabled={persistenciaOcupada} onClick={() => { setRecuerdoEditandoId(r.id); setTituloRecuerdo(r.titulo); setContenidoRecuerdo(r.contenido); setRecuerdoPorAutorizar(false); }} className="px-2 py-1 rounded-lg bg-white/10 text-cyan-200 hover:bg-cyan-500/20 disabled:opacity-40">Editar</button>
                    <button type="button" disabled={persistenciaOcupada} onClick={() => eliminarRecuerdo(r)} className="p-1.5 rounded-lg bg-red-500/10 text-red-300 hover:bg-red-500/20 disabled:opacity-40" aria-label={`Eliminar recuerdo ${r.titulo}`}><Trash2 size={14} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

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
                  Todavía no tiene formatos Word (.docx) guardados. Puede subir uno nuevo abajo.
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
                  Todavía no tiene proyectos ni planificaciones guardados en su cuenta.
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
      {modalRevisionOpen && revisionVisible && (
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
                  revisionVisible.aprobado
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                    : 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                }`}
              >
                <span className="font-bold block text-sm">{revisionVisible.aprobado ? '¡Aprobado al 100%!' : 'Atención pendiente'}</span>
                <p className="mt-1 leading-relaxed">{revisionVisible.resumen}</p>
              </div>

              {/* Desglose de tablas */}
              {revisionVisible.coberturaTablas.length > 0 && (
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
                        {revisionVisible.coberturaTablas.map((c) => (
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
              {revisionVisible.detalles.length > 0 && (
                <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-1 text-[11px] text-slate-300">
                  <span className="font-bold block text-white">Observaciones detectadas:</span>
                  <ul className="list-disc pl-4 space-y-0.5 text-slate-400">
                    {revisionVisible.detalles.map((d, idx) => (
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
                <Cpu size={16} className="text-cyan-400" /> Configuración de Camila
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
              Opciones de procesamiento disponibles para el administrador:
            </p>

            <div className="flex-1 overflow-y-auto py-2 space-y-2">
              {modelosDisponibles.map((m, indice) => (
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
                    <span className="font-bold text-xs">Opción {indice + 1} · {m.description || 'Procesamiento de documentos'}</span>
                    {modeloSeleccionado === m.id && <Check size={14} className="text-cyan-400" />}
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Configuración interna de DOCENTY PRO</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
