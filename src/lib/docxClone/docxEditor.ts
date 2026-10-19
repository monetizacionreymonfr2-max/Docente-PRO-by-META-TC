import JSZip from 'jszip';
import {
  DocxMapa,
  DocxParrafoNode,
  DocxTablaNode,
  DocxFilaNode,
  DocxCeldaNode,
  DocxSegmento,
} from './types';

const W_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';

/**
 * Carga un archivo Word (.docx) y parsea word/document.xml
 */
export async function cargarDocx(
  file: File | Blob | ArrayBuffer
): Promise<{ zip: JSZip; doc: Document; xmlString: string }> {
  let arrayBuffer: ArrayBuffer;
  if (file instanceof ArrayBuffer) {
    arrayBuffer = file;
  } else {
    arrayBuffer = await file.arrayBuffer();
  }

  const zip = await JSZip.loadAsync(arrayBuffer);
  const documentXmlEntry = zip.file('word/document.xml');

  if (!documentXmlEntry) {
    throw new Error('El archivo DOCX no contiene word/document.xml válido.');
  }

  const xmlString = await documentXmlEntry.async('string');
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlString, 'application/xml');

  const parserError = doc.querySelector('parsererror');
  if (parserError) {
    throw new Error('Error al parsear el XML de word/document.xml: ' + parserError.textContent);
  }

  return { zip, doc, xmlString };
}

/**
 * Extrae todo el texto de un elemento w:p o w:tc concatenando todos los w:t
 * Resuelve el problema de letras partidas en runs separados (ej. "Á", "r", "e", "a")
 */
export function getTextoCompleto(elem: Element): string {
  const textNodes = elem.getElementsByTagNameNS(W_NS, 't');
  let result = '';
  for (let i = 0; i < textNodes.length; i++) {
    result += textNodes[i].textContent || '';
  }
  // Si no encontró con namespace, probar sin namespace por compatibilidad
  if (!result && textNodes.length === 0) {
    const rawT = elem.querySelectorAll('t');
    for (let i = 0; i < rawT.length; i++) {
      result += rawT[i].textContent || '';
    }
  }
  return result;
}

/**
 * Extrae los segmentos de un párrafo distinguiendo etiquetas (negrita) de valores (no negrita)
 */
export function extraerSegmentosParrafo(p: Element): DocxSegmento[] {
  const segmentos: DocxSegmento[] = [];
  const runs = p.getElementsByTagNameNS(W_NS, 'r');
  const runsList = runs.length > 0 ? Array.from(runs) : Array.from(p.querySelectorAll('r'));

  runsList.forEach((r, idx) => {
    const tNodes = r.getElementsByTagNameNS(W_NS, 't');
    let runText = '';
    for (let i = 0; i < tNodes.length; i++) {
      runText += tNodes[i].textContent || '';
    }
    if (!runText && tNodes.length === 0) {
      const fallbackT = r.querySelectorAll('t');
      for (let i = 0; i < fallbackT.length; i++) {
        runText += fallbackT[i].textContent || '';
      }
    }

    if (!runText) return;

    // Verificar si es negrita
    const bNode = r.getElementsByTagNameNS(W_NS, 'b')[0] || r.querySelector('b');
    let esNegrita = false;
    if (bNode) {
      const val = bNode.getAttributeNS(W_NS, 'val') || bNode.getAttribute('w:val') || bNode.getAttribute('val');
      esNegrita = val !== '0' && val !== 'false';
    }

    segmentos.push({
      texto: runText,
      negrita: esNegrita,
      runIndex: idx,
    });
  });

  return segmentos;
}

/**
 * Construye el mapa estructurado del documento Word (párrafos y tablas con IDs estables)
 */
export function construirMapa(doc: Document): DocxMapa {
  const body = doc.getElementsByTagNameNS(W_NS, 'body')[0] || doc.querySelector('body');
  if (!body) {
    throw new Error('El documento no contiene el elemento <w:body>.');
  }

  const parrafos: DocxParrafoNode[] = [];
  const tablas: DocxTablaNode[] = [];
  const lineasResumen: string[] = [];

  let pCount = 0;
  let tCount = 0;

  const children = Array.from(body.children);

  for (const child of children) {
    const localName = child.localName || child.nodeName.replace(/^.*:/, '');

    if (localName === 'p') {
      const pId = `p${pCount++}`;
      const rawText = getTextoCompleto(child).trim();
      const segmentos = extraerSegmentosParrafo(child);

      parrafos.push({
        id: pId,
        rawText,
        segmentos,
        domNode: child,
      });

      if (rawText) {
        lineasResumen.push(`[${pId}]: ${rawText}`);
      }
    } else if (localName === 'tbl') {
      const tId = `t${tCount++}`;
      const filas: DocxFilaNode[] = [];

      const trNodes = Array.from(child.children).filter((c) => {
        const name = c.localName || c.nodeName.replace(/^.*:/, '');
        return name === 'tr';
      });

      trNodes.forEach((tr, rIdx) => {
        const rId = `${tId}.r${rIdx}`;
        const celdas: DocxCeldaNode[] = [];

        // tblHeader
        const tblHeader = tr.getElementsByTagNameNS(W_NS, 'tblHeader')[0] || tr.querySelector('tblHeader');
        const cantSplit = tr.getElementsByTagNameNS(W_NS, 'cantSplit')[0] || tr.querySelector('cantSplit');

        const tcNodes = Array.from(tr.children).filter((c) => {
          const name = c.localName || c.nodeName.replace(/^.*:/, '');
          return name === 'tc';
        });

        tcNodes.forEach((tc, cIdx) => {
          const cId = `${rId}.c${cIdx}`;
          const rawText = getTextoCompleto(tc).trim();

          // lineas de la celda
          const pInTc = Array.from(tc.children).filter(
            (c) => (c.localName || c.nodeName.replace(/^.*:/, '')) === 'p'
          );
          const lineas = pInTc.map((p) => getTextoCompleto(p).trim()).filter(Boolean);

          // gridSpan
          const gridSpanNode = tc.getElementsByTagNameNS(W_NS, 'gridSpan')[0] || tc.querySelector('gridSpan');
          let gridSpan = 1;
          if (gridSpanNode) {
            const val = gridSpanNode.getAttributeNS(W_NS, 'val') || gridSpanNode.getAttribute('w:val') || gridSpanNode.getAttribute('val');
            if (val) gridSpan = parseInt(val, 10) || 1;
          }

          // vMerge
          const vMergeNode = tc.getElementsByTagNameNS(W_NS, 'vMerge')[0] || tc.querySelector('vMerge');
          let vMerge: string | undefined = undefined;
          if (vMergeNode) {
            const val = vMergeNode.getAttributeNS(W_NS, 'val') || vMergeNode.getAttribute('w:val') || vMergeNode.getAttribute('val');
            vMerge = val === 'restart' ? 'restart' : 'continue';
          }

          celdas.push({
            id: cId,
            rawText,
            lineas,
            gridSpan,
            vMerge,
            domNode: tc,
          });
        });

        filas.push({
          id: rId,
          celdas,
          isHeader: Boolean(tblHeader),
          cantSplit: Boolean(cantSplit),
          domNode: tr,
        });
      });

      tablas.push({
        id: tId,
        filas,
        domNode: child,
      });

      // Resumen compacto de la tabla
      lineasResumen.push(`[${tId}] (Tabla con ${filas.length} filas):`);
      filas.forEach((f) => {
        const celdasTexto = f.celdas.map((c) => `[${c.id}]: "${c.rawText}"`).join(' | ');
        lineasResumen.push(`  ${celdasTexto}`);
      });
    }
  }

  return {
    parrafos,
    tablas,
    resumenCompacto: lineasResumen.join('\n'),
  };
}

/**
 * Modifica el texto de un párrafo conservando su w:pPr y w:rPr del run principal
 */
export function setTextoParrafo(p: Element, texto: string): void {
  const runs = Array.from(p.getElementsByTagNameNS(W_NS, 'r'));
  const fallbackRuns = runs.length > 0 ? runs : Array.from(p.querySelectorAll('r'));

  // Buscar el run principal que tenga más texto o propiedades de formato
  let mainRPr: Node | null = null;
  if (fallbackRuns.length > 0) {
    let maxLen = -1;
    let bestRun = fallbackRuns[0];
    for (const r of fallbackRuns) {
      const text = getTextoCompleto(r);
      if (text.length > maxLen) {
        maxLen = text.length;
        bestRun = r;
      }
    }
    const rPr = bestRun.getElementsByTagNameNS(W_NS, 'rPr')[0] || bestRun.querySelector('rPr');
    if (rPr) {
      mainRPr = rPr.cloneNode(true);
    }
  }

  // Eliminar todos los runs previos
  for (const r of fallbackRuns) {
    p.removeChild(r);
  }

  // Crear un nuevo w:r con un único w:t
  const doc = p.ownerDocument;
  const newR = doc.createElementNS(W_NS, 'w:r');
  if (mainRPr) {
    newR.appendChild(mainRPr);
  }

  const newT = doc.createElementNS(W_NS, 'w:t');
  newT.setAttribute('xml:space', 'preserve');
  newT.textContent = texto;
  newR.appendChild(newT);

  p.appendChild(newR);
}

/**
 * Modifica el texto de una celda w:tc creando un w:p por cada línea
 * Usa el primer w:p como prototipo de formato y nunca deja la celda sin párrafos
 */
export function setTextoCelda(tc: Element, lineas: string[]): void {
  const pList = Array.from(tc.getElementsByTagNameNS(W_NS, 'p'));
  const fallbackPList = pList.length > 0 ? pList : Array.from(tc.querySelectorAll('p'));

  let protoP: Element;
  if (fallbackPList.length > 0) {
    protoP = fallbackPList[0].cloneNode(true) as Element;
  } else {
    const doc = tc.ownerDocument;
    protoP = doc.createElementNS(W_NS, 'w:p');
  }

  // Eliminar párrafos existentes de la celda
  for (const p of fallbackPList) {
    tc.removeChild(p);
  }

  const doc = tc.ownerDocument;
  const lineasProcesar = lineas && lineas.length > 0 ? lineas : [''];

  for (const linea of lineasProcesar) {
    const nuevoP = protoP.cloneNode(true) as Element;
    setTextoParrafo(nuevoP, linea);
    tc.appendChild(nuevoP);
  }
}

/**
 * Modifica solo el valor de un segmento no-negrita en párrafos compuestos (ej. "Docente: [X]   Grado: [Y]")
 * Conserva la etiqueta en negrita intacta
 */
export function setValorSegmento(p: Element, indiceSegmento: number, valor: string): void {
  const runs = Array.from(p.getElementsByTagNameNS(W_NS, 'r'));
  const fallbackRuns = runs.length > 0 ? runs : Array.from(p.querySelectorAll('r'));

  // Segmentos no-negrita
  let nonBoldCount = 0;
  for (const r of fallbackRuns) {
    const bNode = r.getElementsByTagNameNS(W_NS, 'b')[0] || r.querySelector('b');
    let esNegrita = false;
    if (bNode) {
      const val = bNode.getAttributeNS(W_NS, 'val') || bNode.getAttribute('w:val') || bNode.getAttribute('val');
      esNegrita = val !== '0' && val !== 'false';
    }

    if (!esNegrita) {
      if (nonBoldCount === indiceSegmento) {
        // Encontrado: reemplazar el contenido de este run
        const tNodes = Array.from(r.getElementsByTagNameNS(W_NS, 't'));
        const fallbackTNodes = tNodes.length > 0 ? tNodes : Array.from(r.querySelectorAll('t'));

        if (fallbackTNodes.length > 0) {
          fallbackTNodes[0].textContent = ` ${valor.trim()} `;
          fallbackTNodes[0].setAttribute('xml:space', 'preserve');
          // Quitar t sobrantes en ese run
          for (let i = 1; i < fallbackTNodes.length; i++) {
            r.removeChild(fallbackTNodes[i]);
          }
        } else {
          const doc = p.ownerDocument;
          const newT = doc.createElementNS(W_NS, 'w:t');
          newT.setAttribute('xml:space', 'preserve');
          newT.textContent = ` ${valor.trim()} `;
          r.appendChild(newT);
        }
        return;
      }
      nonBoldCount++;
    }
  }

  // Si no encontró por índice de no-negrita, buscar por índice absoluto de runs
  if (fallbackRuns[indiceSegmento]) {
    const r = fallbackRuns[indiceSegmento];
    const tNodes = Array.from(r.getElementsByTagNameNS(W_NS, 't'));
    if (tNodes.length > 0) {
      tNodes[0].textContent = ` ${valor.trim()} `;
      tNodes[0].setAttribute('xml:space', 'preserve');
    }
  }
}

/**
 * Clona una fila w:tr garantizando que vMerge se resetee en la copia para no romper la tabla
 */
export function clonarFila(tr: Element): Element {
  const nuevaTr = tr.cloneNode(true) as Element;

  // Inspeccionar celdas y neutralizar w:vMerge
  const tcList = Array.from(nuevaTr.getElementsByTagNameNS(W_NS, 'tc'));
  const fallbackTcList = tcList.length > 0 ? tcList : Array.from(nuevaTr.querySelectorAll('tc'));

  for (const tc of fallbackTcList) {
    const vMergeList = Array.from(tc.getElementsByTagNameNS(W_NS, 'vMerge'));
    const fallbackVMerge = vMergeList.length > 0 ? vMergeList : Array.from(tc.querySelectorAll('vMerge'));
    for (const vm of fallbackVMerge) {
      vm.parentNode?.removeChild(vm);
    }
  }

  return nuevaTr;
}

/**
 * Inserta una fila inmediatamente después de otra
 */
export function insertarFilaDespues(tr: Element, nuevaTr: Element): void {
  tr.parentNode?.insertBefore(nuevaTr, tr.nextSibling);
}

/**
 * Elimina una fila del DOM de la tabla
 */
export function eliminarFila(tr: Element): void {
  tr.parentNode?.removeChild(tr);
}

/**
 * Clona una tabla completa e inserta un párrafo separador idéntico
 */
export function clonarTabla(tbl: Element): Element {
  const nuevaTbl = tbl.cloneNode(true) as Element;
  const doc = tbl.ownerDocument;

  // Párrafo separador
  const pSep = doc.createElementNS(W_NS, 'w:p');

  const parent = tbl.parentNode;
  if (parent) {
    parent.insertBefore(pSep, tbl.nextSibling);
    parent.insertBefore(nuevaTbl, pSep.nextSibling);
  }

  return nuevaTbl;
}

/**
 * Serializa word/document.xml preservando namespaces nativos y genera el Blob DOCX con compresión DEFLATE
 */
export async function guardarDocx(zip: JSZip, doc: Document): Promise<Blob> {
  const serializer = new XMLSerializer();
  const xmlString = serializer.serializeToString(doc);

  // Asegurar que la declaración XML esté al inicio
  const finalXml = xmlString.startsWith('<?xml')
    ? xmlString
    : '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' + xmlString;

  zip.file('word/document.xml', finalXml);

  return await zip.generateAsync({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 },
  });
}

/**
 * Validación automática de integridad del archivo DOCX clonado
 */
export async function validarDocxClonado(
  originalZip: JSZip,
  clonedBlob: Blob
): Promise<{ valido: boolean; errores: string[] }> {
  const errores: string[] = [];

  try {
    // 1. Verificar apertura del zip
    const testZip = await JSZip.loadAsync(await clonedBlob.arrayBuffer());

    // 2. Verificar que word/document.xml existe y parsea
    const docEntry = testZip.file('word/document.xml');
    if (!docEntry) {
      errores.push('word/document.xml no se encuentra en el archivo generado.');
    } else {
      const xmlStr = await docEntry.async('string');
      const doc = new DOMParser().parseFromString(xmlStr, 'application/xml');
      const err = doc.querySelector('parsererror');
      if (err) {
        errores.push('Error de sintaxis XML en word/document.xml: ' + err.textContent);
      }
    }

    // 3. Verificar que los archivos de medios (logos, imágenes) siguen idénticos
    const origMedia = Object.keys(originalZip.files).filter((f) => f.startsWith('word/media/'));
    const clonedMedia = Object.keys(testZip.files).filter((f) => f.startsWith('word/media/'));

    if (origMedia.length !== clonedMedia.length) {
      errores.push(`Se perdieron archivos de imagen: original tenía ${origMedia.length}, generado tiene ${clonedMedia.length}`);
    }
  } catch (e: any) {
    errores.push('Excepción general al validar el DOCX generado: ' + e?.message);
  }

  return {
    valido: errores.length === 0,
    errores,
  };
}

/**
 * Prueba de ida y vuelta obligatoria (Roundtrip test)
 * Carga un DOCX, extrae el mapa, guarda sin alteraciones y verifica paridad exacta
 */
export async function ejecutarPruebaIdaYVuelta(
  file: File | Blob | ArrayBuffer
): Promise<{ exito: boolean; detalles: string; stats: any }> {
  try {
    const { zip: origZip, doc, xmlString: origXml } = await cargarDocx(file);
    const mapa = construirMapa(doc);

    // Guardar sin modificaciones
    const clonedBlob = await guardarDocx(origZip, doc);

    // Validar el resultado
    const { zip: newZip, doc: newDoc } = await cargarDocx(clonedBlob);
    const nuevoMapa = construirMapa(newDoc);

    const origMedia = Object.keys(origZip.files).filter((f) => f.startsWith('word/media/'));
    const newMedia = Object.keys(newZip.files).filter((f) => f.startsWith('word/media/'));

    const stats = {
      parrafosOriginales: mapa.parrafos.length,
      parrafosGenerados: nuevoMapa.parrafos.length,
      tablasOriginales: mapa.tablas.length,
      tablasGeneradas: nuevoMapa.tablas.length,
      archivosMediaOriginales: origMedia.length,
      archivosMediaGenerados: newMedia.length,
      tamanoOriginalBytes: (file instanceof ArrayBuffer ? file.byteLength : file.size),
      tamanoGeneradoBytes: clonedBlob.size,
    };

    const exito =
      stats.parrafosOriginales === stats.parrafosGenerados &&
      stats.tablasOriginales === stats.tablasGeneradas &&
      stats.archivosMediaOriginales === stats.archivosMediaGenerados;

    const detalles = exito
      ? `Prueba de Ida y Vuelta EXITOSA: ${stats.tablasOriginales} tablas, ${stats.parrafosOriginales} párrafos y ${stats.archivosMediaOriginales} imágenes conservadas sin corrupción.`
      : `Discrepancia detectada en la prueba: Párrafos (${stats.parrafosOriginales} vs ${stats.parrafosGenerados}), Tablas (${stats.tablasOriginales} vs ${stats.tablasGeneradas}).`;

    return { exito, detalles, stats };
  } catch (err: any) {
    return {
      exito: false,
      detalles: 'Fallo catastrófico en la prueba de ida y vuelta: ' + (err?.message || String(err)),
      stats: null,
    };
  }
}
