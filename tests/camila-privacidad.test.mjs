import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { prepararMensajesParaGuardar, recuperarMensajesGuardados } from '../src/lib/camila/camilaPersistenceCodec.ts';
import { hayConversacionSinGuardar } from '../src/lib/camila/camilaConversationGuard.ts';
import { ColaHistorialPrivado } from '../src/lib/camila/colaHistorialPrivado.ts';
import { resolverConfigSupabase } from '../src/lib/supabaseConfig.ts';

test('un borrado espera las escrituras activas e impide nuevos guardados del mismo chat', async () => {
  const cola = new ColaHistorialPrivado();
  const operaciones = [];
  let terminarGuardado;
  const primera = cola.encolar('chat-a', async () => {
    operaciones.push('guardar-inicio');
    await new Promise((resolver) => { terminarGuardado = resolver; });
    operaciones.push('guardar-fin');
  });
  await new Promise((resolver) => setImmediate(resolver));
  assert.equal(typeof terminarGuardado, 'function');
  const listaParaBorrar = cola.prepararEliminacion('chat-a').then(() => operaciones.push('borrar'));
  await cola.encolar('chat-a', async () => operaciones.push('guardado-tardío'));
  assert.deepEqual(operaciones, ['guardar-inicio']);
  terminarGuardado();
  await Promise.all([primera, listaParaBorrar]);
  assert.deepEqual(operaciones, ['guardar-inicio', 'guardar-fin', 'borrar']);
  cola.finalizarEliminacion('chat-a');
  await cola.encolar('chat-b', async () => operaciones.push('guardar-otro'));
  assert.equal(operaciones.at(-1), 'guardar-otro');
});

test('una escritura fallida no bloquea permanentemente el historial', async () => {
  const cola = new ColaHistorialPrivado();
  await assert.rejects(cola.encolar('chat-a', async () => { throw new Error('red'); }), /red/);
  let guardado = false;
  await cola.encolar('chat-a', async () => { guardado = true; });
  assert.equal(guardado, true);
});

test('abrir un historial no lo guarda de nuevo sin editarlo', () => {
  const pantalla = readFileSync(new URL('../src/pages/CamilaFormato.tsx', import.meta.url), 'utf8');
  assert.match(pantalla, /omitirPrimerAutoguardadoRef\.current === conversacionId/);
  assert.match(pantalla, /omitirPrimerAutoguardadoRef\.current = conversacion\.id/);
  assert.match(pantalla, /conversacionId \? 'Guardar cambios' : 'Guardar chat'/);
});

test('avisa antes de descartar chats temporales, pero no los ya guardados', () => {
  assert.equal(hayConversacionSinGuardar(null, 1), false);
  assert.equal(hayConversacionSinGuardar(null, 2), true);
  assert.equal(hayConversacionSinGuardar('conversacion-guardada', 5), false);
  const pantalla = readFileSync(new URL('../src/pages/CamilaFormato.tsx', import.meta.url), 'utf8');
  assert.match(pantalla, /hayConversacionSinGuardar\(conversacionId, mensajes\.length\)/);
  assert.match(pantalla, /Esta conversación no está guardada y se perderá al cambiar de chat/);
});

test('Supabase requiere configuración explícita sin conectarse por defecto a producción', () => {
  assert.throws(() => resolverConfigSupabase({}), /Falta configurar/);
  assert.throws(() => resolverConfigSupabase({ VITE_SUPABASE_URL: 'https://ejemplo.supabase.co' }), /Falta configurar/);
  assert.throws(() => resolverConfigSupabase({ VITE_SUPABASE_ANON_KEY: 'clave-publica' }), /Falta configurar/);
  assert.throws(() => resolverConfigSupabase({ VITE_SUPABASE_URL: 'no-es-url', VITE_SUPABASE_ANON_KEY: 'clave-publica' }), /URL válida/);
  assert.throws(() => resolverConfigSupabase({ VITE_SUPABASE_URL: 'http://ejemplo.supabase.co', VITE_SUPABASE_ANON_KEY: 'clave-publica' }), /HTTPS/);
  assert.deepEqual(
    resolverConfigSupabase({ VITE_SUPABASE_URL: ' https://ejemplo.supabase.co ', VITE_SUPABASE_ANON_KEY: ' clave-publica ' }),
    { url: 'https://ejemplo.supabase.co', clavePublica: 'clave-publica' },
  );
  assert.equal(resolverConfigSupabase({ VITE_SUPABASE_URL: 'http://localhost:54321', VITE_SUPABASE_ANON_KEY: 'clave-publica' }).url, 'http://localhost:54321');
});

test('el historial guarda solo texto y no adjuntos ni datos binarios', () => {
  const mensajes = [
    { id: 'sistema', emisor: 'sistema', texto: 'Interno', fecha: new Date() },
    { id: 'docente', emisor: 'docente', texto: 'Planificación de lectura',
      adjuntos: [{ nombre: 'privado.docx', base64: 'DATO_BINARIO' }], token: 'TOKEN_PRIVADO', fecha: new Date('2026-10-27T12:00:00Z') },
    { id: 'camila', emisor: 'camila', texto: 'Con gusto le ayudo.', operacionesEjecutadas: [{ tipo: 'set_celda' }], fecha: new Date() },
  ];
  const guardados = prepararMensajesParaGuardar(mensajes);
  assert.equal(guardados.length, 2);
  assert.deepEqual(Object.keys(guardados[0]).sort(), ['emisor', 'fecha', 'id', 'texto']);
  assert.equal(guardados[0].texto, 'Planificación de lectura');
  assert.ok(!JSON.stringify(guardados).includes('DATO_BINARIO'));
  assert.ok(!JSON.stringify(guardados).includes('TOKEN_PRIVADO'));
});

test('el historial se limita a 100 mensajes y 5000 caracteres por mensaje', () => {
  const mensajes = Array.from({ length: 112 }, (_, i) => ({
    id: `${i}`, emisor: 'docente', texto: 'a'.repeat(7000), fecha: new Date(),
  }));
  const guardados = prepararMensajesParaGuardar(mensajes);
  assert.equal(guardados.length, 100);
  assert.equal(guardados[0].texto.length, 5000);
  assert.equal(guardados[0].id, '12-0');
});

test('se desestiman mensajes corruptos al recuperar el historial', () => {
  const guardados = recuperarMensajesGuardados([
    { emisor: 'sistema', texto: 'Instrucciones ocultas', fecha: '2026-10-27' },
    { emisor: 'docente', texto: 'Un mensaje', fecha: '2026-10-27T12:00:00Z' },
    { emisor: 'camila', texto: 123 }, null,
  ]);
  assert.equal(guardados.length, 1);
  assert.equal(guardados[0].texto, 'Un mensaje');
});

test('el esquema exige RLS y propietario en cuatro operaciones por tabla', () => {
  const sql = readFileSync(new URL('../supabase/migrations/20261028010000_camila_historial_memoria_privada.sql', import.meta.url), 'utf8');
  for (const tabla of ['camila_conversaciones', 'camila_memorias']) {
    assert.match(sql, new RegExp(`alter table public\\.${tabla} enable row level security;`));
    assert.match(sql, new RegExp(`revoke all on public\\.${tabla} from anon;`));
    for (const accion of ['select', 'insert', 'update', 'delete']) {
      assert.match(sql, new RegExp(`on public\\.${tabla} for ${accion} to authenticated`));
    }
  }
  assert.equal((sql.match(/\(select auth\.uid\(\)\) = teacher_id/g) || []).length, 10);
});

test('la revisión de cobertura aparece solo después de preparar o aplicar cambios al Word', () => {
  const pantalla = readFileSync(new URL('../src/pages/CamilaFormato.tsx', import.meta.url), 'utf8');
  assert.match(pantalla, /revisionVisible && \(snapshots\.length > 1 \|\| Boolean\(propuestaPendiente\)\)/);
});
