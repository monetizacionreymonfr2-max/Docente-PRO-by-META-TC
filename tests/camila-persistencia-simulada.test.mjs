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

test('un fallo temporal al crear un recuerdo no guarda datos y permite reintentar', async () => {
  const simulador = crearSupabaseCamilaFicticio();
  const ana = crearCamilaPersistence(simulador.clientePara(ANA));
  simulador.simularFalloUnaVez('PGRST500', 'Error sensible de conexión ficticio');
  await assert.rejects(ana.guardarRecuerdo(ANA, 'Sección', 'Tercero A'), (error) => {
    assert.match(error.message, /No se pudo acceder a sus datos privados/);
    assert.ok(!error.message.includes('Error sensible'));
    return true;
  });
  assert.deepEqual(await ana.listarRecuerdos(ANA), []);
  await ana.guardarRecuerdo(ANA, 'Sección', 'Tercero A');
  assert.equal((await ana.listarRecuerdos(ANA)).length, 1);
});

test('fallas al actualizar o borrar no alteran conversaciones hasta el reintento', async () => {
  const simulador = crearSupabaseCamilaFicticio();
  const ana = crearCamilaPersistence(simulador.clientePara(ANA));
  const id = await ana.crearConversacion(ANA, [mensaje('a', 'Versión original')]);

  simulador.simularFalloUnaVez();
  await assert.rejects(ana.actualizarConversacion(ANA, id, [mensaje('b', 'Versión revisada')]), /No se pudo acceder/);
  assert.equal((await ana.obtenerConversacion(ANA, id)).mensajes[0].texto, 'Versión original');
  await ana.actualizarConversacion(ANA, id, [mensaje('b', 'Versión revisada')]);

  simulador.simularFalloUnaVez();
  await assert.rejects(ana.eliminarConversacion(ANA, id), /No se pudo acceder/);
  assert.equal((await ana.obtenerConversacion(ANA, id)).mensajes[0].texto, 'Versión revisada');
  await ana.eliminarConversacion(ANA, id);
  assert.deepEqual(await ana.listarConversaciones(ANA), []);
});

test('las listas están limitadas a 50 elementos por docente', async () => {
  const simulador = crearSupabaseCamilaFicticio();
  const ana = crearCamilaPersistence(simulador.clientePara(ANA));
  for (let i = 0; i < 53; i++) await ana.crearConversacion(ANA, [mensaje(`${i}`, `Conversación ${i}`)]);
  assert.equal((await ana.listarConversaciones(ANA)).length, 50);
  for (let i = 0; i < 53; i++) await ana.guardarRecuerdo(ANA, `Dato ${i}`, `Contenido ${i}`);
  assert.equal((await ana.listarRecuerdos(ANA)).length, 50);
});

test('la interfaz conserva la autorización explícita para crear o editar memoria', () => {
  const pantalla = readFileSync(new URL('../src/pages/CamilaFormato.tsx', import.meta.url), 'utf8');
  assert.match(pantalla, /if \(!recuerdoPorAutorizar \|\| persistenciaOcupada\) return/);
  assert.match(pantalla, /¿Autoriza conservar esta información en su memoria privada\?/);
  assert.match(pantalla, /Sí, autorizo/);
});

test('historial y memoria disponen de desplazamiento y altura adaptable en teléfonos', () => {
  const pantalla = readFileSync(new URL('../src/pages/CamilaFormato.tsx', import.meta.url), 'utf8');
  assert.match(pantalla, /overflow-y-auto p-2 sm:p-4 bg-black\/80 backdrop-blur-sm.*Historial privado de Camila/);
  assert.match(pantalla, /overflow-y-auto p-2 sm:p-4 bg-black\/80 backdrop-blur-sm.*Memoria privada de Camila/);
  assert.equal((pantalla.match(/max-h-\[calc\(100dvh-1rem\)\]/g) || []).length, 2);
  assert.match(pantalla, /sm:max-h-\[85dvh\]/);
  assert.match(pantalla, /sm:max-h-\[90dvh\]/);
});

test('Mi Formato admite acciones y carga de archivos en una pantalla estrecha', () => {
  const principal = readFileSync(new URL('../src/pages/MiFormato.tsx', import.meta.url), 'utf8');
  const subida = readFileSync(new URL('../src/components/formato/SubirFormatoModal.tsx', import.meta.url), 'utf8');
  assert.match(principal, /flex flex-wrap items-center gap-2 w-full md:w-auto md:shrink-0/);
  assert.match(subida, /items-start sm:items-center justify-center overflow-y-auto p-2 sm:p-4/);
  assert.match(subida, /max-h-\[calc\(100dvh-1rem\)\] sm:max-h-\[90dvh\]/);
  assert.match(subida, /role="dialog" aria-modal="true" aria-label="Subir mi formato escolar"/);
  assert.match(subida, /flex flex-wrap items-center justify-center gap-2 mt-2/);
});
