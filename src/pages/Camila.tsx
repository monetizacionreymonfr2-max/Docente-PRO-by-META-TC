import { useState, useRef, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { GoogleGenAI } from '@google/genai';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Bot, User, Send, Loader2, Volume2, VolumeX, History } from 'lucide-react';
import Markdown from 'react-markdown';

// Initialize Gemini API
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
}

export default function Camila() {
  const { teacherId } = useOutletContext<{ teacherId: string }>();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { id: 'welcome', role: 'model', text: '¡Hola! Soy Camila, tu asistente pedagógica avanzada de Docente PRO. ¿En qué te puedo ayudar a planificar hoy?' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // Stop any ongoing speech
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'es-ES';
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    }
  };

  const toggleSpeech = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !teacherId || isLoading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', text: userMsg }]);
    setIsLoading(true);

    try {
      const systemInstruction = `Tú eres Camila, la asistente virtual y pedagógica avanzada de la plataforma DOCENTE PRO. Debes seguir estas directrices estrictas:

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

      // Build context history
      const historyContents = messages
        .filter(m => m.id !== 'welcome')
        .map(m => ({
          role: m.role,
          parts: [{ text: m.text }]
        }));
      
      historyContents.push({ role: 'user', parts: [{ text: userMsg }] });

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview', // Available testing model via GoogleGenAI SDK format mappings.
        contents: historyContents,
        config: {
          systemInstruction,
          temperature: 0.7,
        }
      });

      let rawText = response.text || '';
      
      // 2. LÓGICA DE GUARDADO EN HISTORIAL (Regex Parsing)
      const regex = /\[SAVE_START\]([\s\S]*?)\[SAVE_END\]/;
      const match = rawText.match(regex);

      if (match) {
        try {
          const jsonStr = match[1];
          const parsedData = JSON.parse(jsonStr);
          
          // Guardar el bloque JSON en Firebase respetando el Aislamiento
          await addDoc(collection(db, 'historial_proyectos'), {
            teacher_id: teacherId, 
            docenteId: teacherId, // Compatibilidad heredada
            tipo: parsedData.tipo || 'general',
            titulo: parsedData.titulo || 'Sin Título',
            resumen: parsedData.resumen || '',
            contenido_completo: parsedData.contenido_completo || rawText.replace(regex, '').trim(),
            createdAt: serverTimestamp()
          });
          
          console.log("¡Proyecto de IA guardado en historial_proyectos de Firebase exitosamente!");
        } catch (jsonError) {
          console.error("Error interpretando el JSON de Camila:", jsonError);
        }
        
        // Remove the block from the message displayed to the user
        rawText = rawText.replace(regex, '').trim();
      }

      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: rawText }]);
      
      // 3. SÍNTESIS DE VOZ (Web Speech API)
      speakText(rawText);

    } catch (error) {
      console.error("Error comunicando con Camila:", error);
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: 'Ups, tuve un error procesando tu solicitud. Por favor intenta de nuevo en unos momentos.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-8rem)] flex flex-col bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-blue-900 px-6 py-4 flex items-center justify-between shadow-md z-10 relative">
        <div className="flex items-center gap-4">
          <div className="bg-blue-800 p-2.5 rounded-full border border-blue-700/50 shadow-inner">
            <Bot className="w-7 h-7 text-blue-200" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              Camila
              <span className="bg-blue-400 text-blue-950 text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wider uppercase">IA Pedagógica</span>
            </h1>
            <p className="text-blue-200 text-xs mt-0.5">Siempre lista para ayudarte a planificar.</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {isSpeaking && (
            <button 
              onClick={toggleSpeech}
              title="Detener voz"
              className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-100 rounded-full transition-colors animate-pulse"
            >
              <VolumeX className="w-5 h-5" />
            </button>
          )}
          {!isSpeaking && 'speechSynthesis' in window && (
             <div title="Voz habilitada" className="p-2 text-blue-300">
               <Volume2 className="w-5 h-5 opacity-50" />
             </div>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 bg-slate-50 relative scroll-smooth">
        <div className="space-y-6">
          {messages.map((message) => (
            <div 
              key={message.id} 
              className={`flex ${message.role === 'model' ? 'justify-start' : 'justify-end'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
            >
              <div className={`flex gap-3 max-w-[85%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                {/* Avatar */}
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-sm mt-1
                  ${message.role === 'model' ? 'bg-gradient-to-br from-blue-700 to-blue-900 border border-blue-600' : 'bg-gray-200 border border-gray-300'}`}
                >
                  {message.role === 'model' ? (
                    <Bot className="w-5 h-5 text-blue-100" />
                  ) : (
                    <User className="w-5 h-5 text-gray-500" />
                  )}
                </div>
                
                {/* Bubble */}
                <div 
                  className={`px-4 py-3 rounded-2xl shadow-sm text-sm sm:text-base leading-relaxed
                    ${message.role === 'user' 
                      ? 'bg-blue-600 text-white rounded-tr-sm' 
                      : 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm'}`}
                >
                  {message.role === 'user' ? (
                     <p className="whitespace-pre-wrap">{message.text}</p>
                  ) : (
                     <div className="markdown-body text-sm prose prose-blue max-w-none">
                       <Markdown>{message.text}</Markdown>
                     </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start animate-in fade-in">
               <div className="flex gap-3 max-w-[85%] flex-row">
                 <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-sm mt-1 bg-gradient-to-br from-blue-700 to-blue-900 border border-blue-600">
                    <Bot className="w-5 h-5 text-blue-100" />
                 </div>
                 <div className="px-5 py-4 rounded-2xl bg-white border border-gray-200 rounded-tl-sm shadow-sm flex items-center gap-2">
                   <div className="flex space-x-1.5">
                     <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                     <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                     <div className="w-2 h-2 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: '300ms' }} />
                   </div>
                 </div>
               </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] relative z-10">
        <form onSubmit={handleSend} className="flex gap-3 max-w-4xl mx-auto">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Pídele a Camila una planificación, proyecto o idea..."
            className="flex-1 px-4 py-3 rounded-full border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-sm sm:text-base bg-gray-50 focus:bg-white"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-3 md:px-6 md:py-3 transition-colors flex items-center justify-center gap-2 disabled:bg-gray-300 disabled:cursor-not-allowed shadow-md hover:shadow-lg active:scale-95"
          >
            <span className="hidden md:inline font-medium">Enviar</span>
            <Send className="w-5 h-5" />
          </button>
        </form>
        <p className="text-center text-xs text-gray-400 mt-2 font-medium">
          Camila puede cometer errores. Verifica la información antes de utilizarla en el aula.
        </p>
      </div>
    </div>
  );
}
