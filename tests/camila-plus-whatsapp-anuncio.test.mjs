import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const home = readFileSync(new URL('../src/pages/Home.tsx', import.meta.url), 'utf8');
const helper = readFileSync(new URL('../src/lib/whatsapp.ts', import.meta.url), 'utf8');
const layout = readFileSync(new URL('../src/components/layout/Layout.tsx', import.meta.url), 'utf8');
const activation = readFileSync(new URL('../src/components/ActivationModal.tsx', import.meta.url), 'utf8');
const limit = readFileSync(new URL('../src/components/LimitReachedModal.tsx', import.meta.url), 'utf8');

test('El botón principal presenta el WhatsApp de Camila Plus', () => {
  assert.match(home, /WHATSAPP OFICIAL DE CAMILA PLUS/);
  assert.doesNotMatch(home, /CONTRATACIÓN Y SERVICIOS WEB/);
  assert.doesNotMatch(home, /servicios de programación y desarrollo web/);
  assert.match(home, /getCamilaPlusWhatsAppMessage\(customerCode \|\| ''\)/);
  assert.match(helper, /Plan Camila Plus de \$5 por 30 días/);
  assert.match(helper, /documentos institucionales y materiales de apoyo educativo/);
});

test('El aviso de novedad se muestra una vez por docente y dispositivo', () => {
  assert.match(home, /docenty:aviso-camila-plus-v2:/);
  assert.match(home, /localStorage\.getItem\(avisoKey\)/);
  assert.match(home, /localStorage\.setItem\(avisoKey, '1'\)/);
  assert.match(home, /mostrarAvisoPlus &&/);
  assert.match(home, /Camila Plus por WhatsApp/);
  assert.match(home, /Solicitudes por escrito \(sin audios\)/);
  assert.match(layout, /<Outlet context=\{\{[^}]*customerCode, planType/);
});

test('El contacto utiliza el número configurado e incluye código permanente si es válido', () => {
  assert.match(helper, /getWhatsAppNumber\(\)/);
  assert.match(helper, /\/\^DP-\[A-Z0-9\]\+\$\//);
  assert.match(helper, /encodeURIComponent\(text\)/);
});

test('Los enlaces antiguos de compra Pro siguen usando el número oficial', () => {
  assert.match(activation, /getWhatsAppUrl\(undefined,/);
  assert.match(limit, /getWhatsAppUrl\(undefined,/);
});
