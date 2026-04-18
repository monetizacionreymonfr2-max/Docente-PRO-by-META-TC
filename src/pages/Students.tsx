import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, deleteDoc, doc, updateDoc, where } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { UserPlus, Loader2, Trash2, Edit2, Cake, Gift, Users, CalendarDays, X } from 'lucide-react';

export interface Student {
  id: string;
  nombre: string;
  apellidos?: string;
  gradoSeccion: string;
  nivel: 'Primaria' | 'Maternal' | 'Preescolar' | 'Media';
  fechaNacimiento: string;
  sexo: 'V' | 'H';
  createdAt: any;
}

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export default function Students() {
  const { isGuest, generationsCount, teacherId } = useOutletContext<{ isGuest: boolean, generationsCount: number, teacherId: string }>();
  const [activeTab, setActiveTab] = useState<'list' | 'birthdays'>('list');
  const [nombre, setNombre] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [gradoSeccion, setGradoSeccion] = useState('');
  const [nivel, setNivel] = useState<'Primaria' | 'Maternal' | 'Preescolar' | 'Media'>('Primaria');
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [sexo, setSexo] = useState<'V' | 'H'>('V');
  const [sortBy, setSortBy] = useState<'nombre' | 'apellido'>('apellido');
  
  const [students, setStudents] = useState<Student[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);

  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1; // 1-12
  const currentYear = currentDate.getFullYear();

  useEffect(() => {
    if (!teacherId) return;

    const q = query(
      collection(db, 'estudiantes'),
      where('teacher_id', '==', teacherId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const studentsData: Student[] = [];
      snapshot.forEach((doc) => {
        studentsData.push({ id: doc.id, ...doc.data() } as Student);
      });
      setStudents(studentsData);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching students:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [teacherId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !gradoSeccion.trim() || !fechaNacimiento || !teacherId) return;

    setIsSubmitting(true);
    try {
      if (editingId) {
        // Update existing student
        await updateDoc(doc(db, 'estudiantes', editingId), {
          nombre: nombre.trim(),
          apellidos: apellidos.trim(),
          gradoSeccion: gradoSeccion.trim(),
          nivel,
          fechaNacimiento,
          sexo,
          updatedAt: serverTimestamp()
        });
        setEditingId(null);
      } else {
        // Create new student
        await addDoc(collection(db, 'estudiantes'), {
          nombre: nombre.trim(),
          apellidos: apellidos.trim(),
          gradoSeccion: gradoSeccion.trim(),
          nivel,
          fechaNacimiento,
          sexo,
          teacher_id: teacherId, // New unified data isolation field
          docenteId: teacherId, // Kept for backward compatibility but teacher_id is the new standard
          createdAt: serverTimestamp()
        });
      }
      
      // Keep the current level after submission if it was set
      setNombre('');
      setApellidos('');
      setGradoSeccion('');
      setFechaNacimiento('');
      setSexo('V');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'estudiantes');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar a este estudiante? Esta acción no se puede deshacer.')) return;
    try {
      await deleteDoc(doc(db, 'estudiantes', id));
    } catch (error) {
      console.error("Error al eliminar estudiante:", error);
      handleFirestoreError(error, OperationType.DELETE, 'estudiantes');
      alert("Error al eliminar el estudiante. Verifica tus permisos.");
    }
  };

  const startEdit = (student: Student) => {
    setEditingId(student.id);
    setNombre(student.nombre);
    setApellidos(student.apellidos || '');
    setGradoSeccion(student.gradoSeccion);
    setNivel(student.nivel);
    setFechaNacimiento(student.fechaNacimiento);
    setSexo(student.sexo);
    setActiveTab('list');
    // Scroll to form (top)
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setNombre('');
    setApellidos('');
    setGradoSeccion('');
    setNivel('Primaria');
    setFechaNacimiento('');
    setSexo('V');
  };

  // Birthday Logic
  const sortedStudents = [...students].sort((a, b) => {
    const [, monthA, dayA] = a.fechaNacimiento.split('-').map(Number);
    const [, monthB, dayB] = b.fechaNacimiento.split('-').map(Number);
    if (monthA !== monthB) return monthA - monthB;
    return dayA - dayB;
  });

  const currentMonthBirthdays = sortedStudents.filter(s => {
    const [, m] = s.fechaNacimiento.split('-').map(Number);
    return m === currentMonth;
  });

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Panel de Estudiantes</h1>
        <p className="text-gray-600 mt-1">Gestiona la lista de alumnos y controla sus fechas de cumpleaños.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200 overflow-x-auto">
        <button
          onClick={() => setActiveTab('list')}
          className={`flex items-center gap-2 px-4 py-3 font-medium text-sm transition-colors border-b-2 whitespace-nowrap ${
            activeTab === 'list' 
              ? 'border-blue-600 text-blue-600' 
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <Users className="w-4 h-4" />
          Registro y Lista
        </button>
        <button
          onClick={() => setActiveTab('birthdays')}
          className={`flex items-center gap-2 px-4 py-3 font-medium text-sm transition-colors border-b-2 whitespace-nowrap ${
            activeTab === 'birthdays' 
              ? 'border-blue-600 text-blue-600' 
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <Cake className="w-4 h-4" />
          Control de Cumpleaños
        </button>
      </div>

      {activeTab === 'list' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Section */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-blue-600" />
                  <h2 className="text-lg font-semibold text-gray-900">{editingId ? 'Editar Alumno' : 'Registrar Alumno'}</h2>
                </div>
                {editingId && (
                  <button 
                    onClick={cancelEdit}
                    className="text-gray-400 hover:text-red-500 p-1 rounded-full hover:bg-red-50 transition-colors"
                    title="Cancelar edición"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-1">
                    Nombres
                  </label>
                  <input
                    type="text"
                    id="nombre"
                    required
                    placeholder="Ej: Juan"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                  />
                </div>

                <div>
                  <label htmlFor="apellidos" className="block text-sm font-medium text-gray-700 mb-1">
                    Apellidos
                  </label>
                  <input
                    type="text"
                    id="apellidos"
                    placeholder="Ej: Pérez (Opcional)"
                    value={apellidos}
                    onChange={(e) => setApellidos(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                  />
                </div>

                <div>
                  <label htmlFor="nivel" className="block text-sm font-medium text-gray-700 mb-1">
                    Nivel Educativo
                  </label>
                  <select
                    id="nivel"
                    required
                    value={nivel}
                    onChange={(e) => setNivel(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                  />
                </div>

                <div>
                  <label htmlFor="fechaNacimiento" className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha de Nacimiento
                  </label>
                  <input
                    type="date"
                    id="fechaNacimiento"
                    required
                    value={fechaNacimiento}
                    onChange={(e) => setFechaNacimiento(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                  />
                </div>

                <div>
                  <label htmlFor="sexo" className="block text-sm font-medium text-gray-700 mb-1">
                    Sexo
                  </label>
                  <select
                    id="sexo"
                    required
                    value={sexo}
                    onChange={(e) => setSexo(e.target.value as 'V' | 'H')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                  >
                    <option value="V">Varón (V)</option>
                    <option value="H">Hembra (H)</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {editingId ? 'Actualizando...' : 'Guardando...'}
                    </>
                  ) : (
                    editingId ? 'Actualizar Estudiante' : 'Guardar Estudiante'
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Table Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center flex-wrap gap-4">
                <h3 className="font-semibold text-gray-900">Lista de Estudiantes</h3>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-600">Ordenar por:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as 'nombre' | 'apellido')}
                    className="border border-gray-300 rounded-lg px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white text-gray-700"
                  >
                    <option value="apellido">Apellidos</option>
                    <option value="nombre">Nombres</option>
                  </select>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead>
                    <tr className="bg-gray-50/50 text-gray-500 text-sm uppercase tracking-wider">
                      <th className="px-6 py-4 font-medium border-b border-gray-200">Apellidos y Nombres</th>
                      <th className="px-6 py-4 font-medium border-b border-gray-200">Nivel</th>
                      <th className="px-6 py-4 font-medium border-b border-gray-200">Grado / Sala</th>
                      <th className="px-6 py-4 font-medium border-b border-gray-200">Edad</th>
                      <th className="px-6 py-4 font-medium border-b border-gray-200">Sexo</th>
                      <th className="px-6 py-4 font-medium border-b border-gray-200 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {isLoading ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                          Cargando estudiantes...
                        </td>
                      </tr>
                    ) : students.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                          No hay estudiantes registrados aún.
                        </td>
                      </tr>
                    ) : (
                      [...students].sort((a, b) => {
                        if (sortBy === 'apellido') {
                          const apiA = (a.apellidos || '').trim();
                          const apiB = (b.apellidos || '').trim();
                          // Fallback to nombre if apellidos are missing to ensure deterministic sorting
                          const strA = apiA ? `${apiA} ${a.nombre}` : a.nombre;
                          const strB = apiB ? `${apiB} ${b.nombre}` : b.nombre;
                          return strA.localeCompare(strB);
                        } else {
                          return a.nombre.localeCompare(b.nombre);
                        }
                      }).map((student) => {
                        // Calculate age roughly for display
                        const birthDate = new Date(student.fechaNacimiento);
                        const ageDifMs = Date.now() - birthDate.getTime();
                        const ageDate = new Date(ageDifMs);
                        const age = Math.abs(ageDate.getUTCFullYear() - 1970);
                        
                        // Construct display name based on sort order
                        const displayName = student.apellidos 
                          ? (sortBy === 'apellido' ? `${student.apellidos}, ${student.nombre}` : `${student.nombre} ${student.apellidos}`)
                          : student.nombre;

                        return (
                          <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                              {displayName}
                            </td>
                            <td className="px-6 py-4 text-gray-600 whitespace-nowrap">
                              <span className={`px-2 py-1 rounded-md text-xs font-semibold ${student.nivel === 'Maternal' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                                {student.nivel || 'Primaria'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-gray-600 whitespace-nowrap">
                              {student.gradoSeccion}
                            </td>
                            <td className="px-6 py-4 text-gray-600 whitespace-nowrap">
                              {isNaN(age) ? '-' : `${age} años`}
                            </td>
                            <td className="px-6 py-4 text-gray-600 whitespace-nowrap">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${student.sexo === 'V' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'}`}>
                                {student.sexo === 'V' ? 'Varón' : 'Hembra'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button 
                                  onClick={() => startEdit(student)}
                                  className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors" 
                                  title="Editar"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => handleDelete(student.id)}
                                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" 
                                  title="Eliminar"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'birthdays' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* Current Month Highlight */}
          <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl shadow-lg p-6 sm:p-8 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 opacity-10 transform translate-x-1/4 -translate-y-1/4">
              <Cake size={200} />
            </div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <Gift className="w-8 h-8 text-blue-200" />
                <h2 className="text-2xl font-bold">Cumpleañeros de {MONTHS[currentMonth - 1]}</h2>
              </div>

              {currentMonthBirthdays.length === 0 ? (
                <div className="bg-white/10 rounded-xl p-6 text-center backdrop-blur-sm border border-white/20">
                  <p className="text-blue-100 text-lg">No hay alumnos que cumplan años este mes.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {currentMonthBirthdays.map(student => {
                    const [y, m, d] = student.fechaNacimiento.split('-').map(Number);
                    const newAge = currentYear - y;
                    
                    return (
                      <div key={student.id} className="bg-white rounded-xl p-5 text-gray-900 shadow-md transform hover:scale-105 transition-transform">
                        <div className="flex justify-between items-start mb-3">
                          <h3 className="font-bold text-lg leading-tight">{student.nombre}</h3>
                          <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-1 rounded-full">
                            Día {d}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Cake className="w-4 h-4 text-pink-500" />
                          <span className="font-medium">Cumple {newAge} años</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* All Birthdays List */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-200 bg-gray-50 flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-gray-500" />
              <h3 className="font-semibold text-gray-900">Cronograma Anual de Cumpleaños</h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[500px]">
                <thead>
                  <tr className="bg-gray-50/50 text-gray-500 text-sm uppercase tracking-wider">
                    <th className="px-6 py-4 font-medium border-b border-gray-200">Mes</th>
                    <th className="px-6 py-4 font-medium border-b border-gray-200">Día</th>
                    <th className="px-6 py-4 font-medium border-b border-gray-200">Nombre del Alumno</th>
                    <th className="px-6 py-4 font-medium border-b border-gray-200">Edad a cumplir ({currentYear})</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {sortedStudents.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                        No hay estudiantes registrados.
                      </td>
                    </tr>
                  ) : (
                    sortedStudents.map((student) => {
                      const [y, m, d] = student.fechaNacimiento.split('-').map(Number);
                      const newAge = currentYear - y;
                      const isCurrentMonth = m === currentMonth;

                      return (
                        <tr key={student.id} className={`transition-colors ${isCurrentMonth ? 'bg-blue-50/50' : 'hover:bg-gray-50'}`}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`font-medium ${isCurrentMonth ? 'text-blue-700' : 'text-gray-900'}`}>
                              {MONTHS[m - 1]}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                            {d}
                          </td>
                          <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap flex items-center gap-2">
                            {student.nombre}
                            {isCurrentMonth && <Cake className="w-4 h-4 text-pink-500 inline" />}
                          </td>
                          <td className="px-6 py-4 text-gray-600 whitespace-nowrap">
                            {newAge} años
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
