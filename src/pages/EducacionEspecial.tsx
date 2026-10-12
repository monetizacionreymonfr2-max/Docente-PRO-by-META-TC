import React, { useState, useEffect } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { SupabaseService } from '../lib/supabaseService';
import { generateContentWithRetry } from '../lib/gemini';
import Markdown from 'react-markdown';
import LimitReachedModal from '../components/LimitReachedModal';
import { 
  Sparkles, 
  Loader2, 
  FileText, 
  Copy, 
  Printer, 
  X, 
  Trash2, 
  Edit3, 
  Save, 
  GraduationCap, 
  HeartHandshake, 
  CheckCircle2, 
  AlertCircle, 
  Calendar, 
  Users, 
  Layers, 
  DollarSign, 
  Briefcase, 
  Info, 
  Eye, 
  Settings2, 
  BookOpen, 
  Plus, 
  ChevronRight, 
  HelpCircle,
  Building,
  Activity,
  Check,
  TrendingUp,
  Brain
} from 'lucide-react';
import { 
  CONDICIONES_EDUCACION_ESPECIAL, 
  SERVICIOS_MODALIDAD_ESPECIAL, 
  ESPECIALIDADES_SOCIOPRODUCTIVAS, 
  AREAS_CONOCIMIENTO_ESPECIAL 
} from '../data/educacionEspecial';

interface EspecialProject {
  id: string;
  titulo: string;
  institucion: string;
  servicio: string;
  condicion: string;
  especialidad: string;
  mencion: string;
  lapso: string;
  anioEscolar: string;
  docente: string;
  participantesV: number;
  participantesH: number;
  diagnostico: string;
  contenido: string;
  createdAt: any;
}

export default function EducacionEspecial() {
  const { isGuest = false, generationsCount = 0, teacherId = '' } = useOutletContext<{ isGuest?: boolean, generationsCount?: number, teacherId?: string }>() || {};
  
  const [activeTab, setActiveTab] = useState<'crear' | 'plan_area' | 'plan_semanal' | 'inversion' | 'historial'>(() => {
    return (localStorage.getItem('especial_active_tab') as any) || 'crear';
  });

  const [isLimitModalOpen, setIsLimitModalOpen] = useState(false);

  // Form State
  const [servicio, setServicio] = useState('TEL');
  const [institucionNombre, setInstitucionNombre] = useState('Taller de Educación Laboral Carabobo');
  const [cdce, setCdce] = useState('Centro de Desarrollo por la Calidad Educativa Carabobo');
  const [codigoDea, setCodigoDea] = useState('OD05891203');
  const [anioEscolar, setAnioEscolar] = useState('2026-2027');
  const [lapso, setLapso] = useState('I Momento Pedagógico');
  const [nombreProyecto, setNombreProyecto] = useState('Elaboración y Comercialización de Panadería Artesanal Dulce y Salada');
  const [desdeFecha, setDesdeFecha] = useState(() => new Date().toISOString().split('T')[0]);
  const [hastaFecha, setHastaFecha] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });
  const [partV, setPartV] = useState(8);
  const [partH, setPartH] = useState(6);
  const [docente, setDocente] = useState('Docente Especialista');

  // Especialidad & Mención
  const [selectedEspecialidadId, setSelectedEspecialidadId] = useState('panaderia');
  const [mencion, setMencion] = useState('Auxiliar de Panadería y Empaque Artesanal');
  const [motorProductivo, setMotorProductivo] = useState('Motor Agroalimentario');

  // Condición NEE atendida
  const [selectedCondicionId, setSelectedCondicionId] = useState('autismo');
  
  // Diagnóstico / Caracterización
  const [caracterizacion, setCaracterizacion] = useState(
    'Grupo conformado por 14 adolescentes y jóvenes entre 15 y 22 años con Trastorno del Espectro Autista (TEA niveles 1 y 2) y Discapacidad Intelectual Leve. Poseen habilidades psicomotoras para seguimiento de recetas ilustradas mediante pictogramas, con necesidad de anticipación de rutinas, reducción de ruidos imprevistos y mediación en el uso seguro de hornos y amasado manual. Muestran alta motivación por la elaboración de alimentos y el trabajo en equipo.'
  );

  // DUA & Ajustes Razonables Toggles
  const [usarClavesVisuales, setUsarClavesVisuales] = useState(true);
  const [usarApoyoAudiovisual, setUsarApoyoAudiovisual] = useState(true);
  const [usarApoyoMovilidad, setUsarApoyoMovilidad] = useState(false);
  const [usarModeladoPasoPaso, setUsarModeladoPasoPaso] = useState(true);
  const [usarEspacioSensorial, setUsarEspacioSensorial] = useState(true);
  const [usarLSV, setUsarLSV] = useState(false);
  const [usarBraille, setUsarBraille] = useState(false);

  // Generación & Proyectos
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<string>('');
  const [projects, setProjects] = useState<EspecialProject[]>([]);
  const [selectedProject, setSelectedProject] = useState<EspecialProject | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Inversión y Finanzas Interactivo
  const [materiasPrimas, setMateriasPrimas] = useState([
    { nombre: 'Harina de trigo todo uso', cant: '10 kg', precioU: 1.5, subtotal: 15 },
    { nombre: 'Levadura fresca / seca', cant: '500 g', precioU: 4.0, subtotal: 4 },
    { nombre: 'Azúcar refinada', cant: '3 kg', precioU: 1.2, subtotal: 3.6 },
    { nombre: 'Margarina repostería', cant: '2 kg', precioU: 3.5, subtotal: 7 },
    { nombre: 'Bolsas de celofán y etiquetas', cant: '50 unid', precioU: 0.1, subtotal: 5 }
  ]);
  const [produccionEstimada, setProduccionEstimada] = useState({
    semanal: '25 paquetes de pan',
    quincenal: '50 paquetes de pan',
    mensual: '100 paquetes de pan',
    total: '100 paquetes por lapso'
  });
  const [pasosProduccion, setPasosProduccion] = useState([
    'Paso 1: Selección, pesado e higienización de la materia prima con apoyo de balanza y pictogramas.',
    'Paso 2: Mezclado e hidratación de levadura y masa con técnicas manuales y colaborativas.',
    'Paso 3: Amasado guiado por turnos y reposo para fermentación (observación biológica).',
    'Paso 4: Porcionado y moldeado del pan con plantillas y bandejas engrasadas.',
    'Paso 5: Horneado controlado bajo supervisión del docente y control de temperatura.',
    'Paso 6: Enfriado, empaque en celofán, sellado y etiquetado con logotipo del Taller Laboral.'
  ]);

  // Actualizar menciones cuando cambia especialidad
  useEffect(() => {
    const esp = ESPECIALIDADES_SOCIOPRODUCTIVAS.find(e => e.id === selectedEspecialidadId);
    if (esp) {
      setMotorProductivo(esp.motorProductivo);
      if (esp.menciones.length > 0) {
        setMencion(esp.menciones[0]);
      }
    }
  }, [selectedEspecialidadId]);

  // Persistir Tab
  useEffect(() => {
    localStorage.setItem('especial_active_tab', activeTab);
  }, [activeTab]);

  // Cargar Proyectos de Supabase
  const fetchProyectosEspecial = async () => {
    if (!teacherId) return;
    try {
      const list = await SupabaseService.getPlanificaciones(teacherId);
      const especialList = list
        .filter(item => (item.nivel || '').toLowerCase().includes('especial'))
        .map(item => {
          let diagObj: any = {};
          try {
            diagObj = JSON.parse(item.diagnostico || '{}');
          } catch {
            diagObj = { resumen: item.diagnostico };
          }

          return {
            id: item.id,
            titulo: item.titulo,
            institucion: diagObj.institucion || 'Taller de Educación Laboral',
            servicio: diagObj.servicio || 'TEL',
            condicion: diagObj.condicion || 'TEA / Autismo',
            especialidad: diagObj.especialidad || 'Socioproductiva',
            mencion: diagObj.mencion || 'General',
            lapso: diagObj.lapso || 'I Momento Pedagógico',
            anioEscolar: diagObj.anioEscolar || '2026-2027',
            docente: diagObj.docente || 'Docente Especialista',
            participantesV: diagObj.participantesV || 0,
            participantesH: diagObj.participantesH || 0,
            diagnostico: typeof diagObj.resumen === 'string' ? diagObj.resumen : (item.diagnostico || ''),
            contenido: item.proposito || '',
            createdAt: item.createdAt ? new Date(item.createdAt) : new Date()
          };
        });
      setProjects(especialList);
    } catch (e) {
      console.error("Error al cargar proyectos de educación especial:", e);
    }
  };

  useEffect(() => {
    fetchProyectosEspecial();
    const interval = setInterval(fetchProyectosEspecial, 10000);
    return () => clearInterval(interval);
  }, [teacherId]);

  // Total de Inversión
  const totalInversion = materiasPrimas.reduce((acc, curr) => acc + (Number(curr.subtotal) || 0), 0);

  // Plantillas Rápidas
  const cargarPlantilla = (tipo: 'autismo_pan' | 'down_huerto' | 'aula_integ') => {
    if (tipo === 'autismo_pan') {
      setServicio('TEL');
      setInstitucionNombre('Taller de Educación Laboral Carabobo');
      setSelectedCondicionId('autismo');
      setSelectedEspecialidadId('panaderia');
      setMencion('Auxiliar de Panadería y Empaque Artesanal');
      setNombreProyecto('Producción Artesanal de Pan Dulce y Empaque con Apoyos Visuales');
      setCaracterizacion(
        'Grupo de 12 jóvenes con Trastorno del Espectro Autista (TEA). Presentan habilidades de discriminación visual y seguimiento de secuencias lógicas. Requieren estructuración del espacio mediante claves de color, agenda visual anticipatoria y dosificación de tiempos con descansos sensoriales. Muy motivados por el moldeado y empaque de galletas y panes.'
      );
      setUsarClavesVisuales(true);
      setUsarApoyoAudiovisual(true);
      setUsarEspacioSensorial(true);
      setUsarModeladoPasoPaso(true);
    } else if (tipo === 'down_huerto') {
      setServicio('TEL');
      setInstitucionNombre('Taller de Educación Laboral "Libertador"');
      setSelectedCondicionId('intelectual');
      setSelectedEspecialidadId('agricultura');
      setMencion('Cultivo de Hortalizas y Conuco Escolar Agroecológico');
      setNombreProyecto('Siembra y Cosecha de Rubros Hortícolas en el Conuco Escolar Laboral');
      setCaracterizacion(
        'Grupo de 15 participantes con Síndrome de Down y Discapacidad Intelectual. Demuestran gran entusiasmo por las labores al aire libre y el contacto con la tierra. Se benefician del modelado en tres fases (observar, hacer juntos, hacer autónomo), herramientas livianas y señalización con imágenes del proceso de riego y cosecha.'
      );
      setUsarClavesVisuales(true);
      setUsarApoyoMovilidad(false);
      setUsarModeladoPasoPaso(true);
      setUsarEspacioSensorial(false);
    } else {
      setServicio('Aula Integrada');
      setInstitucionNombre('U.E. "Simón Bolívar" - Aula Integrada');
      setSelectedCondicionId('aprendizaje');
      setSelectedEspecialidadId('manualidades');
      setMencion('Papelería y Encuadernación Artesanal');
      setNombreProyecto('Encuadernación y Reciclaje de Papel para Fortalecer la Lectoescritura Funcional');
      setCaracterizacion(
        'Estudiantes en inclusión escolar con Dificultades Específicas de Aprendizaje y TDAH. Se articulan actividades manuales de reciclaje de papel con el aprendizaje lúdico de la lectura y cálculo. Se aplican pausas activas y métodos multisensoriales.'
      );
      setUsarClavesVisuales(true);
      setUsarApoyoAudiovisual(true);
      setUsarModeladoPasoPaso(true);
    }
    setSuccessNotice('¡Plantilla predefinida cargada correctamente! Puedes modificar cualquier campo antes de generar.');
    setTimeout(() => setSuccessNotice(null), 4000);
  };

  // Generar Proyecto Completo con IA
  const handleGenerarProyecto = async (enfoque: 'completo' | 'plan_area' | 'semanal') => {
    if (isGuest && generationsCount >= 3) {
      setIsLimitModalOpen(true);
      return;
    }

    setIsGenerating(true);
    setErrorMsg(null);
    setSuccessNotice(null);

    const condicionObj = CONDICIONES_EDUCACION_ESPECIAL.find(c => c.id === selectedCondicionId);
    const espObj = ESPECIALIDADES_SOCIOPRODUCTIVAS.find(e => e.id === selectedEspecialidadId);

    const totalAlumnos = Number(partV) + Number(partH);

    const systemInstruction = `Eres la máxima especialista y asesora curricular en la MODALIDAD DE EDUCACIÓN ESPECIAL del Ministerio del Poder Popular para la Educación (MPPE - Venezuela), con pleno dominio de la normativa y lineamientos vigentes 2026-2027.
Tu labor es diseñar la planificación pedagógica oficial para Educación Especial (Talleres de Educación Laboral - TEL, Institutos de Educación Especial - IEE, y Aulas Integradas) con rigor técnico, enfoque socioproductivo, Diseño Universal para el Aprendizaje (DUA) y Ajustes Razonables individualizados.

LINEAMIENTOS ESTRICTOS Y OBLIGATORIOS (2026-2027):
1. Membrete oficial de la República Bolivariana de Venezuela, MPPE, Centro de Desarrollo por la Calidad Educativa (CDCE), Servicio (${servicio}) e Institución.
2. Año Escolar: 2026-2027 (Vigente).
3. Mención destacada: "PROYECTO DE APRENDIZAJE CON ENFOQUE SOCIO PRODUCTIVO - EDUCACIÓN ESPECIAL (MPPE 2026-2027)".
4. Integración del Diseño Universal para el Aprendizaje (DUA):
   - Múltiples Formas de Representación (El Qué)
   - Múltiples Formas de Acción y Expresión (El Cómo)
   - Múltiples Formas de Implicación / Compromiso (El Por Qué)
5. Ajustes Razonables específicos para la condición diagnosticada (${condicionObj?.nombre}):
   - Claves visuales, pictogramas, dosificación de tiempos, anticipación de rutinas, reducción de sobrecargas sensoriales, ergonomía y mediación docente.
6. Articulación de Áreas de Conocimiento oficiales:
   - Prácticas del Lenguaje
   - Matemática para la Vida
   - Ciencias Naturales y Salud Integral
   - Identidad
   - Orientación y Convivencia
   - G.C.R.P. (Grupos de Creación, Recreación y Producción - Línea de Producción, Gestión de Riesgos, Cultura)
   - Educación Física
7. Componente Socioproductivo:
   - Motor Productivo: ${motorProductivo}
   - Especialidad: ${espObj?.nombre} | Mención: ${mencion}
   - Línea de producción por fases (Paso 1 a Paso 6)
   - Plan de Inversión y estimación de costos
   - Informe financiero (ingresos, desembolsos y saldo de autosustentabilidad)
8. Planificación Semanal / Clase Participativa con las 3 fases DUA:
   - Conceptualización (Representación)
   - Generalización (Acción y Expresión)
   - Sistematización (Implicación y Motivación)`;

    let prompt = '';
    if (enfoque === 'completo') {
      prompt = `Genera un PROYECTO DE APRENDIZAJE CON ENFOQUE SOCIO PRODUCTIVO DE EDUCACIÓN ESPECIAL (AÑO ESCOLAR 2026-2027) completo y detallado según los formatos oficiales del MPPE venezolano con los siguientes datos:

DATOS GENERALES:
- República Bolivariana de Venezuela - MPPE
- CDCE: ${cdce}
- Institución: ${institucionNombre} (${servicio})
- Código DEA: ${codigoDea}
- Año Escolar: ${anioEscolar}
- Momento/Lapso: ${lapso}
- Nombre del Proyecto: "${nombreProyecto}"
- Duración: Desde ${desdeFecha} hasta ${hastaFecha}
- Participantes: Varones: ${partV}, Hembras: ${partH}, Total: ${totalAlumnos}
- Especialidad: ${espObj?.nombre}
- Mención: ${mencion}
- Motor Productivo: ${motorProductivo}
- Docente: ${docente}
- Condición / Necesidades Atendidas: ${condicionObj?.nombre} (${condicionObj?.descripcion})
- Caracterización / Diagnóstico Integral: ${caracterizacion}
- Ajustes Razonables solicitados:
  * Claves visuales y pictogramas: ${usarClavesVisuales ? 'SÍ' : 'NO'}
  * Apoyo audiovisual: ${usarApoyoAudiovisual ? 'SÍ' : 'NO'}
  * Apoyo en movilidad/ergonomía: ${usarApoyoMovilidad ? 'SÍ' : 'NO'}
  * Modelado paso a paso: ${usarModeladoPasoPaso ? 'SÍ' : 'NO'}
  * Espacio de calma/descompresión sensorial: ${usarEspacioSensorial ? 'SÍ' : 'NO'}
  * Lengua de Señas Venezolana (LSV): ${usarLSV ? 'SÍ' : 'NO'}
  * Sistema Braille: ${usarBraille ? 'SÍ' : 'NO'}

ESTRUCTURA DEL PROYECTO A GENERAR (Formato Markdown profesional con tablas):
1. **PORTADA Y MEMBRETE OFICIAL**:
   - Membrete del MPPE y CDCE, datos del Taller/Instituto, Código DEA, Año Escolar 2026-2027, Lapso, Título, Participantes, Especialidad, Mención, Docente.
2. **CARACTERIZACIÓN DIAGNÓSTICA INTEGRAL DEL GRUPO**:
   - Diagnóstico biopsicosocial, potencialidades individuales, barreras para el aprendizaje identificadas, estilo de aprendizaje y canal sensorial predominante.
3. **PROPÓSITO GENERAL Y ESPECÍFICOS DEL PROYECTO**:
   - Propósito general pedagógico y socioproductivo.
   - Objetivos específicos adaptados a la condición.
4. **MATRIZ DE ARTICULACIÓN POR ÁREAS DE CONOCIMIENTO (PLAN DE ÁREAS)**:
   - Para cada una de las áreas clave (Prácticas del Lenguaje, Matemática para la Vida, Ciencias Naturales, G.C.R.P., Orientación y Convivencia, Identidad, Educación Física):
     * Tema Indispensable y Tema Generador
     * Énfasis Curricular y Tejido Temático
     * Tabla oficial con 7 columnas:
       | REFERENTES TEÓRICOS-PRÁCTICOS | ESTRATEGIA DE ENSEÑANZA Y TÉCNICA | EJES INTEGRADORES | INTENCIONALIDADES | DUA (Representación, Acción, Implicación) | AJUSTES RAZONABLES (Específicos para ${condicionObj?.nombre}) | RECURSOS (Humanos y Materiales) |
     * Aprendizajes Esperados / Indicadores de Logro Procesual adaptados.
5. **PLAN DE INVERSIÓN Y LÍNEA DE PRODUCCIÓN DEL TALLER**:
   - Tabla de Plan de Inversión con materias primas, cantidades estimadas, costos unitarios y subtotal.
   - Tabla de Línea de Producción: Estimación (Semanal, Quincenal, Mensual, Total) y descripción de los 6 Pasos Técnicos para elaborar el producto terminado.
   - Formato de Informe Financiero (Ingresos, Desembolsos y Saldo operativo).
6. **PLANIFICACIÓN SEMANAL / CLASE PARTICIPATIVA O INTERACCIÓN SOCIAL**:
   - Tabla semanal de Lunes a Viernes desglosando los 3 momentos DUA:
     * CONCEPTUALIZACIÓN (Proporcionar múltiples medios de representación - El qué).
     * GENERALIZACIÓN (Proporcionar múltiples medios de acción y expresión - El cómo).
     * SISTEMATIZACIÓN (Proporcionar múltiples medios de implicación y motivación - El por qué).
7. **EVALUACIÓN INTEGRAL Y CUALITATIVA**:
   - Instrumentos de evaluación sugeridos (Escalas de estimación cualitativas, registros descriptivos y anecdotarios, portafolios de trabajo visual).`;
    } else if (enfoque === 'plan_area') {
      prompt = `Genera exclusivamente la MATRIZ OFICIAL DE PLAN POR ÁREAS DE CONOCIMIENTO (MPPE 2026-2027) para Educación Especial en ${espObj?.nombre} (${mencion}), adaptada a ${condicionObj?.nombre}.
Incluye las tablas de 7 columnas oficiales (Referentes Teóricos | Estrategia y Técnica | Ejes Integradores | Intencionalidades | DUA | Ajustes Razonables | Recursos) para Prácticas del Lenguaje, Matemática para la Vida, Ciencias Naturales, G.C.R.P., Orientación y Convivencia, e Identidad con sus indicadores procesuales de logro adaptados.`;
    } else {
      prompt = `Genera exclusivamente el FORMATO OFICIAL DE PLANIFICACIÓN SEMANAL / CLASE PARTICIPATIVA (DUA) de Lunes a Viernes para Educación Especial (MPPE 2026-2027) en el proyecto "${nombreProyecto}", especialidad ${espObj?.nombre}, para participantes con ${condicionObj?.nombre}.
Desarrolla en detalle para cada día (Lunes a Viernes):
1. Conceptualización (Múltiples formas de representación - El qué)
2. Generalización (Múltiples formas de acción y expresión - El cómo)
3. Sistematización (Múltiples formas de implicación y compromiso - El por qué)`;
    }

    try {
      const response = await generateContentWithRetry({
        model: 'gemini-3.1-flash-lite',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          systemInstruction,
          temperature: 0.7,
        }
      });

      const text = response.text || '';
      setGeneratedContent(text);
      setEditedContent(text);

      // Auto-guardar en base de datos si tenemos teacherId
      if (teacherId) {
        await SupabaseService.addPlanificacion({
          titulo: nombreProyecto,
          proyecto: `${servicio} - ${espObj?.nombre} (${mencion})`,
          fechaInicio: desdeFecha,
          fechaFin: hastaFecha,
          nivel: 'Educación Especial',
          diagnostico: JSON.stringify({
            institucion: institucionNombre,
            servicio,
            condicion: condicionObj?.nombre,
            especialidad: espObj?.nombre,
            mencion,
            motorProductivo,
            lapso,
            anioEscolar,
            docente,
            participantesV: Number(partV),
            participantesH: Number(partH),
            resumen: caracterizacion
          }),
          proposito: text,
          estrategias: '',
          recursos: '',
          evaluacion: ''
        }, teacherId);

        fetchProyectosEspecial();
      }

      setSuccessNotice('¡Proyecto de Educación Especial 2026-2027 generado y archivado con éxito!');
      setTimeout(() => setSuccessNotice(null), 5000);
    } catch (err: any) {
      console.error("Error al generar proyecto especial:", err);
      setErrorMsg(err?.message || 'Ocurrió un error al generar la planificación con la IA. Inténtalo nuevamente.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    const textToCopy = isEditing ? editedContent : (generatedContent || selectedProject?.contenido || '');
    if (!textToCopy) return;
    navigator.clipboard.writeText(textToCopy);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 3000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleGuardarEdicion = async () => {
    if (!teacherId || !selectedProject) {
      setGeneratedContent(editedContent);
      setIsEditing(false);
      setSuccessNotice('Cambios aplicados temporalmente.');
      setTimeout(() => setSuccessNotice(null), 3000);
      return;
    }

    try {
      await SupabaseService.updatePlanificacion(selectedProject.id, {
        proposito: editedContent
      });

      setSelectedProject(prev => prev ? { ...prev, contenido: editedContent } : null);
      setIsEditing(false);
      setSuccessNotice('¡Proyecto actualizado en base de datos!');
      fetchProyectosEspecial();
      setTimeout(() => setSuccessNotice(null), 3000);
    } catch (e) {
      console.error(e);
      setErrorMsg("Error al guardar la edición.");
    }
  };

  const handleEliminarProyecto = async (id: string) => {
    if (!window.confirm("¿Seguro que deseas eliminar este proyecto de Educación Especial?")) return;
    try {
      await SupabaseService.deletePlanificacion(id);
      if (selectedProject?.id === id) {
        setSelectedProject(null);
      }
      fetchProyectosEspecial();
      setSuccessNotice("Proyecto eliminado del historial.");
      setTimeout(() => setSuccessNotice(null), 3000);
    } catch (e) {
      console.error(e);
      setErrorMsg("Error al eliminar el proyecto.");
    }
  };

  const activeCondicion = CONDICIONES_EDUCACION_ESPECIAL.find(c => c.id === selectedCondicionId);

  return (
    <div className="space-y-8 pb-16">
      {/* HEADER PRINCIPAL */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-effect p-6 rounded-[2rem] border border-emerald-500/30 neon-border-emerald">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
              Modalidad de Educación Especial • MPPE 2026-2027
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
              DUA & Ajustes Razonables
            </span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <HeartHandshake className="text-emerald-400 w-8 h-8" />
            Educación Especial & Socioproductivo
          </h1>
          <p className="text-slate-300 text-sm max-w-2xl">
            Diseña Proyectos de Aprendizaje (PA) para Taller de Educación Laboral (TEL), Institutos de Educación Especial (IEE) y Aulas Integradas para niños y jóvenes con autismo (TEA), síndrome de Down y diversidad funcional.
          </p>
        </div>

        {/* Acciones Rápidas */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => cargarPlantilla('autismo_pan')}
            className="px-3 py-2 text-xs font-bold rounded-xl bg-cyan-950/40 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-500/30 transition-all flex items-center gap-1.5"
            title="Cargar ejemplo para Autismo en Panadería"
          >
            <Brain size={14} />
            <span>Ejemplo TEA (Panadería)</span>
          </button>
          <button
            onClick={() => cargarPlantilla('down_huerto')}
            className="px-3 py-2 text-xs font-bold rounded-xl bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 border border-amber-500/30 transition-all flex items-center gap-1.5"
            title="Cargar ejemplo para Síndrome de Down en Huerto"
          >
            <Building size={14} />
            <span>Ejemplo Down (Huerto)</span>
          </button>
        </div>
      </div>

      {/* FEEDBACK BANNERS */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-red-500/20 border border-red-500/40 text-red-200 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle size={18} className="text-red-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-red-300 hover:text-white"><X size={16} /></button>
        </div>
      )}

      {successNotice && (
        <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
            <span>{successNotice}</span>
          </div>
          <button onClick={() => setSuccessNotice(null)} className="text-emerald-300 hover:text-white"><X size={16} /></button>
        </div>
      )}

      {/* SUB-NAVEGACIÓN DE PESTAÑAS */}
      <div className="flex overflow-x-auto gap-2 p-1.5 glass-effect rounded-2xl border border-white/10 no-print">
        <button
          onClick={() => setActiveTab('crear')}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all shrink-0 ${
            activeTab === 'crear' 
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-900/40' 
              : 'text-slate-300 hover:text-white hover:bg-white/5'
          }`}
        >
          <Sparkles size={16} />
          <span>Generador PA Socioproductivo</span>
        </button>
        <button
          onClick={() => setActiveTab('plan_area')}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all shrink-0 ${
            activeTab === 'plan_area' 
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-900/40' 
              : 'text-slate-300 hover:text-white hover:bg-white/5'
          }`}
        >
          <Layers size={16} />
          <span>Planes por Área (DUA)</span>
        </button>
        <button
          onClick={() => setActiveTab('plan_semanal')}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all shrink-0 ${
            activeTab === 'plan_semanal' 
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-900/40' 
              : 'text-slate-300 hover:text-white hover:bg-white/5'
          }`}
        >
          <Calendar size={16} />
          <span>Plan Semanal / Clase DUA</span>
        </button>
        <button
          onClick={() => setActiveTab('inversion')}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all shrink-0 ${
            activeTab === 'inversion' 
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-900/40' 
              : 'text-slate-300 hover:text-white hover:bg-white/5'
          }`}
        >
          <DollarSign size={16} />
          <span>Inversión y Producción</span>
        </button>
        <button
          onClick={() => setActiveTab('historial')}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all shrink-0 ${
            activeTab === 'historial' 
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-900/40' 
              : 'text-slate-300 hover:text-white hover:bg-white/5'
          }`}
        >
          <FileText size={16} />
          <span>Historial ({projects.length})</span>
        </button>
      </div>

      {/* CONTENIDO PRINCIPAL POR PESTAÑAS */}
      {activeTab === 'crear' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* PANEL DE CONFIGURACIÓN DEL PROYECTO */}
          <div className="lg:col-span-5 space-y-6">
            <div className="glass-effect p-6 rounded-3xl border border-white/10 space-y-5">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Building size={18} className="text-emerald-400" />
                  Identificación Institucional
                </h3>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono font-bold">
                  2026-2027
                </span>
              </div>

              {/* Servicio y Tipo */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Servicio / Modalidad MPPE
                </label>
                <select
                  value={servicio}
                  onChange={(e) => setServicio(e.target.value)}
                  className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                >
                  {SERVICIOS_MODALIDAD_ESPECIAL.map(s => (
                    <option key={s.id} value={s.id}>{s.nombre}</option>
                  ))}
                </select>
              </div>

              {/* Nombre de la Institución */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Nombre Institución</label>
                  <input
                    type="text"
                    value={institucionNombre}
                    onChange={(e) => setInstitucionNombre(e.target.value)}
                    className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Código DEA</label>
                  <input
                    type="text"
                    value={codigoDea}
                    onChange={(e) => setCodigoDea(e.target.value)}
                    className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">CDCE (Centro de Desarrollo por la Calidad Educativa)</label>
                <input
                  type="text"
                  value={cdce}
                  onChange={(e) => setCdce(e.target.value)}
                  className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  placeholder="Ej. Centro de Desarrollo por la Calidad Educativa Carabobo"
                />
              </div>

              {/* Año Escolar, Lapso y Docente */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Año Escolar</label>
                  <input
                    type="text"
                    value={anioEscolar}
                    onChange={(e) => setAnioEscolar(e.target.value)}
                    className="w-full bg-slate-900/80 border border-emerald-500/40 rounded-xl px-3 py-2 text-xs text-emerald-300 font-bold focus:outline-none focus:border-emerald-400"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Lapso / Momento</label>
                  <select
                    value={lapso}
                    onChange={(e) => setLapso(e.target.value)}
                    className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-2 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="I Momento Pedagógico">I Momento</option>
                    <option value="II Momento Pedagógico">II Momento</option>
                    <option value="III Momento Pedagógico">III Momento</option>
                  </select>
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Docente Responsable</label>
                  <input
                    type="text"
                    value={docente}
                    onChange={(e) => setDocente(e.target.value)}
                    className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Participantes V y H */}
              <div className="grid grid-cols-3 gap-3 bg-slate-900/50 p-3 rounded-2xl border border-white/5">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase">Varones (V)</label>
                  <input
                    type="number"
                    min="0"
                    value={partV}
                    onChange={(e) => setPartV(Number(e.target.value))}
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white text-center font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase">Hembras (H)</label>
                  <input
                    type="number"
                    min="0"
                    value={partH}
                    onChange={(e) => setPartH(Number(e.target.value))}
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white text-center font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-emerald-400 uppercase">Total Grupo</label>
                  <div className="w-full bg-emerald-950/40 border border-emerald-500/30 rounded-lg py-1.5 text-xs text-emerald-300 text-center font-black">
                    {Number(partV) + Number(partH)}
                  </div>
                </div>
              </div>
            </div>

            {/* SECCIÓN DE CONDICIÓN NEE / NEURODIVERSIDAD */}
            <div className="glass-effect p-6 rounded-3xl border border-white/10 space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Brain size={18} className="text-cyan-400" />
                  Condición / Necesidad Educativa
                </h3>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Selecciona la Condición Principal
                </label>
                <select
                  value={selectedCondicionId}
                  onChange={(e) => setSelectedCondicionId(e.target.value)}
                  className="w-full bg-slate-900/80 border border-cyan-500/40 rounded-xl px-3 py-2.5 text-sm text-cyan-200 font-bold focus:outline-none focus:border-cyan-400"
                >
                  {CONDICIONES_EDUCACION_ESPECIAL.map(c => (
                    <option key={c.id} value={c.id}>{c.nombre}</option>
                  ))}
                </select>
              </div>

              {activeCondicion && (
                <div className="p-3.5 rounded-2xl bg-cyan-950/30 border border-cyan-500/30 space-y-2 text-xs">
                  <p className="text-slate-300 leading-relaxed">{activeCondicion.descripcion}</p>
                  <div className="pt-2 border-t border-cyan-500/20">
                    <span className="font-bold text-cyan-300 block mb-1.5">Ajustes Razonables Clave Aplicados:</span>
                    <ul className="space-y-1 text-slate-300">
                      {activeCondicion.ajustesClave.map((ajuste, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <Check size={12} className="text-cyan-400 shrink-0 mt-0.5" />
                          <span>{ajuste}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Caracterización y Diagnóstico */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Caracterización Diagnóstica del Grupo
                </label>
                <textarea
                  rows={4}
                  value={caracterizacion}
                  onChange={(e) => setCaracterizacion(e.target.value)}
                  className="w-full bg-slate-900/80 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-emerald-500 leading-relaxed"
                  placeholder="Describe potencialidades, nivel comunicacional, habilidades motoras e intereses..."
                />
              </div>
            </div>

            {/* SECCIÓN ESPECIALIDAD SOCIOPRODUCTIVA */}
            <div className="glass-effect p-6 rounded-3xl border border-white/10 space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Briefcase size={18} className="text-amber-400" />
                  Especialidad Socioproductiva (Taller)
                </h3>
                <span className="text-xs text-amber-300 font-medium">{motorProductivo}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Especialidad</label>
                  <select
                    value={selectedEspecialidadId}
                    onChange={(e) => setSelectedEspecialidadId(e.target.value)}
                    className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                  >
                    {ESPECIALIDADES_SOCIOPRODUCTIVAS.map(esp => (
                      <option key={esp.id} value={esp.id}>{esp.nombre}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Mención Ocupacional</label>
                  <input
                    type="text"
                    value={mencion}
                    onChange={(e) => setMencion(e.target.value)}
                    className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Nombre del Proyecto de Aprendizaje (PA)
                </label>
                <input
                  type="text"
                  value={nombreProyecto}
                  onChange={(e) => setNombreProyecto(e.target.value)}
                  className="w-full bg-slate-900/80 border border-emerald-500/40 rounded-xl px-3 py-2.5 text-sm text-white font-bold focus:outline-none focus:border-emerald-400"
                  placeholder="Ej. Elaboración y Comercialización de Panadería Artesanal..."
                />
              </div>

              {/* Botón de Generar */}
              <div className="pt-2">
                <button
                  onClick={() => handleGenerarProyecto('completo')}
                  disabled={isGenerating}
                  className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:via-teal-400 hover:to-cyan-400 text-slate-950 font-black text-sm uppercase tracking-wider shadow-xl shadow-emerald-950/50 flex items-center justify-center gap-3 transition-all transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="animate-spin w-5 h-5 text-slate-950" />
                      <span>Generando Proyecto Oficial 2026-2027...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 text-slate-950" />
                      <span>Generar Proyecto Completo de Ed. Especial</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* PANEL DERECHO: VISTA PREVIA Y RESULTADOS */}
          <div className="lg:col-span-7 space-y-6">
            {isGenerating ? (
              <div className="glass-effect rounded-3xl p-12 border border-emerald-500/30 flex flex-col items-center justify-center text-center space-y-4 min-h-[500px]">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/40 animate-pulse">
                    <HeartHandshake className="w-10 h-10 text-emerald-400" />
                  </div>
                  <Loader2 className="w-24 h-24 text-emerald-400 animate-spin absolute -top-2 -left-2" />
                </div>
                <h3 className="text-xl font-black text-white">Estructurando Proyecto de Educación Especial</h3>
                <p className="text-slate-300 text-sm max-w-md leading-relaxed">
                  Redactando portada oficial, caracterización biopsicosocial, plan de áreas con DUA y Ajustes Razonables para <strong className="text-emerald-400">{activeCondicion?.nombre}</strong>, plan de inversión y línea de producción según lineamientos 2026-2027...
                </p>
              </div>
            ) : generatedContent || selectedProject ? (
              <div className="glass-effect rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
                {/* Barra Superior del Visor */}
                <div className="p-4 bg-slate-900/90 border-b border-white/10 flex flex-wrap items-center justify-between gap-3 no-print">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping"></span>
                    <h3 className="text-sm font-bold text-white truncate max-w-[280px]">
                      {selectedProject ? selectedProject.titulo : nombreProyecto}
                    </h3>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      2026-2027
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {isEditing ? (
                      <button
                        onClick={handleGuardarEdicion}
                        className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center gap-1.5 transition-all"
                      >
                        <Save size={14} />
                        <span>Guardar</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setEditedContent(selectedProject ? selectedProject.contenido : generatedContent);
                          setIsEditing(true);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs flex items-center gap-1.5 border border-slate-600 transition-all"
                      >
                        <Edit3 size={14} />
                        <span>Editar</span>
                      </button>
                    )}

                    <button
                      onClick={handleCopy}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs flex items-center gap-1.5 border border-slate-600 transition-all"
                    >
                      {copySuccess ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                      <span>{copySuccess ? 'Copiado!' : 'Copiar'}</span>
                    </button>

                    <button
                      onClick={handlePrint}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs flex items-center gap-1.5 border border-slate-600 transition-all"
                    >
                      <Printer size={14} />
                      <span>Imprimir</span>
                    </button>
                  </div>
                </div>

                {/* Contenido Renderizado */}
                <div className="p-6 md:p-8 max-h-[750px] overflow-y-auto print:max-h-none print:overflow-visible">
                  {isEditing ? (
                    <textarea
                      rows={28}
                      value={editedContent}
                      onChange={(e) => setEditedContent(e.target.value)}
                      className="w-full bg-slate-950/80 border border-emerald-500/30 rounded-2xl p-4 text-xs font-mono text-emerald-100 focus:outline-none focus:border-emerald-400 leading-relaxed"
                    />
                  ) : (
                    <div className="prose prose-invert max-w-none prose-headings:text-emerald-300 prose-headings:font-black prose-p:text-slate-200 prose-p:leading-relaxed prose-li:text-slate-200 prose-table:border-collapse prose-th:border prose-th:border-slate-700 prose-th:bg-slate-900/80 prose-th:p-2 prose-th:text-xs prose-td:border prose-td:border-slate-800 prose-td:p-2 prose-td:text-xs">
                      <Markdown>
                        {selectedProject ? selectedProject.contenido : generatedContent}
                      </Markdown>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="glass-effect rounded-3xl p-10 border border-white/10 text-center space-y-6">
                <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
                  <FileText size={32} />
                </div>
                <div className="space-y-2 max-w-md mx-auto">
                  <h3 className="text-xl font-black text-white">Generador Listo para Trabajar</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    Configura la institución, la condición de los estudiantes (autismo, síndrome de Down, motora, etc.) y la especialidad de taller a la izquierda, y presiona <strong>Generar Proyecto Completo</strong>.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-4 text-left">
                  <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-white/5 space-y-1">
                    <span className="text-[11px] font-bold text-emerald-400 block">Formato Oficial</span>
                    <p className="text-[11px] text-slate-300">Con membrete del MPPE, CDCE, Taller Laboral e indicadores adaptados.</p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-white/5 space-y-1">
                    <span className="text-[11px] font-bold text-cyan-400 block">Enfoque DUA</span>
                    <p className="text-[11px] text-slate-300">Múltiples formas de representación, acción, expresión e implicación.</p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-white/5 space-y-1">
                    <span className="text-[11px] font-bold text-amber-400 block">Socioproductivo</span>
                    <p className="text-[11px] text-slate-300">Plan de inversión, línea de producción por fases e informe financiero.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* PESTAÑA: PLANES POR ÁREA (DUA) */}
      {activeTab === 'plan_area' && (
        <div className="space-y-6">
          <div className="glass-effect p-6 rounded-3xl border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                <Layers className="text-emerald-400 w-6 h-6" />
                Matriz Curricular Oficial por Áreas (DUA y Ajustes Razonables)
              </h2>
              <p className="text-slate-300 text-xs mt-1">
                Lineamientos de áreas de conocimiento para la modalidad de Educación Especial (Año Escolar 2026-2027).
              </p>
            </div>
            <button
              onClick={() => handleGenerarProyecto('plan_area')}
              disabled={isGenerating}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-all shrink-0"
            >
              {isGenerating ? <Loader2 className="animate-spin w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
              <span>Generar Matriz con IA</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(AREAS_CONOCIMIENTO_ESPECIAL).map(([key, area]) => (
              <div key={key} className="glass-effect p-6 rounded-3xl border border-white/10 space-y-4 hover:border-emerald-500/40 transition-all">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <h3 className="font-bold text-white text-base text-emerald-300">{area.nombre}</h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">
                    Área Oficial
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-slate-400 font-bold block">Tema Indispensable:</span>
                    <span className="text-slate-200">{area.temaIndispensable}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold block">Énfasis Curricular:</span>
                    <span className="text-slate-200">{area.enfasisCurricular}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold block">Tejido Temático:</span>
                    <span className="text-slate-300 italic">{area.tejidoTematico}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-white/5 space-y-2 text-xs">
                  <span className="text-cyan-300 font-bold block">Referentes Teórico-Prácticos:</span>
                  <ul className="space-y-1 text-slate-300 pl-3 list-disc">
                    {area.referentesTeoricos.slice(0, 3).map((ref, idx) => (
                      <li key={idx} className="leading-tight">{ref}</li>
                    ))}
                  </ul>
                </div>

                <div className="pt-2 border-t border-white/5 space-y-1 text-xs">
                  <span className="text-amber-300 font-bold block">Ajustes Razonables Clave:</span>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    {area.ajustesRazonablesSugeridos.join(' • ')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PESTAÑA: PLANIFICACIÓN SEMANAL DUA */}
      {activeTab === 'plan_semanal' && (
        <div className="space-y-6">
          <div className="glass-effect p-6 rounded-3xl border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                <Calendar className="text-emerald-400 w-6 h-6" />
                Planificación Semanal / Clase Participativa (Fases DUA)
              </h2>
              <p className="text-slate-300 text-xs mt-1">
                Estructura de intervención pedagógica y socialización semanal de Lunes a Viernes según las 3 dimensiones del DUA.
              </p>
            </div>
            <button
              onClick={() => handleGenerarProyecto('semanal')}
              disabled={isGenerating}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-all shrink-0"
            >
              {isGenerating ? <Loader2 className="animate-spin w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
              <span>Generar Plan Semanal con IA</span>
            </button>
          </div>

          {/* Tabla de Referencia DUA Oficial */}
          <div className="glass-effect p-6 rounded-3xl border border-white/10 space-y-6 overflow-x-auto">
            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Activity size={16} className="text-cyan-400" />
              Esquema Oficial Semanal con Principios DUA (Educación Especial 2026-2027)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-cyan-950/30 border border-cyan-500/30 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-bold text-xs border border-cyan-500/40">1</span>
                  <h4 className="font-bold text-white text-sm">CONCEPTUALIZACIÓN</h4>
                </div>
                <p className="text-xs text-cyan-200 font-semibold">Proporcionar múltiples medios de representación (El Qué)</p>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Presentar la información, materias primas y procedimientos mediante videos, pictogramas ARASAAC, demostraciones prácticas del docente y muestras físicas reales.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold text-xs border border-emerald-500/40">2</span>
                  <h4 className="font-bold text-white text-sm">GENERALIZACIÓN</h4>
                </div>
                <p className="text-xs text-emerald-200 font-semibold">Proporcionar múltiples medios de acción y expresión (El Cómo)</p>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Ofrecer a los estudiantes vías alternativas para demostrar su destreza: pesaje guiado, moldeado, selección de utensilios, simulación de roles de taller y trabajo manual autónomo.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/30 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold text-xs border border-amber-500/40">3</span>
                  <h4 className="font-bold text-white text-sm">SISTEMATIZACIÓN</h4>
                </div>
                <p className="text-xs text-amber-200 font-semibold">Proporcionar múltiples medios de implicación (El Por Qué)</p>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Conectar el aprendizaje con la motivación personal: empacar con orgullo el producto terminado, registrar en video o fotos sus logros, dramatizar la venta y reflexionar en colectivo.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PESTAÑA: INVERSIÓN Y LÍNEA DE PRODUCCIÓN */}
      {activeTab === 'inversion' && (
        <div className="space-y-6">
          <div className="glass-effect p-6 rounded-3xl border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                <DollarSign className="text-emerald-400 w-6 h-6" />
                Módulo Financiero y Línea de Producción del Taller
              </h2>
              <p className="text-slate-300 text-xs mt-1">
                Estructura de costos, estimación de volúmenes por lapso pedagógico y registro de ingresos y desembolsos.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* PLAN DE INVERSIÓN */}
            <div className="lg:col-span-7 space-y-6">
              <div className="glass-effect p-6 rounded-3xl border border-white/10 space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <DollarSign size={18} className="text-emerald-400" />
                    Plan de Inversión (Materia Prima)
                  </h3>
                  <span className="text-xs font-mono font-bold text-emerald-400">
                    Total: ${totalInversion.toFixed(2)}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-700 text-slate-400">
                        <th className="py-2 px-2">Materia Prima</th>
                        <th className="py-2 px-2">Cant</th>
                        <th className="py-2 px-2">Precio U ($)</th>
                        <th className="py-2 px-2 text-right">Sub-total ($)</th>
                        <th className="py-2 px-2 w-8"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {materiasPrimas.map((item, idx) => (
                        <tr key={idx} className="text-slate-200">
                          <td className="py-2 px-2">
                            <input
                              type="text"
                              value={item.nombre}
                              onChange={(e) => {
                                const copy = [...materiasPrimas];
                                copy[idx].nombre = e.target.value;
                                setMateriasPrimas(copy);
                              }}
                              className="bg-transparent border-b border-transparent focus:border-emerald-500 text-white w-full text-xs"
                            />
                          </td>
                          <td className="py-2 px-2">
                            <input
                              type="text"
                              value={item.cant}
                              onChange={(e) => {
                                const copy = [...materiasPrimas];
                                copy[idx].cant = e.target.value;
                                setMateriasPrimas(copy);
                              }}
                              className="bg-transparent border-b border-transparent focus:border-emerald-500 text-white w-16 text-xs"
                            />
                          </td>
                          <td className="py-2 px-2">
                            <input
                              type="number"
                              step="0.1"
                              value={item.precioU}
                              onChange={(e) => {
                                const copy = [...materiasPrimas];
                                const val = Number(e.target.value);
                                copy[idx].precioU = val;
                                copy[idx].subtotal = Number((val * parseFloat(copy[idx].cant || '1')).toFixed(2)) || val;
                                setMateriasPrimas(copy);
                              }}
                              className="bg-transparent border-b border-transparent focus:border-emerald-500 text-white w-16 text-xs"
                            />
                          </td>
                          <td className="py-2 px-2 text-right font-bold text-emerald-300">
                            ${Number(item.subtotal).toFixed(2)}
                          </td>
                          <td className="py-2 px-2 text-right">
                            <button
                              onClick={() => {
                                setMateriasPrimas(materiasPrimas.filter((_, i) => i !== idx));
                              }}
                              className="text-slate-500 hover:text-red-400"
                            >
                              <X size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <button
                  onClick={() => {
                    setMateriasPrimas([...materiasPrimas, { nombre: 'Nuevo Insumo', cant: '1 unid', precioU: 1.0, subtotal: 1.0 }]);
                  }}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1.5 transition-all"
                >
                  <Plus size={14} />
                  <span>Añadir Materia Prima</span>
                </button>
              </div>

              {/* ESTIMACIÓN DE PRODUCCIÓN */}
              <div className="glass-effect p-6 rounded-3xl border border-white/10 space-y-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <TrendingUp size={18} className="text-cyan-400" />
                  Cuánto se Estima Producir (Lapso Pedagógico)
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="p-3 rounded-2xl bg-slate-900/60 border border-white/5">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Semanal</span>
                    <input
                      type="text"
                      value={produccionEstimada.semanal}
                      onChange={(e) => setProduccionEstimada({ ...produccionEstimada, semanal: e.target.value })}
                      className="bg-transparent border-b border-slate-700 text-xs font-bold text-white w-full mt-1"
                    />
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-900/60 border border-white/5">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Quincenal</span>
                    <input
                      type="text"
                      value={produccionEstimada.quincenal}
                      onChange={(e) => setProduccionEstimada({ ...produccionEstimada, quincenal: e.target.value })}
                      className="bg-transparent border-b border-slate-700 text-xs font-bold text-white w-full mt-1"
                    />
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-900/60 border border-white/5">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Mensual</span>
                    <input
                      type="text"
                      value={produccionEstimada.mensual}
                      onChange={(e) => setProduccionEstimada({ ...produccionEstimada, mensual: e.target.value })}
                      className="bg-transparent border-b border-slate-700 text-xs font-bold text-white w-full mt-1"
                    />
                  </div>
                  <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/30">
                    <span className="text-[10px] font-bold text-emerald-400 block uppercase">Total Lapso</span>
                    <input
                      type="text"
                      value={produccionEstimada.total}
                      onChange={(e) => setProduccionEstimada({ ...produccionEstimada, total: e.target.value })}
                      className="bg-transparent border-b border-emerald-500/40 text-xs font-bold text-emerald-300 w-full mt-1"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* PROCESOS DE PRODUCCIÓN (PASO 1 A 6) */}
            <div className="lg:col-span-5 space-y-6">
              <div className="glass-effect p-6 rounded-3xl border border-white/10 space-y-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Briefcase size={18} className="text-amber-400" />
                  Procesos para la Elaboración del Producto (6 Pasos)
                </h3>
                <p className="text-xs text-slate-400">
                  Desglose secuenciado para orientación de participantes con necesidades educativas especiales:
                </p>

                <div className="space-y-3">
                  {pasosProduccion.map((paso, idx) => (
                    <div key={idx} className="p-3 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-amber-400 uppercase">Fase {idx + 1}</span>
                      </div>
                      <textarea
                        rows={2}
                        value={paso}
                        onChange={(e) => {
                          const copy = [...pasosProduccion];
                          copy[idx] = e.target.value;
                          setPasosProduccion(copy);
                        }}
                        className="bg-transparent border-none text-xs text-slate-200 w-full resize-none focus:outline-none focus:text-white"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PESTAÑA: HISTORIAL DE PROYECTOS DE EDUCACIÓN ESPECIAL */}
      {activeTab === 'historial' && (
        <div className="space-y-6">
          <div className="glass-effect p-6 rounded-3xl border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                <FileText className="text-emerald-400 w-6 h-6" />
                Historial de Proyectos de Educación Especial
              </h2>
              <p className="text-slate-300 text-xs mt-1">
                Proyectos pedagógicos y socioproductivos archivados para la modalidad de Educación Especial.
              </p>
            </div>
            <span className="text-xs px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
              {projects.length} Registros Almacenados
            </span>
          </div>

          {projects.length === 0 ? (
            <div className="glass-effect p-12 rounded-3xl border border-white/10 text-center space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-slate-800/80 border border-slate-700 flex items-center justify-center mx-auto text-slate-400">
                <FileText size={32} />
              </div>
              <h3 className="text-lg font-bold text-white">No tienes proyectos especiales aún</h3>
              <p className="text-slate-400 text-xs max-w-md mx-auto">
                Crea tu primer Proyecto de Aprendizaje Socioproductivo para el Taller de Educación Laboral o Instituto de Educación Especial desde la pestaña principal.
              </p>
              <button
                onClick={() => setActiveTab('crear')}
                className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-all"
              >
                Crear Mi Primer Proyecto
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map(proj => (
                <div
                  key={proj.id}
                  className="glass-effect p-6 rounded-3xl border border-white/10 space-y-4 hover:border-emerald-500/40 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        {proj.anioEscolar || '2026-2027'}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {proj.createdAt?.toLocaleDateString ? proj.createdAt.toLocaleDateString() : 'Reciente'}
                      </span>
                    </div>

                    <h3 className="font-bold text-white text-base leading-snug line-clamp-2">
                      {proj.titulo}
                    </h3>

                    <div className="text-xs text-slate-300 space-y-1 pt-1">
                      <div className="flex items-center gap-1.5 text-cyan-300">
                        <Brain size={14} />
                        <span className="truncate">{proj.condicion || 'Condición Especial'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-amber-300">
                        <Briefcase size={14} />
                        <span className="truncate">{proj.especialidad} {proj.mencion ? `(${proj.mencion})` : ''}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                        <Building size={14} />
                        <span className="truncate">{proj.institucion}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                    <button
                      onClick={() => {
                        setSelectedProject(proj);
                        setGeneratedContent(proj.contenido);
                        setActiveTab('crear');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5 transition-all"
                    >
                      <Eye size={14} />
                      <span>Ver / Imprimir</span>
                    </button>

                    <button
                      onClick={() => handleEliminarProyecto(proj.id)}
                      className="p-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-all"
                      title="Eliminar proyecto"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL DE LÍMITE */}
      {isLimitModalOpen && (
        <LimitReachedModal isOpen={isLimitModalOpen} onClose={() => setIsLimitModalOpen(false)} />
      )}
    </div>
  );
}
