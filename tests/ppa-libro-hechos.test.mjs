import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  validarLibroHechosPpa, datosConfirmadosDelLibro, datosProyectoDesdeLibro,
  preguntaPendienteLibroPpa,
} from '../src/lib/camilaFormato/libroHechosPpa.ts';

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

test('extrae datos del docente sin transferir supuestos ni identidad de la plantilla', () => {
  const libro = { version: 1, hechos: [
    hecho('docente', 'Docente Ficticia'),
    hecho('grado', '4to y 5to'),
    hecho('tema', 'Identidad cultural'),
    hecho('institucion', 'Escuela Ajena', 'plantilla_referencia', 'supuesto'),
    hecho('duracion', null, null, 'falta'),
  ], pendientes: ['Confirmar duración'] };
  assert.deepEqual(datosProyectoDesdeLibro(libro), {
    docente: 'Docente Ficticia', gradoSeccion: '4to y 5to', tema: 'Identidad cultural',
  });
});

test('detiene el llenado ante contradicción de semanas y no usa datos ambiguos', () => {
  const libro = { version: 1, hechos: [
    hecho('duracion', '4 semanas'),
    hecho('duracion', '21 días', 'mensaje_docente', 'contradiccion'),
    hecho('tema', 'Convivencia escolar'),
  ], pendientes: [] };
  assert.match(preguntaPendienteLibroPpa(libro), /contradictoria.*duracion/i);
  assert.deepEqual(datosProyectoDesdeLibro(libro), { tema: 'Convivencia escolar' });
});

test('rechaza dos valores supuestamente confirmados y fuentes desconocidas', () => {
  const libro = { version: 1, hechos: [
    hecho('matricula_total', '7'), hecho('matricula_total', '6'),
    hecho('docente', 'Persona', 'fuente_inventada'),
  ], pendientes: [] };
  const errores = validarLibroHechosPpa(libro).join(' ');
  assert.match(errores, /valores confirmados incompatibles/i);
  assert.match(errores, /fuente del dato no es válida/i);
  assert.deepEqual(datosProyectoDesdeLibro(libro), {});
});

test('un libro de hechos malformado devuelve una solicitud de aclaración sin fallar', () => {
  assert.match(preguntaPendienteLibroPpa({ version: 1, hechos: null, pendientes: [] }), /estructura esperada/i);
});
