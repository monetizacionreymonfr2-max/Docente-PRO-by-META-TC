import { useState, useEffect } from 'react';
import { collection, setDoc, doc, onSnapshot, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { PlusCircle, Ticket, CheckCircle2, Copy, History, Loader2, Wand2 } from 'lucide-react';

interface Code {
  id: string;
  status: 'disponible' | 'usado';
  usedBy?: string;
  createdAt: any;
  usedAt?: any;
}

export default function AdminPanel() {
  const [codes, setCodes] = useState<Code[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'activation_codes'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const codesData: Code[] = [];
      snapshot.forEach((doc) => {
        codesData.push({ id: doc.id, ...doc.data() } as Code);
      });
      setCodes(codesData);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const generateCode = async () => {
    setIsGenerating(true);
    try {
      // Format: META-XXXX-XXXX
      const randomPart = () => Math.random().toString(36).substring(2, 6).toUpperCase();
      const codeId = `META-${randomPart()}-${randomPart()}`;
      
      await setDoc(doc(db, 'activation_codes', codeId), {
        status: 'disponible',
        createdAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'activation_codes');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Simple feedback
    alert(`Código ${text} copiado!`);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Panel Principal <span className="text-blue-600">SaaS</span></h1>
          <p className="text-gray-500 mt-1 font-medium italic">Gestión de licencias y activación de usuarios.</p>
        </div>
        <button
          onClick={generateCode}
          disabled={isGenerating}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-2xl flex items-center gap-3 shadow-lg shadow-blue-500/20 active:scale-95 transition-all text-sm uppercase tracking-wider disabled:opacity-50"
        >
          {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5" />}
          Generar Nuevo Código
        </button>
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
                <th className="px-8 py-4">Estado</th>
                <th className="px-8 py-4">Usuario</th>
                <th className="px-8 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-8 py-12 text-center text-gray-400 font-medium">Cargando códigos...</td>
                </tr>
              ) : codes.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-8 py-12 text-center text-gray-400 font-medium">No hay códigos generados.</td>
                </tr>
              ) : (
                codes.map((code) => (
                  <tr key={code.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-8 py-4 font-mono font-bold text-blue-900 tracking-widest">
                      {code.id}
                    </td>
                    <td className="px-8 py-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        code.status === 'disponible' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {code.status}
                      </span>
                    </td>
                    <td className="px-8 py-4 text-xs font-medium text-gray-500 truncate max-w-[150px]">
                      {code.usedBy || '---'}
                    </td>
                    <td className="px-8 py-4 text-right">
                      {code.status === 'disponible' && (
                        <button 
                          onClick={() => copyToClipboard(code.id)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                          title="Copiar Código"
                        >
                          <Copy size={18} />
                        </button>
                      )}
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
