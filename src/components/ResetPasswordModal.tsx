import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Lock, Loader2, CheckCircle2, KeyRound } from 'lucide-react';

interface ResetPasswordModalProps {
  onSuccess: () => void;
}

export default function ResetPasswordModal({ onSuccess }: ResetPasswordModalProps) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden. Por favor verifícalas.');
      return;
    }

    setIsLoading(true);
    try {
      const { error: updateErr } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateErr) throw updateErr;

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (err: any) {
      console.error("Error updating password:", err);
      setError(err.message || 'Error al actualizar la contraseña.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="glass-effect p-8 rounded-[2.5rem] shadow-2xl w-full max-w-md text-center border border-white/10 relative z-10 neon-border animate-in fade-in zoom-in duration-300">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-futuristic-accent/10 border border-futuristic-accent/30 rounded-2xl flex items-center justify-center text-futuristic-accent">
            <KeyRound size={32} className="drop-shadow-[0_0_10px_rgba(0,242,255,0.5)]" />
          </div>
        </div>

        <h2 className="text-2xl font-black text-white mb-2 tracking-tight">
          Nueva Contraseña
        </h2>
        <p className="text-slate-400 text-xs mb-6">
          Ingresa y confirma tu nueva clave de acceso para tu cuenta de Docenty PRO.
        </p>

        {error && (
          <div className="bg-red-500/10 text-red-400 border border-red-500/20 p-3 rounded-xl mb-4 text-xs font-bold text-left">
            {error}
          </div>
        )}

        {success ? (
          <div className="bg-green-500/10 text-green-400 border border-green-500/20 p-4 rounded-2xl text-xs font-bold flex items-center justify-center gap-2">
            <CheckCircle2 size={18} />
            <span>¡Contraseña actualizada con éxito! Redirigiendo...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative text-left">
              <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 px-1">Nueva Contraseña</span>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="password"
                  placeholder="Al menos 6 caracteres"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 focus:border-futuristic-accent rounded-2xl text-white text-sm outline-none transition-all placeholder:text-slate-500"
                  required
                />
              </div>
            </div>

            <div className="relative text-left">
              <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 px-1">Confirmar Nueva Contraseña</span>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="password"
                  placeholder="Repite la contraseña"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 focus:border-futuristic-accent rounded-2xl text-white text-sm outline-none transition-all placeholder:text-slate-500"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-futuristic-purple to-futuristic-accent text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:opacity-90 active:scale-[0.99] transition-all flex items-center justify-center gap-3 shadow-xl disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin text-white" />
              ) : (
                'Guardar Nueva Contraseña'
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
