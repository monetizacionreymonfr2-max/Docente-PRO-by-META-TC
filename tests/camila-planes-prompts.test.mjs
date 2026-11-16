import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

test('Camila informa los dos planes sin prometer automatización de WhatsApp', () => {
  const reglas = read('src/lib/camila/instruccionesPlanes.ts');
  assert.match(reglas, /Plan PRO: USD 2 por 30 días/);
  assert.match(reglas, /Plan PLUS: USD 5 por 30 días/);
  assert.match(reglas, /atención de WhatsApp es MANUAL/);
  assert.match(reglas, /código de atención permanente/);
  assert.match(reglas, /DIFERENTE del código de activación/);
  assert.match(reglas, /Nunca afirmes haber revisado, activado/);
});

test('Camila chat y ventas incorporan el prompt común sin perder pautas pedagógicas', () => {
  const camila = read('src/pages/Camila.tsx');
  assert.match(camila, /import \{ INSTRUCCIONES_PLANES_CAMILA \}/);
  assert.equal((camila.match(/\$\{INSTRUCCIONES_PLANES_CAMILA\}/g) || []).length, 2);
  assert.match(camila, /CURRÍCULO OFICIAL EDUCACIÓN PRIMARIA MPPE/);
  assert.match(camila, /MODALIDAD DE EDUCACIÓN ESPECIAL/);
  assert.doesNotMatch(camila, /Somos más de 1200 docentes/);
  assert.match(camila, /Plan Plus por \$5 durante 30 días/);
});

test('La voz explica Plus como atención humana sin afirmar funciones no habilitadas', () => {
  const voice = read('api/camila-live-token.js');
  assert.match(voice, /PLAN PLUS: cinco dólares por treinta días/);
  assert.match(voice, /WhatsApp se atiende manualmente/);
  assert.match(voice, /no envías mensajes automáticos/);
  assert.match(voice, /No prometas que Mi Formato está habilitado/);
  assert.match(voice, /No pidas datos personales de menores/);
});
