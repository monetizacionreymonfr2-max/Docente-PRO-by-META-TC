/**
 * Auditoría del DOCX resultante. Reabre el archivo FINAL desde sus bytes y lo compara
 * con el original: nada de lo que diga el modelo cuenta como prueba. El motor solo
 * puede anunciar éxito si `aprobado === true`.
 */
import { descendientesW, hijosW, textoParrafo } from './escrituraOoxml';
import { detectarMencionesGrado, etiquetaGrado, reemplazarGradoEnTexto, sinAcentos, type NumeroGrado } from './gradoEscolar';
import { inventariarParte, type BloqueDocx, type ParteDocx } from './inventarioDocx';
import { abrirPartesDocx, RE_PARTE_EDITABLE, type EntradaZip } from './partesDocx';
import { tokensTemporales } from './propuestasBloques';

export const MARCADOR_PENDIENTE = 'PENDIENTE DE CONFIRMAR';

export interface EntradaAuditoria {
  original: EntradaZip;
  resultado: EntradaZip;
  gradoOrigen: NumeroGrado;
  gradoDestino: NumeroGrado;
  docentesAnteriores: string[];
  docenteNuevo?: string;
  /** Bloques propuestos que el modelo devolvió SIN cambios y sin mención de grado (revisados). */
  idsRevisadosSinCambio?: string[];
  /** El docente aportó datos observados del grupo nuevo (diagnóstico, matrícula…). */
  hechosAportados?: boolean;
}
export interface CoberturaTablaAdaptacion {
  parte: string; tabla: number; seccion: string; bloquesEditables: number; revisados: number; modificados: number; protegidos: number;
}
export interface ResultadoAuditoria {
  aprobado: boolean;
  errores: string[];
  advertencias: string[];
  metricas: {
    partesEditables: number; partesIdenticas: number; mediaIdentica: number; dibujos: number; tablas: number;
    bloquesRevisados: number; bloquesModificados: number; etiquetasProtegidas: number;
  };
  cobertura: CoberturaTablaAdaptacion[];
}

const W_LOC = (n: Node) => (n as Element).localName || n.nodeName.replace(/^.*:/, '');
const normaliza = (s: string) => sinAcentos(s).replace(/\s+/g, ' ').trim();
const idemBytes = (a: Uint8Array, b: Uint8Array) => a.length === b.length && a.every((v, i) => v === b[i]);

// ---------- Esqueleto estructural (sin texto) ----------
const attrs = (el: Element) => Array.from(el.attributes || [])
  .filter((a) => !/rsid/i.test(a.name) && !a.name.startsWith('xmlns'))
  .map((a) => `${a.name}=${a.value}`).sort().join(',');
function sigNodo(el: Element | undefined): string {
  if (!el) return '';
  const hijos = Array.from(el.childNodes).filter((n) => n.nodeType === 1) as Element[];
  const texto = W_LOC(el) === 'instrText' ? `"${(el.textContent || '').trim()}"` : '';
  return `${W_LOC(el)}[${attrs(el)}]${texto}(${hijos.map(sigNodo).join('')})`;
}
const ESPECIALES = new Set(['hyperlink', 'bookmarkStart', 'bookmarkEnd', 'fldSimple', 'commentRangeStart', 'commentRangeEnd']);
function especialesDeParrafo(p: Element): string[] {
  const lista: string[] = [];
  for (const el of Array.from(p.getElementsByTagName('*'))) {
    const n = W_LOC(el);
    if (n === 'pPr') continue;
    if (ESPECIALES.has(n)) lista.push(`${n}[${attrs(el)}]`);
    else if (n === 'r') {
      const hijos = (Array.from(el.childNodes).filter((x) => x.nodeType === 1) as Element[]).map(W_LOC);
      if (hijos.some((h) => h !== 'rPr' && h !== 't')) lista.push(sigNodo(el));
    }
  }
  return lista;
}
interface Esqueleto { lineas: string[]; ppr: Array<{ clave: string; conjunto: Set<string> }> }
function esqueletoParte(doc: Document): Esqueleto {
  const lineas: string[] = [];
  const ppr: Esqueleto['ppr'] = [];
  const hijosEl = (el: Element) => Array.from(el.childNodes).filter((n) => n.nodeType === 1) as Element[];
  const visitar = (el: Element, enTc = false): void => {
    const n = W_LOC(el);
    if (n === 'tbl') {
      lineas.push(`TBL[${sigNodo(hijosW(el, 'tblPr')[0])}${sigNodo(hijosW(el, 'tblGrid')[0])}]`);
      for (const tr of hijosW(el, 'tr')) {
        lineas.push(`TR[${sigNodo(hijosW(tr, 'trPr')[0])}]`);
        for (const tc of hijosW(tr, 'tc')) visitarCelda(tc);
        lineas.push('/TR');
      }
      lineas.push('/TBL');
    } else if (n === 'p') {
      lineas.push(`P[${sigNodo(hijosW(el, 'pPr')[0])}]{${especialesDeParrafo(el).join('|')}}`);
    } else if (n === 'sectPr') lineas.push(`SECT${sigNodo(el)}`);
    else { lineas.push(`<${n}[${attrs(el)}]`); for (const h of hijosEl(el)) visitar(h, enTc); lineas.push(`</${n}`); }
  };
  const visitarCelda = (tc: Element) => {
    lineas.push(`TC[${sigNodo(hijosW(tc, 'tcPr')[0])}]`);
    const conjunto = new Set<string>();
    const especiales: string[] = [];
    for (const h of hijosEl(tc)) {
      const n = W_LOC(h);
      if (n === 'tcPr') continue;
      if (n === 'tbl') visitar(h, true);
      else if (n === 'p') { conjunto.add(sigNodo(hijosW(h, 'pPr')[0])); especiales.push(...especialesDeParrafo(h)); }
      else lineas.push(`?${n}`);
    }
    lineas.push(`CELDA{${especiales.join('|')}}`);
    ppr.push({ clave: String(ppr.length), conjunto });
    lineas.push('/TC');
  };
  visitar(doc.documentElement);
  return { lineas, ppr };
}
function compararEsqueletos(ruta: string, a: Esqueleto, b: Esqueleto): string[] {
  const errores: string[] = [];
  const n = Math.max(a.lineas.length, b.lineas.length);
  for (let i = 0; i < n; i++) {
    if (a.lineas[i] !== b.lineas[i]) {
      errores.push(`Estructura alterada en ${ruta} (elemento ${i}): «${(a.lineas[i] ?? '∅').slice(0, 90)}» ≠ «${(b.lineas[i] ?? '∅').slice(0, 90)}».`);
      return errores;
    }
  }
  a.ppr.forEach((x, i) => {
    const y = b.ppr[i];
    if (y && [...y.conjunto].some((s) => !x.conjunto.has(s))) errores.push(`Formato de párrafo nuevo en una celda de ${ruta}.`);
  });
  return errores;
}

const textoDeParrafos = (doc: Document): string[] => descendientesW(doc, 'p').map(textoParrafo);
const contarOcurrencias = (texto: string, aguja: string): number => {
  if (!aguja) return 0;
  let n = 0; for (let i = texto.indexOf(aguja); i >= 0; i = texto.indexOf(aguja, i + aguja.length)) n++;
  return n;
};
const mapaBloques = (partes: ParteDocx[]) => {
  const m = new Map<string, BloqueDocx>();
  let tablas = 0;
  const resumen: ReturnType<typeof inventariarParte>['tablas'] = [];
  for (const p of partes) { const inv = inventariarParte(p); inv.bloques.forEach((b) => m.set(b.id, b)); resumen.push(...inv.tablas); tablas += inv.tablas.length; }
  return { m, tablas, resumen };
};

export async function auditarDocxAdaptado(e: EntradaAuditoria): Promise<ResultadoAuditoria> {
  const errores: string[] = [];
  const advertencias: string[] = [];
  const revisadosSinCambio = new Set(e.idsRevisadosSinCambio || []);
  let ori: Awaited<ReturnType<typeof abrirPartesDocx>>;
  let res: Awaited<ReturnType<typeof abrirPartesDocx>>;
  try { ori = await abrirPartesDocx(e.original); } catch (x) { return fallo(`No se pudo abrir el original: ${(x as Error).message}`); }
  try { res = await abrirPartesDocx(e.resultado); } catch (x) { return fallo(`El Word resultante no se puede reabrir: ${(x as Error).message}`); }

  // 1. Partes del ZIP: mismas entradas; lo no editable, idéntico byte a byte.
  const nombresO = Object.keys(ori.zip.files).filter((n) => !ori.zip.files[n].dir).sort();
  const nombresR = Object.keys(res.zip.files).filter((n) => !res.zip.files[n].dir).sort();
  if (nombresO.join('|') !== nombresR.join('|')) errores.push('El conjunto de archivos internos del Word cambió (se perdió o agregó alguna parte).');
  let identicas = 0; let media = 0;
  for (const n of nombresO) {
    if (!res.zip.file(n)) continue;
    if (RE_PARTE_EDITABLE.test(n)) continue;
    const a = await ori.zip.file(n)!.async('uint8array');
    const b = await res.zip.file(n)!.async('uint8array');
    if (idemBytes(a, b)) { identicas++; if (/^word\/media\//.test(n)) media++; }
    else errores.push(`El archivo interno ${n} fue modificado (debía conservarse idéntico).`);
  }
  // Metadatos con datos del docente anterior: se informa, no se altera sin pedirlo.
  const core = res.zip.file('docProps/core.xml');
  if (core) {
    const xmlCore = normaliza(await core.async('string'));
    for (const d of e.docentesAnteriores) if (d && xmlCore.includes(normaliza(d))) {
      advertencias.push(`Las propiedades del archivo (autor/metadatos) todavía contienen el nombre «${d}»; no se modificaron por no formar parte del contenido.`);
    }
  }

  // 2. Esqueleto estructural de cada parte editable.
  let dibujos = 0;
  for (const po of ori.partes) {
    const pr = res.partes.find((x) => x.ruta === po.ruta);
    if (!pr) { errores.push(`Falta la parte ${po.ruta} en el resultado.`); continue; }
    errores.push(...compararEsqueletos(po.ruta, esqueletoParte(po.doc), esqueletoParte(pr.doc)));
    const dO = descendientesW(po.doc, 'drawing').length + descendientesW(po.doc, 'pict').length;
    const dR = descendientesW(pr.doc, 'drawing').length + descendientesW(pr.doc, 'pict').length;
    if (dO !== dR) errores.push(`Cambió la cantidad de imágenes/dibujos en ${po.ruta} (${dO} → ${dR}).`);
    dibujos += dR;
  }

  const O = mapaBloques(ori.partes);
  const R = mapaBloques(res.partes);
  if (O.tablas !== R.tablas) errores.push(`Cambió el número de tablas (${O.tablas} → ${R.tablas}).`);

  // 3. Etiquetas protegidas (solo puede cambiar una mención de grado).
  let etiquetas = 0;
  for (const [id, b] of O.m) {
    if (b.rol !== 'etiqueta') continue;
    etiquetas++;
    const esperado = reemplazarGradoEnTexto(b.texto, e.gradoDestino, { origen: e.gradoOrigen }).texto;
    const r = R.m.get(id);
    if (!r || r.texto !== esperado) errores.push(`Se alteró una etiqueta fija del formato: «${b.texto.slice(0, 60)}».`);
  }

  // 4. Grado anterior residual y grado destino presente.
  const mencionesOrigen = (t: string, contexto: boolean) => detectarMencionesGrado(t, { contextoGrado: contexto }).filter((m) => m.grado === e.gradoOrigen);
  let residuos = 0;
  for (const p of res.partes) {
    textoDeParrafos(p.doc).forEach((t, i) => {
      if (mencionesOrigen(t, false).length || new RegExp(`\\b${etiquetaGrado(e.gradoOrigen)}\\b`, 'iu').test(t)) {
        if (residuos++ < 5) errores.push(`Permanece una mención de ${etiquetaGrado(e.gradoOrigen)} en ${p.ruta} (párrafo ${i}): «${t.slice(0, 70)}».`);
      }
    });
  }
  for (const [id, b] of R.m) {
    if (b.rol !== 'etiqueta' && (b.campo === 'grado' || /grado/.test(normaliza(b.etiqueta))) && mencionesOrigen(b.texto, true).length) {
      errores.push(`El campo de grado sigue indicando ${etiquetaGrado(e.gradoOrigen)} (${id}).`);
    }
  }
  for (const [id, b] of O.m) {
    if (b.campo === 'grado' && mencionesOrigen(b.texto, true).length) {
      const r = R.m.get(id);
      if (!r || !detectarMencionesGrado(r.texto, { contextoGrado: true }).some((m) => m.grado === e.gradoDestino)) {
        errores.push(`El grado destino (${etiquetaGrado(e.gradoDestino)}) no aparece donde estaba el grado original (${id}).`);
      }
    }
  }

  // 5. Docente anterior fuera / docente nuevo dentro.
  const corpusO = ori.partes.flatMap((p) => textoDeParrafos(p.doc)).map(normaliza).join('\n');
  const corpusR = res.partes.flatMap((p) => textoDeParrafos(p.doc)).map(normaliza).join('\n');
  let apariciones = 0;
  for (const d of e.docentesAnteriores.map(normaliza).filter(Boolean)) {
    apariciones += contarOcurrencias(corpusO, d);
    if (corpusR.includes(d) && (!e.docenteNuevo || normaliza(e.docenteNuevo) !== d)) errores.push(`El nombre del docente anterior («${d}») sigue en el documento.`);
  }
  if (e.docenteNuevo && apariciones > 0 && contarOcurrencias(corpusR, normaliza(e.docenteNuevo)) < apariciones) {
    errores.push('El nombre del docente nuevo no aparece en todos los lugares donde estaba el anterior.');
  }

  // 6. Cobertura: cada bloque pedagógico fue revisado y modificado (o justificado).
  let modificados = 0; let revisados = 0;
  const porTabla = new Map<string, CoberturaTablaAdaptacion>();
  for (const t of O.resumen) porTabla.set(`${t.parte}#${t.indice}`, { parte: t.parte, tabla: t.indice, seccion: t.seccion, bloquesEditables: 0, revisados: 0, modificados: 0, protegidos: 0 });
  for (const [id, b] of O.m) {
    const cob = b.tabla !== undefined ? porTabla.get(`${b.parte}#${b.tabla}`) : undefined;
    if (b.rol === 'etiqueta' || b.rol === 'fecha' || b.rol === 'institucional') { if (cob) cob.protegidos++; continue; }
    if (cob) cob.bloquesEditables++;
    const r = R.m.get(id);
    if (!r) { errores.push(`El bloque ${id} desapareció del resultado.`); continue; }
    const esperadoSoloGrado = reemplazarGradoEnTexto(b.texto, e.gradoDestino, { origen: e.gradoOrigen, contextoGrado: b.campo === 'grado' }).texto;
    const cambio = r.texto !== esperadoSoloGrado;
    if (b.rol === 'propuesta' || b.rol === 'hecho_grupo') {
      if (!b.texto.trim()) continue;
      revisados++;
      if (cob) cob.revisados++;
      if (!r.texto.trim()) { errores.push(`El bloque pedagógico ${id} quedó vacío.`); continue; }
      if (cambio) { modificados++; if (cob) cob.modificados++; }
      else if (!revisadosSinCambio.has(id)) errores.push(`El bloque pedagógico ${id} («${b.etiqueta || b.seccion}») conserva el texto anterior sin haberse revisado.`);
    } else if (cambio) { modificados++; if (cob) cob.modificados++; }
    if (b.rol === 'hecho_grupo' && !e.hechosAportados) {
      const n = normaliza(b.texto);
      if (!normaliza(r.texto).includes(normaliza(MARCADOR_PENDIENTE))) errores.push(`El hecho del grupo anterior (${id}) no fue reemplazado por un marcador de pendiente.`);
      if (n.length >= 20 && normaliza(r.texto).includes(n)) errores.push(`El texto observado del grupo anterior se trasladó tal cual al grupo nuevo (${id}).`);
    }
    if (r.texto.length > b.texto.length * 3 + 300) advertencias.push(`El bloque ${id} creció mucho; revise que no desborde el diseño.`);
  }

  // 7. Fechas, semanas y duración no cambian ni se inventan.
  const tt = (c: string) => tokensTemporales(c).sort().join('|');
  if (tt(corpusO) !== tt(corpusR)) errores.push('Las fechas o números de semana del documento cambiaron; no se pidió modificarlos.');
  const durO = (corpusO.match(/\b\d{1,2}\s*semanas?\b/g) || []).sort().join('|');
  const durR = (corpusR.match(/\b\d{1,2}\s*semanas?\b/g) || []).sort().join('|');
  if (durO !== durR) errores.push('La duración (número de semanas) cambió respecto del original.');
  const secuencia = (c: string) => (c.match(/semana\s*(\d+)/g) || []).map((s) => s.replace(/\D/g, '')).join(',');
  if (secuencia(corpusO) !== secuencia(corpusR)) errores.push('La secuencia de semanas no es coherente con el original.');

  // 8. Caracteres corruptos nuevos.
  const corrupto = /#\d{3,5};|&#?\w+;|\uFFFD|\bundefined\b|\[object|\bNaN\b|<\/?w:|\{\{|\}\}/g;
  const cO = (corpusO.match(corrupto) || []).length;
  const cR = (corpusR.match(corrupto) || []).length;
  if (cR > cO) errores.push('El resultado contiene caracteres corruptos o marcas de programación que el original no tenía.');

  return {
    aprobado: errores.length === 0, errores, advertencias,
    metricas: { partesEditables: ori.partes.length, partesIdenticas: identicas, mediaIdentica: media, dibujos, tablas: R.tablas,
      bloquesRevisados: revisados, bloquesModificados: modificados, etiquetasProtegidas: etiquetas },
    cobertura: [...porTabla.values()],
  };

  function fallo(msg: string): ResultadoAuditoria {
    return { aprobado: false, errores: [msg], advertencias: [], cobertura: [],
      metricas: { partesEditables: 0, partesIdenticas: 0, mediaIdentica: 0, dibujos: 0, tablas: 0, bloquesRevisados: 0, bloquesModificados: 0, etiquetasProtegidas: 0 } };
  }
}

