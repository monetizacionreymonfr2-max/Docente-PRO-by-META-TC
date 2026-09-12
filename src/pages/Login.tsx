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
      let errMsg = err.message || 'Error en el proceso de autenticación';
      
      if (errMsg.includes('rate limit exceeded') || errMsg.includes('rate_limit')) {
        errMsg = '⚠️ Has realizado demasiados intentos de registro en poco tiempo. Por seguridad de la plataforma, por favor espera unos 5-10 minutos antes de intentarlo de nuevo, o ponte en contacto con soporte técnico.';
      } else if (errMsg.includes('invalid claim') || errMsg.includes('Invalid login credentials') || errMsg.includes('invalid_credentials')) {
        errMsg = '❌ Correo o contraseña incorrectos. Verifica que hayas escrito tus datos correctamente e intenta de nuevo.';
      } else if (errMsg.includes('already registered') || errMsg.includes('already exists') || errMsg.includes('already_registered')) {
        errMsg = 'ℹ️ Este correo electrónico ya se encuentra registrado. Selecciona "Iniciar Sesión" arriba e introduce tu contraseña.';
      }
      
      setError(errMsg);
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
          <p className="text-[9px] font-black text-white/40 tracking-[0.3em] uppercase">By Reymon Castillo</p>
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
        
        <div className="mt-8 flex items-center justify-center gap-3">
          <div className="w-1.5 h-1.5 rounded-full bg-futuristic-accent animate-pulse"></div>
          <span className="text-[9px] font-black text-white/20 tracking-[0.2em] uppercase">V 4.0.0 Stable Cloud (Supabase)</span>
        </div>
      </div>
    </div>
  );
}
