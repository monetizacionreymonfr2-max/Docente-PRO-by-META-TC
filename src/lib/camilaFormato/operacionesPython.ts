import type { OperacionDocx } from './camilaFormatoEngine';
import type { DocxMapa, PlantillaDocx } from '../docxClone/types';

export type OperacionPython =
  | { tipo: 'set_parrafo'; id: string; esperado: string; texto: string }
  | { tipo: 'set_celda'; id: string; esperado: string; lineas: [string] };

const textoValido = (s: unknown): s is string =>
  typeof s === 'string' && s.length <= 5000 && !/[\u0000-\u001f\u007f]/.test(s);

/**
 * Puente declarativo: convierte las operaciones del motor pedagógico en acciones
 * permitidas para el worker Python. Devuelve null en vez de intentar una edición
 * parcial cuando la plantilla tiene estructuras no compatibles.
 *
 * Solo se usa bajo activación temporal y explícita de documentos ficticios.
 */
export function prepararOperacionesPython(
  operaciones: OperacionDocx[],
  mapa: DocxMapa,
  plantilla: PlantillaDocx | null,
): OperacionPython[] | null {
  if (!Array.isArray(operaciones) || operaciones.length < 1 || operaciones.length > 20) return null;
  const resultado: OperacionPython[] = [];
  const usados = new Set<string>();

  for (const op of operaciones) {
    if (op.tipo === 'set_parrafo' && typeof op.id === 'string' && /^p(0|[1-9]\d{0,4})$/.test(op.id)) {
      const target = mapa.parrafos.find(p => p.id === op.id);
      if (!target || !textoValido(target.rawText) || !textoValido(op.texto) || usados.has(op.id)) return null;
      usados.add(op.id);
      resultado.push({ tipo: 'set_parrafo', id: op.id, esperado: target.rawText, texto: op.texto });
      continue;
    }
    if (op.tipo === 'set_celda' && typeof op.id === 'string' &&
        /^t(0|[1-9]\d{0,4})\.r(0|[1-9]\d{0,4})\.c(0|[1-9]\d{0,4})$/.test(op.id)) {
      const fila = mapa.tablas.flatMap(tabla => tabla.filas).find(f => f.celdas.some(c => c.id === op.id));
      const celda = fila?.celdas.find(c => c.id === op.id);
      const esEtiqueta = plantilla?.tablas.some(tabla => tabla.celdasEtiquetaIds.includes(op.id)) ?? false;
      const parrafosDirectos = celda?.domNode
        ? Array.from(celda.domNode.childNodes).filter(n => n.nodeType === 1 &&
          (n.localName || n.nodeName.split(':').pop()) === 'p')
        : [];
      if (!celda || !Array.isArray(op.lineas) || op.lineas.length !== 1 ||
          !textoValido(op.lineas[0]) || !textoValido(celda.rawText) ||
          parrafosDirectos.length !== 1 || fila?.isHeader || esEtiqueta || usados.has(op.id)) return null;
      usados.add(op.id);
      resultado.push({ tipo: 'set_celda', id: op.id, esperado: celda.rawText, lineas: [op.lineas[0]] });
      continue;
    }
    // Rehacer filas/semana completa, clonación de fichas y cabeceras requieren otro worker.
    return null;
  }
  return resultado;
}
