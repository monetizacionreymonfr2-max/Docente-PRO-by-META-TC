import assert from 'node:assert/strict';
import test from 'node:test';
import { describirErrorVoz } from '../src/lib/camila/erroresVoz.ts';

function fallo(tipo, mensaje = 'falló el dispositivo') {
  return Object.assign(new Error(mensaje), { name: tipo });
}

test('distingue un dispositivo sin micrófono de permisos denegados', () => {
  assert.match(describirErrorVoz(fallo('NotFoundError')), /No se encontró un micrófono/);
  assert.match(describirErrorVoz(fallo('NotReadableError')), /micrófono está ocupado/);
  assert.match(describirErrorVoz(fallo('NotAllowedError')), /permitir el acceso/);
  assert.match(describirErrorVoz(new Error('MICROFONO_NO_DISPONIBLE')), /Este navegador/);
});

test('describe fallas del servidor sin exponer detalles del proveedor', () => {
  assert.match(describirErrorVoz(new Error('Voz no configurada')), /este entorno/);
  assert.match(describirErrorVoz(new Error('Sesión inválida')), /sesión venció/);
  assert.match(describirErrorVoz(new Error('No se pudo abrir la conversación por voz. Intenta más tarde.')), /No se pudo abrir/);
  assert.equal(describirErrorVoz(new Error('clave interna secreta')), 'No se pudo iniciar la voz de Camila. Inténtalo nuevamente.');
});
