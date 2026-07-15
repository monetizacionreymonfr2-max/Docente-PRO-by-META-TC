import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { GraduationCap, Loader2, Mail, Lock, Sparkles, LogIn, UserPlus } from 'lucide-react';

export default function Login() {
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      if (activeTab === 'signin') {
        const { error: signInErr } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password: password,
        });
        if (signInErr) throw signInErr;
      } else {
        const { error: signUpErr, data } = await supabase.auth.signUp({
          email: email.trim().toLowerCase(),
          password: password,
        });
        if (signUpErr) throw signUpErr;
        
        // Check if session exists or confirmation mail is sent
        if (data?.session) {
          setSuccess('¡Cuenta registrada e iniciada con éxito!');
        } else {
          setSuccess('¡Registro iniciado! Por favor verifica tu correo electrónico si está activada la confirmación.');
        }
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      setError(err.message || 'Error en el proceso de autenticación');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError('');
    setSuccess('');
    try {
      const { error: googleErr } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (googleErr) throw googleErr;
    } catch (err: any) {
      console.error("Google Auth error:", err);
      setError(err.message || 'Error al iniciar sesión con Google');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center hex-bg p-4 overflow-hidden relative">
      {/* Decorative Glows */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-futuristic-purple/20 blur-[100px] rounded-full"></div>
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-futuristic-magenta/20 blur-[100px] rounded-full"></div>
      
      <div className="glass-effect p-8 sm:p-10 rounded-[2.5rem] shadow-2xl w-full max-w-md text-center border border-white/10 relative z-10 neon-border">
        <div className="flex justify-center mb-6 relative">
          <div className="absolute inset-0 bg-futuristic-accent/20 blur-2xl rounded-full animate-pulse"></div>
          <div className="bg-white/5 p-5 rounded-3xl border border-white/10 relative">
            <GraduationCap size={56} className="text-futuristic-accent drop-shadow-[0_0_15px_rgba(0,242,255,0.5)]" />
          </div>
        </div>
        
        <h2 className="text-3xl sm:text-4xl font-black text-white mb-1 tracking-tighter uppercase italic">
          Docenty<span className="text-futuristic-accent drop-shadow-[0_0_10px_rgba(0,242,255,0.4)]"> PRO</span>
        </h2>
        
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="h-[1px] w-6 bg-gradient-to-r from-transparent to-white/20"></div>
          <p className="text-[9px] font-black text-white/40 tracking-[0.3em] uppercase">by META TC</p>
          <div className="h-[1px] w-6 bg-gradient-to-l from-transparent to-white/20"></div>
        </div>
        
        <p className="text-slate-400 mb-6 text-sm font-medium tracking-tight">
          Arquitectura Digital para el <span className="text-futuristic-magenta">Éxito Pedagógico</span>
        </p>

        {/* Tab Buttons */}
        <div className="flex bg-white/5 p-1 rounded-2xl mb-6 border border-white/5">
          <button
            type="button"
            onClick={() => { setActiveTab('signin'); setError(''); setSuccess(''); }}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 ${
              activeTab === 'signin'
                ? 'bg-gradient-to-r from-futuristic-purple to-futuristic-magenta text-white shadow-lg'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <LogIn size={14} />
            <span>Iniciar Sesión</span>
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('signup'); setError(''); setSuccess(''); }}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 ${
              activeTab === 'signup'
                ? 'bg-gradient-to-r from-futuristic-purple to-futuristic-magenta text-white shadow-lg'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <UserPlus size={14} />
            <span>Registrarse</span>
          </button>
        </div>
        
        {error && (
          <div className="bg-red-500/10 text-red-400 border border-red-500/20 p-3.5 rounded-2xl mb-6 text-xs font-bold text-left">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-500/10 text-green-400 border border-green-500/20 p-3.5 rounded-2xl mb-6 text-xs font-bold text-left">
            {success}
          </div>
        )}

        {/* Standard Email & Password Form */}
        <form onSubmit={handleEmailAuth} className="space-y-4 mb-6">
          <div className="relative text-left">
            <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 px-1">Correo Electrónico</span>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="email"
                placeholder="ejemplo@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 focus:border-futuristic-accent rounded-2xl text-white text-sm outline-none transition-all placeholder:text-slate-500"
                required
              />
            </div>
          </div>

          <div className="relative text-left">
            <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 px-1">Contraseña</span>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
            ) : activeTab === 'signin' ? (
              'Ingresar al Panel'
            ) : (
              'Crear Cuenta'
            )}
          </button>
        </form>

        <div className="flex items-center gap-3 my-6">
          <div className="h-[1px] flex-1 bg-white/10"></div>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">o continuar con</span>
          <div className="h-[1px] flex-1 bg-white/10"></div>
        </div>

        {/* Google Authentication Button */}
        <button 
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="w-full bg-white/5 border border-white/10 text-white py-3.5 px-6 rounded-2xl hover:bg-white/10 hover:border-futuristic-purple/50 transition-all font-black flex items-center justify-center gap-4 disabled:opacity-70 disabled:cursor-not-allowed group shadow-lg"
        >
          <div className="bg-white p-1 rounded-lg shrink-0">
            <svg className="w-5 h-5" viewBox="0 0 24 24">
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
          <span className="tracking-widest uppercase text-xs">Acceso Google</span>
        </button>
        
        <div className="mt-8 flex items-center justify-center gap-3">
          <div className="w-1.5 h-1.5 rounded-full bg-futuristic-accent animate-pulse"></div>
          <span className="text-[9px] font-black text-white/20 tracking-[0.2em] uppercase">V 4.0.0 Stable Cloud (Supabase)</span>
        </div>
      </div>
    </div>
  );
}
