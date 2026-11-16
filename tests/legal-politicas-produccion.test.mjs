import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const base = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => fs.readFileSync(path.join(base,p), 'utf8');

test('Política vigente identifica titular, email y conservación hasta 10 años', () => {
  const s = read('docs/legal/POLITICA_PRIVACIDAD_2026-11-16.md');
  assert.match(s, /Reymon Castillo/);
  assert.match(s, /monetizacionreymonfr2@gmail.com/);
  assert.match(s, /diez \(10\) años/);
  assert.match(s, /podrán eliminarse \*\*antes\*\*/);
  assert.match(s, /niños, niñas y adolescentes/);
  assert.match(s, /WhatsApp\/Meta/);
  assert.match(s, /Vigente desde el 16 de noviembre de 2026/);
});

test('Condiciones vigentes contemplan Pro Plus pago voluntario y reembolsos justos', () => {
  const s = read('docs/legal/TERMINOS_CONDICIONES_2026-11-16.md');
  assert.match(s, /Plan Pro:\*\* USD 2 por 30 días/);
  assert.match(s, /Plan Plus:\*\* USD 5 por 30 días/);
  assert.match(s, /No existe renovación ni cobro automático/);
  assert.match(s, /siete \(7\) días calendario/);
  assert.match(s, /cobro duplicado/);
  assert.match(s, /incumplimiento sustancial/);
  assert.match(s, /No se excluyen derechos/);
  assert.match(s, /prompts de sistema/);
});

test('Página legal accesible antes del login, y enlaces desde interfaz', () => {
  const app = read('src/App.tsx');
  const page = read('src/pages/LegalPage.tsx');
  const login = read('src/pages/Login.tsx');
  const layout = read('src/components/layout/Layout.tsx');
  assert.match(app, /pathname === '\/legal\/privacidad'/);
  assert.match(app, /pathname === '\/legal\/terminos'/);
  assert.ok(app.indexOf("pathname === '/legal/privacidad'") < app.indexOf('if (!user)'));
  assert.match(page, /POLITICA_PRIVACIDAD_2026-11-16\.md\?raw/);
  assert.match(page, /TERMINOS_CONDICIONES_2026-11-16\.md\?raw/);
  assert.match(login, /href="\/legal\/terminos"/);
  assert.match(layout, /href="\/legal\/privacidad"/);
});

test('El consentimiento está versionado y con validación por servidor', () => {
  const gate = read('src/components/LegalConsentGate.tsx');
  const sql = read('supabase/migrations/20261116043000_legal_acceptances.sql');
  assert.match(gate, /checked=\{checked\}/);
  assert.match(gate, /accept_docenty_legal/);
  assert.match(sql, /SECURITY DEFINER/);
  assert.match(sql, /ENABLE ROW LEVEL SECURITY/);
  assert.match(sql, /auth\.uid\(\)/);
  assert.match(sql, /ON CONFLICT \(user_id, version\) DO NOTHING/);
});
