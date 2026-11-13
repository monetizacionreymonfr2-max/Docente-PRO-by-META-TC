/**
 * Inventario SIN MODIFICAR de un DOCX de estructura desconocida.
 *
 * Recorre cuerpo, encabezados, pies y notas; separa etiquetas fijas de contenidos
 * editables y asigna a cada bloque un ROL que decide cómo se adapta:
 *   etiqueta      → nunca se toca (títulos y rótulos del formato institucional)
 *   identidad     → docente, grado, sección…: se actualiza de forma determinista
 *   hecho_grupo   → diagnóstico, necesidades, matrícula…: son HECHOS del grupo; jamás
 *                   se inventan ni se trasladan de otro grado
 *   propuesta     → finalidad, contenidos, actividades, indicadores…: se rehacen
 *   fecha         → cronograma, semanas, lapsos: no se modifican
 *   institucional → PEIC, misión, visión: no se modifican
 *   neutral       → se conserva; solo se cambia una mención explícita del grado
 */
import {
  W_NS, atributoW, descendientesW, esW, hijosW, lineasCelda,
  parrafoTodoNegrita, parrafosDirectos, textoCelda, textoParrafo, textoParrafoEditable,
} from './escrituraOoxml';
import { detectarMencionesGrado, sinAcentos } from './gradoEscolar';

export type RolBloque = 'etiqueta' | 'identidad' | 'hecho_grupo' | 'propuesta' | 'fecha' | 'institucional' | 'neutral';
export type CampoIdentidad = 'docente' | 'grado' | 'institucion' | 'otro';

export interface ParteDocx {
  ruta: string;
  xml: string;
  doc: Document;
  /** true para encabezados, pies y notas: solo identidad, nunca contenido pedagógico. */
  auxiliar: boolean;
}

export interface BloqueDocx {
  id: string;
  parte: string;
  tipo: 'celda' | 'parrafo';
  tabla?: number;
  fila?: number;
  celda?: number;
  etiqueta: string;
  columna: string;
  seccion: string;
  texto: string;
  lineas: string[];
  rol: RolBloque;
  campo?: CampoIdentidad;
  /** Para «Etiqueta: valor» en un párrafo: posición donde empieza el valor. */
  inicioValor: number;
  esTitulo: boolean;
  elemento: Element;
}

export interface ResumenTabla {
  parte: string;
  indice: number;
  filas: number;
  celdas: number;
  seccion: string;
  bloquesEditables: number;
}
export interface InventarioDocx { bloques: BloqueDocx[]; tablas: ResumenTabla[] }

const norm = (s: string) => sinAcentos(s).replace(/\s+/g, ' ').trim();

const VOCAB_IDENTIDAD = /^(?:docente|maestr[oa]|profesor[a]?|facilitador[a]?|instituci[oa]n|plantel|escuela|unidad educativa|u\.? ?e\.?(?=\s*:|\s*$)|ano escolar|seccion|grado|nivel|turno|municipio|estado|parroquia|codigo|dea|director[a]?|coordinador[a]?|nombre y apellido|nombre del docente|apellidos y nombres)\b/;
const VOCAB_HECHO = /^(?:diagnostic|necesidad|potencialidad|fortaleza|debilidad|situacion|contexto|caracterizacion|observacion|matricula|problematica|cantidad de estudiantes)/;
const VOCAB_INSTITUCIONAL = /^(?:peic|plan escolar|proyecto educativo integral|proyecto educativo institucional|mision|vision|pei\b)/;
const VOCAB_PROPUESTA = /^(?:finalidad|proposito|objetivo|area|componente|contenido|aprendizaje|estrategia|actividad|recurso|indicador|evaluacion|instrumento|tecnica|competencia|tejido|referente|producto|pregunta|cierre|inicio|desarrollo|metodolog|criterio|logro|meta|tema generador|eje|tematic|secuencia|momento|planificacion|adaptacion|orientacion|material|rubrica|escala|plan de clase)/;
const VOCAB_FECHA = /^(?:fecha|semana|lapso|periodo|duracion|cronograma|desde|hasta|dia|horario|mes)\b/;
const VOCAB_AREA_CORTA = /^(?:area|areas|componente|asignatura|responsable)/;
const VOCAB_NEUTRAL_TITULO = /^(?:titulo|nombre del proyecto|nombre del pa|proyecto|tema|eslogan|lema)/;
const VOCAB_ETIQUETA = new RegExp(
  [VOCAB_IDENTIDAD, VOCAB_HECHO, VOCAB_INSTITUCIONAL, VOCAB_PROPUESTA, VOCAB_FECHA, VOCAB_NEUTRAL_TITULO].map((r) => r.source).join('|'));

const RE_SOLO_FECHA_O_SEMANA = /^(?:semana\s*\d+|\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}|del\s+\d.*\s+al\s+\d.*|[\d\s\-/.,y]+|lunes|martes|miercoles|jueves|viernes)$/;

function celdaSombreada(tc: Element): boolean {
  const tcPr = hijosW(tc, 'tcPr')[0];
  const shd = tcPr ? hijosW(tcPr, 'shd')[0] : undefined;
  if (!shd) return false;
  const fill = (atributoW(shd, 'fill') || '').toLowerCase();
  return !!fill && fill !== 'auto' && fill !== 'ffffff';
}
function celdaTodaNegrita(tc: Element): boolean {
  const con = parrafosDirectos(tc).filter((p) => textoParrafo(p).trim());
  return con.length > 0 && con.every(parrafoTodoNegrita);
}
function spanDe(tc: Element): number {
  const tcPr = hijosW(tc, 'tcPr')[0];
  const gs = tcPr ? hijosW(tcPr, 'gridSpan')[0] : undefined;
  const n = gs ? Number(atributoW(gs, 'val')) : 1;
  return Number.isFinite(n) && n > 0 ? n : 1;
}
function esFilaEncabezado(tr: Element): boolean {
  const trPr = hijosW(tr, 'trPr')[0];
  return !!trPr && hijosW(trPr, 'tblHeader').length > 0;
}

function esTextoDeEtiqueta(texto: string, ctx: { negrita: boolean; sombreada: boolean; cabecera: boolean; primeraCelda: boolean }): boolean {
  const t = texto.trim();
  if (!t) return false;
  // «Docente: Ana Pérez» es rótulo + valor, no una etiqueta pura: su valor es editable.
  if (/:\s*\S/.test(t)) return false;
  const n = norm(t);
  const palabras = n.split(' ').length;
  const corto = n.length <= 70 && palabras <= 9 && !/[.;]\s*\p{L}/u.test(t);
  if (!corto) return false;
  const vocab = VOCAB_ETIQUETA.test(n);
  // Una palabra de vocabulario sola solo es etiqueta en la primera columna (rótulo de fila);
  // en otras columnas suele ser contenido («Registro descriptivo», «Estrategias de lectura»).
  return t.endsWith(':') || ctx.negrita || ctx.cabecera || (ctx.sombreada && vocab) || (ctx.primeraCelda && vocab && palabras <= 4);
}

function esParrafoTitulo(p: Element, texto: string): boolean {
  const t = texto.trim();
  if (!t || t.length > 110) return false;
  const estilo = hijosW(hijosW(p, 'pPr')[0], 'pStyle')[0];
  const nombreEstilo = estilo ? (atributoW(estilo, 'val') || '') : '';
  if (/head|titulo|title|encabez/i.test(nombreEstilo)) return true;
  const letras = t.replace(/[^\p{L}]/gu, '');
  const mayus = letras.length >= 4 && letras === letras.toUpperCase();
  return parrafoTodoNegrita(p) || mayus;
}

function rolPorEtiqueta(etiqueta: string): { rol: RolBloque; campo?: CampoIdentidad } | null {
  const n = norm(etiqueta).replace(/:$/, '');
  if (!n) return null;
  if (VOCAB_INSTITUCIONAL.test(n)) return { rol: 'institucional' };
  if (/^(?:docente|maestr[oa]|profesor|facilitador|nombre del docente|apellidos y nombres|nombre y apellido)/.test(n)) return { rol: 'identidad', campo: 'docente' };
  if (/^(?:grado|nivel|grado y seccion|grado\/seccion|grado y\/o seccion)/.test(n)) return { rol: 'identidad', campo: 'grado' };
  if (/^(?:instituci|plantel|escuela|unidad educativa|u\.? ?e)/.test(n)) return { rol: 'identidad', campo: 'institucion' };
  if (VOCAB_IDENTIDAD.test(n)) return { rol: 'identidad', campo: 'otro' };
  if (/^(?:tecnicas? e instrumentos? del diagnostico|instrumentos? del diagnostico|tecnicas? del diagnostico)/.test(n)) return { rol: 'hecho_grupo' };
  if (VOCAB_HECHO.test(n)) return { rol: 'hecho_grupo' };
  if (VOCAB_FECHA.test(n)) return { rol: 'fecha' };
  if (VOCAB_NEUTRAL_TITULO.test(n)) return { rol: 'neutral' };
  if (VOCAB_PROPUESTA.test(n)) return { rol: 'propuesta' };
  return null;
}

function seccionPrevia(tablaEl: Element): string {
  let top: Element | null = tablaEl;
  while (top && top.parentNode && !esW(top.parentNode, 'body') && !esW(top.parentNode, 'hdr') && !esW(top.parentNode, 'ftr')) top = top.parentNode as Element;
  let n: Node | null = top?.previousSibling ?? null;
  let pasos = 0;
  while (n && pasos < 4) {
    if (esW(n, 'p')) {
      const t = textoParrafo(n as Element).trim();
      if (t && esParrafoTitulo(n as Element, t)) return t;
    }
    n = n.previousSibling; pasos++;
  }
  return '';
}

export function inventariarParte(parte: ParteDocx, sinTablaPrefijo = ''): InventarioDocx {
  const { doc, ruta, auxiliar } = parte;
  const bloques: BloqueDocx[] = [];
  const tablas: ResumenTabla[] = [];
  const todasTablas = descendientesW(doc, 'tbl');

  todasTablas.forEach((tbl, ti) => {
    const filas = hijosW(tbl, 'tr');
    const seccion = seccionPrevia(tbl);
    const info = filas.map((tr) => {
      const celdas = hijosW(tr, 'tc');
      let col = 0;
      return celdas.map((tc) => { const c = { tc, col, span: spanDe(tc) }; col += c.span; return c; });
    });
    const totalCols = Math.max(0, ...info.map((f) => f.reduce((a, c) => a + c.span, 0)));
    // Filas de encabezado: marcadas (tblHeader) o primera fila con TODAS sus celdas en negrita/sombreadas,
    // o con ≥3 celdas que son rótulos conocidos. Una tabla de pares «rótulo | valor» no tiene cabecera.
    const esCab: boolean[] = filas.map((tr) => esFilaEncabezado(tr));
    if (!esCab.some(Boolean) && filas.length > 1 && info[0].length >= 2) {
      const noVacias = info[0].filter((c) => textoCelda(c.tc).trim());
      const textos = noVacias.map((c) => textoCelda(c.tc).trim());
      const estilo = noVacias.length >= 2 && noVacias.every((c) => celdaTodaNegrita(c.tc) || celdaSombreada(c.tc));
      const vocabulario = noVacias.length >= 3 && textos.every((t) => VOCAB_ETIQUETA.test(norm(t)));
      if (textos.every((t) => t.length <= 60) && (estilo || vocabulario)) esCab[0] = true;
    }
    const cabeceras: Record<number, string> = {};
    filas.forEach((tr, fi) => {
      if (!esCab[fi]) return;
      for (const c of info[fi]) {
        const t = textoCelda(c.tc).trim();
        if (t) for (let k = 0; k < c.span; k++) cabeceras[c.col + k] = t;
      }
    });

    let editables = 0;
    filas.forEach((tr, fi) => {
      const fila = info[fi];
      const unicaCeldaAncha = fila.length === 1 && totalCols > 1 && fila[0].span >= totalCols;
      let etiquetaFila = '';
      fila.forEach((c, ci) => {
        const texto = textoCelda(c.tc);
        const limpio = texto.trim();
        const negrita = celdaTodaNegrita(c.tc);
        const esEtq = esCab[fi] || esTextoDeEtiqueta(limpio, { negrita, sombreada: celdaSombreada(c.tc), cabecera: false, primeraCelda: ci === 0 });
        const base = { id: `${ruta}#t${ti}.r${fi}.c${ci}`, parte: ruta, tipo: 'celda' as const, tabla: ti, fila: fi, celda: ci,
          seccion, texto: limpio, lineas: lineasCelda(c.tc), inicioValor: 0, esTitulo: false, elemento: c.tc };
        if (esEtq) {
          if (!esCab[fi] && limpio) etiquetaFila = limpio;
          bloques.push({ ...base, etiqueta: limpio, columna: '', rol: 'etiqueta' });
          return;
        }
        const columna = cabeceras[c.col] || '';
        const etiqueta = columna || etiquetaFila;
        let rol: RolBloque = 'neutral';
        let campo: CampoIdentidad | undefined;
        if (unicaCeldaAncha) {
          // Fila-título que abarca toda la tabla («Semanas 1 a 3 — Eje…»): no hereda la cabecera de columna.
          rol = /^semanas?\b/.test(norm(limpio)) ? 'fecha' : 'neutral';
        } else {
          // Con cabecera de columna, la columna define el rol; sin ella, el rótulo de la fila.
          const porEtiqueta = (columna ? rolPorEtiqueta(columna) : null) || rolPorEtiqueta(etiquetaFila);
          if (porEtiqueta) { rol = porEtiqueta.rol; campo = porEtiqueta.campo; }
          else { const porSeccion = rolPorEtiqueta(seccion); if (porSeccion && porSeccion.rol !== 'identidad') rol = porSeccion.rol; }
        }
        // Contenido que es solo fecha o número de semana.
        if (limpio && RE_SOLO_FECHA_O_SEMANA.test(norm(limpio))) rol = 'fecha';
        // Nombres de áreas/componentes/responsables: se conservan.
        if (rol === 'propuesta' && VOCAB_AREA_CORTA.test(norm(etiqueta)) && limpio.length <= 40 && limpio.split(/\s+/).length <= 5) rol = 'neutral';
        // Celdas de firma («Docente: X», «Director(a): ___»): rótulo + valor, nunca contenido pedagógico.
        if (/^(?:docente|maestr[oa]|profesor[a]?)\s*:/.test(norm(limpio))) { rol = 'identidad'; campo = 'docente'; }
        else if (/^(?:director|directora|coordinador|coordinadora|firma|sello|representante|supervisor)\b[^:]{0,15}:/.test(norm(limpio))) { rol = 'neutral'; campo = undefined; }
        editables++;
        bloques.push({ ...base, etiqueta, columna, rol, campo });
      });
    });
    tablas.push({ parte: ruta, indice: ti, filas: filas.length, celdas: info.reduce((a, f) => a + f.length, 0), seccion, bloquesEditables: editables });
  });

  // Párrafos fuera de tablas.
  const todos = descendientesW(doc, 'p');
  let seccionActual = '';
  let pi = -1; // índice solo entre párrafos fuera de celdas: estable aunque una celda cambie de nº de párrafos
  todos.forEach((p) => {
    // ¿dentro de una celda de tabla?
    for (let x: Node | null = p.parentNode; x; x = x.parentNode) if (esW(x, 'tc')) return;
    pi++;
    const completo = textoParrafo(p);
    const editable = textoParrafoEditable(p);
    const t = editable.trim();
    if (!t) return;
    const esTitulo = esParrafoTitulo(p, t);
    const base = { id: `${ruta}#p${pi}`, parte: ruta, tipo: 'parrafo' as const, seccion: seccionActual, texto: t,
      lineas: [t], columna: '', elemento: p };
    if (auxiliar) {
      bloques.push({ ...base, etiqueta: '', rol: 'identidad', campo: 'otro', inicioValor: 0, esTitulo: false });
      return;
    }
    // «Etiqueta: valor» en un mismo párrafo (solo si no hay campos de Word que desalineen posiciones).
    const inline = /^(\s*)([^:]{2,60}?):(\s*)(\S[\s\S]*)$/.exec(editable);
    if (inline && completo === editable) {
      const mapeado = rolPorEtiqueta(inline[2]);
      if (mapeado) {
        const inicioValor = inline[1].length + inline[2].length + 1 + inline[3].length;
        bloques.push({ ...base, etiqueta: inline[2], rol: mapeado.rol, campo: mapeado.campo, inicioValor, esTitulo: false,
          texto: inline[4].trim(), lineas: [inline[4].trim()] });
        return;
      }
    }
    if (esTitulo) {
      seccionActual = t;
      bloques.push({ ...base, etiqueta: '', rol: 'neutral', inicioValor: 0, esTitulo: true });
      return;
    }
    // Párrafo corriente: rol por la sección en que está.
    let rol: RolBloque = 'neutral';
    const porSeccion = rolPorEtiqueta(seccionActual);
    const tieneGrado = detectarMencionesGrado(t).length > 0;
    if (t.length > 100 || /[.;]\s/.test(t)) {
      if (porSeccion && porSeccion.rol !== 'identidad' && porSeccion.rol !== 'fecha') rol = porSeccion.rol;
      else if (tieneGrado) rol = 'propuesta';
    } else if (tieneGrado) rol = 'identidad';
    bloques.push({ ...base, etiqueta: '', rol, campo: rol === 'identidad' ? 'grado' : undefined, inicioValor: 0, esTitulo: false });
  });
  return { bloques, tablas };
}

export function inventariarPartes(partes: ParteDocx[]): InventarioDocx {
  const bloques: BloqueDocx[] = [];
  const tablas: ResumenTabla[] = [];
  for (const parte of partes) {
    const inv = inventariarParte(parte);
    bloques.push(...inv.bloques);
    tablas.push(...inv.tablas);
  }
  return { bloques, tablas };
}

export { W_NS };
