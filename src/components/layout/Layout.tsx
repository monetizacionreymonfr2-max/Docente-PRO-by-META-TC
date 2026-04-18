import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import AccessProtection from '../AccessProtection';
import { 
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
  ShieldAlert
} from 'lucide-react';

interface LayoutProps {
  isAdmin?: boolean;
  accessLevel?: 'guest' | 'pro';
  codeId?: string;
}

export default function Layout({ isAdmin, accessLevel = 'pro', codeId = '' }: LayoutProps) {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isGuest = accessLevel === 'guest';

  const navItems = [
    { path: '/students', icon: <Users size={20} />, label: 'Panel de Estudiantes' },
    { path: '/ppa', icon: <BookOpen size={20} />, label: 'Gestor de PPA' },
    { path: '/attendance', icon: <CalendarCheck size={20} />, label: 'Control de Asistencia' },
    { path: '/maternal', icon: <Baby size={20} />, label: 'Sección Maternal' },
    { path: '/planner', icon: <CalendarDays size={20} />, label: 'Planificador Diario' },
    { path: '/reports', icon: <FileText size={20} />, label: 'Generador de Boletines' },
  ];

  if (isAdmin) {
    navItems.push({ path: '/admin', icon: <ShieldAlert size={20} />, label: 'Panel SaaS Admin' });
  }

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">
      
      {/* Mobile Top Bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-blue-900 text-white flex items-center justify-between px-4 z-20 shadow-md">
        <div className="flex items-center gap-2">
          <GraduationCap size={24} className="text-blue-300" />
          <h1 className="text-lg font-bold tracking-tight">Docente<span className="text-blue-300"> PRO</span> <span className="text-xs font-normal opacity-80">by META TC</span></h1>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 text-blue-100 hover:text-white focus:outline-none"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Overlay for mobile */}
      {isMobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 z-30"
          onClick={closeMobileMenu}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed md:static inset-y-0 left-0 z-40 w-64 bg-blue-900 text-white flex flex-col shadow-xl transform transition-transform duration-300 ease-in-out ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="h-16 md:h-auto p-6 flex items-center gap-3 border-b border-blue-800">
          <GraduationCap size={28} className="text-blue-300" />
          <div className="hidden md:block">
            <h1 className="text-xl font-bold tracking-tight leading-none">Docente<span className="text-blue-300"> PRO</span></h1>
            <span className="text-xs font-medium text-blue-200 opacity-80">by META TC</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight md:hidden mt-1">Menú</h1>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={closeMobileMenu}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-blue-800 text-white font-medium' 
                    : 'text-blue-100 hover:bg-blue-800/50 hover:text-white'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-blue-800">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full text-left rounded-lg text-blue-200 hover:bg-red-600/90 hover:text-white transition-colors"
          >
            <LogOut size={20} />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-gray-50 pt-16 md:pt-0">
        <AccessProtection accessLevel={accessLevel} codeId={codeId}>
          <div className="p-4 md:p-8">
            <Outlet context={{ isGuest }} />
          </div>
        </AccessProtection>
      </main>
    </div>
  );
}
