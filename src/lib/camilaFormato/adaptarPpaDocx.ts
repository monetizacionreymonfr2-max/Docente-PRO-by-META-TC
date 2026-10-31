import {
  cargarDocx, guardarDocx, getElementChildren, getTextoCompleto,
  setTextoCelda, setTextoParrafo, clonarFila, insertarFilaDespues, eliminarFila,
} from '../docxClone/docxEditor';
import { PpaCompleto, IdentidadPpa, semanasDeCalendario, textoFecha, validarPpaCompleto } from './ppaEstructurado';

const W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
const nombre = (e: Element) => e.localName || e.nodeName.replace(/^.*:/, '');
const hijos = (e: Element, tipo: string) => getElementChildren(e).filter(c => nombre(c) === tipo);
const celdas = (tr: Element) => hijos(tr, 'tc');
const texto = (v: string) => v.trim();
function celda(fila: Element, indice: number, valor: string): void {
  const c = celdas(fila)[indice];
  if (!c) throw new Error('El formato Word no tiene las columnas esperadas.');
  setTextoCelda(c, [valor]);
}
function reemplazarParrafo(doc: Document, patron: RegExp, nuevo: string): number {
  let total = 0;
  for (const p of Array.from(doc.getElementsByTagNameNS(W, 'p'))) {
    if (patron.test(getTextoCompleto(p))) { setTextoParrafo(p, nuevo); total++; }
    patron.lastIndex = 0;
  }
  return total;
}
function datosOriginales(tablas: Element[]): { docente: string; institucion: string; grado: string; titulo: string } {
  const a = hijos(tablas[0], 'tr'), b = hijos(tablas[1], 'tr');
  return {
    docente: celdas(a[0])[3] ? getTextoCompleto(celdas(a[0])[3]).trim() : '',
    institucion: celdas(a[0])[1] ? getTextoCompleto(celdas(a[0])[1]).trim() : '',
    grado: celdas(a[1])[1] ? getTextoCompleto(celdas(a[1])[1]).trim() : '',
    titulo: celdas(b[0])[1] ? getTextoCompleto(celdas(b[0])[1]).trim() : '',
  };
}
function detectarPlantilla(doc: Document): Element[] {
  const body = doc.getElementsByTagNameNS(W, 'body')[0];
  if (!body) throw new Error('Word inválido: no existe w:body.');
  const tablas = hijos(body, 'tbl');
  // Esta adaptación determinista soporta el formato tipo PPA 7 tablas/9 columnas.
  // Para otros Word se debe elegir un adaptador comprobado o el flujo opcional de Skills,
  // nunca aplicar posiciones conjeturadas.
  if (tablas.length !== 7 ||
      [4, 4, 4, 2].some((num, i) => celdas(hijos(tablas[i], 'tr')[0]).length !== (i === 0 ? 4 : 2)) ||
      celdas(hijos(tablas[4], 'tr')[0]).length !== 9 ||
      hijos(tablas[5], 'tr').length !== 2 ||
      celdas(hijos(tablas[6], 'tr')[0]).length < 1) {
    throw new Error('Esta plantilla Word tiene una estructura distinta. Se necesita identificarla antes de completarla: no se modificó el original.');
  }
  return tablas;
}
function fechaTexto(a?: string, b?: string): string {
  return a && b ? `Del ${a} al ${b}` : 'Fechas pendientes de confirmación';
}
function limpiarPie(zippedXml: string, identidad: IdentidadPpa, plan: PpaCompleto): string {
  const doc = new DOMParser().parseFromString(zippedXml, 'application/xml');
  const paragraphs = Array.from(doc.getElementsByTagNameNS(W, 'p'));
  const p = paragraphs.find(x => /PPA|\bProf\./i.test(getTextoCompleto(x)));
  if (!p) throw new Error('El formato no tiene un pie de página de PPA identificable.');
  const todos = Array.from(p.getElementsByTagNameNS(W, 't'));
  if (!todos.length) throw new Error('No se pudo editar el pie de página.');
  // Conservar los campos de Word PAGE/NUMPAGES: se reemplaza únicamente el texto
  // anterior a la primera instrucción de campo; nunca los nodos fldChar/instrText.
  const prefijo = `PPA “${plan.titulo}” · ${identidad.gradoSeccion} · Prof. ${identidad.docente} · Página `;
  const runs = Array.from(p.getElementsByTagNameNS(W, 'r'));
  let previoAlCampo = true, escrito = false;
  for (const r of runs) {
    if (r.getElementsByTagNameNS(W, 'fldChar').length ||
        r.getElementsByTagNameNS(W, 'instrText').length) {
      previoAlCampo = false;
      continue;
    }
    if (!previoAlCampo) break;
    for (const node of Array.from(r.getElementsByTagNameNS(W, 't'))) {
      node.textContent = escrito ? '' : prefijo;
      escrito = true;
    }
  }
  if (!escrito) throw new Error('No se encontró el texto previo al contador de páginas.');
  return new XMLSerializer().serializeToString(doc);
}
function detectarResiduos(doc: Document, identidad: IdentidadPpa, plan: PpaCompleto, original: ReturnType<typeof datosOriginales>): string[] {
  const completo = doc.documentElement.textContent || '';
  const sobrantes: string[] = [];
  for (const [nombreCampo, antiguo, nuevo] of [
    ['docente', original.docente, identidad.docente],
    ['institución', original.institucion, identidad.institucion],
    ['grado', original.grado, identidad.gradoSeccion],
    ['título', original.titulo, plan.titulo],
  ]) {
    if (antiguo.length > 5 && antiguo.toLowerCase() !== nuevo.toLowerCase() &&
        completo.toLowerCase().includes(antiguo.toLowerCase())) {
      sobrantes.push(`Permaneció el dato anterior de ${nombreCampo}.`);
    }
  }
  return sobrantes;
}
/**
 * Aplicador determinista para un Word ajeno con estructura conocida.
 * No transfiere datos de la plantilla, no muta el Blob original, no ofrece
 * resultados parciales. Si la verificación falla, lanza error y descarta TODO.
 */
export async function adaptarPpaCompletoAWord(
  archivo: File | Blob | ArrayBuffer,
  plan: PpaCompleto,
  identidad: IdentidadPpa,
  areasExcluidas: string[] = []
): Promise<Blob> {
  const errores = validarPpaCompleto(plan, identidad, areasExcluidas);
  if (errores.length) throw new Error(`PPA incompleto: ${errores[0]}`);
  const { doc, zip } = await cargarDocx(archivo);
  const tablas = detectarPlantilla(doc);
  const original = datosOriginales(tablas);
  const [ident, cabecera, diag, finalidad, parrilla, cierre, firmas] = tablas;
  const a = hijos(ident, 'tr'), b = hijos(cabecera, 'tr'), c = hijos(diag, 'tr'), d = hijos(finalidad, 'tr');
  celda(a[0], 1, identidad.institucion);
  celda(a[0], 3, identidad.docente);
  celda(a[1], 1, identidad.gradoSeccion);
  celda(a[1], 3, identidad.anioEscolar || 'POR CONFIRMAR');
  celda(a[2], 1, identidad.duracion);
  celda(a[2], 3, fechaTexto(identidad.fechaInicio, identidad.fechaFin));
  for (const [i, valor] of [
    plan.titulo, plan.preguntaGeneradora, plan.productoFinal, plan.vinculacionNacional,
  ].entries()) celda(b[i], 1, valor);
  for (const [i, valor] of [
    plan.contexto, plan.necesidades, plan.potencialidades, plan.instrumentosDiagnostico,
  ].entries()) celda(c[i], 1, valor);
  celda(d[0], 1, plan.propositoGeneral);
  celda(d[1], 1, plan.propositosEspecificos);
  reemplazarParrafo(doc, /Educaci[oó]n Primaria\s*[·–-]\s*Sexto grado/i,
    `Educación Primaria · ${identidad.gradoSeccion}`);
  reemplazarParrafo(doc, /PARRILLA DE PLANIFICACI[OÓ]N/i,
    `PARRILLA DE PLANIFICACIÓN — ${plan.semanas.length} SEMANAS`);
  const filas = hijos(parrilla, 'tr');
  if (filas.length < 3) throw new Error('La parrilla carece de filas prototipo.');
  const prototipoSemana = clonarFila(filas[1]);
  const prototipoArea = clonarFila(filas[2]);
  // Guardar la fila de títulos, sustituir todas las demás: esto evita
  // los 165 contenidos heredados de sexto grado de la prueba reportada.
  filas.slice(1).forEach(eliminarFila);
  const rangos = semanasDeCalendario(identidad.fechaInicio, identidad.fechaFin);
  let ultima = filas[0];
  for (const [i, semana] of plan.semanas.entries()) {
    const sem = clonarFila(prototipoSemana);
    const rango = rangos?.[i];
    const cab = rango ? `Del ${textoFecha(rango.inicio)} al ${textoFecha(rango.fin)}` : 'Fechas por confirmar';
    celda(sem, 0, `SEMANA ${i + 1} · ${cab} — ${semana.tema}`);
    insertarFilaDespues(ultima, sem);
    ultima = sem;
    for (const fila of semana.filas) {
      const row = clonarFila(prototipoArea);
      const valores = [
        fila.area, fila.componente, fila.contenidos, fila.tejidosTematicos,
        fila.aprendizajes, fila.recursos, fila.indicadores, fila.tecnicaInstrumentos,
        rango ? `${textoFecha(rango.inicio)} al ${textoFecha(rango.fin)}` : 'Por confirmar',
      ];
      valores.forEach((v, k) => celda(row, k, v));
      insertarFilaDespues(ultima, row);
      ultima = row;
    }
  }
  // Reconstruir el cuadro de cierre sin reutilizar el evento anterior.
  const cierreFilas = hijos(cierre, 'tr');
  for (const [i, item] of celdas(cierreFilas[0]).entries()) {
    setTextoCelda(item, [`Actividad ${i + 1}`]);
  }
  for (const [i, item] of celdas(cierreFilas[1]).entries()) {
    setTextoCelda(item, [i === 0 ? plan.cierre : 'Actividad de cierre según disponibilidad de la institución']);
  }
  celda(hijos(firmas, 'tr')[0], 0, `Docente: ${identidad.docente}`);
  reemplazarParrafo(doc, /ORGANIZACI[OÓ]N DE LA SEMANA DE FERIA/i,
    'ORGANIZACIÓN DEL CIERRE DEL PROYECTO');
  reemplazarParrafo(doc, /Cierre del proyecto:/i, `Cierre del proyecto: ${plan.cierre}`);
  const residuos = detectarResiduos(doc, identidad, plan, original);
  if (residuos.length) throw new Error(residuos[0]);
  const footerPaths = Object.keys(zip.files).filter(path => /^word\/footer\d*\.xml$/.test(path));
  if (!footerPaths.length) throw new Error('No se identificó el pie de página de la plantilla.');
  for (const path of footerPaths) {
    const originalFooter = await zip.file(path)?.async('string');
    if (!originalFooter) throw new Error('No se pudo abrir el pie de página.');
    const xmlFooter = limpiarPie(originalFooter, identidad, plan);
    if (original.docente && xmlFooter.includes(original.docente) && original.docente !== identidad.docente) {
      throw new Error('El pie de página conserva el nombre de otro docente.');
    }
    zip.file(path, xmlFooter);
  }
  // Verificar que el número de semanas se mantuvo después de la edición.
  const finales = hijos(parrilla, 'tr');
  const conteo = finales.filter(r => /^SEMANA\s+\d+/i.test(getTextoCompleto(r))).length;
  if (conteo !== plan.semanas.length) throw new Error('El Word no contiene todas las semanas solicitadas.');
  const blob = await guardarDocx(zip, doc);
  // Volver a abrir el ZIP antes de presentarlo al docente.
  const verificado = await cargarDocx(blob);
  if (getTextoCompleto(verificado.doc.documentElement).includes(original.docente) &&
      original.docente !== identidad.docente) {
    throw new Error('El DOCX generado conserva información de otro docente.');
  }
  return blob;
}
