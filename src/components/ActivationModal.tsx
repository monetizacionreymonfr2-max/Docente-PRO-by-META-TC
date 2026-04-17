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

          <div className="mt-10 pt-8 border-t border-gray-100">
            <p className="text-center text-sm font-medium text-gray-900 mb-4">
              por ahora la app es gratuita comunicarse con el Creador
            </p>
            <a
              href="https://wa.me/584262953484"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-3 shadow-lg shadow-green-500/20 active:scale-[0.98] transition-all"
            >
              <svg 
                className="w-6 h-6 fill-current" 
                viewBox="0 0 24 24"
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Contactar por WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
