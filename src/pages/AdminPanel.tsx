import { useState, useEffect } from 'react';
import { collection, setDoc, doc, onSnapshot, query, orderBy, serverTimestamp, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Ticket, CheckCircle2, Copy, History, Loader2, Wand2, CalendarDays, RefreshCw, Trash2, Plus, Minus } from 'lucide-react';

interface Code {
  id: string;
  status: 'disponible' | 'usado';
  access_level: 'guest' | 'pro';
  usedBy?: string;
  usedByEmail?: string;
  expiresAt?: any;
  createdAt: any;
  usedAt?: any;
}

export default function AdminPanel() {
  const [codes, setCodes] = useState<Code[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState<string | false>(false);

  useEffect(() => {
    let isMounted = true;
    
    // Fallback timer: if onSnapshot doesn't respond in 20 seconds, stop loading
    const timer = setTimeout(() => {
      if (isMounted && isLoading) {
        setIsLoading(false);
        console.error("Timeout: activation_codes connection taking too long");
      }
    }, 20000);

    const q = collection(db, 'activation_codes');
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!isMounted) return;
      clearTimeout(timer);
      const codesData: Code[] = [];
      snapshot.forEach((doc) => {
        codesData.push({ id: doc.id, ...doc.data() } as Code);
      });
      // Sort in memory instead of query to avoid index issues/missing fields
      codesData.sort((a, b) => {
        const getTime = (val: any) => {
          if (!val) return 0;
          if (val.toMillis) return val.toMillis();
          if (val.seconds) return val.seconds * 1000;
          if (val instanceof Date) return val.getTime();
          if (typeof val === 'number') return val;
          const d = new Date(val);
          return isNaN(d.getTime()) ? 0 : d.getTime();
        };
        return getTime(b.createdAt) - getTime(a.createdAt);
      });
      setCodes(codesData);
      setIsLoading(false);
    }, (error: any) => {
      if (!isMounted) return;
      clearTimeout(timer);
      console.error("FIREBASE SQL ERROR:", error);
      alert(`Error de conexión con la base de datos: ${error.message || error}`);
      setIsLoading(false);
      try {
        handleFirestoreError(error, OperationType.LIST, 'activation_codes');
      } catch (e) {
        // Error reported via console.error above and handleFirestoreError
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  const generateCode = async (level: 'guest' | 'pro') => {
    setIsGenerating(level); // temporary trick to know which one is generating or true
    try {
      // Format: META-XXXX-XXXX
      const randomPart = () => Math.random().toString(36).substring(2, 6).toUpperCase();
      const codeId = `META-${randomPart()}-${randomPart()}`;
      
      await setDoc(doc(db, 'activation_codes', codeId), {
        code: codeId,
        status: 'disponible',
        access_level: level,
        createdAt: serverTimestamp()
      });
      alert(`Código ${codeId} generado exitosamente!`);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'activation_codes');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert(`Código ${text} copiado!`);
  };

  const handleRenew = async (code: Code) => {
    await handleAdjustDays(code, 30);
  };

  const handleAdjustDays = async (code: Code, days: number) => {
    if (!code.usedBy || !code.expiresAt) return;
    
    const action = days > 0 ? 'sumar' : 'quitar';
    const confirmAction = window.confirm(`¿Seguro que deseas ${action} ${Math.abs(days)} días a la suscripción de ${code.usedByEmail}?`);
    if (!confirmAction) return;

    try {
      // Robust conversion: support Timestamp, Date, or object with seconds
      let currentExpiration: Date;
      if (code.expiresAt?.toDate) {
        currentExpiration = code.expiresAt.toDate();
      } else if (code.expiresAt instanceof Date) {
        currentExpiration = code.expiresAt;
      } else if (code.expiresAt?.seconds) {
        currentExpiration = new Date(code.expiresAt.seconds * 1000);
      } else {
        currentExpiration = new Date(code.expiresAt);
      }

      if (isNaN(currentExpiration.getTime())) {
        throw new Error("Fecha de expiración inválida");
      }

      const newExpiration = new Date(currentExpiration.getTime() + (days * 24 * 60 * 60 * 1000));

      const batch = writeBatch(db);
      
      // Update code document
      batch.update(doc(db, 'activation_codes', code.id), {
        expiresAt: newExpiration
      });

      // Update user profile document
      batch.update(doc(db, 'users', code.usedBy), {
        expiresAt: newExpiration,
        isActive: newExpiration > new Date() // Check if still active after modification
      });

      await batch.commit();
      alert(`¡Suscripción actualizada! Se han ${days > 0 ? 'sumado' : 'quitado'} ${Math.abs(days)} días.`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'activation_codes');
    }
  };

  const handleDeleteCode = async (code: Code) => {
    const message = code.status === 'usado' 
      ? `¿Seguro que deseas eliminar este código? El usuario ${code.usedByEmail} perderá el acceso premium inmediatamente.`
      : `¿Seguro que deseas eliminar este código disponible?`;
    
    if (!window.confirm(message)) return;

    try {
      const batch = writeBatch(db);

      // If it was used, deactivate the user
      if (code.status === 'usado' && code.usedBy) {
        batch.update(doc(db, 'users', code.usedBy), {
          isActive: false,
          expiresAt: null,
          activationCode: null
        });
      }

      // Delete the code document
      batch.delete(doc(db, 'activation_codes', code.id));

      await batch.commit();
      alert('Código eliminado exitosamente.');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'activation_codes');
    }
  };

  const calculateDaysLeft = (expiresAt: any) => {
    if (!expiresAt) return 0;
    try {
      const now = new Date();
      let expiration: Date;
      
      if (expiresAt?.toDate) {
        expiration = expiresAt.toDate();
      } else if (expiresAt instanceof Date) {
        expiration = expiresAt;
      } else if (expiresAt?.seconds) {
        expiration = new Date(expiresAt.seconds * 1000);
      } else {
        expiration = new Date(expiresAt);
      }

      if (isNaN(expiration.getTime())) return 0;

      const diffTime = expiration.getTime() - now.getTime();
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    } catch (e) {
      console.error("Error calculating days left:", e);
      return 0;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Panel Principal <span className="text-blue-600">SaaS</span></h1>
          <p className="text-gray-500 mt-1 font-medium italic">Gestión de licencias y activación de usuarios.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => generateCode('guest')}
            disabled={!!isGenerating}
            className="bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 px-6 rounded-2xl flex items-center gap-3 shadow-lg shadow-amber-500/20 active:scale-95 transition-all text-sm uppercase tracking-wider disabled:opacity-50"
          >
            {isGenerating === 'guest' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5" />}
            {isGenerating === 'guest' ? 'Generando... (espera)' : 'Código Invitado'}
          </button>
          <button
            onClick={() => generateCode('pro')}
            disabled={!!isGenerating}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-2xl flex items-center gap-3 shadow-lg shadow-blue-500/20 active:scale-95 transition-all text-sm uppercase tracking-wider disabled:opacity-50"
          >
            {isGenerating === 'pro' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5" />}
            {isGenerating === 'pro' ? 'Generando... (espera)' : 'Código PRO'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 shrink-0">
            <Ticket size={24} />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Total</p>
            <p className="text-2xl font-black text-gray-900">{codes.length}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center text-green-600 shrink-0">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Disponibles</p>
            <p className="text-2xl font-black text-gray-900">{codes.filter(c => c.status === 'disponible').length}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 shrink-0">
            <History size={24} />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Usados</p>
            <p className="text-2xl font-black text-gray-900">{codes.filter(c => c.status === 'usado').length}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-8 py-6 border-b border-gray-50 bg-gray-50/50 flex items-center gap-2">
          <History size={20} className="text-gray-400" />
          <h2 className="font-black text-gray-900 uppercase tracking-tight text-sm">Registro de Códigos</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-50">
                <th className="px-8 py-4">Código</th>
                <th className="px-8 py-4">Nivel</th>
                <th className="px-8 py-4">Estado</th>
                <th className="px-8 py-4">Usuario</th>
                <th className="px-8 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-8 py-12 text-center text-gray-400 font-medium">Cargando códigos...</td>
                </tr>
              ) : codes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-12 text-center text-gray-400 font-medium">No hay códigos generados.</td>
                </tr>
              ) : (
                codes.map((code) => (
                  <tr key={code.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-8 py-4 font-mono font-bold text-blue-900 tracking-widest">
                      {code.id}
                    </td>
                    <td className="px-8 py-4">
                      <span className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest ${
                        code.access_level === 'pro' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {code.access_level || 'pro'}
                      </span>
                    </td>
                    <td className="px-8 py-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        code.status === 'disponible' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {code.status}
                      </span>
                    </td>
                    <td className="px-8 py-4 text-xs font-medium text-gray-500 truncate max-w-[150px]">
                      {typeof code.usedByEmail === 'string' ? code.usedByEmail : 
                       typeof code.usedBy === 'string' ? code.usedBy : '---'}
                    </td>
                    <td className="px-8 py-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        {code.status === 'usado' && code.expiresAt && (
                          <div className="flex items-center gap-4">
                            <div className="flex flex-col items-end">
                              <span className={`text-[10px] font-black uppercase tracking-widest ${
                                (calculateDaysLeft(code.expiresAt) || 0) > 0 ? 'text-blue-600' : 'text-red-600'
                              }`}>
                                {(calculateDaysLeft(code.expiresAt) || 0) > 0 ? 'Quedan' : 'Expiró hace'}
                              </span>
                              <span className="text-xs font-bold text-gray-900">
                                {Math.abs(calculateDaysLeft(code.expiresAt) || 0)} días
                              </span>
                            </div>
                            <div className="flex items-center bg-gray-50 rounded-xl p-1 border border-gray-100">
                              <button
                                onClick={() => handleAdjustDays(code, -1)}
                                className="p-1.5 text-red-500 hover:bg-white hover:shadow-sm rounded-lg transition-all"
                                title="Quitar 1 día"
                              >
                                <Minus size={14} />
                              </button>
                              <div className="w-px h-4 bg-gray-200 mx-1" />
                              <button
                                onClick={() => handleAdjustDays(code, 1)}
                                className="p-1.5 text-green-600 hover:bg-white hover:shadow-sm rounded-lg transition-all"
                                title="Sumar 1 día"
                              >
                                <Plus size={14} />
                              </button>
                              <div className="w-px h-4 bg-gray-200 mx-1" />
                              <button
                                onClick={() => handleRenew(code)}
                                className="p-1.5 text-blue-600 hover:bg-white hover:shadow-sm rounded-lg transition-all"
                                title="Plan Mensual (+30 días)"
                              >
                                <RefreshCw size={14} />
                              </button>
                            </div>
                          </div>
                        )}
                        {code.status === 'disponible' && (
                          <button 
                            onClick={() => copyToClipboard(code.id)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                            title="Copiar Código"
                          >
                            <Copy size={18} />
                          </button>
                        )}
                        <button 
                          onClick={() => handleDeleteCode(code)}
                          className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                          title="Eliminar Código"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
