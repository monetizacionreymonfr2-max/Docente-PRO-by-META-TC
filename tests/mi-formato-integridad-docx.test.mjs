import test from 'node:test';
import assert from 'node:assert/strict';
import { DOMParser as XmlDOMParser, XMLSerializer } from '@xmldom/xmldom';
import JSZip from 'jszip';
import {
  construirMapa,
  clonarFila,
  guardarDocx,
  validarDocxClonado,
} from '../src/lib/docxClone/docxEditor.ts';

const NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
const xmlComplejo = `<w:document xmlns:w="${NS}"><w:body>
  <w:p><w:r><w:t>Planificación institucional</w:t></w:r></w:p>
  <w:tbl>
    <w:tblPr><w:tblStyle w:val="TablaInstitucional"/></w:tblPr>
    <w:tr>
      <w:trPr><w:tblHeader/><w:cantSplit/></w:trPr>
      <w:tc><w:tcPr><w:gridSpan w:val="2"/><w:vMerge w:val="restart"/></w:tcPr><w:p><w:r><w:t>Encabezado</w:t></w:r></w:p></w:tc>
    </w:tr>
    <w:tr>
      <w:tc><w:tcPr><w:gridSpan w:val="2"/><w:vMerge/></w:tcPr><w:p><w:r><w:t>Actividad</w:t></w:r></w:p></w:tc>
    </w:tr>
  </w:tbl>
</w:body></w:document>`;

const logoOriginal = new Uint8Array([137, 80, 78, 71, 9, 8, 7, 6]);

function crearZip() {
  const zip = new JSZip();
  zip.file('word/document.xml', xmlComplejo);
  zip.file('word/media/logo.png', logoOriginal);
  return zip;
}

// El navegador aporta querySelector; esta adaptación solo permite validar el
// XML de Word en Node con el mismo paquete DOCX sintético, sin iniciar sesión.
async function validarEnNode(original, generado) {
  const anterior = globalThis.DOMParser;
  globalThis.DOMParser = class {
    parseFromString(xml, tipo) {
      const doc = new XmlDOMParser().parseFromString(xml, tipo);
      doc.querySelector = (selector) => selector === 'parsererror'
        ? doc.getElementsByTagName('parsererror')[0] || null : null;
      return doc;
    }
  };
  try {
    return await validarDocxClonado(original, generado, { conteoEsperadoFilas: { t0: 2 } });
  } finally {
    globalThis.DOMParser = anterior;
  }
}

test('identifica celdas combinadas y conserva la estructura institucional al clonar una fila', () => {
  const doc = new XmlDOMParser().parseFromString(xmlComplejo, 'application/xml');
  // xmldom no implementa querySelector; el editor usa ese método solo como
  // respaldo cuando no encuentra un nodo por su espacio de nombres.
  for (const run of Array.from(doc.getElementsByTagNameNS(NS, 'r'))) {
    run.querySelector = () => null;
  }
  const mapa = construirMapa(doc);
  assert.equal(mapa.tablas.length, 1);
  assert.equal(mapa.tablas[0].filas.length, 2);
  assert.equal(mapa.tablas[0].filas[0].isHeader, true);
  assert.equal(mapa.tablas[0].filas[0].cantSplit, true);
  assert.equal(mapa.tablas[0].filas[0].celdas[0].gridSpan, 2);
  assert.equal(mapa.tablas[0].filas[0].celdas[0].vMerge, 'restart');
  assert.equal(mapa.tablas[0].filas[1].celdas[0].vMerge, 'continue');

  const filaOriginal = mapa.tablas[0].filas[0].domNode;
  const clon = clonarFila(filaOriginal);
  assert.equal(clon.getElementsByTagNameNS(NS, 'vMerge').length, 0);
  assert.equal(filaOriginal.getElementsByTagNameNS(NS, 'vMerge').length, 1);
});

test('acepta un Word con tabla combinada y logo idéntico tras guardar', async () => {
  const original = crearZip();
  const doc = new XmlDOMParser().parseFromString(xmlComplejo, 'application/xml');
  const anterior = globalThis.XMLSerializer;
  globalThis.XMLSerializer = XMLSerializer;
  let blob;
  try { blob = await guardarDocx(original, doc); }
  finally { globalThis.XMLSerializer = anterior; }
  const resultado = await validarEnNode(original, blob);
  assert.equal(resultado.valido, true, resultado.errores.join('; '));
});

test('rechaza un Word si el logo cambió aunque haya el mismo número de imágenes', async () => {
  const original = crearZip();
  const alterado = crearZip();
  alterado.file('word/media/logo.png', new Uint8Array([137, 80, 78, 71, 1, 2, 3, 4]));
  const blob = await alterado.generateAsync({ type: 'blob' });
  const resultado = await validarEnNode(original, blob);
  assert.equal(resultado.valido, false);
  assert.match(resultado.errores.join(' '), /logo\.png/);
});

test('rechaza un Word si se sustituyó una imagen por otra con nombre distinto', async () => {
  const original = crearZip();
  const alterado = crearZip();
  alterado.remove('word/media/logo.png');
  alterado.file('word/media/otra.png', logoOriginal);
  const blob = await alterado.generateAsync({ type: 'blob' });
  const resultado = await validarEnNode(original, blob);
  assert.equal(resultado.valido, false);
  assert.match(resultado.errores.join(' '), /logo\.png/);
});
