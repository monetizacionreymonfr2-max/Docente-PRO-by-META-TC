import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, where, deleteDoc, doc, updateDoc, increment } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { GoogleGenAI } from '@google/genai';
import { Sparkles, Loader2, FileText, Copy, Printer, X, History, Trash2 } from 'lucide-react';
import Markdown from 'react-markdown';
import LimitReachedModal from '../components/LimitReachedModal';

// Initialize Gemini API
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

interface PPAProject {
  id: string;
  gradoSeccion: string;
  nivel: 'Primaria' | 'Maternal' | 'Preescolar' | 'Media';
  tema: string;
  duracion: string;
  diagnostico: string;
  contenido: string;
  createdAt: any;
}

export default function PPA() {
  const { isGuest, generationsCount, teacherId } = useOutletContext<{ isGuest: boolean, generationsCount: number, teacherId: string }>();
  const [activeTab, setActiveTab] = useState<'generate' | 'history'>('generate');
  const [isLimitModalOpen, setIsLimitModalOpen] = useState(false);
  
  // Form State
  const [gradoSeccion, setGradoSeccion] = useState('');
  const [nivel, setNivel] = useState<'Primaria' | 'Maternal' | 'Preescolar' | 'Media'>('Primaria');
  const [tema, setTema] = useState('');
  const [duracion, setDuracion] = useState('');
  const [diagnostico, setDiagnostico] = useState('');
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [projects, setProjects] = useState<PPAProject[]>([]);
  const [selectedProject, setSelectedProject] = useState<PPAProject | null>(null);

  // Fetch History
  useEffect(() => {
    if (!teacherId) return;

    const q = query(
      collection(db, 'proyectos_ppa'),
      where('teacher_id', '==', teacherId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const projectsData: PPAProject[] = [];
      snapshot.forEach((doc) => {
        projectsData.push({ id: doc.id, ...doc.data() } as PPAProject);
      });
      setProjects(projectsData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'proyectos_ppa');
    });

    return () => unsubscribe();
  }, [teacherId]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!gradoSeccion.trim() || !tema.trim() || !duracion.trim() || !diagnostico.trim() || !teacherId) {
      alert("Por favor completa todos los campos requeridos.");
      return;
    }

    // Check Guest limit
    if (isGuest && generationsCount >= 3) {
      setIsLimitModalOpen(true);
      return;
    }

    setIsGenerating(true);
    try {
      let prompt = '';
      const systemInstruction = "Eres un especialista en planificación educativa adaptado al sistema escolar de Venezuela. Tu objetivo es redactar Proyectos Pedagógicos de Aula (PPA) completos, profesionales y listos para imprimir. Usa un tono formal, pedagógico y enfocado en el aprendizaje significativo.";

      if (nivel === 'Maternal') {
        prompt = `Actúa como un docente experto en Educación Inicial, etapa Maternal (0-3 años) en Venezuela. 
Genera un Proyecto Pedagógico de Aula (PPA) completo siguiendo estrictamente las orientaciones del Ministerio del Poder Popular para la Educación (MPPE) de Venezuela.

DATOS DEL PROYECTO:
- Tema Central: ${tema}
- Grupo Etáreo/Sala: ${gradoSeccion}
- Duración: ${duracion}
- Diagnóstico inicial: ${diagnostico}

ESTRUCTURA REQUERIDA (Formato Markdown):

1.  **MEMBRETE DEL PLANTEL**
2.  **IDENTIFICACIÓN**:
    - Docentes: (Nombre del docente)
    - Matrícula: (Número de niños/as)
    - Etapa: Maternal
    - Grupo Etáreo: ${gradoSeccion}
3.  **DIAGNÓSTICO PEDAGÓGICO**: (Un párrafo pedagógico y detallado que sea la base para las experiencias de aprendizaje).
4.  **PLANIFICACIÓN DIDÁCTICA (TABLA TÉCNICA)**: Genera una tabla con:
    - Área de Formación
    - Componente
    - Énfasis Prioritario
    - Contenidos Esenciales
    - Tejido Temático
    - Referentes Teóricos y Prácticos
    - Aprendizajes Esperados
    (Incluye áreas: Formación Personal y Social, Relación con otros componentes del Ambiente, Comunicación y Representación).
5.  **PLANIFICACIÓN DE LA JORNADA (LUNES A VIERNES)**:
    Detalla actividades y estrategias para:
    - **Bienvenida** (Identidad y Lenguaje)
    - **Aseo Personal y Alimentación** (Higiene, autonomía)
    - **Planificación del Niño/a** (Expresión de deseos)
    - **Trabajo Libre en los Espacios** (Rincón de Lectura, Representar e Imitar, Armar y Construir, Experimentar y Descubrir, Expresar y Crear).
    - **Intercambio y Recuento** (Círculo de conversación)
    - **Pequeños Grupos** (Actividades dirigidas)
    - **Despedida** (Cierre afectivo)

Tono: Profesional, pedagógico y centrado en el aprendizaje a través del juego y la rutina. Usa lenguaje oficial de Venezuela.`;
      } else if (nivel === 'Preescolar') {
        prompt = `Genera un Proyecto de Aprendizaje para niños de la etapa Preescolar (3-6 años). 
El tema de interés de los niños es: ${tema}.

Estructura requerida:
1. Título del Proyecto (creativo y corto)
2. Objetivo general (enfocado en el desarrollo integral)
3. Áreas de desarrollo a estimular (Formación Personal, Social y Comunicación, Relación con otros componentes del Ambiente)
4. Lista de materiales recomendados
5. Hitos de evaluación cualitativa

Datos adicionales:
- Sala/Edad/Sección: ${gradoSeccion}
- Duración: ${duracion}
- Diagnóstico: ${diagnostico}`;
      } else {
        prompt = `Redacta un Proyecto Pedagógico estructurado para educación por grados (${nivel}). 
Estructura requerida:
1. Título del Proyecto (creativo)
2. Justificación
3. Propósito General
4. Áreas de Aprendizaje (Lenguaje, Matemáticas, Ciencias Naturales, Ciencias Sociales)
5. Estrategias de Evaluación.

Datos de entrada:
- Grado/Año y Sección: ${gradoSeccion}
- Tema Central: ${tema}
- Duración Estimada: ${duracion}
- Diagnóstico o Necesidad: ${diagnostico}`;
      }

      console.log("Generando PPA con prompt:", prompt);

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

      // Capture values for the state before clearing them
      const projectData = {
        gradoSeccion: gradoSeccion.trim(),
        nivel,
        tema: tema.trim(),
        duracion: duracion.trim(),
        diagnostico: diagnostico.trim(),
        contenido: generatedText,
      };

      // Save to Firestore
      const docRef = await addDoc(collection(db, 'proyectos_ppa'), {
        teacher_id: teacherId, // New unified isolation field
        docenteId: teacherId, // Legacy compatibility
        ...projectData,
        createdAt: serverTimestamp()
      });

      // Increment generationsCount if not admin (admins have unlimited anyway but good to track)
      const userRef = doc(db, 'users', teacherId);
      await updateDoc(userRef, {
        generationsCount: increment(1)
      });

      // Clear form
      setGradoSeccion('');
      setTema('');
      setDuracion('');
      setDiagnostico('');
      
      // Show the generated project in history
      setSelectedProject({
        id: docRef.id,
        ...projectData,
        createdAt: new Date()
      });
      setActiveTab('history');
      alert("¡PPA generado y guardado exitosamente!");

    } catch (error: any) {
      console.error("Error generating PPA:", error);
      alert(`Hubo un error al generar el proyecto: ${error.message || 'Error desconocido'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid selecting the project
    if (!window.confirm('¿Estás seguro de que deseas eliminar este proyecto?')) return;
    
    try {
      await deleteDoc(doc(db, 'proyectos_ppa', id));
      if (selectedProject?.id === id) {
        setSelectedProject(null);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'proyectos_ppa');
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('¡Copiado al portapapeles!');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8 no-print">
        <h1 className="text-2xl font-bold text-gray-900">Gestor de PPA con IA</h1>
        <p className="text-gray-600 mt-1">Genera Proyectos Pedagógicos de Aula estructurados automáticamente.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200 overflow-x-auto no-print">
        <button
          onClick={() => { setActiveTab('generate'); setSelectedProject(null); }}
          className={`flex items-center gap-2 px-4 py-3 font-medium text-sm transition-colors border-b-2 whitespace-nowrap ${
            activeTab === 'generate' 
              ? 'border-blue-600 text-blue-600' 
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          Generar Nuevo PPA
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
          Historial de Proyectos
        </button>
      </div>

      {/* Generate Tab */}
      {activeTab === 'generate' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8 max-w-3xl mx-auto">
          <form onSubmit={handleGenerate} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label htmlFor="nivel" className="block text-sm font-medium text-gray-700 mb-1">
                  Nivel Educativo
                </label>
                <select
                  id="nivel"
                  required
                  value={nivel}
                  onChange={(e) => setNivel(e.target.value as any)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                >
                  <option value="Maternal">Maternal (1-3 años)</option>
                  <option value="Preescolar">Preescolar / Inicial</option>
                  <option value="Primaria">Primaria (1ro a 6to)</option>
                  <option value="Media">Media (1er a 5to año)</option>
                </select>
              </div>

              <div>
                <label htmlFor="gradoSeccion" className="block text-sm font-medium text-gray-700 mb-1">
                  {nivel === 'Maternal' || nivel === 'Preescolar' ? 'Sala / Edad / Sección' : nivel === 'Media' ? 'Año y Sección' : 'Grado y Sección'}
                </label>
                <input
                  type="text"
                  id="gradoSeccion"
                  required
                  placeholder={nivel === 'Maternal' ? 'Ej: Lactantes II' : 'Ej: 4to Grado A'}
                  value={gradoSeccion}
                  onChange={(e) => setGradoSeccion(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label htmlFor="duracion" className="block text-sm font-medium text-gray-700 mb-1">
                Duración Estimada
              </label>
              <input
                type="text"
                id="duracion"
                required
                placeholder="Ej: 4 semanas"
                value={duracion}
                onChange={(e) => setDuracion(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
              />
            </div>

            <div>
              <label htmlFor="tema" className="block text-sm font-medium text-gray-700 mb-1">
                Tema Central
              </label>
              <input
                type="text"
                id="tema"
                required
                placeholder="Ej: Conociendo la historia de mi comunidad"
                value={tema}
                onChange={(e) => setTema(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
              />
            </div>

            <div>
              <label htmlFor="diagnostico" className="block text-sm font-medium text-gray-700 mb-1">
                Diagnóstico o Necesidad
              </label>
              <textarea
                id="diagnostico"
                required
                rows={4}
                placeholder="Ej: Los alumnos muestran interés por las leyendas locales pero tienen dificultades en la comprensión lectora..."
                value={diagnostico}
                onChange={(e) => setDiagnostico(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={isGenerating}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium py-3 px-4 rounded-xl transition-all transform hover:scale-[1.01] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none shadow-md"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generando Proyecto con IA...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Generar PPA
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && !selectedProject && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.length === 0 ? (
            <div className="col-span-full bg-white rounded-xl p-8 text-center border border-gray-200">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No tienes proyectos generados aún.</p>
            </div>
          ) : (
            projects.map((project) => {
              const date = project.createdAt?.toDate ? project.createdAt.toDate().toLocaleDateString() : 'Reciente';
              return (
                <div 
                  key={project.id} 
                  onClick={() => setSelectedProject(project)}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 cursor-pointer hover:shadow-md hover:border-blue-300 transition-all group"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex flex-col gap-1">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full w-fit ${project.nivel === 'Maternal' ? 'bg-orange-50 text-orange-700' : 'bg-blue-50 text-blue-700'}`}>
                        {project.nivel || 'Primaria'}
                      </span>
                      <span className="text-gray-500 text-xs font-semibold px-2 px-1">
                        {project.gradoSeccion}
                      </span>
                    </div>
                    <div className="flex flex-col gap-2 items-end">
                      <span className="text-xs text-gray-400">{date}</span>
                      <button 
                        onClick={(e) => handleDelete(project.id, e)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                    {project.tema}
                  </h3>
                  <p className="text-sm text-gray-500 line-clamp-3">
                    {project.diagnostico}
                  </p>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Selected Project View (Modal-like but inline for better mobile UX) */}
      {activeTab === 'history' && selectedProject && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden print-document">
          {/* Header Actions */}
          <div className="bg-gray-50 border-b border-gray-200 p-4 flex flex-wrap justify-between items-center gap-4 no-print">
            <button 
              onClick={() => setSelectedProject(null)}
              className="text-gray-500 hover:text-gray-700 flex items-center gap-1 font-medium text-sm"
            >
              <X className="w-4 h-4" />
              Cerrar Vista
            </button>
            <div className="flex gap-2">
              {!isGuest && (
                <button 
                  onClick={() => handleCopy(selectedProject.contenido)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Copy className="w-4 h-4" />
                  Copiar
                </button>
              )}
              {!isGuest && (
                <button 
                  onClick={handlePrint}
                  className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  PDF / Imprimir
                </button>
              )}
            </div>
          </div>

          {/* Project Content */}
          <div className="p-8 sm:p-12">
            <div className="mb-8 pb-6 border-b border-gray-200">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">{selectedProject.tema}</h2>
              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                <p><strong>Nivel:</strong> {selectedProject.nivel || 'Primaria'}</p>
                <p><strong>{selectedProject.nivel === 'Maternal' ? 'Sala/Edad' : 'Grado/Sección'}:</strong> {selectedProject.gradoSeccion}</p>
                <p><strong>Duración:</strong> {selectedProject.duracion}</p>
              </div>
            </div>
            
            <div className="prose prose-blue max-w-none prose-headings:font-bold prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg">
              <Markdown>{selectedProject.contenido}</Markdown>
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
