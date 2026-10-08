import React from 'react';
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
  Terminal
} from 'lucide-react';
import { motion } from 'motion/react';
import { openWhatsApp } from '../lib/whatsapp';

export default function Home() {
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
    const text = "Hola Reymon, vengo de la plataforma Docenty PRO. Me gustaría consultar sobre tus servicios de programación y desarrollo web.";
    openWhatsApp(text);
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-12 pb-12"
    >
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
            Docenty PRO no es una herramienta estática. Evolucionamos semanalmente incorporando nuevas funciones basadas en las sugerencias de nuestros más de 1200 usuarios.
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
                { label: 'Gestor Avanzado de PPA', desc: 'Proyectos de Aprendizaje estructurados en segundos.' },
                { label: 'Control Digital de Asistencia', desc: 'Reportes automáticos por estudiante y sección.' },
                { label: 'Sección Maternal Especializada', desc: 'Herramientas adaptadas a las primeras etapas.' },
                { label: 'Planificador de Aula Diario', desc: 'Inicio, desarrollo y cierre optimizados.' },
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
                  CONTRATACIÓN Y SERVICIOS WEB
                </button>
                <p className="text-slate-500 text-[10px] mt-4 uppercase tracking-[0.2em] font-bold">Consulte presupuesto para desarrollos personalizados</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
