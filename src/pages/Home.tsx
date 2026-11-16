import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { 
  CheckCircle2, 
  Cpu, 
  Globe, 
  MessageCircle, 
  Rocket, 
  Target, 
  User, 
  ShieldCheck,
  Code,
  Layout as LayoutIcon,
  ShoppingBag,
  Terminal,
  Sparkles,
  X,
  FileText
} from 'lucide-react';
import { motion } from 'motion/react';
import { getCamilaPlusWhatsAppMessage, openWhatsApp } from '../lib/whatsapp';

export default function Home() {
  const { teacherId, customerCode, planType, isAdmin } = useOutletContext<{
    teacherId: string;
    customerCode?: string;
    planType?: 'pro' | 'plus';
    isAdmin?: boolean;
  }>();
  const [mostrarAvisoPlus, setMostrarAvisoPlus] = useState(false);

  // Cada docente ve el aviso una sola vez en este dispositivo/navegador.
  // Se conserva el acceso a la tarjeta informativa después de cerrar el aviso.
  const avisoKey = `docenty:aviso-camila-plus-v1:${teacherId}`;
  useEffect(() => {
    if (!teacherId || isAdmin || planType === 'plus') {
      setMostrarAvisoPlus(false);
      return;
    }
    try {
      setMostrarAvisoPlus(window.localStorage.getItem(avisoKey) !== '1');
    } catch {
      setMostrarAvisoPlus(true);
    }
  }, [avisoKey, teacherId, isAdmin, planType]);

  const cerrarAvisoPlus = () => {
    setMostrarAvisoPlus(false);
    try {
      window.localStorage.setItem(avisoKey, '1');
    } catch {
      // El aviso puede cerrarse incluso con almacenamiento restringido.
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const handleWhatsAppContact = () => {
    openWhatsApp(getCamilaPlusWhatsAppMessage(customerCode || ''));
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-12 pb-12"
    >
      {mostrarAvisoPlus && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="camila-plus-aviso-titulo"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
        >
          <div className="relative w-full max-w-lg rounded-[2rem] border border-futuristic-accent/30 bg-[#191329] p-6 sm:p-8 shadow-2xl text-left">
            <button
              type="button"
              onClick={cerrarAvisoPlus}
              aria-label="Cerrar novedad Camila Plus"
              className="absolute right-4 top-4 p-2 rounded-full text-slate-300 hover:text-white hover:bg-white/10"
            >
              <X size={20} />
            </button>
            <span className="inline-flex items-center gap-2 text-futuristic-accent font-bold text-xs uppercase tracking-widest mb-4">
              <Sparkles size={16} /> Novedad en DOCENTY PRO
            </span>
            <h2 id="camila-plus-aviso-titulo" className="text-white font-black text-2xl sm:text-3xl mb-3">
              Conoce Camila Plus
            </h2>
            <p className="text-slate-200 text-sm leading-relaxed mb-4">
              Ahora puedes solicitar proyectos pedagógicos y planificaciones semanales mediante WhatsApp,
              adaptados a los datos de tu aula y al formato de tu institución.
            </p>
            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 mb-4">
              <p className="text-white font-bold text-sm">Plan Pro: $2 / 30 días</p>
              <p className="text-futuristic-accent font-bold text-sm mt-1">Camila Plus: $5 / 30 días</p>
              <p className="text-slate-400 text-xs mt-2">Tu Plan Pro continúa disponible sin cambios. Plus es opcional.</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button type="button" onClick={cerrarAvisoPlus}
                className="rounded-xl py-3 px-5 border border-white/20 text-slate-200 font-bold text-sm hover:bg-white/10">
                Ahora no
              </button>
              <button type="button" onClick={() => { cerrarAvisoPlus(); handleWhatsAppContact(); }}
                className="rounded-xl py-3 px-5 bg-green-600 hover:bg-green-500 text-white font-bold text-sm flex-1 flex items-center justify-center gap-2">
                <MessageCircle size={18} /> Consultar Camila Plus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <motion.div variants={itemVariants} className="text-center space-y-4">
        <div className="inline-block px-4 py-1.5 rounded-full glass-effect border border-futuristic-accent/30 mb-4">
          <span className="text-xs font-black tracking-[0.3em] text-futuristic-accent uppercase">Sincronización de Biomas de Datos</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-white">
          DOCENTY <span className="text-transparent bg-clip-text bg-gradient-to-r from-futuristic-purple to-futuristic-magenta">PRO</span>
        </h1>
        <p className="text-slate-300 max-w-2xl mx-auto text-lg">
          La evolución digital de la pedagogía venezolana. Inteligencia Artificial diseñada para elevar el estándar educativo.
        </p>
      </motion.div>

      {/* Tarjeta permanente para que la novedad siga visible tras cerrar el aviso */}
      <motion.section variants={itemVariants}
        aria-label="Camila Plus"
        className="rounded-[2rem] border border-futuristic-accent/30 bg-gradient-to-br from-[#241b42] to-[#131526] p-6 md:p-8 shadow-xl"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="w-12 h-12 shrink-0 flex items-center justify-center rounded-2xl bg-futuristic-accent/15 text-futuristic-accent">
            <FileText size={25} />
          </div>
          <div className="flex-1">
            <p className="text-futuristic-accent font-black text-xs uppercase tracking-widest">Nueva opción de atención</p>
            <h2 className="text-2xl text-white font-black mt-1">Camila Plus por WhatsApp</h2>
            <p className="text-slate-300 text-sm mt-2 leading-relaxed">
              Tus proyectos pedagógicos y planificaciones semanales, basados en los datos de tu aula
              y adaptados al formato de tu escuela. Incluye las herramientas de DOCENTY PRO.
            </p>
            <p className="text-white text-sm font-bold mt-2">Plan Plus: $5 por 30 días.
              {planType !== 'plus' && <span className="text-slate-300 font-normal"> Tu Plan Pro se mantiene vigente según tu suscripción.</span>}
            </p>
          </div>
          <button type="button" onClick={handleWhatsAppContact}
            className="w-full sm:w-auto shrink-0 rounded-2xl px-5 py-3 bg-green-600 hover:bg-green-500 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg"
          >
            <MessageCircle size={18} /> Consultar por WhatsApp
          </button>
        </div>
      </motion.section>

      {/* Objectives Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <motion.div variants={itemVariants} className="glass-effect p-8 rounded-[2rem] neon-border group hover:bg-white/5 transition-all">
          <div className="w-12 h-12 rounded-2xl bg-futuristic-purple/20 flex items-center justify-center mb-6 border border-futuristic-purple/30 text-futuristic-purple group-hover:scale-110 transition-transform">
            <Target size={24} />
          </div>
          <h3 className="text-xl font-bold text-white mb-3">Misión Pedagógica</h3>
          <p className="text-slate-300 text-sm leading-relaxed">
            Nuestra meta es liberar al docente de la carga administrativa pesada, permitiéndole enfocarse plenamente en lo que realmente importa: la formación de sus estudiantes.
          </p>
        </motion.div>

        <motion.div variants={itemVariants} className="glass-effect p-8 rounded-[2rem] neon-border group hover:bg-white/5 transition-all">
          <div className="w-12 h-12 rounded-2xl bg-futuristic-magenta/20 flex items-center justify-center mb-6 border border-futuristic-magenta/30 text-futuristic-magenta group-hover:scale-110 transition-transform">
            <Cpu size={24} />
          </div>
          <h3 className="text-xl font-bold text-white mb-3">Poder de la IA</h3>
          <p className="text-slate-300 text-sm leading-relaxed">
            Utilizamos algoritmos de última generación para generar proyectos PPA, planificaciones diarias y boletines que cumplen estrictamente con los estándares curriculares del país.
          </p>
        </motion.div>

        <motion.div variants={itemVariants} className="glass-effect p-8 rounded-[2rem] neon-border group hover:bg-white/5 transition-all">
          <div className="w-12 h-12 rounded-2xl bg-futuristic-accent/20 flex items-center justify-center mb-6 border border-futuristic-accent/30 text-futuristic-accent group-hover:scale-110 transition-transform">
            <Rocket size={24} />
          </div>
          <h3 className="text-xl font-bold text-white mb-3">Innovación Constante</h3>
          <p className="text-slate-300 text-sm leading-relaxed">
            Docenty PRO no es una herramienta estática. Evolucionamos incorporando nuevas funciones basadas en las necesidades de los docentes que utilizan nuestra plataforma.
          </p>
        </motion.div>
      </div>

      {/* Content Breakdown */}
      <motion.div variants={itemVariants} className="glass-effect rounded-[2.5rem] p-8 md:p-12 neon-border overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-futuristic-purple/10 blur-[100px] rounded-full"></div>
        
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">¿Qué contiene el ecosistema?</h2>
            <ul className="space-y-4">
              {[
                { label: 'Gestor Avanzado de PPA', desc: 'Proyectos de Aprendizaje estructurados en segundos (Lineamientos 2026-2027).' },
                { label: 'Educación Especial & Socioproductivo', desc: 'Planes DUA, ajustes para autismo y TEL, plan de inversión y línea de producción.' },
                { label: 'Control Digital de Asistencia', desc: 'Reportes automáticos por estudiante y sección.' },
                { label: 'Sección Maternal Especializada', desc: 'Herramientas adaptadas a las primeras etapas.' },
                { label: 'Planificador de Aula Diario', desc: 'Inicio, desarrollo y cierre optimizados con DUA.' },
                { label: 'Generador Pro de Boletines', desc: 'Evaluación cualitativa y cuantitativa fluida.' }
              ].map((item, idx) => (
                <li key={idx} className="flex gap-4 group">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-futuristic-accent/20 flex items-center justify-center border border-futuristic-accent/40 mt-1">
                    <CheckCircle2 size={14} className="text-futuristic-accent" />
                  </div>
                  <div>
                    <span className="block text-white font-bold">{item.label}</span>
                    <span className="text-slate-300 text-sm">{item.desc}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-white/5 rounded-3xl p-6 border border-white/10 backdrop-blur-2xl">
             <div className="aspect-video bg-gradient-to-br from-futuristic-purple/20 to-futuristic-magenta/20 rounded-2xl flex items-center justify-center border border-white/5 relative overflow-hidden">
                <Terminal className="text-white/20 w-32 h-32 absolute -bottom-8 -right-8 rotate-12" />
                <div className="text-center space-y-2 relative z-10">
                   <div className="w-16 h-1 w-16 bg-futuristic-accent mx-auto rounded-full mb-4"></div>
                   <p className="text-futuristic-accent font-black tracking-widest text-xs">STATUS: OPTIMIZED</p>
                   <p className="text-white font-bold text-xl uppercase tracking-tighter">Motor de Ejecución V4.0</p>
                </div>
             </div>
          </div>
        </div>
      </motion.div>

      {/* Creator Profile - Spectacular Section */}
      <motion.div variants={itemVariants} className="relative py-12">
        <div className="absolute inset-0 bg-gradient-to-r from-futuristic-purple/10 via-transparent to-futuristic-magenta/10 blur-[120px]"></div>
        
        <div className="relative glass-effect rounded-[3rem] p-8 md:p-16 neon-border">
          <div className="flex flex-col lg:flex-row gap-12 items-center">
            <div className="w-48 h-48 md:w-64 md:h-64 rounded-[3rem] overflow-hidden border-2 border-futuristic-purple/50 shadow-[0_0_30px_rgba(112,0,255,0.3)] rotate-3">
               {/* This would be an image of Reymon, using a fallback for now */}
               <div className="w-full h-full bg-gradient-to-tr from-slate-900 to-futuristic-purple flex items-center justify-center">
                  <User size={80} className="text-white/20" />
               </div>
            </div>
            
            <div className="flex-1 space-y-6 text-center lg:text-left">
              <div>
                <h4 className="text-futuristic-magenta font-black tracking-widest text-sm mb-2 uppercase">EL ARQUITECTO</h4>
                <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase italic">REYMON CASTILLO</h2>
                <p className="text-futuristic-accent font-bold tracking-widest text-xs mt-2 uppercase">INGENIERO DE SISTEMAS • PROGRAMADOR FULL STACK</p>
              </div>
              
              <p className="text-slate-300 leading-relaxed text-lg">
                Nacido en el corazón del llano venezolano, en el **Estado Apure**, Reymon Castillo es la mente maestra detrás de ecosistemas digitales que están redefiniendo el comercio y la educación en Venezuela. Como experto en **Programación Web** y **Dropshipping**, ha dedicado su carrera a construir puentes entre la tecnología avanzada y las necesidades reales del país.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { icon: <Globe size={18} />, label: 'Fundador de META TC', desc: 'Tiendas Online de alto impacto.' },
                  { icon: <ShoppingBag size={18} />, label: 'Tecno Mundo Castillo', desc: 'La franquicia tecnológica de referencia.' },
                  { icon: <Code size={18} />, label: 'Especialista Full Stack', desc: 'Dominio de arquitecturas modernas.' },
                  { icon: <ShieldCheck size={18} />, label: 'Arquitecto Docenty PRO', desc: 'Liderando la revolución pedagógica.' }
                ].map((stat, i) => (
                  <div key={i} className="flex gap-4 p-4 rounded-2xl bg-white/5 border border-white/5">
                    <div className="text-futuristic-accent">{stat.icon}</div>
                    <div>
                      <span className="block text-white font-bold text-sm tracking-tight">{stat.label}</span>
                      <span className="text-slate-300 text-[11px] font-medium uppercase tracking-wider">{stat.desc}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-8">
                <button 
                  onClick={handleWhatsAppContact}
                  className="flex items-center gap-3 bg-gradient-to-r from-green-600 to-emerald-500 hover:scale-105 active:scale-95 text-white font-black px-10 py-5 rounded-2xl shadow-[0_15px_30px_rgba(34,197,94,0.3)] transition-all mx-auto lg:mx-0 group"
                >
                  <MessageCircle size={24} className="fill-white" />
                  <span className="text-center">WHATSAPP OFICIAL DE CAMILA PLUS</span>
                </button>
                <p className="text-slate-300 text-xs mt-4 font-semibold">
                  Proyectos pedagógicos y planificaciones semanales en el formato de tu institución.
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
