import ReactMarkdown from 'react-markdown';
import { GraduationCap, ArrowLeft, ShieldCheck, FileText } from 'lucide-react';
import privacidadMarkdown from '../../docs/legal/POLITICA_PRIVACIDAD_2026-11-16.md?raw';
import terminosMarkdown from '../../docs/legal/TERMINOS_CONDICIONES_2026-11-16.md?raw';

interface Props { kind: 'privacidad' | 'terminos' }

export default function LegalPage({ kind }: Props) {
  const privacy = kind === 'privacidad';
  const content = privacy ? privacidadMarkdown : terminosMarkdown;
  const title = privacy ? 'Política de Privacidad' : 'Términos y Condiciones';

  return (
    <div className="min-h-screen bg-[#100b1f] text-slate-200 px-4 py-8 sm:py-12">
      <main className="max-w-3xl mx-auto">
        <div className="flex flex-wrap gap-3 items-center justify-between mb-6">
          <a href="/" className="inline-flex items-center gap-2 text-cyan-300 hover:text-cyan-200 font-bold text-sm">
            <ArrowLeft size={17} /> Volver a DOCENTY PRO
          </a>
          <span className="inline-flex items-center gap-2 text-white font-black">
            <GraduationCap size={21} className="text-cyan-400" /> DOCENTY <span className="text-cyan-300">PRO</span>
          </span>
        </div>
        <div className="rounded-3xl border border-white/10 bg-[#1d1730] shadow-2xl px-5 py-7 sm:px-9 sm:py-10">
          <div className="flex gap-2 items-center text-cyan-300 text-xs font-bold uppercase tracking-widest mb-5">
            {privacy ? <ShieldCheck size={17} /> : <FileText size={17} />}
            Información legal vigente
          </div>
          <article aria-label={title} className="space-y-3">
            <ReactMarkdown components={{
              h1: ({ children }) => <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight mb-5">{children}</h1>,
              h2: ({ children }) => <h2 className="text-lg sm:text-xl font-bold text-cyan-200 border-t border-white/10 pt-6 mt-7 mb-3">{children}</h2>,
              h3: ({ children }) => <h3 className="text-base sm:text-lg font-bold text-white mt-4">{children}</h3>,
              p: ({ children }) => <p className="text-sm sm:text-base leading-7 my-3 text-slate-200">{children}</p>,
              strong: ({ children }) => <strong className="font-bold text-white">{children}</strong>,
              ul: ({ children }) => <ul className="list-disc pl-5 space-y-1 text-slate-200">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal pl-5 space-y-1 text-slate-200">{children}</ol>,
              li: ({ children }) => <li className="text-sm sm:text-base leading-7">{children}</li>,
              a: ({ href, children }) => <a href={href} className="text-cyan-300 underline break-all">{children}</a>,
            }}>{content}</ReactMarkdown>
          </article>
          <div className="border-t border-white/10 mt-8 pt-5 flex flex-wrap gap-4 text-sm">
            <a href="/legal/privacidad" className={privacy ? 'text-white font-bold' : 'text-cyan-300 hover:underline'}>Privacidad</a>
            <a href="/legal/terminos" className={!privacy ? 'text-white font-bold' : 'text-cyan-300 hover:underline'}>Términos y condiciones</a>
            <a href="mailto:monetizacionreymonfr2@gmail.com" className="text-cyan-300 hover:underline">Contacto legal</a>
          </div>
        </div>
      </main>
    </div>
  );
}
