import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { APARTADOS_DOCENTY, consultarGuiaPlataforma, GUIA_PLATAFORMA_RESUMIDA } from '../src/lib/camila/guiaPlataforma.ts';

test('cada apartado enseñado por Camila corresponde a una ruta publicada', () => {
  const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
  for (const apartado of APARTADOS_DOCENTY) {
    const segmento = apartado.ruta.substring(1);
    assert.ok(app.includes(`path="${segmento}"`) || segmento === 'earn-money', apartado.ruta);
  }
  assert.ok(APARTADOS_DOCENTY.length >= 12);
  assert.ok(GUIA_PLATAFORMA_RESUMIDA.includes('/camila-formato'));
});

test('orientación concreta sobre asistencia, PPA, boletines y Word', () => {
  assert.match(consultarGuiaPlataforma('¿Dónde registro la asistencia?'), /\/attendance/);
  assert.match(consultarGuiaPlataforma('cómo consigo el gestor PPA'), /\/ppa/);
  assert.match(consultarGuiaPlataforma('necesito preparar boletines'), /\/reports/);
  const formato = consultarGuiaPlataforma('¿Cómo edito el Word en Camila Formato?');
  assert.match(formato, /\/camila-formato/);
  assert.match(formato, /Deshacer/);
  assert.match(formato, /Guardar chat/);
});

test('consulta desconocida no inventa pantallas ni controles y administración tiene aviso', () => {
  assert.match(consultarGuiaPlataforma('hiperespacio sideral'), /No encontré una sección/);
  assert.match(consultarGuiaPlataforma('panel de administrador'), /administradores/);
  assert.match(consultarGuiaPlataforma(''), /Menú lateral/);
});

test('la configuración de voz usa nueve minutos y el sistema ofrece orientación', () => {
  const api = readFileSync(new URL('../api/camila-live-token.js', import.meta.url), 'utf8');
  assert.match(api, /DURACION_SEGUNDOS = 9 \* 60/);
  assert.match(api, /consultar_plataforma/);
  assert.match(api, /sessionResumption/);
  assert.match(api, /contextWindowCompression/);
});
