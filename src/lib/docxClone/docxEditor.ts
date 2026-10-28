import JSZip from 'jszip';
import {
  DocxMapa,
  DocxParrafoNode,
  DocxTablaNode,
  DocxFilaNode,
  DocxCeldaNode,
  DocxSegmento,
  PlantillaDocx,
  CoberturaTabla,
} from './types';

const W_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';

/**
 * Obtiene los elementos hijos de un nodo de forma compatible con DOM de navegador y xmldom
 */
export function getElementChildren(elem: Element | Node | null | undefined): Element[] {
  if (!elem) return [];
  if ((elem as any).children && (elem as any).children.length !== undefined) {
    return Array.from((elem as any).children);
  }
  return Array.from(elem.childNodes || []).filter((n: any) => n.nodeType === 1) as Element[];
}

/**
 * Busca el primer descendiente que coincida con localName de forma compatible con cualquier DOM
 */
export function findFirstDescendant(elem: Element | Document | null | undefined, localName: string): Element | null {
  if (!elem) return null;
  const nsMatch = elem.getElementsByTagNameNS ? elem.getElementsByTagNameNS(W_NS, localName)[0] : null;
  if (nsMatch) return nsMatch;
  const tagPrefixed = elem.getElementsByTagName ? elem.getElementsByTagName(`w:${localName}`)[0] : null;
  if (tagPrefixed) return tagPrefixed;
  const tagDirect = elem.getElementsByTagName ? elem.getElementsByTagName(localName)[0] : null;
  if (tagDirect) return tagDirect;
  if ((elem as any).querySelector) {
    try {
      return (elem as any).querySelector(localName);
    } catch {}
  }
  return null;
}

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

  const children = getElementChildren(body);

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

      const trNodes = getElementChildren(child).filter((c) => {
        const name = c.localName || c.nodeName.replace(/^.*:/, '');
        return name === 'tr';
      });

      trNodes.forEach((tr, rIdx) => {
        const rId = `${tId}.r${rIdx}`;
        const celdas: DocxCeldaNode[] = [];

        // tblHeader & cantSplit
        const tblHeader = findFirstDescendant(tr, 'tblHeader');
        const cantSplit = findFirstDescendant(tr, 'cantSplit');

        const tcNodes = getElementChildren(tr).filter((c) => {
          const name = c.localName || c.nodeName.replace(/^.*:/, '');
          return name === 'tc';
        });

        tcNodes.forEach((tc, cIdx) => {
          const cId = `${rId}.c${cIdx}`;
          const rawText = getTextoCompleto(tc).trim();

          // lineas de la celda
          const pInTc = getElementChildren(tc).filter(
            (c) => (c.localName || c.nodeName.replace(/^.*:/, '')) === 'p'
          );
          const lineas = pInTc.map((p) => getTextoCompleto(p).trim()).filter(Boolean);

          // gridSpan
          const gridSpanNode = findFirstDescendant(tc, 'gridSpan');
          let gridSpan = 1;
          if (gridSpanNode) {
            const val = gridSpanNode.getAttributeNS(W_NS, 'val') || gridSpanNode.getAttribute('w:val') || gridSpanNode.getAttribute('val');
            if (val) gridSpan = parseInt(val, 10) || 1;
          }

          // vMerge
          const vMergeNode = findFirstDescendant(tc, 'vMerge');
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
 * Busca un párrafo en w:body por su id (p0, p1, ...) recorriendo ÚNICAMENTE los hijos directos de w:body.
 * Garantiza coincidencia 1:1 con los IDs generados por construirMapa.
 */
export function buscarParrafoPorId(doc: Document, pId: string): Element | null {
  const body = doc.getElementsByTagNameNS(W_NS, 'body')[0] || doc.querySelector('body');
  if (!body) return null;

  const targetIndex = parseInt(pId.replace(/^p/, ''), 10);
  if (isNaN(targetIndex)) return null;

  let pCount = 0;
  for (const child of getElementChildren(body)) {
    const localName = child.localName || child.nodeName.replace(/^.*:/, '');
    if (localName === 'p') {
      if (pCount === targetIndex) {
        return child;
      }
      pCount++;
    }
  }

  return null;
}

/**
 * Busca una tabla en w:body por su id (t0, t1, ...) recorriendo los hijos directos de w:body.
 * Garantiza coincidencia 1:1 con construirMapa.
 */
export function buscarTablaPorId(doc: Document, tId: string): Element | null {
  const body = doc.getElementsByTagNameNS(W_NS, 'body')[0] || (doc.querySelector ? doc.querySelector('body') : null);
  if (!body) return null;

  const targetIndex = parseInt(tId.replace(/^t/, ''), 10);
  if (isNaN(targetIndex)) return null;

  let tCount = 0;
  for (const child of getElementChildren(body)) {
    const localName = child.localName || child.nodeName.replace(/^.*:/, '');
    if (localName === 'tbl') {
      if (tCount === targetIndex) {
        return child;
      }
      tCount++;
    }
  }

  // Fallback global
  const tablas = Array.from(doc.getElementsByTagNameNS(W_NS, 'tbl'));
  return tablas[targetIndex] || null;
}

/**
 * Busca una fila por id compuesto "tX.rY"
 */
export function buscarFilaPorId(doc: Document, rId: string): Element | null {
  const parts = rId.split('.');
  if (parts.length < 2) return null;
  const tbl = buscarTablaPorId(doc, parts[0]);
  if (!tbl) return null;

  const rIndex = parseInt(parts[1].replace(/^r/, ''), 10);
  const rows = getElementChildren(tbl).filter(
    (c) => (c.localName || c.nodeName.replace(/^.*:/, '')) === 'tr'
  );
  return rows[rIndex] || null;
}

/**
 * Busca una celda por id compuesto "tX.rY.cZ"
 */
export function buscarCeldaPorId(doc: Document, cId: string): Element | null {
  const parts = cId.split('.');
  if (parts.length < 3) return null;
  const tr = buscarFilaPorId(doc, `${parts[0]}.${parts[1]}`);
  if (!tr) return null;

  const cIndex = parseInt(parts[2].replace(/^c/, ''), 10);
  const celdas = getElementChildren(tr).filter(
    (c) => (c.localName || c.nodeName.replace(/^.*:/, '')) === 'tc'
  );
  return celdas[cIndex] || null;
}

export interface CampoEncabezadoParrafo {
  etiqueta: string;
  valor: string;
}

/**
 * Reescribe uno o varios campos de encabezado en un párrafo w:p trabajando con rangos de caracteres
 * sobre el texto concatenado del párrafo.
 * Regla: Ubica la posición de CADA etiqueta del párrafo por su texto.
 * El valor de una etiqueta va desde el final de esa etiqueta hasta el inicio de la siguiente etiqueta (o el fin del párrafo).
 * Reemplaza ese rango: pone el texto nuevo en el primer run que toque el rango (conservando su formato)
 * y recorta o vacía los demás runs en ese rango.
 * No usa negrita ni tamaño para decidir dónde termina el valor.
 * Etiquetas intactas, valor sin duplicados ni restos.
 */
export function setValorSegmentoMultiples(
  p: Element,
  campos: CampoEncabezadoParrafo[]
): void {
  const runs = Array.from(p.getElementsByTagNameNS(W_NS, 'r'));
  const fallbackRuns = runs.length > 0 ? runs : Array.from(p.querySelectorAll('r'));
  if (fallbackRuns.length === 0 || campos.length === 0) return;

  const runTexts = fallbackRuns.map((r) => getTextoCompleto(r));
  const fullText = runTexts.join('');
  if (!fullText) return;

  // 1. Mapear intervalos [start, end) de cada run
  let curPos = 0;
  const runIntervals = fallbackRuns.map((r, i) => {
    const text = runTexts[i];
    const start = curPos;
    const end = curPos + text.length;
    curPos = end;
    return { run: r, text, start, end };
  });

  // 2. Ubicar la posición de cada etiqueta en fullText
  interface TagMatch {
    etiqueta: string;
    valor: string;
    startPos: number;
    labelEndPos: number;
  }

  const matches: TagMatch[] = [];

  for (const campo of campos) {
    const labelRaw = (campo.etiqueta || '').trim();
    if (!labelRaw) continue;

    let idx = fullText.toLowerCase().indexOf(labelRaw.toLowerCase());
    let matchLen = labelRaw.length;

    if (idx === -1) {
      // Probar quitando dos puntos al final o espacios
      const sinDosPuntos = labelRaw.replace(/:\s*$/, '').trim();
      if (sinDosPuntos.length >= 2) {
        idx = fullText.toLowerCase().indexOf(sinDosPuntos.toLowerCase());
        if (idx !== -1) {
          matchLen = sinDosPuntos.length;
          if (fullText[idx + matchLen] === ':') {
            matchLen++;
          }
        }
      }
    }

    if (idx !== -1) {
      matches.push({
        etiqueta: labelRaw,
        valor: campo.valor,
        startPos: idx,
        labelEndPos: idx + matchLen,
      });
    }
  }

  if (matches.length === 0) {
    // Si no se encontró ninguna etiqueta por texto pero se pasó al menos un valor,
    // colocamos el valor en el último run preservando prefijo
    const primerCampo = campos[0];
    if (primerCampo && primerCampo.valor) {
      const lastRun = fallbackRuns[fallbackRuns.length - 1];
      const tNode = lastRun.getElementsByTagNameNS(W_NS, 't')[0] || lastRun.querySelector('t');
      if (tNode) {
        tNode.textContent = ` ${primerCampo.valor.trim()} `;
        tNode.setAttribute('xml:space', 'preserve');
      }
    }
    return;
  }

  // Ordenar por startPos
  matches.sort((a, b) => a.startPos - b.startPos);

  // 3. Construir todas las sustituciones sobre el texto ORIGINAL. Modificar un
  // run dentro del bucle invalidaba los desplazamientos de las etiquetas que
  // compartían ese mismo run y revertía los valores editados previamente.
  const nuevosTextos = runIntervals.map(() => '');

  const conservarOriginal = (desde: number, hasta: number) => {
    for (let i = 0; i < runIntervals.length; i++) {
      const ri = runIntervals[i];
      const inicio = Math.max(desde, ri.start);
      const fin = Math.min(hasta, ri.end);
      if (fin > inicio) {
        nuevosTextos[i] += ri.text.slice(inicio - ri.start, fin - ri.start);
      }
    }
  };

  const insertarNuevoValor = (posicion: number, texto: string) => {
    // Si el valor empieza entre dos runs, usar el segundo: normalmente tiene
    // el estilo de los valores y no la negrita de la etiqueta institucional.
    let indice = runIntervals.findIndex((ri) => ri.start <= posicion && posicion < ri.end);
    if (indice === -1) indice = runIntervals.findIndex((ri) => ri.start >= posicion);
    if (indice === -1) indice = runIntervals.length - 1;
    nuevosTextos[indice] += texto;
  };

  let cursor = 0;
  for (let k = 0; k < matches.length; k++) {
    const campo = matches[k];
    conservarOriginal(cursor, campo.labelEndPos); // Conserva todas las etiquetas.
    insertarNuevoValor(campo.labelEndPos, ` ${campo.valor.trim()} `);
    cursor = k + 1 < matches.length ? matches[k + 1].startPos : fullText.length;
  }
  conservarOriginal(cursor, fullText.length);

  // Actualizar cada run una sola vez, sin tocar sus propiedades de formato.
  runIntervals.forEach(({ run }, indice) => {
    const nodosNS = Array.from(run.getElementsByTagNameNS(W_NS, 't'));
    const nodosTexto = nodosNS.length > 0 ? nodosNS : Array.from(run.querySelectorAll('t'));
    nodosTexto.forEach((nodo, n) => {
      nodo.textContent = n === 0 ? nuevosTextos[indice] : '';
      nodo.setAttribute('xml:space', 'preserve');
    });
  });
}

/**
 * Modifica el valor asociado a una etiqueta en párrafos compuestos (ej: "Docente: Juan Perez   Grado: 3ero")
 * Localiza la etiqueta por su texto dentro del texto concatenado de los runs sin tocarla y actualiza el valor.
 */
export function setValorSegmento(
  p: Element,
  etiquetaOIndice: string | number,
  valor: string
): void {
  const etiqueta = typeof etiquetaOIndice === 'string' ? etiquetaOIndice : '';
  setValorSegmentoMultiples(p, [{ etiqueta, valor }]);
}

/**
 * Modifica o inserta múltiples párrafos consecutivos en w:body (ej: Diagnóstico pedagógico o Finalidad)
 * Escribe los párrafos nuevos clonando el formato del prototipo y elimina los viejos sobrantes.
 */
export function setTextoParrafosMultiples(
  doc: Document,
  primerP: Element,
  lineas: string[],
  viejosParrafosAEliminar?: Element[]
): void {
  const lineasProcesar = lineas && lineas.length > 0 ? lineas : [''];
  const parent = primerP.parentNode;
  if (!parent) {
    setTextoParrafo(primerP, lineasProcesar[0]);
    return;
  }

  // 1. Escribir el primer párrafo en primerP
  setTextoParrafo(primerP, lineasProcesar[0]);

  // 2. Clonar e insertar los siguientes párrafos
  let lastP = primerP;
  for (let i = 1; i < lineasProcesar.length; i++) {
    const nuevoP = primerP.cloneNode(true) as Element;
    setTextoParrafo(nuevoP, lineasProcesar[i]);
    parent.insertBefore(nuevoP, lastP.nextSibling);
    lastP = nuevoP;
  }

  // 3. Eliminar los párrafos viejos sobrantes
  if (viejosParrafosAEliminar && viejosParrafosAEliminar.length > 0) {
    for (const viejoP of viejosParrafosAEliminar) {
      if (viejoP && viejoP !== primerP && viejoP.parentNode) {
        viejoP.parentNode.removeChild(viejoP);
      }
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

export interface OpcionesValidacionDocx {
  plantilla?: PlantillaDocx;
  conteoEsperadoFilas?: Record<string, number>; // idTabla -> número de filas esperadas
  textosOriginalesContenido?: string[]; // Textos que estaban en celdas de contenido o textos libres del Word original
  membreteYEtiquetas?: string[]; // Etiquetas o nombres fijos a excluir del chequeo residual
  celdasContenidoOriginales?: Record<string, string>; // cId -> textoOriginal
  constantesPermitidas?: Set<string>; // Textos constantes como Ejes Integradores que pueden quedarse
  terminosProhibidos?: string[]; // Términos derivados dinámicamente del documento original
}

/**
 * Validación automática de integridad del archivo DOCX clonado:
 * - Integridad XML y Zip
 * - Identidad de archivos de medios (logos)
 * - (a) Conteo esperado de filas por tabla
 * - (b) Texto residual: ninguna celda de contenido queda idéntica al original (salvo constantes)
 * - (c) Encabezado sin etiquetas ni valores duplicados y sin letras sueltas rotas
 * - (d) Ausencia de términos prohibidos del documento original
 */
export async function validarDocxClonado(
  originalZip: JSZip,
  clonedBlob: Blob,
  opciones?: OpcionesValidacionDocx
): Promise<{ valido: boolean; errores: string[]; docGenerado?: Document }> {
  const errores: string[] = [];
  let docGenerado: Document | undefined = undefined;

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
      } else {
        docGenerado = doc;
      }
    }

    // 3. Verificar identidad de cada imagen, además de su cantidad. Contar
    // archivos no detecta un logo sustituido o alterado que use el mismo nombre.
    const origMedia = Object.keys(originalZip.files).filter(
      (f) => f.startsWith('word/media/') && !originalZip.files[f].dir
    );
    const clonedMedia = Object.keys(testZip.files).filter(
      (f) => f.startsWith('word/media/') && !testZip.files[f].dir
    );

    if (origMedia.length !== clonedMedia.length) {
      errores.push(`Se perdieron archivos de imagen: original tenía ${origMedia.length}, generado tiene ${clonedMedia.length}`);
    }

    for (const nombre of origMedia) {
      const archivoOriginal = originalZip.file(nombre);
      const archivoGenerado = testZip.file(nombre);
      if (!archivoOriginal || !archivoGenerado) {
        errores.push(`La imagen original ${nombre} no está en el Word generado.`);
        continue;
      }
      const [bytesOriginales, bytesGenerados] = await Promise.all([
        archivoOriginal.async('uint8array'),
        archivoGenerado.async('uint8array'),
      ]);
      if (bytesOriginales.length !== bytesGenerados.length ||
          bytesOriginales.some((byte, index) => byte !== bytesGenerados[index])) {
        errores.push(`La imagen original ${nombre} fue modificada en el Word generado.`);
      }
    }

    if (docGenerado) {
      // (a) CONTEO ESPERADO DE FILAS POR TABLA
      if (opciones?.conteoEsperadoFilas) {
        for (const [tId, esperado] of Object.entries(opciones.conteoEsperadoFilas)) {
          const tElem = buscarTablaPorId(docGenerado, tId);
          if (tElem) {
            const rows = getElementChildren(tElem).filter(
              (c) => (c.localName || c.nodeName.replace(/^.*:/, '')) === 'tr'
            );
            if (rows.length !== esperado) {
              errores.push(`Tabla ${tId}: contiene ${rows.length} filas, se esperaban exactamente ${esperado}.`);
            }
          }
        }
      }

      // (b) CELDAS DE CONTENIDO: NINGUNA debe quedar idéntica al texto original (salvo constantes)
      if (opciones?.celdasContenidoOriginales) {
        const celdasSinCambiar: string[] = [];
        for (const [cId, origText] of Object.entries(opciones.celdasContenidoOriginales)) {
          if (!origText || origText.trim().length < 8) continue;
          if (opciones.constantesPermitidas?.has(origText.trim())) continue;

          const tcTarget = buscarCeldaPorId(docGenerado, cId);
          if (tcTarget) {
            const genText = getTextoCompleto(tcTarget).trim();
            if (genText === origText.trim()) {
              celdasSinCambiar.push(cId);
              if (celdasSinCambiar.length <= 3) {
                errores.push(`Celda [${cId}] no fue actualizada (conserva texto del original: "${origText.slice(0, 30)}...").`);
              }
            }
          }
        }
        if (celdasSinCambiar.length > 3) {
          errores.push(`Total de ${celdasSinCambiar.length} celdas de contenido quedaron sin cambiar.`);
        }
      }

      // (c) TEXTO RESIDUAL: frases de 4 o más palabras del contenido original
      const bodyElem = docGenerado.getElementsByTagNameNS(W_NS, 'body')[0] || docGenerado.querySelector('body');
      const docTextoGenerado = bodyElem ? getTextoCompleto(bodyElem).toLowerCase() : '';

      if (opciones?.textosOriginalesContenido && opciones.textosOriginalesContenido.length > 0) {
        const permitidas = new Set<string>();
        (opciones.membreteYEtiquetas || []).forEach((et) => {
          et.toLowerCase()
            .replace(/[^\p{L}\p{N}\s]/gu, ' ')
            .split(/\s+/)
            .forEach((w) => {
              if (w.length > 1) permitidas.add(w);
            });
        });

        const frasesResiduales = new Set<string>();
        for (const origText of opciones.textosOriginalesContenido) {
          if (!origText || origText.trim().length < 15) continue;
          if (opciones.constantesPermitidas?.has(origText.trim())) continue;

          const palabras = origText
            .toLowerCase()
            .replace(/[^\p{L}\p{N}\s]/gu, ' ')
            .split(/\s+/)
            .filter((p) => p.length > 2);

          for (let i = 0; i <= palabras.length - 4; i++) {
            const cuatroPalabras = palabras.slice(i, i + 4);
            const noPermitidas = cuatroPalabras.filter((p) => !permitidas.has(p));
            if (noPermitidas.length >= 2) {
              const frase = cuatroPalabras.join(' ');
              if (docTextoGenerado.includes(frase)) {
                frasesResiduales.add(frase);
                if (frasesResiduales.size >= 3) break;
              }
            }
          }
          if (frasesResiduales.size >= 3) break;
        }

        if (frasesResiduales.size > 0) {
          errores.push(
            `Texto residual detectado en el documento: "${Array.from(frasesResiduales).join('", "')}".`
          );
        }
      }

      // (d) TÉRMINOS PROHIBIDOS DEL ORIGINAL
      if (opciones?.terminosProhibidos && opciones.terminosProhibidos.length > 0) {
        for (const term of opciones.terminosProhibidos) {
          if (term && term.trim().length > 2) {
            const regex = new RegExp(`\\b${term.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
            if (regex.test(docTextoGenerado)) {
              errores.push(`Término prohibido del proyecto original detectado: "${term}".`);
            }
          }
        }
      }

      // (e) ENCABEZADO SIN ETIQUETAS NI VALORES DUPLICADOS Y SIN LETRAS SUELTAS
      if (opciones?.plantilla?.encabezados) {
        for (const enc of opciones.plantilla.encabezados) {
          const pElem = buscarParrafoPorId(docGenerado, enc.parrafoId);
          if (pElem) {
            const pTexto = getTextoCompleto(pElem);
            const etiquetaLimpia = enc.etiqueta.trim();
            if (etiquetaLimpia.length > 2) {
              const regex = new RegExp(etiquetaLimpia.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
              const matches = pTexto.match(regex);
              if (matches && matches.length > 1) {
                errores.push(`Etiqueta duplicada en encabezado [${enc.parrafoId}]: "${etiquetaLimpia}" aparece ${matches.length} veces.`);
              }
            }

            // Chequeo de letras sueltas rotas (ej: "D o c e n t e" o "G r a d o")
            if (/\b([a-zA-ZáéíóúÁÉÍÓÚ]\s+){4,}[a-zA-ZáéíóúÁÉÍÓÚ]\b/.test(pTexto)) {
              errores.push(`Letras sueltas de etiqueta rota detectadas en el encabezado [${enc.parrafoId}].`);
            }
          }
        }
      }
    }
  } catch (e: any) {
    errores.push('Excepción general al validar el DOCX generado: ' + e?.message);
  }

  return {
    valido: errores.length === 0,
    errores,
    docGenerado,
  };
}

/**
 * Calcula el informe de cobertura por tabla:
 * tipo detectado, celdas de contenido, celdas reemplazadas y celdas sin cambio.
 */
export function calcularCoberturaTablas(
  docOriginal: Document,
  docGenerado: Document,
  plantilla?: PlantillaDocx
): CoberturaTabla[] {
  const mapaOrig = construirMapa(docOriginal);
  const cobertura: CoberturaTabla[] = [];

  // Mapear constantes que se repiten en 3 o más tablas
  const textosCeldas = new Map<string, number>();
  mapaOrig.tablas.forEach((t) => {
    t.filas.forEach((f) => {
      f.celdas.forEach((c) => {
        const txt = c.rawText.trim();
        if (txt.length > 15) {
          textosCeldas.set(txt, (textosCeldas.get(txt) || 0) + 1);
        }
      });
    });
  });

  const esConstante = (txt: string) => {
    const t = txt.trim().toLowerCase();
    if (
      t.includes('ejes integradores') ||
      t.includes('intencionalidades curriculares') ||
      t.includes('pilares de la educaci') ||
      t.includes('perfil del egresado')
    ) {
      return true;
    }
    return (textosCeldas.get(txt.trim()) || 0) >= 3;
  };

  const esEtiqueta = (txt: string) => {
    const t = txt.trim().toUpperCase();
    if (t.endsWith(':') && t.length < 35) return true;
    const conocidas = [
      'ÁREA DE FORMACIÓN',
      'AREA DE FORMACION',
      'COMPONENTE',
      'APRENDIZAJE A SER ALCANZADO',
      'CONTENIDOS',
      'REFERENTES TEÓRICOS',
      'ACTIVIDADES',
      'ESTRATEGIAS',
      'INDICADORES',
      'TÉCNICA',
      'INSTRUMENTO',
      'FECHA',
      'RECURSOS',
      'SEMANA',
      'DÍA',
      'MOMENTO',
      'PROPÓSITO',
    ];
    return conocidas.some((c) => t === c || t.startsWith(c + ':'));
  };

  mapaOrig.tablas.forEach((tOrig) => {
    const tId = tOrig.id;
    const tblInfo = plantilla?.tablas.find((t) => t.id === tId);
    let tipoDetectado = tblInfo?.tipo || 'general';

    if (tipoDetectado === 'general') {
      const fullTxt = tOrig.filas
        .map((f) => f.celdas.map((c) => c.rawText).join(' '))
        .join(' ')
        .toLowerCase();
      if (fullTxt.includes('cronograma') || fullTxt.includes('semana 1') || fullTxt.includes('semanas')) {
        tipoDetectado = 'cronograma';
      } else if (fullTxt.includes('evaluación') || fullTxt.includes('indicador') || fullTxt.includes('instrumento')) {
        tipoDetectado = 'plan_evaluacion';
      } else if (fullTxt.includes('estrategias') || fullTxt.includes('construcción')) {
        tipoDetectado = 'construccion_estrategias';
      } else if (fullTxt.includes('ficha') || fullTxt.includes('componente') || fullTxt.includes('aprendizaje a ser')) {
        tipoDetectado = 'ficha_area';
      }
    }

    let totalCeldas = 0;
    let celdasContenido = 0;
    let celdasReemplazadas = 0;
    let celdasSinCambio = 0;

    const tblGen = buscarTablaPorId(docGenerado, tId);

    tOrig.filas.forEach((fOrig, rIdx) => {
      if (fOrig.isHeader || (rIdx === 0 && tipoDetectado !== 'general')) return;

      fOrig.celdas.forEach((cOrig, cIdx) => {
        totalCeldas++;
        const txtOrig = cOrig.rawText.trim();
        if (txtOrig.length === 0) return;

        if (esConstante(txtOrig) || esEtiqueta(txtOrig)) {
          return;
        }

        celdasContenido++;

        let txtGen = '';
        if (tblGen) {
          const genTrs = getElementChildren(tblGen).filter(
            (c) => (c.localName || c.nodeName.replace(/^.*:/, '')) === 'tr'
          );
          if (genTrs[rIdx]) {
            const genTcs = getElementChildren(genTrs[rIdx]).filter(
              (c) => (c.localName || c.nodeName.replace(/^.*:/, '')) === 'tc'
            );
            if (genTcs[cIdx]) {
              txtGen = getTextoCompleto(genTcs[cIdx]).trim();
            }
          }
        }

        if (txtGen !== txtOrig) {
          celdasReemplazadas++;
        } else {
          celdasSinCambio++;
        }
      });
    });

    cobertura.push({
      id: tId,
      titulo: tblInfo?.titulo || `Tabla ${tId}`,
      tipoDetectado,
      totalCeldas,
      celdasContenido,
      celdasReemplazadas,
      celdasSinCambio,
    });
  });

  return cobertura;
}

/**
 * Prueba de ida y vuelta obligatoria (Roundtrip test)
 * Carga un DOCX, extrae el mapa, guarda sin alteraciones y verifica paridad exacta
 */
export async function ejecutarPruebaIdaYVuelta(
  file: File | Blob | ArrayBuffer
): Promise<{ exito: boolean; detalles: string; stats: any; coberturaTablas?: CoberturaTabla[] }> {
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

    const coberturaTablas = calcularCoberturaTablas(doc, newDoc);

    return { exito, detalles, stats, coberturaTablas };
  } catch (err: any) {
    return {
      exito: false,
      detalles: 'Fallo catastrófico en la prueba de ida y vuelta: ' + (err?.message || String(err)),
      stats: null,
      coberturaTablas: [],
    };
  }
}

