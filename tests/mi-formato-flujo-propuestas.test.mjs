import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import JSZip from 'jszip';
import { DOMParser as XmlDOMParser, XMLSerializer } from '@xmldom/xmldom';
import {
  cargarDocx, construirMapa, guardarDocx, setTextoCelda, validarDocxClonado,
} from '../src/lib/docxClone/docxEditor.ts';
import { prepararDeshacerSeguro } from '../src/lib/camilaFormato/deshacerSeguro.ts';
import { obtenerAccionesDocumento } from '../src/lib/camilaFormato/accionesDocumento.ts';

const NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
const R_NS = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
const PACKAGE_RELS_NS = 'http://schemas.openxmlformats.org/package/2006/relationships';
const ORIGINAL = `<w:document xmlns:w="${NS}" xmlns:r="${R_NS}"><w:body>
<w:p><w:r><w:t>Escuela Ficticia</w:t></w:r></w:p>
<w:p><w:r><w:t>Proyecto de Aprendizaje - Ejemplo</w:t></w:r></w:p>
<w:tbl><w:tblPr><w:tblStyle w:val="TablaInstitucional"/></w:tblPr>
<w:tr><w:trPr><w:tblHeader/><w:cantSplit/></w:trPr>
  <w:tc><w:p><w:r><w:t>Área</w:t></w:r></w:p></w:tc>
  <w:tc><w:p><w:r><w:t>Actividad</w:t></w:r></w:p></w:tc>
</w:tr><w:tr>
  <w:tc><w:p><w:r><w:t>Lengua</w:t></w:r></w:p></w:tc>
  <w:tc><w:p><w:r><w:t>Actividad original</w:t></w:r></w:p></w:tc>
</w:tr></w:tbl>
<w:tbl><w:tr><w:tc><w:tcPr><w:gridSpan w:val="2"/></w:tcPr><w:p><w:r><w:t>Evaluación</w:t></w:r></w:p></w:tc></w:tr>
<w:tr><w:tc><w:p><w:r><w:t>Instrumento</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>Lista de cotejo</w:t></w:r></w:p></w:tc></w:tr></w:tbl>
<w:sectPr><w:headerReference w:type="default" r:id="rIdHeader"/><w:footerReference w:type="default" r:id="rIdFooter"/>
<w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/></w:sectPr>
</w:body></w:document>`;
const LOGO = new Uint8Array(Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9rve4AAAAASUVORK5CYII=', 'base64'));
const ENCABEZADO = `<w:hdr xmlns:w="${NS}" xmlns:r="${R_NS}"
xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"
xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><w:p>
<w:r><w:t>Dirección escolar ficticia</w:t></w:r>
<w:r><w:drawing><wp:inline><wp:extent cx="127000" cy="127000"/>
<wp:docPr id="1" name="Logo de prueba"/>
<a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">
<pic:pic><pic:nvPicPr><pic:cNvPr id="1" name="logo.png"/><pic:cNvPicPr/></pic:nvPicPr>
<pic:blipFill><a:blip r:embed="rIdLogo"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill>
<pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="127000" cy="127000"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr>
</pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r>
</w:p></w:hdr>`;
const PIE = `<w:ftr xmlns:w="${NS}"><w:p><w:r><w:t>Ejemplo sin datos personales</w:t></w:r></w:p></w:ftr>`;
const ESTILOS = `<w:styles xmlns:w="${NS}"><w:style w:type="paragraph" w:styleId="Normal"><w:name w:val="Normal"/></w:style></w:styles>`;
const TIPOS = `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/>
<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
<Override PartName="/word/header1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml"/>
<Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/>
</Types>`;
const RELACIONES_RAIZ = `<Relationships xmlns="${PACKAGE_RELS_NS}"><Relationship Id="rIdOffice" Type="${R_NS}/officeDocument" Target="word/document.xml"/></Relationships>`;
const RELACIONES_DOC = `<Relationships xmlns="${PACKAGE_RELS_NS}">
<Relationship Id="rIdHeader" Type="${R_NS}/header" Target="header1.xml"/>
<Relationship Id="rIdFooter" Type="${R_NS}/footer" Target="footer1.xml"/>
<Relationship Id="rIdStyles" Type="${R_NS}/styles" Target="styles.xml"/>
</Relationships>`;
const RELACIONES_ENCABEZADO = `<Relationships xmlns="${PACKAGE_RELS_NS}">
<Relationship Id="rIdLogo" Type="${R_NS}/image" Target="media/logo.png"/>
</Relationships>`;

async function crearWordFicticio() {
  const zip = new JSZip();
  zip.file('[Content_Types].xml', TIPOS);
  zip.file('_rels/.rels', RELACIONES_RAIZ);
  zip.file('word/document.xml', ORIGINAL);
  zip.file('word/_rels/document.xml.rels', RELACIONES_DOC);
  zip.file('word/_rels/header1.xml.rels', RELACIONES_ENCABEZADO);
  zip.file('word/styles.xml', ESTILOS);
  zip.file('word/header1.xml', ENCABEZADO);
  zip.file('word/footer1.xml', PIE);
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

async function prepararPropuesta(blobOriginal, contenido = 'Lectura guiada con palabras ficticias') {
  // La edición se hace únicamente sobre una copia abierta desde el Blob original.
  const borrador = await cargarDocx(blobOriginal);
  const celda = borrador.doc.getElementsByTagNameNS(NS, 'tc')[3];
  setTextoCelda(celda, [contenido]);
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

test('el flujo conserva todas las relaciones, estilos, encabezado, pie y medios del paquete Word', async () => conDomDePrueba(async () => {
  const original = await crearWordFicticio();
  const zipInicial = await JSZip.loadAsync(await original.arrayBuffer());
  const propuesta = await prepararPropuesta(original);
  const revertido = await prepararDeshacerSeguro(propuesta, ORIGINAL);
  const zipPropuesta = await JSZip.loadAsync(await propuesta.arrayBuffer());
  const piezasIntactas = [
    '[Content_Types].xml', '_rels/.rels', 'word/_rels/document.xml.rels', 'word/_rels/header1.xml.rels',
    'word/styles.xml', 'word/header1.xml', 'word/footer1.xml', 'word/media/logo.png',
  ];

  for (const ruta of piezasIntactas) {
    const bytes = await zipInicial.file(ruta).async('uint8array');
    assert.deepEqual(await zipPropuesta.file(ruta).async('uint8array'), bytes, `Propuesta: ${ruta}`);
    assert.deepEqual(await revertido.zip.file(ruta).async('uint8array'), bytes, `Deshacer: ${ruta}`);
  }

  assert.match(await zipPropuesta.file('word/header1.xml').async('string'), /r:embed="rIdLogo"/);
  assert.match(await zipPropuesta.file('word/_rels/header1.xml.rels').async('string'), /Target="media\/logo\.png"/);

  const mapa = construirMapa((await cargarDocx(propuesta)).doc);
  assert.equal(mapa.tablas.length, 2);
  assert.equal(mapa.tablas[1].filas[0].celdas[0].gridSpan, 2);
  assert.equal(mapa.tablas[0].filas[0].isHeader, true);
  assert.equal(mapa.tablas[0].filas[0].cantSplit, true);

  const validacion = await validarDocxClonado(zipInicial, propuesta, { conteoEsperadoFilas: { t0: 2, t1: 2 } });
  assert.equal(validacion.valido, true, validacion.errores.join('; '));
}));

test('dos aprobaciones, un deshacer y una propuesta descartada conservan el último estado autorizado', async () => conDomDePrueba(async () => {
  const original = await crearWordFicticio();
  const primera = await prepararPropuesta(original, 'Lectura ficticia A');
  const xmlPrimera = (await cargarDocx(primera)).xmlString;
  const segunda = await prepararPropuesta(primera, 'Lectura ficticia B');
  assert.match((await cargarDocx(segunda)).xmlString, /Lectura ficticia B/);

  const deshecho = await prepararDeshacerSeguro(segunda, xmlPrimera);
  assert.match((await cargarDocx(deshecho.blob)).xmlString, /Lectura ficticia A/);
  assert.doesNotMatch((await cargarDocx(deshecho.blob)).xmlString, /Lectura ficticia B/);
  assert.match((await cargarDocx(segunda)).xmlString, /Lectura ficticia B/);

  // El tercer borrador se descarta: el estado visible sigue siendo el aprobado A.
  const descartada = await prepararPropuesta(deshecho.blob, 'Borrador ficticio descartado');
  assert.match((await cargarDocx(descartada)).xmlString, /Borrador ficticio descartado/);
  assert.match((await cargarDocx(deshecho.blob)).xmlString, /Lectura ficticia A/);

  const terceraAprobada = await prepararPropuesta(deshecho.blob, 'Lectura ficticia C');
  assert.match((await cargarDocx(terceraAprobada)).xmlString, /Lectura ficticia C/);
  assert.match((await cargarDocx(original)).xmlString, /Actividad original/);
}));

test('los botones de Mi Formato respetan el estado simulado de revisión y aprobación', () => {
  const abierto = {
    hayDocumento: true, hayZip: true, cantidadSnapshots: 1,
    hayPropuesta: false, procesando: false,
  };
  assert.deepEqual(obtenerAccionesDocumento(abierto), {
    aprobar: false, descartar: false, deshacer: false, descargar: true,
  });
  assert.deepEqual(obtenerAccionesDocumento({ ...abierto, hayPropuesta: true }), {
    aprobar: true, descartar: true, deshacer: false, descargar: false,
  });
  assert.deepEqual(obtenerAccionesDocumento({ ...abierto, hayPropuesta: true, procesando: true }), {
    aprobar: false, descartar: false, deshacer: false, descargar: false,
  });
  assert.deepEqual(obtenerAccionesDocumento({ ...abierto, cantidadSnapshots: 2 }), {
    aprobar: false, descartar: false, deshacer: true, descargar: true,
  });
  assert.deepEqual(obtenerAccionesDocumento({ ...abierto, hayDocumento: false, cantidadSnapshots: 2 }), {
    aprobar: false, descartar: false, deshacer: false, descargar: false,
  });
  assert.deepEqual(obtenerAccionesDocumento({ ...abierto, cantidadSnapshots: 2, hayZip: false }), {
    aprobar: false, descartar: false, deshacer: false, descargar: true,
  });
});

test('la interfaz conserva la revisión y aprobación explícitas de propuestas', () => {
  const pantalla = readFileSync(new URL('../src/pages/CamilaFormato.tsx', import.meta.url), 'utf8');
  assert.match(pantalla, /obtenerAccionesDocumento\(/);
  assert.match(pantalla, /disabled=\{!accionesDocumento\.aprobar\}/);
  assert.match(pantalla, /disabled=\{!accionesDocumento\.descartar\}/);
  assert.match(pantalla, /disabled=\{!accionesDocumento\.deshacer\}/);
  assert.match(pantalla, /disabled=\{!accionesDocumento\.descargar\}/);
  assert.match(pantalla, /prepararDeshacerSeguro\(blobDocx, anterior\.xml\)/);
  assert.match(pantalla, /No pude deshacer el último cambio\. Su documento permanece como estaba/);
  assert.match(pantalla, /Descartar propuesta/);
  assert.match(pantalla, /Aprobar y aplicar/);
});
