import test from 'node:test';
import assert from 'node:assert/strict';
import {
  leerUltimoChatAutorizado,
  recordarUltimoChatAutorizado,
  olvidarUltimoChatAutorizado,
} from '../src/lib/camila/continuidadChat.ts';

const docenteA = '10000000-0000-4000-8000-000000000001';
const docenteB = '10000000-0000-4000-8000-000000000002';
const chatA = '20000000-0000-4000-8000-000000000001';

function almacenamiento() {
  const datos = new Map();
  return {
    datos,
    getItem: (k) => datos.get(k) ?? null,
    setItem: (k, v) => { datos.set(k, v); },
    removeItem: (k) => { datos.delete(k); },
  };
}

test('solo conserva el identificador del chat autorizado y separa los docentes', () => {
  const storage = almacenamiento();
  recordarUltimoChatAutorizado(storage, docenteA, chatA);
  assert.equal(leerUltimoChatAutorizado(storage, docenteA), chatA);
  assert.equal(leerUltimoChatAutorizado(storage, docenteB), null);
  assert.equal([...storage.datos.values()].join(''), chatA);
  olvidarUltimoChatAutorizado(storage, docenteA);
  assert.equal(leerUltimoChatAutorizado(storage, docenteA), null);
});

test('rechaza identificadores inválidos y tolera almacenamiento denegado', () => {
  const storage = almacenamiento();
  recordarUltimoChatAutorizado(storage, docenteA, 'texto privado');
  recordarUltimoChatAutorizado(storage, 'otro usuario', chatA);
  assert.equal(storage.datos.size, 0);
  const bloqueado = { getItem() { throw Error('denegado'); }, setItem() { throw Error('denegado'); }, removeItem() { throw Error('denegado'); } };
  assert.equal(leerUltimoChatAutorizado(bloqueado, docenteA), null);
  assert.doesNotThrow(() => recordarUltimoChatAutorizado(bloqueado, docenteA, chatA));
  assert.doesNotThrow(() => olvidarUltimoChatAutorizado(bloqueado, docenteA));
});
