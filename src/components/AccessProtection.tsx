import React, { useEffect } from 'react';

interface AccessProtectionProps {
  accessLevel: 'guest' | 'pro';
  codeId: string;
  children: React.ReactNode;
}

export default function AccessProtection({ accessLevel, codeId, children }: AccessProtectionProps) {
  const isGuest = accessLevel === 'guest';

  useEffect(() => {
    if (!isGuest) return;

    // Prevent copy, cut, and right-click
    const preventCapture = (e: Event) => {
      e.preventDefault();
      return false;
    };

    // Detect PrintScreen and clear clipboard
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'PrintScreen') {
        navigator.clipboard.writeText('');
        alert('Captura de pantalla no permitida para usuarios invitados.');
      }
      // Also block Ctrl+C, Ctrl+X, Ctrl+P
      if (e.ctrlKey && (e.key === 'c' || e.key === 'x' || e.key === 'p' || e.key === 's')) {
        e.preventDefault();
        if (e.key === 'p') {
          // Trigger print overlay message or just block
          return;
        }
      }
    };

    document.addEventListener('copy', preventCapture);
    document.addEventListener('cut', preventCapture);
    document.addEventListener('contextmenu', preventCapture);
    document.addEventListener('keydown', handleKeyDown);

    // Add a specialized print protection via CSS is done in the component below
    
    return () => {
      document.removeEventListener('copy', preventCapture);
      document.removeEventListener('cut', preventCapture);
      document.removeEventListener('contextmenu', preventCapture);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isGuest]);

  if (!isGuest) return <>{children}</>;

  return (
    <div className="relative isolate group/guest h-full">
      {/* Dynamic Watermark */}
      <div 
        className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden opacity-[0.03] select-none"
        style={{ transform: 'rotate(-45deg)', WebkitTransform: 'rotate(-45deg)' }}
      >
        <div className="flex flex-wrap gap-48 w-[200vw] h-[200vh] -translate-x-1/2 -translate-y-1/2">
          {Array.from({ length: 100 }).map((_, i) => (
            <div key={i} className="text-4xl font-black text-gray-900 whitespace-nowrap">
              GUEST: {codeId} • DOCENTE PRO
            </div>
          ))}
        </div>
      </div>

      {/* Print Protection Overlay (CSS media query based) */}
      <style>{`
        @media print {
          body {
            visibility: hidden !important;
          }
          .print-blocker {
            visibility: visible !important;
            position: fixed;
            inset: 0;
            background: #000;
            color: #fff;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 2rem;
            text-align: center;
          }
        }
        
        /* Disable text selection for guest */
        .guest-mode {
          -webkit-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
          user-select: none;
        }
      `}</style>
      
      <div className="print-blocker hidden">
        CONTENIDO PROTEGIDO<br />
        Acceso de Invitado no permite impresión
      </div>

      <div className="guest-mode h-full">
        {children}
      </div>
    </div>
  );
}
