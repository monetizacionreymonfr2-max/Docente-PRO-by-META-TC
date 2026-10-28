import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { prepararMensajesParaGuardar, recuperarMensajesGuardados } from '../src/lib/camila/camilaPersistenceCodec.ts';

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
