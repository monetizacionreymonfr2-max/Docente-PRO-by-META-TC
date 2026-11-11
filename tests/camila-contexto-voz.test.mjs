import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import {
  prepararContextoLlamadaCamila, registrarTurnoVozCamila,
} from '../src/lib/camila/contextoVoz.ts';

test('después de nueve minutos, la siguiente llamada recibe los turnos de voz anteriores', () => {
  let historial = registrarTurnoVozCamila([], 'Necesito un PPA sobre tradiciones.', '¿Para qué grado?');
  historial = registrarTurnoVozCamila(historial, 'Tercer grado, sección A.', 'Perfecto, ¿cuántas semanas?');
  const contexto = prepararContextoLlamadaCamila(historial, [], {});
  assert.deepEqual(contexto.map(c => c.role), ['user', 'model', 'user', 'model']);
  assert.equal(contexto[2].parts[0].text, 'Tercer grado, sección A.');
  assert.match(contexto[3].parts[0].text, /cuántas semanas/);
});

test('respetar documento y proyecto activo con edición directa y sin inventar datos', () => {
  const contexto = prepararContextoLlamadaCamila([], [], {
    formato: 'Formato Institucional.docx', proyecto: 'Tradiciones de mi pueblo',
  });
  assert.equal(contexto.length, 1);
  assert.match(contexto[0].parts[0].text, /Formato Institucional\.docx/);
  assert.match(contexto[0].parts[0].text, /Tradiciones de mi pueblo/);
  assert.match(contexto[0].parts[0].text, /vista previa/);
  assert.match(contexto[0].parts[0].text, /Deshacer/);
  assert.match(contexto[0].parts[0].text, /NO una nueva petición/);
});

test('no transmite avisos técnicos, y sólo guarda historia en memoria limitada', () => {
  const contexto = prepararContextoLlamadaCamila([], [
    { emisor: 'sistema', texto: 'Token expirado y error interno' },
    { emisor: 'docente', texto: 'Necesito conservar la tabla.' },
    { emisor: 'camila', texto: 'Mantendré la tabla.' },
  ], {});
  assert.equal(contexto.length, 2);
  assert.equal(contexto[0].role, 'user');
  assert.equal(contexto[1].role, 'model');
  assert.doesNotMatch(JSON.stringify(contexto), /Token expirado/);
  let historial = [];
  for (let i = 0; i < 80; i++) historial = registrarTurnoVozCamila(historial, 'Docente '+i, 'Camila '+i);
  assert.equal(historial.length, 60);
  assert.equal(historial[0].docente, 'Docente 20');
  assert.equal(historial[59].camila, 'Camila 79');
});

test('ignora turnos vacíos y limita longitud para no saturar Gemini', () => {
  assert.deepEqual(registrarTurnoVozCamila([], ' ', ''), []);
  const t = registrarTurnoVozCamila([], 'A'.repeat(2000), 'B'.repeat(2000));
  assert.equal(t[0].docente.length, 1400);
  assert.equal(t[0].camila.length, 1400);
  const ctx = prepararContextoLlamadaCamila(t, [], {});
  assert.equal(ctx[0].parts[0].text.length, 1400);
});

test('la reconexión precarga el contexto sin hablar automáticamente y limpia al cambiar de conversación', async () => {
  const vivo = await readFile(new URL('../src/lib/camila/vozEnVivo.ts', import.meta.url), 'utf8');
  const pagina = await readFile(new URL('../src/pages/CamilaFormato.tsx', import.meta.url), 'utf8');
  assert.ok(vivo.includes('sendClientContent({ turns: this.contextoInicial, turnComplete: false })'));
  assert.ok(vivo.includes('this.eventos.alTurno(pendienteDocente, pendienteCamila)'));
  assert.ok(pagina.includes('registrarTurnoVozCamila(historialVozRef.current, usuario, camila)'));
  assert.ok(pagina.includes('}, contextoAnterior, segundosRestantes);'));
  assert.ok(pagina.includes('puedeReconectarLlamada(inicioActual, Date.now(), reintento)'));
  assert.ok(pagina.includes('reconexionTimerRef.current = window.setTimeout'));
  assert.ok(pagina.includes('inicioLlamadaRef.current = null'));
  assert.ok(pagina.includes('historialVozRef.current = []'));
  assert.equal(vivo.includes('localStorage'), false);
  assert.match(vivo, /Math\.min\(540/);
  assert.match(pagina, /transcripciones como turnos de chat/);
});


test('una conversación guardada y una llamada no repiten transcripciones ni pierden recuerdos autorizados', () => {
  const ctx = prepararContextoLlamadaCamila(
    [{ docente: 'Mi grado es tercero.', camila: 'Trabajaremos tercer grado.' }],
    [{ emisor: 'docente', texto: 'Mi grado es tercero.' }, { emisor: 'camila', texto: 'Trabajaremos tercer grado.' }],
    { recuerdosAutorizados: [{ titulo: 'Institución', contenido: 'Escuela pública del municipio' }] },
  );
  assert.equal(ctx.filter(c => c.parts[0].text === 'Mi grado es tercero.').length, 1);
  assert.equal(ctx.filter(c => c.parts[0].text === 'Trabajaremos tercer grado.').length, 1);
  assert.match(ctx.at(-1).parts[0].text, /Escuela pública del municipio/);
});
