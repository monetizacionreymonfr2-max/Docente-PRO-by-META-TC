import { useState, useEffect, useMemo } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { SupabaseService } from '../lib/supabaseService';
import { generateContentWithRetry } from '../lib/gemini';
import { 
  Sparkles, Loader2, FileText, Copy, Printer, X, History, Trash2, 
  Edit3, Save, GraduationCap, CheckSquare, Square, ChevronDown, 
  ChevronRight, RefreshCw, BookOpen, AlertCircle, Check, Info, ShieldCheck
} from 'lucide-react';
import Markdown from 'react-markdown';
import LimitReachedModal from '../components/LimitReachedModal';
import FormatoBadgeButton from '../components/formato/FormatoBadgeButton';
import { 
  CURRICULO_MPPE_2026_2027, 
  AREAS_CURRICULARES, 
  AreaCurricular, 
  GradoPrimaria,
  buscarContenidoMasCercano 
} from '../data/curriculoMPPE';

interface PPAProject {
  id: string;
  gradoSeccion: string;
  nivel: 'Primaria' | 'Maternal' | 'Preescolar' | 'Media' | 'Especial';
  tema: string;
  duracion: string;
  diagnostico: string;
  contenido: string;
  createdAt: any;
}

export default function PPA() {
  const { isGuest = false, generationsCount = 0, teacherId = '' } = useOutletContext<{ isGuest?: boolean, generationsCount?: number, teacherId?: string }>() || {};
  const [activeTab, setActiveTab] = useState<'generate' | 'history'>(() => {
    return (localStorage.getItem('ppa_active_tab') as 'generate' | 'history') || 'generate';
  });
  const [isLimitModalOpen, setIsLimitModalOpen] = useState(false);
  
  // Form State
  const [gradoSeccion, setGradoSeccion] = useState(() => localStorage.getItem('ppa_form_grado') || '');
  const [nivel, setNivel] = useState<'Primaria' | 'Maternal' | 'Preescolar' | 'Media' | 'Especial'>(() => (localStorage.getItem('ppa_form_nivel') as any) || 'Primaria');
  const [tema, setTema] = useState(() => localStorage.getItem('ppa_form_tema') || '');
  const [duracion, setDuracion] = useState(() => localStorage.getItem('ppa_form_duracion') || '');
  const [diagnostico, setDiagnostico] = useState(() => localStorage.getItem('ppa_form_diagnostico') || '');
  
  // MPPE 2026-2027 Specific State for Primaria
  const [gradoPrimaria, setGradoPrimaria] = useState<GradoPrimaria>(() => {
    const saved = localStorage.getItem('ppa_mppe_grado');
    return (saved as GradoPrimaria) || '1';
  });
  const [seccionPrimaria, setSeccionPrimaria] = useState(() => localStorage.getItem('ppa_mppe_seccion') || 'A');
  const [selectedAreas, setSelectedAreas] = useState<AreaCurricular[]>(() => {
    const saved = localStorage.getItem('ppa_mppe_areas');
    try {
      return saved ? JSON.parse(saved) : ['Prácticas del Lenguaje'];
    } catch {
      return ['Prácticas del Lenguaje'];
    }
  });
  const [selectedAprendizajes, setSelectedAprendizajes] = useState<Record<string, boolean>>({});
  const [expandedComponents, setExpandedComponents] = useState<Record<string, boolean>>({});
  const [complementoDocente, setComplementoDocente] = useState(() => localStorage.getItem('ppa_mppe_complemento') || '');

  // Remapping / Migration State
  const [isRemapModalOpen, setIsRemapModalOpen] = useState(false);
  const [remapTargetProject, setRemapTargetProject] = useState<PPAProject | null>(null);
  const [remapSuggestions, setRemapSuggestions] = useState<any[]>([]);
  const [isApplyingRemap, setIsApplyingRemap] = useState(false);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [projects, setProjects] = useState<PPAProject[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<PPAProject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

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
    localStorage.setItem('ppa_mppe_grado', gradoPrimaria);
    localStorage.setItem('ppa_mppe_seccion', seccionPrimaria);
    localStorage.setItem('ppa_mppe_areas', JSON.stringify(selectedAreas));
    localStorage.setItem('ppa_mppe_complemento', complementoDocente);
  }, [gradoSeccion, nivel, tema, duracion, diagnostico, gradoPrimaria, seccionPrimaria, selectedAreas, complementoDocente]);

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

    const fetchSupabaseHistory = async () => {
      try {
        const list = await SupabaseService.getPlanificaciones(teacherId);
        const projectsData: PPAProject[] = list.map(item => ({
          id: item.id,
          gradoSeccion: item.proyecto || '',
          nivel: item.nivel || 'Primaria',
          tema: item.titulo,
          duracion: item.fechaFin || '',
          diagnostico: item.diagnostico || '',
          contenido: item.proposito || '',
          createdAt: item.createdAt ? new Date(item.createdAt) : new Date()
        }));
        setProjects(projectsData);
        setIsInitialLoading(false);
      } catch (err) {
        console.error("Error loading PPAs from Supabase:", err);
        setIsInitialLoading(false);
      }
    };
    fetchSupabaseHistory();
    const interval = setInterval(fetchSupabaseHistory, 8000);
    return () => clearInterval(interval);
  }, [teacherId]);

  // Helpers for MPPE 2026-2027 selection
  const toggleArea = (area: AreaCurricular) => {
    setSelectedAreas(prev => {
      if (prev.includes(area)) {
        if (prev.length === 1) return prev; // Keep at least one
        return prev.filter(a => a !== area);
      }
      return [...prev, area];
    });
  };

  const toggleComponentAccordion = (key: string) => {
    setExpandedComponents(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleAprendizaje = (key: string) => {
    setSelectedAprendizajes(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const selectAllInComponent = (area: AreaCurricular, componente: string, select: boolean) => {
    const contenidos = CURRICULO_MPPE_2026_2027[area]?.grados[gradoPrimaria]?.[componente] || [];
    setSelectedAprendizajes(prev => {
      const next = { ...prev };
      contenidos.forEach(c => {
        c.aprendizajesEsperados.forEach((_, idx) => {
          const key = `${area}:::${componente}:::${c.id}:::${idx}`;
          if (select) {
            next[key] = true;
          } else {
            delete next[key];
          }
        });
      });
      return next;
    });
  };

  // Count selected aprendizajes for display
  const selectedCount = useMemo(() => {
    return Object.values(selectedAprendizajes).filter(Boolean).length;
  }, [selectedAprendizajes]);

  // Open Remap Modal for existing project
  const handleOpenRemapModal = (project: PPAProject) => {
    setRemapTargetProject(project);
    // Try to guess grade from project.gradoSeccion or default to '1'
    let detectedGrade: GradoPrimaria = '1';
    const textToAnalyze = `${project.gradoSeccion} ${project.tema} ${project.diagnostico} ${project.contenido}`;
    const gradeMatch = textToAnalyze.match(/([1-6])(?:°|ro|do|to|mo|vo|ero)?\s*(?:grado|año)/i);
    if (gradeMatch && ['1', '2', '3', '4', '5', '6'].includes(gradeMatch[1])) {
      detectedGrade = gradeMatch[1] as GradoPrimaria;
    }

    // Find best match for each area
    const suggestions: any[] = [];
    AREAS_CURRICULARES.forEach(area => {
      const match = buscarContenidoMasCercano(detectedGrade, textToAnalyze, area);
      if (match && match.similitud > 0) {
        suggestions.push(match);
      }
    });

    setRemapSuggestions(suggestions);
    setIsRemapModalOpen(true);
  };

  const handleApplyRemap = async () => {
    if (!remapTargetProject || !teacherId) return;
    setIsApplyingRemap(true);
    try {
      const mppeSection = `\n\n---\n### ALINEACIÓN OFICIAL AL CURRÍCULO MPPE 2026-2027\n*Basado en los lineamientos del MPPE 2026-2027*\n\n` +
        remapSuggestions.map(s => {
          return `**Área:** ${s.area}\n` +
            `* **Componente:** ${s.componente}\n` +
            `* **Contenido Oficial:** ${s.contenido.contenido}\n` +
            `* **Aprendizajes Esperados:**\n` +
            s.contenido.aprendizajesEsperados.map((a: any) => `  - ${a.texto} ${!a.oficial ? '*(Complemento sugerido - no oficial del MPPE)*' : ''}`).join('\n');
        }).join('\n\n');

      const updatedContent = `${remapTargetProject.contenido.trim()}${mppeSection}`;
      
      const list = await SupabaseService.getPlanificaciones(teacherId);
      const parent = list.find(p => p.id === remapTargetProject.id);
      if (parent) {
        await SupabaseService.updatePlanificacion(remapTargetProject.id, {
          titulo: parent.titulo,
          proyecto: parent.proyecto || remapTargetProject.gradoSeccion,
          fechaInicio: parent.fechaInicio,
          fechaFin: parent.fechaFin,
          nivel: parent.nivel || 'Primaria',
          diagnostico: parent.diagnostico,
          proposito: updatedContent,
          estrategias: parent.estrategias,
          recursos: parent.recursos,
          evaluacion: parent.evaluacion,
          planesDiarios: parent.planesDiarios || []
        });
      }

      const updatedProject = {
        ...remapTargetProject,
        contenido: updatedContent
      };
      setSelectedProject(updatedProject);
      setEditedContent(updatedContent);
      setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
      setIsRemapModalOpen(false);
      setSuccessNotice('¡Proyecto actualizado y alineado con éxito al currículo MPPE 2026-2027!');
      setTimeout(() => setSuccessNotice(null), 5000);
    } catch (err: any) {
      console.error("Error applying MPPE remap:", err);
      alert(`Error al actualizar el proyecto: ${err.message || 'Error desconocido'}`);
    } finally {
      setIsApplyingRemap(false);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (nivel === 'Primaria') {
      if (selectedCount === 0) {
        setErrorMsg("Por favor selecciona al menos un Aprendizaje Esperado oficial del currículo MPPE 2026-2027.");
        return;
      }
      if (!tema.trim() || !duracion.trim() || !diagnostico.trim() || !teacherId) {
        setErrorMsg("Por favor completa todos los campos requeridos.");
        return;
      }
    } else {
      if (!gradoSeccion.trim() || !tema.trim() || !duracion.trim() || !diagnostico.trim() || !teacherId) {
        setErrorMsg("Por favor completa todos los campos requeridos.");
        return;
      }
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
      const actualGradoSeccion = nivel === 'Primaria' 
        ? `${gradoPrimaria}° Grado ${seccionPrimaria ? `Sección "${seccionPrimaria}"` : ''}`.trim()
        : gradoSeccion.trim();
      
      let levelTitleStr = "EDUCACIÓN PRIMARIA";
      if (nivel === 'Maternal') levelTitleStr = "MATERNAL";
      else if (nivel === 'Preescolar') levelTitleStr = "EDUCACIÓN INICIAL / PREESCOLAR";
      else if (nivel === 'Media') levelTitleStr = "EDUCACIÓN MEDIA";
      else if (nivel === 'Especial') levelTitleStr = "EDUCACIÓN ESPECIAL / TALLER LABORAL";

      const systemInstruction = `Eres un especialista senior en planificación educativa del MPPE (Venezuela), con profundo conocimiento del "Documento Educación Primaria 2026-2027" y del currículo oficial para el nivel de ${levelTitleStr}. 

Tu misión es generar Proyectos Pedagógicos de Aula (PPA) bajo el NUEVO FORMATO OFICIAL VIGENTE 2026-2027.
Debes seguir estrictamente estos lineamientos:

1. ENCABEZADO Y VALIDEZ OFICIAL:
   - Todo PPA de Primaria DEBE incluir de forma clara y destacada en el membrete: "Basado en los lineamientos del MPPE 2026-2027".
   - Identificación completa (Código de plantel, Logo/Membrete oficial, Docente, Matrícula M/F/T, Año Escolar 2026-2027, Nivel: ${levelTitleStr}, Grado y Sección: ${actualGradoSeccion}).

2. ALINEACIÓN CURRICULAR ESTRICTA:
   - Por cada área de formación integrada, muestra de forma explícita: Área, Componente, Contenido Oficial y Aprendizajes Esperados Oficiales.
   - CITA LOS APRENDIZAJES ESPERADOS TAL CUAL vienen en el currículo oficial.
   - Todo el desarrollo pedagógico (Propósito General, Propósitos Específicos, Actividades por momentos de la clase: Exploración, Desarrollo y Reflexión, Estrategias didácticas y Criterios de Evaluación) debe redactarse enfocado directamente en lograr dichos aprendizajes esperados oficiales.
   - Si un aprendizaje incluye la indicación "Complemento sugerido (no oficial del MPPE)", señálalo explícitamente.

3. RESPETO RIGUROSO DEL NIVEL:
   - Mantén los contenidos y exigencias estrictamente al nivel del grado indicado (${actualGradoSeccion}). Jamás mezcles contenidos de otros grados.

4. IDENTIDAD Y CONTEXTO VENEZOLANO:
   - En el área de Identidad (o al trabajar valores comunitarios), contextualiza con la venezolanidad, tradiciones patrias, geografía nacional y el pensamiento de Simón Bolívar y grandes maestros venezolanos.`;

      if (nivel === 'Maternal') {
        prompt = `Genera un PPA para el nivel MATERNAL bajo el nuevo formato MPPE 2026-2027.
DATOS: Tema: ${tema}, Sala/Edad: ${gradoSeccion}, Duración: ${duracion}, Diagnóstico: ${diagnostico}.

ESTRUCTURA TÉCNICA:
1. MEMBRETE: Incluir Año Escolar 2026-2027 y Matrícula proyectada.
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
        prompt = `Genera un PPA para el nivel PREESCOLAR/INICIAL bajo el nuevo formato MPPE 2026-2027.
DATOS: Tema: ${tema}, Sección: ${gradoSeccion}, Duración: ${duracion}, Diagnóstico: ${diagnostico}.

ESTRUCTURA TÉCNICA OBLIGATORIA:
1. MEMBRETE E IDENTIFICACIÓN: Año Escolar 2026-2027, Matrícula detallada.
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
      } else if (nivel === 'Primaria') {
        // Collect selected curricular elements
        let curricularDetails = '';
        selectedAreas.forEach(area => {
          const areaObj = CURRICULO_MPPE_2026_2027[area];
          const componentes = areaObj?.grados[gradoPrimaria] || {};
          let areaText = `\n### ÁREA: ${area.toUpperCase()}\n`;
          let areaHasItems = false;

          Object.entries(componentes).forEach(([compName, contenidos]) => {
            contenidos.forEach(c => {
              const selectedA = c.aprendizajesEsperados
                .map((a, idx) => ({ ...a, idx }))
                .filter(a => selectedAprendizajes[`${area}:::${compName}:::${c.id}:::${a.idx}`]);

              if (selectedA.length > 0) {
                areaHasItems = true;
                areaText += `* **Componente:** ${compName}\n`;
                areaText += `  - **Contenido Oficial:** ${c.contenido}\n`;
                areaText += `  - **Aprendizajes Esperados Oficiales:**\n`;
                selectedA.forEach(a => {
                  areaText += `    • ${a.texto} ${!a.oficial ? '[Complemento sugerido (no oficial del MPPE)]' : ''}\n`;
                });
              }
            });
          });

          if (areaHasItems) {
            curricularDetails += areaText;
          }
        });

        prompt = `Genera un Proyecto Pedagógico de Aula (PPA) para EDUCACIÓN PRIMARIA (${gradoPrimaria}° Grado) estructurado bajo los lineamientos oficiales del MPPE "Documento Educación Primaria" 2026-2027.

ENCABEZADO OBLIGATORIO:
**Basado en los lineamientos del MPPE 2026-2027**

DATOS DEL PROYECTO:
- Grado y Sección: ${actualGradoSeccion}
- Título del PPA: ${tema}
- Duración: ${duracion}
- Diagnóstico Integral: ${diagnostico}
${complementoDocente ? `- Aporte Complementario del Docente: ${complementoDocente}` : ''}

ELEMENTOS CURRICULARES OFICIALES SELECCIONADOS (CURRÍCULO MPPE 2026-2027):
${curricularDetails}

ESTRUCTURA DEL DOCUMENTO A GENERAR:
1. **MEMBRETE OFICIAL Y IDENTIFICACIÓN COMPLETA**:
   - República Bolivariana de Venezuela, Ministerio del Poder Popular para la Educación.
   - Año Escolar 2026-2027.
   - Mención obligatoria: "Basado en los lineamientos del MPPE 2026-2027".
   - Grado y Sección: ${actualGradoSeccion}.
2. **PEIC Y LÍNEA DE INVESTIGACIÓN**:
   - Vinculación con el Proyecto Educativo Integral Comunitario.
3. **DIAGNÓSTICO INTEGRAL Y PROPÓSITOS**:
   - Propósito General (en infinitivo).
   - Propósitos Específicos alineados a los aprendizajes esperados seleccionados.
4. **TABLA INTEGRADORA CURRICULAR**:
   - Presentar por cada área: Componente, Contenido Oficial y Aprendizajes Esperados (citados literalmente).
5. **PLANIFICACIÓN DE ACTIVIDADES DIDÁCTICAS**:
   - Secuencia organizada en tres momentos pedagógicos: Exploración, Desarrollo y Reflexión.
   - Actividades articuladas para el logro de los aprendizajes esperados.
6. **ESTRATEGIAS METODOLÓGICAS Y RECURSOS**:
   - Estrategias activas y recursos del entorno y la Colección Bicentenario.
7. **EVALUACIÓN DE LOS APRENDIZAJES**:
   - Indicadores de logro, técnicas e instrumentos (escala de estimación / registro descriptivo) alineados con los aprendizajes esperados seleccionados.`;
      } else if (nivel === 'Especial') {
        prompt = `Genera un PROYECTO DE APRENDIZAJE CON ENFOQUE SOCIO PRODUCTIVO DE EDUCACIÓN ESPECIAL (MPPE 2026-2027).
DATOS: Título: ${tema}, Especialidad/Taller o Aula: ${gradoSeccion}, Duración: ${duracion}, Diagnóstico/Caracterización: ${diagnostico}.

ESTRUCTURA OFICIAL:
1. MEMBRETE OFICIAL: República Bolivariana de Venezuela, MPPE, Centro de Desarrollo por la Calidad Educativa (CDCE), Taller de Educación Laboral (TEL) / IEE, Año Escolar 2026-2027.
2. CARACTERIZACIÓN DIAGNÓSTICA (Estudiantes con Autismo / TEA, Síndrome de Down, Discapacidad Intelectual o Motora).
3. ENFOQUE DUA (Diseño Universal de Aprendizaje) en sus 3 vertientes: Múltiples Formas de Representación, Acción y Expresión, e Implicación.
4. AJUSTES RAZONABLES: Claves visuales, pictogramas, modelado paso a paso, dosificación de tiempos y accesibilidad.
5. MATRIZ DE PLAN DE ÁREAS (Prácticas del Lenguaje, Matemática para la Vida, Ciencias Naturales, G.C.R.P., Orientación y Convivencia, Identidad, Educación Física).
6. COMPONENTE SOCIOPRODUCTIVO: Plan de Inversión, Línea de Producción (Pasos 1 al 6) e Informe Financiero.
7. PLANIFICACIÓN SEMANAL DUA: Lunes a Viernes con Conceptualización, Generalización y Sistematización.`;
      } else {
        prompt = `Genera un PPA para EDUCACIÓN MEDIA siguiendo estrictamente la "GUÍA ORGANIZATIVA 2026-2027".
DATOS: Año/Sección: ${gradoSeccion}, Tema: ${tema}, Duración: ${duracion}, Diagnóstico: ${diagnostico}.

REQUISITOS DEL FORMATO OFICIAL:
1. IDENTIFICACIÓN: Año Escolar 2026-2027, Matrícula proyectada.
2. CONTEXTO: PEIC y Línea de Investigación. Diagnóstico Pedagógico y Propósito.
3. TABLA DE CORRELACIÓN CURRICULAR: Áreas, Temas Indispensables, Tema Generador, Tejido Temático y Vértices (1 al 10).
4. MOMENTOS DE CLASE: Exploración, Desarrollo y Reflexión.
5. ESTRATEGIAS, RECURSOS E INDICADORES DE EVALUACIÓN CUALITATIVA.`;
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
        gradoSeccion: actualGradoSeccion,
        nivel,
        tema: tema.trim(),
        duracion: duracion.trim(),
        diagnostico: diagnostico.trim(),
        contenido: generatedText,
      };

      let docId = '';

      docId = await SupabaseService.addPlanificacion({
        titulo: projectData.tema,
        proyecto: projectData.gradoSeccion,
        fechaInicio: projectData.duracion,
        fechaFin: projectData.duracion,
        nivel: projectData.nivel,
        diagnostico: projectData.diagnostico,
        proposito: projectData.contenido,
        estrategias: '',
        recursos: '',
        evaluacion: '',
        planesDiarios: []
      }, teacherId);

      await SupabaseService.incrementGenerationsCount(teacherId, 1);

      // Clear form
      setGradoSeccion('');
      setTema('');
      setDuracion('');
      setDiagnostico('');
      
      // Show the generated project in the same tab underneath
      setSelectedProject({
        id: docId,
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
      await SupabaseService.deletePlanificacion(id);
      
      if (selectedProject?.id === id) {
        setSelectedProject(null);
      }
    } catch (error) {
      console.error("Error deleting from Supabase:", error);
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
      const list = await SupabaseService.getPlanificaciones(teacherId);
      const parent = list.find(p => p.id === selectedProject.id);
      if (parent) {
        await SupabaseService.updatePlanificacion(selectedProject.id, {
          titulo: editedTitle,
          proyecto: parent.proyecto,
          fechaInicio: parent.fechaInicio,
          fechaFin: parent.fechaFin,
          nivel: parent.nivel,
          diagnostico: parent.diagnostico,
          proposito: editedContent,
          estrategias: parent.estrategias,
          recursos: parent.recursos,
          evaluacion: parent.evaluacion,
          planesDiarios: parent.planesDiarios || []
        });
      }
      setSelectedProject(prev => prev ? { ...prev, tema: editedTitle, contenido: editedContent } : null);
      setIsEditing(false);
    } catch (error) {
      console.error("Error saving to Supabase:", error);
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
      <div className="mb-8 no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Gestor de PPA con IA</h1>
          <p className="text-slate-300 mt-1">Genera Proyectos Pedagógicos de Aula estructurados automáticamente.</p>
        </div>
        <FormatoBadgeButton tipo="PPA" />
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
                    <option value="Primaria">Educación Primaria (MPPE 2026-2027)</option>
                    <option value="Maternal">Maternal (1-3 años)</option>
                    <option value="Preescolar">Preescolar / Inicial</option>
                    <option value="Media">Media (1er a 5to año)</option>
                    <option value="Especial">Educación Especial / Taller Laboral (2026-2027)</option>
                  </select>
                </div>

                {nivel === 'Especial' && (
                  <div className="col-span-full p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="text-emerald-500 w-5 h-5 shrink-0" />
                      <p className="text-xs text-slate-700">
                        ¿Buscas planificar con DUA, pictogramas, línea de producción e inversión de taller?
                      </p>
                    </div>
                    <Link
                      to="/especial"
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shrink-0 transition-all shadow-xs"
                    >
                      Ir al Módulo de Ed. Especial
                    </Link>
                  </div>
                )}

                {nivel === 'Primaria' ? (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="gradoPrimaria" className="block text-sm font-medium text-gray-700 mb-1">
                        Grado Oficial
                      </label>
                      <select
                        id="gradoPrimaria"
                        value={gradoPrimaria}
                        onChange={(e) => {
                          setGradoPrimaria(e.target.value as GradoPrimaria);
                          setSelectedAprendizajes({}); // Reset checkboxes when grade changes
                        }}
                        className="w-full px-3 py-2.5 border border-blue-400 bg-blue-50/30 font-semibold text-blue-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      >
                        <option value="1">1° Grado</option>
                        <option value="2">2° Grado</option>
                        <option value="3">3° Grado</option>
                        <option value="4">4° Grado</option>
                        <option value="5">5° Grado</option>
                        <option value="6">6° Grado</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="seccionPrimaria" className="block text-sm font-medium text-gray-700 mb-1">
                        Sección
                      </label>
                      <input
                        type="text"
                        id="seccionPrimaria"
                        placeholder="Ej: A"
                        value={seccionPrimaria}
                        onChange={(e) => setSeccionPrimaria(e.target.value)}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <label htmlFor="gradoSeccion" className="block text-sm font-medium text-gray-700 mb-1">
                      {nivel === 'Maternal' || nivel === 'Preescolar' ? 'Sala / Edad / Sección' : nivel === 'Especial' ? 'Taller / Especialidad o Aula' : 'Año y Sección'}
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
                          : nivel === 'Especial'
                          ? 'Ej: Taller Panadería / Aula Integrada'
                          : 'Ej: 3er Año Sección B'
                      }
                      value={gradoSeccion}
                      onChange={(e) => setGradoSeccion(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                    />
                  </div>
                )}
              </div>

              {/* MPPE 2026-2027: ÁREAS Y APRENDIZAJES SELECCIONABLES (SÓLO PRIMARIA) */}
              {nivel === 'Primaria' && (
                <div className="bg-slate-50 border border-blue-200 rounded-xl p-5 space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-blue-100 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="bg-blue-600 text-white p-1.5 rounded-lg">
                        <BookOpen className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 text-sm sm:text-base flex items-center gap-2">
                          Currículo MPPE 2026-2027 ({gradoPrimaria}° Grado)
                          <span className="text-[10px] bg-green-100 text-green-800 font-extrabold px-2 py-0.5 rounded-full border border-green-300 uppercase">Oficial</span>
                        </h3>
                        <p className="text-xs text-gray-500">Selecciona las áreas y los aprendizajes esperados oficiales.</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-blue-700 bg-blue-100 px-3 py-1 rounded-full border border-blue-200">
                        {selectedCount} aprendizaje(s) seleccionado(s)
                      </span>
                    </div>
                  </div>

                  {/* Multi-Area Selection (Enfoque integrador) */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">
                      Áreas Priorizadas a Integrar en el PPA:
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {AREAS_CURRICULARES.map(area => {
                        const isSelected = selectedAreas.includes(area);
                        return (
                          <button
                            type="button"
                            key={area}
                            onClick={() => toggleArea(area)}
                            className={`p-2.5 text-xs font-semibold rounded-lg border transition-all text-left flex items-center justify-between ${
                              isSelected
                                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:bg-blue-50/40'
                            }`}
                          >
                            <span className="truncate">{area}</span>
                            {isSelected ? <Check className="w-3.5 h-3.5 ml-1 flex-shrink-0" /> : null}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Componentes y Contenidos de las Áreas Seleccionadas */}
                  <div className="space-y-4">
                    {selectedAreas.map(area => {
                      const areaData = CURRICULO_MPPE_2026_2027[area];
                      const componentes = areaData?.grados[gradoPrimaria] || {};
                      const componenteKeys = Object.keys(componentes);

                      return (
                        <div key={area} className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-xs">
                          <div className="bg-gradient-to-r from-slate-100 to-gray-50 px-4 py-2.5 border-b border-gray-200 flex items-center justify-between">
                            <span className="text-xs font-bold text-blue-900 uppercase tracking-wide">
                              Área: {area}
                            </span>
                            <span className="text-[11px] text-gray-500 font-medium">
                              {componenteKeys.length} componente(s)
                            </span>
                          </div>

                          <div className="divide-y divide-gray-100">
                            {componenteKeys.map(compName => {
                              const accordKey = `${area}__${compName}`;
                              const isExpanded = expandedComponents[accordKey] !== false; // Default expanded
                              const contenidos = componentes[compName];

                              return (
                                <div key={compName} className="p-3">
                                  <div className="flex items-center justify-between gap-2 mb-2">
                                    <button
                                      type="button"
                                      onClick={() => toggleComponentAccordion(accordKey)}
                                      className="flex items-center gap-1.5 text-left font-bold text-sm text-gray-800 hover:text-blue-600"
                                    >
                                      {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />}
                                      <span>Componente: {compName}</span>
                                    </button>
                                    <div className="flex gap-2">
                                      <button
                                        type="button"
                                        onClick={() => selectAllInComponent(area, compName, true)}
                                        className="text-[11px] text-blue-600 hover:underline font-medium"
                                      >
                                        Marcar todos
                                      </button>
                                      <span className="text-gray-300">|</span>
                                      <button
                                        type="button"
                                        onClick={() => selectAllInComponent(area, compName, false)}
                                        className="text-[11px] text-gray-500 hover:underline font-medium"
                                      >
                                        Limpiar
                                      </button>
                                    </div>
                                  </div>

                                  {isExpanded && (
                                    <div className="pl-5 space-y-3 mt-2">
                                      {contenidos.map(item => (
                                        <div key={item.id} className="bg-slate-50/70 p-3 rounded-lg border border-gray-200/80">
                                          <div className="text-xs font-bold text-gray-900 mb-1.5 flex items-start gap-1.5">
                                            <span className="text-blue-600 font-extrabold">•</span>
                                            <span>Contenido: {item.contenido}</span>
                                          </div>
                                          {item.notaEditorial && (
                                            <div className="mb-2 text-[10px] text-slate-500 italic bg-amber-50/60 p-1.5 rounded border border-amber-200/50">
                                              Nota: {item.notaEditorial}
                                            </div>
                                          )}
                                          <div className="space-y-1.5 pl-3">
                                            {item.aprendizajesEsperados.map((a, aIdx) => {
                                              const checkKey = `${area}:::${compName}:::${item.id}:::${aIdx}`;
                                              const isChecked = !!selectedAprendizajes[checkKey];
                                              return (
                                                <label 
                                                  key={aIdx} 
                                                  className={`flex items-start gap-2.5 p-2 rounded cursor-pointer transition-colors text-xs leading-relaxed ${
                                                    isChecked ? 'bg-blue-50 text-blue-950 font-medium' : 'hover:bg-gray-100 text-gray-700'
                                                  }`}
                                                >
                                                  <input
                                                    type="checkbox"
                                                    checked={isChecked}
                                                    onChange={() => toggleAprendizaje(checkKey)}
                                                    className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 h-4 w-4 border-gray-300"
                                                  />
                                                  <div className="flex-1">
                                                    <span>{a.texto}</span>
                                                    {!a.oficial && (
                                                      <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                                                        Complemento sugerido (no oficial del MPPE)
                                                      </span>
                                                    )}
                                                  </div>
                                                </label>
                                              );
                                            })}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Complemento Adicional del Docente (No reemplaza el currículo) */}
                  <div className="pt-2 border-t border-blue-100">
                    <label htmlFor="complementoDocente" className="block text-xs font-bold text-gray-700 mb-1">
                      Aporte o Contexto Adicional del Docente (Opcional - complemento, no sustituye el currículo oficial):
                    </label>
                    <textarea
                      id="complementoDocente"
                      rows={2}
                      placeholder="Ej: Se enfocará en la huerta escolar comunitaria y en la flora del estado Apure..."
                      value={complementoDocente}
                      onChange={(e) => setComplementoDocente(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none bg-white"
                    />
                  </div>
                </div>
              )}

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
                  <p className="text-sm text-gray-500 line-clamp-3 mb-3">
                    {project.diagnostico}
                  </p>

                  {/* Quick Remap Action */}
                  <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenRemapModal(project);
                      }}
                      className="text-[11px] text-blue-700 hover:text-blue-900 font-semibold flex items-center gap-1 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-md border border-blue-200 transition-colors"
                      title="Actualizar y alinear con el currículo oficial MPPE 2026-2027"
                    >
                      <RefreshCw className="w-3 h-3 text-blue-600" />
                      <span>Actualizar a MPPE 2026-2027</span>
                    </button>
                    <span className="text-[10px] text-gray-400 font-medium">MPPE 2026-2027</span>
                  </div>
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
            <div className="flex flex-wrap items-center gap-2">
              {!isGuest && !isEditing && (
                <button 
                  onClick={(e) => { e.stopPropagation(); handleOpenRemapModal(selectedProject); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-lg text-sm font-semibold hover:bg-indigo-100 transition-colors shadow-xs"
                  title="Alinear y remapear a los contenidos oficiales del MPPE 2026-2027"
                >
                  <RefreshCw className="w-4 h-4 text-indigo-600" />
                  <span>Actualizar al currículo MPPE 2026-2027</span>
                </button>
              )}
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
                <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest -mt-0.5">By Reymon Castillo</span>
              </div>
            )}

            {/* MPPE 2026-2027 Official Tag in Project */}
            <div className="mb-4 inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 border border-blue-200 rounded-full text-xs font-bold text-blue-800">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>Basado en los lineamientos del MPPE 2026-2027</span>
            </div>

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

      {/* Remap / Migration Modal */}
      {isRemapModalOpen && remapTargetProject && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
            <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <BookOpen className="w-6 h-6 text-blue-200" />
                <div>
                  <h3 className="font-bold text-lg">Actualizar al Currículo MPPE 2026-2027</h3>
                  <p className="text-xs text-blue-100">Revisión y confirmación de alineación curricular</p>
                </div>
              </div>
              <button 
                onClick={() => setIsRemapModalOpen(false)} 
                className="text-white/80 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-lg p-3.5 text-xs flex items-start gap-2.5">
                <Info className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
                <div>
                  <strong>Política de Resguardo de Datos:</strong> Tu proyecto original no será borrado ni sustituido sin confirmación. Se anexará una sección técnica oficial que vincula el PPA con los componentes, contenidos y aprendizajes esperados oficiales del MPPE 2026-2027.
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-4 bg-slate-50">
                <div className="text-xs text-gray-500 font-semibold mb-1">Proyecto a actualizar:</div>
                <div className="font-bold text-gray-900 text-base">{remapTargetProject.tema}</div>
                <div className="text-xs text-gray-600 mt-1">{remapTargetProject.gradoSeccion} • {remapTargetProject.nivel}</div>
              </div>

              <div>
                <div className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">
                  Alineación Oficial Sugerida por Similitud Temática:
                </div>
                {remapSuggestions.length === 0 ? (
                  <div className="text-center py-6 text-sm text-gray-500 bg-gray-50 rounded-lg border border-gray-200">
                    No se detectaron coincidencias automáticas directas. Se anexarán los lineamientos generales del grado.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {remapSuggestions.map((sug, i) => (
                      <div key={i} className="border border-blue-200 bg-blue-50/40 rounded-lg p-3 text-xs space-y-1">
                        <div className="flex items-center justify-between font-bold text-blue-900">
                          <span>Área: {sug.area}</span>
                          <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-mono">
                            Componente: {sug.componente}
                          </span>
                        </div>
                        <div className="text-gray-800 font-medium">
                          <strong>Contenido Oficial:</strong> {sug.contenido.contenido}
                        </div>
                        <div className="text-gray-600 pt-1">
                          <strong>Aprendizajes Esperados:</strong>
                          <ul className="list-disc pl-4 mt-0.5 space-y-0.5">
                            {sug.contenido.aprendizajesEsperados.map((ae: any, idx: number) => (
                              <li key={idx}>
                                {ae.texto} {!ae.oficial && <span className="text-[10px] text-amber-700 font-bold">(Complemento sugerido)</span>}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-gray-200 bg-gray-50 p-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsRemapModalOpen(false)}
                className="px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isApplyingRemap}
                onClick={handleApplyRemap}
                className="px-5 py-2 text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50"
              >
                {isApplyingRemap ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Actualizando...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Confirmar y Actualizar Proyecto</span>
                  </>
                )}
              </button>
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
