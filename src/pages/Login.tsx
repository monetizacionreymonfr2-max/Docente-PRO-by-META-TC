import { useState } from 'react';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { GraduationCap, Loader2 } from 'lucide-react';

export default function Login() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError('');
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center hex-bg p-4 overflow-hidden relative">
      {/* Decorative Glows */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-futuristic-purple/20 blur-[100px] rounded-full"></div>
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-futuristic-magenta/20 blur-[100px] rounded-full"></div>
      
      <div className="glass-effect p-10 rounded-[2.5rem] shadow-2xl w-full max-w-md text-center border border-white/10 relative z-10 neon-border">
        <div className="flex justify-center mb-8 relative">
          <div className="absolute inset-0 bg-futuristic-accent/20 blur-2xl rounded-full animate-pulse"></div>
          <div className="bg-white/5 p-6 rounded-3xl border border-white/10 relative">
            <GraduationCap size={64} className="text-futuristic-accent drop-shadow-[0_0_15px_rgba(0,242,255,0.5)]" />
          </div>
        </div>
        
        <h2 className="text-4xl font-black text-white mb-2 tracking-tighter uppercase italic">
          Docente<span className="text-futuristic-accent drop-shadow-[0_0_10px_rgba(0,242,255,0.4)]"> PRO</span>
        </h2>
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="h-[1px] w-8 bg-gradient-to-r from-transparent to-white/20"></div>
          <p className="text-[10px] font-black text-white/40 tracking-[0.3em] uppercase">by META TC</p>
          <div className="h-[1px] w-8 bg-gradient-to-l from-transparent to-white/20"></div>
        </div>
        <p className="text-slate-400 mb-10 font-medium tracking-tight">Arquitectura Digital para el <span className="text-futuristic-magenta">Éxito Pedagógico</span></p>
        
        {error && (
          <div className="bg-red-500/10 text-red-400 border border-red-500/20 p-4 rounded-2xl mb-8 text-sm font-bold animate-shake">
            {error}
          </div>
        )}

        <button 
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="w-full bg-white/5 border border-white/10 text-white py-4 px-6 rounded-2xl hover:bg-white/10 hover:border-futuristic-purple/50 transition-all font-black flex items-center justify-center gap-4 disabled:opacity-70 disabled:cursor-not-allowed group shadow-lg"
        >
          {isLoading ? (
            <Loader2 className="w-6 h-6 animate-spin text-futuristic-accent" />
          ) : (
            <div className="bg-white p-1 rounded-lg">
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
            </div>
          )}
          <span className="tracking-widest uppercase text-xs">Acceso Biométrico Digital</span>
        </button>
        
        <div className="mt-10 flex items-center justify-center gap-3">
          <div className="w-1.5 h-1.5 rounded-full bg-futuristic-accent animate-pulse"></div>
          <span className="text-[10px] font-black text-white/20 tracking-[0.2em] uppercase">V 4.0.0 Stable Cloud</span>
        </div>
      </div>
    </div>
  );
}
