import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, where, deleteDoc, doc } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { Baby, Loader2, Utensils, Moon, ShieldCheck, CheckSquare, LineChart, Plus, History, X, Trash2 } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState<'routine' | 'milestones'>('routine');
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
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Baby className="text-orange-500" />
          Sección Maternal
        </h1>
        <p className="text-gray-600 mt-1">Gestión de rutinas y hitos del desarrollo para los más pequeños.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200 overflow-x-auto">
        <button
          onClick={() => setActiveTab('routine')}
          className={`flex items-center gap-2 px-4 py-3 font-medium text-sm transition-colors border-b-2 whitespace-nowrap ${
            activeTab === 'routine' 
              ? 'border-orange-600 text-orange-600' 
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <Utensils className="w-4 h-4" />
          Bitácora de Rutinas
        </button>
        <button
          onClick={() => setActiveTab('milestones')}
          className={`flex items-center gap-2 px-4 py-3 font-medium text-sm transition-colors border-b-2 whitespace-nowrap ${
            activeTab === 'milestones' 
              ? 'border-orange-600 text-orange-600' 
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <LineChart className="w-4 h-4" />
          Hitos del Desarrollo
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
    </div>
  );
}
