import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DURACION_LLAMADA_CAMILA_SEGUNDOS,
  segundosRestantesLlamada,
  puedeReconectarLlamada,
} from '../src/lib/camila/reconexionLlamada.ts';

test('una llamada nunca reinicia su presupuesto de nueve minutos al reconectar', () => {
  assert.equal(DURACION_LLAMADA_CAMILA_SEGUNDOS, 540);
  assert.equal(segundosRestantesLlamada(1000, 1000), 540);
  assert.equal(segundosRestantesLlamada(1000, 301000), 240);
  assert.equal(segundosRestantesLlamada(1000, 541000), 0);
});

test('se permiten como máximo dos reconexiones mientras quede tiempo', () => {
  assert.equal(puedeReconectarLlamada(1000, 101000, 0), true);
  assert.equal(puedeReconectarLlamada(1000, 101000, 1), true);
  assert.equal(puedeReconectarLlamada(1000, 101000, 2), false);
  assert.equal(puedeReconectarLlamada(1000, 530000, 0), false);
  assert.equal(puedeReconectarLlamada(1000, 120000, -1), false);
});

test('entradas erróneas no activan reconexiones de micrófono', () => {
  assert.equal(segundosRestantesLlamada(Number.NaN, 1000), 0);
  assert.equal(segundosRestantesLlamada(5000, 4000), 0);
  assert.equal(puedeReconectarLlamada(5000, 4000, 0), false);
});
