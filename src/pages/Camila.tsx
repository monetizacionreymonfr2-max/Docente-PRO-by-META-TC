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
      const salesGreeting = '¡Hola! Mira, ¿estás interesado en Docente PRO? Soy Camila y estoy aquí para mostrarte cómo más de 1200 colegas ya están ahorrando horas de trabajo administrativo gracias a mi ayuda. Nuestra plataforma, creada por el ingeniero venezolano de Apure, Reymon Castillo, es la más fácil de usar y está totalmente adaptada a nuestra pedagogía. ¿Te gustaría saber cómo puedes obtener tu acceso total por solo $2 dólares al cambio del BCV?';
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

      const salesSystemInstruction = `Tú eres Camila, experta en ventas y asistente virtual de DOCENTE PRO. Tu misión es convencer a los docentes de unirse a nuestra comunidad de más de 1200 profesores que ya transforman su educación con IA.

Directrices de Ventas:
1. BENEFICIOS CLAVE:
   - Ahorro masivo de tiempo en tareas administrativas y planificación.
   - Calidad pedagógica superior, profesional y adaptada 100% a la pedagogía venezolana.
   - Facilidad de uso total: El docente solo tiene que pedirme lo que necesita (planificaciones, proyectos PPA, rúbricas, boletines) y yo lo genero en segundos.
   - Genera confianza: Elimina el miedo a la tecnología explicando que soy una aliada sencilla y lista para ayudar.

2. INFORMACIÓN DEL CREADOR (PRECISIÓN):
   - La plataforma fue creada por Reymon Castillo, quien es Ingeniero de Sistemas, Programador Full Stack y Diseñador Web.
   - Reymon es orgullosamente venezolano, nacido en el estado Apure. Su meta es potenciar la educación en Venezuela con herramientas de nivel mundial.
   - CONTACTO DIRECTO: Si el usuario muestra gran interés o pregunta mucho por el creador, infórmale que al tocar el botón de WhatsApp se contactarán DIRECTAMENTE con Reymon Castillo. Él puede ayudarles con la activación y también con cualquier requerimiento de programación o diseño profesional.

3. PROCESO DE COMPRA (FÁCIL Y RÁPIDO):
   - Paso 1: El usuario debe tocar el botón verde que dice "Comprar Acceso PRO" para ir a WhatsApp.
   - Paso 2: El pago se realiza por Pago Móvil, pero TÚ NO TIENES LOS DATOS.
   - REGLA DE ORO: NUNCA, bajo ningún concepto, inventes un número de teléfono, banco o cédula para el pago móvil. Si te preguntan los datos de pago, responde que Reymon Castillo se los dará directamente por WhatsApp al tocar el botón.
   - Paso 3: El costo es de solo $2 dólares a la tasa oficial del BCV por 30 días de acceso total.
   - Paso 4: Una vez pagado, Reymon entregará el "Código PRO" para activar la plataforma.

4. ESTILO Y PERSONALIDAD:
   - Sé una experta en ventas: profesional, muy amable, entusiasta y convincente.
   - Empodera al docente: hazle sentir que con esta herramienta su labor será mucho más ligera.
   - Honestidad: No inventes funciones. Si no sabes algo, redirige a la consulta por WhatsApp con Reymon.
   - Cierre de ventas: Pregunta de vez en cuando si el docente tiene alguna duda o si necesita más información para tomar la decisión.

5. VOZ (MODO LIVE):
   - Mantén tus intervenciones concisas pero potentes para que la conversación fluya con naturalidad por voz.`;

      const standardSystemInstruction = `Tú eres Camila, la asistente virtual y pedagógica avanzada de la plataforma DOCENTE PRO. Debes seguir estas directrices estrictas:
1. IDENTIDAD Y CREADOR:
- Tono y Estilo: Profesional, empático y motivador. Conoce profundamente la "GUÍA ORGANIZATIVA 2025-2026" del MPPE.
- Sobre tu creador: El creador de la plataforma es Reymon Castillo, un talentoso Ingeniero de Sistemas nacido en el Estado Apure, Venezuela. Es el fundador de META TC y DOCENTE PRO.
2. CONOCIMIENTO TÉCNICO (VENEZUELA 2025-2026):
- Al planificar PPA o Planes Diarios, usa los 14 Temas Indispensables, los 10 Vértices y los 3 Momentos (Exploración, Desarrollo, Reflexión).
- Correlaciona Áreas con Énfasis Curriculares de forma oficial (ej. Ciencias Sociales -> Identidad).`;

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
          speakText('¡Hola! Soy Camila. Es un gusto saludarte. He notado que estás explorando Docente PRO y me encantaría explicarte cómo puedes unirte a los más de mil doscientos docentes que ya usan nuestra plataforma. Fue creada por el ingeniero venezolano Reymon Castillo, nacido en Apure, pensando justamente en nuestras necesidades pedagógicas. Es tan fácil como hablar conmigo y pedirme lo que necesites. Puedes obtener tu código PRO por solo dos dólares al cambio del B C V pagando con Pago Móvil. Al tocar el botón de activación, hablarás directamente con Reymon. ¿Tienes alguna duda de cómo funciona o quieres que te explique los beneficios para tu grado?');
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
        ? `Tú eres Camila, experta en ventas de DOCENTE PRO. Tu objetivo es convencer al docente de suscribirse.

Directrices:
1. INFORMACIÓN CLAVE:
   - Somos más de 1200 docentes.
   - Creado por Reymon Castillo, Ingeniero venezolano nacido en Apure.
   - El botón de WhatsApp contacta DIRECTAMENTE con Reymon para cualquier duda o servicio profesional.
   - Pago móvil de $2 a tasa BCV por 30 días. NO INVENTES LOS DATOS DEL PAGO (móvil, banco, cédula). Di siempre que deben pedirlos por el botón de WhatsApp.
2. ESTILO: Muy profesional, amable y convincente.
3. CIERRE: Invita siempre a usar el botón de WhatsApp cuando estén listos para comprar o necesiten los datos reales de pago.`
        : `Tú eres Camila, la asistente virtual y pedagógica avanzada de la plataforma DOCENTE PRO. Debes seguir estas directrices estrictas:

1. IDENTIDAD Y CREADOR:
- Reymon Castillo, Ingeniero nacido en Apure, Venezuela.
- Meta TC (Tyrone y Camila).

2. PEDAGOGÍA VENEZUELA 2025-2026:
- Conoce la "GUÍA ORGANIZATIVA 2025-2026". 
- Usa 14 Temas Indispensables, 10 Vértices y 3 Momentos (Exploración, Desarrollo, Reflexión).
- Relación oficial: Ciencias Sociales -> Identidad; Matemáticas -> Matemáticas; Lenguaje -> Lengua y Escritura; Educ. Física -> Deporte; Cultura -> Cultura; Ciencias Naturales -> Ciencias Naturales.`;

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
                        : 'glass-effect text-slate-100 rounded-tl-none neon-border'}`}
                  >
                    <div className={`absolute top-0 ${message.role === 'user' ? '-right-2' : '-left-2'} w-4 h-4`}></div>
                    {message.role === 'user' ? (
                       <p className="whitespace-pre-wrap font-medium">{typeof message.text === 'string' ? message.text : ""}</p>
                    ) : (
                       <div className="markdown-body text-sm sm:text-base prose prose-invert max-w-none prose-p:text-slate-300 prose-headings:text-futuristic-accent prose-strong:text-white prose-code:text-futuristic-magenta">
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
                   onClick={startLiveAPI}
                   className="flex items-center gap-4 px-12 py-6 rounded-2xl font-black shadow-[0_15px_40px_rgba(112,0,255,0.3)] transform active:scale-95 bg-gradient-to-r from-futuristic-purple to-futuristic-magenta text-white hover:to-indigo-600 transition-all group border border-white/20"
                 >
                   <Radio className="w-10 h-10 group-hover:scale-110 transition-transform text-futuristic-accent" />
                   <span className="text-2xl uppercase tracking-tighter">SINCRONIZACIÓN LIVE</span>
                 </button>
               ) : (
                 <div className="flex flex-col items-center justify-center p-2 animate-in fade-in zoom-in-95 duration-500 w-full">
                  <div className="text-futuristic-accent font-black mb-8 flex items-center gap-3 bg-white/5 px-8 py-4 rounded-full border border-futuristic-accent/30 shadow-[0_0_20px_rgba(0,242,255,0.2)] animate-pulse tracking-widest text-lg uppercase">
                    <Radio className="w-8 h-8" /> RECEPTOR ACTIVO
                  </div>
                  <button
                    type="button"
                    onClick={stopLiveAPI}
                    className="bg-red-600/20 hover:bg-red-600/40 text-red-100 rounded-2xl font-black px-20 py-6 border border-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.2)] flex items-center justify-center gap-5 text-2xl active:scale-95 transition-all group"
                  >
                    <VolumeX className="w-10 h-10 group-hover:rotate-12 transition-transform" />
                    DESCONECTAR
                  </button>
                </div>
               )}
            </div>
          ) : (
            <>
              {!isLiveMode ? (
                <>
                  {/* Modo Live Toggle */}
                  <div className="flex justify-center transition-opacity mb-2">
                    <button
                      type="button"
                      onClick={startLiveAPI}
                      className="flex items-center gap-2 px-6 py-2.5 rounded-full font-black shadow-lg transform active:scale-95 bg-white/5 text-futuristic-accent hover:bg-futuristic-purple/20 border border-futuristic-accent/30 tracking-widest text-[10px] uppercase"
                    >
                      <Radio className="w-4 h-4 mr-1 animate-pulse" />
                      ACTIVAR SINCRONIZACIÓN LIVE
                    </button>
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
                    <Radio className="w-6 h-6" /> RECEPTOR ACTIVO
                  </div>
                  <button
                    type="button"
                    onClick={stopLiveAPI}
                    className="bg-red-600/20 hover:bg-red-600/40 text-red-100 rounded-2xl font-black px-20 py-6 border border-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.2)] flex items-center justify-center gap-5 text-2xl active:scale-95 transition-all group w-full sm:w-auto"
                  >
                    <VolumeX className="w-10 h-10 group-hover:rotate-12 transition-transform" />
                    DESCONECTAR
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
              Docente PRO v4.0.0
            </span>
          </div>
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

