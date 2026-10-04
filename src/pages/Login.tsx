import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { SupabaseService } from '../lib/supabaseService';
import { GraduationCap, Loader2, Mail, Lock, LogIn, UserPlus, KeyRound, ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function Login() {
  const [activeTab, setActiveTab] = useState<'signin' | 'signup' | 'forgot'>('signin');
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

    const cleanEmail = email.trim().toLowerCase();

    try {
      if (activeTab === 'signin' || activeTab === 'signup') {
        // 1. Try custom DB login first (bypasses Supabase Auth rate limits entirely for pre-registered users!)
        const customUser = await SupabaseService.verifyCustomLogin(cleanEmail, password);
        if (customUser) {
          localStorage.setItem('docenty_custom_user', JSON.stringify(customUser));
          window.location.reload();
          return;
        }

        // 2. Fallback to Supabase Auth signInWithPassword
        const { error: signInErr } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: password,
        });

        if (!signInErr) {
          return;
        }

        if (activeTab === 'signup') {
          const { error: signUpErr, data } = await supabase.auth.signUp({
            email: cleanEmail,
            password: password,
          });
          if (signUpErr) throw signUpErr;
          
          if (data?.session) {
            setSuccess('¡Cuenta registrada e iniciada con éxito!');
          } else {
            setSuccess('¡Cuenta creada! Ya puedes iniciar sesión con tu correo y contraseña.');
          }
        } else {
          throw signInErr;
        }
      } else if (activeTab === 'forgot') {
        if (!cleanEmail) {
          setError('Por favor introduce tu correo electrónico.');
          setIsLoading(false);
          return;
        }

        const { error: resetErr } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
          redirectTo: `${window.location.origin}`,
        });

        if (resetErr) throw resetErr;

        setSuccess(`¡Enlace enviado a ${cleanEmail}! Revisa tu bandeja de entrada (y la carpeta de spam o correo no deseado) para restablecer tu contraseña.`);
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      let errMsg = err.message || 'Error en el proceso de autenticación';
      
      if (errMsg.includes('rate limit exceeded') || errMsg.includes('rate_limit')) {
        errMsg = '⚠️ Has realizado demasiados intentos en poco tiempo. Sin embargo, si el administrador ya te registró en el panel, puedes iniciar sesión con tu contraseña o pedirle que verifique tus datos.';
      } else if (errMsg.includes('invalid claim') || errMsg.includes('Invalid login credentials') || errMsg.includes('invalid_credentials')) {
        errMsg = '❌ Correo o contraseña incorrectos. Verifica tus datos o usa la contraseña asignada por el administrador.';
      } else if (errMsg.includes('already registered') || errMsg.includes('already exists') || errMsg.includes('already_registered')) {
        errMsg = 'ℹ️ Este correo ya está registrado. Selecciona "Iniciar Sesión" e introduce tu contraseña.';
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

        {/* Tab Buttons (Hide tabs in 'forgot' view to keep interface clean) */}
        {activeTab !== 'forgot' ? (
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
        ) : (
          <div className="mb-6 text-left">
            <button
              type="button"
              onClick={() => { setActiveTab('signin'); setError(''); setSuccess(''); }}
              className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors mb-2"
            >
              <ArrowLeft size={14} />
              <span>Volver a Iniciar Sesión</span>
            </button>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <KeyRound size={16} className="text-futuristic-accent" />
              Recuperar Contraseña
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Introduce el correo de tu cuenta y te enviaremos un enlace seguro para crear una nueva clave.
            </p>
          </div>
        )}
        
        {error && (
          <div className="bg-red-500/10 text-red-400 border border-red-500/20 p-3.5 rounded-2xl mb-6 text-xs font-bold text-left">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-500/10 text-green-400 border border-green-500/20 p-3.5 rounded-2xl mb-6 text-xs font-bold text-left flex items-start gap-2">
            <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
            <span>{success}</span>
          </div>
        )}

        {/* Auth Form */}
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

          {activeTab !== 'forgot' && (
            <div className="relative text-left">
              <div className="flex items-center justify-between mb-1.5 px-1">
                <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">Contraseña</span>
                {activeTab === 'signin' && (
                  <button
                    type="button"
                    onClick={() => { setActiveTab('forgot'); setError(''); setSuccess(''); }}
                    className="text-[11px] text-futuristic-accent hover:underline font-semibold transition-colors"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                )}
              </div>
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
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-futuristic-purple to-futuristic-accent text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:opacity-90 active:scale-[0.99] transition-all flex items-center justify-center gap-3 shadow-xl disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-white" />
            ) : activeTab === 'signin' ? (
              'Ingresar al Panel'
            ) : activeTab === 'signup' ? (
              'Crear Cuenta'
            ) : (
              'Enviar Enlace de Recuperación'
            )}
          </button>
        </form>
        
        {activeTab === 'forgot' && (
          <button
            type="button"
            onClick={() => { setActiveTab('signin'); setError(''); setSuccess(''); }}
            className="text-xs text-slate-400 hover:text-white transition-colors"
          >
            ← Regresar a la pantalla de inicio de sesión
          </button>
        )}

        <div className="mt-8 flex items-center justify-center gap-3">
          <div className="w-1.5 h-1.5 rounded-full bg-futuristic-accent animate-pulse"></div>
          <span className="text-[9px] font-black text-white/20 tracking-[0.2em] uppercase">V 4.0.0 Stable Cloud (Supabase)</span>
        </div>
      </div>
    </div>
  );
}
