import React from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  Users, 
  Lightbulb, 
  Target, 
  ShieldCheck, 
  Smartphone,
  MessageCircle,
  BarChart3,
  Rocket
} from 'lucide-react';
import { motion } from 'motion/react';
import { openWhatsApp } from '../lib/whatsapp';

export default function EarnMoney() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const handleJoinChat = () => {
    const text = "Hola Reymon, estoy interesado en el modelo de negocio 'Ganar dinero con docentes'. Me gustaría unirme como promotor.";
    openWhatsApp(text);
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-12 pb-20"
    >
      {/* Header Section */}
      <motion.div variants={itemVariants} className="text-center space-y-4">
        <div className="inline-block px-4 py-1.5 rounded-full bg-futuristic-purple/10 border border-futuristic-purple/30 mb-2">
          <span className="text-[10px] font-black tracking-[0.4em] text-futuristic-purple uppercase">Network Expansion Protocol</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-white uppercase italic">
          Ganar Dinero con <span className="text-futuristic-accent">DOCENTE PRO</span>
        </h1>
        <p className="text-slate-400 max-w-2xl mx-auto text-lg font-medium">
          Únete a nuestra red de promotores y genera ingresos ayudando a transformar la educación en Venezuela.
        </p>
      </motion.div>

      {/* Business Model Card */}
      <motion.div 
        variants={itemVariants} 
        className="glass-effect rounded-[2.5rem] p-8 md:p-12 neon-border relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-futuristic-purple/10 blur-[100px] rounded-full"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-futuristic-purple/20 rounded-2xl border border-futuristic-purple/30 text-futuristic-purple">
              <TrendingUp size={28} />
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-white italic uppercase tracking-tighter">2. Modelo de Negocio y Ganancias</h2>
          </div>
          
          <p className="text-slate-300 mb-8 leading-relaxed max-w-3xl">
            El esquema de comisiones está diseñado para premiar el volumen de ventas, ofreciendo un margen de ganancia del <span className="text-white font-black">50% directo</span> para el Promotor.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <div className="bg-white/5 border border-white/10 p-6 rounded-3xl text-center">
              <p className="text-[10px] font-black tracking-widest text-white/40 uppercase mb-2">Precio de Venta</p>
              <p className="text-3xl font-black text-white">$2 <span className="text-sm font-normal text-slate-500">(Tasa BCV)</span></p>
              <p className="text-[10px] text-futuristic-accent mt-1">30 días de acceso</p>
            </div>
            <div className="bg-futuristic-purple/10 border border-futuristic-purple/20 p-6 rounded-3xl text-center shadow-[0_10px_30px_rgba(112,0,255,0.1)]">
              <p className="text-[10px] font-black tracking-widest text-futuristic-purple uppercase mb-2">Tu Ganancia Neta</p>
              <p className="text-3xl font-black text-white">$1</p>
              <p className="text-[10px] text-futuristic-purple mt-1">Por cada activación</p>
            </div>
            <div className="bg-white/5 border border-white/10 p-6 rounded-3xl text-center">
              <p className="text-[10px] font-black tracking-widest text-white/40 uppercase mb-2">Retorno META TC</p>
              <p className="text-3xl font-black text-white">$1</p>
              <p className="text-[10px] text-white/40 mt-1">Mantenimiento de Red</p>
            </div>
          </div>

          <div className="bg-gradient-to-r from-futuristic-purple/20 to-transparent p-6 rounded-2xl border-l-4 border-futuristic-purple">
            <div className="flex items-center gap-3 mb-2">
              <BarChart3 className="text-futuristic-purple" size={20} />
              <p className="text-white font-bold uppercase tracking-tight">Ejemplo de Proyección</p>
            </div>
            <p className="text-slate-400 text-sm">
              Si logras afiliar a <span className="text-white font-bold">50 maestros</span> en una semana visitando un par de instituciones, tu ganancia neta y directa será de <span className="text-futuristic-accent font-black text-xl">$50</span>.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Methodology Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div variants={itemVariants} className="glass-effect rounded-[2.5rem] p-8 neon-border border-l-futuristic-accent/50 border-l-4">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-futuristic-accent/10 rounded-2xl border border-futuristic-accent/30 text-futuristic-accent">
              <ShieldCheck size={24} />
            </div>
            <h2 className="text-xl font-black text-white italic uppercase tracking-tighter">3. Metodología de Trabajo y Control</h2>
          </div>
          <p className="text-slate-400 text-sm mb-6 leading-relaxed">
            Para garantizar transparencia y facilitar la venta, el proceso es simple y personalizado por cada docente.
          </p>
          <ul className="space-y-4">
            {[
              { icon: <Target size={16} />, title: "Venta Directa", text: "Tú vendes el código al docente por $2 (Tasa BCV). El docente activa sus 30 días." },
              { icon: <MessageCircle size={16} />, title: "Contacto Inmediato", text: "Al realizar la venta, te comunicas directamente conmigo por mi botón de WhatsApp." },
              { icon: <DollarSign size={16} />, title: "Transacción de Registro", text: "Solo realizas la transacción de $1 (Tasa BCV) por cada código vendido." },
              { icon: <BarChart3 size={16} />, title: "Control SaaS", text: "META TC monitorea en tiempo real el uso de los códigos desde el panel de administración." }
            ].map((item, id) => (
              <li key={id} className="flex gap-4 p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors group">
                <div className="text-futuristic-accent mt-1 group-hover:scale-110 transition-transform">{item.icon}</div>
                <div>
                  <span className="block text-white font-bold text-sm tracking-tight">{item.title}</span>
                  <span className="text-slate-500 text-xs">{item.text}</span>
                </div>
              </li>
            ))}
          </ul>
        </motion.div>

        <motion.div variants={itemVariants} className="glass-effect rounded-[2.5rem] p-8 neon-border border-l-futuristic-magenta/50 border-l-4">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-futuristic-magenta/10 rounded-2xl border border-futuristic-magenta/30 text-futuristic-magenta">
              <Lightbulb size={24} />
            </div>
            <h2 className="text-xl font-black text-white italic uppercase tracking-tighter">4. Guía Táctica (Vende Más)</h2>
          </div>
          <div className="space-y-6">
            <div className="space-y-2">
              <p className="text-futuristic-magenta font-black text-xs uppercase tracking-widest">1. La Demostración ("Efecto Guau")</p>
              <p className="text-slate-400 text-sm leading-relaxed">
                Entra a una sala de profesores. Pide un tema al azar. Saca tu teléfono, abre la <span className="text-white font-bold">IA Camila</span> y genera una planificación en 10 segundos. La plataforma se vende sola cuando la ven funcionar.
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-futuristic-magenta font-black text-xs uppercase tracking-widest">2. El Aliado Estratégico (El Director)</p>
              <p className="text-slate-400 text-sm leading-relaxed">
                Ofrécele un código de cortesía gratis al Director o Coordinador del plantel. Si a la directiva le gusta, sugerirán fuertemente a todo el personal usar <span className="text-white font-bold">Docenty PRO</span>.
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-futuristic-magenta font-black text-xs uppercase tracking-widest">3. Cierre por Lotes (Venta a Sección)</p>
              <p className="text-slate-400 text-sm leading-relaxed">
                Reúne a todos los maestros de un mismo grado. Si todos compran, ofréceles hacerles la inducción tú mismo sobre el uso avanzado.
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* CTA Section */}
      <motion.div variants={itemVariants} className="text-center space-y-8 py-12 relative overflow-hidden rounded-[3rem]">
        <div className="absolute inset-0 bg-gradient-to-b from-futuristic-purple/20 to-transparent blur-[80px]"></div>
        <div className="relative z-10 space-y-6">
          <Rocket className="w-16 h-16 text-futuristic-accent mx-auto animate-bounce mb-4" />
          <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic">¿Listo para formar parte del equipo?</h2>
          <p className="text-slate-400 max-w-xl mx-auto font-medium">
            Si quieres unirte a nuestra red de promotores ahora mismo, pulsa el botón de WhatsApp para hablar directamente con Reymon Castillo.
          </p>
          <button 
            onClick={handleJoinChat}
            className="inline-flex items-center gap-4 bg-gradient-to-r from-futuristic-purple to-futuristic-magenta text-white font-black px-12 py-6 rounded-2xl shadow-[0_20px_50px_rgba(112,0,255,0.3)] hover:scale-105 active:scale-95 transition-all text-xl group border border-white/20"
          >
            <MessageCircle size={32} className="fill-white group-hover:rotate-12 transition-transform" />
            UNIRME AL PROGRAMA
          </button>
          <div className="flex items-center justify-center gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-futuristic-accent animate-pulse"></div>
            <span className="text-[10px] font-black text-white/30 tracking-[0.3em] uppercase">Meta TC Partners Program v1.0</span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
