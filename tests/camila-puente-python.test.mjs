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
      celdas:[{ id:'t0.r0.c0',rawText:'Grado',gridSpan:1 },
        { id:'t0.r0.c1',rawText:'Segundo',gridSpan:1,domNode:cell }],
    }],
  }],
};
const plantilla = {
  encabezados:[],
  tablas:[{ id:'t0', tipo:'cronograma', filasEncabezadoIds:[], celdasEtiquetaIds:['t0.r0.c0'], celdasContenidoIds:['t0.r0.c1'] }],
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


function cronogramaFicticio() {
  const rowXml = (values) => '<w:tr>' + values.map(text =>
    '<w:tc><w:p><w:r><w:t>' + text + '</w:t></w:r></w:p></w:tc>').join('') + '</w:tr>';
  const xml = '<w:document xmlns:w="' + ns + '"><w:body>' +
    '<w:p><w:r><w:t>Diagnóstico</w:t></w:r></w:p>' +
    '<w:p><w:r><w:t>Grupo inicial.</w:t></w:r></w:p>' +
    '<w:p><w:r><w:t>Necesita lectura.</w:t></w:r></w:p>' +
    '<w:tbl>' +
    rowXml(['Semana','Área','Actividad']) +
    rowXml(['1','Lenguaje','Lectura']) +
    rowXml(['2','Matemática','Series']) +
    '</w:tbl></w:body></w:document>';
  const parsed = parser.parseFromString(xml, 'application/xml');
  const rows = Array.from(parsed.getElementsByTagNameNS(ns, 'tr'));
  const source = [
    ['Semana','Área','Actividad'],
    ['1','Lenguaje','Lectura'],
    ['2','Matemática','Series'],
  ];
  const table = { id:'t0', filas: source.map((values, r) => {
    const cells = Array.from(rows[r].getElementsByTagNameNS(ns, 'tc'));
    return {
      id:'t0.r' + r, isHeader:r === 0, domNode:rows[r],
      celdas:values.map((rawText, c) => ({
        id:'t0.r' + r + '.c' + c, rawText, gridSpan:1, domNode:cells[c],
      })),
    };
  }) };
  const mapa = {
    parrafos:[
      {id:'p0',rawText:'Diagnóstico'},
      {id:'p1',rawText:'Grupo inicial.'},
      {id:'p2',rawText:'Necesita lectura.'},
    ],
    tablas:[table],
    resumenCompacto:'',
  };
  const plantilla = { tablas:[{
    id:'t0', tipo:'cronograma', filasEncabezadoIds:['t0.r0'],
    celdasEtiquetaIds:['t0.r0.c0','t0.r0.c1','t0.r0.c2'],
    celdasContenidoIds:source.slice(1).flatMap((_,row) =>
      [0,1,2].map(c=>'t0.r'+(row+1)+'.c'+c)),
  }], encabezados:[], bloquesRepetidos:[],celdasTextoLibre:[] };
  return { mapa, plantilla };
}

test('agrega dos semanas conservando la fila de datos original como prototipo', () => {
  const {mapa,plantilla}=cronogramaFicticio();
  const op = {tipo:'agregar_filas',tablaId:'t0',despuesDeFilaId:'t0.r2',
    filas:[['3','Lenguaje','Dictado'],['4','Ciencias','Observación']]};
  assert.deepEqual(prepararOperacionesPython([op],mapa,plantilla),[{
    ...op,esperadoModelo:['2','Matemática','Series'],
  }]);
});

test('reemplaza todas las semanas con precondiciones de fila y mantiene el encabezado', () => {
  const {mapa,plantilla}=cronogramaFicticio();
  const op={tipo:'reemplazar_filas',tablaId:'t0',
    filas:[['1','Lenguaje','Sílabas'],['2','Matemática','Series'],['3','Ciencias','Observación']]};
  assert.deepEqual(prepararOperacionesPython([op],mapa,plantilla),[{
    ...op,filaInicioId:'t0.r1',
    esperadas:[['1','Lenguaje','Lectura'],['2','Matemática','Series']],
  }]);
});

test('corrige sección completa únicamente sobre párrafos contiguos', () => {
  const {mapa,plantilla}=cronogramaFicticio();
  const op={tipo:'set_seccion',tituloId:'p0',
    parrafos:[{id:'p1',texto:'Grupo lector ficticio.'},{id:'p2',texto:'Iniciamos cuentos.'}]};
  assert.deepEqual(prepararOperacionesPython([op],mapa,plantilla),[{
    tipo:'set_seccion',tituloId:'p0',tituloEsperado:'Diagnóstico',
    parrafos:[
      {id:'p1',esperado:'Grupo inicial.',texto:'Grupo lector ficticio.'},
      {id:'p2',esperado:'Necesita lectura.',texto:'Iniciamos cuentos.'},
    ],
  }]);
  assert.equal(prepararOperacionesPython([{...op,parrafos:[{id:'p2',texto:'Saltar p1'}]}],mapa,plantilla),null);
});

test('rechaza columnas incompatibles, celdas fusionadas y tablas desconocidas', () => {
  const {mapa,plantilla}=cronogramaFicticio();
  const bad={tipo:'agregar_filas',tablaId:'t0',despuesDeFilaId:'t0.r2',
    filas:[['3','Lenguaje']]};
  assert.equal(prepararOperacionesPython([bad],mapa,plantilla),null);
  const merged={...mapa,tablas:[{...mapa.tablas[0],filas:[
    mapa.tablas[0].filas[0],mapa.tablas[0].filas[1],
    {...mapa.tablas[0].filas[2],celdas:[
      {...mapa.tablas[0].filas[2].celdas[0],gridSpan:2},
      ...mapa.tablas[0].filas[2].celdas.slice(1)],
    },
  ]}]};
  assert.equal(prepararOperacionesPython([{
    tipo:'reemplazar_filas',tablaId:'t0',filas:[['1','A','B']],
  }],merged,plantilla),null);
  const desconocida={...plantilla,tablas:[{...plantilla.tablas[0],tipo:'general'}]};
  assert.equal(prepararOperacionesPython([{
    tipo:'reemplazar_filas',tablaId:'t0',filas:[['1','A','B']],
  }],mapa,desconocida),null);
});
