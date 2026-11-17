import test from 'node:test';
import assert from 'node:assert/strict';
import { DOMParser } from '@xmldom/xmldom';
import { prepararOperacionesPython } from '../src/lib/camilaFormato/operacionesPython.ts';

const ns = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
const parser = new DOMParser();
const doc = parser.parseFromString(
  '<w:document xmlns:w="' + ns + '"><w:body>' +
  '<w:p><w:r><w:t>Diagnóstico original</w:t></w:r></w:p>' +
  '<w:tbl><w:tr><w:tc><w:p><w:r><w:t>Grado</w:t></w:r></w:p></w:tc>' +
  '<w:tc><w:p><w:r><w:t>Segundo</w:t></w:r></w:p></w:tc></w:tr>' +
  '</w:tbl></w:body></w:document>', 'text/xml');
const cell = doc.getElementsByTagNameNS(ns, 'tc')[1];
const map = {
  parrafos: [{ id:'p0', rawText:'Diagnóstico original' }],
  tablas: [{
    id:'t0',
    filas:[{
      id:'t0.r0', isHeader:false,
      celdas:[{ id:'t0.r0.c0',rawText:'Grado' },
        { id:'t0.r0.c1',rawText:'Segundo',domNode:cell }],
    }],
  }],
};
const plantilla = {
  encabezados:[],
  tablas:[{ id:'t0', celdasEtiquetaIds:['t0.r0.c0'], celdasContenidoIds:['t0.r0.c1'] }],
  bloquesRepetidos:[], celdasTextoLibre:[],
};

test('Camila envía el texto esperado y los IDs de los campos autorizados', () => {
  const result = prepararOperacionesPython([
    { tipo:'set_parrafo', id:'p0', texto:'Diagnóstico corregido' },
    { tipo:'set_celda', id:'t0.r0.c1', lineas:['Quinto'] },
  ], map, plantilla);
  assert.deepEqual(result, [
    { tipo:'set_parrafo', id:'p0', esperado:'Diagnóstico original', texto:'Diagnóstico corregido' },
    { tipo:'set_celda', id:'t0.r0.c1', esperado:'Segundo', lineas:['Quinto'] },
  ]);
});

test('no permite modificar etiquetas ni IDs de celdas inventados', () => {
  assert.equal(prepararOperacionesPython([
    { tipo:'set_celda', id:'t0.r0.c0', lineas:['Alterar etiqueta'] },
  ], map, plantilla), null);
  assert.equal(prepararOperacionesPython([
    { tipo:'set_celda', id:'t0.r1.c3', lineas:['Inventado'] },
  ], map, plantilla), null);
});

test('rechaza lotes mixtos, IDs duplicados y cambios estructurales aún no soportados', () => {
  assert.equal(prepararOperacionesPython([
    { tipo:'set_parrafo', id:'p0', texto:'Nuevo' },
    { tipo:'set_parrafo', id:'p0', texto:'Otro' },
  ], map, plantilla), null);
  assert.equal(prepararOperacionesPython([
    { tipo:'set_parrafo', id:'p0', texto:'Nuevo' },
    { tipo:'eliminar_filas', ids:['t0.r1'] },
  ], map, plantilla), null);
  assert.equal(prepararOperacionesPython([], map, plantilla), null);
});

test('no admite celdas multipárrafo que puedan romper su diseño', () => {
  const cell2 = parser.parseFromString('<w:tc xmlns:w="' + ns + '"><w:p/><w:p/></w:tc>', 'text/xml').documentElement;
  const map2 = { ...map, tablas: [{ ...map.tablas[0], filas: [{ ...map.tablas[0].filas[0],
    celdas: [map.tablas[0].filas[0].celdas[0], { ...map.tablas[0].filas[0].celdas[1], domNode:cell2 }],
  }] }] };
  assert.equal(prepararOperacionesPython([
    { tipo:'set_celda', id:'t0.r0.c1', lineas:['Quinto'] },
  ], map2, plantilla), null);
});
