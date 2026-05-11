import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import AccessProtection from '../AccessProtection';
import { CamilaInner } from '../../pages/Camila';
import { 
  Home as HomeIcon,
  Users, 
  BookOpen, 
  CalendarCheck, 
  CalendarDays, 
  FileText, 
  Baby,
  LogOut,
  GraduationCap,
  Menu,
  X,
  ShieldAlert,
  Sparkles,
  MessageCircle
} from 'lucide-react';

interface LayoutProps {
  isAdmin?: boolean;
  accessLevel?: 'guest' | 'pro';
  codeId?: string;
  generationsCount?: number;
  teacherId?: string;
}

export default function Layout({ isAdmin, accessLevel = 'pro', codeId = '', generationsCount = 0, teacherId = '' }: LayoutProps) {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCamilaWidgetOpen, setIsCamilaWidgetOpen] = useState(false);
  const isGuest = accessLevel === 'guest';
  const GUEST_LIMIT = 3;
  const usagePercentage = Math.min((generationsCount / GUEST_LIMIT) * 100, 100);

  const navItems = [
    { path: '/home', icon: <HomeIcon size={20} />, label: 'Inicio' },
    { path: '/students', icon: <Users size={20} />, label: 'Panel de Estudiantes' },
    { path: '/ppa', icon: <BookOpen size={20} />, label: 'Gestor de PPA' },
    { path: '/attendance', icon: <CalendarCheck size={20} />, label: 'Control de Asistencia' },
    { path: '/maternal', icon: <Baby size={20} />, label: 'Sección Maternal' },
    { path: '/planner', icon: <CalendarDays size={20} />, label: 'Planificador Diario' },
    { path: '/reports', icon: <FileText size={20} />, label: 'Generador de Boletines' },
    { path: '/camila', icon: <Sparkles size={20} className="text-amber-400" />, label: 'IA Camila' },
  ];

  if (isAdmin) {
    navItems.push({ path: '/admin', icon: <ShieldAlert size={20} />, label: 'Panel SaaS Admin' });
  }

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const handleLogout = async () => {
    try {
      // Limpieza estricta de estado (Limpiar caché local y de sesión)
      localStorage.clear();
      sessionStorage.clear();
      await signOut(auth);
      // Forzar una recarga para limpiar cualquier estado en memoria (React state)
      window.location.href = '/';
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <div className="flex h-screen hex-bg font-sans overflow-hidden">
      
      {/* Mobile Top Bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 glass-effect text-white flex items-center justify-between px-4 z-20 shadow-md border-b-futuristic-purple/30">
        <div className="flex items-center gap-2">
          <GraduationCap size={24} className="text-futuristic-accent" />
          <h1 className="text-lg font-bold tracking-tight">Docente<span className="text-futuristic-accent"> PRO</span> <span className="text-xs font-normal opacity-80">by META TC</span></h1>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 text-futuristic-accent hover:text-white focus:outline-none"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Overlay for mobile */}
      {isMobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/80 z-30 backdrop-blur-sm"
          onClick={closeMobileMenu}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed md:static inset-y-0 left-0 z-40 w-64 glass-effect text-white flex flex-col shadow-2xl transform transition-transform duration-300 ease-in-out border-r-futuristic-purple/20 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="h-16 md:h-auto p-6 flex items-center gap-3 border-b border-white/10">
          <GraduationCap size={28} className="text-futuristic-accent" />
          <div className="hidden md:block">
            <h1 className="text-xl font-bold tracking-tight leading-none">Docente<span className="text-futuristic-accent"> PRO</span></h1>
            <span className="text-xs font-medium text-futuristic-accent/60">by META TC</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight md:hidden mt-1 text-futuristic-accent">Menú</h1>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const isCamila = item.path === '/camila';
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={closeMobileMenu}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                  isActive 
                    ? 'bg-futuristic-purple/20 text-white font-medium border border-futuristic-purple/50 shadow-[0_0_15px_rgba(112,0,255,0.2)]' 
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <div className={`${isActive ? 'text-futuristic-accent' : isCamila ? 'text-futuristic-magenta' : ''}`}>
                  {item.icon}
                </div>
                <span>{item.label}</span>
              </Link>
            );
          })}
          
          {/* Botón de Compartir con un Colega (WhatsApp) */}
          <button
            onClick={() => {
              const text = "¡Hola! Estoy usando Docente PRO, una plataforma increíble para docentes con IA. ¡Te la recomiendo! Visítala en: https://docente-pro-by-meta-tc.vercel.app/";
              window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
            }}
            className="flex items-center gap-3 px-4 py-3 rounded-xl w-full text-left text-slate-400 hover:bg-green-600/10 hover:text-green-400 transition-all mt-4 border border-white/5 group"
          >
            <MessageCircle size={20} className="group-hover:scale-110 transition-transform" />
            <span className="font-medium text-sm">Compartir con un Colega</span>
          </button>
        </nav>

        {isGuest && (
          <div className="px-6 py-4 border-t border-white/10 bg-white/5">
            <div className="flex justify-between items-end mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-futuristic-accent">Uso de Prueba</span>
              <span className="text-xs font-black text-white">{generationsCount}/{GUEST_LIMIT}</span>
            </div>
            <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden border border-white/5">
              <div 
                className={`h-full transition-all duration-1000 ${
                  generationsCount >= GUEST_LIMIT ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'bg-gradient-to-r from-futuristic-purple to-futuristic-accent shadow-[0_0_10px_rgba(112,0,255,0.5)]'
                }`}
                style={{ width: `${usagePercentage}%` }}
              />
            </div>
            <p className="text-[10px] text-white/40 mt-2 leading-tight">
              {generationsCount >= GUEST_LIMIT 
                ? 'Límite alcanzado. Actualiza a PRO.' 
                : 'Proyectos generados en modo invitado.'}
            </p>
          </div>
        )}

        <div className="p-4 border-t border-white/10">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full text-left rounded-xl text-slate-400 hover:bg-red-600/10 hover:text-white transition-all"
          >
            <LogOut size={20} />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-transparent pt-16 md:pt-0">
        <AccessProtection accessLevel={accessLevel} codeId={codeId}>
          <div className="p-4 md:p-8 max-w-7xl mx-auto">
            <Outlet context={{ isGuest, generationsCount, teacherId }} />
          </div>
        </AccessProtection>
      </main>

      {/* Floating Camila Widget */}
      {location.pathname !== '/camila' && (
        <>
          <button
            onClick={() => setIsCamilaWidgetOpen(!isCamilaWidgetOpen)}
            className="fixed bottom-6 right-6 p-4 rounded-full bg-gradient-to-br from-futuristic-purple to-futuristic-magenta text-white shadow-2xl hover:shadow-futuristic-purple/40 hover:scale-110 transition-all z-50 flex items-center justify-center border-2 border-white/20 group"
          >
            {isCamilaWidgetOpen ? <X size={28} /> : <Sparkles size={28} className="group-hover:rotate-12 transition-transform" />}
          </button>

          {isCamilaWidgetOpen && (
            <div className="fixed bottom-24 right-4 sm:right-6 w-[calc(100vw-2rem)] sm:w-[450px] h-[600px] max-h-[80vh] rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-50 overflow-hidden neon-border flex flex-col animate-in fade-in slide-in-from-bottom-5">
              <CamilaInner teacherId={teacherId} isEmbedded={true} onClose={() => setIsCamilaWidgetOpen(false)} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
