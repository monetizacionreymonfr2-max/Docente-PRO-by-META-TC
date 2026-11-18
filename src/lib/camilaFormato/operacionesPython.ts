import type { OperacionDocx } from './camilaFormatoEngine';
import type { DocxMapa, PlantillaDocx, DocxFilaNode } from '../docxClone/types';

export type OperacionPython =
  | { tipo: 'set_parrafo'; id: string; esperado: string; texto: string }
  | { tipo: 'set_celda'; id: string; esperado: string; lineas: [string] }
  | { tipo: 'agregar_filas'; tablaId: string; despuesDeFilaId: string; esperadoModelo: string[]; filas: string[][] }
  | { tipo: 'reemplazar_filas'; tablaId: string; filaInicioId: string; esperadas: string[][]; filas: string[][] }
  | { tipo: 'set_seccion'; tituloId: string; tituloEsperado: string; parrafos: Array<{ id: string; esperado: string; texto: string }> };

const idP = /^p(0|[1-9]\d{0,4})$/;
const idC = /^t(0|[1-9]\d{0,4})\.r(0|[1-9]\d{0,4})\.c(0|[1-9]\d{0,4})$/;
const idT = /^t(0|[1-9]\d{0,4})$/;
const textOk = (value: unknown, max = 5000): value is string =>
  typeof value === 'string' && value.length <= max && !/[\u0000-\u001f\u007f]/.test(value);
const tablaEditable = new Set(['cronograma', 'planificacion_diaria', 'plan_evaluacion', 'construccion_estrategias']);

function filasValidas(rows: unknown): rows is string[][] {
  if (!Array.isArray(rows) || rows.length < 1 || rows.length > 24) return false;
  const width = Array.isArray(rows[0]) ? rows[0].length : 0;
  if (width < 1 || width > 12) return false;
  let total = 0;
  for (const row of rows) {
    if (!Array.isArray(row) || row.length !== width) return false;
    for (const cell of row) {
      if (!textOk(cell, 1000)) return false;
      total += cell.length;
    }
  }
  return total <= 40000;
}

const prohibidos = [
  'tbl', 'gridSpan', 'vMerge', 'hMerge', 'tblHeader', 'drawing',
  'object', 'fldChar', 'instrText', 'hyperlink', 'sdt',
  'ins', 'del', 'bookmarkStart', 'bookmarkEnd', 'pict', 'proofErr',
  'commentRangeStart', 'commentRangeEnd', 'footnoteReference',
  'endnoteReference', 'br', 'tab',
];

function esFilaSimple(fila: DocxFilaNode): boolean {
  if (fila.isHeader || fila.celdas.length < 1 || fila.celdas.length > 12 ||
      !fila.domNode || fila.celdas.some(c => c.gridSpan !== 1 || Boolean(c.vMerge) || !textOk(c.rawText, 1000))) return false;
  for (const t of prohibidos) {
    const encontrados = fila.domNode.getElementsByTagNameNS(
      'http://schemas.openxmlformats.org/wordprocessingml/2006/main', t);
    if (encontrados.length > 0) return false;
  }
  return fila.celdas.every(c => {
    if (!c.domNode) return false;
    const parrafos = Array.from(c.domNode.childNodes).filter(n => n.nodeType === 1 &&
      ((n as Element).localName || n.nodeName.split(':').pop()) === 'p');
    return parrafos.length === 1;
  });
}

function filasEstructuralesValidas(
  tablaId: string, mapa: DocxMapa, plantilla: PlantillaDocx | null,
): { filas: DocxFilaNode[]; protegidas: Set<string> } | null {
  if (!idT.test(tablaId)) return null;
  const tabla = mapa.tablas.find(item => item.id === tablaId);
  const info = plantilla?.tablas.find(item => item.id === tablaId);
  if (!tabla || !info || !tablaEditable.has(info.tipo) || tabla.filas.length < 2) return null;
  const protegidas = new Set(info.filasEncabezadoIds);
  return { filas: tabla.filas, protegidas };
}

/**
 * Traduce propuestas de IA a un subconjunto auditable del worker.
 * Falla cerrado si una sola operación resulta incompatible.
 */
export function prepararOperacionesPython(
  operaciones: OperacionDocx[],
  mapa: DocxMapa,
  plantilla: PlantillaDocx | null,
): OperacionPython[] | null {
  if (!Array.isArray(operaciones) || operaciones.length < 1 || operaciones.length > 20) return null;
  const result: OperacionPython[] = [];
  const used = new Set<string>();
  const structuralTables = new Set<string>();

  for (const op of operaciones) {
    if (op.tipo === 'set_parrafo' && typeof op.id === 'string' && idP.test(op.id)) {
      const node = mapa.parrafos.find(p => p.id === op.id);
      if (!node || !textOk(node.rawText) || !textOk(op.texto) || used.has(op.id)) return null;
      used.add(op.id);
      result.push({ tipo: 'set_parrafo', id: op.id, esperado: node.rawText, texto: op.texto });
      continue;
    }

    if (op.tipo === 'set_celda' && typeof op.id === 'string' && idC.test(op.id)) {
      const row = mapa.tablas.flatMap(t => t.filas).find(r => r.celdas.some(c => c.id === op.id));
      const cell = row?.celdas.find(c => c.id === op.id);
      const fixed = plantilla?.tablas.some(t => t.celdasEtiquetaIds.includes(op.id)) ?? false;
      const para = cell?.domNode
        ? Array.from(cell.domNode.childNodes).filter(n => n.nodeType === 1 &&
          ((n as Element).localName || n.nodeName.split(':').pop()) === 'p')
        : [];
      if (!row || !cell || fixed || row.isHeader || used.has(op.id) ||
          cell.gridSpan !== 1 || Boolean(cell.vMerge) || para.length !== 1 ||
          !Array.isArray(op.lineas) || op.lineas.length !== 1 ||
          !textOk(cell.rawText) || !textOk(op.lineas[0])) return null;
      used.add(op.id);
      result.push({ tipo: 'set_celda', id: op.id, esperado: cell.rawText, lineas: [op.lineas[0]] });
      continue;
    }

    if ((op.tipo === 'agregar_filas' || op.tipo === 'reemplazar_filas') &&
        typeof op.tablaId === 'string') {
      const contexto = filasEstructuralesValidas(op.tablaId, mapa, plantilla);
      if (!contexto || !filasValidas(op.filas) || used.has('tabla:' + op.tablaId)) return null;
      const { filas, protegidas } = contexto;
      if (op.tipo === 'agregar_filas') {
        const row = filas.find(r => r.id === op.despuesDeFilaId);
        const idx = row ? filas.indexOf(row) : -1;
        if (!row || idx < 1 || !esFilaSimple(row) || protegidas.has(row.id) ||
            row.celdas.some(c => plantilla?.tablas.some(t => t.celdasEtiquetaIds.includes(c.id))) ||
            op.filas.some(values => values.length !== row.celdas.length)) return null;
        used.add('tabla:' + op.tablaId);
        structuralTables.add(op.tablaId);
        result.push({
          tipo: 'agregar_filas', tablaId: op.tablaId, despuesDeFilaId: row.id,
          esperadoModelo: row.celdas.map(c => c.rawText), filas: op.filas,
        });
      } else {
        const first = filas.findIndex((r, idx) => idx > 0 && !r.isHeader && !protegidas.has(r.id));
        if (first < 1) return null;
        const dataRows = filas.slice(first);
        if (dataRows.length > 24 || dataRows.some(r => !esFilaSimple(r) || protegidas.has(r.id) ||
            r.celdas.some(c => plantilla?.tablas.some(t => t.celdasEtiquetaIds.includes(c.id))))) return null;
        const expected = dataRows.map(r => r.celdas.map(c => c.rawText));
        if (!filasValidas(expected) || op.filas.some(row => row.length !== expected[0].length)) return null;
        used.add('tabla:' + op.tablaId);
        structuralTables.add(op.tablaId);
        result.push({
          tipo: 'reemplazar_filas', tablaId: op.tablaId, filaInicioId: filas[first].id,
          esperadas: expected, filas: op.filas,
        });
      }
      continue;
    }

    if (op.tipo === 'set_seccion' && typeof op.tituloId === 'string' && idP.test(op.tituloId)) {
      const titulo = mapa.parrafos.find(p => p.id === op.tituloId);
      const entries = op.parrafos;
      if (!titulo || !titulo.rawText || !textOk(titulo.rawText) ||
          !Array.isArray(entries) || entries.length < 1 || entries.length > 16 ||
          used.has('seccion:' + op.tituloId)) return null;
      const index = Number(op.tituloId.slice(1));
      const fields: Array<{ id: string; esperado: string; texto: string }> = [];
      for (let i = 0; i < entries.length; i++) {
        const item = entries[i];
        const id = 'p' + (index + 1 + i);
        const original = mapa.parrafos.find(p => p.id === id);
        if (!item || item.id !== id || !original || !textOk(item.texto) ||
            !textOk(original.rawText) || used.has(id)) return null;
        used.add(id);
        fields.push({ id, esperado: original.rawText, texto: item.texto });
      }
      used.add('seccion:' + op.tituloId);
      result.push({
        tipo: 'set_seccion', tituloId: op.tituloId,
        tituloEsperado: titulo.rawText, parrafos: fields,
      });
      continue;
    }
    return null;
  }

  if (result.some(op => op.tipo === 'set_celda' && structuralTables.has(op.id.split('.')[0]))) return null;
  return result;
}
