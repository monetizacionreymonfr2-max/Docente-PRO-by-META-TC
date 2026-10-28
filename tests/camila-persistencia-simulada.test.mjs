import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { crearCamilaPersistence } from '../src/lib/camila/camilaPersistenceCore.ts';
import { crearSupabaseCamilaFicticio } from './helpers/supabaseCamilaFicticio.mjs';

const ANA = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const LUIS = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const mensaje = (id, texto, emisor = 'docente') =>
  ({ id, texto, emisor, fecha: new Date('2026-10-28T12:00:00Z') });

test('dos docentes ficticios no leen, modifican ni borran el historial ajeno', async () => {
  const simulador = crearSupabaseCamilaFicticio();
  const ana = crearCamilaPersistence(simulador.clientePara(ANA));
  const luis = crearCamilaPersistence(simulador.clientePara(LUIS));
  const idAna = await ana.crearConversacion(ANA, [mensaje('a', 'Lectura de tercer grado')]);
  const idLuis = await luis.crearConversacion(LUIS, [mensaje('l', 'Matemática de quinto grado')]);

  assert.deepEqual((await ana.listarConversaciones(ANA)).map((c) => c.id), [idAna]);
  assert.deepEqual((await luis.listarConversaciones(LUIS)).map((c) => c.id), [idLuis]);
  await assert.rejects(ana.crearConversacion(LUIS, [mensaje('falso', 'Suplantación')]), /No se pudo acceder/);
  await assert.rejects(luis.obtenerConversacion(LUIS, idAna), /no existe o no pertenece/);
  await assert.rejects(luis.actualizarConversacion(LUIS, idAna, [mensaje('intruso', 'No permitido')]), /no existe o no pertenece/);
  await luis.eliminarConversacion(LUIS, idAna);
  assert.equal((await ana.obtenerConversacion(ANA, idAna)).mensajes[0].texto, 'Lectura de tercer grado');

  await ana.actualizarConversacion(ANA, idAna, [mensaje('a2', 'Plan de lectura revisado')]);
  assert.equal((await ana.obtenerConversacion(ANA, idAna)).mensajes[0].texto, 'Plan de lectura revisado');
  await ana.eliminarConversacion(ANA, idAna);
  assert.deepEqual(await ana.listarConversaciones(ANA), []);
  assert.equal((await luis.listarConversaciones(LUIS)).length, 1);
});

test('el historial no crea memorias y nunca conserva adjuntos ni credenciales de metadatos', async () => {
  const simulador = crearSupabaseCamilaFicticio();
  const ana = crearCamilaPersistence(simulador.clientePara(ANA));
  const id = await ana.crearConversacion(ANA, [
    { ...mensaje('doc', 'Organizar el aula'), adjuntos: [{ base64: 'WORD_SECRETO' }], token: 'TOKEN_SECRETO' },
    mensaje('sistema', 'Instrucciones internas', 'sistema'),
  ]);
  assert.deepEqual(await ana.listarRecuerdos(ANA), []);
  const chat = await ana.obtenerConversacion(ANA, id);
  assert.equal(chat.mensajes.length, 1);
  assert.deepEqual(Object.keys(chat.mensajes[0]).sort(), ['emisor', 'fecha', 'id', 'texto']);
  assert.ok(!JSON.stringify(chat).includes('WORD_SECRETO'));
  assert.ok(!JSON.stringify(chat).includes('TOKEN_SECRETO'));
});

test('recuerdos ficticios: alta, corrección, borrado, límites y aislamiento', async () => {
  const simulador = crearSupabaseCamilaFicticio();
  const ana = crearCamilaPersistence(simulador.clientePara(ANA));
  const luis = crearCamilaPersistence(simulador.clientePara(LUIS));
  await ana.guardarRecuerdo(ANA, ' Grado ', ' Tercero A ');
  await luis.guardarRecuerdo(LUIS, ' Grado ', ' Quinto B ');
  const [datoAna] = await ana.listarRecuerdos(ANA);
  const [datoLuis] = await luis.listarRecuerdos(LUIS);
  assert.equal(datoAna.titulo, 'Grado');
  assert.equal(datoAna.contenido, 'Tercero A');
  assert.equal(datoLuis.contenido, 'Quinto B');

  await assert.rejects(luis.guardarRecuerdo(ANA, 'Falso', 'Suplantación'), /No se pudo acceder/);

  await assert.rejects(luis.guardarRecuerdo(LUIS, 'Otro', 'Robado', datoAna.id), /no existe o no pertenece/);
  await luis.eliminarRecuerdo(LUIS, datoAna.id);
  assert.equal((await ana.listarRecuerdos(ANA)).length, 1);
  await ana.guardarRecuerdo(ANA, 'Sección', 'Tercero C', datoAna.id);
  assert.equal((await ana.listarRecuerdos(ANA))[0].contenido, 'Tercero C');
  await ana.eliminarRecuerdo(ANA, datoAna.id);
  assert.deepEqual(await ana.listarRecuerdos(ANA), []);
  assert.equal((await luis.listarRecuerdos(LUIS)).length, 1);

  await assert.rejects(ana.guardarRecuerdo(ANA, ' ', 'Dato'), /máximo 120 caracteres/);
  await assert.rejects(ana.guardarRecuerdo(ANA, 'x'.repeat(121), 'Dato'), /máximo 120 caracteres/);
  await assert.rejects(ana.guardarRecuerdo(ANA, 'Dato', 'x'.repeat(1501)), /máximo 1500 caracteres/);
  assert.deepEqual(await ana.listarRecuerdos(ANA), []);
});

test('un esquema ausente muestra un aviso comprensible sin revelar detalles internos', async () => {
  const simulador = crearSupabaseCamilaFicticio();
  const servicio = crearCamilaPersistence(simulador.clientePara(ANA, { esquemaDisponible: false }));
  await assert.rejects(servicio.listarConversaciones(ANA), /todavía no están habilitados/);
  await assert.rejects(servicio.listarRecuerdos(ANA), /todavía no están habilitados/);
  await assert.rejects(servicio.guardarRecuerdo(ANA, 'Dato', 'Ficticio'), /todavía no están habilitados/);
});

test('la interfaz conserva la autorización explícita para crear o editar memoria', () => {
  const pantalla = readFileSync(new URL('../src/pages/CamilaFormato.tsx', import.meta.url), 'utf8');
  assert.match(pantalla, /if \(!recuerdoPorAutorizar \|\| persistenciaOcupada\) return/);
  assert.match(pantalla, /¿Autoriza conservar esta información en su memoria privada\?/);
  assert.match(pantalla, /Sí, autorizo/);
});
