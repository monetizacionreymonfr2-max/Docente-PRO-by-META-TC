import test from 'node:test';
import assert from 'node:assert/strict';
import { DOMParser, XMLSerializer } from '@xmldom/xmldom';
import JSZip from 'jszip';
import {
  getTextoCompleto,
  guardarDocx,
  setValorSegmentoMultiples,
} from '../src/lib/docxClone/docxEditor.ts';

const NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';

function documentoConEncabezado(contenido) {
  return new DOMParser().parseFromString(
    `<w:document xmlns:w="${NS}"><w:body>${contenido}` +
      '<w:tbl><w:tr><w:tc><w:p><w:r><w:t>Tabla intacta</w:t></w:r></w:p></w:tc></w:tr></w:tbl>' +
      '</w:body></w:document>',
    'application/xml',
  );
}

function editarEncabezado(doc) {
  const parrafo = doc.getElementsByTagNameNS(NS, 'p')[0];
  setValorSegmentoMultiples(parrafo, [
    { etiqueta: 'Docente:', valor: 'Rosa Castillo' },
    { etiqueta: 'Grado:', valor: '4to' },
  ]);
  return parrafo;
}

test('Mi Formato conserva todas las etiquetas al editar dos campos en un mismo run', () => {
  const doc = documentoConEncabezado(
    '<w:p><w:r><w:t>Docente: Ana Grado: 3ero</w:t></w:r></w:p>',
  );
  const parrafo = editarEncabezado(doc);

  assert.equal(
    getTextoCompleto(parrafo).replace(/\s+/g, ' ').trim(),
    'Docente: Rosa Castillo Grado: 4to',
  );
});

test('Mi Formato respeta los estilos de las etiquetas y no duplica texto dividido en runs', () => {
  const doc = documentoConEncabezado(
    '<w:p>' +
      '<w:r><w:rPr><w:b/></w:rPr><w:t>Docente:</w:t></w:r>' +
      '<w:r><w:t> Ana</w:t><w:t> María </w:t></w:r>' +
      '<w:r><w:rPr><w:b/></w:rPr><w:t>Grado:</w:t></w:r>' +
      '<w:r><w:t> 3ero</w:t></w:r>' +
    '</w:p>',
  );
  const tabla = doc.getElementsByTagNameNS(NS, 'tbl')[0];
  const tablaOriginal = new XMLSerializer().serializeToString(tabla);
  const parrafo = editarEncabezado(doc);

  assert.equal(
    getTextoCompleto(parrafo).replace(/\s+/g, ' ').trim(),
    'Docente: Rosa Castillo Grado: 4to',
  );
  assert.equal(parrafo.getElementsByTagNameNS(NS, 'b').length, 2);
  assert.equal(new XMLSerializer().serializeToString(tabla), tablaOriginal);
});

test('Mi Formato conserva las tablas y el logo al guardar el DOCX corregido', async () => {
  const doc = documentoConEncabezado(
    '<w:p><w:r><w:t>Docente: Ana Grado: 3ero</w:t></w:r></w:p>',
  );
  editarEncabezado(doc);
  const zip = new JSZip();
  zip.file('word/document.xml', 'pendiente');
  zip.file('word/media/logo.png', new Uint8Array([137, 80, 78, 71, 1, 2, 3]));

  const serializadorAnterior = globalThis.XMLSerializer;
  globalThis.XMLSerializer = XMLSerializer;
  let resultado;
  try {
    resultado = await guardarDocx(zip, doc);
  } finally {
    globalThis.XMLSerializer = serializadorAnterior;
  }
  const restaurado = await JSZip.loadAsync(await resultado.arrayBuffer());
  const xml = await restaurado.file('word/document.xml').async('string');
  const logo = await restaurado.file('word/media/logo.png').async('uint8array');

  assert.match(xml, /Docente: Rosa Castillo Grado: 4to/);
  assert.match(xml, /Tabla intacta/);
  assert.deepEqual([...logo], [137, 80, 78, 71, 1, 2, 3]);
});
