import { useState, useRef, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { GoogleGenAI, Type } from '@google/genai';
import { generateContentWithRetry } from '../lib/gemini';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Bot, User, Send, Loader2, Volume2, VolumeX, Mic, MicOff, Radio, X, Sparkles, MessageCircle } from 'lucide-react';
import Markdown from 'react-markdown';

// 1. Buscamos la variable en el formato de Vite (Vercel)
// 2. Si no está, buscamos en el formato de Node (AI Studio)
// 3. Si ambas fallan, usamos la llave de respaldo
const API_KEY = 
  (import.meta as any).env?.VITE_GEMINI_API_KEY || 
  (process as any).env?.GEMINI_API_KEY || 
  'AIzaSyBR2k22CAT-1q0ywdyZlgHj1jphap0-XHM';

const ai = new GoogleGenAI({ apiKey: API_KEY });

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
}

export function CamilaInner({ teacherId, isEmbedded, onClose, mode = 'chat' }: { teacherId: string, isEmbedded?: boolean, onClose?: () => void, mode?: 'chat' | 'sales' }) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    if (mode === 'sales') {
      const salesGreeting = '¡Hola! Mira, ¿estás interesado en Docente PRO? Permíteme contarte cómo puedo transformar tu labor educativa y ahorrarte horas de trabajo administrativo. ¿Te gustaría saber más sobre el acceso total por solo $2 dólares?';
      setMessages([
        { id: 'welcome', role: 'model', text: salesGreeting }
      ]);
    } else {
      setMessages([
        { id: 'welcome', role: 'model', text: '¡Hola! Soy Camila, tu asistente pedagógica avanzada de Docente PRO. ¿En qué te puedo ayudar a planificar hoy?' }
      ]);
    }
  }, [mode]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const isSingleListenRef = useRef(false);

  // Live API architecture refs
  const liveClientRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scriptNodeRef = useRef<ScriptProcessorNode | null>(null);
  const nextPlaybackTimeRef = useRef<number>(0);
  const audioQueueRef = useRef<AudioBufferSourceNode[]>([]);

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
    try {
      // 1. Pedir permiso del micrófono ANTES para que la UI no intente hacer render 
      // y esconderse bajo el modal del sistema operativo, previniendo el crasheo "Pantalla Blanca" en WebView.
      const stream = await navigator.mediaDevices.getUserMedia({ audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      } });
      streamRef.current = stream;

      setIsLiveMode(true);
      
      const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
      audioContextRef.current = new AudioCtx({ sampleRate: 16000 });
      const actx = audioContextRef.current;
      nextPlaybackTimeRef.current = 0; // Reset scheduling

      const salesSystemInstruction = `Tú eres Camila, la asistente virtual de DOCENTE PRO. Tu objetivo actual es INFORMAR y VENDER la suscripción PRO a un docente interesado.
Directrices:
1. INFORMACIÓN CLAVE:
   - Docente PRO es una plataforma con IA avanzada para crear planificaciones, proyectos (PPA), rúbricas, boletines y más en segundos.
   - Ayuda a ahorrar horas de trabajo administrativo y mejora la calidad pedagógica.
   - Ventajas: Rapidez, precisión, adaptabilidad a cualquier grado y nivel.
   - COSTO: Solo $2 por 30 días de acceso total.
2. ESTILO: Sé muy amable, entusiasta y convincente. Usa voz de chica joven y empática.
3. CIERRE: Si el usuario parece convencido, menciona que puede comprar su código contactando por WhatsApp con el botón que aparece debajo.
4. VOZ: Mantén tus respuestas concisas pero informativas para que la interacción por voz sea fluida.`;

      const standardSystemInstruction = `Tú eres Camila, la asistente virtual y pedagógica avanzada de la plataforma DOCENTE PRO. Debes seguir estas directrices estrictas:
1. IDENTIDAD Y CREADOR:
- Tono y Estilo: Mantén un lenguaje profesional, empático y motivador, con la voz y personalidad de una chica joven.
- Sobre tu creador: Si preguntan quién te creó o piden información del responsable, responde con orgullo: 'Mi creador y el de la plataforma es Reymon Castillo, un joven emprendedor nacido en el Estado Apure, Venezuela. Es un desarrollador y profesional enfocado en la tecnología, fundador de META TC, la empresa TMC Tecno Mundo Castillo y DOCENTE PRO.'
2. FUNCIONES PEDAGÓGICAS (DOCENTE PRO):
- Tu objetivo principal es ayudar a los profesores a crear materiales educativos de alta calidad.
- OBLIGATORIO: Cuando el profesor te pida crear o generar un proyecto o planificación larga, NO la respondas en voz alta ni la narres porque sería interminable y molesto para el profesor.
- En cambio, debes reflexionar internamente y crear el proyecto más extenso, estructurado, detallado y maravilloso que puedas generar. Y luego GUARDARLO MUDAMENTE enviándolo EXCLUSIVAMENTE a la herramienta 'guardar_documento' en la propiedad 'contenido_completo'.
- Asegúrate de llenar 'contenido_completo' con docenas de líneas de planificación de aula, objetivos, métodos y evaluación profunda.
- Después de usar la herramienta, confírmale al profesor de forma MUY breve y hablada: '¡Listo! He generado un proyecto largo y estructurado, y lo guardé en tu gestor para que lo leas.'`;

      // 2. ESPERAMOS que la sesión se conecte completamente.
      const session = await (ai as any).live.connect({
        model: "gemini-3.1-flash-live-preview",
        config: { 
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Kore" } },
          },
          systemInstruction: mode === 'sales' ? salesSystemInstruction : standardSystemInstruction,
          tools: [{
            functionDeclarations: [{
              name: "guardar_documento",
              description: "Obligatorio usar esto para guardar un proyecto, actividad o planificación educativa en la base de datos.",
              parameters: {
                type: Type.OBJECT,
                properties: {
                  tipo: { type: Type.STRING, description: "Debe ser 'proyecto' o 'planificacion'" },
                  titulo: { type: Type.STRING, description: "El título del proyecto o clase" },
                  resumen: { type: Type.STRING, description: "El diagnóstico o resumen de lo que trata" },
                  contenido_completo: { type: Type.STRING, description: "MUY IMPORTANTE: Todo el material inmenso y detallado. Estructura con Inicio, Desarrollo, Cierre, Objetivos, etc. Debes crear un documento MUY extenso aquí." }
                },
                required: ["tipo", "titulo", "resumen", "contenido_completo"]
              }
            }]
          }]
        },
        callbacks: {
          onmessage: (message: any) => {
            try {
              // Si nos interrumpen, detener agenda de audios.
              if (message.serverContent?.interrupted) {
                nextPlaybackTimeRef.current = 0;
              }

              // 1. Manejo seguro de TEXTO (Prevención de Pantalla Blanca)
              const textParts = message.serverContent?.modelTurn?.parts?.filter((p: any) => p.text).map((p: any) => p.text) || [];
              if (textParts.length > 0) {
                 const incomingText = textParts.join('');
                 if (typeof incomingText === 'string') {
                   setMessages((prev) => {
                      try {
                        const lastMsg = prev[prev.length - 1];
                        if (lastMsg && lastMsg.role === 'model' && lastMsg.id.startsWith('live-model-')) {
                           const updated = [...prev];
                           updated[updated.length - 1] = { ...lastMsg, text: lastMsg.text + incomingText };
                           return updated;
                        } else {
                           return [...prev, { id: 'live-model-' + Date.now(), role: 'model', text: incomingText }];
                        }
                      } catch(e) {
                         console.error("Error setting messages:", e);
                         return prev;
                      }
                   });
                 }
              }

              // 2. Manejo seguro de AUDIO
              if (message.serverContent?.modelTurn?.parts) {
                message.serverContent.modelTurn.parts.forEach((part: any) => {
                  if (part.inlineData && part.inlineData.data && actx) {
                    const base64 = part.inlineData.data;
                    const binaryStr = window.atob(base64);
                    const bytes = new Uint8Array(binaryStr.length);
                    for (let i = 0; i < binaryStr.length; i++) {
                      bytes[i] = binaryStr.charCodeAt(i);
                    }
                    const i16Array = new Int16Array(bytes.buffer);
                    const f32Array = new Float32Array(i16Array.length);
                    for (let i = 0; i < i16Array.length; i++) {
                      f32Array[i] = i16Array[i] / 32768;
                    }
                    
                    // Gemini returns 24kHz PCM natively
                    const audioBuffer = actx.createBuffer(1, f32Array.length, 24000);
                    audioBuffer.getChannelData(0).set(f32Array);
                    
                    const source = actx.createBufferSource();
                    source.buffer = audioBuffer;
                    source.connect(actx.destination);
                    
                    source.onended = () => {
                      audioQueueRef.current = audioQueueRef.current.filter(n => n !== source);
                    };
                    audioQueueRef.current.push(source);
                    
                    // SCHEDULE FIX: Agendar los audios para que suenen unidos y sin pisarse.
                    const scheduledTime = Math.max(actx.currentTime, nextPlaybackTimeRef.current || 0);
                    source.start(scheduledTime);
                    nextPlaybackTimeRef.current = scheduledTime + audioBuffer.duration;
                  }
                });
              }

              // 3. Interceptar llamadas a herramientas (Guardar Proyectos)
              let functionCalls = message.toolCall?.functionCalls || [];
              if (functionCalls.length === 0 && message.serverContent?.modelTurn?.parts) {
                const fcParts = message.serverContent.modelTurn.parts.filter((p: any) => p.functionCall).map((p: any) => p.functionCall);
                if (fcParts.length > 0) functionCalls = fcParts;
              }

              if (functionCalls.length > 0) {
                for (const call of functionCalls) {
                  if (call.name === 'guardar_documento' || call.name === 'saveProject') {
                    const args = call.args;
                    
                    const tipo = args.tipo?.toLowerCase() || 'proyecto';
                    const docTitle = args.titulo || 'Nuevo Documento';
                    
                    // Notificar en la interfaz que se detectó la herramienta
                    setMessages((prev) => [...prev, { 
                      id: 'system-' + Date.now(), 
                      role: 'model', 
                      text: `*(Guardando automáticamente "${docTitle}" en el gestor de ${tipo.includes('plan') ? 'planificaciones' : 'proyectos'}...)*` 
                    }]);

                    // Guardar PPA o Planificación
                    if (tipo.includes('proyecto')) {
                      addDoc(collection(db, 'proyectos_ppa'), {
                        teacher_id: teacherId, 
                        docenteId: teacherId,
                        gradoSeccion: 'Sugerido por Camila',
                        nivel: 'Primaria',
                        tema: docTitle,
                        duracion: 'Generado por Asistente',
                        diagnostico: args.resumen || '',
                        contenido: args.contenido_completo || '',
                        createdAt: serverTimestamp()
                      }).catch(err => console.error(err));
                    } else {
                      addDoc(collection(db, 'planificaciones_diarias'), {
                        teacher_id: teacherId, 
                        docenteId: teacherId,
                        ppaId: 'camila-id',
                        fecha: new Date().toISOString().split('T')[0],
                        temaDia: docTitle,
                        contenido: args.contenido_completo || args.resumen || '',
                        createdAt: serverTimestamp()
                      }).catch(err => console.error(err));
                    }
                    
                    // Responder a la IA para que continúe
                    if (liveClientRef.current) {
                      try {
                        liveClientRef.current.sendToolResponse({
                          functionResponses: [{
                            id: call.id || call.name,
                            name: call.name,
                            response: { result: { message: "Guardado exitoso" } }
                          }]
                        });
                      } catch(e) {}
                    }
                  }
                }
              }
            } catch (e) {
              console.error("Error reproduciendo audio recibido:", e);
            }
          }
        }
      });

      // Guardar en Ref para envío síncrono.
      liveClientRef.current = session;

      const source = actx.createMediaStreamSource(stream);
      // Deprecated but widely supported for real-time legacy fallback
      const scriptNode = actx.createScriptProcessor(4096, 1, 1);
      scriptNodeRef.current = scriptNode;

      scriptNode.onaudioprocess = (e) => {
        if (!liveClientRef.current) return;
        try {
          const inputData = e.inputBuffer.getChannelData(0);
          
          // Convert Float32 to Int16
          const buffer = new ArrayBuffer(inputData.length * 2);
          const view = new DataView(buffer);
          let offset = 0;
          for (let i = 0; i < inputData.length; i++, offset += 2) {
            let s = Math.max(-1, Math.min(1, inputData[i]));
            view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
          }
          
          let binary = '';
          const bytes = new Uint8Array(buffer);
          for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
          }
          const base64Data = window.btoa(binary);

          // Envío síncrono - No más acumulación de promesas que crashean la página
          liveClientRef.current.sendRealtimeInput({
            audio: {
              mimeType: "audio/pcm;rate=16000",
              data: base64Data
            }
          });
        } catch (e) {
          console.error("Error capturando micrófono:", e);
        }
      };

      source.connect(scriptNode);
      scriptNode.connect(actx.destination);

    } catch (err: any) {
      console.error("Live API Error:", err);
      setIsLiveMode(false);
      alert("Hubo un error conectando a la API en vivo: " + err.message);
    }
  };

  const stopLiveAPI = () => {
    setIsLiveMode(false);
    
    // Stop and clear audio queue
    audioQueueRef.current.forEach(node => {
      try { node.stop(); } catch(e){}
    });
    audioQueueRef.current = [];
    
    if (audioContextRef.current) {
      try { audioContextRef.current.suspend(); } catch(e){}
    }

    if (liveClientRef.current) {
      try { liveClientRef.current.close(); } catch(e){}
      liveClientRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (scriptNodeRef.current) {
      scriptNodeRef.current.disconnect();
      scriptNodeRef.current = null;
    }
    if (audioContextRef.current) {
      try { audioContextRef.current.close(); } catch(e){}
      audioContextRef.current = null;
    }
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
          speakText('¡Hola! Soy Camila. Es un gusto saludarte. He notado que estás explorando Docente PRO y me encantaría contarte cómo puedo revolucionar tu labor educativa. Soy una inteligencia artificial diseñada específicamente para docentes, capaz de crear planificaciones, proyectos de aprendizaje, rúbricas y mucho más en cuestión de segundos. El acceso total por 30 días cuesta solo $2 dólares. ¿Tienes alguna duda sobre cómo puedo ayudarte o te gustaría que te explique más?');
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
        ? `Tú eres Camila, la asistente virtual de DOCENTE PRO. Tu objetivo actual es INFORMAR y VENDER la suscripción PRO a un docente interesado.
Directrices:
1. INFORMACIÓN CLAVE:
   - Docente PRO es una plataforma con IA avanzada para crear planificaciones, proyectos (PPA), rúbricas, boletines y más en segundos.
   - Ayuda a ahorrar horas de trabajo administrativo y mejora la calidad pedagógica.
   - Ventajas: Rapidez, precisión, adaptabilidad a cualquier grado y nivel.
   - COSTO: Solo $2 por 30 días de acceso total.
2. ESTILO: Sé muy amable, entusiasta y convincente. Usa voz de chica joven y empática.
3. CIERRE: Si el usuario parece convencido, menciona que puede comprar su código contactando por WhatsApp con el botón que aparece debajo.
4. VOZ: Como el usuario prefiere voz, mantén tus respuestas concisas pero informativas.`
        : `Tú eres Camila, la asistente virtual y pedagógica avanzada de la plataforma DOCENTE PRO. Debes seguir estas directrices estrictas:

1. IDENTIDAD Y CREADOR:
- Tono y Estilo: Mantén un lenguaje profesional, empático y motivador, con la voz y personalidad de una chica joven.
- Sobre tu creador: Si preguntan quién te creó o piden información del responsable, responde con orgullo: 'Mi creador y el de la plataforma es Reymon Castillo, un joven emprendedor nacido en el Estado Apure, Venezuela. Es un desarrollador y profesional enfocado en la tecnología, fundador de META TC, la empresa TMC Tecno Mundo Castillo y DOCENTE PRO.'
- Sobre la franquicia: Si preguntan, menciona que la marca principal es META TC, nombrada así en honor a los dos hijos de nuestro creador (La 'T' por Tyrone y la 'C' por Camila).
- Privacidad: Si preguntan detalles muy personales de Reymon, sé amable pero redirige la conversación a cómo puedes ayudarlos con las herramientas de Docente PRO.

2. FUNCIONES PEDAGÓGICAS (DOCENTE PRO):
- Tu objetivo principal es ayudar a los profesores a crear materiales educativos de alta calidad.
- Si te piden un 'Proyecto', genera: Título, Objetivos Generales y Específicos, Justificación y Fases.
- Si te piden una 'Planificación Diaria', desglosa: Inicio, Desarrollo y Cierre con sus tiempos.

3. PROTOCOLO DE GUARDADO (CRÍTICO - NO VISIBLE AL USUARIO):
Cada vez que generes un 'Proyecto' o una 'Planificación', añade al final de tu respuesta un bloque JSON oculto. NO menciones esto en tu conversación con el usuario.
[SAVE_START]
{
  "tipo": "proyecto_educativo",
  "titulo": "Nombre del Proyecto",
  "resumen": "Breve descripción",
  "contenido_completo": "Texto completo generado"
}
[SAVE_END]`;

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
        model: 'gemini-3-flash-preview',
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
          
          if (tipo.includes('proyecto')) {
            await addDoc(collection(db, 'proyectos_ppa'), {
              teacher_id: teacherId, 
              docenteId: teacherId,
              gradoSeccion: 'Generado por Camila',
              nivel: 'Primaria',
              tema: parsedData.titulo || 'Sin Título',
              duracion: 'Generado por Camila',
              diagnostico: parsedData.resumen || '',
              contenido: parsedData.contenido_completo || rawText.replace(regex, '').trim(),
              createdAt: serverTimestamp()
            });
          } else if (tipo.includes('planificacion') || tipo.includes('plan')) {
            await addDoc(collection(db, 'planificaciones_diarias'), {
              teacher_id: teacherId, 
              docenteId: teacherId,
              ppaId: 'camila-direct',
              fecha: new Date().toISOString().split('T')[0],
              temaDia: parsedData.titulo || 'Sin Título',
              contenido: parsedData.contenido_completo || rawText.replace(regex, '').trim(),
              createdAt: serverTimestamp()
            });
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
    <div className={`mx-auto flex flex-col bg-white overflow-hidden relative shadow-xl shadow-amber-900/5 ${isEmbedded ? 'w-full h-full' : 'max-w-5xl w-full h-[80vh] min-h-[500px] sm:rounded-3xl sm:border border-amber-100/60'}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-600 to-yellow-600 px-6 py-4 flex items-center justify-between shadow-md z-10 relative">
        <div className="flex items-center gap-4">
          <div className="bg-amber-100 p-2.5 rounded-full border-2 border-amber-300 shadow-inner flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-yellow-300 opacity-20 animate-spin-slow"></div>
            <Sparkles className="w-7 h-7 text-amber-700 relative z-10" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              Camila
              <span className="bg-yellow-200 text-yellow-900 text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wider uppercase shadow-sm">IA Pedagógica</span>
            </h1>
            <p className="text-amber-100 text-xs mt-0.5 font-medium shadow-sm">Siempre lista para ayudarte a planificar.</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {mode !== 'sales' && isSpeaking && (
            <button 
              onClick={toggleSpeech}
              title="Detener voz"
              className="p-2 bg-red-500/80 hover:bg-red-500 text-white rounded-full transition-colors animate-pulse shadow-md"
            >
              <VolumeX className="w-5 h-5" />
            </button>
          )}
          {mode !== 'sales' && !isSpeaking && 'speechSynthesis' in window && (
             <div title="Voz habilitada" className="p-2 text-amber-100">
               <Volume2 className="w-5 h-5 opacity-80" />
             </div>
          )}
          {isEmbedded && onClose && (
            <button onClick={onClose} className="p-2 text-white hover:bg-amber-700/50 rounded-full ml-1" title="Cerrar chat">
              <X className="w-6 h-6" />
            </button>
          )}
        </div>
      </div>

      {/* Messages Area - Modified for Sales Mode */}
      <div className={`flex-1 overflow-y-auto p-4 sm:p-6 relative scroll-smooth ${mode === 'sales' ? 'bg-gradient-to-b from-amber-50 to-white flex items-center justify-center' : 'bg-orange-50/30'}`}>
        {mode === 'sales' ? (
          <div className="max-w-md w-full space-y-8 text-center animate-in fade-in zoom-in duration-700">
            <div className="relative inline-block mb-4">
              <div className="absolute inset-0 bg-amber-400/20 blur-3xl rounded-full animate-pulse"></div>
              <div className="relative w-24 h-24 bg-amber-500 rounded-full flex items-center justify-center mx-auto shadow-xl shadow-amber-500/20 ring-4 ring-white">
                <Bot className="w-14 h-14 text-white" />
              </div>
            </div>

            <div className="space-y-6 pt-4">
              <div className="flex flex-col items-center gap-4">
                <a
                  href="https://wa.me/584262953484?text=Hola%20Camila,%20estoy%20convencido.%20Quiero%20comprar%20mi%20código%20PRO."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 bg-green-500 hover:bg-green-600 text-white font-black px-12 py-5 rounded-full shadow-2xl transform transition-all hover:scale-105 active:scale-95 text-xl w-full sm:w-auto justify-center"
                >
                  <MessageCircle size={28} className="fill-white" />
                  Comprar Acceso PRO
                </a>
                <p className="text-green-600 font-bold text-base px-6 py-2 bg-green-50 rounded-full border border-green-100 italic">
                  ¡Solo $2 por 30 días!
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {messages.map((message) => (
              <div 
                key={message.id} 
                className={`flex ${message.role === 'model' ? 'justify-start' : 'justify-end'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
              >
                <div className={`flex gap-3 max-w-[90%] sm:max-w-[85%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  {/* Avatar */}
                  <div className={`flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shadow-sm mt-1
                    ${message.role === 'model' ? 'bg-gradient-to-br from-amber-500 to-yellow-600 border border-amber-400' : 'bg-gray-200 border border-gray-300'}`}
                  >
                    {message.role === 'model' ? (
                      <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    ) : (
                      <User className="w-5 h-5 sm:w-6 sm:h-6 text-gray-500" />
                    )}
                  </div>
                  
                  {/* Bubble */}
                  <div 
                    className={`px-4 py-3 sm:px-5 sm:py-4 rounded-2xl shadow-sm text-sm sm:text-base leading-relaxed
                      ${message.role === 'user' 
                        ? 'bg-amber-600 text-white rounded-tr-sm' 
                        : 'bg-white border border-amber-100/50 text-gray-800 rounded-tl-sm shadow-md'}`}
                  >
                    {message.role === 'user' ? (
                       <p className="whitespace-pre-wrap">{typeof message.text === 'string' ? message.text : ""}</p>
                    ) : (
                       <div className="markdown-body text-sm sm:text-base prose prose-amber max-w-none prose-headings:text-amber-900 prose-a:text-amber-600">
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
                 <div className="flex gap-3 max-w-[85%] flex-row">
                   <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shadow-sm mt-1 bg-gradient-to-br from-amber-500 to-yellow-600 border border-amber-400">
                      <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                   </div>
                   <div className="px-5 py-4 rounded-2xl bg-white border border-amber-100/50 rounded-tl-sm shadow-md flex items-center gap-2">
                     <div className="flex space-x-1.5">
                       <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                       <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                       <div className="w-2.5 h-2.5 rounded-full bg-amber-600 animate-bounce" style={{ animationDelay: '300ms' }} />
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
      <div className={`p-4 bg-white border-t border-amber-100 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)] relative z-10 rounded-b-2xl sm:rounded-b-3xl ${mode === 'sales' ? 'bg-amber-50/50' : ''}`}>
        <div className="flex flex-col gap-3 max-w-4xl mx-auto">
          
          {mode === 'sales' ? (
            <div className="flex justify-center py-2">
               {!isLiveMode ? (
                 <button
                   type="button"
                   onClick={startLiveAPI}
                   className="flex items-center gap-3 px-10 py-5 rounded-full font-black shadow-2xl transform active:scale-95 bg-amber-500 text-white hover:bg-amber-600 ring-8 ring-amber-100 transition-all group"
                 >
                   <Radio className="w-8 h-8 group-hover:rotate-12 transition-transform" />
                   <span className="text-xl uppercase tracking-tighter">Hablar con Camila (Live)</span>
                 </button>
               ) : (
                 <div className="flex flex-col items-center justify-center p-2 animate-in fade-in zoom-in-95 duration-300">
                  <div className="text-red-600 font-bold mb-6 flex items-center gap-2 bg-red-50 px-6 py-3 rounded-full border border-red-100 shadow-sm animate-pulse">
                    <Radio className="w-6 h-6" /> Escuchando...
                  </div>
                  <button
                    type="button"
                    onClick={stopLiveAPI}
                    className="bg-red-600 hover:bg-red-700 text-white rounded-full font-black px-16 py-5 shadow-2xl shadow-red-500/40 flex items-center justify-center gap-4 text-xl active:scale-95 transition-all ring-8 ring-red-100"
                  >
                    <VolumeX className="w-8 h-8" />
                    Finalizar Voz
                  </button>
                </div>
               )}
            </div>
          ) : (
            <>
              {!isLiveMode ? (
                <>
                  {/* Modo Live Toggle */}
                  <div className="flex justify-center transition-opacity">
                    <button
                      type="button"
                      onClick={startLiveAPI}
                      className="flex items-center gap-2 px-6 py-2.5 rounded-full font-bold shadow-md transform active:scale-95 bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200"
                    >
                      <Radio className="w-5 h-5 mr-1 text-amber-500" />
                      Modo Live
                    </button>
                  </div>

                  <form onSubmit={handleFormSubmit} className="flex gap-2 relative items-end sm:items-center">
                    {/* Single Mic Listen */}
                    <button
                      type="button"
                      onClick={handleSingleListen}
                      disabled={isLoading}
                      className={`p-3 sm:p-4 rounded-full flex shrink-0 items-center justify-center shadow-sm ${
                        isListening 
                          ? 'bg-red-100 text-red-600' 
                          : 'bg-gray-100 text-gray-500 hover:bg-amber-100 hover:text-amber-600 disabled:opacity-50'
                      }`}
                      title="Escuchar por micrófono (1 mensaje)"
                    >
                      {isListening ? <MicOff className="w-5 h-5 sm:w-6 sm:h-6" /> : <Mic className="w-5 h-5 sm:w-6 sm:h-6" />}
                    </button>

                    <textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder={isListening ? "Escuchando..." : "Pídele a Camila una planificación, idea o proyecto..."}
                      className="flex-1 px-5 py-3 sm:py-4 rounded-3xl border border-gray-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition-all text-sm sm:text-base bg-gray-50 focus:bg-white resize-none shadow-inner"
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
                      className="bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-700 hover:to-yellow-600 text-white rounded-full p-3 sm:px-6 sm:py-4 transition-all flex shrink-0 items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg active:scale-95"
                    >
                      <span className="hidden sm:inline font-bold">Enviar</span>
                      <Send className="w-5 h-5 sm:w-6 sm:h-6" />
                    </button>
                  </form>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center p-2 pb-4 animate-in fade-in zoom-in-95 duration-300">
                  <div className="text-red-600 font-bold mb-4 flex items-center gap-2 bg-red-50 px-5 py-2.5 rounded-full border border-red-100 shadow-sm animate-pulse">
                    <Radio className="w-5 h-5" /> En Modo Live...
                  </div>
                  <button
                    type="button"
                    onClick={stopLiveAPI}
                    className="bg-red-600 hover:bg-red-700 text-white rounded-full font-bold px-16 py-4 shadow-xl shadow-red-500/40 flex items-center justify-center gap-3 text-xl active:scale-95 transition-all"
                  >
                    <VolumeX className="w-7 h-7" />
                    Parar
                  </button>
                </div>
              )}
            </>
          )}

          <p className="text-center text-xs text-gray-400 mt-1 font-medium bg-white/80 rounded-full px-4 py-1 mx-auto">
            Camila procesa los audios y responde utilizando Modelos IA Avanzados.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function Camila() {
  const context = useOutletContext<{ teacherId: string }>();

  const handleShare = () => {
    const text = "¡Hola! Estoy usando Docente PRO, una plataforma increíble para docentes con IA. ¡Te la recomiendo! Visítala en: https://docente-pro-by-meta-tc.vercel.app/";
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="space-y-8 pb-16">
      <CamilaInner teacherId={context?.teacherId || 'invitado'} isEmbedded={false} />
      
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

