import { motion, AnimatePresence } from 'motion/react';
import { Lock, Zap, MessageSquare, ChevronRight } from 'lucide-react';

interface LimitReachedModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LimitReachedModal({ isOpen, onClose }: LimitReachedModalProps) {
  const WHATSAPP_NUMBER = '584126830537'; // Number from previous context/common VZ number pattern
  const WHATSAPP_MESSAGE = encodeURIComponent('Hola, vengo de DOCENTE PRO. Alcancé el límite de invitado y quiero adquirir un código PRO por $1.');
  const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MESSAGE}`;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          {/* Backdrop blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm"
          />

          {/* Modal content */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl border border-white/20"
          >
            {/* Gradient Header */}
            <div className="bg-gradient-to-br from-indigo-600 via-blue-600 to-indigo-700 p-8 text-center text-white relative">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Lock size={120} />
              </div>
              
              <div className="relative z-10">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl mb-6 shadow-inner">
                  <Lock className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-3xl font-black tracking-tight mb-2">
                  ¡Límite de prueba alcanzado!
                </h2>
                <div className="inline-block px-3 py-1 bg-yellow-400 text-yellow-900 text-xs font-bold rounded-full uppercase tracking-widest mb-4">
                  Trial version
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="p-8 text-center">
              <p className="text-gray-600 leading-relaxed mb-8">
                Has generado tus <span className="font-bold text-gray-900">3 proyectos gratuitos</span>. 
                Para seguir creando sin límites, descargar tus archivos y quitar las marcas de agua, actualiza a la versión <span className="text-blue-600 font-bold italic underline decoration-blue-200 decoration-4 underline-offset-2">PRO</span>.
              </p>

              <div className="space-y-4 mb-8">
                <div className="bg-gray-50 rounded-2xl p-6 flex flex-col items-center justify-center border border-gray-100">
                  <span className="text-gray-500 text-sm font-medium uppercase tracking-wider mb-1">Inversión única</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-black text-gray-900">$1</span>
                    <span className="text-xl font-bold text-gray-500 uppercase">usd</span>
                  </div>
                </div>
              </div>

              {/* WhatsApp Button */}
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noreferrer"
                className="group relative flex items-center justify-center gap-3 w-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold py-4 px-6 rounded-2xl transition-all shadow-lg hover:shadow-xl active:scale-[0.98] overflow-hidden"
              >
                {/* Pulse animation effect */}
                <span className="absolute inset-0 bg-white/20 animate-pulse-slow pointer-events-none" />
                
                <div className="flex items-center gap-3 relative z-10">
                  <MessageSquare className="w-6 h-6 animate-bounce" />
                  <span className="text-lg">Obtener Código PRO por $1</span>
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </div>
              </a>

              <button
                onClick={onClose}
                className="mt-6 text-gray-400 text-sm font-medium hover:text-gray-600 transition-colors"
              >
                Tal vez después
              </button>
            </div>

            {/* Features list (mini) */}
            <div className="bg-gray-50/50 p-6 grid grid-cols-2 gap-4 border-t border-gray-100">
              <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
                <Zap className="w-4 h-4 text-yellow-500" />
                Generaciones Ilimitadas
              </div>
              <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
                <Zap className="w-4 h-4 text-blue-500" />
                Sin Marcas de Agua
              </div>
            </div>
          </motion.div>
          
          <style>{`
            @keyframes pulse-slow {
              0%, 100% { opacity: 0; }
              50% { opacity: 0.2; }
            }
            .animate-pulse-slow {
              animation: pulse-slow 3s infinite ease-in-out;
            }
          `}</style>
        </div>
      )}
    </AnimatePresence>
  );
}
