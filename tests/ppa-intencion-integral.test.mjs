import test from 'node:test';
import assert from 'node:assert/strict';
import { solicitaPpaIntegral } from '../src/lib/camilaFormato/solicitudIntegral.ts';

for (const frase of [
  'Crea un PPA sobre identidad y usa este formato',
  'Créame un PPA sobre identidad y usa ese Word',
  'Completa el documento con los datos que te di',
  'Complétalo y ajústalo a 2do grado',
  'Adaptar el PPA a mi formato',
  'Hazme un PPA sobre identidad',
  'Genera el proyecto de aula',
  'Llena el formato completo',
  'Termínalo',
  'Vacía mi PPA en el Word',
]) {
  test(`Se genera PPA integral: ${frase}`,()=>assert.equal(solicitaPpaIntegral(frase),true));
}
for (const frase of [
  'Cambia solamente el título',
  'Corrige una fecha del Word',
  '¿Qué se observa en esta fotografía?',
  '¿Cómo puedo descargar el PPA?',
  'Borra un recuerdo de mi memoria',
]) {
  test(`Solo parches o conversación: ${frase}`,()=>assert.equal(solicitaPpaIntegral(frase),false));
}
