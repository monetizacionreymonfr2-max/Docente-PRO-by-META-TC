import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, where, deleteDoc, doc, updateDoc, increment } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { generateContentWithRetry } from '../lib/gemini';
import { Sparkles, Loader2, FileText, Copy, Printer, X, History, Trash2, Edit3, Save, GraduationCap } from 'lucide-react';
import Markdown from 'react-markdown';
import LimitReachedModal from '../components/LimitReachedModal';

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
  const [activeTab, setActiveTab] = useState<'generate' | 'history'>(() => {
    return (localStorage.getItem('ppa_active_tab') as 'generate' | 'history') || 'generate';
  });
  const [isLimitModalOpen, setIsLimitModalOpen] = useState(false);
  
  // Form State
  const [gradoSeccion, setGradoSeccion] = useState(() => localStorage.getItem('ppa_form_grado') || '');
  const [nivel, setNivel] = useState<'Primaria' | 'Maternal' | 'Preescolar' | 'Media'>(() => (localStorage.getItem('ppa_form_nivel') as any) || 'Primaria');
  const [tema, setTema] = useState(() => localStorage.getItem('ppa_form_tema') || '');
  const [duracion, setDuracion] = useState(() => localStorage.getItem('ppa_form_duracion') || '');
  const [diagnostico, setDiagnostico] = useState(() => localStorage.getItem('ppa_form_diagnostico') || '');
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [projects, setProjects] = useState<PPAProject[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<PPAProject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync Form to LocalStorage
  useEffect(() => {
    localStorage.setItem('ppa_active_tab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    localStorage.setItem('ppa_form_grado', gradoSeccion);
    localStorage.setItem('ppa_form_nivel', nivel);
    localStorage.setItem('ppa_form_tema', tema);
    localStorage.setItem('ppa_form_duracion', duracion);
    localStorage.setItem('ppa_form_diagnostico', diagnostico);
  }, [gradoSeccion, nivel, tema, duracion, diagnostico]);

  // Persist selected project ID
  useEffect(() => {
    if (selectedProject) {
      localStorage.setItem('ppa_selected_id', selectedProject.id);
    } else if (activeTab === 'generate') {
       // if we are in generate and just cleared, maybe keep it? 
       // but if we switch to history and don't select anything, clear it.
    }
  }, [selectedProject, activeTab]);

  // Auto-select project from ID on history load
  useEffect(() => {
    const savedId = localStorage.getItem('ppa_selected_id');
    if (savedId && projects.length > 0 && !selectedProject) {
      const found = projects.find(p => p.id === savedId);
      if (found) {
        setSelectedProject(found);
      }
    }
  }, [projects, selectedProject]);

  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedContent, setEditedContent] = useState('');

  // Fetch History
  useEffect(() => {
    if (!teacherId) return;

    const q = query(
      collection(db, 'proyectos_ppa'),
      where('docenteId', '==', teacherId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const projectsData: PPAProject[] = [];
      snapshot.forEach((doc) => {
        projectsData.push({ id: doc.id, ...doc.data() } as PPAProject);
      });
      setProjects(projectsData);
      setIsInitialLoading(false);
    }, (error) => {
      setIsInitialLoading(false);
      handleFirestoreError(error, OperationType.LIST, 'proyectos_ppa');
    });

    return () => unsubscribe();
  }, [teacherId]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!gradoSeccion.trim() || !tema.trim() || !duracion.trim() || !diagnostico.trim() || !teacherId) {
      setErrorMsg("Por favor completa todos los campos requeridos.");
      return;
    }

    // Check Guest limit
    if (isGuest && generationsCount >= 3) {
      setIsLimitModalOpen(true);
      return;
    }

    setIsGenerating(true);
    setErrorMsg(null);
    try {
      let prompt = '';
      
      let levelTitleStr = "EDUCACIÓN PRIMARIA";
      if (nivel === 'Maternal') levelTitleStr = "MATERNAL";
      else if (nivel === 'Preescolar') levelTitleStr = "EDUCACIÓN INICIAL / PREESCOLAR";
      else if (nivel === 'Media') levelTitleStr = "EDUCACIÓN MEDIA";

      const systemInstruction = `Eres un especialista senior en planificación educativa del MPPE (Venezuela), con profundo conocimiento del currículo y de la guía organizativa oficial para el nivel de ${levelTitleStr} 2025-2026. 

Tu misión es generar Proyectos Pedagógicos de Aula (PPA) para el nivel de ${levelTitleStr} bajo el NUEVO FORMATO VIGENTE. Debes seguir estrictamente estos parámetros respetando el nivel educativo seleccionado por el usuario en todos los elementos teóricos y prácticos:

Respetar SIEMPRE y sin excepciones el nivel educativo (${nivel}) y el grado o sala especificado por el usuario (${gradoSeccion.trim()}). No asumas ni fuerces cambios a otros niveles o grados (como Primaria o Cuarto Grado) a menos que sea explícitamente solicitado. Coloca de manera clara e inequívoca el nivel y grado indicados.

1. ESTRUCTURA DEL P.A.:
   - Identificación completa (Código plantel, Logo, Docente, Matrícula M/F/T, Año Escolar 2025-2026, Duración, Nivel Educativo: ${nivel}, Grado/Sección/Sala: ${gradoSeccion.trim()}).
   - Identificación de PEIC relacionado.
   - Línea de Investigación (seleccionar de las oficiales: Currículo, Gestión, Clima Escolar, etc.).
   - Diagnóstico Integral (Cognitivo, socio-emocional, familiar y social).
   - Propósito (Verbos en infinitivo).

2. ELEMENTOS INTEGRADORES (TABLA):
   - Áreas de Formación o Áreas de Aprendizaje correlacionadas con Énfasis Curriculares. (Para Maternal y Preescolar usar áreas de aprendizaje de Educación Inicial: Formación Personal y Social, Relación con los Componentes del Ambiente, Comunicación y Representación).
   - Temas Indispensables (Seleccionar de los 14 oficiales).
   - Tema Generador / Componente.
   - Tejido Temático / Contenido / Aprendizaje Esperado.
   - Énfasis Curricular.
   - Vértices del Plan Educativo (Seleccionar del 1 al 10).

3. MOMENTOS DE LA CLASE / PLANIFICACIÓN DE LA JORNADA: 
   - Para Primaria/Media: Exploración, Desarrollo y Reflexión.
   - Para Maternal/Preescolar: Inicio (Recibimiento), Trabajo Libre en los Espacios, Pequeños Grupos y Cierre.

4. INTENCIONALIDADES:
   - Aprender a Crear, Conviver y Participar (o Aprender a Convivir en Inicial/Maternal), Valorar y Reflexionar.

Usa un tono técnico-pedagógico impecable, lenguaje oficial actualizado, y asegúrate de estructurar y etiquetar el proyecto basándote enteramente en el nivel (${nivel}) y grado/sección (${gradoSeccion.trim()}) seleccionados por el docente. Jamás insertes notas aclaratorias indicando falsamente que se asume otro grado o nivel.`;

      if (nivel === 'Maternal') {
        prompt = `Genera un PPA para el nivel MATERNAL bajo el nuevo formato MPPE 2025-2026.
DATOS: Tema: ${tema}, Sala/Edad: ${gradoSeccion}, Duración: ${duracion}, Diagnóstico: ${diagnostico}.

ESTRUCTURA TÉCNICA:
1. MEMBRETE: Incluir Año Escolar 2025-2026 y Matrícula proyectada.
2. CONTEXTO: PEIC y Línea de Investigación pertinente.
3. DIAGNÓSTICO Y PROPÓSITO: Basados en las necesidades de desarrollo infantil.
4. TABLA DE CORRELACIÓN CURRICULAR:
   - Áreas de Aprendizaje (Formación Personal y Social, Relación con los Componentes del Ambiente, Comunicación y Representación).
   - Componentes y Énfasis correspondientes.
   - Temas Indispensables pertinentes (Ej: Preservación de la vida, Soberanía Alimentaria).
   - Vértices del Plan Educativo (1 al 10).
5. ESTRATEGIAS Y ACTIVIDADES (Divididas en: Bienvenida, Trabajo Libre en Espacios, Pequeños Grupos, Despedida).
6. INTENCIONALIDADES (Aprender a Crear, Convivir, Valorar, Reflexionar).
7. RECURSOS E INDICADORES DE EVALUACIÓN (Cualitativos).`;
      } else if (nivel === 'Preescolar') {
        prompt = `Genera un PPA para el nivel PREESCOLAR/INICIAL bajo el nuevo formato MPPE 2025-2026.
DATOS: Tema: ${tema}, Sección: ${gradoSeccion}, Duración: ${duracion}, Diagnóstico: ${diagnostico}.

ESTRUCTURA TÉCNICA OBLIGATORIA:
1. MEMBRETE E IDENTIFICACIÓN: Año Escolar 2025-2026, Matrícula detallada.
2. PEIC Y LÍNEAS DE INVESTIGACIÓN (Selecciona de las oficiales del MPPE).
3. DIAGNÓSTICO INTEGRAL Y PROPÓSITO GENERAL (en infinitivo).
4. PLANIFICACIÓN INTEGRAL (TABLA):
   - Áreas de Formación y Énfasis Curriculares.
   - Temas Indispensables (Selecciona entre los 14 oficiales).
   - Tema Generador y Tejido Temático.
   - Vértices Educativos (Ej: Vértice 5 Cada familia una escuela).
5. PLANIFICACIÓN DE LA JORNADA (Exploración, Desarrollo y Reflexión).
6. REFERENTES TEÓRICOS PRÁCTICOS.
7. INTENCIONALIDADES, RECURSOS E INDICADORES.`;
      } else {
        const nivelText = nivel === 'Media' ? 'EDUCACIÓN MEDIA' : 'EDUCACIÓN PRIMARIA';
        prompt = `Genera un PPA para ${nivelText} siguiendo estrictamente la "GUÍA ORGANIZATIVA 2025-2026".
DATOS: Grado/Sección: ${gradoSeccion}, Tema: ${tema}, Duración: ${duracion}, Diagnóstico: ${diagnostico}.

REQUISITOS DEL FORMATO OFICIAL:
1. **IDENTIFICACIÓN**: Código del plantel, Logo, Año Escolar 2025-2026, Matrícula proyectada.
2. **CONTEXTO**: 
   - PEIC relacionado y Línea de Investigación (Ej: Currículo, Gestión Escolar, Clima Escolar).
   - Diagnóstico Pedagógico (Integral: cognitivo, socio-emocional y social).
   - Propósito (Verbos en infinitivo: -ar, -er, -ir).
3. **TABLA DE CORRELACIÓN CURRICULAR (ESTRICTA)**:
   Debes usar esta relación:
   - Lenguaje y Comunicación -> Lengua y Escritura.
   - Matemáticas -> Matemáticas.
   - Ciencias Naturales -> Ciencias Naturales.
   - Ciencias Sociales -> Identidad.
   - Educ. Física -> Deporte.
   - Cultura e Idiomas -> Cultura.
   Incluir: Tema Indispensable (de los 14 oficiales), Tema Generador, Tejido Temático, Énfasis Curricular y Vértices (1 al 10).
4. **MOMENTOS DE CLASE**: Exploración, Desarrollo y Reflexión.
5. **ESTRATEGIAS**: Estrategias activas (ABP, Gamificación, Aprendizaje Cooperativo).
6. **INTENCIONALIDADES**: Aprender a Crear, Aprender a Convivir y Participar, Aprender a Valorar, Aprender a Reflexionar.
7. **RECOURSOS E INDICADORES DE EVALUACIÓN CUALITATIVA**.`;
      }

      console.log("Generando PPA con prompt:", prompt);

      const response = await generateContentWithRetry({
        model: 'gemini-3.1-flash-lite',
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
      
      // Show the generated project in the same tab underneath
      setSelectedProject({
        id: docRef.id,
        ...projectData,
        createdAt: new Date()
      });

    } catch (error: any) {
      console.error("Error generating PPA:", error);
      setErrorMsg(`Hubo un error: ${error.message || 'Error desconocido'}`);
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

  const handleProjectClick = (project: PPAProject) => {
    setSelectedProject(project);
    setEditedTitle(project.tema);
    setEditedContent(project.contenido);
    setIsEditing(false);
  };

  const handleSaveEdit = async () => {
    if (!selectedProject || !editedTitle.trim() || !editedContent.trim()) return;
    try {
      const docRef = doc(db, 'proyectos_ppa', selectedProject.id);
      await updateDoc(docRef, {
        tema: editedTitle,
        contenido: editedContent
      });
      setSelectedProject(prev => prev ? { ...prev, tema: editedTitle, contenido: editedContent } : null);
      setIsEditing(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'proyectos_ppa');
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
        <h1 className="text-2xl font-bold text-white">Gestor de PPA con IA</h1>
        <p className="text-slate-300 mt-1">Genera Proyectos Pedagógicos de Aula estructurados automáticamente.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-white/10 overflow-x-auto no-print">
        <button
          onClick={() => { setActiveTab('generate'); setSelectedProject(null); }}
          className={`flex items-center gap-2 px-4 py-3 font-medium text-sm transition-colors border-b-2 whitespace-nowrap ${
            activeTab === 'generate' 
              ? 'border-blue-400 text-blue-400 font-bold' 
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          Generar Nuevo PPA
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-4 py-3 font-medium text-sm transition-colors border-b-2 whitespace-nowrap ${
            activeTab === 'history' 
              ? 'border-blue-400 text-blue-400 font-bold' 
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <History className="w-4 h-4" />
          Historial de Proyectos
        </button>
      </div>

      {/* Generate Tab */}
      {activeTab === 'generate' && (
        <div className="space-y-8">
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
                    placeholder={
                      nivel === 'Maternal' 
                        ? 'Ej: Lactantes II' 
                        : nivel === 'Preescolar' 
                        ? 'Ej: 2do Grupo Sección A' 
                        : nivel === 'Media' 
                        ? 'Ej: 3er Año Sección B' 
                        : 'Ej: 4to Grado A'
                    }
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

              {errorMsg && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  <span>{errorMsg}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isGenerating}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium py-3 px-4 rounded-xl transition-all transform hover:scale-[1.01] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none shadow-md"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Procesando Proyecto... (esto puede tardar unos segundos)</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    <span>Generar PPA</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && !selectedProject && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {isInitialLoading ? (
             <div className="col-span-full py-20 text-center">
               <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto mb-4" />
               <p className="text-gray-500 font-medium">Buscando tus proyectos...</p>
             </div>
          ) : projects.length === 0 ? (
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
                  onClick={() => handleProjectClick(project)}
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
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors sm:opacity-0 group-hover:opacity-100"
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
      {(activeTab === 'history' || activeTab === 'generate') && selectedProject && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden print-document mt-8">
          {/* Header Actions */}
          <div className="bg-gray-50 border-b border-gray-200 p-4 flex flex-wrap justify-between items-center gap-4 no-print">
            <button 
              onClick={() => {
                setSelectedProject(null);
                localStorage.removeItem('ppa_selected_id');
              }}
              className="text-gray-500 hover:text-gray-700 flex items-center gap-1 font-medium text-sm"
            >
              <X className="w-4 h-4" />
              Cerrar Vista
            </button>
            <div className="flex gap-2">
              {!isGuest && !isEditing && (
                <button 
                  onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
                  className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Edit3 className="w-4 h-4" />
                  Editar
                </button>
              )}
              {!isGuest && isEditing && (
                <button 
                  onClick={(e) => { e.stopPropagation(); handleSaveEdit(); }}
                  className="flex items-center gap-2 px-3 py-1.5 bg-green-600 border border-green-700 rounded-lg text-sm font-medium text-white hover:bg-green-700 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  Guardar
                </button>
              )}
              {!isGuest && (
                <button 
                  onClick={(e) => { e.stopPropagation(); handleCopy(selectedProject.contenido); }}
                  className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Copy className="w-4 h-4" />
                  Copiar
                </button>
              )}
              {!isGuest && !isEditing && (
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
          <div className="p-8 sm:p-12 relative">
            {!isEditing && (
              <div className="absolute top-6 right-8 text-right flex flex-col items-end">
                <div className="flex items-center gap-1.5 text-blue-600 font-bold text-sm tracking-tight">
                  <GraduationCap className="w-4 h-4 text-blue-500" />
                  <span>Docenty<span className="text-blue-500"> PRO</span></span>
                </div>
                <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest -mt-0.5">by META TC</span>
              </div>
            )}
            {isEditing ? (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Título del Proyecto</label>
                <input 
                   type="text" 
                   value={editedTitle} 
                   onChange={e => setEditedTitle(e.target.value)} 
                   className="w-full text-2xl font-bold text-gray-900 mb-4 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            ) : (
              <div className="mb-8 pb-6 border-b border-gray-200 pr-24">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">{selectedProject.tema}</h2>
                <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                  <p><strong>Nivel:</strong> {selectedProject.nivel || 'Primaria'}</p>
                  <p><strong>{selectedProject.nivel === 'Maternal' ? 'Sala/Edad' : 'Grado/Sección'}:</strong> {selectedProject.gradoSeccion}</p>
                  <p><strong>Duración:</strong> {selectedProject.duracion}</p>
                </div>
              </div>
            )}
            
            <div className="prose prose-blue max-w-none prose-headings:font-bold prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg text-gray-900 prose-p:text-gray-800 prose-li:text-gray-800">
              {isEditing ? (
                 <textarea
                   value={editedContent}
                   onChange={e => setEditedContent(e.target.value)}
                   className="w-full h-[600px] p-4 border border-gray-300 rounded-md font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                 />
              ) : (
                <Markdown>{selectedProject.contenido}</Markdown>
              )}
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
