import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { SupabaseService } from './lib/supabaseService';
import Layout from './components/layout/Layout';
import Login from './pages/Login';
import Home from './pages/Home';
import EarnMoney from './pages/EarnMoney';
import Students from './pages/Students';
import PPA from './pages/PPA';
import Attendance from './pages/Attendance';
import Planner from './pages/Planner';
import Reports from './pages/Reports';
import Maternal from './pages/Maternal';
import EducacionEspecial from './pages/EducacionEspecial';
import AdminPanel from './pages/AdminPanel';
import Camila from './pages/Camila';
import MiFormato from './pages/MiFormato';
import CamilaFormato from './pages/CamilaFormato';
import { puedeVerMiFormato } from './config/features';
import ActivationModal from './components/ActivationModal';
import ResetPasswordModal from './components/ResetPasswordModal';
import { Loader2, UserX } from 'lucide-react';

const ADMIN_EMAILS = ['monetizacionreymonfr2@gmail.com', 'tecnomundo235@gmail.com'];
const isAdminEmail = (email: string | null | undefined) => email ? ADMIN_EMAILS.includes(email.trim().toLowerCase()) : false;

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isBanned, setIsBanned] = useState(false);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check URL hash and search params for recovery or errors on mount
  useEffect(() => {
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const hash = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : window.location.hash;
      const hashParams = new URLSearchParams(hash);

      const errorDesc = searchParams.get('error_description') || hashParams.get('error_description');
      if (errorDesc) {
        console.warn("Supabase Auth URL error:", errorDesc);
        // Clean URL to prevent repeated error messages
        if (window.history.replaceState) {
          window.history.replaceState(null, '', window.location.pathname);
        }
        alert(`Aviso de recuperación: ${decodeURIComponent(errorDesc.replace(/\+/g, ' '))}`);
      }

      if (
        (window.location.hash && window.location.hash.includes('type=recovery')) ||
        searchParams.get('type') === 'recovery'
      ) {
        setIsPasswordRecovery(true);
      }
    } catch (e) {
      console.error("Error parsing recovery parameters:", e);
    }
  }, []);

  // Load auth user and profile
  useEffect(() => {
    let authSubscription: any = null;

    const handleUserAuth = async (authUser: any) => {
      if (!authUser) {
        setUser(null);
        setProfile(null);
        setIsLoading(false);
        return;
      }

      setUser(authUser);
      const userEmail = (authUser.email || '').trim().toLowerCase();

      try {
        // 1. Check Blacklist
        const banned = await SupabaseService.isEmailBanned(userEmail);
        setIsBanned(banned);
        if (banned) {
          setIsLoading(false);
          return;
        }

        // 2. Load or Create User Profile
        let prof = await SupabaseService.getUserProfile(authUser.id, userEmail);
        if (prof) {
          setProfile(prof);
        } else {
          const defaultProfile = {
            email: userEmail,
            isActive: isAdminEmail(userEmail), // Admin is auto-active
            role: isAdminEmail(userEmail) ? 'admin' : 'teacher',
            generationsCount: 0,
            access_level: 'pro',
            activationCode: null,
            expiresAt: isAdminEmail(userEmail) ? new Date(Date.now() + 365 * 100 * 24 * 3600 * 1000).toISOString() : null
          };
          await SupabaseService.createUserProfile(authUser.id, defaultProfile);
          setProfile(defaultProfile);
        }

        // 3. Security Shield: Auto-ban intruder (ugax6060@gmail.com)
        if (isAdminEmail(userEmail)) {
          try {
            const blockCheck = await SupabaseService.isEmailBanned('ugax6060@gmail.com');
            if (!blockCheck) {
              await SupabaseService.banEmail('ugax6060@gmail.com', 'sistema_auto_proteccion');
              console.log("Auto-ban active on Supabase");
            }
          } catch (e) {
            console.error("Failed to auto ban intruder on Supabase", e);
          }
        }
      } catch (err) {
        console.error("Error fetching/saving profile in Supabase:", err);
      } finally {
        setIsLoading(false);
      }
    };

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsPasswordRecovery(true);
      }

      const authUser = session?.user || null;
      if (authUser) {
        handleUserAuth(authUser);
      } else {
        setUser(null);
        setProfile(null);
        setIsBanned(false);
        setIsLoading(false);
      }
    });

    authSubscription = subscription;

    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          await handleUserAuth(session.user);
        } else {
          setIsLoading(false);
        }
      } catch (err) {
        console.error("Error fetching initial session:", err);
        setIsLoading(false);
      }
    };

    getInitialSession();

    // Setup periodic profile refreshing (similar to snapshot)
    const refreshInterval = setInterval(async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        try {
          const prof = await SupabaseService.getUserProfile(session.user.id, session.user.email || '');
          if (prof) setProfile(prof);
          const banned = await SupabaseService.isEmailBanned(session.user.email || '');
          setIsBanned(banned);
        } catch (e) {
          console.warn("Periodic profile refresh failed:", e);
        }
      }
    }, 15000);

    return () => {
      if (authSubscription) {
        authSubscription.unsubscribe();
      }
      clearInterval(refreshInterval);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center hex-bg">
        <Loader2 className="w-8 h-8 animate-spin text-futuristic-accent" />
      </div>
    );
  }

  if (isPasswordRecovery) {
    return (
      <ResetPasswordModal
        onSuccess={() => {
          setIsPasswordRecovery(false);
          window.location.hash = '';
          if (window.history.replaceState) {
            window.history.replaceState(null, '', window.location.pathname);
          }
        }}
      />
    );
  }

  if (!user) {
    return <Login />;
  }

  if (isBanned) {
    return (
      <div className="min-h-screen flex items-center justify-center hex-bg p-4 text-center relative overflow-hidden">
        {/* Ambient Dark Red Glows */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-red-900/20 blur-[100px] rounded-full"></div>
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-red-900/10 blur-[100px] rounded-full"></div>
        
        <div className="glass-effect max-w-md w-full rounded-[2.5rem] border border-red-500/30 p-8 shadow-2xl relative z-10 neon-border-red">
          <div className="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center text-red-500 mx-auto mb-6 border border-red-500/20">
            <UserX size={40} className="drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]" />
          </div>
          
          <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic">
            Acceso <span className="text-red-500">Denegado</span>
          </h2>
          
          <div className="flex items-center justify-center gap-2 mt-1 mb-4">
            <div className="h-[1px] w-8 bg-gradient-to-r from-transparent to-red-500/30"></div>
            <p className="text-[10px] font-black text-red-400 tracking-[0.3em] uppercase">SISTEMA BLOQUEADO</p>
            <div className="h-[1px] w-8 bg-gradient-to-l from-transparent to-red-500/30"></div>
          </div>
          
          <p className="text-slate-300 mt-4 text-sm leading-relaxed">
            Tu cuenta (<span className="font-semibold text-white">{user?.email}</span>) ha sido bloqueada y suspendida permanentemente de la plataforma por violación de seguridad o términos de acceso.
          </p>
          
          <p className="text-slate-500 mt-3 text-xs">
            Esta acción de bloqueo se procesa en el cortafuegos principal. Si es un error, contacta a la administración.
          </p>
          
          <div className="mt-8">
            <button
              onClick={() => supabase.auth.signOut()}
              className="w-full bg-red-600/20 hover:bg-red-600/40 text-red-200 border border-red-500/30 font-black py-4 rounded-2xl text-xs uppercase tracking-widest transition-all shadow-lg shadow-red-950/50"
            >
              Cerrar Sesión (Salir)
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isAdmin = isAdminEmail(user?.email);
  
  // Subscription check: Must be active AND not expired (if teacher)
  const isSubscriptionValid = () => {
    if (isAdmin) return true;
    if (!profile?.isActive) return false;
    if (!profile?.expiresAt) return true; // Legacy or manual active without specific expiration
    
    try {
      const expirationDate = new Date(profile.expiresAt);
      if (isNaN(expirationDate.getTime())) return true;
      return new Date() < expirationDate;
    } catch (e) {
      console.error("Error checking subscription validity:", e);
      return true; // Default to active if error in parsing
    }
  };

  const isActive = isSubscriptionValid();
  const accessLevel = profile?.access_level || 'pro';
  const codeId = profile?.activationCode || '';
  const generationsCount = profile?.generationsCount || 0;
  const expiresAt = profile?.expiresAt;
  // El nombre solo se utiliza para personalizar el saludo; nunca para permisos.
  const teacherName = [profile?.nombre, user?.user_metadata?.full_name, user?.user_metadata?.name]
    .find((value) => typeof value === 'string' && value.trim().length > 0) || '';

  if (!isActive) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="*" element={<ActivationModal userId={user.id} email={user.email} />} />
        </Routes>
      </BrowserRouter>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout isAdmin={isAdmin} accessLevel={accessLevel} generationsCount={generationsCount} codeId={codeId} teacherId={user.id} teacherName={teacherName} expiresAt={expiresAt} />}>
          <Route index element={<Navigate to="/home" replace />} />
          <Route path="home" element={<Home />} />
          <Route path="earn-money" element={<EarnMoney />} />
          <Route path="students" element={<Students />} />
          <Route path="ppa" element={<PPA />} />
          <Route path="attendance" element={<Attendance />} />
          <Route path="planner" element={<Planner />} />
          <Route path="reports" element={<Reports />} />
          <Route path="maternal" element={<Maternal />} />
          <Route path="especial" element={<EducacionEspecial />} />
          <Route path="educacion-especial" element={<Navigate to="/especial" replace />} />
          <Route path="camila" element={<Camila />} />
          <Route path="mi-formato" element={puedeVerMiFormato(isAdmin) && accessLevel !== 'guest' ? <MiFormato /> : <Navigate to="/home" replace />} />
          <Route path="camila-formato" element={puedeVerMiFormato(isAdmin) && accessLevel !== 'guest' ? <CamilaFormato /> : <Navigate to="/home" replace />} />
          {isAdmin && <Route path="admin" element={<AdminPanel />} />}
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
