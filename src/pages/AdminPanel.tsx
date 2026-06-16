import { useState, useEffect } from 'react';
import { collection, setDoc, doc, query, orderBy, serverTimestamp, updateDoc, deleteDoc, writeBatch, getDoc, getDocs, limit } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { supabase, testSupabaseConnection } from '../lib/supabase';
import { SupabaseService } from '../lib/supabaseService';
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
  Eye,
  Database,
  Layers,
  Check
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

const DEFAULT_LOCAL_CODES: Code[] = [
  { id: 'META-7D3A-1B89', status: 'disponible', access_level: 'pro', createdAt: new Date().toISOString() },
  { id: 'META-8F9E-3C4D', status: 'usado', access_level: 'pro', usedBy: 'user1_id', usedByEmail: 'docente1@gmail.com', expiresAt: new Date(Date.now() + 15 * 24 * 3600 * 1000).toISOString(), createdAt: new Date().toISOString() },
  { id: 'META-0A1B-2C3D', status: 'disponible', access_level: 'guest', createdAt: new Date().toISOString() },
];

const DEFAULT_LOCAL_USERS: ProfileUser[] = [
  { id: 'user1_id', email: 'docente1@gmail.com', isActive: true, role: 'teacher', generationsCount: 12, access_level: 'pro', activationCode: 'META-8F9E-3C4D', expiresAt: new Date(Date.now() + 15 * 24 * 3600 * 1000).toISOString(), createdAt: new Date().toISOString() },
  { id: 'user2_id', email: 'monetizacionreymonfr2@gmail.com', isActive: true, role: 'admin', generationsCount: 45, access_level: 'pro', createdAt: new Date().toISOString() },
  { id: 'user3_id', email: 'docente2_invitado@gmail.com', isActive: true, role: 'teacher', generationsCount: 2, access_level: 'guest', createdAt: new Date().toISOString() }
];

const DEFAULT_LOCAL_BLACKLIST = [
  { id: 'ugax6060@gmail.com', email: 'ugax6060@gmail.com', bannedBy: 'sistema', createdAt: new Date().toISOString() }
];

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState<'licencias' | 'usuarios' | 'blacklist' | 'supabase'>('licencias');
  
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
  const [isLocalFallback, setIsLocalFallback] = useState(() => {
    return localStorage.getItem('docenty_use_local_fallback') === 'true';
  });

  // Supabase Integration states
  const [backendProvider, setBackendProvider] = useState(() => {
    return localStorage.getItem('docenty_backend_provider') || 'firebase';
  });
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'failed'>('idle');
  const [testMessage, setTestMessage] = useState('');
  const [isMigratingOverall, setIsMigratingOverall] = useState(false);
  const [migrationStatus, setMigrationStatus] = useState<string | null>(null);

  const [migrationProgress, setMigrationProgress] = useState<{
    [key: string]: { status: 'idle' | 'running' | 'completed' | 'failed'; count: number; error: string }
  }>({
    licencias: { status: 'idle', count: 0, error: '' },
    usuarios: { status: 'idle', count: 0, error: '' },
    blacklist: { status: 'idle', count: 0, error: '' },
    estudiantes: { status: 'idle', count: 0, error: '' },
    camila: { status: 'idle', count: 0, error: '' },
    asistencia: { status: 'idle', count: 0, error: '' },
    planificaciones: { status: 'idle', count: 0, error: '' },
    maternal: { status: 'idle', count: 0, error: '' },
    ppa: { status: 'idle', count: 0, error: '' },
    reportes: { status: 'idle', count: 0, error: '' },
  });

  const handleTestConnection = async () => {
    setTestStatus('testing');
    setTestMessage('Probando comunicación con Supabase...');
    try {
      const res = await testSupabaseConnection();
      if (res.success) {
        setTestStatus('success');
        setTestMessage(res.message);
      } else {
        setTestStatus('failed');
        setTestMessage(res.message);
      }
    } catch (err: any) {
      setTestStatus('failed');
      setTestMessage(err?.message || String(err));
    }
  };

  const handleSwitchBackend = (provider: 'firebase' | 'supabase') => {
    localStorage.setItem('docenty_backend_provider', provider);
    setBackendProvider(provider);
    alert(`¡Motor de base de datos de Docenty PRO cambiado a: ${provider.toUpperCase()}!\nLa aplicación ahora se reiniciará para aplicar los cambios.`);
    window.location.reload();
  };

  const handleMigrateToSupabase = async () => {
    if (!window.confirm('¿Estás seguro de que deseas iniciar la migración? Esto leerá todos tus datos en Firebase y los consolidará en Supabase.')) return;

    setIsMigratingOverall(true);
    setMigrationStatus('Preparando conexión con Supabase...');

    // Reset progress
    const freshProgress = {
      licencias: { status: 'idle' as const, count: 0, error: '' },
      usuarios: { status: 'idle' as const, count: 0, error: '' },
      blacklist: { status: 'idle' as const, count: 0, error: '' },
      estudiantes: { status: 'idle' as const, count: 0, error: '' },
      camila: { status: 'idle' as const, count: 0, error: '' },
      asistencia: { status: 'idle' as const, count: 0, error: '' },
      planificaciones: { status: 'idle' as const, count: 0, error: '' },
      maternal: { status: 'idle' as const, count: 0, error: '' },
      ppa: { status: 'idle' as const, count: 0, error: '' },
      reportes: { status: 'idle' as const, count: 0, error: '' },
    };
    setMigrationProgress(freshProgress);

    const updateStep = (step: string, patch: Partial<{ status: 'idle' | 'running' | 'completed' | 'failed'; count: number; error: string }>) => {
      setMigrationProgress(prev => ({
        ...prev,
        [step]: { ...prev[step], ...patch }
      }));
    };

    try {
      // 1. Licencias
      updateStep('licencias', { status: 'running' });
      try {
        let docsToMigrate: any[] = [];
        if (isLocalFallback) {
          docsToMigrate = getLocalCodes().map(c => ({
            id: c.id,
            status: c.status,
            access_level: c.access_level,
            used_by: c.usedBy || null,
            used_by_email: c.usedByEmail || null,
            expires_at: c.expiresAt || null,
            created_at: c.createdAt || new Date().toISOString()
          }));
        } else {
          const snap = await getDocs(collection(db, 'activation_codes'));
          docsToMigrate = snap.docs.map(doc => {
            const d = doc.data();
            return {
              id: doc.id,
              status: d.status || 'disponible',
              access_level: d.access_level || 'pro',
              used_by: d.usedBy || null,
              used_by_email: d.usedByEmail || null,
              expires_at: d.expiresAt?.toDate ? d.expiresAt.toDate().toISOString() : d.expiresAt || null,
              created_at: d.createdAt?.toDate ? d.createdAt.toDate().toISOString() : d.createdAt || new Date().toISOString()
            };
          });
        }

        let succCount = 0;
        for (const item of docsToMigrate) {
          const { error } = await supabase.from('activation_codes').upsert(item);
          if (!error) succCount++;
        }
        updateStep('licencias', { status: 'completed', count: succCount });
      } catch (e: any) {
        updateStep('licencias', { status: 'failed', error: e.message || String(e) });
      }

      // 2. Usuarios
      updateStep('usuarios', { status: 'running' });
      try {
        let docsToMigrate: any[] = [];
        if (isLocalFallback) {
          docsToMigrate = getLocalUsers().map(u => ({
            id: u.id,
            email: u.email,
            is_active: u.isActive,
            role: u.role,
            generations_count: u.generationsCount,
            access_level: u.access_level || 'pro',
            activation_code: u.activationCode || null,
            expires_at: u.expiresAt || null,
            created_at: u.createdAt || new Date().toISOString()
          }));
        } else {
          const snap = await getDocs(collection(db, 'users'));
          docsToMigrate = snap.docs.map(doc => {
            const d = doc.data();
            return {
              id: doc.id,
              email: d.email || '',
              is_active: d.isActive ?? true,
              role: d.role || 'teacher',
              generations_count: d.generationsCount || 0,
              access_level: d.access_level || 'pro',
              activation_code: d.activationCode || null,
              expires_at: d.expiresAt?.toDate ? d.expiresAt.toDate().toISOString() : d.expiresAt || null,
              created_at: d.createdAt?.toDate ? d.createdAt.toDate().toISOString() : d.createdAt || new Date().toISOString()
            };
          });
        }

        let succCount = 0;
        for (const item of docsToMigrate) {
          const { error } = await supabase.from('profiles').upsert(item);
          if (!error) succCount++;
        }
        updateStep('usuarios', { status: 'completed', count: succCount });
      } catch (e: any) {
        updateStep('usuarios', { status: 'failed', error: e.message || String(e) });
      }

      // 3. Blacklist
      updateStep('blacklist', { status: 'running' });
      try {
        let docsToMigrate: any[] = [];
        if (isLocalFallback) {
          docsToMigrate = getLocalBlacklist().map(b => ({
            email: b.email,
            banned_by: b.bannedBy || 'admin',
            created_at: b.createdAt || new Date().toISOString()
          }));
        } else {
          const snap = await getDocs(collection(db, 'blacklist'));
          docsToMigrate = snap.docs.map(doc => {
            const d = doc.data();
            return {
              email: doc.id,
              banned_by: d.bannedBy || 'admin',
              created_at: d.createdAt?.toDate ? d.createdAt.toDate().toISOString() : d.createdAt || new Date().toISOString()
            };
          });
        }

        let succCount = 0;
        for (const item of docsToMigrate) {
          const { error } = await supabase.from('blacklist').upsert(item);
          if (!error) succCount++;
        }
        updateStep('blacklist', { status: 'completed', count: succCount });
      } catch (e: any) {
        updateStep('blacklist', { status: 'failed', error: e.message || String(e) });
      }

      // 4. Estudiantes
      updateStep('estudiantes', { status: 'running' });
      try {
        let docsToMigrate: any[] = [];
        if (!isLocalFallback) {
          const snap = await getDocs(collection(db, 'estudiantes'));
          docsToMigrate = snap.docs.map(doc => {
            const d = doc.data();
            return {
              id: doc.id,
              nombre: d.nombre,
              apellidos: d.apellidos || '',
              grado_seccion: d.gradoSeccion,
              nivel: d.nivel,
              fecha_nacimiento: d.fechaNacimiento,
              sexo: d.sexo,
              docente_id: d.docenteId || d.teacher_id || '',
              created_at: d.createdAt?.toDate ? d.createdAt.toDate().toISOString() : d.createdAt || new Date().toISOString()
            };
          });
        }

        let succCount = 0;
        for (const item of docsToMigrate) {
          const { error } = await supabase.from('estudiantes').upsert(item);
          if (!error) succCount++;
        }
        updateStep('estudiantes', { status: 'completed', count: succCount });
      } catch (e: any) {
        updateStep('estudiantes', { status: 'failed', error: e.message || String(e) });
      }

      // 5. Camila logs
      updateStep('camila', { status: 'running' });
      try {
        let docsToMigrate: any[] = [];
        if (!isLocalFallback) {
          const snap = await getDocs(collection(db, 'camila'));
          docsToMigrate = snap.docs.map(doc => {
            const d = doc.data();
            return {
              id: doc.id,
              student_id: d.studentId,
              student_name: d.studentName || '',
              notes: d.notes,
              category: d.category,
              teacher_id: d.teacherId,
              created_at: d.createdAt?.toDate ? d.createdAt.toDate().toISOString() : d.createdAt || new Date().toISOString()
            };
          });
        }

        let succCount = 0;
        for (const item of docsToMigrate) {
          const { error } = await supabase.from('camila_logs').upsert(item);
          if (!error) succCount++;
        }
        updateStep('camila', { status: 'completed', count: succCount });
      } catch (e: any) {
        updateStep('camila', { status: 'failed', error: e.message || String(e) });
      }

      // 6. Asistencia
      updateStep('asistencia', { status: 'running' });
      try {
        let docsToMigrate: any[] = [];
        if (!isLocalFallback) {
          const snap = await getDocs(collection(db, 'asistencia'));
          docsToMigrate = snap.docs.map(doc => {
            const d = doc.data();
            return {
              id: doc.id,
              student_id: d.studentId,
              student_name: d.studentName || '',
              date: d.date,
              estado: d.estado,
              teacher_id: d.teacherId || d.docenteId || '',
              created_at: d.createdAt?.toDate ? d.createdAt.toDate().toISOString() : d.createdAt || new Date().toISOString()
            };
          });
        }

        let succCount = 0;
        for (const item of docsToMigrate) {
          const { error } = await supabase.from('asistencia').upsert(item);
          if (!error) succCount++;
        }
        updateStep('asistencia', { status: 'completed', count: succCount });
      } catch (e: any) {
        updateStep('asistencia', { status: 'failed', error: e.message || String(e) });
      }

      // 7. Planificaciones
      updateStep('planificaciones', { status: 'running' });
      try {
        let docsToMigrate: any[] = [];
        if (!isLocalFallback) {
          const snap = await getDocs(collection(db, 'planificaciones'));
          docsToMigrate = snap.docs.map(doc => {
            const d = doc.data();
            return {
              id: doc.id,
              titulo: d.titulo,
              proyecto: d.proyecto || '',
              fecha_inicio: d.fechaInicio || '',
              fecha_fin: d.fechaFin || '',
              nivel: d.nivel || '',
              diagnostico: d.diagnostico || '',
              proposito: d.proposito || '',
              estrategias: d.estrategias || '',
              recursos: d.recursos || '',
              evaluacion: d.evaluacion || '',
              planes_diarios: d.planesDiarios || [],
              teacher_id: d.teacherId || '',
              created_at: d.createdAt?.toDate ? d.createdAt.toDate().toISOString() : d.createdAt || new Date().toISOString()
            };
          });
        }

        let succCount = 0;
        for (const item of docsToMigrate) {
          const { error } = await supabase.from('planificaciones').upsert(item);
          if (!error) succCount++;
        }
        updateStep('planificaciones', { status: 'completed', count: succCount });
      } catch (e: any) {
        updateStep('planificaciones', { status: 'failed', error: e.message || String(e) });
      }

      // 8. Maternal
      updateStep('maternal', { status: 'running' });
      try {
        let docsToMigrate: any[] = [];
        if (!isLocalFallback) {
          const snap = await getDocs(collection(db, 'maternal'));
          docsToMigrate = snap.docs.map(doc => {
            const d = doc.data();
            return {
              id: doc.id,
              student_id: d.studentId,
              student_name: d.studentName,
              date: d.date,
              alimentacion: d.alimentacion || '',
              sueno: d.sueno || '',
              evacuacion: d.evacuacion || '',
              higiene: d.higiene || '',
              observaciones: d.observaciones || '',
              teacher_id: d.teacherId || d.docenteId || '',
              created_at: d.createdAt?.toDate ? d.createdAt.toDate().toISOString() : d.createdAt || new Date().toISOString()
            };
          });
        }

        let succCount = 0;
        for (const item of docsToMigrate) {
          const { error } = await supabase.from('informes_maternal').upsert(item);
          if (!error) succCount++;
        }
        updateStep('maternal', { status: 'completed', count: succCount });
      } catch (e: any) {
        updateStep('maternal', { status: 'failed', error: e.message || String(e) });
      }

      // 9. PPA
      updateStep('ppa', { status: 'running' });
      try {
        let docsToMigrate: any[] = [];
        if (!isLocalFallback) {
          const snap = await getDocs(collection(db, 'ppa'));
          docsToMigrate = snap.docs.map(doc => {
            const d = doc.data();
            return {
              id: doc.id,
              student_id: d.studentId,
              student_name: d.studentName || '',
              teacher_id: d.teacherId,
              objetivos: d.objetivos || '',
              metas: d.metas || '',
              diagnostico: d.diagnostico || '',
              evaluacion: d.evaluacion || '',
              created_at: d.createdAt?.toDate ? d.createdAt.toDate().toISOString() : d.createdAt || new Date().toISOString()
            };
          });
        }

        let succCount = 0;
        for (const item of docsToMigrate) {
          const { error } = await supabase.from('ppa').upsert(item);
          if (!error) succCount++;
        }
        updateStep('ppa', { status: 'completed', count: succCount });
      } catch (e: any) {
        updateStep('ppa', { status: 'failed', error: e.message || String(e) });
      }

      // 10. Reportes
      updateStep('reportes', { status: 'running' });
      try {
        let docsToMigrate: any[] = [];
        if (!isLocalFallback) {
          const snap = await getDocs(collection(db, 'reportes'));
          docsToMigrate = snap.docs.map(doc => {
            const d = doc.data();
            return {
              id: doc.id,
              student_id: d.studentId,
              student_name: d.studentName,
              tipo: d.tipo,
              contenido: d.contenido,
              teacher_id: d.teacherId,
              created_at: d.createdAt?.toDate ? d.createdAt.toDate().toISOString() : d.createdAt || new Date().toISOString()
            };
          });
        }

        let succCount = 0;
        for (const item of docsToMigrate) {
          const { error } = await supabase.from('reportes').upsert(item);
          if (!error) succCount++;
        }
        updateStep('reportes', { status: 'completed', count: succCount });
      } catch (e: any) {
        updateStep('reportes', { status: 'failed', error: e.message || String(e) });
      }

      setMigrationStatus('¡Migración completada exitosamente! Todos los registros han sido copiados a Supabase.');
    } catch (err: any) {
      setMigrationStatus(`Error fatal en migración: ${err?.message || err}`);
    } finally {
      setIsMigratingOverall(false);
    }
  };

  const getLocalCodes = (): Code[] => {
    let data = localStorage.getItem('docenty_local_codes');
    if (!data) {
      localStorage.setItem('docenty_local_codes', JSON.stringify(DEFAULT_LOCAL_CODES));
      return DEFAULT_LOCAL_CODES;
    }
    return JSON.parse(data);
  };

  const saveLocalCodes = (newCodes: Code[]) => {
    localStorage.setItem('docenty_local_codes', JSON.stringify(newCodes));
    setCodes(newCodes);
  };

  const getLocalUsers = (): ProfileUser[] => {
    let data = localStorage.getItem('docenty_local_users');
    if (!data) {
      localStorage.setItem('docenty_local_users', JSON.stringify(DEFAULT_LOCAL_USERS));
      return DEFAULT_LOCAL_USERS;
    }
    return JSON.parse(data);
  };

  const saveLocalUsers = (newUsers: ProfileUser[]) => {
    localStorage.setItem('docenty_local_users', JSON.stringify(newUsers));
    setUsers(newUsers);
  };

  const getLocalBlacklist = () => {
    let data = localStorage.getItem('docenty_local_blacklist');
    if (!data) {
      localStorage.setItem('docenty_local_blacklist', JSON.stringify(DEFAULT_LOCAL_BLACKLIST));
      return DEFAULT_LOCAL_BLACKLIST;
    }
    return JSON.parse(data);
  };

  const saveLocalBlacklist = (newBlacklist: any[]) => {
    localStorage.setItem('docenty_local_blacklist', JSON.stringify(newBlacklist));
    setBannedEmails(newBlacklist);
  };

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
      if (isLocalFallback) {
        setCodes(getLocalCodes());
        setHasLoadedCodes(true);
        return;
      }

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
      const isQuota = error?.message?.toLowerCase().includes('quota') || String(error).toLowerCase().includes('quota');
      if (isQuota) {
        setIsLocalFallback(true);
        localStorage.setItem('docenty_use_local_fallback', 'true');
        setCodes(getLocalCodes());
        setHasLoadedCodes(true);
      } else {
        setErrorMsg(`Error al obtener códigos: ${error?.message || error}`);
        try {
          handleFirestoreError(error, OperationType.LIST, 'activation_codes');
        } catch (e) {}
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUsersProfile = async () => {
    if (!isCurrentAdmin) return;
    setUsersLoading(true);
    setErrorMsg(null);
    try {
      if (isLocalFallback) {
        setUsers(getLocalUsers());
        setHasLoadedUsers(true);
        return;
      }

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
      const isQuota = error?.message?.toLowerCase().includes('quota') || String(error).toLowerCase().includes('quota');
      if (isQuota) {
        setIsLocalFallback(true);
        localStorage.setItem('docenty_use_local_fallback', 'true');
        setUsers(getLocalUsers());
        setHasLoadedUsers(true);
      } else {
        setErrorMsg(`Error al obtener usuarios: ${error?.message || error}`);
      }
    } finally {
      setUsersLoading(false);
    }
  };

  const fetchBlacklist = async () => {
    if (!isCurrentAdmin) return;
    setBlacklistLoading(true);
    setErrorMsg(null);
    try {
      if (isLocalFallback) {
        setBannedEmails(getLocalBlacklist());
        setHasLoadedBlacklist(true);
        return;
      }

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
      const isQuota = error?.message?.toLowerCase().includes('quota') || String(error).toLowerCase().includes('quota');
      if (isQuota) {
        setIsLocalFallback(true);
        localStorage.setItem('docenty_use_local_fallback', 'true');
        setBannedEmails(getLocalBlacklist());
        setHasLoadedBlacklist(true);
      } else {
        setErrorMsg(`Error al obtener lista negra: ${error?.message || error}`);
      }
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
      if (isLocalFallback) {
        // 1. Blacklist
        const currentBanned = getLocalBlacklist();
        if (!currentBanned.some(b => b.email === cleanMail)) {
          const newBan = {
            id: cleanMail,
            email: cleanMail,
            createdAt: new Date().toISOString(),
            bannedBy: currentUserEmail || 'admin'
          };
          saveLocalBlacklist([newBan, ...currentBanned]);
        }

        // 2. Suspend user in users listing
        const currentUsers = getLocalUsers();
        const updated = currentUsers.map(u => {
          if (u.email.toLowerCase() === cleanMail) {
            return { ...u, isActive: false };
          }
          return u;
        });
        saveLocalUsers(updated);

        alert(`¡La cuenta ${cleanMail} ha sido agregada a la lista negra y sus privilegios han sido revocados (Modo Local)!`);
        setBanEmailInput('');
        return;
      }

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
      if (isLocalFallback) {
        const currentBanned = getLocalBlacklist();
        const updated = currentBanned.filter(b => b.id !== bannedMailId);
        saveLocalBlacklist(updated);
        alert(`¡Correo ${bannedMailId} desbloqueado exitosamente (Modo Local)!`);
        return;
      }

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
      
      if (isLocalFallback) {
        const currentList = getLocalCodes();
        const newCodeObj: Code = {
          id: codeId,
          status: 'disponible',
          access_level: level,
          createdAt: new Date().toISOString()
        };
        saveLocalCodes([newCodeObj, ...currentList]);
        alert(`Código ${codeId} generado exitosamente (Modo Local)!`);
        return;
      }

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
      if (isLocalFallback) {
        let currentExpiration: Date;
        if (code.expiresAt instanceof Date) {
          currentExpiration = code.expiresAt;
        } else {
          currentExpiration = new Date(code.expiresAt);
        }

        if (isNaN(currentExpiration.getTime())) {
          currentExpiration = new Date();
        }

        const newExpiration = new Date(currentExpiration.getTime() + (days * 24 * 60 * 60 * 1000));

        // Update local Codes
        const currentCodes = getLocalCodes();
        const updatedCodes = currentCodes.map(c => {
          if (c.id === code.id) {
            return { ...c, expiresAt: newExpiration.toISOString() };
          }
          return c;
        });
        saveLocalCodes(updatedCodes);

        // Update local Users
        const currentUsers = getLocalUsers();
        const updatedUsers = currentUsers.map(u => {
          if (u.id === code.usedBy) {
            return { ...u, expiresAt: newExpiration.toISOString(), isActive: newExpiration > new Date() };
          }
          return u;
        });
        saveLocalUsers(updatedUsers);

        alert(`¡Suscripción actualizada (Modo Local)! Se han ${days > 0 ? 'sumado' : 'quitado'} ${Math.abs(days)} días.`);
        return;
      }

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
      if (isLocalFallback) {
        const currentCodes = getLocalCodes();
        const updatedCodes = currentCodes.filter(c => c.id !== code.id);
        saveLocalCodes(updatedCodes);

        if (code.status === 'usado' && code.usedBy) {
          const currentUsers = getLocalUsers();
          const updatedUsers = currentUsers.map(u => {
            if (u.id === code.usedBy) {
              return { ...u, isActive: false, expiresAt: null, activationCode: null };
            }
            return u;
          });
          saveLocalUsers(updatedUsers);
        }

        alert('Código eliminado exitosamente (Modo Local).');
        return;
      }

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
      if (isLocalFallback) {
        const currentUsers = getLocalUsers();
        const updated = currentUsers.map(u => {
          if (u.id === user.id) {
            return { ...u, role: newRole as 'admin' | 'teacher' };
          }
          return u;
        });
        saveLocalUsers(updated);
        alert(`¡Rol actualizado exitosamente para ${user.email} (Modo Local)!`);
        return;
      }

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
      if (isLocalFallback) {
        const currentUsers = getLocalUsers();
        const updated = currentUsers.map(u => {
          if (u.id === user.id) {
            return { ...u, isActive: newIsActive };
          }
          return u;
        });
        saveLocalUsers(updated);
        alert(`Acceso de usuario modificado a ${newIsActive ? 'ACTIVO' : 'SUSPENDIDO'} (Modo Local).`);
        return;
      }

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
    const newLevel: 'guest' | 'pro' = user.access_level === 'guest' ? 'pro' : 'guest';
    const confirmAction = window.confirm(`¿Seguro que deseas cambiar el nivel de access de ${user.email} a ${newLevel.toUpperCase()}?`);
    if (!confirmAction) return;

    try {
      if (isLocalFallback) {
        const currentUsers = getLocalUsers();
        const updated = currentUsers.map(u => {
          if (u.id === user.id) {
            return { ...u, access_level: newLevel };
          }
          return u;
        });
        saveLocalUsers(updated);
        alert(`Nivel de acceso configurado a ${newLevel.toUpperCase()} para ${user.email} (Modo Local).`);
        return;
      }

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
      if (isLocalFallback) {
        let currentExpiration: Date;
        if (user.expiresAt) {
          currentExpiration = new Date(user.expiresAt);
        } else {
          currentExpiration = new Date();
        }

        if (isNaN(currentExpiration.getTime())) {
          currentExpiration = new Date();
        }

        const newExpiration = new Date(currentExpiration.getTime() + (days * 24 * 60 * 60 * 1000));

        const currentUsers = getLocalUsers();
        const updated = currentUsers.map(u => {
          if (u.id === user.id) {
            return { ...u, expiresAt: newExpiration.toISOString(), isActive: newExpiration > new Date() };
          }
          return u;
        });
        saveLocalUsers(updated);
        alert(`Suscripción actualizada para ${user.email} (Modo Local).`);
        return;
      }

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
      if (isLocalFallback) {
        const infiniteDate = new Date();
        infiniteDate.setFullYear(infiniteDate.getFullYear() + 100);

        const currentUsers = getLocalUsers();
        const updated = currentUsers.map(u => {
          if (u.id === user.id) {
            return { ...u, expiresAt: infiniteDate.toISOString(), isActive: true, access_level: 'pro' as const };
          }
          return u;
        });
        saveLocalUsers(updated);
        alert(`Acceso vitalicio concedido a ${user.email} (Modo Local).`);
        return;
      }

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
      if (isLocalFallback) {
        const currentUsers = getLocalUsers();
        const updated = currentUsers.filter(u => u.id !== user.id);
        saveLocalUsers(updated);
        alert(`Perfil de usuario ${user.email} eliminado exitosamente de la base de datos (Modo Local).`);
        return;
      }

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

      if (isLocalFallback) {
        const currentUsers = getLocalUsers();
        const newUsrObj: ProfileUser = {
          id: cleanMail, // Email as ID for pre-register local
          email: cleanMail,
          isActive: newIsActive,
          role: newRole,
          generationsCount: 0,
          access_level: newAccessLevel,
          expiresAt: expiresAt ? expiresAt.toISOString() : null,
          createdAt: new Date().toISOString()
        };
        saveLocalUsers([newUsrObj, ...currentUsers]);
        alert(`Usuario ${cleanMail} pre-registrado correctamente (Modo Local).`);
        setNewEmail('');
        return;
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
        <button
          onClick={() => setActiveTab('supabase')}
          className={`flex-1 min-w-[140px] py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
            activeTab === 'supabase' 
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' 
              : 'text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/5'
          }`}
        >
          <Database size={16} />
          Migración Supabase
        </button>
      </div>

      {isLocalFallback && (
        <div id="local-fallback-warning-box" className="p-5 bg-amber-500/10 border border-amber-500/30 text-amber-100 rounded-2xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 animate-in fade-in duration-300">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0 mt-0.5 animate-pulse" />
            <div className="text-xs space-y-1">
              <p className="font-extrabold uppercase tracking-widest text-amber-400">Modo de Emergencia / Simulación Local Activo</p>
              <p className="text-amber-300 leading-relaxed font-medium">
                Las cuotas gratuitas de lectura diaria para Firestore de este proyecto se han completado (Quota limit exceeded). 
                Para que no te quedes bloqueado, <strong>el panel ha cambiado automáticamente al modo de simulación en memoria local (localStorage)</strong>.
              </p>
              <p className="text-amber-400/80 font-mono text-[10px]">
                Puedes generar códigos, modificar accesos, suspender perfiles y agregar a la lista negra en tiempo real para evaluar el sistema.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setIsLocalFallback(false);
              localStorage.removeItem('docenty_use_local_fallback');
              setErrorMsg(null);
              // Force direct database fetch retry
              setTimeout(() => {
                if (activeTab === 'licencias') fetchCodes();
                else if (activeTab === 'usuarios') fetchUsersProfile();
                else if (activeTab === 'blacklist') fetchBlacklist();
              }, 100);
            }}
            className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-[10px] uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-amber-600/10 shrink-0 border border-amber-500/30 active:scale-95 text-center mt-2 sm:mt-0"
          >
            Reintentar Conexión Real
          </button>
        </div>
      )}

      {errorMsg && !isLocalFallback && (
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

      {/* VIEW 4: MIGRACIÓN SUPABASE */}
      {activeTab === 'supabase' && (
        <div className="space-y-8 animate-in fade-in duration-300">
          
          {/* Top Info Banner */}
          <div className="bg-slate-900/60 backdrop-blur-md rounded-3xl border border-emerald-500/10 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="bg-emerald-500/10 text-emerald-400 text-[9px] font-black tracking-widest uppercase px-2 py-0.5 rounded border border-emerald-500/20">MIGRACIÓN ACTIVA</span>
                <span className="text-slate-500 text-xs font-mono">Firebase to Supabase v2.0</span>
              </div>
              <h3 className="text-xl font-black text-white">Consolidación Sin Pérdidas de Docenty PRO</h3>
              <p className="text-slate-300 text-xs max-w-2xl leading-relaxed">
                Este sistema te permite migrar toda la información almacenada en Google Firebase Firestore
                (Licencias, perfiles, estudiantes, planificaciones, reportes maternales e historial)
                directamente hacia tu nueva base de datos robusta en Supabase en cuestión de segundos.
              </p>
            </div>
            <div className="flex items-center gap-3 bg-slate-950 p-4 rounded-2xl border border-white/5 shrink-0">
              <div className="w-10 h-10 bg-emerald-600/10 border border-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-400">
                <Database size={20} className="animate-pulse" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">PROVEEDOR ACTIVO</p>
                <p className="font-extrabold text-sm font-mono text-white uppercase">{backendProvider === 'supabase' ? '⚡ SUPABASE PG' : '🔥 FIREBASE FIRESTORE'}</p>
              </div>
            </div>
          </div>

          {/* Main Layout Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            
            {/* Column 1: Config & Engine Switcher */}
            <div className="space-y-6">
              
              {/* Card 1: Select Engine */}
              <div className="bg-slate-900/60 backdrop-blur-md rounded-3xl border border-white/5 p-6 space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-600/10 border border-blue-500/20 rounded-lg flex items-center justify-center text-blue-400 shrink-0">
                    <Layers size={16} />
                  </div>
                  <div>
                    <h4 className="font-black text-white text-sm">Cambiar Motor de DB</h4>
                    <p className="text-slate-400 text-[10px] uppercase tracking-wider">Alternar en tiempo real</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={() => handleSwitchBackend('firebase')}
                    className={`w-full p-4 rounded-2xl border text-left transition-all ${
                      backendProvider === 'firebase'
                        ? 'bg-blue-600/10 border-blue-500 text-white shadow-lg'
                        : 'bg-slate-950 border-white/5 text-slate-400 hover:border-white/10'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-extrabold text-xs">Google Firebase (Estándar)</span>
                      {backendProvider === 'firebase' && <span className="w-2 h-2 bg-blue-500 rounded-full animate-ping" />}
                    </div>
                    <p className="text-[10px] text-slate-400 leading-normal">Utiliza Firestore estándar. Sujeto a cuotas de lectura diaria gratuitas de Firebase.</p>
                  </button>

                  <button
                    onClick={() => handleSwitchBackend('supabase')}
                    className={`w-full p-4 rounded-2xl border text-left transition-all ${
                      backendProvider === 'supabase'
                        ? 'bg-emerald-600/10 border-emerald-500 text-white shadow-lg shadow-emerald-600/5'
                        : 'bg-slate-950 border-white/5 text-slate-400 hover:border-white/10'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-extrabold text-xs">Supabase PostgreSQL (Acelerado)</span>
                      {backendProvider === 'supabase' && <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />}
                    </div>
                    <p className="text-[10px] text-slate-400 leading-normal">Consultas ultrarrápidas, sin cuotas de lectura reducidas. Conexión directa de alto desempeño con Postgres.</p>
                  </button>
                </div>
              </div>

              {/* Card 2: Test Connection */}
              <div className="bg-slate-900/60 backdrop-blur-md rounded-3xl border border-white/5 p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-black text-white text-xs uppercase tracking-wider text-slate-400">Prueba de Diagnóstico</h4>
                  {testStatus === 'success' && <span className="text-emerald-400 text-xs font-mono font-bold">● ONLINE</span>}
                  {testStatus === 'testing' && <span className="text-amber-400 text-xs font-mono font-bold animate-pulse">TESTING...</span>}
                  {testStatus === 'failed' && <span className="text-red-400 text-xs font-mono font-bold">● OFFLINE</span>}
                  {testStatus === 'idle' && <span className="text-slate-500 text-xs font-mono">--</span>}
                </div>

                {testMessage && (
                  <div className={`p-4 rounded-xl text-xs font-mono leading-relaxed break-all ${
                    testStatus === 'success' ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-500/20' :
                    testStatus === 'failed' ? 'bg-red-950/40 text-red-300 border border-red-500/20' :
                    'bg-slate-950 text-slate-300'
                  }`}>
                    {testMessage}
                  </div>
                )}

                <button
                  onClick={handleTestConnection}
                  disabled={testStatus === 'testing'}
                  className="w-full bg-slate-950 hover:bg-slate-900 border border-white/10 hover:border-white/20 text-white font-bold py-2.5 px-4 rounded-xl transition-all text-xs uppercase tracking-widest flex items-center justify-center gap-2"
                >
                  {testStatus === 'testing' ? <Loader2 className="w-4 h-4 animate-spin text-slate-400" /> : <RefreshCw size={14} />}
                  Probar Conexión Supabase
                </button>
              </div>

            </div>

            {/* Column 2: Live Migration Progress */}
            <div className="lg:col-span-2 space-y-6">
              
              <div className="bg-slate-900/60 backdrop-blur-md rounded-3xl border border-white/5 p-6 space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
                  <div>
                    <h3 className="font-black text-white text-base">Migrador de Datos</h3>
                    <p className="text-slate-400 text-xs">Copia ordenada de todas tus colecciones en Firebase hacia Supabase.</p>
                  </div>
                  <button
                    onClick={handleMigrateToSupabase}
                    disabled={isMigratingOverall}
                    className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black px-6 py-3 rounded-xl flex items-center justify-center gap-2 border border-emerald-500 shadow-lg shadow-emerald-600/10 transition-all text-xs uppercase tracking-wider shrink-0"
                  >
                    {isMigratingOverall ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database size={14} />}
                    Iniciar Migración de Datos
                  </button>
                </div>

                {migrationStatus && (
                  <div className="bg-emerald-600/5 rounded-2xl border border-emerald-500/10 p-4 font-mono text-xs text-slate-300 leading-relaxed text-center">
                    {migrationStatus}
                  </div>
                )}

                {/* Progress Grid List */}
                <div className="space-y-3.5">
                  {Object.entries(migrationProgress).map(([key, value]) => {
                    const label = key.toUpperCase();
                    return (
                      <div key={key} className="bg-slate-950 border border-white/5 rounded-2xl p-4 flex items-center justify-between gap-4">
                        <div className="space-y-1">
                          <span className="font-extrabold text-[11px] text-white tracking-widest">{label === 'CAMILA' ? 'ANOTACIONES CAMILA' : label === 'LICENCIAS' ? 'CÓDIGOS DE LICENCIA' : label}</span>
                          <div className="flex items-center gap-2">
                            {value.status === 'running' && <span className="text-[10px] text-amber-400 font-mono animate-pulse">Migrando en tiempo real...</span>}
                            {value.status === 'completed' && <span className="text-[10px] text-emerald-400 font-mono">Migrado exitosamente</span>}
                            {value.status === 'failed' && <span className="text-[10px] text-red-400 font-mono truncate max-w-sm">{value.error}</span>}
                            {value.status === 'idle' && <span className="text-[10px] text-slate-500 font-mono">Esperando inicio...</span>}
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {value.status === 'completed' && (
                            <span className="bg-emerald-500/10 text-emerald-400 font-mono text-[10px] uppercase font-bold px-2 py-0.5 rounded border border-emerald-500/20">
                              {value.count} FILAS
                            </span>
                          )}
                          {value.status === 'running' && (
                            <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                          )}
                          {value.status === 'completed' && (
                            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                          )}
                          {value.status === 'failed' && (
                            <ShieldAlert className="w-5 h-5 text-red-500" />
                          )}
                          {value.status === 'idle' && (
                            <div className="w-5 h-5 border border-white/10 rounded-full flex items-center justify-center text-slate-600 text-[9px] font-mono">--</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

          </div>

          {/* Database Setup SQL Script Panel */}
          <div className="bg-slate-900/60 backdrop-blur-md rounded-3xl border border-white/5 p-6 space-y-4">
            <div className="flex justify-between items-center sm:items-center flex-col sm:flex-row gap-4">
              <div>
                <h4 className="font-black text-white text-base">Configuración Estructural (Supabase SQL Editor)</h4>
                <p className="text-slate-400 text-xs">Copia y ejecuta este script en la sección &quot;SQL Editor&quot; de tu panel de Supabase antes de migrar los datos.</p>
              </div>
              <button
                onClick={() => {
                  const el = document.getElementById('sql-schema-editor-code') as HTMLTextAreaElement;
                  if (el) {
                    el.select();
                    document.execCommand('copy');
                    alert('¡Script SQL copiado al portapapeles! Ahora puedes pegarlo en el editor SQL de Supabase.');
                  }
                }}
                className="bg-slate-950 hover:bg-slate-900 border border-white/10 hover:border-white/20 text-white font-bold py-2.5 px-6 rounded-xl transition-all text-xs uppercase tracking-wider flex items-center gap-2 shrink-0"
              >
                <Copy size={14} />
                Copiar Script SQL
              </button>
            </div>

            <textarea
              id="sql-schema-editor-code"
              readOnly
              rows={16}
              value={`-- Habilitar extensiones requeridas
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id TEXT PRIMARY KEY, -- Firebase Auth UID
  email TEXT UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  role TEXT DEFAULT 'teacher',
  generations_count INTEGER DEFAULT 0,
  access_level TEXT DEFAULT 'pro',
  activation_code TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. blacklist
CREATE TABLE IF NOT EXISTS public.blacklist (
  email TEXT PRIMARY KEY,
  banned_by TEXT DEFAULT 'sistema',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. activation_codes
CREATE TABLE IF NOT EXISTS public.activation_codes (
  id TEXT PRIMARY KEY, -- e.g. "META-XXXX-YYYY"
  status TEXT DEFAULT 'disponible',
  access_level TEXT DEFAULT 'pro',
  used_by TEXT,
  used_by_email TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. estudiantes
CREATE TABLE IF NOT EXISTS public.estudiantes (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  apellidos TEXT,
  grado_seccion TEXT NOT NULL,
  nivel TEXT NOT NULL,
  fecha_nacimiento TEXT NOT NULL,
  sexo TEXT NOT NULL,
  docente_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 5. asistencia
CREATE TABLE IF NOT EXISTS public.asistencia (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  student_name TEXT,
  date TEXT NOT NULL,
  estado TEXT NOT NULL,
  teacher_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 6. planificaciones
CREATE TABLE IF NOT EXISTS public.planificaciones (
  id TEXT PRIMARY KEY,
  titulo TEXT NOT NULL,
  proyecto TEXT,
  fecha_inicio TEXT,
  fecha_fin TEXT,
  nivel TEXT,
  diagnostico TEXT,
  proposito TEXT,
  estrategias TEXT,
  recursos TEXT,
  evaluacion TEXT,
  planes_diarios JSONB DEFAULT '[]'::jsonb,
  teacher_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 7. camila_logs
CREATE TABLE IF NOT EXISTS public.camila_logs (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  student_name TEXT,
  notes TEXT NOT NULL,
  category TEXT NOT NULL,
  teacher_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 8. informes_maternal
CREATE TABLE IF NOT EXISTS public.informes_maternal (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  student_name TEXT NOT NULL,
  date TEXT,
  alimentacion TEXT,
  sueno TEXT,
  evacuacion TEXT,
  higiene TEXT,
  observaciones TEXT,
  teacher_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 9. ppa (Pedagogy Plan Action)
CREATE TABLE IF NOT EXISTS public.ppa (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  student_name TEXT,
  teacher_id TEXT NOT NULL,
  objetivos TEXT,
  metas TEXT,
  diagnostico TEXT,
  evaluacion TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 10. reportes
CREATE TABLE IF NOT EXISTS public.reportes (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  student_name TEXT NOT NULL,
  tipo TEXT NOT NULL,
  contenido TEXT NOT NULL,
  teacher_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Desactivar políticas RLS básicas para facilitar migración del frontend
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.blacklist DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.activation_codes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.estudiantes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.asistencia DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.planificaciones DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.camila_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.informes_maternal DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.ppa DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.reportes DISABLE ROW LEVEL SECURITY;`}
              className="w-full bg-slate-950 border border-white/5 rounded-2xl p-4 font-mono text-[11px] leading-relaxed text-slate-400 focus:outline-none focus:border-emerald-500/50 resize-none selection:bg-emerald-500/35 selection:text-white"
            />
          </div>

        </div>
      )}
    </div>
  );
}
