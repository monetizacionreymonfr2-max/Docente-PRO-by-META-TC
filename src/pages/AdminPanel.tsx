import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { SupabaseService } from '../lib/supabaseService';
import TimeAdjustmentModal, { TargetSubscription } from '../components/TimeAdjustmentModal';
import { 
  Ticket, 
  CheckCircle2, 
  Copy, 
  History, 
  Loader2, 
  Wand2, 
  CalendarDays, 
  Calendar,
  Clock,
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
  Check,
  KeyRound
} from 'lucide-react';

interface Code {
  id: string;
  status: 'disponible' | 'usado';
  access_level: 'guest' | 'pro';
  usedBy?: string;
  usedByEmail?: string;
  expiresAt?: any;
  createdAt: any;
}

interface ProfileUser {
  id: string;
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

  // Time Adjustment Modal state
  const [adjustTarget, setAdjustTarget] = useState<TargetSubscription | null>(null);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);

  const openAdjustModal = (target: TargetSubscription) => {
    setAdjustTarget(target);
    setIsAdjustModalOpen(true);
  };

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

  // Bulk User Creation states
  const [bulkEmailsInput, setBulkEmailsInput] = useState('');
  const [bulkDurationDays, setBulkDurationDays] = useState('30');
  const [bulkAccessLevel, setBulkAccessLevel] = useState<'guest' | 'pro'>('pro');
  const [bulkRole, setBulkRole] = useState<'admin' | 'teacher'>('teacher');
  const [isBulkAdding, setIsBulkAdding] = useState(false);

  // Blacklist states
  const [bannedEmails, setBannedEmails] = useState<{ id: string; email: string; createdAt?: any; bannedBy?: string }[]>([]);
  const [blacklistLoading, setBlacklistLoading] = useState(false);
  const [bannedSearchQuery, setBannedSearchQuery] = useState('');
  const [banEmailInput, setBanEmailInput] = useState('');
  const [isBanning, setIsBanning] = useState(false);
  const [hasLoadedBlacklist, setHasLoadedBlacklist] = useState(false);

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Load active session from Supabase
  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setCurrentUser(session?.user || null);
    };
    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user || null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const currentUserEmail = currentUser?.email;
  const isCurrentAdmin = currentUserEmail ? ADMIN_EMAILS.includes(currentUserEmail) : false;

  const fetchCodes = async () => {
    if (!isCurrentAdmin) return;
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const list = await SupabaseService.getActivationCodes();
      const codesData: Code[] = list.map(c => ({
        id: c.id,
        status: c.status,
        access_level: c.access_level,
        usedBy: c.usedBy || undefined,
        usedByEmail: c.usedByEmail || undefined,
        expiresAt: c.expiresAt,
        createdAt: c.createdAt
      }));
      setCodes(codesData);
      setHasLoadedCodes(true);
    } catch (error: any) {
      console.error("Error fetching activation codes:", error);
      setErrorMsg(`Error al obtener códigos: ${error?.message || error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUsersProfile = async () => {
    if (!isCurrentAdmin) return;
    setUsersLoading(true);
    setErrorMsg(null);
    try {
      const list = await SupabaseService.getUsersProfiles();
      const usersData: ProfileUser[] = list.map(u => ({
        id: u.id,
        email: u.email,
        isActive: u.isActive,
        role: u.role,
        generationsCount: u.generationsCount,
        access_level: u.access_level,
        activationCode: u.activationCode || undefined,
        expiresAt: u.expiresAt,
        createdAt: u.createdAt
      }));
      
      usersData.sort((a, b) => (a.email || '').localeCompare(b.email || ''));
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
      const list = await SupabaseService.getBlacklist();
      setBannedEmails(list);
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
          const blockCheck = await SupabaseService.isEmailBanned('ugax6060@gmail.com');
          if (!blockCheck) {
            await SupabaseService.banEmail('ugax6060@gmail.com', 'sistema_auto_proteccion');
            console.log("Auto-ban de ugax6060@gmail.com ejecutado satisfactoriamente.");
          }
        } catch (e) {
          console.error("Error in redundancy auto-ban:", e);
        }
      };
      checkAndBan();
    }
  }, [isCurrentAdmin]);

  // Fetch data when activeTab changes
  useEffect(() => {
    if (isCurrentAdmin) {
      if (activeTab === 'licencias') fetchCodes();
      else if (activeTab === 'usuarios') fetchUsersProfile();
      else if (activeTab === 'blacklist') fetchBlacklist();
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
      await SupabaseService.banEmail(cleanMail, currentUserEmail || 'admin');

      // Locate user and suspend them
      const matchingUser = users.find(u => (u.email || '').toLowerCase() === cleanMail);
      if (matchingUser) {
        await SupabaseService.updateProfileActive(matchingUser.id, false);
      }

      alert(`¡La cuenta ${cleanMail} ha sido agregada a la lista negra y sus privilegios han sido revocados!`);
      setBanEmailInput('');
      fetchBlacklist();
      fetchUsersProfile();
    } catch (error: any) {
      console.error("Error banning email:", error);
      alert(`Error: ${error?.message || error}`);
    } finally {
      setIsBanning(false);
    }
  };

  const handleUnbanEmail = async (bannedMailId: string) => {
    const confirmAction = window.confirm(`¿Seguro que deseas eliminar el correo ${bannedMailId} de la lista negra para restituir su acceso?`);
    if (!confirmAction) return;

    try {
      await SupabaseService.unbanEmail(bannedMailId);
      alert(`¡Correo ${bannedMailId} desbloqueado exitosamente!`);
      fetchBlacklist();
    } catch (error: any) {
      console.error("Error unbanning:", error);
      alert(`Error: ${error?.message || error}`);
    }
  };

  const generateCode = async (level: 'guest' | 'pro') => {
    setIsGenerating(level);
    try {
      const randomPart = () => Math.random().toString(36).substring(2, 6).toUpperCase();
      const codeId = `META-${randomPart()}-${randomPart()}`;
      
      await SupabaseService.generateCode(codeId, level);
      alert(`Código ${codeId} generado exitosamente!`);
      fetchCodes();
    } catch (error: any) {
      console.error("Error generating code:", error);
      alert(`Error: ${error?.message || error}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert(`Código ${text} copiado!`);
  };

  const copyDirectLoginLink = (user: ProfileUser) => {
    const loginLink = `${window.location.origin}/#auto_email=${encodeURIComponent(user.email)}&auto_pass=${encodeURIComponent((user as any).password || 'Docente2026*')}`;
    navigator.clipboard.writeText(loginLink);
    alert(`🔗 ¡Enlace de acceso directo copiado para ${user.email}!\n\nEnvíale este enlace al docente por WhatsApp. Al abrirlo, ingresará a su cuenta con un solo clic.`);
  };

  const handleRenew = async (code: Code) => {
    await handleAdjustDays(code, 30);
  };

  const handleAdjustDays = async (code: Code, days: number) => {
    const targetId = code.usedBy || code.id;
    const targetEmail = code.usedByEmail || '';
    const action = days > 0 ? 'sumar' : 'quitar';
    const confirmAction = window.confirm(`¿Seguro que deseas ${action} ${Math.abs(days)} días a la suscripción de ${targetEmail || code.id}?`);
    if (!confirmAction) return;

    try {
      await SupabaseService.updateProfileSubscription(
        targetId,
        days,
        code.expiresAt,
        code.id,
        targetEmail
      );
      alert(`¡Suscripción actualizada! Se han ${days > 0 ? 'sumado' : 'quitado'} ${Math.abs(days)} días.`);
      fetchCodes();
      fetchUsersProfile();
    } catch (error: any) {
      console.error("Error updating subscription:", error);
      alert(`Error: ${error?.message || error}`);
    }
  };

  const handleDeleteCode = async (code: Code) => {
    const message = code.status === 'usado' 
      ? `¿Seguro que deseas eliminar este código? El usuario ${code.usedByEmail} perderá el acceso premium inmediatamente.`
      : `¿Seguro que deseas eliminar este código disponible?`;
    
    if (!window.confirm(message)) return;

    try {
      if (code.status === 'usado' && code.usedBy) {
        await SupabaseService.updateProfileActive(code.usedBy, false);
      }
      await SupabaseService.deleteCode(code.id);
      alert('Código eliminado exitosamente.');
      fetchCodes();
      fetchUsersProfile();
    } catch (error: any) {
      console.error("Error deleting code:", error);
      alert(`Error: ${error?.message || error}`);
    }
  };

  const handleToggleUserRole = async (user: ProfileUser) => {
    if (user.email === currentUserEmail) {
      alert("No puedes rebajar tu propio rol de administrador por seguridad.");
      return;
    }

    const newRole = user.role === 'admin' ? 'teacher' : 'admin';
    const confirmAction = window.confirm(`¿Seguro que deseas cambiar el rol de ${user.email} a ${newRole === 'admin' ? 'Administrador' : 'Docente'}?`);
    if (!confirmAction) return;

    try {
      await SupabaseService.updateProfileRole(user.id, newRole);
      alert(`¡Rol actualizado exitosamente para ${user.email}!`);
      fetchUsersProfile();
    } catch (error: any) {
      console.error("Error toggling user role:", error);
      alert(`Error: ${error?.message || error}`);
    }
  };

  const handleToggleUserActive = async (user: ProfileUser) => {
    if (user.email === currentUserEmail) {
      alert("No puedes suspender tu propia cuenta.");
      return;
    }

    const newIsActive = !user.isActive;
    const confirmAction = window.confirm(`¿Seguro que deseas ${newIsActive ? 'ACTIVAR' : 'SUSPENDER'} el acceso de ${user.email}?`);
    if (!confirmAction) return;

    try {
      await SupabaseService.updateProfileActive(user.id, newIsActive);
      alert(`Acceso de usuario modificado a ${newIsActive ? 'ACTIVO' : 'SUSPENDIDO'}.`);
      fetchUsersProfile();
    } catch (error: any) {
      console.error("Error toggling active:", error);
      alert(`Error: ${error?.message || error}`);
    }
  };

  const handleToggleUserAccessLevel = async (user: ProfileUser) => {
    const newLevel: 'guest' | 'pro' = user.access_level === 'guest' ? 'pro' : 'guest';
    const confirmAction = window.confirm(`¿Seguro que deseas cambiar el nivel de access de ${user.email} a ${newLevel.toUpperCase()}?`);
    if (!confirmAction) return;

    try {
      await SupabaseService.updateProfileAccessLevel(user.id, newLevel);
      alert(`Nivel de acceso configurado a ${newLevel.toUpperCase()} para ${user.email}.`);
      fetchUsersProfile();
    } catch (error: any) {
      console.error("Error toggling access level:", error);
      alert(`Error: ${error?.message || error}`);
    }
  };

  const handleAdjustUserDays = async (user: ProfileUser, days: number) => {
    const action = days > 0 ? 'sumar' : 'quitar';
    const confirmAction = window.confirm(`¿Seguro que deseas ${action} ${Math.abs(days)} días a la suscripción de ${user.email}?`);
    if (!confirmAction) return;

    try {
      await SupabaseService.updateProfileSubscription(
        user.id,
        days,
        user.expiresAt,
        user.activationCode,
        user.email
      );
      alert(`Suscripción actualizada para ${user.email}.`);
      fetchUsersProfile();
      fetchCodes();
    } catch (error: any) {
      console.error("Error adjusting user days:", error);
      alert(`Error: ${error?.message || error}`);
    }
  };

  const handleSetUserInfinite = async (user: ProfileUser) => {
    const confirmAction = window.confirm(`¿Seguro que deseas otorgar ACCESO INFINITO/VITALICIO a ${user.email}? Se mantendrá siempre activo.`);
    if (!confirmAction) return;

    try {
      await SupabaseService.grantLifetimeAccess(user.id, user.activationCode, user.email);
      alert(`¡Acceso vitalicio concedido a ${user.email}!`);
      fetchUsersProfile();
      fetchCodes();
    } catch (error: any) {
      console.error("Error setting user infinite:", error);
      alert(`Error: ${error?.message || error}`);
    }
  };

  const handleDeleteUser = async (user: ProfileUser) => {
    if (user.email === currentUserEmail) {
      alert("No puedes eliminar tu propia cuenta de administrador.");
      return;
    }

    const confirmAction = window.confirm(`⚠️ ADVERTENCIA DE SEGURIDAD ⚠️\n\n¿Seguro que deseas eliminar el perfil de ${user.email}?\nEsta acción es irreversible y revoca instantáneamente su acceso.`);
    if (!confirmAction) return;

    try {
      await SupabaseService.deleteUserProfile(user.id);
      alert(`Perfil de usuario ${user.email} eliminado exitosamente de la base de datos.`);
      fetchUsersProfile();
    } catch (error: any) {
      console.error("Error deleting user:", error);
      alert(`Error: ${error?.message || error}`);
    }
  };

  const handleResetUserPassword = async (user: ProfileUser) => {
    const confirmAction = window.confirm(`¿Deseas enviar un enlace de restablecimiento de contraseña al correo de ${user.email}?`);
    if (!confirmAction) return;

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email.trim().toLowerCase(), {
        redirectTo: window.location.origin,
      });
      if (error) throw error;
      alert(`✅ ¡Enlace de recuperación enviado exitosamente a ${user.email}!\n\nEl usuario debe revisar su correo electrónico (bandeja principal o spam) para crear su nueva contraseña.`);
    } catch (error: any) {
      console.error("Error sending password reset email:", error);
      alert(`Error al enviar correo de recuperación: ${error?.message || error}`);
    }
  };

  const handlePreRegisterUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanMail = newEmail.trim().toLowerCase();
    
    if (!cleanMail || !cleanMail.includes('@')) {
      alert("Ingrese una dirección de correo válida.");
      return;
    }

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

      await SupabaseService.createUserProfile(cleanMail, {
        email: cleanMail,
        role: newRole,
        access_level: newAccessLevel,
        isActive: newIsActive,
        generationsCount: 0,
        expiresAt: expiresAt ? expiresAt.toISOString() : null
      });

      alert(`Se ha pre-aprobado / añadido el acceso para: ${cleanMail}.\nCuando inicie sesión con este correo, el sistema auto-activará su suscripción como ${newAccessLevel.toUpperCase()} inmediatamente.`);
      fetchUsersProfile();
      setNewEmail('');
      setNewRole('teacher');
      setNewAccessLevel('pro');
      setNewIsActive(true);
      setNewDurationDays('30');
    } catch (error: any) {
      console.error("Error pre-registering user:", error);
      alert(`Error: ${error?.message || error}`);
    } finally {
      setIsAddingUser(false);
    }
  };

  const handleBulkRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const lines = bulkEmailsInput.split('\n');
    const emails = lines.map(l => l.trim()).filter(l => l.includes('@'));

    if (emails.length === 0) {
      alert("Por favor introduce al menos un correo electrónico válido (uno por línea).");
      return;
    }

    const confirmAction = window.confirm(`¿Estás seguro de registrar/actualizar masivamente ${emails.length} usuarios con acceso ${bulkAccessLevel.toUpperCase()}?`);
    if (!confirmAction) return;

    setIsBulkAdding(true);
    try {
      let expiresAt: Date | null = null;
      if (bulkDurationDays !== 'infinite') {
        const days = parseInt(bulkDurationDays, 10);
        expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + days);
      } else {
        expiresAt = new Date();
        expiresAt.setFullYear(expiresAt.getFullYear() + 100);
      }

      const result = await SupabaseService.bulkCreateProfiles(emails, {
        role: bulkRole,
        access_level: bulkAccessLevel,
        is_active: true,
        expires_at: expiresAt ? expiresAt.toISOString() : null
      });

      let msg = `✅ ¡Creación masiva completada!\n\nUsuarios creados/actualizados exitosamente: ${result.successCount}`;
      if (result.errors.length > 0) {
        msg += `\n\n⚠️ Errores (${result.errors.length}):\n` + result.errors.slice(0, 5).join('\n');
      }
      alert(msg);
      setBulkEmailsInput('');
      fetchUsersProfile();
    } catch (error: any) {
      console.error("Error in bulk registration:", error);
      alert(`Error en lote: ${error?.message || error}`);
    } finally {
      setIsBulkAdding(false);
    }
  };

  const calculateDaysLeft = (expiresAt: any) => {
    if (!expiresAt) return 0;
    try {
      const now = new Date();
      const expiration = new Date(expiresAt);
      if (isNaN(expiration.getTime())) return 0;
      const diffTime = expiration.getTime() - now.getTime();
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    } catch (e) {
      console.error("Error calculating days left:", e);
      return 0;
    }
  };

  const formatExpirationDate = (expiresAt: any) => {
    if (!expiresAt) return null;
    try {
      const d = new Date(expiresAt);
      if (isNaN(d.getTime())) return null;
      return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return null;
    }
  };

  const getExpirationBadge = (expiresAt: any) => {
    if (!expiresAt) return <span className="text-gray-400 text-xs">Sin límite</span>;
    const days = calculateDaysLeft(expiresAt);
    const dateFormatted = formatExpirationDate(expiresAt);

    if (days > 10000) {
      return (
        <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-700 font-bold px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wider">
          Vitalicio
        </span>
      );
    }
    if (days <= 0) {
      return (
        <span 
          className="inline-flex items-center gap-1 bg-red-100 text-red-700 font-bold px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wider"
          title={dateFormatted ? `Expiró el ${dateFormatted}` : 'Vencido'}
        >
          Vencido ({Math.abs(days)}d)
        </span>
      );
    }
    return (
      <span 
        className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 font-bold px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wider"
        title={dateFormatted ? `Vence el ${dateFormatted}` : ''}
      >
        Quedan {days} días
      </span>
    );
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
          <p className="text-slate-300 mt-1 font-medium italic">Consola de control global de Supabase para licencias y cuentas de usuario.</p>
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
      <div className="flex flex-wrap bg-slate-900/40 p-1 rounded-2xl border border-white/5 gap-2 max-w-2xl">
        <button
          onClick={() => setActiveTab('licencias')}
          className={`flex-1 min-w-[140px] py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
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
          className={`flex-1 min-w-[140px] py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
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
          className={`flex-1 min-w-[140px] py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
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
            <p className="font-extrabold uppercase tracking-widest text-red-400 mb-1">Error de sincronización con la base de datos</p>
            <p className="font-mono text-xs leading-relaxed text-red-300 break-all">{errorMsg}</p>
          </div>
        </div>
      )}

      {/* VIEW 1: CODES */}
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
            <div className="px-6 sm:px-8 py-5 border-b border-gray-50 bg-gray-50/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History size={20} className="text-gray-500" />
                <h2 className="font-black text-gray-900 uppercase tracking-tight text-sm">Registro de Códigos</h2>
              </div>
              <span className="text-[11px] font-bold text-slate-500 bg-white border border-slate-200 px-3 py-1 rounded-full">
                {codes.length} Códigos Registrados
              </span>
            </div>

            {/* Mobile View: Cards (Visible only on mobile screens < md) */}
            <div className="block md:hidden p-4 space-y-3 bg-slate-50/60 divide-y divide-slate-100">
              {isLoading ? (
                <div className="py-12 text-center text-gray-500 flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                  <span>Cargando códigos de activación...</span>
                </div>
              ) : codes.length === 0 ? (
                <div className="py-12 text-center text-gray-500 font-medium">No hay códigos generados.</div>
              ) : (
                codes.map((code) => {
                  const isUsed = code.status === 'usado';
                  const daysLeft = code.expiresAt ? calculateDaysLeft(code.expiresAt) : null;
                  const isExp = daysLeft !== null && daysLeft <= 0;
                  const targetUser = code.usedByEmail || code.usedBy || 'Sin asignar';
                  
                  return (
                    <div key={code.id} className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-3 pt-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-sm text-blue-900 tracking-wider">
                            {code.id}
                          </span>
                          <button
                            onClick={() => copyToClipboard(code.id)}
                            className="p-1 text-slate-400 hover:text-blue-600 rounded-md transition-colors"
                            title="Copiar código"
                          >
                            <Copy size={14} />
                          </button>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                            code.access_level === 'pro' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {code.access_level || 'pro'}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                            code.status === 'disponible' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {code.status}
                          </span>
                        </div>
                      </div>

                      {/* Usuario info */}
                      {isUsed && (
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-400 font-medium text-[11px]">Usuario:</span>
                            <span className="font-bold text-slate-800 truncate max-w-[200px]">{targetUser}</span>
                          </div>
                          
                          {/* Contador de tiempo */}
                          <div className="flex items-center justify-between pt-1 border-t border-slate-200/50">
                            <span className="text-slate-400 font-medium text-[11px]">Vencimiento:</span>
                            <div className="text-right">
                              {code.expiresAt ? (
                                <>
                                  <span className={`text-xs font-black block ${isExp ? 'text-red-600' : 'text-blue-600'}`}>
                                    {isExp ? `VENCIDO (hace ${Math.abs(daysLeft || 0)}d)` : `QUEDAN ${daysLeft} DÍAS`}
                                  </span>
                                  {formatExpirationDate(code.expiresAt) && (
                                    <span className="text-[10px] text-slate-400 block">
                                      {formatExpirationDate(code.expiresAt)}
                                    </span>
                                  )}
                                </>
                              ) : (
                                <span className="text-xs text-slate-400 font-medium">Sin límite fijado</span>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Botones de acción en móvil */}
                      <div className="space-y-2 pt-1">
                        {isUsed && (
                          <>
                            <button
                              onClick={() => openAdjustModal({
                                id: code.usedBy || code.id,
                                email: code.usedByEmail,
                                codeId: code.id,
                                currentExpiresAt: code.expiresAt
                              })}
                              className="w-full py-2 px-3 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all active:scale-98"
                            >
                              <Clock size={14} className="text-blue-600" />
                              <span>Sumar Días o Meses (+Tiempo)</span>
                            </button>

                            <div className="flex items-center justify-between gap-1.5 pt-1">
                              <button
                                onClick={() => handleAdjustDays(code, 15)}
                                className="flex-1 py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-black border border-slate-200 transition-colors text-center"
                              >
                                +15d
                              </button>
                              <button
                                onClick={() => handleAdjustDays(code, 30)}
                                className="flex-1 py-1.5 px-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-black shadow-sm transition-colors text-center"
                              >
                                +30d (1m)
                              </button>
                              <button
                                onClick={() => handleAdjustDays(code, 60)}
                                className="flex-1 py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-black border border-slate-200 transition-colors text-center"
                              >
                                +60d (2m)
                              </button>
                              <button
                                onClick={() => handleAdjustDays(code, -1)}
                                className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg border border-slate-200"
                                title="Quitar 1 día"
                              >
                                <Minus size={12} />
                              </button>
                              <button
                                onClick={() => handleAdjustDays(code, 1)}
                                className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg border border-slate-200"
                                title="Sumar 1 día"
                              >
                                <Plus size={12} />
                              </button>
                            </div>
                          </>
                        )}

                        <div className="flex justify-end pt-1">
                          <button 
                            onClick={() => handleDeleteCode(code)}
                            className="px-2.5 py-1 text-red-400 hover:text-red-600 text-xs font-semibold flex items-center gap-1 transition-colors"
                          >
                            <Trash2 size={13} />
                            <span>Eliminar código</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Desktop View: Wide Table (Visible only on md screens and up) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-xs font-black text-gray-500 uppercase tracking-[0.2em] border-b border-gray-50">
                    <th className="px-6 py-4">Código</th>
                    <th className="px-6 py-4">Nivel</th>
                    <th className="px-6 py-4">Estado</th>
                    <th className="px-6 py-4">Usuario</th>
                    <th className="px-6 py-4">Tiempo Restante</th>
                    <th className="px-6 py-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="px-8 py-12 text-center text-gray-500 font-medium font-sans">
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                          <span>Cargando códigos de activación...</span>
                        </div>
                      </td>
                    </tr>
                  ) : codes.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-8 py-12 text-center text-gray-500 font-medium">No hay códigos generados.</td>
                    </tr>
                  ) : (
                    codes.map((code) => {
                      const days = code.expiresAt ? calculateDaysLeft(code.expiresAt) : null;
                      const isExp = days !== null && days <= 0;
                      
                      return (
                        <tr key={code.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4 font-mono font-bold text-blue-900 tracking-wider">
                            <div className="flex items-center gap-2">
                              <span>{code.id}</span>
                              <button
                                onClick={() => copyToClipboard(code.id)}
                                className="p-1 text-slate-400 hover:text-blue-600 rounded transition-colors"
                                title="Copiar código"
                              >
                                <Copy size={13} />
                              </button>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${
                              code.access_level === 'pro' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                            }`}>
                              {code.access_level || 'pro'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                              code.status === 'disponible' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                            }`}>
                              {code.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-xs font-medium text-gray-700 truncate max-w-[170px]">
                            {typeof code.usedByEmail === 'string' ? code.usedByEmail : 
                             typeof code.usedBy === 'string' ? code.usedBy : '---'}
                          </td>
                          <td className="px-6 py-4">
                            {code.status === 'usado' ? (
                              code.expiresAt ? (
                                <div className="flex flex-col">
                                  <span className={`text-xs font-black ${isExp ? 'text-red-600' : 'text-blue-600'}`}>
                                    {isExp ? `VENCIDO (${Math.abs(days || 0)}d)` : `QUEDAN ${days} DÍAS`}
                                  </span>
                                  {formatExpirationDate(code.expiresAt) && (
                                    <span className="text-[10px] text-slate-400">
                                      Vence: {formatExpirationDate(code.expiresAt)}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-xs text-gray-400 font-medium">Sin límite</span>
                              )
                            ) : (
                              <span className="text-xs text-gray-400 font-medium">No activado</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {code.status === 'usado' && (
                                <>
                                  <button
                                    onClick={() => openAdjustModal({
                                      id: code.usedBy || code.id,
                                      email: code.usedByEmail,
                                      codeId: code.id,
                                      currentExpiresAt: code.expiresAt
                                    })}
                                    className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/80 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-2xs hover:shadow-xs active:scale-95"
                                    title="Sumar días o meses exactos con cálculo automático"
                                  >
                                    <Clock size={13} className="text-blue-600" />
                                    <span>+ Tiempo</span>
                                  </button>

                                  <div className="flex items-center bg-gray-50 rounded-xl p-0.5 border border-gray-100">
                                    <button
                                      onClick={() => handleAdjustDays(code, 15)}
                                      className="px-1.5 py-1 text-slate-700 hover:bg-white hover:shadow-xs rounded-lg transition-all text-[10px] font-black"
                                      title="Sumar 15 días"
                                    >
                                      +15d
                                    </button>
                                    <div className="w-px h-3 bg-gray-200 mx-0.5" />
                                    <button
                                      onClick={() => handleAdjustDays(code, 30)}
                                      className="px-1.5 py-1 text-blue-600 hover:bg-white hover:shadow-xs rounded-lg transition-all text-[10px] font-black"
                                      title="Sumar 1 mes (30 días)"
                                    >
                                      +30d
                                    </button>
                                    <div className="w-px h-3 bg-gray-200 mx-0.5" />
                                    <button
                                      onClick={() => handleAdjustDays(code, -1)}
                                      className="p-1 text-red-500 hover:bg-white hover:shadow-xs rounded-lg transition-all"
                                      title="Quitar 1 día"
                                    >
                                      <Minus size={12} />
                                    </button>
                                    <div className="w-px h-3 bg-gray-200 mx-0.5" />
                                    <button
                                      onClick={() => handleAdjustDays(code, 1)}
                                      className="p-1 text-green-600 hover:bg-white hover:shadow-xs rounded-lg transition-all"
                                      title="Sumar 1 día"
                                    >
                                      <Plus size={12} />
                                    </button>
                                  </div>
                                </>
                              )}

                              <button 
                                onClick={() => handleDeleteCode(code)}
                                className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors ml-1"
                                title="Eliminar Código"
                              >
                                <Trash2 size={16} />
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
      )}

      {/* VIEW 2: GESTION DE USUARIOS */}
      {activeTab === 'usuarios' && (
        <div className="space-y-8 animate-in fade-in duration-300">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Pre-Register form */}
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
                    className="w-full bg-slate-950/50 border border-white/10 rounded-xl py-3 px-4 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors placeholder:text-slate-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-2">Rol de Usuario</label>
                    <select
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value as 'admin' | 'teacher')}
                      className="w-full bg-slate-950/50 border border-white/10 rounded-xl py-3 px-4 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                    >
                      <option value="teacher" className="bg-slate-900">Docente</option>
                      <option value="admin" className="bg-slate-900">Admin</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-2">Nivel de Acceso</label>
                    <select
                      value={newAccessLevel}
                      onChange={(e) => setNewAccessLevel(e.target.value as 'guest' | 'pro')}
                      className="w-full bg-slate-950/50 border border-white/10 rounded-xl py-3 px-4 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                    >
                      <option value="pro" className="bg-slate-900">PRO</option>
                      <option value="guest" className="bg-slate-900">Invitado</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-2">Estado</label>
                    <select
                      value={newIsActive ? 'activo' : 'suspendido'}
                      onChange={(e) => setNewIsActive(e.target.value === 'activo')}
                      className="w-full bg-slate-950/50 border border-white/10 rounded-xl py-3 px-4 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                    >
                      <option value="activo" className="bg-slate-900">Activo</option>
                      <option value="suspendido" className="bg-slate-900">Suspendido</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-2">Duración Plan</label>
                    <select
                      value={newDurationDays}
                      onChange={(e) => setNewDurationDays(e.target.value)}
                      className="w-full bg-slate-950/50 border border-white/10 rounded-xl py-3 px-4 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                    >
                      <option value="7" className="bg-slate-900">7 Días (1 Semana)</option>
                      <option value="15" className="bg-slate-900">15 Días (Quincena)</option>
                      <option value="30" className="bg-slate-900">30 Días (1 Mes)</option>
                      <option value="60" className="bg-slate-900">60 Días (2 Meses)</option>
                      <option value="90" className="bg-slate-900">90 Días (3 Meses)</option>
                      <option value="180" className="bg-slate-900">180 Días (6 Meses)</option>
                      <option value="365" className="bg-slate-900">1 Año (365 Días)</option>
                      <option value="infinite" className="bg-slate-900">Vitalicio (Permanente)</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isAddingUser}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl transition-colors text-xs uppercase tracking-widest mt-2 flex items-center justify-center gap-2"
                >
                  {isAddingUser ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus size={16} />}
                  Pre-Registrar Docente
                </button>
              </form>
            </div>

            {/* Bulk User Registration Card */}
            <div className="bg-slate-900/60 backdrop-blur-md rounded-3xl border border-white/5 p-6 space-y-6 mt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-600/10 border border-purple-500/20 rounded-xl flex items-center justify-center text-purple-400 shrink-0">
                  <Users size={18} />
                </div>
                <div>
                  <h3 className="font-black text-white text-base">Creación Masiva (Lote)</h3>
                  <p className="text-slate-400 text-xs">Pega múltiples correos (uno por línea) para crearlos al instante sin límites de Auth.</p>
                </div>
              </div>

              <form onSubmit={handleBulkRegisterSubmit} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-2">Correos Electrónicos (Uno por línea)</label>
                  <textarea
                    rows={4}
                    value={bulkEmailsInput}
                    onChange={(e) => setBulkEmailsInput(e.target.value)}
                    placeholder="docente1@gmail.com&#10;docente2@gmail.com&#10;docente3@gmail.com"
                    required
                    className="w-full bg-slate-950/50 border border-white/10 rounded-xl py-3 px-4 text-white text-xs font-mono focus:outline-none focus:border-purple-500 transition-colors placeholder:text-slate-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-2">Nivel de Acceso</label>
                    <select
                      value={bulkAccessLevel}
                      onChange={(e) => setBulkAccessLevel(e.target.value as 'guest' | 'pro')}
                      className="w-full bg-slate-950/50 border border-white/10 rounded-xl py-3 px-4 text-white text-xs focus:outline-none focus:border-purple-500 transition-colors"
                    >
                      <option value="pro" className="bg-slate-900">PRO</option>
                      <option value="guest" className="bg-slate-900">Invitado</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-2">Duración Plan</label>
                    <select
                      value={bulkDurationDays}
                      onChange={(e) => setBulkDurationDays(e.target.value)}
                      className="w-full bg-slate-950/50 border border-white/10 rounded-xl py-3 px-4 text-white text-xs focus:outline-none focus:border-purple-500 transition-colors"
                    >
                      <option value="30" className="bg-slate-900">30 Días (1 Mes)</option>
                      <option value="60" className="bg-slate-900">60 Días (2 Meses)</option>
                      <option value="90" className="bg-slate-900">90 Días (3 Meses)</option>
                      <option value="365" className="bg-slate-900">1 Año (365 Días)</option>
                      <option value="infinite" className="bg-slate-900">Vitalicio (Permanente)</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isBulkAdding}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:opacity-90 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl transition-all text-xs uppercase tracking-widest mt-2 flex items-center justify-center gap-2 shadow-lg shadow-purple-600/20"
                >
                  {isBulkAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Users size={16} />}
                  Crear Lote en Supabase ({bulkEmailsInput ? bulkEmailsInput.split('\n').filter(l => l.includes('@')).length : 0})
                </button>
              </form>
            </div>

            {/* List and Search of Users (Col 2-3) */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex bg-slate-900/40 border border-white/5 rounded-2xl py-2 px-4 items-center gap-3">
                <Search size={18} className="text-slate-400 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar docente por correo o ID..."
                  className="bg-transparent border-none focus:outline-none text-white text-sm w-full placeholder:text-slate-600"
                />
              </div>

              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 sm:px-8 py-5 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Users size={20} className="text-gray-500" />
                    <h2 className="font-black text-gray-900 uppercase tracking-tight text-sm">Cuentas Registradas</h2>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 bg-white border border-slate-200 px-2.5 py-1 rounded-full">
                    Total: {hasLoadedUsers ? filteredUsers.length : '—'}
                  </span>
                </div>

                {/* Mobile View: User Cards (< md) */}
                <div className="block md:hidden p-4 space-y-3 bg-slate-50/60 divide-y divide-slate-100">
                  {usersLoading ? (
                    <div className="py-12 text-center text-gray-500 flex items-center justify-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                      <span>Cargando listado de docentes...</span>
                    </div>
                  ) : filteredUsers.length === 0 ? (
                    <div className="py-12 text-center text-gray-500 font-medium">No se encontraron usuarios.</div>
                  ) : (
                    filteredUsers.map((user) => {
                      const daysLeft = user.expiresAt ? calculateDaysLeft(user.expiresAt) : null;
                      const isExp = daysLeft !== null && daysLeft <= 0;
                      const isInf = daysLeft !== null && daysLeft > 10000;

                      return (
                        <div key={user.id} className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-3 pt-4">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <span className="font-black text-sm text-slate-900 block truncate" title={user.email}>
                                {user.email}
                              </span>
                              <span className="font-mono text-[9px] text-slate-400 block truncate">
                                ID: {user.id}
                              </span>
                            </div>
                            <button
                              onClick={() => handleToggleUserActive(user)}
                              className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider shrink-0 ${
                                user.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700 font-bold'
                              }`}
                            >
                              {user.isActive ? 'Activo' : 'Suspendido'}
                            </button>
                          </div>

                          {/* Subscriptions & Roles summary */}
                          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-slate-400 font-medium text-[11px]">Nivel & Rol:</span>
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => handleToggleUserAccessLevel(user)}
                                  className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                                    user.access_level === 'pro' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                                  }`}
                                >
                                  {user.access_level || 'pro'}
                                </button>
                                <button
                                  onClick={() => handleToggleUserRole(user)}
                                  className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                                    user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-slate-200 text-slate-700'
                                  }`}
                                >
                                  {user.role || 'teacher'}
                                </button>
                              </div>
                            </div>

                            <div className="flex items-center justify-between pt-1 border-t border-slate-200/50">
                              <span className="text-slate-400 font-medium text-[11px]">Suscripción:</span>
                              <div className="text-right">
                                {user.expiresAt ? (
                                  <>
                                    <span className={`text-xs font-black block ${isInf ? 'text-purple-700' : isExp ? 'text-red-600' : 'text-blue-600'}`}>
                                      {isInf ? 'VITALICIO (Permanente)' : isExp ? `VENCIDO (hace ${Math.abs(daysLeft || 0)}d)` : `QUEDAN ${daysLeft} DÍAS`}
                                    </span>
                                    {formatExpirationDate(user.expiresAt) && !isInf && (
                                      <span className="text-[10px] text-slate-400 block">
                                        Vence: {formatExpirationDate(user.expiresAt)}
                                      </span>
                                    )}
                                  </>
                                ) : (
                                  <span className="text-xs text-slate-400 font-medium">Sin límite</span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Mobile Action Buttons */}
                          <div className="space-y-2 pt-1">
                            <button
                              onClick={() => openAdjustModal({
                                id: user.id,
                                email: user.email,
                                codeId: user.activationCode,
                                currentExpiresAt: user.expiresAt
                              })}
                              className="w-full py-2 px-3 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all active:scale-98"
                            >
                              <Clock size={14} className="text-blue-600" />
                              <span>Sumar Días o Meses (+Tiempo)</span>
                            </button>

                            <div className="flex items-center justify-between gap-1.5">
                              <button
                                onClick={() => handleAdjustUserDays(user, 15)}
                                className="flex-1 py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-black border border-slate-200 transition-colors text-center"
                              >
                                +15d
                              </button>
                              <button
                                onClick={() => handleAdjustUserDays(user, 30)}
                                className="flex-1 py-1.5 px-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-black shadow-sm transition-colors text-center"
                              >
                                +30d (1m)
                              </button>
                              <button
                                onClick={() => handleAdjustUserDays(user, 60)}
                                className="flex-1 py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-black border border-slate-200 transition-colors text-center"
                              >
                                +60d (2m)
                              </button>
                              <button
                                onClick={() => handleSetUserInfinite(user)}
                                className="py-1.5 px-2.5 bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 rounded-lg text-[10px] font-black"
                              >
                                Vitalicio
                              </button>
                            </div>

                            <button
                              onClick={() => handleResetUserPassword(user)}
                              className="w-full py-2 px-3 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all active:scale-98"
                              title="Enviar enlace para restablecer clave a este usuario"
                            >
                              <KeyRound size={14} className="text-amber-600" />
                              <span>Enviar Enlace Recuperar Clave</span>
                            </button>

                            <button
                              onClick={() => copyDirectLoginLink(user)}
                              className="w-full py-2 px-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all active:scale-98"
                              title="Copiar enlace de acceso de 1 clic"
                            >
                              <Copy size={14} className="text-emerald-600" />
                              <span>🔗 Copiar Enlace de Acceso 1 Clic</span>
                            </button>

                            <div className="flex justify-end pt-1">
                              <button 
                                onClick={() => handleDeleteUser(user)}
                                className="px-2.5 py-1 text-red-400 hover:text-red-600 text-xs font-semibold flex items-center gap-1 transition-colors"
                              >
                                <Trash2 size={13} />
                                <span>Eliminar usuario</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Desktop View: Wide Table (>= md) */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-xs font-black text-gray-500 uppercase tracking-[0.2em] border-b border-gray-50">
                        <th className="px-6 py-4">Usuario / Email</th>
                        <th className="px-6 py-4">Acceso</th>
                        <th className="px-6 py-4">Rol</th>
                        <th className="px-6 py-4">Estado</th>
                        <th className="px-6 py-4 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 text-slate-700">
                      {usersLoading ? (
                        <tr>
                          <td colSpan={5} className="px-8 py-12 text-center text-gray-500 font-medium">
                            <div className="flex items-center justify-center gap-2">
                              <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                              <span>Cargando listado de docentes...</span>
                            </div>
                          </td>
                        </tr>
                      ) : filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-8 py-12 text-center text-gray-500 font-medium">No se encontraron usuarios.</td>
                        </tr>
                      ) : (
                        filteredUsers.map((user) => {
                          const daysLeft = user.expiresAt ? calculateDaysLeft(user.expiresAt) : null;
                          const isExp = daysLeft !== null && daysLeft <= 0;
                          const isInf = daysLeft !== null && daysLeft > 10000;

                          return (
                            <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                              <td className="px-6 py-4 max-w-[200px] truncate">
                                <div className="flex flex-col">
                                  <span className="font-bold text-gray-900 text-xs">{user.email}</span>
                                  <span className="font-mono text-[9px] text-gray-400 truncate mt-0.5">{user.id}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-xs font-semibold">
                                <div className="flex flex-col gap-1">
                                  <button
                                    onClick={() => handleToggleUserAccessLevel(user)}
                                    className={`self-start px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${
                                      user.access_level === 'pro' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                                    }`}
                                    title="Alternar Nivel de Acceso"
                                  >
                                    {user.access_level || 'pro'}
                                  </button>
                                  <div>{getExpirationBadge(user.expiresAt)}</div>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <button
                                  onClick={() => handleToggleUserRole(user)}
                                  className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest ${
                                    user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'
                                  }`}
                                  title="Alternar Rol"
                                >
                                  {user.role || 'teacher'}
                                </button>
                              </td>
                              <td className="px-6 py-4">
                                <button
                                  onClick={() => handleToggleUserActive(user)}
                                  className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                    user.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700 font-bold'
                                  }`}
                                  title={user.isActive ? "Suspender Usuario" : "Activar Usuario"}
                                >
                                  {user.isActive ? 'Activo' : 'Suspendido'}
                                </button>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    onClick={() => openAdjustModal({
                                      id: user.id,
                                      email: user.email,
                                      codeId: user.activationCode,
                                      currentExpiresAt: user.expiresAt
                                    })}
                                    className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/80 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-2xs hover:shadow-xs active:scale-95"
                                    title="Sumar días o meses exactos a este usuario"
                                  >
                                    <Clock size={13} className="text-blue-600" />
                                    <span>+ Tiempo</span>
                                  </button>

                                  <div className="flex items-center bg-gray-50 rounded-xl p-0.5 border border-gray-100 shrink-0">
                                    <button
                                      onClick={() => handleAdjustUserDays(user, -15)}
                                      className="p-1 text-red-500 hover:bg-white hover:shadow-xs rounded transition-all font-bold text-[9px]"
                                      title="Quitar 15 días"
                                    >
                                      -15d
                                    </button>
                                    <div className="w-px h-3 bg-gray-200 mx-0.5" />
                                    <button
                                      onClick={() => handleAdjustUserDays(user, 15)}
                                      className="p-1 text-green-600 hover:bg-white hover:shadow-xs rounded transition-all font-bold text-[9px]"
                                      title="Sumar 15 días"
                                    >
                                      +15d
                                    </button>
                                    <div className="w-px h-3 bg-gray-200 mx-0.5" />
                                    <button
                                      onClick={() => handleAdjustUserDays(user, 30)}
                                      className="p-1 text-blue-600 hover:bg-white hover:shadow-xs rounded transition-all font-bold text-[9px]"
                                      title="Sumar 30 días"
                                    >
                                      +30d
                                    </button>
                                    <div className="w-px h-3 bg-gray-200 mx-0.5" />
                                    <button
                                      onClick={() => handleAdjustUserDays(user, 60)}
                                      className="p-1 text-slate-700 hover:bg-white hover:shadow-xs rounded transition-all font-bold text-[9px]"
                                      title="Sumar 60 días (2 meses)"
                                    >
                                      +60d
                                    </button>
                                  </div>

                                  <button
                                    onClick={() => handleSetUserInfinite(user)}
                                    className="p-1.5 bg-purple-50 text-purple-600 hover:bg-purple-100 rounded-lg transition-colors border border-purple-200/50 text-[10px] font-black uppercase tracking-wider"
                                    title="Dar Acceso Vitalicio"
                                  >
                                    Vitalicio
                                  </button>

                                  <button
                                    onClick={() => handleResetUserPassword(user)}
                                    className="p-1.5 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-lg transition-colors border border-amber-200/60 text-[10px] font-black uppercase tracking-wider flex items-center gap-1"
                                    title={`Enviar enlace de restablecimiento de contraseña a ${user.email}`}
                                  >
                                    <KeyRound size={13} />
                                    <span>Clave</span>
                                  </button>

                                  <button 
                                    onClick={() => handleDeleteUser(user)}
                                    className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors ml-1"
                                    title="Eliminar Perfil"
                                  >
                                    <Trash2 size={16} />
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

      {/* VIEW 3: BLACKLIST */}
      {activeTab === 'blacklist' && (
        <div className="space-y-8 animate-in fade-in duration-300">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            
            {/* Form Ban */}
            <div className="bg-slate-900/60 backdrop-blur-md rounded-3xl border border-white/5 p-6 space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-600/10 border border-red-500/20 rounded-xl flex items-center justify-center text-red-400 shrink-0">
                  <UserX size={18} />
                </div>
                <div>
                  <h3 className="font-black text-white text-base">Bloquear Email</h3>
                  <p className="text-slate-400 text-xs">Veta una cuenta de acceso al sistema.</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-2">Correo a Bloquear</label>
                  <input
                    type="email"
                    value={banEmailInput}
                    onChange={(e) => setBanEmailInput(e.target.value)}
                    placeholder="intruso@ejemplo.com"
                    className="w-full bg-slate-950/50 border border-white/10 rounded-xl py-3 px-4 text-white text-sm focus:outline-none focus:border-red-500 transition-colors placeholder:text-slate-600"
                  />
                </div>

                <button
                  onClick={() => handleBanEmail(banEmailInput)}
                  disabled={isBanning}
                  className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl transition-colors text-xs uppercase tracking-widest mt-2 flex items-center justify-center gap-2 shadow-lg shadow-red-600/15"
                >
                  {isBanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserX size={16} />}
                  Bloquear Dirección
                </button>
              </div>
            </div>

            {/* Blacklist Register Table */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex bg-slate-900/40 border border-white/5 rounded-2xl py-2 px-4 items-center gap-3">
                <Search size={18} className="text-slate-400 shrink-0" />
                <input
                  type="text"
                  value={bannedSearchQuery}
                  onChange={(e) => setBannedSearchQuery(e.target.value)}
                  placeholder="Filtrar correos en lista negra..."
                  className="bg-transparent border-none focus:outline-none text-white text-sm w-full placeholder:text-slate-600"
                />
              </div>

              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-8 py-6 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <ShieldAlert size={20} className="text-red-500" />
                    <h2 className="font-black text-gray-900 uppercase tracking-tight text-sm">Lista de Correos Bloqueados</h2>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-red-500 bg-red-50 px-2.5 py-1 rounded-full font-bold">
                    Total: {hasLoadedBlacklist ? bannedEmails.length : '—'}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-xs font-black text-gray-500 uppercase tracking-[0.2em] border-b border-gray-50">
                        <th className="px-8 py-4">Correo Vetado</th>
                        <th className="px-8 py-4">Registrado Por</th>
                        <th className="px-8 py-4">Fecha</th>
                        <th className="px-8 py-4 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 text-slate-700">
                      {blacklistLoading ? (
                        <tr>
                          <td colSpan={4} className="px-8 py-12 text-center text-gray-500 font-medium">
                            <div className="flex items-center justify-center gap-2">
                              <Loader2 className="w-5 h-5 animate-spin text-red-600" />
                              <span>Cargando lista de bloqueos...</span>
                            </div>
                          </td>
                        </tr>
                      ) : bannedEmails.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-8 py-12 text-center text-gray-500 font-medium">No hay correos en la lista negra.</td>
                        </tr>
                      ) : (
                        bannedEmails
                          .filter(b => !bannedSearchQuery || b.email.toLowerCase().includes(bannedSearchQuery.toLowerCase()))
                          .map((ban) => {
                            const bannedDate = ban.createdAt?.toDate ? ban.createdAt.toDate().toLocaleDateString() : 'Desconocida';
                            return (
                              <tr key={ban.id} className="hover:bg-red-50/10 transition-colors">
                                <td className="px-8 py-4 font-bold text-red-950 text-xs">
                                  {ban.email}
                                </td>
                                <td className="px-8 py-4 text-xs font-mono text-gray-500">
                                  {ban.bannedBy || 'sistema'}
                                </td>
                                <td className="px-8 py-4 text-xs text-gray-400">
                                  {bannedDate}
                                </td>
                                <td className="px-8 py-4 text-right">
                                  <button
                                    onClick={() => handleUnbanEmail(ban.email)}
                                    className="px-3 py-1.5 border border-green-200/50 hover:bg-green-50 text-green-600 rounded-xl transition-all text-[10px] font-black uppercase tracking-wider active:scale-95"
                                    title="Desbloquear correo"
                                  >
                                    Desbloquear
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

      {/* Time Adjustment Modal */}
      <TimeAdjustmentModal
        isOpen={isAdjustModalOpen}
        onClose={() => {
          setIsAdjustModalOpen(false);
          setAdjustTarget(null);
        }}
        target={adjustTarget}
        onSuccess={() => {
          fetchCodes();
          fetchUsersProfile();
        }}
      />
    </div>
  );
}
