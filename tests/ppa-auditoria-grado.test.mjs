import test from 'node:test';
import assert from 'node:assert/strict';
import { extraerGradoPrimaria, referenciasGradoAnterior } from '../src/lib/camilaFormato/auditoriaGrado.ts';

test('reconoce expresiones de grado venezolanas', () => {
  assert.equal(extraerGradoPrimaria('3er Grado A'), 3);
  assert.equal(extraerGradoPrimaria('tercer grado'), 3);
  assert.equal(extraerGradoPrimaria('5to grado, sección B'), 5);
  assert.equal(extraerGradoPrimaria('Quinto año'), 5);
});

test('encuentra residuos de tercero cuando se adapta a quinto', () => {
  const residuos = referenciasGradoAnterior('Actividades de tercer grado. Indicadores de 3er Grado.', '3er Grado A', '5to grado A');
  assert.equal(residuos.length, 2);
  assert.deepEqual(referenciasGradoAnterior('Actividades de quinto grado', '3er Grado A', '5to grado A'), []);
});

test('no bloquea adaptaciones del mismo grado ni textos sin grado identificable', () => {
  assert.deepEqual(referenciasGradoAnterior('tercer grado', 'tercer grado', '3er grado'), []);
  assert.deepEqual(referenciasGradoAnterior('tercer grado', 'Sección A', 'Quinto grado'), []);
});
