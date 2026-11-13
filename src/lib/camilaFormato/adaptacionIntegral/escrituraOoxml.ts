/**
 * Lectura y escritura OOXML SEGURA para el motor de adaptación integral.
 *
 * Garantías:
 *  - Un run que contiene w:drawing, w:pict, w:object, campos (fldChar/instrText),
 *    referencias de notas/comentarios u otro contenido que no sea texto NUNCA se
 *    elimina: solo se cambian los nodos w:t de los runs editables.
 *  - Los campos de Word (PAGE, NUMPAGES, TOC…) y los runs de w:fldSimple no se editan.
 *  - Se conservan w:pPr, el w:rPr del run principal, numeración (w:numPr) y la
 *    estructura de celdas. No funciona con el texto de cajas de texto ajenas al
 *    párrafo (cada w:p tiene sus propios runs).
 *  - No depende de querySelector: funciona con DOM de navegador y con xmldom.
 */
export const W_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';

const local = (n: Node | null | undefined): string =>
  !n ? '' : ((n as Element).localName || (n.nodeName || '').replace(/^.*:/, ''));
export const esW = (n: Node | null | undefined, nombre: string): boolean => !!n && n.nodeType === 1 && local(n) === nombre;

export function hijosW(e: Element | Node | null | undefined, nombre?: string): Element[] {
  if (!e) return [];
  const lista: Element[] = [];
  for (const h of Array.from(e.childNodes || [])) {
    if (h.nodeType === 1 && (!nombre || local(h) === nombre)) lista.push(h as Element);
  }
  return lista;
}
export function descendientesW(raiz: Element | Document, nombre: string): Element[] {
  return Array.from(raiz.getElementsByTagNameNS(W_NS, nombre)) as Element[];
}
export function atributoW(e: Element, nombre: string): string | null {
  return e.getAttributeNS(W_NS, nombre) ?? e.getAttribute(`w:${nombre}`) ?? e.getAttribute(nombre);
}
/** Párrafo w:p más cercano que contiene al nodo (el propio nodo si es un w:p). */
export function parrafoPropietario(n: Node): Element | null {
  for (let x: Node | null = n; x; x = x.parentNode) if (esW(x, 'p')) return x as Element;
  return null;
}
function tieneAncestro(n: Node, nombre: string, tope: Node): boolean {
  for (let x = n.parentNode; x && x !== tope; x = x.parentNode) if (esW(x, nombre)) return true;
  return false;
}

/** Runs cuyo párrafo propietario es `p` (excluye runs de cajas de texto anidadas). */
export function runsPropios(p: Element): Element[] {
  return descendientesW(p, 'r').filter((r) => parrafoPropietario(r) === p);
}

const NO_TEXTO = new Set([
  'drawing', 'pict', 'object', 'fldChar', 'instrText', 'footnoteReference', 'endnoteReference', 'commentReference',
  'sym', 'AlternateContent', 'delText', 'annotationRef', 'footnoteRef', 'endnoteRef', 'separator',
  'continuationSeparator', 'ptab', 'fldSimple',
]);
/** ¿El run lleva algo distinto de texto/formato que no debe perderse? */
export function runTieneContenidoNoTexto(r: Element): boolean {
  for (const h of hijosW(r)) {
    const n = local(h);
    if (NO_TEXTO.has(n)) return true;
    if (n === 'br') {
      const t = atributoW(h, 'type');
      if (t === 'page' || t === 'column') return true;
    }
  }
  return false;
}

/** Runs que pertenecen a un campo de Word o a w:fldSimple (no editables). */
function runsDeCampo(p: Element, runs: Element[]): Set<Element> {
  const enCampo = new Set<Element>();
  let profundidad = 0;
  for (const r of runs) {
    const tipos = hijosW(r, 'fldChar').map((f) => atributoW(f, 'fldCharType'));
    if (profundidad > 0 || tipos.length || hijosW(r, 'instrText').length || tieneAncestro(r, 'fldSimple', p)) enCampo.add(r);
    for (const t of tipos) {
      if (t === 'begin') profundidad++;
      else if (t === 'end') profundidad = Math.max(0, profundidad - 1);
    }
  }
  return enCampo;
}

const nodosT = (r: Element): Element[] => hijosW(r, 't');
const textoDeRun = (r: Element): string => nodosT(r).map((t) => t.textContent || '').join('');

/** Runs con texto que se pueden reescribir sin dañar campos ni medios. */
export function runsEditables(p: Element): Element[] {
  const runs = runsPropios(p);
  const campo = runsDeCampo(p, runs);
  return runs.filter((r) => !campo.has(r) && nodosT(r).length > 0);
}
/** Texto completo visible del párrafo (incluye resultado de campos). */
export function textoParrafo(p: Element): string {
  return runsPropios(p).map(textoDeRun).join('');
}
export function textoParrafoEditable(p: Element): string {
  return runsEditables(p).map(textoDeRun).join('');
}
export function parrafoTieneContenidoNoTexto(p: Element): boolean {
  return runsPropios(p).some(runTieneContenidoNoTexto);
}
export function parrafosDirectos(contenedor: Element): Element[] {
  return hijosW(contenedor, 'p');
}
export function textoCelda(tc: Element): string {
  return parrafosDirectos(tc).map(textoParrafo).join('\n');
}
/** Una línea por párrafo con texto (sin párrafos vacíos separadores). */
export function lineasCelda(tc: Element): string[] {
  return parrafosDirectos(tc).map(textoParrafo).map((t) => t.trim()).filter(Boolean);
}

export function runEsNegrita(r: Element): boolean {
  const rPr = hijosW(r, 'rPr')[0];
  const b = rPr ? hijosW(rPr, 'b')[0] : undefined;
  if (!b) return false;
  const v = atributoW(b, 'val');
  return v !== '0' && v !== 'false';
}
/** Todo el texto del párrafo está en negrita (útil para detectar etiquetas). */
export function parrafoTodoNegrita(p: Element): boolean {
  const con = runsPropios(p).filter((r) => textoDeRun(r).trim());
  return con.length > 0 && con.every(runEsNegrita);
}

function marcarEspacios(t: Element): void { t.setAttribute('xml:space', 'preserve'); }

function fijarTextoRun(r: Element, texto: string): void {
  for (const t of nodosT(r)) r.removeChild(t);
  const doc = r.ownerDocument;
  texto.split(/\r\n|\r|\n/).forEach((linea, i) => {
    if (i > 0) r.appendChild(doc.createElementNS(W_NS, 'w:br'));
    const t = doc.createElementNS(W_NS, 'w:t');
    marcarEspacios(t);
    t.textContent = linea;
    r.appendChild(t);
  });
}
function quitarTextoRun(r: Element): void {
  for (const t of nodosT(r)) r.removeChild(t);
  const quedan = hijosW(r).filter((h) => local(h) !== 'rPr');
  if (!quedan.length && r.parentNode) r.parentNode.removeChild(r);
}

function nuevoRunDesdeParrafo(p: Element): Element {
  const doc = p.ownerDocument;
  const r = doc.createElementNS(W_NS, 'w:r');
  const marca = hijosW(hijosW(p, 'pPr')[0], 'rPr')[0];
  if (marca) {
    const rPr = marca.cloneNode(true) as Element;
    for (const h of hijosW(rPr)) if (['ins', 'del', 'moveFrom', 'moveTo'].includes(local(h))) rPr.removeChild(h);
    r.appendChild(rPr);
  }
  return r;
}

/**
 * Sustituye TODO el texto editable del párrafo por `texto`, escribiéndolo en el run
 * de mayor texto (hereda su w:rPr) y vaciando los demás runs de texto. Los runs con
 * dibujos, campos, notas o comentarios se conservan intactos.
 */
export function escribirTextoParrafoSeguro(p: Element, texto: string): void {
  const editables = runsEditables(p);
  let principal: Element | undefined;
  let max = -1;
  for (const r of editables) {
    const n = textoDeRun(r).length;
    if (n > max) { max = n; principal = r; }
  }
  if (!principal) {
    principal = nuevoRunDesdeParrafo(p);
    p.appendChild(principal);
  }
  fijarTextoRun(principal, texto);
  for (const r of editables) if (r !== principal) quitarTextoRun(r);
}

export interface EdicionTexto { inicio: number; fin: number; reemplazo: string }

/**
 * Aplica ediciones de rango sobre el texto editable del párrafo respetando los
 * límites de runs: el reemplazo hereda el formato del run donde comienza el rango.
 * Devuelve cuántas ediciones se aplicaron.
 */
export function aplicarEdicionesEnParrafo(p: Element, calcular: (texto: string) => EdicionTexto[]): number {
  const nodos: Element[] = [];
  for (const r of runsEditables(p)) nodos.push(...nodosT(r));
  if (!nodos.length) return 0;
  const textos = nodos.map((n) => n.textContent || '');
  const inicios: number[] = [];
  let acumulado = 0;
  for (const t of textos) { inicios.push(acumulado); acumulado += t.length; }
  const completo = textos.join('');
  const ediciones = calcular(completo)
    .filter((e) => e.fin >= e.inicio && e.inicio >= 0 && e.fin <= completo.length)
    .sort((a, b) => a.inicio - b.inicio);
  let aplicadas = 0;
  for (let k = ediciones.length - 1; k >= 0; k--) {
    const { inicio, fin, reemplazo } = ediciones[k];
    let a = 0;
    for (let i = 0; i < nodos.length; i++) if (inicios[i] <= inicio) a = i;
    let b = a;
    if (fin > inicio) { for (let i = 0; i < nodos.length; i++) if (inicios[i] < fin) b = i; }
    const ta = nodos[a].textContent || '';
    const prefijo = ta.slice(0, inicio - inicios[a]);
    if (a === b) {
      nodos[a].textContent = prefijo + reemplazo + ta.slice(fin - inicios[a]);
      marcarEspacios(nodos[a]);
    } else {
      nodos[a].textContent = prefijo + reemplazo;
      marcarEspacios(nodos[a]);
      for (let i = a + 1; i < b; i++) nodos[i].textContent = '';
      const tb = nodos[b].textContent || '';
      nodos[b].textContent = tb.slice(fin - inicios[b]);
      marcarEspacios(nodos[b]);
    }
    aplicadas++;
  }
  return aplicadas;
}

/** Reemplaza únicamente el VALOR de «Etiqueta: valor» (desde `desde` hasta el final). */
export function escribirValorDesde(p: Element, desde: number, valor: string): number {
  return aplicarEdicionesEnParrafo(p, (t) => (desde <= t.length ? [{ inicio: desde, fin: t.length, reemplazo: valor }] : []));
}

function clonarParrafoSinMedios(p: Element): Element {
  const copia = p.cloneNode(true) as Element;
  for (const r of runsPropios(copia)) if (runTieneContenidoNoTexto(r)) r.parentNode?.removeChild(r);
  for (const n of [...descendientesW(copia, 'bookmarkStart'), ...descendientesW(copia, 'bookmarkEnd'),
    ...descendientesW(copia, 'commentRangeStart'), ...descendientesW(copia, 'commentRangeEnd'), ...descendientesW(copia, 'proofErr')]) {
    n.parentNode?.removeChild(n);
  }
  return copia;
}

/**
 * Escribe `lineas` en una celda reutilizando, en orden, sus párrafos con texto (así se
 * conservan viñetas/numeración y alineación). Los párrafos con logos o campos no se
 * eliminan. Si faltan párrafos se clona el último sin medios; si sobran, se eliminan
 * los que no contienen medios. Los párrafos vacíos separadores y las tablas anidadas
 * permanecen.
 */
export function escribirLineasCeldaSeguro(tc: Element, lineas: string[]): void {
  const deseadas = lineas.length ? lineas : [''];
  const directos = parrafosDirectos(tc);
  let destino = directos.filter((p) => textoParrafo(p).trim() !== '');
  if (!destino.length) destino = directos.length ? [directos[0]] : [];
  if (!destino.length) {
    const p = tc.ownerDocument.createElementNS(W_NS, 'w:p');
    tc.appendChild(p);
    destino = [p];
  }
  const comunes = Math.min(deseadas.length, destino.length);
  for (let i = 0; i < comunes; i++) escribirTextoParrafoSeguro(destino[i], deseadas[i]);
  for (let i = destino.length; i < deseadas.length; i++) {
    const base = clonarParrafoSinMedios(destino[destino.length - 1]);
    const previo = destino[i - 1];
    previo.parentNode?.insertBefore(base, previo.nextSibling);
    escribirTextoParrafoSeguro(base, deseadas[i]);
    destino.push(base);
  }
  for (let i = deseadas.length; i < destino.length; i++) {
    const sobrante = destino[i];
    if (parrafoTieneContenidoNoTexto(sobrante)) {
      for (const r of runsEditables(sobrante)) quitarTextoRun(r);
    } else sobrante.parentNode?.removeChild(sobrante);
  }
}

/** Limpia texto proveniente de un modelo antes de escribirlo en Word. */
export function sanearLineasModelo(lineas: unknown): string[] {
  if (!Array.isArray(lineas)) return [];
  return lineas
    .filter((l): l is string => typeof l === 'string')
    .flatMap((l) => l.split(/\r\n|\r|\n/))
    .map((l) => l
      // eslint-disable-next-line no-control-regex
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
      .replace(/^\s{0,3}#{1,6}\s+/, '')
      .replace(/\*\*(.+?)\*\*/g, '$1')
      .replace(/__(.+?)__/g, '$1')
      .replace(/^\s*(?:[-*•·]\s+)/, '')
      .replace(/\s{2,}/g, ' ')
      .trim())
    .filter((l) => l.length > 0);
}
