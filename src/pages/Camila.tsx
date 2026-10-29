import { useState, useRef, useEffect } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { generateContentWithRetry } from '../lib/gemini';
import { SupabaseService } from '../lib/supabaseService';
import { Bot, User, Send, Loader2, Volume2, VolumeX, Mic, MicOff, Radio, X, Sparkles, MessageCircle, FileUp } from 'lucide-react';
import Markdown from 'react-markdown';
import { puedeVerMiFormato } from '../config/features';
import { SesionVozCamila } from '../lib/camila/vozEnVivo';

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
}

export function CamilaInner({ teacherId, isEmbedded, onClose, mode = 'chat', isAdmin }: { teacherId: string, isEmbedded?: boolean, onClose?: () => void, mode?: 'chat' | 'sales', isAdmin?: boolean }) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [isConnectingVoice, setIsConnectingVoice] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    if (mode === 'sales') {
      const salesGreeting = '¡Hola! Mira, ¿estás interesado en Docenty Pro By Reymon Castillo? Soy Camila y estoy aquí para mostrarte cómo más de 1200 colegas ya están ahorrando horas de trabajo administrativo gracias a mi ayuda. Nuestra plataforma, creada por el ingeniero venezolano de Apure, Reymon Castillo, es la más fácil de usar y está totalmente adaptada a nuestra pedagogía. ¿Te gustaría saber cómo puedes obtener tu acceso total por solo $2 dólares al cambio del BCV?';
      setMessages([
        { id: 'welcome', role: 'model', text: salesGreeting }
      ]);
    } else {
      setMessages([
        { id: 'welcome', role: 'model', text: '¡Hola! Soy Camila, tu asistente pedagógica avanzada de Docenty Pro By Reymon Castillo. ¿En qué te puedo ayudar a planificar hoy?' }
      ]);
    }
  }, [mode]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const isSingleListenRef = useRef(false);

  const sesionVozRef = useRef<SesionVozCamila | null>(null);

  useEffect(() => () => sesionVozRef.current?.detener(), []);

  // Use refs for closures inside event listeners
  const isLiveModeRef = useRef(isLiveMode);
  const isLoadingRef = useRef(isLoading);
  
  useEffect(() => { isLiveModeRef.current = isLiveMode; }, [isLiveMode]);
  useEffect(() => { isLoadingRef.current = isLoading; }, [isLoading]);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView(); // Removed smooth behavior to avoid iOS WebView paint crashes
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle Speech Recognition setup
  useEffect(() => {
    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognitionAPI) {
      const recognition = new SpeechRecognitionAPI();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'es-ES';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        sendMessageRef.current(transcript);
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
        // Retry logic for loop mode
        if (event.error === 'no-speech' && isLiveModeRef.current && !isLoadingRef.current) {
           setTimeout(() => {
             if (isLiveModeRef.current && !isLoadingRef.current) {
               startListeningRef.current();
             }
           }, 100);
        } else if (event.error !== 'no-speech') {
           setIsLiveMode(false);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        if (isSingleListenRef.current) {
          isSingleListenRef.current = false;
        } else if (isLiveModeRef.current && !isLoadingRef.current) {
          // Restart loop if in live mode and not loading
          setTimeout(() => {
             if (isLiveModeRef.current && !isLoadingRef.current) {
                startListeningRef.current();
             }
          }, 100);
        }
      };

      recognitionRef.current = recognition;
    }
    
    return () => {
       if (recognitionRef.current) {
          recognitionRef.current.abort();
       }
       if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel();
       }
    };
  }, []);

  const startListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch (e) {
        // Ignored if already started
      }
    } else {
      alert("Tu navegador no soporta reconocimiento de voz.");
    }
  };
  const startListeningRef = useRef(startListening);
  useEffect(() => { startListeningRef.current = startListening; }, [startListening]);

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  const speakText = (text: string, onEndCallback?: () => void) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);

      // Clean up text for better dictation (remove json parts, markdown)
      let cleanText = text.replace(/\[SAVE_START\][\s\S]*?\[SAVE_END\]/g, '').trim();
      cleanText = cleanText.replace(/[*#_]+/g, '').replace(/\[.*?\]\(.*?\)/g, '');

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = 'es-ES';
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => {
        setIsSpeaking(false);
        if (onEndCallback) onEndCallback();
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
        if (onEndCallback) onEndCallback();
      };

      window.speechSynthesis.speak(utterance);
    } else {
      if (onEndCallback) onEndCallback();
    }
  };

  const toggleSpeech = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const startLiveAPI = async () => {
    if (sesionVozRef.current || isConnectingVoice || isLiveMode) return;
    setVoiceError(null);
    setIsConnectingVoice(true);
    stopListening();
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    const controlador = new SesionVozCamila({
      alConectar: () => { setIsConnectingVoice(false); setIsLiveMode(true); },
      alCerrar: () => {
        sesionVozRef.current = null;
        setIsConnectingVoice(false);
        setIsLiveMode(false);
      },
      alError: (mensaje) => setVoiceError(mensaje),
      alTurno: (usuario, camila) => {
        setMessages(actual => [
          ...actual,
          ...(usuario ? [{ id: crypto.randomUUID(), role: 'user' as const, text: usuario }] : []),
          ...(camila ? [{ id: crypto.randomUUID(), role: 'model' as const, text: camila }] : []),
        ]);
      },
    });
    sesionVozRef.current = controlador;
    await controlador.iniciar();
  };

  const stopLiveAPI = () => {
    sesionVozRef.current?.detener();
  };

  const toggleLiveMode = () => {
    if (isLiveMode) {
      stopLiveAPI();
    } else {
      stopListening(); // Ensure traditional speech recog is off
      window.speechSynthesis.cancel();
      startLiveAPI();

      // Greeting for sales mode when starting live mode
      if (mode === 'sales') {
        setTimeout(() => {
          speakText('¡Hola! Soy Camila. Es un gusto saludarte. He notado que estás explorando Docenty Pro By Reymon Castillo y me encantaría explicarte cómo puedes unirte a los más de mil doscientos docentes que ya usan nuestra plataforma. Fue creada por el ingeniero venezolano Reymon Castillo, nacido en Apure, pensando justamente en nuestras necesidades pedagógicas. Es tan fácil como hablar conmigo y pedirme lo que necesites. Puedes obtener tu código PRO por solo dos dólares al cambio del B C V pagando con Pago Móvil. Al tocar el botón de activación, hablarás directamente con Reymon. ¿Tienes alguna duda de cómo funciona o quieres que te explique los beneficios para tu grado?');
        }, 1200);
      }
    }
  };

  const handleSingleListen = () => {
    if (isLiveMode) return;
    if (isListening) {
      stopListening();
      isSingleListenRef.current = false;
    } else {
      isSingleListenRef.current = true;
      startListening();
    }
  };

  const handleSend = async (userMsg: string) => {
    if (!userMsg.trim() || !teacherId || isLoadingRef.current) return;

    setInput('');
    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', text: userMsg }]);
    setIsLoading(true);

    if (recognitionRef.current && isListening) {
      stopListening();
    }

    try {
      const systemInstruction = mode === 'sales' 
        ? `Tú eres Camila, experta en ventas de Docenty Pro By Reymon Castillo. Tu objetivo es convencer al docente de suscribirse.

Directrices:
1. INFORMACIÓN CLAVE Y NOMBRE:
   - Nombre oficial de la plataforma: "Docenty Pro By Reymon Castillo" (o Docenty PRO). Cuando te pregunten cómo se llama la plataforma o este sistema, responde que se llama "Docenty Pro By Reymon Castillo".
   - Somos más de 1200 docentes.
   - Creado por Reymon Castillo, Ingeniero venezolano nacido en Apure.
   - El botón de WhatsApp contacta DIRECTAMENTE con Reymon para cualquier duda o servicio profesional.
   - Pago móvil de $2 a tasa BCV por 30 días. NO INVENTES LOS DATOS DEL PAGO (móvil, banco, cédula). Di siempre que deben pedirlos por el botón de WhatsApp.
2. ESTILO: Muy profesional, amable y convincente.
3. CIERRE: Invita siempre a usar el botón de WhatsApp cuando estén listos para comprar o necesiten los datos reales de pago.`
        : `Tú eres Camila, la asistente virtual y pedagógica avanzada de la plataforma Docenty Pro By Reymon Castillo. Debes seguir estas directrices estrictas:

1. IDENTIDAD, NOMBRE Y CREADOR:
- Nombre oficial: "Docenty Pro By Reymon Castillo" (también referida como Docenty PRO). Si te preguntan cuál es el nombre de la plataforma, aplicación o software, debes responder con orgullo que se llama "Docenty Pro By Reymon Castillo".
- Reymon Castillo, Ingeniero de Sistemas nacido en Apure, Venezuela, es el creador y fundador de la plataforma.

2. CURRÍCULO OFICIAL EDUCACIÓN PRIMARIA MPPE 2026-2027:
- A partir de hoy, TODO Proyecto Pedagógico de Aula (PPA) o planificación de Primaria generado debe alinearse con el documento oficial del MPPE "Documento Educación Primaria 2026-2027" e incluir la mención: "Basado en los lineamientos del MPPE 2026-2027".
- Domina las cuatro áreas priorizadas oficiales y sus componentes:
  1) Prácticas del Lenguaje: Lectura, Escritura, Oralidad.
  2) Matemáticas: Geometría, Magnitudes y Medidas, Números y Operaciones, Estadística y Probabilidad.
  3) Ciencias Naturales: Salud Integral; Ciencia, Tecnología y Sociedad; Seres Vivos; Energía - Materia; La Tierra en el Universo; El Ambiente y sus Interacciones.
  4) Identidad (Ciencias Sociales, Historia, Geografía y Ciudadanía): 14 componentes (La Humanidad, Nuestro Mundo, Venezuela en el Mundo, Pueblos Indígenas, Pueblos Afrovenezolanos, Colonización Europea, Liberación de América, Libertador Simón Bolívar, Nación Agrícola, Nación Petrolera, Territorio Productivo, Democracia Venezolana, Cultura Venezolana, Sociedad y Ciudadanía).
- Redacta propósito, actividades (Exploración, Desarrollo, Reflexión), estrategias y evaluación alineados de forma estricta con los aprendizajes esperados oficiales del grado, citándolos tal cual.
- Respeta rigurosamente el nivel del grado (1° a 6°): jamás mezcles contenidos de otros grados.
- Contexto venezolano: En el área Identidad, resalta la identidad nacional, comunidad, soberanía y valores bolivarianos.
- Si el docente solicita algo fuera del currículo oficial, adviértelo amablemente y sugiere el componente y contenido oficial más cercano.

3. NIVEL MATERNAL (DEDICADO 0 a 3 años):
- Si el usuario te indica que es de Maternal, o pide planificaciones de Maternal (ej. Maternal I, Maternal II, Maternal III o Sala Cuna):
  a) Áreas Oficiales: Estructura siempre bajo las dos grandes áreas oficiales: "Formación Personal, Social y Comunicación" y "Relación entre los Componentes del Ambiente" (cada una con sus componentes y finalidades del cuadro organizador).
  b) Momentos de la Jornada: Define actividades para los momentos de: Recibimiento, Cuidado Diario/Fisiológico (Alimentación, Aseo, Descanso/Hábitos de higiene), Actividad Central, Juego Libre en Espacios (Expresar y Crear, Armar y Construir, Experimentar y Descubrir, Imitar y Representar) y Despedida.
  c) Evaluación: Utiliza como técnicas el Registro Descriptivo o las Escalas de Estimación del Desarrollo Evolutivo.
  d) Para guardar una planificación o proyecto de maternal, usa el formato de guardado con tipo "maternal".

4. MODALIDAD DE EDUCACIÓN ESPECIAL (Lineamientos MPPE 2026-2027):
- Tienes amplio conocimiento y experiencia técnica en Educación Especial en Venezuela. Atiendes docentes de Talleres de Educación Laboral (TEL), Institutos de Educación Especial (IEE), Aulas Integradas / UPE, CAIPA (Autismo) y CDIT.
- Condiciones atendidas: Trastorno del Espectro Autista (TEA / autismo), Síndrome de Down, Discapacidad Intelectual, TDAH, Compromiso Motor, Sordera/Hipoacusia (Lengua de Señas Venezolanas - LSV), Ceguera/Baja Visión (Braille) y Dificultades de Aprendizaje.
- Aplicas rigurosamente el Diseño Universal para el Aprendizaje (DUA):
  * Múltiples Formas de Representación (claves visuales, pictogramas ARASAAC, muestras reales, modelado).
  * Múltiples Formas de Acción y Expresión (tableros de comunicación, trabajo manual en taller, dramatizaciones, señalamiento).
  * Múltiples Formas de Implicación (motivación funcional, micro-metas, trabajo colaborativo, rincones sensoriales).
- Ajustes Razonables: Instrucciones segmentadas paso a paso, anticipación visual para evitar sobrecarga o ansiedad, dosificación de tiempos y pausas activas.
- Enfoque Socioproductivo en Taller Laboral: Línea de producción por fases (Paso 1 al 6), Plan de Inversión y cálculo de costos, e Informe Financiero.
- Planificación Semanal oficial con momentos DUA: Conceptualización (El qué), Generalización (El cómo) y Sistematización (El por qué).
- Cuando el docente te pida crear o guardar un Proyecto de Aprendizaje Socioproductivo o planificación de Educación Especial, responde con el proyecto completo y al final anexa el bloque oculto:
  [SAVE_START]{
    "tipo": "especial",
    "titulo": "Título del Proyecto de Ed Especial",
    "institucion": "Taller de Educación Laboral Carabobo",
    "servicio": "TEL",
    "condicion": "Trastorno del Espectro Autista (TEA)",
    "especialidad": "Panadería / Textil / Huerto / etc.",
    "mencion": "Auxiliar Ocupacional",
    "lapso": "I Momento Pedagógico",
    "anioEscolar": "2026-2027",
    "resumen": "Diagnóstico biopsicosocial...",
    "contenido_completo": "Texto completo del proyecto..."
  }[SAVE_END]`;

      // Build context history based on current states
      // Avoid Welcome message to prevent bloat if needed, but it helps context
      const historyContents = messages
        .filter(m => m.id !== 'welcome')
        .map(m => ({
          role: m.role,
          parts: [{ text: m.text }]
        }));
      
      historyContents.push({ role: 'user', parts: [{ text: userMsg }] });

      const response = await generateContentWithRetry({
        model: 'gemini-3.1-flash-lite',
        contents: historyContents,
        config: {
          systemInstruction,
          temperature: 0.7,
        }
      });

      let rawText = response.text || '';
      
      // Parse Secret JSON for Saving - ISOLATED IN ITS OWN TRY/CATCH
      try {
        const regex = /\[SAVE_START\]([\s\S]*?)\[SAVE_END\]/;
        const match = rawText.match(regex);

        if (match) {
          const jsonStr = match[1];
          const parsedData = JSON.parse(jsonStr);
          
          const tipo = (parsedData.tipo || '').toLowerCase();
          
          if (tipo.includes('especial')) {
            await SupabaseService.addPlanificacion({
              titulo: parsedData.titulo || parsedData.tituloProyecto || 'Proyecto de Educación Especial',
              proyecto: `${parsedData.servicio || 'TEL'} - ${parsedData.especialidad || 'Socioproductivo'} (${parsedData.mencion || 'General'})`,
              fechaInicio: parsedData.tiempoInicio || new Date().toISOString().split('T')[0],
              fechaFin: parsedData.tiempoFin || new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0],
              nivel: 'Educación Especial',
              diagnostico: JSON.stringify({
                institucion: parsedData.institucion || 'Taller de Educación Laboral',
                servicio: parsedData.servicio || 'TEL',
                condicion: parsedData.condicion || 'Trastorno del Espectro Autista (TEA)',
                especialidad: parsedData.especialidad || 'Socioproductiva',
                mencion: parsedData.mencion || 'General',
                lapso: parsedData.lapso || 'I Momento Pedagógico',
                anioEscolar: parsedData.anioEscolar || '2026-2027',
                docente: parsedData.docente || 'Docente Especialista',
                participantesV: parsedData.participantesV || 8,
                participantesH: parsedData.participantesH || 6,
                resumen: parsedData.resumen || 'Diagnóstico integral de Educación Especial'
              }),
              proposito: parsedData.contenido_completo || rawText.replace(regex, '').trim(),
              estrategias: '',
              recursos: '',
              evaluacion: ''
            }, teacherId);
          } else if (tipo.includes('maternal')) {
            await SupabaseService.addPlanificacion({
              titulo: parsedData.tituloProyecto || parsedData.titulo || 'Plan Maternal',
              proyecto: parsedData.tipoPlan || 'semanal_quincenal',
              fechaInicio: parsedData.tiempoInicio || new Date().toISOString().split('T')[0],
              fechaFin: parsedData.tiempoFin || new Date(Date.now() + 5*24*60*60*1000).toISOString().split('T')[0],
              nivel: 'Maternal_Plan',
              diagnostico: JSON.stringify({
                institucion: parsedData.institucion || 'C.E.I. Doctor Ramón Castillo',
                salaEdad: parsedData.salaEdad || 'Maternal (0 a 3 años)',
                anioEscolar: parsedData.anioEscolar || '2026-2027',
                matriculaVarones: parsedData.matriculaVarones || 8,
                matriculaHembras: parsedData.matriculaHembras || 10,
                matriculaTotal: (parsedData.matriculaVarones || 8) + (parsedData.matriculaHembras || 10),
                peicReferencia: parsedData.peicReferencia || 'Proyecto Educativo Productivo e Integrador',
                enfasisCurriculares: parsedData.enfasisCurriculares || ['Oralidad, Escritura y Lectura', 'Matemática para la vida'],
                hitosDesarrollo: parsedData.hitosDesarrollo || parsedData.resumen || 'Desarrollo motriz y del lenguaje',
                necesidadesFisiologicas: parsedData.necesidadesFisiologicas || 'Alimentación, descanso e higiene',
              }),
              proposito: parsedData.contenido_completo || rawText.replace(regex, '').trim(),
            }, teacherId);
          } else if (tipo.includes('proyecto')) {
            await SupabaseService.addPlanificacion({
              titulo: parsedData.titulo || 'Sin Título',
              proyecto: parsedData.titulo || 'Sin Título',
              fechaInicio: new Date().toISOString().split('T')[0],
              fechaFin: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0],
              nivel: 'Primaria',
              diagnostico: parsedData.resumen || '',
              proposito: parsedData.contenido_completo || rawText.replace(regex, '').trim(),
              estrategias: '',
              recursos: '',
              evaluacion: '',
              planesDiarios: []
            }, teacherId);
          } else if (tipo.includes('planificacion') || tipo.includes('plan')) {
            await SupabaseService.addPlanificacion({
              titulo: parsedData.titulo || 'Sin Título',
              proyecto: parsedData.titulo || 'Sin Título',
              fechaInicio: new Date().toISOString().split('T')[0],
              fechaFin: new Date().toISOString().split('T')[0],
              nivel: 'Primaria',
              diagnostico: parsedData.resumen || '',
              proposito: '',
              estrategias: '',
              recursos: '',
              evaluacion: '',
              planesDiarios: [{
                id: crypto.randomUUID(),
                fecha: new Date().toISOString().split('T')[0],
                temaDia: parsedData.titulo || 'Sin Título',
                contenido: parsedData.contenido_completo || rawText.replace(regex, '').trim(),
                createdAt: new Date().toISOString()
              }]
            }, teacherId);
          }
          
          rawText = rawText.replace(regex, '').trim();
        }
      } catch (jsonError) {
        console.error("Error al interceptar o interpretar el JSON de Camila:", jsonError);
        // We clean up the tags even if parsing failed, so the user doesn't see broken text
        rawText = rawText.replace(/\[SAVE_START\]([\s\S]*?)\[SAVE_END\]/g, '').trim();
      }

      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: rawText }]);
      
      // Synthesis & Loop Reactivation
      speakText(rawText);

    } catch (error: any) {
      console.error("Error de API detallado:", error);
      
      // ¡TRUCO DE DEPURACIÓN! Mostraremos el error exacto en la burbuja de chat para que sepamos qué falla:
      const msjErrorApi = error?.message || error?.statusText || JSON.stringify(error) || "Error desconocido";
      const errorMsg = `**Ups, tuve un error de conexión.**\nEl sistema me devolvió este mensaje:\n\`${msjErrorApi}\`\n\nPor favor, verifica el modelo o tu API Key.`;
      
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: errorMsg }]);
      speakText("Ups, tuve un error de conexión, verifica el mensaje en pantalla.", () => {
        if (isLiveModeRef.current) setIsLiveMode(false);
      });
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessageRef = useRef(handleSend);
  useEffect(() => { sendMessageRef.current = handleSend; }, [messages, teacherId]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessageRef.current(input);
  };

  return (
    <div className={`mx-auto flex flex-col glass-effect overflow-hidden relative shadow-2xl ${isEmbedded ? 'w-full h-full' : 'max-w-5xl w-full h-[80vh] min-h-[500px] sm:rounded-3xl neon-border'}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-futuristic-purple via-futuristic-purple to-futuristic-magenta px-6 py-4 flex items-center justify-between shadow-lg z-10 relative">
        <div className="flex items-center gap-4">
          <div className="bg-white/10 p-2.5 rounded-full border border-white/20 shadow-xl flex items-center justify-center relative overflow-hidden group">
            <div className="absolute inset-0 bg-futuristic-accent opacity-20 animate-pulse"></div>
            <Sparkles className="w-7 h-7 text-futuristic-accent relative z-10 group-hover:rotate-12 transition-transform" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white tracking-tighter flex items-center gap-2">
              CAMILA
              <span className="bg-futuristic-accent/20 text-futuristic-accent text-[9px] font-black px-2 py-0.5 rounded-full tracking-widest uppercase border border-futuristic-accent/30 shadow-[0_0_10px_rgba(0,242,255,0.2)]">SISTEMA IA</span>
            </h1>
            <p className="text-white/60 text-[10px] mt-0.5 font-bold uppercase tracking-widest">Protocolo de Asistencia Avanzada</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {mode !== 'sales' && isSpeaking && (
            <button 
              onClick={toggleSpeech}
              title="Detener voz"
              className="p-2 bg-red-500/80 hover:bg-red-500 text-white rounded-full transition-colors animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.4)]"
            >
              <VolumeX className="w-5 h-5" />
            </button>
          )}
          {mode !== 'sales' && !isSpeaking && 'speechSynthesis' in window && (
             <div title="Voz habilitada" className="p-2 text-futuristic-accent">
               <Volume2 className="w-5 h-5 opacity-80" />
             </div>
          )}
          {isEmbedded && onClose && (
            <button onClick={onClose} className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full ml-1 transition-all" title="Cerrar chat">
              <X className="w-6 h-6" />
            </button>
          )}
        </div>
      </div>

      {voiceError && (
        <div role="alert" className="px-5 py-2 bg-amber-500/15 text-amber-100 text-xs flex items-center justify-between gap-2 border-b border-amber-400/30">
          <span>{voiceError}</span>
          <button type="button" onClick={() => setVoiceError(null)} aria-label="Cerrar aviso de voz"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Messages Area - Modified for Sales Mode */}
      <div className={`flex-1 overflow-y-auto p-4 sm:p-6 relative scroll-smooth ${mode === 'sales' ? 'hex-bg flex items-center justify-center' : 'bg-transparent'}`}>
        {mode === 'sales' ? (
          <div className="max-w-md w-full space-y-10 text-center animate-in fade-in zoom-in duration-1000">
            <div className="relative inline-block mb-4">
              <div className="absolute inset-x-0 bottom-0 h-1 bg-futuristic-purple blur-2xl opacity-50"></div>
              <div className="absolute inset-0 bg-futuristic-purple/20 blur-3xl rounded-full animate-pulse"></div>
              <div className="relative w-32 h-32 bg-gradient-to-br from-futuristic-purple to-futuristic-magenta rounded-3xl flex items-center justify-center mx-auto shadow-[0_20px_50px_rgba(112,0,255,0.4)] rotate-3 hover:rotate-0 transition-transform duration-500">
                <Bot className="w-20 h-20 text-white" />
              </div>
            </div>

            <div className="space-y-8 pt-4">
              <div className="flex flex-col items-center gap-6">
                <a
                  href="https://wa.me/584262953484?text=Hola%20Camila,%20estoy%20convencido.%20Quiero%20comprar%20mi%20código%20PRO."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-black px-12 py-6 rounded-2xl shadow-[0_15px_30px_rgba(34,197,94,0.3)] transform transition-active hover:scale-105 active:scale-95 text-xl w-full sm:w-auto justify-center group"
                >
                  <MessageCircle size={32} className="fill-white group-hover:rotate-12 transition-transform" />
                  UNIRSE A DOCENTE PRO
                </a>
                <div className="flex flex-col gap-2">
                  <p className="text-futuristic-accent font-black text-lg tracking-widest uppercase">
                    PROYECTO: DOCENTE PRO
                  </p>
                  <p className="text-white/40 font-bold text-sm tracking-widest">
                    SOLO $2 USD / 30 DÍAS • TASA BCV
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {messages.map((message) => (
              <div 
                key={message.id} 
                className={`flex ${message.role === 'model' ? 'justify-start' : 'justify-end'} animate-in fade-in slide-in-from-bottom-5 duration-500`}
              >
                <div className={`flex gap-4 max-w-[92%] sm:max-w-[85%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  {/* Avatar */}
                  <div className={`flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center mt-1 transform transition-transform hover:scale-110
                    ${message.role === 'model' 
                      ? 'bg-gradient-to-br from-futuristic-purple to-futuristic-magenta shadow-[0_8px_15px_rgba(112,0,255,0.3)] border border-white/20' 
                      : 'bg-white/10 border border-white/20 backdrop-blur-md'}`}
                  >
                    {message.role === 'model' ? (
                      <Sparkles className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                    ) : (
                      <User className="w-6 h-6 sm:w-7 sm:h-7 text-white/50" />
                    )}
                  </div>
                  
                  {/* Bubble */}
                  <div 
                    className={`px-6 py-4 sm:px-7 sm:py-5 rounded-3xl text-sm sm:text-base leading-relaxed relative
                      ${message.role === 'user' 
                        ? 'bg-gradient-to-br from-futuristic-purple to-blue-600 text-white rounded-tr-none shadow-[0_10px_20px_rgba(112,0,255,0.2)]' 
                        : 'glass-effect text-white rounded-tl-none neon-border'}`}
                  >
                    <div className={`absolute top-0 ${message.role === 'user' ? '-right-2' : '-left-2'} w-4 h-4`}></div>
                    {message.role === 'user' ? (
                       <p className="whitespace-pre-wrap font-medium">{typeof message.text === 'string' ? message.text : ""}</p>
                    ) : (
                       <div className="text-sm sm:text-base prose prose-invert max-w-none prose-p:text-white prose-headings:text-futuristic-accent prose-strong:text-white prose-code:text-futuristic-magenta">
                         {message.text && typeof message.text === 'string' ? (
                           <Markdown>{message.text}</Markdown>
                         ) : null}
                       </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex justify-start animate-in fade-in slide-in-from-bottom-2">
                 <div className="flex gap-4 max-w-[85%] flex-row">
                   <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center mt-1 bg-gradient-to-br from-futuristic-purple to-futuristic-magenta shadow-[0_8px_15px_rgba(112,0,255,0.3)] border border-white/20">
                      <Sparkles className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                   </div>
                   <div className="px-7 py-5 rounded-3xl glass-effect rounded-tl-none neon-border flex items-center gap-3">
                     <div className="flex space-x-2">
                       <div className="w-2.5 h-2.5 rounded-full bg-futuristic-purple animate-bounce shadow-[0_0_8px_rgba(112,0,255,0.8)]" style={{ animationDelay: '0ms' }} />
                       <div className="w-2.5 h-2.5 rounded-full bg-futuristic-magenta animate-bounce shadow-[0_0_8px_rgba(255,0,200,0.8)]" style={{ animationDelay: '150ms' }} />
                       <div className="w-2.5 h-2.5 rounded-full bg-futuristic-accent animate-bounce shadow-[0_0_8px_rgba(0,242,255,0.8)]" style={{ animationDelay: '300ms' }} />
                     </div>
                   </div>
                 </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className={`p-4 glass-effect border-t border-white/10 relative z-10 rounded-b-2xl sm:rounded-b-3xl ${mode === 'sales' ? 'bg-black/40' : ''}`}>
        <div className="flex flex-col gap-4 max-w-4xl mx-auto">
          
          {mode === 'sales' ? (
            <div className="flex justify-center py-4">
               {!isLiveMode ? (
                 <button
                   type="button"
                   onClick={isConnectingVoice ? stopLiveAPI : startLiveAPI}
                   className="flex items-center gap-4 px-12 py-6 rounded-2xl font-black shadow-[0_15px_40px_rgba(112,0,255,0.3)] transform active:scale-95 bg-gradient-to-r from-futuristic-purple to-futuristic-magenta text-white hover:to-indigo-600 transition-all group border border-white/20"
                 >
                   <Radio className="w-10 h-10 group-hover:scale-110 transition-transform text-futuristic-accent" />
                   <span className="text-2xl uppercase tracking-tighter">{isConnectingVoice ? 'CANCELAR CONEXIÓN' : 'HABLAR CON CAMILA'}</span>
                 </button>
               ) : (
                 <div className="flex flex-col items-center justify-center p-2 animate-in fade-in zoom-in-95 duration-500 w-full">
                  <div className="text-futuristic-accent font-black mb-8 flex items-center gap-3 bg-white/5 px-8 py-4 rounded-full border border-futuristic-accent/30 shadow-[0_0_20px_rgba(0,242,255,0.2)] animate-pulse tracking-widest text-lg uppercase">
                    <Radio className="w-8 h-8" /> CAMILA TE ESCUCHA
                  </div>
                  <button
                    type="button"
                    onClick={stopLiveAPI}
                    className="bg-red-600/20 hover:bg-red-600/40 text-red-100 rounded-2xl font-black px-20 py-6 border border-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.2)] flex items-center justify-center gap-5 text-2xl active:scale-95 transition-all group"
                  >
                    <VolumeX className="w-10 h-10 group-hover:rotate-12 transition-transform" />
                    TERMINAR CONVERSACIÓN
                  </button>
                </div>
               )}
            </div>
          ) : (
            <>
              {!isLiveMode ? (
                <>
                  {/* Modo Voz / Hablar con Camila & Mi Formato Shortcuts */}
                  <div className="flex flex-wrap items-center justify-center gap-2 transition-opacity mb-2">
                    <button
                      type="button"
                      onClick={isConnectingVoice ? stopLiveAPI : startLiveAPI}
                      className="flex items-center gap-2 px-5 py-2 rounded-full font-black shadow-lg transform active:scale-95 bg-white/5 text-futuristic-accent hover:bg-futuristic-purple/20 border border-futuristic-accent/30 tracking-widest text-[10px] uppercase"
                    >
                      <Radio className="w-3.5 h-3.5 mr-1 animate-pulse" />
                      {isConnectingVoice ? 'CANCELAR CONEXIÓN' : 'HABLAR CON CAMILA'}
                    </button>
                    {puedeVerMiFormato(isAdmin) && (
                      <Link
                        to="/mi-formato"
                        className="flex items-center gap-1.5 px-4 py-2 rounded-full font-black shadow-lg transform active:scale-95 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20 border border-cyan-400/30 tracking-widest text-[10px] uppercase"
                      >
                        <FileUp size={13} className="text-cyan-400" />
                        MI FORMATO
                      </Link>
                    )}
                  </div>

                  <form onSubmit={handleFormSubmit} className="flex gap-2 relative items-end sm:items-center">
                    {/* Single Mic Listen */}
                    <button
                      type="button"
                      onClick={handleSingleListen}
                      disabled={isLoading}
                      className={`p-3 sm:p-4 rounded-2xl flex shrink-0 items-center justify-center shadow-lg transition-all ${
                        isListening 
                          ? 'bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]' 
                          : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-futuristic-accent border border-white/10 disabled:opacity-50'
                      }`}
                      title="Escuchar por micrófono (1 mensaje)"
                    >
                      {isListening ? <MicOff className="w-5 h-5 sm:w-6 sm:h-6" /> : <Mic className="w-5 h-5 sm:w-6 sm:h-6" />}
                    </button>

                    <textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder={isListening ? "Escuchando..." : "Pídele a Camila una planificación, idea o proyecto..."}
                      className="flex-1 px-5 py-3 sm:py-4 rounded-2xl border border-white/10 focus:border-futuristic-purple/50 focus:ring-2 focus:ring-futuristic-purple/20 outline-none transition-all text-sm sm:text-base bg-white/5 text-white placeholder-white/30 resize-none shadow-inner min-h-[56px]"
                      rows={1}
                      disabled={isLoading}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          if (input.trim() && !isLoading) handleFormSubmit(e as any);
                        }
                      }}
                    />

                    <button
                      type="submit"
                      disabled={!input.trim() || isLoading}
                      className="bg-gradient-to-br from-futuristic-purple to-futuristic-magenta hover:from-indigo-600 hover:to-purple-700 text-white rounded-2xl p-3 sm:px-8 sm:py-4 transition-all flex shrink-0 items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_10px_20px_rgba(112,0,255,0.2)] hover:shadow-[0_15px_25px_rgba(112,0,255,0.4)] active:scale-95"
                    >
                      <span className="hidden sm:inline font-black uppercase tracking-widest text-xs">Enviar</span>
                      <Send className="w-5 h-5 sm:w-6 sm:h-6" />
                    </button>
                  </form>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center p-2 pb-4 animate-in fade-in zoom-in-95 duration-500 w-full">
                  <div className="text-futuristic-accent font-black mb-6 flex items-center gap-3 bg-white/5 px-8 py-4 rounded-full border border-futuristic-accent/30 shadow-[0_0_20px_rgba(0,242,255,0.2)] animate-pulse tracking-widest text-lg uppercase">
                    <Radio className="w-6 h-6" /> CAMILA TE ESCUCHA
                  </div>
                  <button
                    type="button"
                    onClick={stopLiveAPI}
                    className="bg-red-600/20 hover:bg-red-600/40 text-red-100 rounded-2xl font-black px-20 py-6 border border-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.2)] flex items-center justify-center gap-5 text-2xl active:scale-95 transition-all group w-full sm:w-auto"
                  >
                    <VolumeX className="w-10 h-10 group-hover:rotate-12 transition-transform" />
                    TERMINAR CONVERSACIÓN
                  </button>
                </div>
              )}
            </>
          )}

          <div className="flex items-center justify-between px-2 mt-2">
            <span className="text-[10px] font-black tracking-widest text-white/30 uppercase flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-futuristic-accent animate-pulse"></div>
              Cifrado Pedagógico ACTIVO
            </span>
            <span className="text-[10px] font-black tracking-widest text-white/30 uppercase">
              Docenty Pro By Reymon Castillo v4.0.0
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Camila() {
  const context = useOutletContext<{ teacherId?: string, isGuest?: boolean, isAdmin?: boolean }>() || {};

  const handleShare = () => {
    const text = "¡Hola! Estoy usando Docenty Pro By Reymon Castillo, una plataforma increíble para docentes con IA. ¡Te la recomiendo! Visítala en: https://docente-pro-by-meta-tc.vercel.app/";
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="space-y-8 pb-16">
      <CamilaInner teacherId={context?.teacherId || 'invitado'} isEmbedded={false} isAdmin={context?.isAdmin} />
      
      <div className="flex justify-center">
        <button
          onClick={handleShare}
          className="flex items-center gap-3 px-8 py-4 bg-[#25D366] hover:bg-[#20ba5c] text-white font-bold rounded-full shadow-xl transition-all transform hover:scale-105 active:scale-95 border-2 border-white/20"
        >
          <MessageCircle className="w-6 h-6 fill-white" />
          Compartir con un Colega
        </button>
      </div>
    </div>
  );
}

