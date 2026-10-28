#!/usr/bin/env python3
"""Modificación conservadora: aborta si el archivo no coincide con lo esperado."""
from pathlib import Path
p = Path('src/pages/CamilaFormato.tsx')
if not p.is_file(): raise SystemExit('ERROR: Ejecute desde la raíz del repositorio.')
s = p.read_text(encoding='utf-8')
if 'CamilaClaudeChat' in s:
    raise SystemExit('Ya existe una integración de CamilaClaudeChat; no se realizaron cambios.')
anchor = "import DocxPreviewViewer from '../components/formato/DocxPreviewViewer';"
if s.count(anchor) != 1: raise SystemExit('No coincide el import esperado. No se modificó nada.')
s = s.replace(anchor, anchor + "\nimport CamilaClaudeChat from '../components/camila/CamilaClaudeChat';", 1)
anchor = "  const [tabActiva, setTabActiva] = useState<'chat' | 'documento'>('chat');"
if s.count(anchor) != 1: raise SystemExit('No coincide el estado esperado. No se modificó nada.')
s = s.replace(anchor, anchor + "\n  const [claudeDemoVisible, setClaudeDemoVisible] = useState(false);", 1)
anchor = '      {/* BODY CONTENT: SPLIT EN DESKTOP, TABS EN MÓVIL */}'
if s.count(anchor) != 1: raise SystemExit('No coincide la sección esperada. No se modificó nada.')
new = '''      <div className="flex justify-end px-2">
        <button type="button" onClick={() => setClaudeDemoVisible(v => !v)}
          className="rounded-xl bg-cyan-700 px-4 py-2 text-xs font-semibold text-white">
          {claudeDemoVisible ? 'Volver a Camila Formato' : 'Probar conversación con Claude'}
        </button>
      </div>
      {claudeDemoVisible ? <div className="flex-1 min-h-0"><CamilaClaudeChat /></div> : (
'''
s = s.replace(anchor, new + anchor, 1)
anchor = '      {/* MODAL: MIS FORMATOS */}'
if s.count(anchor) != 1: raise SystemExit('No coincide el cierre esperado. No se modificó nada.')
s = s.replace(anchor, '      )}\n\n' + anchor, 1)
p.write_text(s, encoding='utf-8')
print('Integración aplicada solo a CamilaFormato.tsx; revise git diff y ejecute pruebas.')
