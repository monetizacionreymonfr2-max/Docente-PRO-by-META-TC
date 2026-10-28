import assert from 'node:assert/strict';
import { test } from 'node:test';
import { validarLibroHechosPpa, datosConfirmadosDelLibro } from '../src/lib/camilaFormato/libroHechosPpa.ts';

const hecho = (campo, valor, origen = 'mensaje_docente', estado = 'dicho') => ({
  campo, valor, estado, fuente: origen ? { origen, referencia: 'mensaje-ficticio-1' } : null,
});

test('separa identidad real autorizada de una plantilla de otra docente', () => {
  const libro = { version: 1, hechos: [
    hecho('docente', 'Profesora de Ejemplo'),
    hecho('institucion', 'Escuela de Referencia', 'plantilla_referencia', 'supuesto'),
    hecho('grado', '4to, 5to y 6to'),
  ], pendientes: ['Confirmar institución'] };
  assert.deepEqual(validarLibroHechosPpa(libro), []);
  assert.deepEqual(datosConfirmadosDelLibro(libro), { docente: 'Profesora de Ejemplo', grado: '4to, 5to y 6to' });
});

test('rechaza presentar como dicho un nombre copiado del formato anterior', () => {
  const libro = { version: 1, hechos: [hecho('docente', 'Persona de Plantilla', 'plantilla_referencia')], pendientes: [] };
  assert.match(validarLibroHechosPpa(libro).join(' '), /sin fuente actual/i);
  assert.deepEqual(datosConfirmadosDelLibro(libro), {});
});

test('marca conflictos en la matrícula sin inventar cifras', () => {
  const libro = { version: 1, hechos: [
    hecho('matricula_total', '7'), hecho('matricula_varones', '4'), hecho('matricula_hembras', '2'),
  ], pendientes: [] };
  assert.match(validarLibroHechosPpa(libro).join(' '), /matrícula total no coincide/i);
});

test('los datos faltantes no contienen valores disfrazados de hechos', () => {
  const libro = { version: 1, hechos: [hecho('duracion', '4 semanas', null, 'falta')], pendientes: [] };
  assert.match(validarLibroHechosPpa(libro).join(' '), /faltante no debe contener/i);
});
