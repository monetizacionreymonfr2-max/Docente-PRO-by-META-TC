import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import JSZip from 'jszip';
import { DOMParser as XmlDOMParser, XMLSerializer } from '@xmldom/xmldom';
import {
  cargarDocx, construirMapa, guardarDocx, setTextoCelda, validarDocxClonado,
} from '../src/lib/docxClone/docxEditor.ts';
import { prepararDeshacerSeguro } from '../src/lib/camilaFormato/deshacerSeguro.ts';

const NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
const ORIGINAL = `<w:document xmlns:w="${NS}"><w:body>
<w:p><w:r><w:t>Escuela Ficticia</w:t></w:r></w:p>
<w:tbl><w:tr><w:trPr><w:tblHeader/></w:trPr>
  <w:tc><w:p><w:r><w:t>Área</w:t></w:r></w:p></w:tc>
  <w:tc><w:p><w:r><w:t>Actividad</w:t></w:r></w:p></w:tc>
</w:tr><w:tr>
  <w:tc><w:p><w:r><w:t>Lengua</w:t></w:r></w:p></w:tc>
  <w:tc><w:p><w:r><w:t>Actividad original</w:t></w:r></w:p></w:tc>
</w:tr></w:tbl></w:body></w:document>`;
const LOGO = new Uint8Array([137, 80, 78, 71, 10, 20, 30, 40]);
const ENCABEZADO = `<w:hdr xmlns:w="${NS}"><w:p><w:r><w:t>Dirección escolar ficticia</w:t></w:r></w:p></w:hdr>`;

async function crearWordFicticio() {
  const zip = new JSZip();
  zip.file('word/document.xml', ORIGINAL);
  zip.file('word/header1.xml', ENCABEZADO);
  zip.file('word/media/logo.png', LOGO);
  return zip.generateAsync({ type: 'blob' });
}

async function conDomDePrueba(funcion) {
  const parserAnterior = globalThis.DOMParser;
  const serializadorAnterior = globalThis.XMLSerializer;
  globalThis.DOMParser = class {
    parseFromString(xml, tipo) {
      const doc = new XmlDOMParser().parseFromString(xml, tipo);
      doc.querySelector = (selector) => selector === 'parsererror'
        ? doc.getElementsByTagName('parsererror')[0] || null : null;
      for (const run of Array.from(doc.getElementsByTagNameNS(NS, 'r'))) {
        run.querySelector = () => null;
      }
      return doc;
    }
  };
  globalThis.XMLSerializer = XMLSerializer;
  try { return await funcion(); }
  finally {
    globalThis.DOMParser = parserAnterior;
    globalThis.XMLSerializer = serializadorAnterior;
  }
}

async function prepararPropuesta(blobOriginal) {
  // La edición se hace únicamente sobre una copia abierta desde el Blob original.
  const borrador = await cargarDocx(blobOriginal);
  const celda = borrador.doc.getElementsByTagNameNS(NS, 'tc')[3];
  setTextoCelda(celda, ['Lectura guiada con palabras ficticias']);
  return guardarDocx(borrador.zip, borrador.doc);
}

test('proponer y descartar deja intacto el Word activo, encabezado y logo', async () => conDomDePrueba(async () => {
  const original = await crearWordFicticio();
  const activo = await cargarDocx(original);
  const xmlActivoAntes = await activo.zip.file('word/document.xml').async('string');
  const propuesta = await prepararPropuesta(original);
  const borrador = await cargarDocx(propuesta);

  assert.match(borrador.xmlString, /Lectura guiada con palabras ficticias/);
  assert.equal(await activo.zip.file('word/document.xml').async('string'), xmlActivoAntes);
  assert.equal((await cargarDocx(original)).xmlString, ORIGINAL);
  // Descartar equivale a conservar la referencia activa; no se aplica el borrador.
  assert.match(activo.xmlString, /Actividad original/);
  const zipPropuesta = await JSZip.loadAsync(await propuesta.arrayBuffer());
  assert.equal(await zipPropuesta.file('word/header1.xml').async('string'), ENCABEZADO);
  assert.deepEqual(await zipPropuesta.file('word/media/logo.png').async('uint8array'), LOGO);
}));

test('aprobar y deshacer conserva la estructura institucional sin mutar el borrador', async () => conDomDePrueba(async () => {
  const original = await crearWordFicticio();
  const zipOriginal = await JSZip.loadAsync(await original.arrayBuffer());
  const propuesta = await prepararPropuesta(original);
  const aprobado = await cargarDocx(propuesta);
  assert.equal(construirMapa(aprobado.doc).tablas[0].filas.length, 2);
  assert.match(aprobado.xmlString, /Lectura guiada/);
  const validacion = await validarDocxClonado(zipOriginal, propuesta, { conteoEsperadoFilas: { t0: 2 } });
  assert.equal(validacion.valido, true, validacion.errores.join('; '));

  const revertido = await prepararDeshacerSeguro(propuesta, ORIGINAL);
  assert.match((await cargarDocx(revertido.blob)).xmlString, /Actividad original/);
  assert.equal(revertido.mapa.tablas[0].filas.length, 2);
  assert.equal(await revertido.zip.file('word/header1.xml').async('string'), ENCABEZADO);
  assert.deepEqual(await revertido.zip.file('word/media/logo.png').async('uint8array'), LOGO);
  assert.match((await cargarDocx(propuesta)).xmlString, /Lectura guiada/);
}));

test('un deshacer inválido falla sin alterar el Word aprobado', async () => conDomDePrueba(async () => {
  const original = await crearWordFicticio();
  const propuesta = await prepararPropuesta(original);
  const bytesAntes = new Uint8Array(await propuesta.arrayBuffer());
  await assert.rejects(prepararDeshacerSeguro(propuesta, 'esto no es XML'), /cuerpo|body|document|XML|parsear/i);
  assert.deepEqual(new Uint8Array(await propuesta.arrayBuffer()), bytesAntes);
  assert.match((await cargarDocx(propuesta)).xmlString, /Lectura guiada/);
  await assert.rejects(prepararDeshacerSeguro(new Blob(['no es Word']), ORIGINAL));
}));

test('la interfaz conserva la revisión y aprobación explícitas de propuestas', () => {
  const pantalla = readFileSync(new URL('../src/pages/CamilaFormato.tsx', import.meta.url), 'utf8');
  assert.match(pantalla, /if \(!propuestaPendiente \|\| isProcessing\) return/);
  assert.match(pantalla, /prepararDeshacerSeguro\(blobDocx, anterior\.xml\)/);
  assert.match(pantalla, /No pude deshacer el último cambio\. Su documento permanece como estaba/);
  assert.match(pantalla, /Descartar propuesta/);
  assert.match(pantalla, /Aprobar y aplicar/);
});
