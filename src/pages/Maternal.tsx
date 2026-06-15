import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, where, deleteDoc, doc, updateDoc, increment } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { generateContentWithRetry } from '../lib/gemini';
import Markdown from 'react-markdown';
import LimitReachedModal from '../components/LimitReachedModal';
import { 
  Baby, 
  Loader2, 
  Utensils, 
  Moon, 
  ShieldCheck, 
  CheckSquare, 
  LineChart, 
  Plus, 
  History, 
  X, 
  Trash2,
  BookOpen,
  Sparkles,
  Copy,
  Printer,
  Edit3,
  Save,
  GraduationCap,
  FileText
} from 'lucide-react';
import { Student } from './Students';

interface RoutineRecord {
  id: string;
  estudianteId: string;
  fecha: string;
  comida: string;
  sueno: string;
  panal: string;
  actividad: string;
  createdAt: any;
}

interface Milestone {
  estudianteId: string;
  hito: string;
  completado: boolean;
  fecha?: string;
}

export default function Maternal() {
  const { isGuest, generationsCount, teacherId } = useOutletContext<{ isGuest: boolean, generationsCount: number, teacherId: string }>();
  const [activeTab, setActiveTab] = useState<'routine' | 'milestones' | 'planning'>('routine');
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Routine Form State
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [comida, setComida] = useState('Muy bien');
  const [sueno, setSueno] = useState('Durmió bien');
  const [panal, setPanal] = useState('Normal');
  const [actividad, setActividad] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [routines, setRoutines] = useState<RoutineRecord[]>([]);

  // Maternal Planning States
  const [planningTab, setPlanningTab] = useState<'create' | 'history'>('create');
  const [tipoPlan, setTipoPlan] = useState<'semanal_quincenal' | 'adaptacion_pa'>('semanal_quincenal');
  
  // Identificación
  const [institucion, setInstitucion] = useState('C.E.I. Simoncito');
  const [salaEdad, setSalaEdad] = useState('Maternal II (1 a 2 años)');
  const [anioEscolar, setAnioEscolar] = useState('2025-2026');
  const [matriculaV, setMatriculaV] = useState('10');
  const [matriculaH, setMatriculaH] = useState('12');
  const [tiempoInicio, setTiempoInicio] = useState(new Date().toISOString().split('T')[0]);
  const [tiempoFin, setTiempoFin] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14); // 2 weeks (quincenal)
    return d.toISOString().split('T')[0];
  });

  // Líneas de Enfoque
  const [peicReferencia, setPeicReferencia] = useState('Proyecto Educativo Integral Comunitario de la Institución');
  const [enfasisOralidad, setEnfasisOralidad] = useState(true);
  const [enfasisMatematica, setEnfasisMatematica] = useState(true);
  const [enfasisCiencia, setEnfasisCiencia] = useState(true);

  // Diagnóstico
  const [hitosDesarrollo, setHitosDesarrollo] = useState('Los niños están consolidando la marcha independiente y comenzando a emitir sonidos onomatopéyicos y balbuceos iniciales.');
  const [necesidadesFisiologicas, setNecesidadesFisiologicas] = useState('Se encuentra en proceso el control de esfínteres en el grupo de mayores y la estimulación del lavado de manos autónomo.');

  // Si P.A. Adaptado
  const [tituloProyecto, setTituloProyecto] = useState('Descubriendo los sonidos de mi entorno');
  const [justificacionPA, setJustificacionPA] = useState('Es viable porque la etapa de 1 a 2 años es un periodo crítico de desarrollo sensorial y auditivo. Estimular los sonidos les permite construir bases sólidas para el habla.');
  const [propositoPA, setPropositoPA] = useState('Favorecer procesos de discriminación auditiva y expresión verbal a través del reconocimiento de sonidos cotidianos.');
  const [socioProductividad, setSocioProductividad] = useState('Madres y padres asistirán para compartir canciones infantiles y cantos de cuna de la región, y elaboraremos sonajeros sensoriales con botellas plásticas recicladas.');

  // AI & History logic
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [plans, setPlans] = useState<any[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<any | null>(null);
  const [errorMsgPlan, setErrorMsgPlan] = useState<string | null>(null);
  const [isLimitModalOpen, setIsLimitModalOpen] = useState(false);

  // For inline Editing
  const [isEditingPlan, setIsEditingPlan] = useState(false);
  const [editedPlanTitle, setEditedPlanTitle] = useState('');
  const [editedPlanContent, setEditedPlanContent] = useState('');

  // Fetch Students (only Maternal)
  useEffect(() => {
    if (!teacherId) return;
    const q = query(
      collection(db, 'estudiantes'), 
      where('docenteId', '==', teacherId), 
      where('nivel', '==', 'Maternal')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const studentsData: Student[] = [];
      snapshot.forEach((doc) => {
        studentsData.push({ id: doc.id, ...doc.data() } as Student);
      });
      setStudents(studentsData);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching maternal students:", error);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [teacherId]);

  // Fetch Routine History
  useEffect(() => {
    if (!teacherId || activeTab !== 'routine') return;
    const q = query(
      collection(db, 'bitacoras_maternal'), 
      where('docenteId', '==', teacherId),
      where('fecha', '==', selectedDate)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const routineData: RoutineRecord[] = [];
      snapshot.forEach((doc) => {
        routineData.push({ id: doc.id, ...doc.data() } as RoutineRecord);
      });
      setRoutines(routineData);
    }, (error) => {
      console.error("Error fetching maternal routines:", error);
    });
    return () => unsubscribe();
  }, [teacherId, selectedDate, activeTab]);

  // Fetch Maternal Plans History
  useEffect(() => {
    if (!teacherId) return;
    const q = query(
      collection(db, 'planificaciones_maternal'),
      where('docenteId', '==', teacherId),
      orderBy('createdAt', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const planData: any[] = [];
      snapshot.forEach((doc) => {
        planData.push({ id: doc.id, ...doc.data() });
      });
      setPlans(planData);
    }, (error) => {
      console.error("Error fetching maternal plans:", error);
    });
    return () => unsubscribe();
  }, [teacherId]);

  const handleGeneratePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherId) return;

    if (isGuest && generationsCount >= 3) {
      setIsLimitModalOpen(true);
      return;
    }

    setIsGeneratingPlan(true);
    setErrorMsgPlan(null);
    try {
      const vCount = parseInt(matriculaV, 10) || 0;
      const hCount = parseInt(matriculaH, 10) || 0;
      const totalCount = vCount + hCount;

      const selectedEnfasis: string[] = [];
      if (enfasisOralidad) selectedEnfasis.push("Oralidad, Escritura y Lectura");
      if (enfasisMatematica) selectedEnfasis.push("Matemática para la vida");
      if (enfasisCiencia) selectedEnfasis.push("Ciencia y Tecnología");

      const systemInstruction = `Eres un especialista pedagógico sénior del Ministerio del Poder Popular para la Educación (MPPE) de Venezuela para Educación Inicial. 
Conoces exhaustivamente las directrices vigentes de planificación curricular 2025-2026.
Tu objetivo es generar planificaciones formales oficiales de alto nivel técnico para la etapa MATERNAL (de 0 a 3 años), usando de forma rigurosa la estructura, enfoque bio-psicomotor y rutinas correctas.`;

      let prompt = '';

      if (tipoPlan === 'semanal_quincenal') {
        prompt = `Genera un "Formato de Planificación Semanal/Quincenal (Maternal)" bajo las orientaciones vigentes del MPPE.
            
DATOS DE IDENTIFICACIÓN:
- Institución: "${institucion}"
- Nivel / Sección / Edades: "${salaEdad}"
- Año Escolar: "${anioEscolar}"
- Docentes y Matrícula: Varones (V): ${vCount}, Hembras (H): ${hCount}, Total (T): ${totalCount}
- Tiempo de Ejecución: Desde ${tiempoInicio} hasta ${tiempoFin}

ELEMENTOS DE LA NUEVA INSTITUCIONALIDAD (LÍNEAS DE ENFOQUE):
- Nombre del P.E.I.C. de Referencia: "${peicReferencia}"
- Énfasis Curriculares Transversalizados: ${selectedEnfasis.join(', ')}

DIAGNÓSTICO PEDAGÓGICO CONTEXTUALIZADO:
- Hitos de desarrollo / lenguaje consolidándose actualmente: "${hitosDesarrollo}"
- Necesidades fisiológicas y hábitos abordándose (destete, esfínteres, comer solos, higiene): "${necesidadesFisiologicas}"

OBLIGATORIO:
Estructura exactamente el documento con las siguientes SECCIONES, usando Markdown limpio y profesional:

I. Datos de Identificación (Muestra todos los campos en un diseño elegante).
II. Elementos de la Nueva Institucionalidad (Describe la transversalización del PEIC y de los Énfasis curriculares seleccionados).
III. Diagnóstico Pedagógico Contextualizado (Presenta un párrafo fluido y pedagógico que desarrolle y explique los hitos y necesidades de manera contextualizada para el grupo).
IV. Cuadro Organizador del Currículo (Genera una tabla técnica de 4 columnas: Área de Aprendizaje | Componentes | Finalidad | Aprendizajes a ser Alcanzados (Indicadores). Debe incluir las dos grandes áreas de Maternal de forma completa y profunda: "Formación Personal, Social y Comunicación" y "Relación entre los Componentes del Ambiente" con sus componentes y finalidades oficiales, y al menos 2-3 aprendizajes/indicadores lúdicos sumamente realistas, prácticos y motivadores en formato viñeta para cada área).
V. Red de Estrategias y Momentos Pedagógicos (La Jornada Diaria) (Define una red de estrategias prácticas y específicas detalladas para cada uno de los momentos del cuidado y estimulación:
   - Recibimiento / Bienvenida: Estrategias de desapego familiar, canciones rítmicas e inspección de bienestar físico.
   - Aseo, Alimentación y Descanso (Hábitos): Acciones pedagógicas aplicadas al momento de comer, lavar las manos, mudar pañales o la siesta colectiva.
   - Actividades Centrales (Planificadas, vinculadas a estimular las dos áreas)
   - Juego Libre en los Espacios: Con especificaciones de materiales y cómo intervendrá el adulto para los espacios oficiales: Expresar y Crear, Armar y Construir, Experimentar y Descubrir, Imitar y Representar.
   - Despedida: Recuento del día con títeres o canciones tranquilas y entrega al representante.
VI. Recursos y Evaluación (Detalla recursos de provecho y colchonetas/material lúdico sugeridos. Define la Técnica de Observación Focalizada/Participante y los Instrumentos obligatorios que se indicaron: Ficha de Registro Descriptivo o Escala de Estimación del Desarrollo Evolutivo).

Usa un tono técnico impecable, pedagógicamente descriptivo, enfocado en el juego, afectividad y rutinas biológicas.`;
      } else {
        prompt = `Genera un documento de Planificación bajo el formato de "Estructura de Proyecto en Inicial (Si la Institución solicita Adaptar un 'P.A.')" especial para Maternal III o grupos en transición de 2 a 3 años.

DATOS DE IDENTIFICACIÓN:
- Institución: "${institucion}"
- Sala / Sección / Edades: "${salaEdad}"
- Año Escolar: "${anioEscolar}"
- Docentes y Matrícula: Varones (V): ${vCount}, Hembras (H): ${hCount}, Total (T): ${totalCount}
- Tiempo de Ejecución: Desde ${tiempoInicio} hasta ${tiempoFin}

DATOS DEL PROYECTO:
- Título del Proyecto: "${tituloProyecto}"
- Justificación Pedagógica: "${justificacionPA}"
- Propósito General: "${propositoPA}"
- Socio-Productividad / Integración Familiar: "${socioProductividad}"
- Énfasis Curriculares Transversalizados: ${selectedEnfasis.join(', ')}

DIAGNÓSTICO INICIAL ASOCIADO:
- Desarrollo y Hábitos actuales: "${hitosDesarrollo}. ${necesidadesFisiologicas}"

OBLIGATORIO:
Estructura exactamente el documento con las siguientes secciones, usando Markdown limpio y profesional:

I. Datos de Identificación (Muestra todos los campos de forma clara e impecable).
1. Título del Proyecto (Presenta el título poético y motivador del proyecto centrado en el interés de los niños).
2. Justificación (Redacción fluida del por qué es viable y cómo beneficia el desarrollo cognitivo y afectivo en bebés/caminadores).
3. Propósito General (En infinitivo, redactado de forma integradora y sensible).
4. Matriz Curricular Integrada (Genera una tabla técnica de 4 columnas: Área de Aprendizaje | Componentes | Finalidad | Aprendizajes Esperados / Indicadores. Debe cruzar la relación con el tema del proyecto y las áreas: "Formación Personal, Social y Comunicación" y "Relación entre los Componentes del Ambiente").
5. Plan de Acción Semanal (Desglose estructurado semana a semana con estrategias lúdicas de la jornada diaria vinculadas al nombre del proyecto, abarcando Bienvenida, Hábitos de Cuidado, Actividades Centrales, Juego Libre en Espacios y Despedida).
6. Socio-Productividad / Integración Familiar (Detalla planes específicos para involucrar a las madres/padres en la creación de juguetes sensoriales o compartiendo saberes).

Usa un tono técnico, lúdico y tierno, respetando siempre el desarrollo fisiológico de niños de 0 a 3 años.`;
      }

      const response = await generateContentWithRetry({
        model: 'gemini-3.1-flash',
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
        tipoPlan,
        institucion,
        salaEdad,
        anioEscolar,
        matriculaVarones: vCount,
        matriculaHembras: hCount,
        matriculaTotal: totalCount,
        tiempoInicio,
        tiempoFin,
        peicReferencia: tipoPlan === 'semanal_quincenal' ? peicReferencia : '',
        enfasisCurriculares: selectedEnfasis,
        hitosDesarrollo,
        necesidadesFisiologicas,
        tituloProyecto: tipoPlan === 'adaptacion_pa' ? tituloProyecto : '',
        justificacionPA: tipoPlan === 'adaptacion_pa' ? justificacionPA : '',
        propositoPA: tipoPlan === 'adaptacion_pa' ? propositoPA : '',
        socioProductividad: tipoPlan === 'adaptacion_pa' ? socioProductividad : '',
        contenido: generatedText,
        docenteId: teacherId,
        createdAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'planificaciones_maternal'), planData);

      // Increment generationsCount for the user
      const userRef = doc(db, 'users', teacherId);
      await updateDoc(userRef, {
        generationsCount: increment(1)
      });

      // Select the newly created plan
      setSelectedPlan({
        id: docRef.id,
        ...planData,
        createdAt: new Date()
      });
      setPlanningTab('history');

    } catch (error: any) {
      console.error("Error generating maternal plan:", error);
      setErrorMsgPlan(`Hubo un error al generar: ${error.message || 'Error desconocido'}`);
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  const handleDeletePlan = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('¿Estás seguro de que deseas eliminar esta planificación?')) return;
    try {
      await deleteDoc(doc(db, 'planificaciones_maternal', id));
      if (selectedPlan?.id === id) {
        setSelectedPlan(null);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'planificaciones_maternal');
    }
  };

  const handleSaveEditPlan = async () => {
    if (!selectedPlan || !editedPlanContent.trim()) return;
    try {
      const docRef = doc(db, 'planificaciones_maternal', selectedPlan.id);
      await updateDoc(docRef, {
        tituloProyecto: editedPlanTitle,
        contenido: editedPlanContent
      });
      setSelectedPlan(prev => prev ? { ...prev, tituloProyecto: editedPlanTitle, contenido: editedPlanContent } : null);
      setIsEditingPlan(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'planificaciones_maternal');
    }
  };

  const handleCopyPlan = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('¡Copiado al portapapeles!');
  };

  const handlePrintPlan = () => {
    window.print();
  };

  const handleSaveRoutine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId || !teacherId) return;

    setIsSaving(true);
    try {
      await addDoc(collection(db, 'bitacoras_maternal'), {
        teacher_id: teacherId, // New unified isolation field
        docenteId: teacherId, // Legacy compatibility
        estudianteId: selectedStudentId,
        fecha: selectedDate,
        comida,
        sueno,
        panal,
        actividad,
        createdAt: serverTimestamp()
      });
      
      setSelectedStudentId('');
      setActividad('');
      // No alert, use better UI if possible, but keep it simple for now as requested
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'bitacoras_maternal');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteRoutine = async (id: string) => {
    if (!window.confirm('¿Eliminar este registro?')) return;
    try {
      await deleteDoc(doc(db, 'bitacoras_maternal', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'bitacoras_maternal');
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Baby className="text-orange-500" />
          Sección Maternal
        </h1>
        <p className="text-slate-300 mt-1">Gestión de rutinas y hitos del desarrollo para los más pequeños.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-white/10 overflow-x-auto no-print">
        <button
          onClick={() => setActiveTab('routine')}
          className={`flex items-center gap-2 px-4 py-3 font-medium text-sm transition-colors border-b-2 whitespace-nowrap ${
            activeTab === 'routine' 
              ? 'border-orange-400 text-orange-400 font-bold' 
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Utensils className="w-4 h-4" />
          Bitácora de Rutinas
        </button>
        <button
          onClick={() => setActiveTab('milestones')}
          className={`flex items-center gap-2 px-4 py-3 font-medium text-sm transition-colors border-b-2 whitespace-nowrap ${
            activeTab === 'milestones' 
              ? 'border-orange-400 text-orange-400 font-bold' 
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <LineChart className="w-4 h-4" />
          Hitos del Desarrollo
        </button>
        <button
          onClick={() => setActiveTab('planning')}
          className={`flex items-center gap-2 px-4 py-3 font-medium text-sm transition-colors border-b-2 whitespace-nowrap ${
            activeTab === 'planning' 
              ? 'border-orange-400 text-orange-400 font-bold' 
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Planificación (Nuevo Formato)
        </button>
      </div>

      {activeTab === 'routine' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <Plus className="w-5 h-5 text-orange-600" />
                Registrar Rutina
              </h2>
              
              <form onSubmit={handleSaveRoutine} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Día</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Alumno (Maternal)</label>
                  <select
                    required
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none bg-white"
                  >
                    <option value="">Selecciona...</option>
                    {students.map(s => (
                      <option key={s.id} value={s.id}>{s.apellidos ? `${s.apellidos}, ${s.nombre}` : s.nombre}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Alimentación</label>
                  <select
                    value={comida}
                    onChange={(e) => setComida(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none bg-white"
                  >
                    <option>Muy bien</option>
                    <option>Regular</option>
                    <option>Comió poco</option>
                    <option>No quiso comer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sueño / Descanso</label>
                  <select
                    value={sueno}
                    onChange={(e) => setSueno(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none bg-white"
                  >
                    <option>Durmió bien</option>
                    <option>Le costó dormir</option>
                    <option>No durmió</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Evacuación / Pañal</label>
                  <select
                    value={panal}
                    onChange={(e) => setPanal(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none bg-white"
                  >
                    <option>Normal (Orina/Heces)</option>
                    <option>Solo orina</option>
                    <option>Líquido / Flojo</option>
                    <option>Estreñido</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Actividad Realizada</label>
                  <textarea
                    rows={2}
                    value={actividad}
                    onChange={(e) => setActividad(e.target.value)}
                    placeholder="Ej: Jugamos con texturas..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSaving || students.length === 0}
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white font-medium py-2.5 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Guardar Bitácora'}
                </button>
              </form>
            </div>
          </div>

          {/* History */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <History className="w-4 h-4 text-gray-500" />
                  Registros del {selectedDate}
                </h3>
              </div>
              
              <div className="divide-y divide-gray-200">
                {isLoading ? (
                  <div className="p-8 text-center text-gray-500">Cargando...</div>
                ) : routines.length === 0 ? (
                  <div className="p-12 text-center text-gray-500">No hay registros para este día.</div>
                ) : (
                  routines.map(record => {
                    const student = students.find(s => s.id === record.estudianteId);
                    return (
                      <div key={record.id} className="p-6 hover:bg-gray-50 transition-colors">
                        <div className="flex justify-between items-start mb-4">
                          <h4 className="font-bold text-gray-900">{student?.nombre} {student?.apellidos}</h4>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400">Ref: {record.id.slice(0, 5)}</span>
                            <button 
                              onClick={() => handleDeleteRoutine(record.id)}
                              className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                              title="Eliminar"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                          <div className="flex flex-col gap-1">
                            <span className="text-gray-500 flex items-center gap-1"><Utensils size={14} /> Comida</span>
                            <span className="font-medium">{record.comida}</span>
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-gray-500 flex items-center gap-1"><Moon size={14} /> Sueño</span>
                            <span className="font-medium">{record.sueno}</span>
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-gray-500 flex items-center gap-1"><ShieldCheck size={14} /> Pañal</span>
                            <span className="font-medium">{record.panal}</span>
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-gray-500 flex items-center gap-1"><CheckSquare size={14} /> Actividad</span>
                            <span className="font-medium line-clamp-2">{record.actividad || 'N/A'}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'milestones' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <LineChart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">Hitos del Desarrollo</h3>
          <p className="text-gray-600 mb-6 max-w-lg mx-auto">
            Esta sección te permite llevar un control evolutivo de cada niño (ya camina, ya habla, etc.).
            Selecciona a un alumno para ver sus avances.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {students.map(s => (
              <div key={s.id} className="border border-gray-200 rounded-xl p-6 hover:border-orange-500 transition-colors cursor-pointer text-left">
                <h4 className="font-bold text-lg mb-1">{s.nombre}</h4>
                <p className="text-sm text-gray-500 mb-4">{s.gradoSeccion}</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-orange-500 h-full w-1/3"></div>
                    </div>
                    <span>33%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'planning' && (
        <div className="space-y-6">
          {/* Sub-Tabs for Planning (Generar / Historial) */}
          <div className="flex gap-4 justify-between items-center bg-slate-900/40 p-4 rounded-xl border border-white/5 no-print">
            <div className="flex gap-2">
              <button
                onClick={() => setPlanningTab('create')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                  planningTab === 'create'
                    ? 'bg-orange-600 text-white shadow-lg shadow-orange-950/40'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                Nueva Planificación
              </button>
              <button
                onClick={() => setPlanningTab('history')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                  planningTab === 'history'
                    ? 'bg-orange-600 text-white shadow-lg shadow-orange-950/40'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <History className="w-4 h-4" />
                Historial de Planes ({plans.length})
              </button>
            </div>
          </div>

          {planningTab === 'create' && (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
              {/* Form Input Column */}
              <div className="xl:col-span-5 space-y-6 no-print">
                <form onSubmit={handleGeneratePlan} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6 text-gray-800">
                  <div className="border-b border-gray-100 pb-4">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <GraduationCap className="text-orange-600" />
                      Estructura del Plan (Maternal)
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">Completa los campos oficiales del MPPE para la estimulación de 0 a 3 años.</p>
                  </div>

                  {/* Tipo de Planificación */}
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-gray-400 mb-2">Formato de Planificación</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setTipoPlan('semanal_quincenal')}
                        className={`px-3 py-2.5 rounded-lg text-xs font-bold border transition-colors ${
                          tipoPlan === 'semanal_quincenal'
                            ? 'bg-orange-50 border-orange-500 text-orange-700'
                            : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        Plan Semanal / Quincenal
                      </button>
                      <button
                        type="button"
                        onClick={() => setTipoPlan('adaptacion_pa')}
                        className={`px-3 py-2.5 rounded-lg text-xs font-bold border transition-colors ${
                          tipoPlan === 'adaptacion_pa'
                            ? 'bg-orange-50 border-orange-500 text-orange-700'
                            : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        Proyecto Inicial (Transiciones)
                      </button>
                    </div>
                  </div>

                  {/* Section I: Datos de Identificación */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-black uppercase tracking-widest text-orange-600 border-b border-orange-100 pb-1">I. Datos de Identificación</h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Institución / Plantel</label>
                        <input
                          type="text"
                          required
                          value={institucion}
                          onChange={(e) => setInstitucion(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Sala / Edad Rango</label>
                        <input
                          type="text"
                          required
                          value={salaEdad}
                          onChange={(e) => setSalaEdad(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-orange-500"
                          placeholder="Ej: Maternal II (1 a 2 años)"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Año Escolar</label>
                        <input
                          type="text"
                          required
                          value={anioEscolar}
                          onChange={(e) => setAnioEscolar(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Varones (V)</label>
                        <input
                          type="number"
                          min="0"
                          required
                          value={matriculaV}
                          onChange={(e) => setMatriculaV(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Hembras (H)</label>
                        <input
                          type="number"
                          min="0"
                          required
                          value={matriculaH}
                          onChange={(e) => setMatriculaH(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Fecha Inicio</label>
                        <input
                          type="date"
                          required
                          value={tiempoInicio}
                          onChange={(e) => setTiempoInicio(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Fecha Cierre / Fin</label>
                        <input
                          type="date"
                          required
                          value={tiempoFin}
                          onChange={(e) => setTiempoFin(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section II: Nueva Institucionalidad (Líneas de Enfoque) */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-black uppercase tracking-widest text-orange-600 border-b border-orange-100 pb-1">II. Líneas de Enfoque</h4>
                    
                    {tipoPlan === 'semanal_quincenal' && (
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Nombre d PEIC de Referencia</label>
                        <input
                          type="text"
                          required
                          value={peicReferencia}
                          onChange={(e) => setPeicReferencia(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      </div>
                    )}

                    <div>
                      <span className="block text-xs font-semibold text-gray-700 mb-2">Énfasis Curriculares Transversalizados</span>
                      <div className="space-y-2 bg-gray-50 p-3 rounded-lg border border-gray-200">
                        <label className="flex items-start gap-2.5 text-xs text-gray-600 font-medium cursor-pointer">
                          <input
                            type="checkbox"
                            checked={enfasisOralidad}
                            onChange={(e) => setEnfasisOralidad(e.target.checked)}
                            className="mt-0.5 rounded text-orange-600 focus:ring-orange-500"
                          />
                          <div>
                            <span className="font-bold block text-gray-800">Oralidad, Escritura y Lectura</span>
                            <span className="text-[10px] text-gray-500">Estimulación temprana con sonidos, onomatopeyas, balbuceos y gesticulaciones.</span>
                          </div>
                        </label>
                        <label className="flex items-start gap-2.5 text-xs text-gray-600 font-medium cursor-pointer">
                          <input
                            type="checkbox"
                            checked={enfasisMatematica}
                            onChange={(e) => setEnfasisMatematica(e.target.checked)}
                            className="mt-0.5 rounded text-orange-600 focus:ring-orange-500"
                          />
                          <div>
                            <span className="font-bold block text-gray-800">Matemática para la vida</span>
                            <span className="text-[10px] text-gray-500">Nociones primarias temporo-espaciales (arriba/abajo, adentro/afuera, grande/pequeño).</span>
                          </div>
                        </label>
                        <label className="flex items-start gap-2.5 text-xs text-gray-600 font-medium cursor-pointer">
                          <input
                            type="checkbox"
                            checked={enfasisCiencia}
                            onChange={(e) => setEnfasisCiencia(e.target.checked)}
                            className="mt-0.5 rounded text-orange-600 focus:ring-orange-500"
                          />
                          <div>
                            <span className="font-bold block text-gray-800">Ciencia y tecnología</span>
                            <span className="text-[10px] text-gray-500">Exploración activa del entorno sensorial, texturas y descubrimientos naturales.</span>
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Section III: Diagnóstico Pedagógico Contextualizado */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-black uppercase tracking-widest text-orange-600 border-b border-orange-100 pb-1">III. Diagnóstico Contextualizado</h4>
                    
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">¿Qué hitos motrices o del lenguaje consolidan en este momento?</label>
                      <textarea
                        required
                        rows={2}
                        value={hitosDesarrollo}
                        onChange={(e) => setHitosDesarrollo(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">¿Qué necesidades fisiológicas o de hábitos se abordan?</label>
                      <textarea
                        required
                        rows={2}
                        value={necesidadesFisiologicas}
                        onChange={(e) => setNecesidadesFisiologicas(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                        placeholder="Ej: Destete, control de esfínteres, comer solos, etc."
                      />
                    </div>
                  </div>

                  {/* Section for Adaptación de P.A. (Si aplica) */}
                  {tipoPlan === 'adaptacion_pa' && (
                    <div className="space-y-4">
                      <h4 className="text-xs font-black uppercase tracking-widest text-orange-600 border-b border-orange-100 pb-1">Estructura Adaptada P.A.</h4>
                      
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Título del Proyecto (Tratamiento Lúdico)</label>
                        <input
                          type="text"
                          required
                          value={tituloProyecto}
                          onChange={(e) => setTituloProyecto(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-orange-500"
                          placeholder="Ej: Jugando a descubrir los sonidos de la naturaleza"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Justificación del Proyecto</label>
                        <textarea
                          required
                          rows={2}
                          value={justificacionPA}
                          onChange={(e) => setJustificacionPA(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Propósito General del Proyecto</label>
                        <textarea
                          required
                          rows={2}
                          value={propositoPA}
                          onChange={(e) => setPropositoPA(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Socio-Productividad / Integración de la Familia</label>
                        <textarea
                          required
                          rows={2}
                          value={socioProductividad}
                          onChange={(e) => setSocioProductividad(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                        />
                      </div>
                    </div>
                  )}

                  {errorMsgPlan && (
                    <div className="bg-red-50 text-red-700 p-3 rounded-lg text-xs font-medium border border-red-200">
                      {errorMsgPlan}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isGeneratingPlan}
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3.5 rounded-lg flex items-center justify-center gap-2 shadow-lg shadow-orange-950/20 active:translate-y-px transition-all"
                  >
                    {isGeneratingPlan ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Generando Estructura Oficial...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        Generar Planificación Maternal
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Live Preview / Active Plan Panel */}
              <div className="xl:col-span-7">
                {isGeneratingPlan ? (
                  <div className="bg-white/5 border border-white/10 rounded-xl p-12 text-center text-slate-300 space-y-4 animate-pulse">
                    <Loader2 className="w-12 h-12 text-orange-500 mx-auto animate-spin" />
                    <div>
                      <h4 className="font-bold text-lg text-white">Estructurando Planificación Pedagógica...</h4>
                      <p className="text-xs text-slate-400 mt-2 max-w-sm mx-auto">
                        La IA está articulando el Cuadro Organizador del Currículo y elaborando la Red de Estrategias para la rutina de cuidado de {salaEdad}.
                      </p>
                    </div>
                  </div>
                ) : selectedPlan ? (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden text-gray-800">
                    <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="bg-orange-100 text-orange-800 text-[10px] font-black uppercase px-2 py-0.5 rounded">
                            {selectedPlan.tipoPlan === 'semanal_quincenal' ? 'Semanal / Quincenal' : 'Proyecto Adaptado'}
                          </span>
                        </div>
                        <h4 className="font-bold text-gray-900 mt-1">Planificación Generada Activa</h4>
                      </div>

                      <div className="flex gap-2 flex-wrap">
                        {isEditingPlan ? (
                          <>
                            <button
                              onClick={handleSaveEditPlan}
                              className="bg-blue-600 hover:bg-blue-700 text-white font-bold p-2.5 rounded-lg text-xs flex items-center gap-1.5"
                            >
                              <Save className="w-4 h-4" />
                              Guardar
                            </button>
                            <button
                              onClick={() => setIsEditingPlan(false)}
                              className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold p-2.5 rounded-lg text-xs"
                            >
                              Cancelar
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => {
                                setEditedPlanTitle(selectedPlan.tituloProyecto || '');
                                setEditedPlanContent(selectedPlan.contenido);
                                setIsEditingPlan(true);
                              }}
                              className="bg-gray-100 hover:bg-gray-250 text-gray-700 font-bold p-2.5 rounded-lg text-xs flex items-center gap-1.5"
                            >
                              <Edit3 className="w-4 h-4" />
                              Editar
                            </button>
                            <button
                              onClick={() => handleCopyPlan(selectedPlan.contenido)}
                              className="bg-gray-100 hover:bg-gray-250 text-gray-700 font-bold p-2.5 rounded-lg text-xs flex items-center gap-1.5"
                            >
                              <Copy className="w-4 h-4" />
                              Copiar
                            </button>
                            <button
                              onClick={handlePrintPlan}
                              className="bg-gray-100 hover:bg-gray-250 text-gray-700 font-bold p-2.5 rounded-lg text-xs flex items-center gap-1.5"
                            >
                              <Printer className="w-4 h-4" />
                              Imprimir
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="p-8">
                      {isEditingPlan ? (
                        <div className="space-y-4">
                          {selectedPlan.tipoPlan === 'adaptacion_pa' && (
                            <div>
                              <label className="block text-xs font-bold text-gray-700 mb-1">Título del Proyecto</label>
                              <input
                                type="text"
                                value={editedPlanTitle}
                                onChange={(e) => setEditedPlanTitle(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 focus:bg-white outline-none"
                              />
                            </div>
                          )}
                          <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">Contenido de la Planificación (Markdown)</label>
                            <textarea
                              rows={20}
                              value={editedPlanContent}
                              onChange={(e) => setEditedPlanContent(e.target.value)}
                              className="w-full p-4 border border-gray-300 rounded-lg text-sm font-mono bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-orange-500"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="markdown-body prose prose-orange max-w-none prose-sm text-gray-800 leading-relaxed space-y-2">
                          <Markdown>{selectedPlan.contenido}</Markdown>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-900/50 border border-white/5 rounded-xl p-12 text-center text-slate-300">
                    <FileText className="w-16 h-16 text-slate-500 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-white mb-2">Sin planificación seleccionada</h3>
                    <p className="text-sm text-slate-400 max-w-md mx-auto">
                      Completa el formulario y presiona el botón para estructurar de forma quirúrgica el nuevo plan oficial adecuado para la etapa de Maternal.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {planningTab === 'history' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* History index */}
              <div className="lg:col-span-4 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden no-print text-gray-800">
                <div className="bg-gray-50 border-b border-gray-200 px-4 py-3">
                  <h4 className="font-bold text-sm text-gray-900">Planes de Maternal Guardados</h4>
                </div>
                <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
                  {plans.length === 0 ? (
                    <div className="p-8 text-center text-sm text-gray-500">
                      No has generado planificaciones de maternal todavía.
                    </div>
                  ) : (
                    plans.map((p) => {
                      const isSelected = selectedPlan?.id === p.id;
                      return (
                        <div
                          key={p.id}
                          onClick={() => {
                            setSelectedPlan(p);
                            setIsEditingPlan(false);
                          }}
                          className={`p-4 flex justify-between items-center cursor-pointer transition-colors ${
                            isSelected ? 'bg-orange-50 border-l-4 border-orange-500' : 'hover:bg-gray-50'
                          }`}
                        >
                          <div className="space-y-1.5 flex-1 min-w-0 pr-2">
                            <div className="flex items-center gap-1.5">
                              <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                                p.tipoPlan === 'semanal_quincenal' ? 'bg-orange-100 text-orange-900' : 'bg-blue-100 text-blue-900'
                              }`}>
                                {p.tipoPlan === 'semanal_quincenal' ? 'Semanal' : 'P.A.'}
                              </span>
                              <span className="text-[10px] text-gray-400 font-medium">
                                {p.tiempoInicio} al {p.tiempoFin}
                              </span>
                            </div>
                            <h5 className="font-bold text-xs text-gray-900 truncate">
                              {p.tipoPlan === 'adaptacion_pa' ? p.tituloProyecto : p.institucion}
                            </h5>
                            <p className="text-[10px] text-gray-500 font-medium truncate">{p.salaEdad}</p>
                          </div>
                          <button
                            onClick={(e) => handleDeletePlan(p.id, e)}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* History Preview Content */}
              <div className="lg:col-span-8">
                {selectedPlan ? (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden text-gray-800">
                    <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="bg-orange-100 text-orange-800 text-[10px] font-black uppercase px-2 py-0.5 rounded">
                            {selectedPlan.tipoPlan === 'semanal_quincenal' ? 'Semanal / Quincenal' : 'Proyecto Adaptado'}
                          </span>
                        </div>
                        <h4 className="font-bold text-gray-900 mt-1">Contenido de Planificación</h4>
                      </div>

                      <div className="flex gap-2 flex-wrap">
                        {isEditingPlan ? (
                          <>
                            <button
                              onClick={handleSaveEditPlan}
                              className="bg-blue-600 hover:bg-blue-700 text-white font-bold p-2.5 rounded-lg text-xs flex items-center gap-1.5"
                            >
                              <Save className="w-4 h-4" />
                              Guardar
                            </button>
                            <button
                              onClick={() => setIsEditingPlan(false)}
                              className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold p-2.5 rounded-lg text-xs"
                            >
                              Cancelar
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => {
                                setEditedPlanTitle(selectedPlan.tituloProyecto || '');
                                setEditedPlanContent(selectedPlan.contenido);
                                setIsEditingPlan(true);
                              }}
                              className="bg-gray-100 hover:bg-gray-250 text-gray-700 font-bold p-2.5 rounded-lg text-xs flex items-center gap-1.5"
                            >
                              <Edit3 className="w-4 h-4" />
                              Editar
                            </button>
                            <button
                              onClick={() => handleCopyPlan(selectedPlan.contenido)}
                              className="bg-gray-100 hover:bg-gray-250 text-gray-700 font-bold p-2.5 rounded-lg text-xs flex items-center gap-1.5"
                            >
                              <Copy className="w-4 h-4" />
                              Copiar
                            </button>
                            <button
                              onClick={handlePrintPlan}
                              className="bg-gray-100 hover:bg-gray-250 text-gray-700 font-bold p-2.5 rounded-lg text-xs flex items-center gap-1.5"
                            >
                              <Printer className="w-4 h-4" />
                              Imprimir
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="p-8">
                      {isEditingPlan ? (
                        <div className="space-y-4">
                          {selectedPlan.tipoPlan === 'adaptacion_pa' && (
                            <div>
                              <label className="block text-xs font-bold text-gray-700 mb-1">Título del Proyecto</label>
                              <input
                                type="text"
                                value={editedPlanTitle}
                                onChange={(e) => setEditedPlanTitle(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 focus:bg-white outline-none"
                              />
                            </div>
                          )}
                          <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">Contenido de la Planificación (Markdown)</label>
                            <textarea
                              rows={20}
                              value={editedPlanContent}
                              onChange={(e) => setEditedPlanContent(e.target.value)}
                              className="w-full p-4 border border-gray-300 rounded-lg text-sm font-mono bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-orange-500"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="markdown-body prose prose-orange max-w-none prose-sm text-gray-800 leading-relaxed space-y-2">
                          <Markdown>{selectedPlan.contenido}</Markdown>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-900/50 border border-white/5 rounded-xl p-12 text-center text-slate-300">
                    <FileText className="w-16 h-16 text-slate-500 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-white mb-2">Selecciona una planificación</h3>
                    <p className="text-sm text-slate-400 max-w-md mx-auto">
                      Escoge cualquiera de los planes guardados en la columna izquierda para revisarlo, descargarlo, copiarlo o imprimirlo.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Limit Modal */}
      <LimitReachedModal 
        isOpen={isLimitModalOpen} 
        onClose={() => setIsLimitModalOpen(false)} 
      />
    </div>
  );
}
