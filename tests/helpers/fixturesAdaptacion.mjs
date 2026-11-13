/**
 * Documentos FICTICIOS para pruebas de adaptación integral. Ningún dato es real:
 * instituciones, docentes y estudiantes son inventados; los logos son PNG de juguete.
 */
import JSZip from 'jszip';
import { LOGO_ESCUELA_B64, LOGO_MINISTERIO_B64, SELLO_B64 } from '../fixtures/logos-ficticios.mjs';

export const W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
export const R = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
const NS = `xmlns:w="${W}" xmlns:r="${R}" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"`;

export const DOCENTE_ANTERIOR = 'Ana Ficticia Torres';
export const INSTITUCION = 'U.E. Ficticia Simón Rodríguez';
export const TITULO_PROYECTO = 'Mi comunidad cuenta su historia';

export const esc = (s) => String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
export const run = (t, { b = false, rsid = '' } = {}) =>
  `<w:r>${b || rsid ? `<w:rPr>${b ? '<w:b/>' : ''}</w:rPr>` : ''}<w:t xml:space="preserve">${esc(t)}</w:t></w:r>`;
export const dibujo = (rId, id, nombre, cx = 914400, cy = 457200) =>
  `<w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="${cx}" cy="${cy}"/><wp:docPr id="${id}" name="${nombre}"/><a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic><pic:nvPicPr><pic:cNvPr id="${id}" name="${nombre}.png"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="${rId}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r>`;
export const par = (contenido, { jc = '', estilo = '', num = false } = {}) =>
  `<w:p><w:pPr>${estilo ? `<w:pStyle w:val="${estilo}"/>` : ''}${num ? '<w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr>' : ''}${jc ? `<w:jc w:val="${jc}"/>` : ''}</w:pPr>${contenido}</w:p>`;
export const texto = (t, o = {}) => par(run(t, o), o);
export const titulo = (t) => par(run(t, { b: true }), { estilo: 'Heading2' });
export const campo = (instr, resultado) =>
  `<w:r><w:fldChar w:fldCharType="begin"/></w:r><w:r><w:instrText xml:space="preserve"> ${instr} </w:instrText></w:r><w:r><w:fldChar w:fldCharType="separate"/></w:r><w:r><w:t>${resultado}</w:t></w:r><w:r><w:fldChar w:fldCharType="end"/></w:r>`;

export function celda(contenido, { ancho = 2000, span = 0, vmerge = '', relleno = '', b = false, lineas = null, num = false } = {}) {
  const props = `<w:tcPr><w:tcW w:w="${ancho}" w:type="dxa"/>${span ? `<w:gridSpan w:val="${span}"/>` : ''}${vmerge === 'restart' ? '<w:vMerge w:val="restart"/>' : vmerge === 'continue' ? '<w:vMerge/>' : ''}${relleno ? `<w:shd w:val="clear" w:color="auto" w:fill="${relleno}"/>` : ''}</w:tcPr>`;
  let cuerpo;
  if (lineas) cuerpo = lineas.map((l) => texto(l, { b, num })).join('');
  else if (contenido && contenido.startsWith('<w:')) cuerpo = contenido;
  else cuerpo = texto(contenido ?? '', { b });
  return `<w:tc>${props}${cuerpo}</w:tc>`;
}
export const fila = (celdas, { cabecera = false } = {}) => `<w:tr>${cabecera ? '<w:trPr><w:tblHeader/></w:trPr>' : ''}${celdas.join('')}</w:tr>`;
export const tabla = (filas, anchos) =>
  `<w:tbl><w:tblPr><w:tblW w:w="${anchos.reduce((a, b) => a + b, 0)}" w:type="dxa"/><w:tblBorders><w:top w:val="single" w:sz="4"/><w:bottom w:val="single" w:sz="4"/><w:insideH w:val="single" w:sz="4"/><w:insideV w:val="single" w:sz="4"/></w:tblBorders></w:tblPr><w:tblGrid>${anchos.map((w) => `<w:gridCol w:w="${w}"/>`).join('')}</w:tblGrid>${filas.join('')}</w:tbl>`;
/** Tabla de pares etiqueta/valor (2 columnas). */
export const tablaPares = (pares) => tabla(pares.map(([e, v]) => fila([
  celda(e, { ancho: 2600, b: true, relleno: 'D9E2F3' }),
  Array.isArray(v) ? celda('', { ancho: 6400, lineas: v, num: true }) : celda(v, { ancho: 6400 }),
])), [2600, 6400]);

const PNG = (b64) => Uint8Array.from(Buffer.from(b64, 'base64'));
const TIPOS_BASE = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/><Override PartName="/word/header1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml"/><Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/></Types>`;
const REL = (id, tipo, destino) => `<Relationship Id="${id}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/${tipo}" Target="${destino}"/>`;
const ESTILOS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="${W}"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/><w:sz w:val="20"/></w:rPr></w:rPrDefault></w:docDefaults><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style><w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:basedOn w:val="Normal"/><w:pPr><w:keepNext/><w:spacing w:before="200" w:after="80"/></w:pPr><w:rPr><w:b/><w:color w:val="1F3864"/><w:sz w:val="24"/></w:rPr></w:style></w:styles>`;
const NUMERACION = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:numbering xmlns:w="${W}"><w:abstractNum w:abstractNumId="0"><w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="bullet"/><w:lvlText w:val="•"/><w:lvlJc w:val="left"/><w:pPr><w:ind w:left="360" w:hanging="360"/></w:pPr></w:lvl></w:abstractNum><w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num></w:numbering>`;
const CORE = (creador, titulo) => `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:title>${esc(titulo)}</dc:title><dc:creator>${esc(creador)}</dc:creator></cp:coreProperties>`;

/**
 * A) «Siete tablas no compatibles»: PPA de 3.er grado con estructura distinta de la
 *    plantilla fija. Incluye logos en encabezado y cuerpo, sello en una celda, celdas
 *    combinadas (gridSpan/vMerge), viñetas, campos PAGE/NUMPAGES y metadatos.
 */
export async function crearPpaTercerGradoSieteTablas() {
  const logoCuerpo = dibujo('rIdLogoB1', 11, 'LogoCuerpo');
  const sello = dibujo('rIdSello', 12, 'Sello', 457200, 457200);
  const t1 = tablaPares([
    ['Institución', INSTITUCION], ['Docente', DOCENTE_ANTERIOR], ['Grado y sección', '3er grado, sección B'],
    ['Año escolar', '2026-2027'], ['Matrícula', '28 estudiantes (15 niñas y 13 niños)'],
  ]);
  const t2 = tablaPares([
    ['Título del proyecto', TITULO_PROYECTO],
    ['PEIC', 'Formar ciudadanos con identidad nacional y valores de convivencia (3er lapso: cierre de proyectos).'],
    ['Pregunta generadora', '¿Cómo podemos conocer y contar la historia de nuestra comunidad?'],
    ['Producto final', 'Libro ilustrado con las historias de la comunidad'],
  ]);
  const t3 = tablaPares([
    ['Descripción del contexto', 'Los estudiantes de tercer grado viven en un sector urbano cercano a la escuela y participan en actividades comunitarias.'],
    ['Necesidades de aprendizaje', 'En 3er grado la mayoría lee textos de un párrafo con apoyo, suma y resta con reagrupación y aún no domina las tablas de multiplicar.'],
    ['Potencialidades', 'Participan con entusiasmo en dramatizaciones y en el trabajo en equipo.'],
    ['Técnicas e instrumentos del diagnóstico', 'Observación directa y lista de cotejo aplicadas durante el primer mes con el grupo de tercer grado.'],
  ]);
  const t4 = tablaPares([
    ['Finalidad', 'Que los niños y niñas de tercer grado reconozcan la historia de su comunidad y la cuenten con textos sencillos.'],
    ['Propósitos específicos', ['Leer relatos breves de un párrafo.', 'Resolver sumas y restas con reagrupación.', 'Describir cambios en su comunidad a lo largo del tiempo.']],
  ]);
  const a5 = [1500, 1900, 1700, 1700, 1500, 1200];
  const cab5 = fila(['Área', 'Contenidos', 'Aprendizajes esperados', 'Estrategias', 'Indicadores', 'Recursos'].map((t, i) => celda(t, { ancho: a5[i], b: true, relleno: 'BDD7EE' })), { cabecera: true });
  const t5 = tabla([
    cab5,
    fila([celda('Semanas 1 a 3 — Eje integrador: identidad y comunidad', { ancho: 9500, span: 6, b: true })]),
    fila([celda('Lenguaje', { ancho: a5[0] }), celda('Lectura de relatos de un párrafo; ortografía de palabras de uso frecuente', { ancho: a5[1] }),
      celda('Lee relatos breves de 3er grado y responde preguntas literales', { ancho: a5[2] }),
      celda('Lectura compartida y dramatización de relatos de la comunidad', { ancho: a5[3] }),
      celda('Identifica personajes y lugares en textos de un párrafo', { ancho: a5[4] }), celda('Libros de la biblioteca de aula', { ancho: a5[5] })]),
    fila([celda('Matemática', { ancho: a5[0] }), celda('Suma y resta con reagrupación hasta 1000; tablas del 2, 3 y 5', { ancho: a5[1] }),
      celda('Resuelve problemas de suma y resta con números hasta 1000', { ancho: a5[2] }),
      celda('Resolución de problemas con situaciones del mercado comunal', { ancho: a5[3] }),
      celda('Resuelve sumas y restas con reagrupación', { ancho: a5[4] }), celda('Material concreto y tarjetas', { ancho: a5[5] })]),
    fila([celda('Ciencias Sociales', { ancho: a5[0], vmerge: 'restart' }), celda('La comunidad ayer y hoy', { ancho: a5[1] }),
      celda('Describe cambios de su comunidad', { ancho: a5[2] }),
      celda('', { ancho: a5[3], lineas: ['Entrevista a un adulto mayor', 'Línea de tiempo sencilla', 'Dibujo comentado'], num: true }),
      celda('Ordena hechos en una línea de tiempo', { ancho: a5[4] }), celda('Fotografías antiguas', { ancho: a5[5] })]),
    fila([celda('', { ancho: a5[0], vmerge: 'continue' }), celda('Símbolos de la localidad', { ancho: a5[1] }),
      celda('Reconoce símbolos de su localidad', { ancho: a5[2] }), celda('Recorrido por la plaza', { ancho: a5[3] }),
      celda('Nombra símbolos de la localidad', { ancho: a5[4] }), celda('Cuaderno de campo', { ancho: a5[5] })]),
  ], a5);
  const a6 = [1400, 2600, 3500, 1500];
  const t6 = tabla([
    fila(['Semana', 'Fecha', 'Actividad', 'Responsable'].map((t, i) => celda(t, { ancho: a6[i], b: true, relleno: 'BDD7EE' })), { cabecera: true }),
    fila([celda('Semana 1', { ancho: a6[0] }), celda('03-11-2026 al 06-11-2026', { ancho: a6[1] }),
      celda('Entrevista a un abuelo de la comunidad y registro de datos sencillos para 3er grado', { ancho: a6[2] }), celda(`Docente: ${DOCENTE_ANTERIOR}`, { ancho: a6[3] })]),
    fila([celda('Semana 2', { ancho: a6[0] }), celda('09-11-2026 al 13-11-2026', { ancho: a6[1] }),
      celda('Elaboración de un cuento ilustrado de un párrafo', { ancho: a6[2] }), celda('Docente y estudiantes', { ancho: a6[3] })]),
    fila([celda('Semana 3', { ancho: a6[0] }), celda('16-11-2026 al 20-11-2026', { ancho: a6[1] }),
      celda('Presentación del libro a la comunidad', { ancho: a6[2] }), celda('Estudiantes de tercer grado', { ancho: a6[3] })]),
  ], a6);
  const a7 = [2400, 2400, 4200];
  const t7 = tabla([
    fila(['Criterio', 'Instrumento', 'Indicadores de logro'].map((t, i) => celda(t, { ancho: a7[i], b: true, relleno: 'BDD7EE' })), { cabecera: true }),
    fila([celda('Lectura comprensiva', { ancho: a7[0] }), celda('Lista de cotejo', { ancho: a7[1] }), celda('Lee relatos de un párrafo y responde preguntas literales', { ancho: a7[2] })]),
    fila([celda('Resolución de problemas', { ancho: a7[0] }), celda('Registro descriptivo', { ancho: a7[1] }), celda('Suma y resta con reagrupación hasta 1000', { ancho: a7[2] })]),
    fila([celda(`Docente: ${DOCENTE_ANTERIOR}`, { ancho: a7[0] }), celda(par(sello), { ancho: a7[1] }), celda('Director(a): ________________', { ancho: a7[2] })]),
  ], a7);
  const cuerpo = [
    texto('PROYECTO PEDAGÓGICO DE APRENDIZAJE (PPA)', { b: true, jc: 'center', estilo: 'Heading2' }),
    par(logoCuerpo + run(' República Bolivariana de Venezuela · Ministerio del Poder Popular para la Educación'), { jc: 'center' }),
    par(run('Educación Primaria · ') + run('Tercer') + run(' grado, sección B'), { jc: 'center' }),
    titulo('DATOS DEL PLANTEL'), t1, titulo('PROYECTO'), t2, titulo('DIAGNÓSTICO'), t3,
    titulo('FINALIDAD DEL PROYECTO'), t4, titulo('PLANIFICACIÓN POR ÁREAS'), t5, titulo('CRONOGRAMA'), t6,
    titulo('EVALUACIÓN Y FIRMAS'), t7,
    texto(`Elaborado por la docente ${DOCENTE_ANTERIOR} para estudiantes de 3er grado.`),
    `<w:sectPr><w:headerReference w:type="default" r:id="rIdHdr"/><w:footerReference w:type="default" r:id="rIdFtr"/></w:sectPr>`,
  ].join('');
  const documento = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<w:document ${NS}><w:body>${cuerpo}</w:body></w:document>`;
  const cabecera = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<w:hdr ${NS}>${par(dibujo('rIdH1', 21, 'LogoEscuela', 685800, 342900) + run(`  ${INSTITUCION} — PPA de Tercer grado  `) + dibujo('rIdH2', 22, 'LogoMinisterio', 685800, 342900), { jc: 'center' })}</w:hdr>`;
  const pie = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<w:ftr ${NS}>${par(run(`PPA “${TITULO_PROYECTO}” · 3er grado, sección B · Prof. ${DOCENTE_ANTERIOR} · Página `) + campo('PAGE', '1') + run(' de ') + campo('NUMPAGES', '4'), { jc: 'center' })}</w:ftr>`;
  const zip = new JSZip();
  zip.file('[Content_Types].xml', TIPOS_BASE);
  zip.file('_rels/.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${REL('rId1', 'officeDocument', 'word/document.xml')}<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/></Relationships>`);
  zip.file('word/document.xml', documento);
  zip.file('word/_rels/document.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${REL('rIdSt', 'styles', 'styles.xml')}${REL('rIdNum', 'numbering', 'numbering.xml')}${REL('rIdHdr', 'header', 'header1.xml')}${REL('rIdFtr', 'footer', 'footer1.xml')}${REL('rIdLogoB1', 'image', 'media/logo-escuela.png')}${REL('rIdSello', 'image', 'media/sello.png')}</Relationships>`);
  zip.file('word/_rels/header1.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${REL('rIdH1', 'image', 'media/logo-escuela.png')}${REL('rIdH2', 'image', 'media/logo-ministerio.png')}</Relationships>`);
  zip.file('word/styles.xml', ESTILOS);
  zip.file('word/numbering.xml', NUMERACION);
  zip.file('word/header1.xml', cabecera);
  zip.file('word/footer1.xml', pie);
  zip.file('word/media/logo-escuela.png', PNG(LOGO_ESCUELA_B64));
  zip.file('word/media/logo-ministerio.png', PNG(LOGO_MINISTERIO_B64));
  zip.file('word/media/sello.png', PNG(SELLO_B64));
  zip.file('docProps/core.xml', CORE(DOCENTE_ANTERIOR, `PPA ${TITULO_PROYECTO} 3er grado`));
  return zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
}

/** B) PPA sin tablas: párrafos con «Etiqueta: valor» y secciones narrativas. */
export async function crearPpaParrafosTercerGrado() {
  const cuerpo = [
    texto('PROYECTO DE APRENDIZAJE', { b: true, jc: 'center', estilo: 'Heading2' }),
    par(run('Docente: ', { b: true }) + run(DOCENTE_ANTERIOR)),
    par(run('Institución: ', { b: true }) + run(INSTITUCION)),
    par(run('Grado: ', { b: true }) + run('Tercero B')),
    par(run('Título: ', { b: true }) + run(TITULO_PROYECTO)),
    titulo('DIAGNÓSTICO'),
    texto('Los estudiantes de tercer grado leen con apoyo textos de un párrafo y resuelven sumas y restas con reagrupación. Se observó en el primer mes que dominan las tablas del 2 y del 5.'),
    titulo('PROPÓSITO DEL PROYECTO'),
    texto('Que los niños de tercer grado reconozcan la historia de su comunidad y la cuenten con textos sencillos de un párrafo.'),
    titulo('ACTIVIDADES'),
    par(run('Actividad 1: ', { b: true }) + run('Entrevistar a un abuelo y registrar tres datos en una tabla sencilla.')),
    par(run('Actividad 2: ', { b: true }) + run('Escribir un cuento de un párrafo con inicio, nudo y desenlace.')),
    titulo('EVALUACIÓN'),
    texto('Se evaluará con lista de cotejo la lectura de relatos de un párrafo y la resolución de problemas de suma y resta hasta 1000.'),
    `<w:sectPr><w:headerReference w:type="default" r:id="rIdHdr"/><w:footerReference w:type="default" r:id="rIdFtr"/></w:sectPr>`,
  ].join('');
  const zip = new JSZip();
  zip.file('[Content_Types].xml', TIPOS_BASE);
  zip.file('_rels/.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${REL('rId1', 'officeDocument', 'word/document.xml')}</Relationships>`);
  zip.file('word/document.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<w:document ${NS}><w:body>${cuerpo}</w:body></w:document>`);
  zip.file('word/_rels/document.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${REL('rIdSt', 'styles', 'styles.xml')}${REL('rIdNum', 'numbering', 'numbering.xml')}${REL('rIdHdr', 'header', 'header1.xml')}${REL('rIdFtr', 'footer', 'footer1.xml')}</Relationships>`);
  zip.file('word/_rels/header1.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${REL('rIdH1', 'image', 'media/logo-escuela.png')}</Relationships>`);
  zip.file('word/styles.xml', ESTILOS);
  zip.file('word/numbering.xml', NUMERACION);
  zip.file('word/header1.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<w:hdr ${NS}>${par(dibujo('rIdH1', 31, 'LogoEscuela', 685800, 342900) + run(` ${INSTITUCION} · Tercer grado`), { jc: 'center' })}</w:hdr>`);
  zip.file('word/footer1.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<w:ftr ${NS}>${par(run(`Prof. ${DOCENTE_ANTERIOR} · Página `) + campo('PAGE', '1'), { jc: 'center' })}</w:ftr>`);
  zip.file('word/media/logo-escuela.png', PNG(LOGO_ESCUELA_B64));
  return zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
}

export const grupoSinDatos = { /* el docente aún no aportó hechos observados */ };

/** Textos del cuerpo (document.xml) como cadena plana, para aserciones. */
export async function textoPlanoDocx(buffer, rutas = null) {
  const zip = await JSZip.loadAsync(buffer);
  const nombres = Object.keys(zip.files).filter((n) => rutas ? rutas.includes(n) : /^word\/(document|header\d*|footer\d*)\.xml$/.test(n));
  const partes = {};
  for (const n of nombres) {
    const xml = await zip.file(n).async('string');
    partes[n] = [...xml.matchAll(/<w:t(?:\s[^>]*)?>([^<]*)<\/w:t>/g)].map((m) => m[1]
      .replaceAll('&lt;', '<').replaceAll('&gt;', '>').replaceAll('&amp;', '&')).join('');
  }
  return partes;
}
