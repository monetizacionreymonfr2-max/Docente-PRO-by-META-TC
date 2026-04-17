import { useState } from 'react';
import { doc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { Key, Loader2, ShieldCheck, XCircle } from 'lucide-react';

interface ActivationModalProps {
  userId: string;
  email: string;
}

export default function ActivationModal({ userId, email }: ActivationModalProps) {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setIsLoading(true);
    setError(null);

    const codeId = code.trim().toUpperCase();
    const codeRef = doc(db, 'activation_codes', codeId);
    const userRef = doc(db, 'users', userId);

    try {
      await runTransaction(db, async (transaction) => {
        const codeDoc = await transaction.get(codeRef);
        
        if (!codeDoc.exists()) {
          throw new Error('El código ingresado no es válido.');
        }

        const codeData = codeDoc.data();
        if (codeData.status !== 'disponible') {
          throw new Error('Este código ya ha sido utilizado.');
        }

        // Calculate expiration: 30 days from now
        const now = new Date();
        const expirationDate = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));

        // 1. Update code status
        transaction.update(codeRef, {
          status: 'usado',
          usedBy: userId,
          usedByEmail: email,
          usedAt: serverTimestamp(),
          expiresAt: expirationDate
        });

        // 2. Update user status
        transaction.update(userRef, {
          isActive: true,
          expiresAt: expirationDate,
          activatedAt: serverTimestamp(),
          activationCode: codeId
        });
      });

      // Browser will refresh or state will update via listener in App.tsx
      window.location.reload(); 
    } catch (err: any) {
      console.error('Activation error:', err);
      setError(err.message || 'Error al activar el código. Inténtalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-blue-900/95 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-8 text-center border-b border-gray-100 bg-gray-50/50">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6 text-blue-600 shadow-inner">
            <Key size={40} />
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-2 tracking-tight">Activar Docente PRO</h2>
          <p className="text-gray-500 text-sm leading-relaxed">
            Hola <span className="font-semibold text-blue-600">{email}</span>. Para acceder a las funciones premium, ingresa tu código de activación.
          </p>
        </div>

        <div className="p-8">
          <form onSubmit={handleActivate} className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">
                Código de Activación
              </label>
              <input
                type="text"
                placeholder="META-XXXX-XXXX"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full px-6 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-center text-xl font-mono font-bold tracking-widest text-blue-900 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all uppercase placeholder:text-gray-300"
                required
              />
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600 text-sm animate-in shake duration-300">
                <XCircle size={18} className="shrink-0" />
                <p className="font-medium">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-black py-4 rounded-2xl text-lg shadow-xl shadow-blue-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Verificando...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-6 h-6" />
                  Activar Ahora
                </>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-xs text-gray-400 leading-relaxed max-w-[250px] mx-auto">
            ¿No tienes un código? Contacta con el administrador <span className="text-blue-500 font-medium">META TC</span> para obtener tu licencia.
          </p>
        </div>
      </div>
    </div>
  );
}
