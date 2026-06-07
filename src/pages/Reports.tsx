import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, where, deleteDoc, doc, updateDoc, increment } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { generateContentWithRetry } from '../lib/gemini';
import { FileBadge, Loader2, Sparkles, Printer, History, X, Save, Trash2, GraduationCap } from 'lucide-react';
import LimitReachedModal from '../components/LimitReachedModal';

interface Student {
  id: string;
  nombre: string;
  apellidos?: string;
  gradoSeccion: string;
  nivel?: 'Primaria' | 'Maternal' | 'Preescolar' | 'Media';
  fechaNacimiento: string;
  sexo: string;
}

interface Report {
  id: string;
  estudianteId: string;
  calificacion: string;
  observacion: string;
  createdAt: any;
}

const calculateAge = (birthDateString: string) => {
  if (!birthDateString) return 0;
  const birthDate = new Date(birthDateString);
  const ageDifMs = Date.now() - birthDate.getTime();
  const ageDate = new Date(ageDifMs);
  return Math.abs(ageDate.getUTCFullYear() - 1970);
};

export default function Reports() {
  const { isGuest, generationsCount, teacherId } = useOutletContext<{ isGuest: boolean, generationsCount: number, teacherId: string }>();
  const [activeTab, setActiveTab] = useState<'generate' | 'history'>(() => {
    return (localStorage.getItem('reports_active_tab') as 'generate' | 'history') || 'generate';
  });
  const [isLimitModalOpen, setIsLimitModalOpen] = useState(false);
  
  // Form State
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState(() => localStorage.getItem('reports_form_student') || '');
  const [calificacion, setCalificacion] = useState(() => localStorage.getItem('reports_form_calif') || '');
  const [palabrasClave, setPalabrasClave] = useState(() => localStorage.getItem('reports_form_keywords') || '');
  const [observacion, setObservacion] = useState(() => localStorage.getItem('reports_form_obs') || '');
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [reports, setReports] = useState<Report[]>([]);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync state to LocalStorage
  useEffect(() => {
    localStorage.setItem('reports_active_tab', activeTab);
    localStorage.setItem('reports_form_student', selectedStudentId);
    localStorage.setItem('reports_form_calif', calificacion);
    localStorage.setItem('reports_form_keywords', palabrasClave);
    localStorage.setItem('reports_form_obs', observacion);
  }, [activeTab, selectedStudentId, calificacion, palabrasClave, observacion]);

  useEffect(() => {
    if (selectedReport) {
      localStorage.setItem('reports_selected_id', selectedReport.id);
    }
  }, [selectedReport]);

  // Restore selected report
  useEffect(() => {
    const savedId = localStorage.getItem('reports_selected_id');
    if (savedId && reports.length > 0 && !selectedReport) {
      const found = reports.find(p => p.id === savedId);
      if (found) {
        setSelectedReport(found);
      }
    }
  }, [reports, selectedReport]);

  // Fetch Students
  useEffect(() => {
    if (!teacherId) return;

    const q = query(
      collection(db, 'estudiantes'),
      where('docenteId', '==', teacherId),
      orderBy('nombre', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const studentsData: Student[] = [];
      snapshot.forEach((doc) => {
        studentsData.push({ id: doc.id, ...doc.data() } as Student);
      });
      
      const sorted = studentsData.sort((a, b) => {
        const apiA = (a.apellidos || '').trim();
        const apiB = (b.apellidos || '').trim();
        const strA = apiA ? `${apiA} ${a.nombre}` : a.nombre;
        const strB = apiB ? `${apiB} ${b.nombre}` : b.nombre;
        return strA.localeCompare(strB);
      });
      
      setStudents(sorted);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'estudiantes');
    });

    return () => unsubscribe();
  }, [teacherId]);

  // Fetch Reports History
  useEffect(() => {
    if (!teacherId) return;

    const q = query(
      collection(db, 'boletines'),
      where('docenteId', '==', teacherId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const reportsData: Report[] = [];
      snapshot.forEach((doc) => {
        reportsData.push({ id: doc.id, ...doc.data() } as Report);
      });
      setReports(reportsData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'boletines');
    });

    return () => unsubscribe();
  }, [teacherId]);

  const handleGenerateObservation = async () => {
    if (!palabrasClave.trim()) {
      setErrorMsg("Por favor, ingresa algunas palabras clave sobre el rendimiento del estudiante.");
      return;
    }

    // Check Guest limit
    if (isGuest && generationsCount >= 3) {
      setIsLimitModalOpen(true);
      return;
    }

    setErrorMsg(null);
    setIsGenerating(true);
    try {
      let prompt = '';
      const isMaternalOrPre = selectedStudentData?.nivel === 'Maternal' || selectedStudentData?.nivel === 'Preescolar';
      const systemInstruction = "Eres un docente venezolano experto en redacción de boletines y reportes escolares. Tu objetivo es redactar observaciones pedagógicas, profesionales y motivadoras.";
      
      if (isMaternalOrPre) {
        prompt = `Genera un reporte de desarrollo para un niño de etapa ${selectedStudentData?.nivel} (nivel inicial) basado en las siguientes palabras clave.
Estructura: Un párrafo formal y amoroso (máximo 4 líneas) enfocado en hitos de desarrollo y áreas socio-emocionales.

Palabras clave: ${palabrasClave}`;
      } else {
        prompt = `Redacta la observación final para el boletín de un estudiante basado en las siguientes palabras clave.
Estructura: Un párrafo formal, pedagógico y motivador (máximo 4 líneas). Resalta logros y termina con una sugerencia constructiva.

Palabras clave: ${palabrasClave}`;
      }

      const response = await generateContentWithRetry({
        model: 'gemini-3.1-flash-lite',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          systemInstruction,
          temperature: 0.7,
        }
      });

      setObservacion(response.text || '');

      // Increment generationsCount only on successful AI call
      const userRef = doc(db, 'users', teacherId);
      await updateDoc(userRef, {
        generationsCount: increment(1)
      });

    } catch (error: any) {
      console.error("Error generating observation:", error);
      setErrorMsg(`Hubo un error: ${error.message || 'Error desconocido'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveReport = async () => {
    if (!selectedStudentId || !calificacion.trim() || !observacion.trim() || !teacherId) {
      setErrorMsg("Por favor, completa todos los campos (Estudiante, Calificación y Observación).");
      return;
    }

    const reportData = {
      estudianteId: selectedStudentId,
      calificacion: calificacion.trim(),
      observacion: observacion.trim(),
    };

    setErrorMsg(null);
    setIsSaving(true);
    try {
      const docRef = await addDoc(collection(db, 'boletines'), {
        teacher_id: teacherId, // New unified isolation field
        docenteId: teacherId, // Legacy compatibility
        ...reportData,
        createdAt: serverTimestamp()
      });

      // Clear form
      setSelectedStudentId('');
      setCalificacion('');
      setPalabrasClave('');
      setObservacion('');
      
      // Switch to history tab and select the new report
      setSelectedReport({
        id: docRef.id,
        ...reportData,
        createdAt: new Date()
      });
      setActiveTab('history');

    } catch (error) {
      console.error("Error saving report:", error);
      handleFirestoreError(error, OperationType.CREATE, 'boletines');
      setErrorMsg("Hubo un error al guardar el boletín.");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('¿Deseas eliminar este boletín?')) return;
    try {
      await deleteDoc(doc(db, 'boletines', id));
      if (selectedReport?.id === id) {
        setSelectedReport(null);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'boletines');
    }
  };

  const selectedStudentData = students.find(s => s.id === selectedStudentId);
  
  // Helper to get student data for the print view
  const getStudentForPrint = (studentId: string) => {
    return students.find(s => s.id === studentId);
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8 no-print">
        <h1 className="text-2xl font-bold text-white">Generador de Boletines</h1>
        <p className="text-slate-300 mt-1">Crea boletines informativos profesionales con observaciones redactadas por IA.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-white/10 overflow-x-auto no-print">
        <button
          onClick={() => { setActiveTab('generate'); setSelectedReport(null); }}
          className={`flex items-center gap-2 px-4 py-3 font-medium text-sm transition-colors border-b-2 whitespace-nowrap ${
            activeTab === 'generate' 
              ? 'border-indigo-400 text-indigo-400 font-bold' 
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <FileBadge className="w-4 h-4" />
          Generar Boletín
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-4 py-3 font-medium text-sm transition-colors border-b-2 whitespace-nowrap ${
            activeTab === 'history' 
              ? 'border-indigo-400 text-indigo-400 font-bold' 
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <History className="w-4 h-4" />
          Historial de Boletines
        </button>
      </div>

      {/* Generate Tab */}
      {activeTab === 'generate' && (
        <div className="space-y-8 no-print">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8 max-w-3xl mx-auto">
            {students.length === 0 ? (
              <div className="text-center py-8">
                <FileBadge className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No hay Estudiantes Registrados</h3>
                <p className="text-gray-500 mb-6">Debes registrar al menos un estudiante antes de poder generar un boletín.</p>
                <a href="/students" className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
                  Ir a Registro de Estudiantes
                </a>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <label htmlFor="student" className="block text-sm font-medium text-gray-700 mb-1">
                    Seleccionar Estudiante
                  </label>
                  <select
                    id="student"
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors bg-white"
                  >
                    <option value="" disabled>Selecciona un alumno...</option>
                    {students.map(student => {
                      const displayName = student.apellidos 
                        ? `${student.apellidos}, ${student.nombre}`
                        : student.nombre;
                      return <option key={student.id} value={student.id}>{displayName}</option>;
                    })}
                  </select>
                </div>

                {selectedStudentData && (
                  <div className="bg-indigo-50 rounded-lg p-4 flex flex-wrap gap-4 text-sm text-indigo-900 border border-indigo-100">
                    <p><strong>Nombres y Apellidos:</strong> {selectedStudentData.apellidos ? `${selectedStudentData.nombre} ${selectedStudentData.apellidos}` : selectedStudentData.nombre}</p>
                    <p><strong>Nivel:</strong> {selectedStudentData.nivel || 'Primaria'}</p>
                    <p><strong>{selectedStudentData.nivel === 'Maternal' ? 'Sala' : 'Grado'}:</strong> {selectedStudentData.gradoSeccion}</p>
                    <p><strong>Edad:</strong> {calculateAge(selectedStudentData.fechaNacimiento)} años</p>
                  </div>
                )}

                <div>
                  <label htmlFor="calificacion" className="block text-sm font-medium text-gray-700 mb-1">
                    Literal o Calificación Final
                  </label>
                  <input
                    type="text"
                    id="calificacion"
                    placeholder="Ej: A, B, C, D, E o nota numérica"
                    value={calificacion}
                    onChange={(e) => setCalificacion(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
                  />
                </div>

                <div>
                  <label htmlFor="palabrasClave" className="block text-sm font-medium text-gray-700 mb-1">
                    Palabras clave sobre el rendimiento
                  </label>
                  <input
                    type="text"
                    id="palabrasClave"
                    placeholder="Ej: Excelente en lectura, le cuesta un poco la suma, muy participativo"
                    value={palabrasClave}
                    onChange={(e) => setPalabrasClave(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors mb-3"
                  />
                  {errorMsg && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-3">
                      <span>{errorMsg}</span>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={handleGenerateObservation}
                    disabled={isGenerating || !palabrasClave.trim()}
                    className="w-full bg-indigo-100 hover:bg-indigo-200 text-indigo-700 font-medium py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Generando...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Generar Observación con IA</span>
                      </>
                    )}
                  </button>
                </div>

                <div>
                  <label htmlFor="observacion" className="block text-sm font-medium text-gray-700 mb-1">
                    Observación Final (Editable)
                  </label>
                  <textarea
                    id="observacion"
                    rows={4}
                    placeholder="La observación generada por IA aparecerá aquí y podrás editarla..."
                    value={observacion}
                    onChange={(e) => setObservacion(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors resize-none"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleSaveReport}
                  disabled={isSaving || !selectedStudentId || !calificacion.trim() || !observacion.trim()}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-md"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      <span>Guardar Boletín</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Live Preview for Print */}
          {selectedStudentData && calificacion && observacion && (
            <div className="max-w-3xl mx-auto mt-12">
              <h3 className="text-lg font-medium text-gray-500 mb-4 text-center">Vista Previa del Boletín</h3>
              <div className="bg-white border-2 border-gray-200 p-10 shadow-lg">
                {/* Header */}
                <div className="text-center mb-8 border-b-2 border-gray-800 pb-4">
                  <h2 className="font-bold text-lg uppercase">Ministerio del Poder Popular para la Educación</h2>
                  <h3 className="font-semibold text-md uppercase mt-1">Boletín Informativo de Rendimiento Estudiantil</h3>
                </div>

                {/* Student Info */}
                <div className="grid grid-cols-2 gap-x-8 gap-y-4 mb-8 text-sm">
                  <div className="col-span-2 sm:col-span-1">
                    <span className="font-bold">Nombres y Apellidos:</span>
                    <div className="border-b border-gray-400 mt-1 pb-1">
                      {selectedStudentData.apellidos 
                        ? `${selectedStudentData.apellidos}, ${selectedStudentData.nombre}` 
                        : selectedStudentData.nombre}
                    </div>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <span className="font-bold">Grado y Sección:</span>
                    <div className="border-b border-gray-400 mt-1 pb-1">{selectedStudentData.gradoSeccion}</div>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <span className="font-bold">Edad:</span>
                    <div className="border-b border-gray-400 mt-1 pb-1">{calculateAge(selectedStudentData.fechaNacimiento)} años</div>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <span className="font-bold">Calificación / Literal:</span>
                    <div className="border-b border-gray-400 mt-1 pb-1 font-bold text-lg">{calificacion}</div>
                  </div>
                </div>

                {/* Observation */}
                <div className="mb-16">
                  <span className="font-bold text-sm block mb-2">Observación del Docente:</span>
                  <div className="border border-gray-300 rounded-lg p-4 min-h-[120px] text-justify text-sm leading-relaxed bg-gray-50 text-gray-900 font-medium">
                    {observacion}
                  </div>
                </div>

                {/* Signatures */}
                <div className="grid grid-cols-3 gap-8 text-center text-xs mt-24">
                  <div>
                    <div className="border-t-2 border-gray-800 pt-2">Firma del Docente</div>
                  </div>
                  <div>
                    <div className="border-t-2 border-gray-800 pt-2">Sello de la Institución</div>
                  </div>
                  <div>
                    <div className="border-t-2 border-gray-800 pt-2">Firma del Representante</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && !selectedReport && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 no-print">
          {reports.length === 0 ? (
            <div className="col-span-full bg-white rounded-xl p-8 text-center border border-gray-200">
              <FileBadge className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No tienes boletines guardados aún.</p>
            </div>
          ) : (
            reports.map((report) => {
              const student = getStudentForPrint(report.estudianteId);
              const date = report.createdAt?.toDate ? report.createdAt.toDate().toLocaleDateString() : 'Reciente';
              return (
                <div 
                  key={report.id} 
                  onClick={() => setSelectedReport(report)}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 cursor-pointer hover:shadow-md hover:border-indigo-300 transition-all group"
                >
                  <div className="flex justify-between items-start mb-4">
                    <span className="bg-indigo-50 text-indigo-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                      Literal: {report.calificacion}
                    </span>
                    <span className="text-xs text-gray-400">{date}</span>
                    <button 
                      onClick={(e) => handleDelete(report.id, e)}
                      className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                    {student ? (student.apellidos ? `${student.apellidos}, ${student.nombre}` : student.nombre) : 'Estudiante Desconocido'}
                  </h3>
                  <p className="text-sm text-gray-500 line-clamp-2">
                    {report.observacion}
                  </p>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Selected Report View (Print Ready) */}
      {activeTab === 'history' && selectedReport && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Header Actions */}
          <div className="bg-gray-50 border-b border-gray-200 p-4 flex flex-wrap justify-between items-center gap-4 no-print">
            <button 
              onClick={() => {
                setSelectedReport(null);
                localStorage.removeItem('reports_selected_id');
              }}
              className="text-gray-500 hover:text-gray-700 flex items-center gap-1 font-medium text-sm"
            >
              <X className="w-4 h-4" />
              Cerrar Vista
            </button>
            {!isGuest && (
              <button 
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
              >
                <Printer className="w-4 h-4" />
                Imprimir Boletín
              </button>
            )}
          </div>

          {/* Report Content (Printable) */}
          <div className="p-8 sm:p-12 print:p-0 print:m-0 relative">
            {(() => {
              const student = getStudentForPrint(selectedReport.estudianteId);
              return (
                <div className="bg-white border-2 border-gray-200 p-10 print:border-none print:p-0 relative">
                  {/* Logo de Docente PRO en la esquina superior derecha */}
                  <div className="absolute top-6 right-8 text-right flex flex-col items-end print:top-1 print:right-1">
                    <div className="flex items-center gap-1 text-indigo-600 font-bold text-[11px] tracking-tight">
                      <GraduationCap className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Docenty<span className="text-indigo-500"> PRO</span></span>
                    </div>
                    <span className="text-[6.5px] font-bold text-gray-400 uppercase tracking-widest -mt-1">by META TC</span>
                  </div>

                  {/* Header */}
                  <div className="text-center mb-8 border-b-2 border-gray-800 pb-4 px-20">
                    <h2 className="font-bold text-lg uppercase">Ministerio del Poder Popular para la Educación</h2>
                    <h3 className="font-semibold text-md uppercase mt-1">Boletín Informativo de Rendimiento Estudiantil</h3>
                  </div>

                  {/* Student Info */}
                  <div className="grid grid-cols-2 gap-x-8 gap-y-4 mb-8 text-sm">
                    <div className="col-span-2 sm:col-span-1">
                      <span className="font-bold">Nombres y Apellidos:</span>
                      <div className="border-b border-gray-400 mt-1 pb-1">
                        {student 
                          ? (student.apellidos ? `${student.apellidos}, ${student.nombre}` : student.nombre) 
                          : 'N/A'}
                      </div>
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <span className="font-bold">Grado y Sección:</span>
                      <div className="border-b border-gray-400 mt-1 pb-1">{student?.gradoSeccion || 'N/A'}</div>
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <span className="font-bold">Edad:</span>
                      <div className="border-b border-gray-400 mt-1 pb-1">{student ? calculateAge(student.fechaNacimiento) : 'N/A'} años</div>
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <span className="font-bold">Calificación / Literal:</span>
                      <div className="border-b border-gray-400 mt-1 pb-1 font-bold text-lg">{selectedReport.calificacion}</div>
                    </div>
                  </div>

                  {/* Observation */}
                  <div className="mb-16">
                    <span className="font-bold text-sm block mb-2">Observación del Docente:</span>
                    <div className="border border-gray-300 rounded-lg p-4 min-h-[120px] text-justify text-sm leading-relaxed bg-gray-50 print:bg-transparent print:border-gray-800 text-gray-900 font-medium">
                      {selectedReport.observacion}
                    </div>
                  </div>

                  {/* Signatures */}
                  <div className="grid grid-cols-3 gap-8 text-center text-xs mt-24">
                    <div>
                      <div className="border-t-2 border-gray-800 pt-2">Firma del Docente</div>
                    </div>
                    <div>
                      <div className="border-t-2 border-gray-800 pt-2">Sello de la Institución</div>
                    </div>
                    <div>
                      <div className="border-t-2 border-gray-800 pt-2">Firma del Representante</div>
                    </div>
                  </div>
                </div>
              );
            })()}
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
