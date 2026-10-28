import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import JSZip from 'jszip';
import { DOMParser as XmlDOMParser, XMLSerializer } from '@xmldom/xmldom';
import { cargarDocx, construirMapa, guardarDocx, validarDocxClonado } from '../src/lib/docxClone/docxEditor.ts';
import { calcularEscalaVistaPrevia } from '../src/lib/docxClone/escalaVistaPrevia.ts';

const NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
const rutaWord = new URL('./fixtures/mi-formato-visual-ficticio.docx', import.meta.url);

async function conDomDePrueba(funcion) {
  const parserAnterior = globalThis.DOMParser;
  const serializerAnterior = globalThis.XMLSerializer;
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
    globalThis.XMLSerializer = serializerAnterior;
  }
}

test('el DOCX visual ficticio abre con tres tablas, encabezado, pie y medio gráfico', async () => conDomDePrueba(async () => {
  const bytes = readFileSync(rutaWord);
  const originalZip = await JSZip.loadAsync(bytes);
  assert.ok(originalZip.file('[Content_Types].xml'));
  assert.ok(originalZip.file('_rels/.rels'));
  assert.ok(originalZip.file('word/_rels/document.xml.rels'));
  assert.ok(Object.keys(originalZip.files).some((ruta) => /^word\/header\d+\.xml$/.test(ruta)));
  assert.ok(Object.keys(originalZip.files).some((ruta) => /^word\/footer\d+\.xml$/.test(ruta)));
  assert.ok(Object.keys(originalZip.files).some((ruta) => ruta.startsWith('word/media/')));

  const cargado = await cargarDocx(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
  const mapa = construirMapa(cargado.doc);
  assert.equal(mapa.tablas.length, 3);
  assert.equal(mapa.tablas[0].filas.length, 3);
  assert.equal(mapa.tablas[1].filas.length, 4);
  assert.equal(mapa.tablas[1].filas[0].isHeader, true);
  assert.equal(mapa.tablas[2].filas[0].celdas[0].gridSpan, 2);
  assert.match(mapa.resumenCompacto, /Docente Ficticio A/);

  const clonado = await guardarDocx(cargado.zip, cargado.doc);
  const validacion = await validarDocxClonado(originalZip, clonado, {
    conteoEsperadoFilas: { t0: 3, t1: 4, t2: 2 },
  });
  assert.equal(validacion.valido, true, validacion.errores.join('; '));
}));

test('la vista previa ajusta el ancho de Word a móviles de 320 a 414 px y a tabletas', () => {
  const anchoWord = 816;
  for (const anchoPantalla of [320, 360, 375, 390, 414, 768, 1024]) {
    const relleno = anchoPantalla < 640 ? 16 : 32;
    const anchoDisponible = anchoPantalla - relleno;
    const escala = calcularEscalaVistaPrevia(anchoWord, anchoDisponible, true);
    assert.ok(escala > 0 && escala <= 1, `Escala válida a ${anchoPantalla} px`);
    assert.ok(anchoWord * escala <= anchoDisponible - 4 + 0.00001,
      `Word ajustado sin exceder el ancho de ${anchoPantalla} px`);
  }
  assert.equal(calcularEscalaVistaPrevia(816, 1200, true), 1);
  assert.equal(calcularEscalaVistaPrevia(816, 375, false), 1);
  assert.equal(calcularEscalaVistaPrevia(0, 375, true), 1);
  assert.equal(calcularEscalaVistaPrevia(816, 0, true), 1);
  assert.ok(calcularEscalaVistaPrevia(816, 2, true) > 0);
});

test('la pantalla móvil separa chat y documento y ofrece volver a ajustar el zoom', () => {
  const pantalla = readFileSync(new URL('../src/pages/CamilaFormato.tsx', import.meta.url), 'utf8');
  const visor = readFileSync(new URL('../src/components/formato/DocxPreviewViewer.tsx', import.meta.url), 'utf8');
  assert.match(pantalla, /setTabActiva\('documento'\)/);
  assert.match(pantalla, /flex lg:hidden/);
  assert.match(pantalla, /tabActiva === 'chat' \? 'flex' : 'hidden lg:flex'/);
  assert.match(pantalla, /tabActiva === 'documento' \? 'flex' : 'hidden lg:flex'/);
  assert.match(pantalla, /max-h-\[calc\(100dvh-1rem\)\]/);
  assert.match(visor, /calcularEscalaVistaPrevia\(/);
  assert.match(visor, /aria-pressed=\{!ajustarAlAncho\}/);
});
