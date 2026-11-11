import test from 'node:test';
import assert from 'node:assert/strict';
import { esIncompatibilidadEstructuralPpa, erroresAuditoriaPpaGenerico } from '../src/lib/camilaFormato/seleccionAdaptadorPpa.ts';

test('solo los Word de estructura diferente admiten reintento con motor flexible', () => {
  assert.equal(esIncompatibilidadEstructuralPpa(new Error('Esta plantilla Word tiene una estructura distinta. Se necesita identificarla antes de completarla: no se modificó el original.')), true);
  assert.equal(esIncompatibilidadEstructuralPpa(new Error('Faltan semanas y contenido curricular')), false);
  assert.equal(esIncompatibilidadEstructuralPpa('Esta plantilla Word tiene una estructura distinta.'), false);
});

test('la auditoría acepta nuevo grado sin rastros del anterior', () => {
  assert.deepEqual(erroresAuditoriaPpaGenerico('Institución | 5to grado, sección A | Proyecto Mi identidad venezolana', '5to grado, sección A', 'Mi identidad venezolana'), []);
});

test('la auditoría bloquea grado antiguo en el cuerpo o pie y títulos previos', () => {
  const errores=erroresAuditoriaPpaGenerico('Proyecto Mi identidad | 5to grado | Pie: Tercer Grado', '5to grado, sección A', 'Mi identidad');
  assert.match(errores.join(' '), /grado 3/);
  assert.match(erroresAuditoriaPpaGenerico('Proyecto ajeno de 3er grado', '5to grado', 'Mi identidad').join(' '), /grado solicitado/);
  assert.match(erroresAuditoriaPpaGenerico('Proyecto ajeno de 5to grado', '5to grado', 'Mi identidad').join(' '), /título nuevo/);
});
