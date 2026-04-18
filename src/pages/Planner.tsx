import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, where, deleteDoc, doc, updateDoc, increment } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { GoogleGenAI } from '@google/genai';
import { BookOpen, Loader2, FileText, Copy, Printer, X, History, Calendar, Trash2 } from 'lucide-react';
import Markdown from 'react-markdown';
import LimitReachedModal from '../components/LimitReachedModal';

// Initialize Gemini API
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

interface PPAProject {
  id: string;
  tema: string;
  nivel?: 'Primaria' | 'Maternal';
  contenido: string;
}

interface DailyPlan {
  id: string;
  ppaId: string;
  fecha: string;
  temaDia: string;
  contenido: string;
  createdAt: any;
}

export default function Planner() {
  const { isGuest, generationsCount } = useOutletContext<{ isGuest: boolean, generationsCount: number }>();
  const [activeTab, setActiveTab] = useState<'generate' | 'history'>('generate');
  const [isLimitModalOpen, setIsLimitModalOpen] = useState(false);
  
  // Form State
  const [selectedPpaId, setSelectedPpaId] = useState('');
  const [fecha, setFecha] = useState('');
  const [temaDia, setTemaDia] = useState('');
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [ppas, setPpas] = useState<PPAProject[]>([]);
  const [dailyPlans, setDailyPlans] = useState<DailyPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<DailyPlan | null>(null);

  const currentUserId = auth.currentUser?.uid;

  // Fetch PPAs for the dropdown
  useEffect(() => {
    if (!currentUserId) return;

    const q = query(
      collection(db, 'proyectos_ppa'),
      where('docenteId', '==', currentUserId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ppaData: PPAProject[] = [];
      snapshot.forEach((doc) => {
        ppaData.push({ 
          id: doc.id, 
          tema: doc.data().tema, 
          nivel: doc.data().nivel,
          contenido: doc.data().contenido 
        });
      });
      setPpas(ppaData);
      if (ppaData.length > 0 && !selectedPpaId) {
        setSelectedPpaId(ppaData[0].id);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'proyectos_ppa');
    });

    return () => unsubscribe();
  }, [currentUserId]);

  // Fetch Daily Plans History
  useEffect(() => {
    if (!currentUserId) return;

    const q = query(
      collection(db, 'planificaciones_diarias'),
      where('docenteId', '==', currentUserId),
      orderBy('fecha', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const plansData: DailyPlan[] = [];
      snapshot.forEach((doc) => {
        plansData.push({ id: doc.id, ...doc.data() } as DailyPlan);
      });
      setDailyPlans(plansData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'planificaciones_diarias');
    });

    return () => unsubscribe();
  }, [currentUserId]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPpaId || !fecha || !temaDia.trim() || !currentUserId) {
      alert("Por favor completa todos los campos.");
      return;
    }

    // Check Guest limit
    if (isGuest && generationsCount >= 3) {
      setIsLimitModalOpen(true);
      return;
    }

    const selectedPpa = ppas.find(p => p.id === selectedPpaId);
    if (!selectedPpa) return;

    setIsGenerating(true);
    try {
      let prompt = '';
      const systemInstruction = "Eres un docente venezolano experto en planificación diaria. Tu objetivo es crear planes de clase prácticos, creativos y efectivos basados en Proyectos Pedagógicos de Aula (PPA).";
      
      if (selectedPpa.nivel === 'Maternal') {
        prompt = `Genera una planificación diaria para el tema indicado, adaptada para niños de etapa maternal (1-3 años).

Estructura requerida:
1. Recibimiento (10 min): Actividad de apego y bienvenida.
2. Ronda / Asamblea (10 min): Introducción visual o musical.
3. Actividad Central Sensorial (15-20 min): Actividad de exploración o juego guiado. Detalla los materiales.
4. Rutina de Higiene/Alimentación: Cómo integrar el aprendizaje.
5. Despedida / Relajación (10 min): Vuelta a la calma.

DATOS:
- Fecha: ${fecha}
- Tema del Día: ${temaDia}
---
PROYECTO BASE:
${selectedPpa.contenido}`;
      } else {
        prompt = `Redacta una planificación de clase diaria estructurada.

Estructura requerida:
1. Inicio (Actividad motivacional o rompehielo)
2. Desarrollo (Explicación del contenido central con ejemplos)
3. Cierre (Actividad de evaluación rápida o reflexión)

DATOS:
- Fecha: ${fecha}
- Tema del Día: ${temaDia}
---
PROYECTO BASE:
${selectedPpa.contenido}`;
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          systemInstruction,
          temperature: 0.7,
        }
      });

      const generatedText = response.text;

      if (!generatedText) {
        throw new Error("La IA no devolvió ningún contenido. Por favor intenta de nuevo.");
      }

      const planData = {
        ppaId: selectedPpaId,
        fecha,
        temaDia: temaDia.trim(),
        contenido: generatedText,
      };

      // Save to Firestore
      const docRef = await addDoc(collection(db, 'planificaciones_diarias'), {
        docenteId: currentUserId,
        ...planData,
        createdAt: serverTimestamp()
      });

      // Increment generationsCount
      const userRef = doc(db, 'users', currentUserId);
      await updateDoc(userRef, {
        generationsCount: increment(1)
      });

      // Clear form
      setTemaDia('');
      
      // Show the generated plan
      setSelectedPlan({
        id: docRef.id,
        ...planData,
        createdAt: new Date()
      });
      setActiveTab('history');
      alert("¡Planificación diaria generada y guardada exitosamente!");

    } catch (error: any) {
      console.error("Error generating Daily Plan:", error);
      alert(`Hubo un error al generar la planificación: ${error.message || 'Error desconocido'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('¡Copiado al portapapeles!');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('¿Deseas eliminar esta planificación?')) return;
    try {
      await deleteDoc(doc(db, 'planificaciones_diarias', id));
      if (selectedPlan?.id === id) {
        setSelectedPlan(null);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'planificaciones_diarias');
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8 no-print">
        <h1 className="text-2xl font-bold text-gray-900">Planificador Diario</h1>
        <p className="text-gray-600 mt-1">Genera clases diarias estructuradas basadas en tus Proyectos Pedagógicos.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200 overflow-x-auto no-print">
        <button
          onClick={() => { setActiveTab('generate'); setSelectedPlan(null); }}
          className={`flex items-center gap-2 px-4 py-3 font-medium text-sm transition-colors border-b-2 whitespace-nowrap ${
            activeTab === 'generate' 
              ? 'border-blue-600 text-blue-600' 
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Generar Plan de Clase
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-4 py-3 font-medium text-sm transition-colors border-b-2 whitespace-nowrap ${
            activeTab === 'history' 
              ? 'border-blue-600 text-blue-600' 
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <History className="w-4 h-4" />
          Historial de Clases
        </button>
      </div>

      {/* Generate Tab */}
      {activeTab === 'generate' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8 max-w-3xl mx-auto">
          {ppas.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay Proyectos Pedagógicos</h3>
              <p className="text-gray-500 mb-6">Debes crear al menos un PPA antes de poder generar una planificación diaria.</p>
              <a href="/ppa" className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                Ir al Gestor de PPA
              </a>
            </div>
          ) : (
            <form onSubmit={handleGenerate} className="space-y-6">
              <div>
                <label htmlFor="ppa" className="block text-sm font-medium text-gray-700 mb-1">
                  Proyecto Base (PPA)
                </label>
                <select
                  id="ppa"
                  required
                  value={selectedPpaId}
                  onChange={(e) => setSelectedPpaId(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors bg-white"
                >
                  <option value="" disabled>Selecciona un proyecto...</option>
                  {ppas.map(ppa => (
                    <option key={ppa.id} value={ppa.id}>{ppa.tema}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="fecha" className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha de la Clase
                  </label>
                  <input
                    type="date"
                    id="fecha"
                    required
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                  />
                </div>

                <div>
                  <label htmlFor="temaDia" className="block text-sm font-medium text-gray-700 mb-1">
                    Tema Específico del Día
                  </label>
                  <input
                    type="text"
                    id="temaDia"
                    required
                    placeholder="Ej: El ciclo del agua"
                    value={temaDia}
                    onChange={(e) => setTemaDia(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isGenerating}
                className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-medium py-3 px-4 rounded-xl transition-all transform hover:scale-[1.01] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none shadow-md mt-8"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Generando Plan de Clase...
                  </>
                ) : (
                  <>
                    <BookOpen className="w-5 h-5" />
                    Generar Plan de Clase
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && !selectedPlan && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {dailyPlans.length === 0 ? (
            <div className="col-span-full bg-white rounded-xl p-8 text-center border border-gray-200">
              <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No tienes planificaciones diarias generadas aún.</p>
            </div>
          ) : (
            dailyPlans.map((plan) => {
              const ppa = ppas.find(p => p.id === plan.ppaId);
              const ppaName = ppa?.tema || 'Proyecto Desconocido';
              const isMaternal = ppa?.nivel === 'Maternal';

              return (
                <div 
                  key={plan.id} 
                  onClick={() => setSelectedPlan(plan)}
                  className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 cursor-pointer hover:shadow-md transition-all group ${isMaternal ? 'hover:border-orange-300' : 'hover:border-teal-300'}`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 ${isMaternal ? 'bg-orange-50 text-orange-700' : 'bg-teal-50 text-teal-700'}`}>
                      <Calendar className="w-3 h-3" />
                      {plan.fecha}
                    </span>
                    {isMaternal && (
                      <span className="bg-orange-100 text-orange-800 text-[10px] uppercase font-bold px-1.5 py-0.5 rounded">Maternal</span>
                    )}
                    <button 
                      onClick={(e) => handleDelete(plan.id, e)}
                      className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-teal-600 transition-colors">
                    {plan.temaDia}
                  </h3>
                  <p className="text-xs text-gray-500 line-clamp-1 mb-2">
                    <strong>PPA:</strong> {ppaName}
                  </p>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Selected Plan View */}
      {activeTab === 'history' && selectedPlan && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden print-document">
          {/* Header Actions */}
          <div className="bg-gray-50 border-b border-gray-200 p-4 flex flex-wrap justify-between items-center gap-4 no-print">
            <button 
              onClick={() => setSelectedPlan(null)}
              className="text-gray-500 hover:text-gray-700 flex items-center gap-1 font-medium text-sm"
            >
              <X className="w-4 h-4" />
              Cerrar Vista
            </button>
            <div className="flex gap-2">
              {!isGuest && (
                <button 
                  onClick={() => handleCopy(selectedPlan.contenido)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Copy className="w-4 h-4" />
                  Copiar
                </button>
              )}
              {!isGuest && (
                <button 
                  onClick={handlePrint}
                  className="flex items-center gap-2 px-3 py-1.5 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  PDF / Imprimir
                </button>
              )}
            </div>
          </div>

          {/* Plan Content */}
          <div className="p-8 sm:p-12">
            <div className="mb-8 pb-6 border-b border-gray-200">
              <div className="flex items-center gap-2 text-teal-600 font-semibold mb-2">
                <Calendar className="w-5 h-5" />
                {selectedPlan.fecha}
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">{selectedPlan.temaDia}</h2>
              <div className="text-sm text-gray-600 flex flex-wrap gap-4">
                <p><strong>Nivel:</strong> {ppas.find(p => p.id === selectedPlan.ppaId)?.nivel || 'Primaria'}</p>
                <p><strong>Proyecto Base:</strong> {ppas.find(p => p.id === selectedPlan.ppaId)?.tema || 'Desconocido'}</p>
              </div>
            </div>
            
            <div className="prose prose-teal max-w-none prose-headings:font-bold prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg">
              <Markdown>{selectedPlan.contenido}</Markdown>
            </div>
          </div>
        </div>
      )}

      <LimitReachedModal 
        isOpen={isLimitModalOpen} 
        onClose={() => setIsLimitModalOpen(false)} 
      />
    </div>
  );
}
