const fs = require('fs');

const archivo = 'src/pages/CamilaFormato.tsx';
let codigo = fs.readFileSync(archivo, 'utf8');

if (codigo.includes('CamilaClaudeChat')) {
  console.error('Camila Claude ya está integrada.');
  process.exit(1);
}

function insertar(texto, reemplazo) {
  if (codigo.split(texto).length !== 2) {
    throw new Error('No se encontró un punto único de integración.');
  }
  codigo = codigo.replace(texto, reemplazo);
}

insertar(
  'import DocxPreviewViewer from',
  'import CamilaClaudeChat from "../components/camila/CamilaClaudeChat";\nimport DocxPreviewViewer from'
);

insertar(
  'const [tabActiva, setTabActiva]',
  'const [claudeVisible, setClaudeVisible] = useState(false);\n  const [tabActiva, setTabActiva]'
);

insertar(
  '{/* BODY CONTENT: SPLIT EN DESKTOP, TABS EN MÓVIL */}',
  `<div className="flex justify-end px-2">
    <button type="button"
      onClick={() => setClaudeVisible(v => !v)}
      className="rounded-xl bg-cyan-700 px-4 py-2 text-xs font-semibold text-white">
      {claudeVisible ? 'Volver a Camila Formato' : 'Probar conversación con Claude'}
    </button>
  </div>
  {claudeVisible ? (
    <div className="flex-1 min-h-0"><CamilaClaudeChat /></div>
  ) : (
  {/* BODY CONTENT: SPLIT EN DESKTOP, TABS EN MÓVIL */}`
);

insertar(
  '{/* MODAL: MIS FORMATOS */}',
  ')}\n{/* MODAL: MIS FORMATOS */}'
);

fs.writeFileSync(archivo, codigo);
console.log('Integración aplicada. Pendiente verificar TypeScript.');
