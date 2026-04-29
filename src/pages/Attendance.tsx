import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { collection, query, orderBy, onSnapshot, doc, setDoc, getDocs, where } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { Student } from './Students';
import { Calendar as CalendarIcon, Check, X, Loader2, Printer, BarChart3, ClipboardList } from 'lucide-react';

export default function Attendance() {
  const { isGuest, generationsCount, teacherId } = useOutletContext<{ isGuest: boolean, generationsCount: number, teacherId: string }>();
  const [activeTab, setActiveTab] = useState<'daily' | 'monthly'>(() => (localStorage.getItem('attendance_active_tab') as any) || 'daily');
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    localStorage.setItem('attendance_active_tab', activeTab);
  }, [activeTab]);
  
  // Daily State
  const [selectedDate, setSelectedDate] = useState(() => localStorage.getItem('attendance_selected_date') || new Date().toISOString().split('T')[0]);
  const [attendanceData, setAttendanceData] = useState<Record<string, boolean>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    localStorage.setItem('attendance_selected_date', selectedDate);
  }, [selectedDate]);

  // Monthly State
  const [selectedMonth, setSelectedMonth] = useState(() => localStorage.getItem('attendance_selected_month') || new Date().toISOString().slice(0, 7));
  const [monthlyStats, setMonthlyStats] = useState<any>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  useEffect(() => {
    localStorage.setItem('attendance_selected_month', selectedMonth);
  }, [selectedMonth]);

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
      // Sort by apellidos then nombre client-side for consistent ordering
      const sorted = studentsData
        .sort((a, b) => {
          const apiA = (a.apellidos || '').trim();
          const apiB = (b.apellidos || '').trim();
          const strA = apiA ? `${apiA} ${a.nombre}` : a.nombre;
          const strB = apiB ? `${apiB} ${b.nombre}` : b.nombre;
          return strA.localeCompare(strB);
        });
      setStudents(sorted);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [teacherId]);

  // Fetch Daily Attendance
  useEffect(() => {
    if (!teacherId || activeTab !== 'daily') return;
    
    const fetchDaily = async () => {
      try {
        const q = query(
          collection(db, 'asistencias'),
          where('docenteId', '==', teacherId),
          where('fecha', '==', selectedDate)
        );
        const snapshot = await getDocs(q);
        const data: Record<string, boolean> = {};
        snapshot.forEach((doc) => {
          const record = doc.data();
          data[record.estudianteId] = record.asistio;
        });
        setAttendanceData(data);
      } catch (error) {
        console.error("Error fetching daily attendance:", error);
      }
    };
    fetchDaily();
  }, [teacherId, selectedDate, activeTab]);

  // Calculate Monthly Stats
  useEffect(() => {
    if (!teacherId || activeTab !== 'monthly' || students.length === 0) return;

    const calculateStats = async () => {
      setIsCalculating(true);
      try {
        const [year, month] = selectedMonth.split('-');
        const startDate = `${selectedMonth}-01`;
        const endDate = `${selectedMonth}-31`; // Simple approach for string comparison

        const q = query(
          collection(db, 'asistencias'),
          where('docenteId', '==', teacherId),
          where('fecha', '>=', startDate),
          where('fecha', '<=', endDate)
        );

        
        const snapshot = await getDocs(q);
        const records = snapshot.docs.map(doc => doc.data());

        // 1. Age and Sex Distribution
        const ageSexDist: Record<number, { V: number, H: number }> = {};
        let totalV = 0;
        let totalH = 0;

        students.forEach(student => {
          if (student.sexo === 'V') totalV++;
          if (student.sexo === 'H') totalH++;

          // Calculate age as of the selected month
          const birthDate = new Date(student.fechaNacimiento);
          const targetDate = new Date(parseInt(year), parseInt(month) - 1, 1);
          let age = targetDate.getFullYear() - birthDate.getFullYear();
          const m = targetDate.getMonth() - birthDate.getMonth();
          if (m < 0 || (m === 0 && targetDate.getDate() < birthDate.getDate())) {
            age--;
          }
          
          if (!ageSexDist[age]) ageSexDist[age] = { V: 0, H: 0 };
          ageSexDist[age][student.sexo]++;
        });

        // 2. Daily Attendance (Business Days)
        const daysInMonth = new Date(parseInt(year), parseInt(month), 0).getDate();
        const dailyStats: any[] = [];
        let totalAsistenciasV = 0;
        let totalAsistenciasH = 0;
        let diasHabiles = 0;

        for (let i = 1; i <= daysInMonth; i++) {
          const dateStr = `${selectedMonth}-${i.toString().padStart(2, '0')}`;
          const dateObj = new Date(parseInt(year), parseInt(month) - 1, i);
          const dayOfWeek = dateObj.getDay(); // 0 = Sun, 1 = Mon, ... 6 = Sat
          
          // Skip weekends
          if (dayOfWeek === 0 || dayOfWeek === 6) continue;
          
          diasHabiles++;
          const dayName = ['D', 'L', 'M', 'M', 'J', 'V', 'S'][dayOfWeek];

          const dayRecords = records.filter(r => r.fecha === dateStr && r.asistio);
          let vCount = 0;
          let hCount = 0;

          dayRecords.forEach(r => {
            const student = students.find(s => s.id === r.estudianteId);
            if (student?.sexo === 'V') vCount++;
            if (student?.sexo === 'H') hCount++;
          });

          totalAsistenciasV += vCount;
          totalAsistenciasH += hCount;

          dailyStats.push({
            fecha: i,
            dia: dayName,
            v: vCount,
            h: hCount,
            t: vCount + hCount
          });
        }

        setMonthlyStats({
          ageSexDist,
          totalV,
          totalH,
          dailyStats,
          diasHabiles,
          totalAsistenciasV,
          totalAsistenciasH
        });

      } catch (error) {
        console.error("Error calculating stats:", error);
      } finally {
        setIsCalculating(false);
      }
    };

    calculateStats();
  }, [teacherId, selectedMonth, activeTab, students]);

  const handleToggleAttendance = (studentId: string) => {
    setAttendanceData(prev => ({
      ...prev,
      [studentId]: !prev[studentId]
    }));
  };

  const handleSaveDaily = async () => {
    if (!teacherId) return;
    setIsSaving(true);
    try {
      const promises = students.map(student => {
        const asistio = attendanceData[student.id] || false;
        const docId = `${teacherId}_${student.id}_${selectedDate}`;
        return setDoc(doc(db, 'asistencias', docId), {
          teacher_id: teacherId, // New unified isolation field
          docenteId: teacherId, // Legacy compatibility
          estudianteId: student.id,
          fecha: selectedDate,
          asistio
        });
      });
      await Promise.all(promises);
      alert('Asistencia guardada correctamente');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'asistencias');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8 no-print">
        <h1 className="text-2xl font-bold text-gray-900">Control de Asistencia</h1>
        <p className="text-gray-600 mt-1">Registra la asistencia diaria y genera la estadística mensual.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 no-print border-b border-gray-200">
        <button
          onClick={() => setActiveTab('daily')}
          className={`flex items-center gap-2 px-4 py-3 font-medium text-sm transition-colors border-b-2 ${
            activeTab === 'daily' 
              ? 'border-blue-600 text-blue-600' 
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          Registro Diario
        </button>
        <button
          onClick={() => setActiveTab('monthly')}
          className={`flex items-center gap-2 px-4 py-3 font-medium text-sm transition-colors border-b-2 ${
            activeTab === 'monthly' 
              ? 'border-blue-600 text-blue-600' 
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Estadística Mensual
        </button>
      </div>

      {/* Daily Tab Content */}
      {activeTab === 'daily' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 no-print">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div className="flex items-center gap-3">
              <label htmlFor="date" className="font-medium text-gray-700">Fecha:</label>
              <input
                type="date"
                id="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <button
              onClick={handleSaveDaily}
              disabled={isSaving || isLoading || students.length === 0}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-70"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Guardar Asistencia
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[500px]">
              <thead>
                <tr className="bg-gray-50/50 text-gray-500 text-sm uppercase tracking-wider">
                  <th className="px-6 py-4 font-medium border-b border-gray-200 w-16">Nº</th>
                  <th className="px-6 py-4 font-medium border-b border-gray-200">Nombre del Alumno</th>
                  <th className="px-6 py-4 font-medium border-b border-gray-200 text-center">Asistencia</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                      Cargando estudiantes...
                    </td>
                  </tr>
                ) : students.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                      No hay estudiantes registrados. Ve al Panel de Estudiantes para agregarlos.
                    </td>
                  </tr>
                ) : (
                  students.map((student, index) => {
                    const isPresent = attendanceData[student.id] || false;
                    const displayName = student.apellidos 
                      ? `${student.apellidos}, ${student.nombre}`
                      : student.nombre;

                    return (
                      <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-gray-500">{index + 1}</td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-900">{displayName}</span>
                            <span className={`text-[10px] font-bold uppercase w-fit px-1.5 rounded ${student.nivel === 'Maternal' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                              {student.nivel || 'Primaria'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => handleToggleAttendance(student.id)}
                            className={`w-10 h-10 rounded-full flex items-center justify-center mx-auto transition-colors ${
                              isPresent 
                                ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                                : 'bg-red-100 text-red-600 hover:bg-red-200'
                            }`}
                          >
                            {isPresent ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Monthly Tab Content */}
      {activeTab === 'monthly' && (
        <div className="print-document">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6 no-print">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-3">
                <label htmlFor="month" className="font-medium text-gray-700">Mes a generar:</label>
                <input
                  type="month"
                  id="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <button
                onClick={handlePrint}
                disabled={isCalculating || !monthlyStats}
                className="bg-gray-800 hover:bg-gray-900 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-70"
              >
                <Printer className="w-4 h-4" />
                Imprimir Estadística
              </button>
            </div>
          </div>

          {isCalculating ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500 no-print">
              <Loader2 className="w-8 h-8 animate-spin mb-4 text-blue-600" />
              <p>Calculando estadísticas...</p>
            </div>
          ) : monthlyStats ? (
            <div className="bg-white p-8 shadow-sm border border-gray-200 print-document font-sans text-black">
              {/* Print Layout Header */}
              <div className="flex justify-between items-center mb-8 border-b-2 border-black pb-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center text-xs text-gray-500">Logo</div>
                  <div>
                    <h2 className="font-bold text-sm uppercase">Ministerio del Poder Popular</h2>
                    <h2 className="font-bold text-sm uppercase">para la Educación</h2>
                  </div>
                </div>
                <h1 className="text-2xl font-bold uppercase tracking-wider">Estadística Mensual</h1>
                <div className="w-32"></div> {/* Spacer for balance */}
              </div>

              {/* Info Row */}
              <div className="grid grid-cols-3 gap-4 mb-8 font-medium">
                <div>Docente: <span className="border-b border-black inline-block w-48"></span></div>
                <div>Sección: <span className="border-b border-black inline-block w-32"></span></div>
                <div>Mes: <span className="border-b border-black inline-block w-32">{selectedMonth}</span></div>
                <div>Grupo: <span className="border-b border-black inline-block w-48"></span></div>
                <div>Días Hábiles: <span className="border-b border-black inline-block w-24 text-center">{monthlyStats.diasHabiles}</span></div>
              </div>

              <div className="flex gap-12">
                {/* Left Column: Daily Attendance */}
                <div className="w-1/2">
                  <table className="w-full border-collapse border border-black text-center text-sm">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-black py-1 px-2">Fecha</th>
                        <th className="border border-black py-1 px-2">Día</th>
                        <th className="border border-black py-1 px-2">V</th>
                        <th className="border border-black py-1 px-2">H</th>
                        <th className="border border-black py-1 px-2">T</th>
                      </tr>
                    </thead>
                    <tbody>
                      {monthlyStats.dailyStats.map((stat: any) => (
                        <tr key={stat.fecha}>
                          <td className="border border-black py-1">{stat.fecha}</td>
                          <td className="border border-black py-1">{stat.dia}</td>
                          <td className="border border-black py-1">{stat.v || ''}</td>
                          <td className="border border-black py-1">{stat.h || ''}</td>
                          <td className="border border-black py-1 font-bold">{stat.t || ''}</td>
                        </tr>
                      ))}
                      <tr className="bg-gray-100 font-bold">
                        <td colSpan={2} className="border border-black py-1">Total</td>
                        <td className="border border-black py-1">{monthlyStats.totalAsistenciasV}</td>
                        <td className="border border-black py-1">{monthlyStats.totalAsistenciasH}</td>
                        <td className="border border-black py-1">{monthlyStats.totalAsistenciasV + monthlyStats.totalAsistenciasH}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Right Column: Aggregates */}
                <div className="w-1/2 flex flex-col gap-8">
                  
                  {/* Matricula */}
                  <div>
                    <h3 className="font-bold text-center mb-2">Matrícula</h3>
                    <table className="w-full border-collapse border border-black text-center text-sm">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="border border-black py-1 w-1/3"></th>
                          <th className="border border-black py-1 w-2/9">V</th>
                          <th className="border border-black py-1 w-2/9">H</th>
                          <th className="border border-black py-1 w-2/9">T</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border border-black py-1 font-medium text-left px-2">Ingreso</td>
                          <td className="border border-black py-1"></td>
                          <td className="border border-black py-1"></td>
                          <td className="border border-black py-1"></td>
                        </tr>
                        <tr>
                          <td className="border border-black py-1 font-medium text-left px-2">Egreso</td>
                          <td className="border border-black py-1"></td>
                          <td className="border border-black py-1"></td>
                          <td className="border border-black py-1"></td>
                        </tr>
                        <tr className="font-bold">
                          <td className="border border-black py-1 text-left px-2">Total</td>
                          <td className="border border-black py-1">{monthlyStats.totalV}</td>
                          <td className="border border-black py-1">{monthlyStats.totalH}</td>
                          <td className="border border-black py-1">{monthlyStats.totalV + monthlyStats.totalH}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Promedio */}
                  <div className="border border-black p-4 text-sm">
                    <h3 className="font-bold text-center mb-4">Promedio de Asistencia:</h3>
                    <div className="flex justify-around mb-4">
                      <div>V: <span className="border-b border-black inline-block w-16 text-center">
                        {monthlyStats.diasHabiles ? (monthlyStats.totalAsistenciasV / monthlyStats.diasHabiles).toFixed(1) : 0}
                      </span></div>
                      <div>H: <span className="border-b border-black inline-block w-16 text-center">
                        {monthlyStats.diasHabiles ? (monthlyStats.totalAsistenciasH / monthlyStats.diasHabiles).toFixed(1) : 0}
                      </span></div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div>T: <span className="border-b border-black inline-block w-16 text-center">
                        {monthlyStats.diasHabiles ? ((monthlyStats.totalAsistenciasV + monthlyStats.totalAsistenciasH) / monthlyStats.diasHabiles).toFixed(1) : 0}
                      </span></div>
                      <div className="flex items-center gap-2 ml-auto">
                        <span>Porcentaje:</span>
                        <div className="border border-black w-20 h-6"></div>
                      </div>
                    </div>
                  </div>

                  {/* Edad y Sexo */}
                  <div>
                    <h3 className="font-bold text-center mb-2">Clasificación por Edad y Sexo</h3>
                    <table className="w-full border-collapse border border-black text-center text-sm">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="border border-black py-1">Edad</th>
                          <th className="border border-black py-1">V</th>
                          <th className="border border-black py-1">H</th>
                          <th className="border border-black py-1">T</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(monthlyStats.ageSexDist).map(([age, counts]: [string, any]) => (
                          <tr key={age}>
                            <td className="border border-black py-1">{age}</td>
                            <td className="border border-black py-1">{counts.V || ''}</td>
                            <td className="border border-black py-1">{counts.H || ''}</td>
                            <td className="border border-black py-1 font-bold">{(counts.V || 0) + (counts.H || 0)}</td>
                          </tr>
                        ))}
                        {/* Empty rows to fill space if needed */}
                        {Object.keys(monthlyStats.ageSexDist).length < 3 && (
                          <>
                            <tr><td className="border border-black py-3"></td><td className="border border-black py-3"></td><td className="border border-black py-3"></td><td className="border border-black py-3"></td></tr>
                            <tr><td className="border border-black py-3"></td><td className="border border-black py-3"></td><td className="border border-black py-3"></td><td className="border border-black py-3"></td></tr>
                          </>
                        )}
                        <tr className="font-bold bg-gray-100">
                          <td className="border border-black py-1">Total</td>
                          <td className="border border-black py-1">{monthlyStats.totalV}</td>
                          <td className="border border-black py-1">{monthlyStats.totalH}</td>
                          <td className="border border-black py-1">{monthlyStats.totalV + monthlyStats.totalH}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Firma */}
                  <div className="mt-auto pt-12 text-center">
                    <div className="border-t border-black w-64 mx-auto pt-2">
                      Firma del Docente
                    </div>
                  </div>

                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
