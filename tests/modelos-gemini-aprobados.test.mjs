import assert from 'node:assert/strict';
import test from 'node:test';
import {
  GEMINI_MODELO_CHAT, GEMINI_MODELO_DOCUMENTOS, esModeloGeminiTextoPermitido,
} from '../src/lib/modelosGemini.ts';
import { GEMINI_FORMATO_MODEL } from '../src/lib/formatoPrompts.ts';
import { DEFAULT_CAMILA_FORMATO_MODEL, listarModelosDisponibles } from '../src/lib/camilaFormato/camilaFormatoConfig.ts';

test('los documentos usan Gemini 3.5 Flash y las consultas Flash-Lite', async () => {
  assert.equal(GEMINI_MODELO_DOCUMENTOS, 'gemini-3.5-flash');
  assert.equal(GEMINI_MODELO_CHAT, 'gemini-3.5-flash-lite');
  assert.equal(GEMINI_FORMATO_MODEL, GEMINI_MODELO_DOCUMENTOS);
  assert.equal(DEFAULT_CAMILA_FORMATO_MODEL, GEMINI_MODELO_DOCUMENTOS);
  assert.deepEqual((await listarModelosDisponibles()).map(m => m.id), [GEMINI_MODELO_DOCUMENTOS, GEMINI_MODELO_CHAT]);
});

test('las solicitudes de texto no pueden elegir un modelo más caro o de voz', () => {
  assert.equal(esModeloGeminiTextoPermitido(GEMINI_MODELO_DOCUMENTOS), true);
  assert.equal(esModeloGeminiTextoPermitido(GEMINI_MODELO_CHAT), true);
  for (const modelo of ['gemini-3.8-live', 'gemini-2.5-pro', 'otro', null]) {
    assert.equal(esModeloGeminiTextoPermitido(modelo), false);
  }
});

test('la función de generación en Vercel no importa módulos TypeScript del frontend sin extensión', async () => {
  const { readFile } = await import('node:fs/promises');
  const codigo = await readFile(new URL('../api/generate.ts', import.meta.url), 'utf8');
  assert.doesNotMatch(codigo, /from ['"]\\.\\.\\/src\\/lib\\/modelosGemini['"]/);
  assert.match(codigo, /new Set\\(\\['gemini-3\\.5-flash', 'gemini-3\\.5-flash-lite'\\]\\)/);
  assert.match(codigo, /esModeloGeminiTextoPermitido\\(model\\)/);
});

test('la lectura del formato protege contra respuestas del servidor que no sean JSON', async () => {
  const { readFile } = await import('node:fs/promises');
  const codigo = await readFile(new URL('../src/lib/gemini.ts', import.meta.url), 'utf8');
  assert.match(codigo, /try \\{\\s*payload = await response\\.json\\(\\)/);
  assert.match(codigo, /No se pudo procesar el formato en este momento/);
});
