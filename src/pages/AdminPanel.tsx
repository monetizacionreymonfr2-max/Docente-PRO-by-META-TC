import { useState, useEffect } from 'react';
import { collection, setDoc, doc, query, orderBy, serverTimestamp, updateDoc, deleteDoc, writeBatch, getDoc, getDocs, limit } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { 
  Ticket, 
  CheckCircle2, 
  Copy, 
  History, 
  Loader2, 
  Wand2, 
  CalendarDays, 
  RefreshCw, 
  Trash2, 
  Plus, 
  Minus, 
  Lock, 
  ShieldAlert,
  Users,
  Search,
  UserPlus,
  Shield,
  UserCheck,
  UserX,
  Sparkles,
  Eye
} from 'lucide-react';

interface Code {
  id: string;
  status: 'disponible' | 'usado';
  access_level: 'guest' | 'pro';
  usedBy?: string;
  usedByEmail?: string;
  expiresAt?: any;
  createdAt: any;
  usedAt?: any;
}

interface ProfileUser {
  id: string; // auth uid or email for pre-registered
  email: string;
  isActive: boolean;
  role: 'admin' | 'teacher';
  generationsCount: number;
  access_level?: 'guest' | 'pro';
  activationCode?: string;
  expiresAt?: any;
  createdAt?: any;
}

const ADMIN_EMAILS = ['monetizacionreymonfr2@gmail.com', 'Tecnomundo235@gmail.com'];

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState<'licencias' | 'usuarios' | 'blacklist'>('licencias');
  
  // Codes states
  const [codes, setCodes] = useState<Code[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState<string | false>(false);
  const [hasLoadedCodes, setHasLoadedCodes] = useState(false);

  // Users states
  const [users, setUsers] = useState<ProfileUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [hasLoadedUsers, setHasLoadedUsers] = useState(false);

  // Manual User Creation states
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'teacher'>('teacher');
  const [newAccessLevel, setNewAccessLevel] = useState<'guest' | 'pro'>('pro');
  const [newIsActive, setNewIsActive] = useState(true);
  const [newDurationDays, setNewDurationDays] = useState('30');
  const [isAddingUser, setIsAddingUser] = useState(false);

  // Blacklist states
  const [bannedEmails, setBannedEmails] = useState<{ id: string; email: string; createdAt?: any; bannedBy?: string }[]>([]);
  const [blacklistLoading, setBlacklistLoading] = useState(false);
  const [bannedSearchQuery, setBannedSearchQuery] = useState('');
  const [banEmailInput, setBanEmailInput] = useState('');
  const [isBanning, setIsBanning] = useState(false);
  const [hasLoadedBlacklist, setHasLoadedBlacklist] = useState(false);

  const [currentUser, setCurrentUser] = useState<User | null>(auth.currentUser);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  const currentUserEmail = currentUser?.email;
  const isCurrentAdmin = currentUserEmail ? ADMIN_EMAILS.includes(currentUserEmail) : false;

  const fetchCodes = async () => {
    if (!isCurrentAdmin) return;
    setIsLoading(true);
    setErrorMsg(null);
    try {
      // Limit to 300 to avoid reading large volumes
      const q = query(collection(db, 'activation_codes'), limit(300));
      const snapshot = await getDocs(q);
      const codesData: Code[] = [];
      snapshot.forEach((doc) => {
        codesData.push({ id: doc.id, ...doc.data() } as Code);
      });
      
      codesData.sort((a, b) => {
        const getTime = (val: any) => {
          if (!val) return 0;
          if (val.toMillis) return val.toMillis();
          if (val.seconds) return val.seconds * 1000;
          if (val instanceof Date) return val.getTime();
          if (typeof val === 'number') return val;
          const d = new Date(val);
          return isNaN(d.getTime()) ? 0 : d.getTime();
        };
        return getTime(b.createdAt) - getTime(a.createdAt);
      });
      setCodes(codesData);
      setHasLoadedCodes(true);
    } catch (error: any) {
      console.error("Error fetching activation codes:", error);
      setErrorMsg(`Error al obtener códigos: ${error?.message || error}`);
      try {
        handleFirestoreError(error, OperationType.LIST, 'activation_codes');
      } catch (e) {}
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUsersProfile = async () => {
    if (!isCurrentAdmin) return;
    setUsersLoading(true);
    setErrorMsg(null);
    try {
      const q = query(collection(db, 'users'), limit(300));
      const snapshot = await getDocs(q);
      const usersData: ProfileUser[] = [];
      snapshot.forEach((doc) => {
        usersData.push({ id: doc.id, ...doc.data() } as ProfileUser);
      });
      
      usersData.sort((a, b) => {
        const emailA = a.email || '';
        const emailB = b.email || '';
        return emailA.localeCompare(emailB);
      });
      setUsers(usersData);
      setHasLoadedUsers(true);
    } catch (error: any) {
      console.error("Error fetching users list:", error);
      setErrorMsg(`Error al obtener usuarios: ${error?.message || error}`);
    } finally {
      setUsersLoading(false);
    }
  };

  const fetchBlacklist = async () => {
    if (!isCurrentAdmin) return;
    setBlacklistLoading(true);
    setErrorMsg(null);
    try {
      const q = query(collection(db, 'blacklist'), limit(300));
      const snapshot = await getDocs(q);
      const banned: any[] = [];
      snapshot.forEach((doc) => {
        banned.push({ id: doc.id, ...doc.data() });
      });
      banned.sort((a, b) => (a.email || '').localeCompare(b.email || ''));
      setBannedEmails(banned);
      setHasLoadedBlacklist(true);
    } catch (error: any) {
      console.error("Error fetching blacklist collection:", error);
      setErrorMsg(`Error al obtener lista negra: ${error?.message || error}`);
    } finally {
      setBlacklistLoading(false);
    }
  };

  // Auto-ban ugax6060@gmail.com whenever admin opens their page
  useEffect(() => {
    if (isCurrentAdmin) {
      const checkAndBan = async () => {
        try {
          const docRef = doc(db, 'blacklist', 'ugax6060@gmail.com');
          const docSnap = await getDoc(docRef);
          if (!docSnap.exists()) {
            await setDoc(docRef, {
              email: 'ugax6060@gmail.com',
              createdAt: serverTimestamp(),
              bannedBy: 'sistema_auto_proteccion'
            });
            console.log("Auto-ban de ugax6060@gmail.com ejecutado satisfactoriamente.");
          }
        } catch (e) {
          console.error("Error in redundancy auto-ban:", e);
        }
      };
      checkAndBan();
    }
  }, [isCurrentAdmin]);

  // Fetch Activation Codes when activeTab changes to 'licencias' or initial mount
  useEffect(() => {
    if (isCurrentAdmin && activeTab === 'licencias') {
      fetchCodes();
    }
  }, [isCurrentAdmin, activeTab]);

  // Fetch Users Profiles when activeTab changes to 'usuarios'
  useEffect(() => {
    if (isCurrentAdmin && activeTab === 'usuarios') {
      fetchUsersProfile();
    }
  }, [isCurrentAdmin, activeTab]);

  // Fetch Blacklist when activeTab changes to 'blacklist'
  useEffect(() => {
    if (isCurrentAdmin && activeTab === 'blacklist') {
      fetchBlacklist();
    }
  }, [isCurrentAdmin, activeTab]);

  const handleBanEmail = async (emailToBanStr: string) => {
    const cleanMail = emailToBanStr.trim().toLowerCase();
    if (!cleanMail || !cleanMail.includes('@')) {
      alert("Ingrese una dirección de correo válida para bloquear.");
      return;
    }

    if (ADMIN_EMAILS.includes(cleanMail)) {
      alert("⚠️ Error de Seguridad: No puedes añadir un administrador maestro a la lista negra.");
      return;
    }

    setIsBanning(true);
    try {
      // 1. Write the document to blacklist
      await setDoc(doc(db, 'blacklist', cleanMail), {
        email: cleanMail,
        createdAt: serverTimestamp(),
        bannedBy: auth.currentUser?.email || 'admin'
      });

      // 2. Locate any active user inside 'users' collection and suspend them
      const matchingUser = users.find(u => (u.email || '').toLowerCase() === cleanMail);
      if (matchingUser) {
        await updateDoc(doc(db, 'users', matchingUser.id), {
          isActive: false
        });
      }

      alert(`¡La cuenta ${cleanMail} ha sido agregada a la lista negra y sus privilegios han sido revocados!`);
      setBanEmailInput('');
      fetchBlacklist();
      fetchUsersProfile();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `blacklist/${cleanMail}`);
    } finally {
      setIsBanning(false);
    }
  };

  const handleUnbanEmail = async (bannedMailId: string) => {
    const confirmAction = window.confirm(`¿Seguro que deseas eliminar el correo ${bannedMailId} de la lista negra para restituir su acceso?`);
    if (!confirmAction) return;

    try {
      await deleteDoc(doc(db, 'blacklist', bannedMailId));
      alert(`¡Correo ${bannedMailId} desbloqueado exitosamente!`);
      fetchBlacklist();
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `blacklist/${bannedMailId}`);
    }
  };

  // Code Generation logic
  const generateCode = async (level: 'guest' | 'pro') => {
    setIsGenerating(level);
    try {
      const randomPart = () => Math.random().toString(36).substring(2, 6).toUpperCase();
      const codeId = `META-${randomPart()}-${randomPart()}`;
      
      await setDoc(doc(db, 'activation_codes', codeId), {
        code: codeId,
        status: 'disponible',
        access_level: level,
        createdAt: serverTimestamp()
      });
      alert(`Código ${codeId} generado exitosamente!`);
      fetchCodes();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'activation_codes');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert(`Código ${text} copiado!`);
  };

  const handleRenew = async (code: Code) => {
    await handleAdjustDays(code, 30);
  };

  const handleAdjustDays = async (code: Code, days: number) => {
    if (!code.usedBy || !code.expiresAt) return;
    
    const action = days > 0 ? 'sumar' : 'quitar';
    const confirmAction = window.confirm(`¿Seguro que deseas ${action} ${Math.abs(days)} días a la suscripción de ${code.usedByEmail}?`);
    if (!confirmAction) return;

    try {
      let currentExpiration: Date;
      if (code.expiresAt?.toDate) {
        currentExpiration = code.expiresAt.toDate();
      } else if (code.expiresAt instanceof Date) {
        currentExpiration = code.expiresAt;
      } else if (code.expiresAt?.seconds) {
        currentExpiration = new Date(code.expiresAt.seconds * 1000);
      } else {
        currentExpiration = new Date(code.expiresAt);
      }

      if (isNaN(currentExpiration.getTime())) {
        throw new Error("Fecha de expiración inválida");
      }

      const newExpiration = new Date(currentExpiration.getTime() + (days * 24 * 60 * 60 * 1000));

      const batch = writeBatch(db);
      
      batch.update(doc(db, 'activation_codes', code.id), {
        expiresAt: newExpiration
      });

      batch.update(doc(db, 'users', code.usedBy), {
        expiresAt: newExpiration,
        isActive: newExpiration > new Date()
      });

      await batch.commit();
      alert(`¡Suscripción actualizada! Se han ${days > 0 ? 'sumado' : 'quitado'} ${Math.abs(days)} días.`);
      fetchCodes();
      fetchUsersProfile();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'activation_codes');
    }
  };

  const handleDeleteCode = async (code: Code) => {
    const message = code.status === 'usado' 
      ? `¿Seguro que deseas eliminar este código? El usuario ${code.usedByEmail} perderá el acceso premium inmediatamente.`
      : `¿Seguro que deseas eliminar este código disponible?`;
    
    if (!window.confirm(message)) return;

    try {
      const batch = writeBatch(db);

      if (code.status === 'usado' && code.usedBy) {
        batch.update(doc(db, 'users', code.usedBy), {
          isActive: false,
          expiresAt: null,
          activationCode: null
        });
      }

      batch.delete(doc(db, 'activation_codes', code.id));

      await batch.commit();
      alert('Código eliminado exitosamente.');
      fetchCodes();
      fetchUsersProfile();
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'activation_codes');
    }
  };

  // User Actions logic
  const handleToggleUserRole = async (user: ProfileUser) => {
    if (user.email === auth.currentUser?.email) {
      alert("No puedes rebajar tu propio rol de administrador por seguridad.");
      return;
    }

    const newRole = user.role === 'admin' ? 'teacher' : 'admin';
    const confirmAction = window.confirm(`¿Seguro que deseas cambiar el rol de ${user.email} a ${newRole === 'admin' ? 'Administrador' : 'Docente'}?`);
    if (!confirmAction) return;

    try {
      await updateDoc(doc(db, 'users', user.id), {
        role: newRole
      });
      alert(`¡Rol actualizado exitosamente para ${user.email}!`);
      fetchUsersProfile();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.id}`);
    }
  };

  const handleToggleUserActive = async (user: ProfileUser) => {
    if (user.email === auth.currentUser?.email) {
      alert("No puedes suspender tu propia cuenta.");
      return;
    }

    const newIsActive = !user.isActive;
    const confirmAction = window.confirm(`¿Seguro que deseas ${newIsActive ? 'ACTIVAR' : 'SUSPENDER'} el acceso de ${user.email}?`);
    if (!confirmAction) return;

    try {
      await updateDoc(doc(db, 'users', user.id), {
        isActive: newIsActive
      });
      alert(`Acceso de usuario modificado a ${newIsActive ? 'ACTIVO' : 'SUSPENDIDO'}.`);
      fetchUsersProfile();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.id}`);
    }
  };

  const handleToggleUserAccessLevel = async (user: ProfileUser) => {
    const newLevel = user.access_level === 'guest' ? 'pro' : 'guest';
    const confirmAction = window.confirm(`¿Seguro que deseas cambiar el nivel de access de ${user.email} a ${newLevel.toUpperCase()}?`);
    if (!confirmAction) return;

    try {
      await updateDoc(doc(db, 'users', user.id), {
        access_level: newLevel
      });
      alert(`Nivel de acceso configurado a ${newLevel.toUpperCase()} para ${user.email}.`);
      fetchUsersProfile();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.id}`);
    }
  };

  const handleAdjustUserDays = async (user: ProfileUser, days: number) => {
    const action = days > 0 ? 'sumar' : 'quitar';
    const confirmAction = window.confirm(`¿Seguro que deseas ${action} ${Math.abs(days)} días a la suscripción de ${user.email}?`);
    if (!confirmAction) return;

    try {
      let currentExpiration: Date;
      if (user.expiresAt?.toDate) {
        currentExpiration = user.expiresAt.toDate();
      } else if (user.expiresAt instanceof Date) {
        currentExpiration = user.expiresAt;
      } else if (user.expiresAt?.seconds) {
        currentExpiration = new Date(user.expiresAt.seconds * 1000);
      } else if (user.expiresAt) {
        currentExpiration = new Date(user.expiresAt);
      } else {
        currentExpiration = new Date();
      }

      if (isNaN(currentExpiration.getTime())) {
        currentExpiration = new Date();
      }

      const newExpiration = new Date(currentExpiration.getTime() + (days * 24 * 60 * 60 * 1000));

      await updateDoc(doc(db, 'users', user.id), {
        expiresAt: newExpiration,
        isActive: newExpiration > new Date()
      });
      alert(`Suscripción actualizada para ${user.email}.`);
      fetchUsersProfile();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.id}`);
    }
  };

  const handleSetUserInfinite = async (user: ProfileUser) => {
    const confirmAction = window.confirm(`¿Seguro que deseas otorgar ACCESO INFINITO/VITALICIO a ${user.email}? Se mantendrá siempre activo.`);
    if (!confirmAction) return;

    try {
      // 100 years into the future
      const infiniteDate = new Date();
      infiniteDate.setFullYear(infiniteDate.getFullYear() + 100);

      await updateDoc(doc(db, 'users', user.id), {
        expiresAt: infiniteDate,
        isActive: true,
        access_level: 'pro'
      });
      alert(`Acceso vitalicio concedido a ${user.email}.`);
      fetchUsersProfile();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.id}`);
    }
  };

  const handleDeleteUser = async (user: ProfileUser) => {
    if (user.email === auth.currentUser?.email) {
      alert("No puedes eliminar tu propia cuenta de administrador.");
      return;
    }

    const confirmAction = window.confirm(`⚠️ ADVERTENCIA DE SEGURIDAD ⚠️\n\n¿Seguro que deseas eliminar el perfil de ${user.email}?\nEsta acción es irreversible y revoca instantáneamente su acceso a los listados de estudiantes, planificaciones y bitácoras.`);
    if (!confirmAction) return;

    try {
      await deleteDoc(doc(db, 'users', user.id));
      alert(`Perfil de usuario ${user.email} eliminado exitosamente de la base de datos.`);
      fetchUsersProfile();
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${user.id}`);
    }
  };

  const handlePreRegisterUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanMail = newEmail.trim().toLowerCase();
    
    if (!cleanMail || !cleanMail.includes('@')) {
      alert("Ingrese una dirección de correo válida.");
      return;
    }

    // Check conflict
    const userConflict = users.some(u => u.email.toLowerCase() === cleanMail);
    if (userConflict) {
      alert(`El correo ${cleanMail} ya está registrado en la base de datos.`);
      return;
    }

    setIsAddingUser(true);
    try {
      let expiresAt: Date | null = null;
      if (newDurationDays !== 'infinite') {
        const days = parseInt(newDurationDays, 10);
        expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + days);
      } else {
        expiresAt = new Date();
        expiresAt.setFullYear(expiresAt.getFullYear() + 100);
      }

      await setDoc(doc(db, 'users', cleanMail), {
        email: cleanMail,
        role: newRole,
        access_level: newAccessLevel,
        isActive: newIsActive,
        generationsCount: 0,
        expiresAt: expiresAt,
        createdAt: serverTimestamp()
      });

      alert(`Se ha pre-aprobado / añadido el acceso para: ${cleanMail}.\nCuando inicie sesión con este correo, el sistema auto-activará su suscripción como ${newAccessLevel.toUpperCase()} inmediatamente.`);
      fetchUsersProfile();
      setNewEmail('');
      setNewRole('teacher');
      setNewAccessLevel('pro');
      setNewIsActive(true);
      setNewDurationDays('30');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `users/${cleanMail}`);
    } finally {
      setIsAddingUser(false);
    }
  };

  const calculateDaysLeft = (expiresAt: any) => {
    if (!expiresAt) return 0;
    try {
      const now = new Date();
      let expiration: Date;
      
      if (expiresAt?.toDate) {
        expiration = expiresAt.toDate();
      } else if (expiresAt instanceof Date) {
        expiration = expiresAt;
      } else if (expiresAt?.seconds) {
        expiration = new Date(expiresAt.seconds * 1000);
      } else {
        expiration = new Date(expiresAt);
      }

      if (isNaN(expiration.getTime())) return 0;

      const diffTime = expiration.getTime() - now.getTime();
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    } catch (e) {
      console.error("Error calculating days left:", e);
      return 0;
    }
  };

  const getExpirationBadge = (expiresAt: any) => {
    if (!expiresAt) return <span className="text-gray-400">Sin límite</span>;
    const days = calculateDaysLeft(expiresAt);
    if (days > 10000) return <span className="bg-purple-100 text-purple-700 font-bold px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wider">Vitalicio</span>;
    if (days <= 0) return <span className="bg-red-100 text-red-700 font-bold px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wider">Vencido</span>;
    return <span className="bg-sky-100 text-sky-700 font-bold px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wider">{days} días restan</span>;
  };

  const filteredUsers = users.filter(usr => {
    if (!searchQuery) return true;
    const lowerQuery = searchQuery.toLowerCase();
    return (usr.email || '').toLowerCase().includes(lowerQuery) || (usr.id || '').toLowerCase().includes(lowerQuery);
  });

  if (!isCurrentAdmin) {
    return (
      <div className="max-w-md mx-auto my-12 bg-black/40 backdrop-blur-md rounded-3xl border border-red-500/30 p-8 text-center shadow-2xl">
        <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-500 mx-auto mb-6 border border-red-500/20">
          <Lock size={32} />
        </div>
        <h2 className="text-2xl font-black text-white tracking-tight uppercase">Acceso Denegado</h2>
        <p className="text-red-300 font-medium text-xs tracking-wider uppercase mt-2">Error de Autenticación de Administrador</p>
        <p className="text-slate-300 mt-4 text-sm leading-relaxed">
          Tu cuenta (<span className="font-semibold text-white">{currentUserEmail || 'invitado'}</span>) no posee credenciales administrativas habilitadas. 
          Este intento de acceso ha sido bloqueado y registrado por razones de seguridad.
        </p>
        <div className="mt-8 border-t border-white/5 pt-6 flex items-center justify-center gap-2 text-[10px] text-slate-500 font-mono">
          <ShieldAlert size={12} className="text-red-500" />
          <span>SISTEMA DE SEGURIDAD DOCENTE PRO x META TC</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
            Administración <span className="text-blue-400">Docenty PRO</span>
            <span className="bg-blue-600/10 text-blue-400 border border-blue-500/20 text-xs py-1 px-3 rounded-full font-bold uppercase tracking-widest">
              Master Access
            </span>
          </h1>
          <p className="text-slate-300 mt-1 font-medium italic">Consola de control global para licencias y cuentas de usuario.</p>
        </div>
        
        <button
          onClick={() => {
            if (activeTab === 'licencias') fetchCodes();
            else if (activeTab === 'usuarios') fetchUsersProfile();
            else if (activeTab === 'blacklist') fetchBlacklist();
          }}
          className="bg-white/10 hover:bg-white/15 text-white border border-white/10 font-bold py-2.5 px-4 rounded-xl flex items-center gap-2 transition-all text-xs uppercase tracking-wider active:scale-95 shrink-0"
        >
          <RefreshCw size={14} className={(activeTab === 'licencias' ? isLoading : activeTab === 'usuarios' ? usersLoading : blacklistLoading) ? "animate-spin" : ""} />
          Sincronizar
        </button>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-900/40 p-1 rounded-2xl border border-white/5 gap-2 max-w-lg">
        <button
          onClick={() => setActiveTab('licencias')}
          className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
            activeTab === 'licencias' 
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Ticket size={16} />
          Códigos de Licencia
        </button>
        <button
          onClick={() => setActiveTab('usuarios')}
          className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
            activeTab === 'usuarios' 
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Users size={16} />
          Gestión de Usuarios
        </button>
        <button
          onClick={() => setActiveTab('blacklist')}
          className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
            activeTab === 'blacklist' 
              ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/20' 
              : 'text-slate-400 hover:text-rose-400 hover:bg-rose-500/5'
          }`}
        >
          <ShieldAlert size={16} />
          Lista Negra / Bloqueos
        </button>
      </div>

      {errorMsg && (
        <div id="error-message-box" className="p-4 bg-red-500/10 border border-red-500/30 text-red-100 rounded-2xl flex items-start gap-3 animate-in fade-in duration-300">
          <ShieldAlert className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div className="text-xs">
            <p className="font-extrabold uppercase tracking-widest text-red-400 mb-1">Error de sincronización con Firestore</p>
            <p className="font-mono text-xs leading-relaxed text-red-300 break-all">{errorMsg}</p>
          </div>
        </div>
      )}
      {activeTab === 'licencias' && (
        <div className="space-y-8 animate-in fade-in duration-300">
          <div className="flex justify-end gap-3">
            <button
              onClick={() => generateCode('guest')}
              disabled={!!isGenerating}
              className="bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 px-6 rounded-2xl flex items-center gap-3 shadow-lg shadow-amber-500/20 active:scale-95 transition-all text-xs uppercase tracking-wider disabled:opacity-50"
            >
              {isGenerating === 'guest' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5" />}
              {isGenerating === 'guest' ? 'Generando...' : 'Código Invitado'}
            </button>
            <button
              onClick={() => generateCode('pro')}
              disabled={!!isGenerating}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-2xl flex items-center gap-3 shadow-lg shadow-blue-500/20 active:scale-95 transition-all text-xs uppercase tracking-wider disabled:opacity-50"
            >
              {isGenerating === 'pro' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5" />}
              {isGenerating === 'pro' ? 'Generando...' : 'Código PRO'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 shrink-0">
                <Ticket size={24} />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-600 uppercase tracking-widest leading-none mb-1">Total</p>
                <p className="text-2xl font-black text-gray-900">{hasLoadedCodes ? codes.length : '—'}</p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center text-green-600 shrink-0">
                <CheckCircle2 size={24} />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-600 uppercase tracking-widest leading-none mb-1">Disponibles</p>
                <p className="text-2xl font-black text-gray-900">{hasLoadedCodes ? codes.filter(c => c.status === 'disponible').length : '—'}</p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-600 shrink-0">
                <History size={24} />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-600 uppercase tracking-widest leading-none mb-1">Usados</p>
                <p className="text-2xl font-black text-gray-900">{hasLoadedCodes ? codes.filter(c => c.status === 'usado').length : '—'}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-8 py-6 border-b border-gray-50 bg-gray-50/50 flex items-center gap-2">
              <History size={20} className="text-gray-500" />
              <h2 className="font-black text-gray-900 uppercase tracking-tight text-sm">Registro de Códigos</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-xs font-black text-gray-500 uppercase tracking-[0.2em] border-b border-gray-50">
                    <th className="px-8 py-4">Código</th>
                    <th className="px-8 py-4">Nivel</th>
                    <th className="px-8 py-4">Estado</th>
                    <th className="px-8 py-4">Usuario</th>
                    <th className="px-8 py-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {isLoading ? (
                    <tr>
                      <td colSpan={5} className="px-8 py-12 text-center text-gray-500 font-medium font-sans">
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                          <span>Cargando códigos de activación...</span>
                        </div>
                      </td>
                    </tr>
                  ) : codes.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-8 py-12 text-center text-gray-500 font-medium">No hay códigos generados.</td>
                    </tr>
                  ) : (
                    codes.map((code) => (
                      <tr key={code.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-8 py-4 font-mono font-bold text-blue-900 tracking-widest">
                          {code.id}
                        </td>
                        <td className="px-8 py-4">
                          <span className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest ${
                            code.access_level === 'pro' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {code.access_level || 'pro'}
                          </span>
                        </td>
                        <td className="px-8 py-4">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                            code.status === 'disponible' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                          }`}>
                            {code.status}
                          </span>
                        </td>
                        <td className="px-8 py-4 text-xs font-medium text-gray-500 truncate max-w-[150px]">
                          {typeof code.usedByEmail === 'string' ? code.usedByEmail : 
                           typeof code.usedBy === 'string' ? code.usedBy : '---'}
                        </td>
                        <td className="px-8 py-4 text-right">
                          <div className="flex items-center justify-end gap-3">
                            {code.status === 'usado' && code.expiresAt && (
                              <div className="flex items-center gap-4">
                                <div className="flex flex-col items-end">
                                  <span className={`text-[10px] font-black uppercase tracking-widest ${
                                    (calculateDaysLeft(code.expiresAt) || 0) > 0 ? 'text-blue-600' : 'text-red-600'
                                  }`}>
                                    {(calculateDaysLeft(code.expiresAt) || 0) > 0 ? 'Quedan' : 'Expiró hace'}
                                  </span>
                                  <span className="text-xs font-bold text-gray-900">
                                    {Math.abs(calculateDaysLeft(code.expiresAt) || 0)} días
                                  </span>
                                </div>
                                <div className="flex items-center bg-gray-50 rounded-xl p-1 border border-gray-100">
                                  <button
                                    onClick={() => handleAdjustDays(code, -1)}
                                    className="p-1.5 text-red-500 hover:bg-white hover:shadow-sm rounded-lg transition-all"
                                    title="Quitar 1 día"
                                  >
                                    <Minus size={14} />
                                  </button>
                                  <div className="w-px h-4 bg-gray-200 mx-1" />
                                  <button
                                    onClick={() => handleAdjustDays(code, 1)}
                                    className="p-1.5 text-green-600 hover:bg-white hover:shadow-sm rounded-lg transition-all"
                                    title="Sumar 1 día"
                                  >
                                    <Plus size={14} />
                                  </button>
                                  <div className="w-px h-4 bg-gray-200 mx-1" />
                                  <button
                                    onClick={() => handleRenew(code)}
                                    className="p-1.5 text-blue-600 hover:bg-white hover:shadow-sm rounded-lg transition-all"
                                    title="Plan Mensual (+30 días)"
                                  >
                                    <RefreshCw size={14} />
                                  </button>
                                </div>
                              </div>
                            )}
                            {code.status === 'disponible' && (
                              <button 
                                onClick={() => copyToClipboard(code.id)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                                title="Copiar Código"
                              >
                                <Copy size={18} />
                              </button>
                            )}
                            <button 
                              onClick={() => handleDeleteCode(code)}
                              className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                              title="Eliminar Código"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: GESTION DE USUARIOS */}
      {activeTab === 'usuarios' && (
        <div className="space-y-8 animate-in fade-in duration-300">
          
          {/* Main Layout Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            
            {/* Form pre_register (Col 1) */}
            <div className="bg-slate-900/60 backdrop-blur-md rounded-3xl border border-white/5 p-6 space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600/10 border border-blue-500/20 rounded-xl flex items-center justify-center text-blue-400 shrink-0">
                  <UserPlus size={18} />
                </div>
                <div>
                  <h3 className="font-black text-white text-base">Añadir / Pre-Aprobar</h3>
                  <p className="text-slate-400 text-xs">Registra un email con acceso pre-configurado.</p>
                </div>
              </div>

              <form onSubmit={handlePreRegisterUserSubmit} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-2">Correo Electrónico</label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="email@ejemplo.com"
                    required
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-slate-200 placeholder-slate-600 text-sm focus:outline-none focus:border-blue-500 transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-2">Rol</label>
                    <select
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value as any)}
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-3 text-slate-200 text-xs focus:outline-none focus:border-blue-500 font-bold"
                    >
                      <option value="teacher">Docente (Teacher)</option>
                      <option value="admin">Administrador</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-2">Nivel</label>
                    <select
                      value={newAccessLevel}
                      onChange={(e) => setNewAccessLevel(e.target.value as any)}
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-3 text-slate-200 text-xs focus:outline-none focus:border-blue-500 font-bold"
                    >
                      <option value="pro">Docenty PRO</option>
                      <option value="guest">Invitado (Límitado)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-2">Estado</label>
                    <select
                      value={newIsActive ? 'true' : 'false'}
                      onChange={(e) => setNewIsActive(e.target.value === 'true')}
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-3 text-slate-200 text-xs focus:outline-none focus:border-blue-500 font-bold"
                    >
                      <option value="true">Activo</option>
                      <option value="false">Inactivo</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-2">Duración</label>
                    <select
                      value={newDurationDays}
                      onChange={(e) => setNewDurationDays(e.target.value)}
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-3 text-slate-200 text-xs focus:outline-none focus:border-blue-500 font-bold"
                    >
                      <option value="30">30 Días (1 Mes)</option>
                      <option value="90">90 Días (3 Meses)</option>
                      <option value="180">180 Días (Semestre)</option>
                      <option value="365">365 Días (1 Año)</option>
                      <option value="infinite">Vitalicio / Sin Límite</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isAddingUser}
                  className="w-full mt-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 border border-blue-500 shadow-xl shadow-blue-500/15 transition-all text-sm uppercase tracking-wider"
                >
                        Añadir Usuario
                </button>
              </form>
            </div>

            {/* User List Content (Col 2 & 3) */}
            <div className="lg:col-span-2 space-y-4">
              
              {/* Search bar and counter */}
              <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 bg-slate-900/40 border border-white/5 p-4 rounded-2xl">
                <div className="relative flex-1">
                  <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar usuarios por email o ID..."
                    className="w-full bg-slate-950 border border-white/5 rounded-xl pl-11 pr-4 py-2 text-slate-300 placeholder-slate-600 text-xs focus:outline-none focus:border-blue-500/50 transition-all font-mono"
                  />
                </div>
                <div className="text-slate-400 text-xs font-mono shrink-0 flex items-center gap-2">
                  <Users size={14} className="text-blue-400" />
                  <span>Encontrados: <b>{filteredUsers.length}</b> de <b>{users.length}</b></span>
                </div>
              </div>

              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="text-xs font-black text-gray-500 uppercase tracking-[0.2em] border-b border-gray-100 bg-gray-50/50">
                          <th className="px-6 py-4">Usuario</th>
                          <th className="px-6 py-4">Rol</th>
                          <th className="px-6 py-4">Estado</th>
                          <th className="px-6 py-4">Expiración</th>
                          <th className="px-6 py-4 text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {usersLoading ? (
                          <tr>
                            <td colSpan={5} className="px-6 py-12 text-center text-gray-500 font-medium">
                              <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto mb-2" />
                              Cargando base de datos de usuarios...
                            </td>
                          </tr>
                        ) : filteredUsers.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-6 py-12 text-center text-gray-500 font-medium">
                              No se encontraron registros de usuarios con esa búsqueda.
                            </td>
                          </tr>
                        ) : (
                          filteredUsers.map((usr) => {
                            const isSuperAdminUser = ADMIN_EMAILS.includes(usr.email || '');
                            const isPreRegistered = (usr.id === usr.email); // Our custom pre-reg mapping identifier!
                            
                            return (
                              <tr key={usr.id} className="hover:bg-gray-50/20 transition-colors">
                                <td className="px-6 py-4">
                                  <div className="flex flex-col">
                                    <span className="font-bold text-gray-900 text-sm break-all">{usr.email}</span>
                                    <span className="text-[10px] font-mono text-gray-400 flex items-center gap-1.5 mt-0.5">
                                      {isPreRegistered ? (
                                        <span className="bg-amber-50 text-amber-600 border border-amber-200/40 px-1.5 py-0.2 rounded text-[9px] font-bold">PRE-APROBADO</span>
                                      ) : (
                                        <span className="truncate max-w-[120px]" title={usr.id}>UID: {usr.id}</span>
                                      )}
                                      {usr.generationsCount > 0 && <span>• {usr.generationsCount} gen.</span>}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <button
                                    onClick={() => handleToggleUserRole(usr)}
                                    disabled={isSuperAdminUser}
                                    className={`px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 border transition-all ${
                                      usr.role === 'admin'
                                        ? 'bg-rose-50 text-rose-700 border-rose-100 hover:bg-rose-100'
                                        : 'bg-slate-50 text-slate-700 border-slate-100 hover:bg-slate-100'
                                    } ${isSuperAdminUser ? 'opacity-70 cursor-not-allowed' : ''}`}
                                    title={isSuperAdminUser ? "Super-Administrador Maestro (Fijo)" : "Click para alternar Rol"}
                                  >
                                    <Shield size={10} className={usr.role === 'admin' ? 'text-rose-500' : 'text-slate-400'} />
                                    {usr.role === 'admin' ? 'Administrador' : 'Docente'}
                                  </button>
                                </td>
                                <td className="px-6 py-4">
                                  <button
                                    onClick={() => handleToggleUserActive(usr)}
                                    disabled={isSuperAdminUser}
                                    className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 border transition-all ${
                                      usr.isActive
                                        ? 'bg-green-50 text-green-700 border border-green-100 hover:bg-green-100'
                                        : 'bg-red-50 text-red-600 border border-red-100 hover:bg-red-100'
                                    } ${isSuperAdminUser ? 'opacity-70 cursor-not-allowed' : ''}`}
                                    title={isSuperAdminUser ? "Acceso fijo garantizado" : "Click para cambiar habilitación"}
                                  >
                                    {usr.isActive ? <UserCheck size={11} className="text-green-500" /> : <UserX size={11} className="text-red-500" />}
                                    {usr.isActive ? 'Activo' : 'Suspendido'}
                                  </button>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="flex flex-col">
                                    {getExpirationBadge(usr.expiresAt)}
                                    <button
                                      onClick={() => handleToggleUserAccessLevel(usr)}
                                      className="text-[9px] text-left text-slate-500 underline hover:text-slate-900 mt-1 font-bold font-mono tracking-wider uppercase"
                                      title="Click para alternar Pro/Guest"
                                    >
                                      Nivel: {usr.access_level || 'pro'}
                                    </button>
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    {/* Subscription time managers */}
                                    <div className="flex items-center bg-gray-50 rounded-lg p-0.5 border border-gray-100">
                                      <button
                                        onClick={() => handleAdjustUserDays(usr, -1)}
                                        className="p-1 text-red-500 hover:bg-white hover:shadow-xs rounded transition-all"
                                        title="Quitar 1 día"
                                      >
                                        <Minus size={11} />
                                      </button>
                                      <button
                                        onClick={() => handleAdjustUserDays(usr, 1)}
                                        className="p-1 text-green-600 hover:bg-white hover:shadow-xs rounded transition-all"
                                        title="Sumar 1 día"
                                      >
                                        <Plus size={11} />
                                      </button>
                                      <button
                                        onClick={() => handleAdjustUserDays(usr, 30)}
                                        className="p-1 text-blue-600 hover:bg-white hover:shadow-xs rounded transition-all font-bold block"
                                        title="Añadir 30 Días (+1 mes)"
                                      >
                                        <RefreshCw size={11} />
                                      </button>
                                      <button
                                        onClick={() => handleSetUserInfinite(usr)}
                                        className="p-1 text-purple-600 hover:bg-white hover:shadow-xs rounded transition-all font-bold text-[9px] px-1"
                                        title="Conceder Licencia Vitalicia (Sin vencimiento)"
                                      >
                                        ∞
                                      </button>
                                    </div>

                                    <button
                                      onClick={() => handleDeleteUser(usr)}
                                      disabled={isSuperAdminUser}
                                      className={`p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all ${isSuperAdminUser ? 'opacity-30 cursor-not-allowed' : ''}`}
                                      title="Eliminar usuario de la base de datos"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

            </div>
          </div>

        </div>
      )}

      {/* VIEW 3: LISTA NEGRA */}
      {activeTab === 'blacklist' && (
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* Main Layout Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            
            {/* Form Ban Email (Col 1) */}
            <div className="bg-slate-900/60 backdrop-blur-md rounded-3xl border border-rose-500/10 p-6 space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-rose-600/10 border border-rose-500/20 rounded-xl flex items-center justify-center text-rose-400 shrink-0">
                  <UserX size={18} />
                </div>
                <div>
                  <h3 className="font-black text-white text-base">Bloquear Usuario</h3>
                  <p className="text-slate-400 text-xs">Añadir dirección de correo a la lista negra por seguridad.</p>
                </div>
              </div>

              <div className="bg-rose-500/5 rounded-2xl border border-rose-500/10 p-4 space-y-2">
                <p className="text-[10px] uppercase font-black tracking-widest text-rose-400">🚨 CONTROL DE ACCESO CRÍTICO</p>
                <p className="text-slate-300 text-xs leading-normal">
                  Cualquier correo listado aquí tendrá **denegado todo acceso** a la plataforma. 
                  Se cancelará su sesión de inmediato y sus privilegios de base de datos serán revocados permanentemente.
                </p>
              </div>

              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  handleBanEmail(banEmailInput);
                }} 
                className="space-y-4"
              >
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-2">Correo Electrónico a Bloquear</label>
                  <input
                    type="email"
                    value={banEmailInput}
                    onChange={(e) => setBanEmailInput(e.target.value)}
                    placeholder="ejemplo-intruso@gmail.com"
                    required
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-slate-200 placeholder-slate-600 text-sm focus:outline-none focus:border-rose-500 transition-all font-mono"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isBanning}
                  className="w-full mt-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 border border-rose-500 shadow-xl shadow-rose-500/15 transition-all text-sm uppercase tracking-wider"
                >
                  {isBanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldAlert size={16} />}
                  Bloquear de Inmediato
                </button>
              </form>
            </div>

            {/* Banned List Content (Col 2 & 3) */}
            <div className="lg:col-span-2 space-y-4">
              
              {/* Search bar and counter */}
              <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 bg-slate-900/40 border border-white/5 p-4 rounded-2xl">
                <div className="relative flex-1">
                  <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    value={bannedSearchQuery}
                    onChange={(e) => setBannedSearchQuery(e.target.value)}
                    placeholder="Buscar en la lista negra..."
                    className="w-full bg-slate-950 border border-white/5 rounded-xl pl-11 pr-4 py-2 text-slate-300 placeholder-slate-600 text-xs focus:outline-none focus:border-rose-500/50 transition-all font-mono"
                  />
                </div>
                <div className="text-slate-400 text-xs font-mono shrink-0 flex items-center gap-2">
                  <ShieldAlert size={14} className="text-rose-400" />
                  <span>Bloqueados: <b>{bannedEmails.filter(b => b.email.includes(bannedSearchQuery.toLowerCase())).length}</b></span>
                </div>
              </div>

              <div className="bg-white rounded-3xl border border-rose-100 shadow-sm overflow-hidden animate-in fade-in duration-300">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="text-xs font-black text-rose-500 uppercase tracking-[0.2em] border-b border-rose-500/10 bg-rose-50/20">
                          <th className="px-6 py-4">Correo Bloqueado</th>
                          <th className="px-6 py-4">Agregado el</th>
                          <th className="px-6 py-4">Por</th>
                          <th className="px-6 py-4 text-right">Acción</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {blacklistLoading ? (
                          <tr>
                            <td colSpan={4} className="px-6 py-12 text-center text-gray-500 font-medium">
                              <Loader2 className="w-6 h-6 animate-spin text-rose-600 mx-auto mb-2" />
                              Cargando base de datos de bloqueos...
                            </td>
                          </tr>
                        ) : bannedEmails.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="px-6 py-12 text-center text-gray-500 font-medium">
                              No hay ningún correo en la lista negra en este momento.
                            </td>
                          </tr>
                        ) : (
                          bannedEmails
                            .filter(b => b.email.includes(bannedSearchQuery.toLowerCase()))
                            .map((b) => {
                              const isAutoSeeded = b.email === 'ugax6060@gmail.com';
                              const banDate = b.createdAt?.toDate ? b.createdAt.toDate().toLocaleString() : 'Recientemente (Auto)';
                              
                              return (
                                <tr key={b.id} className="hover:bg-red-50/10 transition-colors">
                                  <td className="px-6 py-4">
                                    <div className="flex flex-col">
                                      <span className="font-extrabold text-red-600 text-sm font-mono break-all">{b.email}</span>
                                      {isAutoSeeded && (
                                        <span className="mt-1 bg-red-100 text-red-700 font-black border border-red-200 text-[8px] tracking-wider px-1.5 py-0.5 rounded uppercase self-start">
                                          Intruso Identificado (Auto-Bloqueado)
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 text-xs font-medium text-gray-500">
                                    {banDate}
                                  </td>
                                  <td className="px-6 py-4 text-xs text-gray-500 font-mono">
                                    {b.bannedBy || 'sistema'}
                                  </td>
                                  <td className="px-6 py-4 text-right">
                                    <button
                                      onClick={() => handleUnbanEmail(b.id)}
                                      className="px-3 py-1.5 text-xs font-black uppercase tracking-wider text-green-700 bg-green-50 hover:bg-green-100 border border-green-200/50 rounded-xl transition-all"
                                      title="Desbloquear correo electrónico"
                                    >
                                      Permitir Acceso
                                    </button>
                                  </td>
                                </tr>
                              );
                            })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

            </div>
          </div>

        </div>
      )}
    </div>
  );
}
