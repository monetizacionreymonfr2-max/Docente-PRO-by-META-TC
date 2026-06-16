import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot, setDoc, serverTimestamp, getDoc, deleteDoc } from 'firebase/firestore';
import { auth, db } from './lib/firebase';
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
import AdminPanel from './pages/AdminPanel';
import Camila from './pages/Camila';
import ActivationModal from './components/ActivationModal';
import { Loader2, UserX } from 'lucide-react';

const ADMIN_EMAILS = ['monetizacionreymonfr2@gmail.com', 'Tecnomundo235@gmail.com'];
const isAdminEmail = (email: string | null | undefined) => email ? ADMIN_EMAILS.includes(email) : false;

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isBanned, setIsBanned] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Blacklist monitor
  useEffect(() => {
    if (!user || !user.email) {
      setIsBanned(false);
      return;
    }

    const emailKey = user.email.trim().toLowerCase();
    const isSupabase = localStorage.getItem('docenty_backend_provider') === 'supabase';

    if (isSupabase) {
      const checkBannedSupabase = async () => {
        try {
          const banned = await SupabaseService.isEmailBanned(emailKey);
          setIsBanned(banned);
        } catch (e) {
          console.error("Error checking banned email in Supabase:", e);
        }
      };
      checkBannedSupabase();
      const interval = setInterval(checkBannedSupabase, 8000); // Check every 8s
      return () => clearInterval(interval);
    }

    const blacklistRef = doc(db, 'blacklist', emailKey);

    const unsubscribeBanned = onSnapshot(blacklistRef, (snap) => {
      if (snap.exists()) {
        setIsBanned(true);
      } else {
        setIsBanned(false);
      }
    }, (err) => {
      console.warn("Blacklist subscription warning:", err);
    });

    return () => unsubscribeBanned();
  }, [user]);

  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;
    let fallbackPollInterval: any = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (authUser) => {
      // Clean up previous profile subscription if any
      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = null;
      }
      if (fallbackPollInterval) {
        clearInterval(fallbackPollInterval);
        fallbackPollInterval = null;
      }

      if (authUser) {
        setUser(authUser);
        const isSupabase = localStorage.getItem('docenty_backend_provider') === 'supabase';

        if (isSupabase) {
          // Supabase Engine Active for Profile Load
          const fetchAndSaveProfile = async () => {
            try {
              let prof = await SupabaseService.getUserProfile(authUser.uid);
              if (prof) {
                setProfile(prof);
              } else {
                const userEmail = (authUser.email || '').trim().toLowerCase();
                const defaultProfile = {
                  email: userEmail,
                  isActive: true,
                  role: isAdminEmail(userEmail) ? 'admin' : 'teacher',
                  generationsCount: 0,
                  access_level: 'pro',
                  activationCode: null,
                  expiresAt: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString()
                };
                await SupabaseService.createUserProfile(authUser.uid, defaultProfile);
                setProfile(defaultProfile);
              }
            } catch (err) {
              console.error("Supabase profile fetch error:", err);
            }
          };

          fetchAndSaveProfile();
          fallbackPollInterval = setInterval(fetchAndSaveProfile, 15000); // 15s refresh

          if (isAdminEmail(authUser.email)) {
            try {
              const banned = await SupabaseService.isEmailBanned('ugax6060@gmail.com');
              if (!banned) {
                await SupabaseService.banEmail('ugax6060@gmail.com', 'sistema_auto_proteccion');
                console.log("Auto-ban active on Supabase");
              }
            } catch (e) {
              console.error("Failed to auto ban intruder on Supabase", e);
            }
          }
          return;
        }

        // Security Shield: Auto-ban the target intruder if non-existent
        if (isAdminEmail(authUser.email)) {
          try {
            const blockRef = doc(db, 'blacklist', 'ugax6060@gmail.com');
            getDoc(blockRef).then(async (snap) => {
              if (!snap.exists()) {
                await setDoc(blockRef, {
                  email: 'ugax6060@gmail.com',
                  createdAt: serverTimestamp(),
                  bannedBy: 'sistema_auto_proteccion'
                });
                console.log("Auto-ban trigger for ugax6060@gmail.com executed.");
              }
            }).catch(e => console.error("Failed to fetch ban doc check:", e));
          } catch (e) {
            console.error("Failed to run active auto-blocking:", e);
          }
        }
        
        // Listen to User Profile in Firestore
        const userRef = doc(db, 'users', authUser.uid);
        
        unsubscribeProfile = onSnapshot(userRef, 
          async (docSnap) => {
            if (docSnap.exists()) {
              setProfile(docSnap.data());
            } else {
              // Create profile if missing. Check prepopulated email doc first
              try {
                let initialProfile: any = null;
                const userEmail = (authUser.email || '').trim().toLowerCase();
                const emailDocRef = doc(db, 'users', userEmail);
                const emailSnap = await getDoc(emailDocRef);
                
                if (emailSnap.exists()) {
                  const preConfig = emailSnap.data();
                  initialProfile = {
                    ...preConfig,
                    email: userEmail,
                    createdAt: preConfig.createdAt || serverTimestamp()
                  };
                  // Write to the actual uid and delete the temporary email document
                  await setDoc(userRef, initialProfile);
                  await deleteDoc(emailDocRef);
                } else {
                  initialProfile = {
                    email: userEmail,
                    isActive: isAdminEmail(authUser.email), // Admin is auto-active
                    role: isAdminEmail(authUser.email) ? 'admin' : 'teacher',
                    generationsCount: 0,
                    createdAt: serverTimestamp()
                  };
                  await setDoc(userRef, initialProfile);
                }
                // setProfile will be triggered by onSnapshot when setDoc completes
              } catch (error) {
                console.error("Error creating profile:", error);
              }
            }
            setIsLoading(false);
          },
          (error) => {
            console.error("Profile connection error:", error);
            setIsLoading(false); // Ensure loading stops even on error
          }
        );
      } else {
        setUser(null);
        setProfile(null);
        setIsLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
      if (fallbackPollInterval) clearInterval(fallbackPollInterval);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center hex-bg">
        <Loader2 className="w-8 h-8 animate-spin text-futuristic-accent" />
      </div>
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
              onClick={() => auth.signOut()}
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
      // Check if expired - handle both Timestamp and Date
      let expirationDate: Date;
      if (profile.expiresAt?.toDate) {
        expirationDate = profile.expiresAt.toDate();
      } else if (profile.expiresAt instanceof Date) {
        expirationDate = profile.expiresAt;
      } else if (profile.expiresAt?.seconds) {
        expirationDate = new Date(profile.expiresAt.seconds * 1000);
      } else {
        expirationDate = new Date(profile.expiresAt);
      }

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

  if (!isActive) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="*" element={<ActivationModal userId={user.uid} email={user.email} />} />
        </Routes>
      </BrowserRouter>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout isAdmin={isAdmin} accessLevel={accessLevel} codeId={codeId} generationsCount={generationsCount} teacherId={user.uid} expiresAt={expiresAt} />}>
          <Route index element={<Navigate to="/home" replace />} />
          <Route path="home" element={<Home />} />
          <Route path="earn-money" element={<EarnMoney />} />
          <Route path="students" element={<Students />} />
          <Route path="ppa" element={<PPA />} />
          <Route path="attendance" element={<Attendance />} />
          <Route path="planner" element={<Planner />} />
          <Route path="reports" element={<Reports />} />
          <Route path="maternal" element={<Maternal />} />
          <Route path="camila" element={<Camila />} />
          {isAdmin && <Route path="admin" element={<AdminPanel />} />}
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
