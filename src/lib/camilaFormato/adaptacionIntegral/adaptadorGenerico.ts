/**
 * Adaptación integral de un proyecto de aula en Word de estructura DESCONOCIDA.
 *
 * Flujo: inventario (sin modificar) → separación hechos/propuestas → propuestas del
 * modelo por lotes (validadas) → escritura segura en una COPIA OOXML → ZIP con todas
 * las demás partes intactas → auditoría independiente del archivo final.
 * Es todo-o-nada: si la auditoría falla se lanza AdaptacionNoSeguraError y el
 * documento original no se toca. Nunca se afirma éxito sin auditoría aprobada.
 */
import {
  aplicarEdicionesEnParrafo, descendientesW, escribirLineasCeldaSeguro, escribirTextoParrafoSeguro,
  escribirValorDesde, parrafosDirectos, textoParrafo, textoParrafoEditable, type EdicionTexto,
} from './escrituraOoxml';
import { detectarMencionesGrado, edicionesDeGrado, etiquetaGrado, sinAcentos, type NumeroGrado } from './gradoEscolar';
import { inventariarPartes, type BloqueDocx } from './inventarioDocx';
import { abrirPartesDocx, aBytes, declaracionXml, type EntradaZip } from './partesDocx';
import {
  dividirEnLotes, validarPropuestas, type BloqueParaModelo, type ProveedorPropuestas,
} from './propuestasBloques';
import { auditarDocxAdaptado, MARCADOR_PENDIENTE, type CoberturaTablaAdaptacion, type ResultadoAuditoria } from './auditoriaAdaptacion';

const MIME_DOCX = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

export class AclaracionNecesariaError extends Error {
  constructor(public readonly pregunta: string) { super(pregunta); this.name = 'AclaracionNecesariaError'; }
}
export class AdaptacionNoSeguraError extends Error {
  constructor(mensaje: string, public readonly detalles: string[] = [], public readonly codigo = 'no_segura') {
    super(mensaje); this.name = 'AdaptacionNoSeguraError';
  }
}

export interface OpcionesAdaptacion {
  gradoDestino: NumeroGrado;
  gradoOrigen?: NumeroGrado;
  docenteDestino?: string;
  /** Hechos observados del grupo NUEVO aportados por el docente en la conversación. */
  hechosGrupo?: { diagnostico?: string; matricula?: string };
  proveedor: ProveedorPropuestas;
  onProgreso?: (mensaje: string) => void;
  maxLotes?: number;
}
export interface InformeAdaptacion {
  gradoOrigen: NumeroGrado;
  gradoDestino: NumeroGrado;
  docentesAnteriores: string[];
  docenteNuevo?: string;
  bloquesRevisados: number;
  bloquesModificados: number;
  etiquetasProtegidas: number;
  lotes: number;
  cobertura: CoberturaTablaAdaptacion[];
  preservado: { imagenes: number; archivosIdenticos: number; mediaIdentica: number; tablas: number };
  datosPendientes: string[];
  advertencias: string[];
  preguntaPendiente?: string;
  auditoria: ResultadoAuditoria;
}
export interface ResultadoAdaptacion { blob: Blob; informe: InformeAdaptacion; partesEditadas: string[] }

// ---------- Nombres del docente ----------
const NOMBRE_RE = /[A-ZÁÉÍÓÚÑ][\p{L}'’-]+(?:\s+(?:(?:de\s+la|de\s+los|de\s+las|del|de|la)\s+)?[A-ZÁÉÍÓÚÑ][\p{L}'’-]+){0,4}/gu;
const TITULO_RE = /^(?:prof(?:esor|esora|a)?\.?|lcda?\.?|lic\.?|licenciad[oa]|maestr[oa]|docente|sra?\.?|dra?\.?|t\.?s\.?u\.?)\s+/i;
const CLASES: Record<string, string> = { a: '[aáàäâ]', e: '[eéèëê]', i: '[iíìïî]', o: '[oóòöô]', u: '[uúùüû]', n: '[nñ]' };

function limpiarNombre(valor: string): string {
  let t = valor.trim();
  for (let i = 0; i < 3 && TITULO_RE.test(t); i++) t = t.replace(TITULO_RE, '');
  return t.replace(/[.,;:\s]+$/, '').trim();
}
function pareceNombre(t: string): boolean {
  return t.length >= 3 && t.length <= 60 && !/[\d:]/.test(t) && t.split(/\s+/).length <= 6 && /^[A-ZÁÉÍÓÚÑ]/.test(t);
}
export function extraerNombresDocente(bloques: BloqueDocx[], textos: string[]): { nombres: string[]; conTitulo: boolean } {
  const nombres = new Set<string>();
  let conTitulo = false;
  for (const b of bloques) {
    if (b.campo !== 'docente' || !b.texto.trim()) continue;
    const v = b.texto.replace(/^(?:docente|maestr[oa]|profesor(?:a)?)\s*:\s*/i, '');
    const limpio = limpiarNombre(v);
    if (pareceNombre(limpio)) { nombres.add(limpio); if (TITULO_RE.test(v.trim()) && /^(?:lcda?\.?|lic\.?|licenciad)/i.test(v.trim())) conTitulo = true; }
  }
  const re = /(?:Prof(?:esor|esora)?\.?|Profa\.?|Docente|Maestr[oa]|Lcda?\.?|Lic\.?)\s*:?\s*/gu;
  for (const t of textos) {
    for (const m of t.matchAll(re)) {
      NOMBRE_RE.lastIndex = (m.index ?? 0) + m[0].length;
      const hit = NOMBRE_RE.exec(t);
      if (hit && hit.index === (m.index ?? 0) + m[0].length) {
        const limpio = limpiarNombre(hit[0]);
        if (pareceNombre(limpio) && limpio.split(/\s+/).length >= 2 && !/^(?:Docente|Director|Coordinador)/i.test(limpio)) {
          nombres.add(limpio);
          if (/^(?:Lcda?\.?|Lic\.?)/i.test(m[0].trim())) conTitulo = true;
        }
      }
    }
  }
  return { nombres: [...nombres].sort((a, b) => b.length - a.length), conTitulo };
}
export function regexDeNombre(nombre: string): RegExp {
  const cuerpo = nombre.trim().split(/\s+/).map((palabra) => [...palabra].map((ch) => {
    const base = sinAcentos(ch);
    return CLASES[base] ?? base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }).join('')).join('\\s+');
  return new RegExp(`(?<![\\p{L}])${cuerpo}(?![\\p{L}])`, 'giu');
}
function edicionesDeNombre(texto: string, anteriores: string[], nuevo: string): EdicionTexto[] {
  const lista: EdicionTexto[] = [];
  for (const n of anteriores) for (const m of texto.matchAll(regexDeNombre(n))) {
    lista.push({ inicio: m.index ?? 0, fin: (m.index ?? 0) + m[0].length, reemplazo: nuevo });
  }
  return sinSolapes(lista);
}
function sinSolapes(lista: EdicionTexto[]): EdicionTexto[] {
  const ordenada = [...lista].sort((a, b) => a.inicio - b.inicio || b.fin - a.fin);
  const salida: EdicionTexto[] = [];
  for (const e of ordenada) if (!salida.length || e.inicio >= salida[salida.length - 1].fin) salida.push(e);
  return salida;
}

// ---------- Hechos del grupo ----------
function textoHecho(b: BloqueDocx, destino: NumeroGrado, hechos: OpcionesAdaptacion['hechosGrupo']): string[] {
  const et = sinAcentos(b.etiqueta || b.seccion);
  const diag = hechos?.diagnostico?.trim();
  const mat = hechos?.matricula?.trim();
  const grupo = etiquetaGrado(destino);
  if (/matricula|cantidad de estudiantes/.test(et)) return [mat ? mat : `${MARCADOR_PENDIENTE}: matrícula del grupo de ${grupo}.`];
  if (diag && /necesidad/.test(et)) return [`Necesidades expresadas en el diagnóstico aportado por el docente: ${diag}`];
  if (diag && /(contexto|descripcion|situacion|caracterizacion|diagnostic)/.test(et) && !/instrumento|tecnica/.test(et)) {
    return [`Diagnóstico informado por el docente: ${diag}`, 'Otros datos del contexto requieren confirmación.'];
  }
  if (/instrumento|tecnica/.test(et)) {
    return [`${MARCADOR_PENDIENTE}: instrumentos que usted aplicó al grupo de ${grupo}. (Propuesta aún no aplicada: observación pedagógica y lista de cotejo.)`];
  }
  return [`${MARCADOR_PENDIENTE}: datos observados del grupo de ${grupo} (${(b.etiqueta || 'diagnóstico').replace(/:$/, '')}). El texto anterior correspondía a otro grupo y fue retirado.`];
}

// ---------- Origen del grado ----------
function determinarGradoOrigen(bloques: BloqueDocx[], declarado?: NumeroGrado): NumeroGrado {
  const conteo = new Map<NumeroGrado, number>();
  const enCampos = new Map<NumeroGrado, number>();
  for (const b of bloques) {
    if (b.rol === 'hecho_grupo' && !b.campo) { /* también cuenta */ }
    for (const m of detectarMencionesGrado(b.texto, { contextoGrado: b.campo === 'grado' })) {
      conteo.set(m.grado, (conteo.get(m.grado) || 0) + 1);
      if (b.campo === 'grado') enCampos.set(m.grado, (enCampos.get(m.grado) || 0) + 1);
    }
  }
  const mayor = (m: Map<NumeroGrado, number>) => [...m.entries()].sort((a, b) => b[1] - a[1]);
  const base = enCampos.size ? mayor(enCampos) : mayor(conteo);
  if (declarado !== undefined) {
    if (base.length && !conteo.has(declarado)) {
      throw new AclaracionNecesariaError(`El Word indica ${etiquetaGrado(base[0][0])}, pero usted mencionó ${etiquetaGrado(declarado)}. ¿De qué grado es el proyecto actual?`);
    }
    return declarado;
  }
  if (!base.length) throw new AclaracionNecesariaError('No encuentro el grado actual escrito en el Word. ¿De qué grado es el proyecto que desea adaptar?');
  if (base.length > 1 && base[0][1] === base[1][1]) {
    throw new AclaracionNecesariaError(`El Word menciona ${etiquetaGrado(base[0][0])} y ${etiquetaGrado(base[1][0])}. ¿De cuál grado es el proyecto actual?`);
  }
  return base[0][0];
}

const normalizarTexto = (s: string) => sinAcentos(s).replace(/\s+/g, ' ').trim();

export async function adaptarProyectoAulaIntegral(archivo: EntradaZip, opciones: OpcionesAdaptacion): Promise<ResultadoAdaptacion> {
  const { gradoDestino, docenteDestino, hechosGrupo, proveedor, onProgreso } = opciones;
  const bytesOriginales = await aBytes(archivo);
  const { zip, partes } = await abrirPartesDocx(bytesOriginales);
  const inv = inventariarPartes(partes);
  onProgreso?.('Leyendo todas las tablas, párrafos, encabezados y pies del Word...');

  const gradoOrigen = determinarGradoOrigen(inv.bloques, opciones.gradoOrigen);
  if (gradoOrigen === gradoDestino) {
    throw new AdaptacionNoSeguraError(`El Word ya está escrito para ${etiquetaGrado(gradoDestino)}; no hay nada que adaptar.`, [], 'mismo_grado');
  }
  const textosParrafos = partes.flatMap((p) => descendientesW(p.doc, 'p').map(textoParrafo));
  const { nombres: docentesAnteriores, conTitulo } = extraerNombresDocente(inv.bloques, textosParrafos);
  const nuevoDocente = docenteDestino?.trim() || undefined;
  const advertencias: string[] = [];
  const datosPendientes: string[] = [];
  if (nuevoDocente && !docentesAnteriores.length && !inv.bloques.some((b) => b.campo === 'docente')) {
    advertencias.push('No encontré un campo de docente en el Word; no pude escribir el nombre nuevo.');
  }
  if (nuevoDocente && conTitulo) advertencias.push('Se conservó el tratamiento (Lcda./Lic.) del nombre anterior; revise que corresponda al docente nuevo.');

  // ---- Propuestas del modelo ----
  const paraModelo: BloqueParaModelo[] = inv.bloques
    .filter((b) => b.rol === 'propuesta' && b.texto.trim())
    .map((b) => ({ id: b.id, etiqueta: b.etiqueta || b.columna, seccion: b.seccion, lineas: b.lineas.length ? b.lineas : [b.texto] }));
  const base = { gradoOrigen, gradoDestino };
  const { lotes, sinCabida } = dividirEnLotes(base, paraModelo);
  if (sinCabida.length) {
    throw new AdaptacionNoSeguraError('Hay bloques demasiado extensos para adaptarlos de forma segura sin recortarlos.', sinCabida.map((id) => `Bloque demasiado largo: ${id}`), 'bloque_largo');
  }
  const maxLotes = opciones.maxLotes ?? 16;
  if (lotes.length > maxLotes) {
    throw new AdaptacionNoSeguraError(`El documento requeriría ${lotes.length} consultas y el límite seguro es ${maxLotes}. Divida la adaptación por secciones.`, [], 'demasiados_lotes');
  }
  const propuestas: Record<string, string[]> = {};
  let n = 0;
  for (const lote of lotes) {
    n++;
    onProgreso?.(`Camila está adaptando el contenido pedagógico a ${etiquetaGrado(gradoDestino)} (${n} de ${lotes.length})...`);
    let peticion = { ...base, bloques: lote };
    let bruto: Record<string, string[]>;
    try { bruto = await proveedor(peticion); }
    catch (error) {
      throw new AdaptacionNoSeguraError(`Camila no pudo obtener la propuesta pedagógica: ${(error as Error)?.message || 'error del proveedor'}. El Word no fue modificado.`, [], 'proveedor');
    }
    let { validos, invalidos } = validarPropuestas(peticion, bruto);
    Object.assign(propuestas, validos);
    if (invalidos.length) {
      const ids = new Set(invalidos.filter((x) => lote.some((b) => b.id === x.id)).map((x) => x.id));
      const reintento = lote.filter((b) => ids.has(b.id));
      if (reintento.length) {
        const motivos = [...new Set(invalidos.map((x) => x.motivo))].join('; ');
        peticion = { ...base, bloques: reintento, recordatorio: `Se rechazaron algunos bloques por: ${motivos}. Corrija solo eso y devuelva todos los ids.` } as typeof peticion;
        try { bruto = await proveedor(peticion); } catch { bruto = {}; }
        ({ validos, invalidos } = validarPropuestas(peticion, bruto));
        Object.assign(propuestas, validos);
      }
    }
    if (invalidos.length) {
      throw new AdaptacionNoSeguraError(
        `Camila no pudo adaptar de forma válida ${invalidos.length} bloque(s). Para no dejar un documento a medias, no apliqué ningún cambio.`,
        invalidos.map((x) => `${x.id}: ${x.motivo}`), 'propuesta_invalida');
    }
  }

  // ---- Escritura en la copia ----
  onProgreso?.('Aplicando los cambios en una copia del Word y conservando logos, tablas y estilos...');
  const tocadas = new Set<string>();
  const reglasEdicion = (texto: string, b: BloqueDocx | null): EdicionTexto[] => {
    const lista = [...edicionesDeGrado(texto, gradoDestino, { origen: gradoOrigen, contextoGrado: b?.campo === 'grado' })];
    if (nuevoDocente && docentesAnteriores.length) lista.push(...edicionesDeNombre(texto, docentesAnteriores, nuevoDocente));
    return sinSolapes(lista);
  };
  const aplicarReglas = (p: Element, b: BloqueDocx | null, ruta: string) => {
    if (aplicarEdicionesEnParrafo(p, (t) => reglasEdicion(t, b)) > 0) tocadas.add(ruta);
  };
  const idsRevisadosSinCambio: string[] = [];
  const pendientesHecho = new Set<string>();
  for (const b of inv.bloques) {
    const ruta = b.parte;
    const parrafos = b.tipo === 'celda' ? parrafosDirectos(b.elemento) : [b.elemento];
    if (b.rol === 'propuesta' && propuestas[b.id]) {
      const lineas = propuestas[b.id];
      if (normalizarTexto(lineas.join(' ')) === normalizarTexto(b.lineas.join(' ')) && !detectarMencionesGrado(b.texto).length) idsRevisadosSinCambio.push(b.id);
      if (b.tipo === 'celda') escribirLineasCeldaSeguro(b.elemento, lineas);
      else if (b.inicioValor > 0) escribirValorDesde(b.elemento, b.inicioValor, lineas.join(' '));
      else escribirTextoParrafoSeguro(b.elemento, lineas.join(' '));
      tocadas.add(ruta);
      continue;
    }
    if (b.rol === 'hecho_grupo' && b.texto.trim()) {
      const lineas = textoHecho(b, gradoDestino, hechosGrupo);
      if (lineas.some((l) => l.includes(MARCADOR_PENDIENTE))) pendientesHecho.add((b.etiqueta || b.seccion || 'dato del grupo').replace(/:$/, ''));
      if (b.tipo === 'celda') escribirLineasCeldaSeguro(b.elemento, lineas);
      else if (b.inicioValor > 0) escribirValorDesde(b.elemento, b.inicioValor, lineas.join(' '));
      else escribirTextoParrafoSeguro(b.elemento, lineas.join(' '));
      tocadas.add(ruta);
      continue;
    }
    if (b.campo === 'docente' && nuevoDocente && !b.texto.trim() && b.tipo === 'celda') {
      escribirLineasCeldaSeguro(b.elemento, [nuevoDocente]); tocadas.add(ruta); continue;
    }
    for (const p of parrafos) aplicarReglas(p, b, ruta);
  }
  // Red de seguridad: cualquier párrafo restante (cuadros de texto, anidados, pies, notas).
  for (const parte of partes) for (const p of descendientesW(parte.doc, 'p')) {
    if (textoParrafoEditable(p).trim()) aplicarReglas(p, null, parte.ruta);
  }

  // ---- Serializar solo las partes modificadas; el resto del ZIP no se toca ----
  const serial = new XMLSerializer();
  const partesEditadas: string[] = [];
  for (const parte of partes) {
    if (!tocadas.has(parte.ruta)) continue;
    const serializado = serial.serializeToString(parte.doc);
    // xmldom serializa la declaración XML existente; el navegador puede omitirla.
    // Duplicarla produce un DOCX inválido al reabrirlo.
    zip.file(parte.ruta, /^\s*<\?xml\b/i.test(serializado)
      ? serializado : declaracionXml(parte.xml) + serializado);
    partesEditadas.push(parte.ruta);
  }
  const salida = await zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE', mimeType: MIME_DOCX });
  const blob = new Blob([salida as BlobPart], { type: MIME_DOCX });

  // ---- Auditoría del archivo final ----
  onProgreso?.('Verificando el Word resultante (reabriéndolo y comparándolo con el original)...');
  const hechosAportados = Boolean(hechosGrupo?.diagnostico?.trim());
  const auditoria = await auditarDocxAdaptado({
    original: bytesOriginales, resultado: salida, gradoOrigen, gradoDestino, docentesAnteriores,
    docenteNuevo: nuevoDocente, idsRevisadosSinCambio, hechosAportados,
  });
  if (!auditoria.aprobado) {
    throw new AdaptacionNoSeguraError('La verificación del Word resultante encontró problemas. No apliqué ningún cambio al documento.', auditoria.errores, 'auditoria');
  }
  advertencias.push(...auditoria.advertencias);

  for (const etiqueta of pendientesHecho) datosPendientes.push(etiqueta);
  const bloqueGrado = inv.bloques.find((b) => b.campo === 'grado' && /secci[oó]n\s+\S+|\b[A-Z]\b\s*$/i.test(b.texto));
  if (bloqueGrado) datosPendientes.push(`Sección: se conservó la del original («${bloqueGrado.texto.slice(0, 40)}»); confirme si corresponde al nuevo grupo`);
  const informe: InformeAdaptacion = {
    gradoOrigen, gradoDestino, docentesAnteriores, docenteNuevo: nuevoDocente,
    bloquesRevisados: auditoria.metricas.bloquesRevisados, bloquesModificados: auditoria.metricas.bloquesModificados,
    etiquetasProtegidas: auditoria.metricas.etiquetasProtegidas, lotes: lotes.length, cobertura: auditoria.cobertura,
    preservado: { imagenes: auditoria.metricas.dibujos, archivosIdenticos: auditoria.metricas.partesIdenticas, mediaIdentica: auditoria.metricas.mediaIdentica, tablas: auditoria.metricas.tablas },
    datosPendientes, advertencias,
    preguntaPendiente: pendientesHecho.size
      ? `¿Qué ha observado en su grupo de ${etiquetaGrado(gradoDestino)}? Por ejemplo, cómo leen y escriben, qué operaciones dominan y qué les cuesta más.`
      : undefined,
    auditoria,
  };
  return { blob, informe, partesEditadas };
}

