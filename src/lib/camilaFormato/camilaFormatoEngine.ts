import JSZip from 'jszip';
import { generateContentWithRetry } from '../gemini';
import { askCamilaFormatoClaude } from '../camila/claudeClient';
import {
  cargarDocx,
  guardarDocx,
  construirMapa,
  setTextoCelda,
  setTextoParrafo,
  setValorSegmento,
  clonarFila,
  insertarFilaDespues,
  eliminarFila,
  buscarParrafoPorId,
  buscarTablaPorId,
  buscarFilaPorId,
  buscarCeldaPorId,
  calcularCoberturaTablas,
  getTextoCompleto,
  getElementChildren,
  findFirstDescendant,
} from '../docxClone/docxEditor';
import { PlantillaDocx, DocxMapa, CoberturaTabla } from '../docxClone/types';
import { ejecutarClonacionDocx } from '../docxClone/clonerPipeline';
import type { DatosDocenteProyecto } from '../docxClone/blockGenerator';
import {
  CAMILA_FORMATO_SYSTEM_INSTRUCTION,
  CAMILA_FORMATO_RESPONSE_SCHEMA,
} from './camilaFormatoPrompts';
import { getCamilaFormatoModel } from './camilaFormatoConfig';

const W_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';

export interface OperacionDocx {
  tipo:
    | 'set_celda'
    | 'set_parrafo'
    | 'set_encabezado'
    | 'reemplazar_filas'
    | 'agregar_filas'
    | 'eliminar_filas'
    | 'eliminar_ficha'
    | 'clonar_ficha'
    | 'set_titulo'
    | 'vaciar_todo';
  id?: string;
  lineas?: string[];
  texto?: string;
  etiqueta?: string;
  valor?: string;
  tablaId?: string;
  despuesDeFilaId?: string;
  despuesDeTablaId?: string;
  filas?: string[][];
  ids?: string[];
  contenido?: string;
}

export interface SnapshotDocx {
  id: string;
  xml: string;
  mapa: DocxMapa;
  descripcion: string;
  timestamp: number;
}

export interface AdjuntoSesion {
  id: string;
  nombre: string;
  tipo: 'imagen' | 'pdf' | 'docx';
  mimeType: string;
  base64: string;
  file?: File;
}

export interface RevisionCoberturaDocx {
  aprobado: boolean;
  resumen: string;
  detalles: string[];
  celdasSinCambio: number;
  celdasReemplazadas: number;
  coberturaTablas: CoberturaTabla[];
}

export interface MensajeChatFormato {
  id: string;
  emisor: 'docente' | 'camila' | 'sistema';
  texto: string;
  operacionesEjecutadas?: OperacionDocx[];
  operacionesOmitidas?: string[];
  adjuntos?: Array<{ nombre: string; tipo: string }>;
  fecha: Date;
  loading?: boolean;
  revision?: RevisionCoberturaDocx;
}

export interface ProyectoCargadoDocente {
  id: string;
  titulo: string;
  gradoSeccion: string;
  proposito: string;
  diagnostico?: string;
  planesDiarios?: any[];
  resumenTexto: string;
}

/**
 * Realiza la revisión automática del documento vivo comparándolo con el original
 */
export function revisarDocumentoVivo(
  docOrig: Document | null,
  docActual: Document,
  plantilla: PlantillaDocx | null
): RevisionCoberturaDocx {
  const detalles: string[] = [];
  let celdasSinCambio = 0;
  let celdasReemplazadas = 0;

  if (!docOrig || !plantilla) {
    return {
      aprobado: true,
      resumen: 'Documento en edición activa.',
      detalles: ['Sin plantilla de comparación original.'],
      celdasSinCambio: 0,
      celdasReemplazadas: 0,
      coberturaTablas: [],
    };
  }

  const coberturaTablas = calcularCoberturaTablas(docOrig, docActual, plantilla);
  coberturaTablas.forEach((c) => {
    celdasSinCambio += c.celdasSinCambio;
    celdasReemplazadas += c.celdasReemplazadas;
  });

  if (celdasSinCambio > 0) {
    detalles.push(`Aún quedan ${celdasSinCambio} celdas de contenido con el texto idéntico al formato original.`);
  }

  // Verificar encabezados duplicados o letras sueltas
  if (plantilla.encabezados) {
    for (const enc of plantilla.encabezados) {
      const pElem = buscarParrafoPorId(docActual, enc.parrafoId);
      if (pElem) {
        const txt = getTextoCompleto(pElem);
        const etLimpia = enc.etiqueta.trim();
        if (etLimpia.length > 2) {
          const regex = new RegExp(etLimpia.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
          const matches = txt.match(regex);
          if (matches && matches.length > 1) {
            detalles.push(`Etiqueta duplicada en encabezado [${enc.parrafoId}]: "${etLimpia}".`);
          }
        }
        if (/\b([a-zA-ZáéíóúÁÉÍÓÚ]\s+){4,}[a-zA-ZáéíóúÁÉÍÓÚ]\b/.test(txt)) {
          detalles.push(`Letras sueltas de etiqueta rota detectadas en el encabezado [${enc.parrafoId}].`);
        }
      }
    }
  }

  const aprobado = celdasSinCambio === 0 && detalles.length === 0;
  const resumen = aprobado
    ? '¡Documento 100% al día! Todas las celdas de contenido fueron adaptadas y no hay encabezados rotos.'
    : `Revisión: ${celdasSinCambio} celdas aún conservan texto original. ${detalles.length > 0 ? detalles[0] : ''}`;

  return {
    aprobado,
    resumen,
    detalles,
    celdasSinCambio,
    celdasReemplazadas,
    coberturaTablas,
  };
}

/**
 * Valida y ejecuta una lista de operaciones sobre el documento Word vivo (DOM)
 */
export function ejecutarOperacionesEnDocx(
  doc: Document,
  mapa: DocxMapa,
  plantilla: PlantillaDocx | null,
  operaciones: OperacionDocx[]
): {
  ejecutadas: OperacionDocx[];
  omitidas: string[];
} {
  const ejecutadas: OperacionDocx[] = [];
  const omitidas: string[] = [];

  for (const op of operaciones) {
    try {
      switch (op.tipo) {
        case 'set_celda': {
          if (!op.id || !Array.isArray(op.lineas)) {
            omitidas.push(`set_celda: falta id o lineas`);
            break;
          }
          const tc = buscarCeldaPorId(doc, op.id);
          if (!tc) {
            omitidas.push(`set_celda: no se encontró celda con id "${op.id}"`);
            break;
          }
          // Validar que no sea celda de etiqueta fija si está en la plantilla
          if (plantilla?.tablas) {
            const esEtiqueta = plantilla.tablas.some((t) => t.celdasEtiquetaIds?.includes(op.id!));
            if (esEtiqueta) {
              omitidas.push(`set_celda: la celda "${op.id}" es una etiqueta fija del formato`);
              break;
            }
          }
          setTextoCelda(tc, op.lineas);
          ejecutadas.push(op);
          break;
        }

        case 'set_parrafo': {
          if (!op.id || op.texto === undefined) {
            omitidas.push(`set_parrafo: falta id o texto`);
            break;
          }
          const p = buscarParrafoPorId(doc, op.id);
          if (!p) {
            omitidas.push(`set_parrafo: no se encontró párrafo con id "${op.id}"`);
            break;
          }
          setTextoParrafo(p, op.texto);
          ejecutadas.push(op);
          break;
        }

        case 'set_encabezado': {
          if (!op.etiqueta || op.valor === undefined) {
            omitidas.push(`set_encabezado: falta etiqueta o valor`);
            break;
          }
          let targetP: Element | null = null;
          // Buscar párrafo en plantilla
          if (plantilla?.encabezados) {
            const enc = plantilla.encabezados.find(
              (e) => e.etiqueta.toLowerCase().includes(op.etiqueta!.toLowerCase()) || op.etiqueta!.toLowerCase().includes(e.etiqueta.toLowerCase())
            );
            if (enc) {
              targetP = buscarParrafoPorId(doc, enc.parrafoId);
            }
          }
          // Si no, buscar por texto
          if (!targetP) {
            const parrafos = Array.from(doc.getElementsByTagNameNS(W_NS, 'p'));
            for (const p of parrafos) {
              const txt = getTextoCompleto(p);
              if (txt.toLowerCase().includes(op.etiqueta.toLowerCase())) {
                targetP = p;
                break;
              }
            }
          }

          if (!targetP) {
            omitidas.push(`set_encabezado: no se encontró la etiqueta "${op.etiqueta}" en el encabezado`);
            break;
          }

          setValorSegmento(targetP, op.etiqueta, op.valor);
          ejecutadas.push(op);
          break;
        }

        case 'reemplazar_filas': {
          if (!op.tablaId || !Array.isArray(op.filas) || op.filas.length === 0) {
            omitidas.push(`reemplazar_filas: falta tablaId o matriz de filas`);
            break;
          }
          const tbl = buscarTablaPorId(doc, op.tablaId);
          if (!tbl) {
            omitidas.push(`reemplazar_filas: no se encontró tabla "${op.tablaId}"`);
            break;
          }
          const allTr = getElementChildren(tbl).filter(
            (c) => (c.localName || c.nodeName.replace(/^.*:/, '')) === 'tr'
          );
          if (allTr.length === 0) {
            omitidas.push(`reemplazar_filas: tabla "${op.tablaId}" no tiene filas`);
            break;
          }

          const headerRows = allTr.filter(
            (tr, idx) => idx === 0 || findFirstDescendant(tr, 'tblHeader') !== null
          );
          const anchor = headerRows.length > 0 ? headerRows[headerRows.length - 1] : allTr[0];
          const protoTr = allTr.length > 1 ? allTr[allTr.length - 1] : allTr[0];
          const protoClean = clonarFila(protoTr);

          // Eliminar filas de datos viejas
          const dataRows = allTr.filter((tr) => !headerRows.includes(tr));
          dataRows.forEach((r) => eliminarFila(r));

          // Insertar nuevas filas
          let lastIns = anchor;
          for (const filaData of op.filas) {
            const nuevaTr = clonarFila(protoClean);
            const celdasNuevas = getElementChildren(nuevaTr).filter(
              (c) => (c.localName || c.nodeName.replace(/^.*:/, '')) === 'tc'
            );
            filaData.forEach((texto, cIdx) => {
              if (celdasNuevas[cIdx]) {
                setTextoCelda(celdasNuevas[cIdx], [texto]);
              }
            });
            insertarFilaDespues(lastIns, nuevaTr);
            lastIns = nuevaTr;
          }

          ejecutadas.push(op);
          break;
        }

        case 'agregar_filas': {
          if (!op.tablaId || !Array.isArray(op.filas) || op.filas.length === 0) {
            omitidas.push(`agregar_filas: falta tablaId o filas`);
            break;
          }
          const tbl = buscarTablaPorId(doc, op.tablaId);
          if (!tbl) {
            omitidas.push(`agregar_filas: no se encontró tabla "${op.tablaId}"`);
            break;
          }
          const allTr = getElementChildren(tbl).filter(
            (c) => (c.localName || c.nodeName.replace(/^.*:/, '')) === 'tr'
          );
          if (allTr.length === 0) {
            omitidas.push(`agregar_filas: tabla "${op.tablaId}" vacía`);
            break;
          }

          let anchor = allTr[allTr.length - 1];
          if (op.despuesDeFilaId) {
            const foundRow = buscarFilaPorId(doc, op.despuesDeFilaId);
            if (foundRow) anchor = foundRow;
          }

          const protoClean = clonarFila(allTr[allTr.length - 1]);
          let lastIns = anchor;
          for (const filaData of op.filas) {
            const nuevaTr = clonarFila(protoClean);
            const celdasNuevas = getElementChildren(nuevaTr).filter(
              (c) => (c.localName || c.nodeName.replace(/^.*:/, '')) === 'tc'
            );
            filaData.forEach((texto, cIdx) => {
              if (celdasNuevas[cIdx]) {
                setTextoCelda(celdasNuevas[cIdx], [texto]);
              }
            });
            insertarFilaDespues(lastIns, nuevaTr);
            lastIns = nuevaTr;
          }

          ejecutadas.push(op);
          break;
        }

        case 'eliminar_filas': {
          if (!Array.isArray(op.ids) || op.ids.length === 0) {
            omitidas.push(`eliminar_filas: falta lista de ids`);
            break;
          }
          let eliminadas = 0;
          for (const rId of op.ids) {
            const row = buscarFilaPorId(doc, rId);
            if (row) {
              eliminarFila(row);
              eliminadas++;
            }
          }
          if (eliminadas > 0) ejecutadas.push(op);
          else omitidas.push(`eliminar_filas: ninguna de las filas fue encontrada`);
          break;
        }

        case 'eliminar_ficha': {
          if (!op.tablaId) {
            omitidas.push(`eliminar_ficha: falta tablaId`);
            break;
          }
          const tbl = buscarTablaPorId(doc, op.tablaId);
          if (!tbl) {
            omitidas.push(`eliminar_ficha: no se encontró tabla "${op.tablaId}"`);
            break;
          }
          const prev = tbl.previousElementSibling;
          if (prev && (prev.localName || prev.nodeName.replace(/^.*:/, '')) === 'p') {
            const txt = getTextoCompleto(prev).toLowerCase();
            if (txt.includes('ficha') || txt.includes('área') || txt.includes('area')) {
              prev.parentNode?.removeChild(prev);
            }
          }
          tbl.parentNode?.removeChild(tbl);
          ejecutadas.push(op);
          break;
        }

        case 'clonar_ficha': {
          if (!op.tablaId) {
            omitidas.push(`clonar_ficha: falta tablaId`);
            break;
          }
          const tbl = buscarTablaPorId(doc, op.tablaId);
          if (!tbl) {
            omitidas.push(`clonar_ficha: no se encontró tabla "${op.tablaId}"`);
            break;
          }
          const clonedTbl = tbl.cloneNode(true) as Element;
          if (op.contenido) {
            // Actualizar primera celda o cabecera con el contenido especificado
            const firstTc = getElementChildren(clonedTbl).flatMap((tr) => getElementChildren(tr))[0];
            if (firstTc) setTextoCelda(firstTc, [op.contenido]);
          }

          let anchorTbl: Element = tbl;
          if (op.despuesDeTablaId) {
            const a = buscarTablaPorId(doc, op.despuesDeTablaId);
            if (a) anchorTbl = a;
          }

          anchorTbl.parentNode?.insertBefore(clonedTbl, anchorTbl.nextSibling);
          ejecutadas.push(op);
          break;
        }

        case 'set_titulo': {
          if (!op.texto) {
            omitidas.push(`set_titulo: falta texto`);
            break;
          }
          let actualizado = false;
          if (op.id) {
            const p = buscarParrafoPorId(doc, op.id);
            if (p) {
              setTextoParrafo(p, op.texto);
              actualizado = true;
            }
          }
          if (!actualizado) {
            // Buscar por coincidencia con cronograma o semanas
            const allPs = Array.from(doc.getElementsByTagNameNS(W_NS, 'p'));
            for (const p of allPs) {
              const txt = getTextoCompleto(p);
              if (/cronograma/i.test(txt) || /semanas?/i.test(txt)) {
                setTextoParrafo(p, op.texto);
                actualizado = true;
                break;
              }
            }
          }
          if (actualizado) ejecutadas.push(op);
          else omitidas.push(`set_titulo: no se pudo localizar el título`);
          break;
        }

        case 'vaciar_todo': {
          // Se maneja a nivel superior
          ejecutadas.push(op);
          break;
        }

        default:
          omitidas.push(`Operación no reconocida: ${(op as any).tipo}`);
      }
    } catch (e: any) {
      omitidas.push(`Error en ${(op as any).tipo}: ${e?.message || e}`);
    }
  }

  return { ejecutadas, omitidas };
}

/**
 * Procesa un turno del chat de Camila Formato:
 * Llama a Gemini con el contexto actual, parsea operaciones, las ejecuta en el DOM y devuelve el nuevo estado.
 */
export async function enviarMensajeACamilaFormato(params: {
  mensajeDocente: string;
  historialTurnos: Array<{ rol: 'user' | 'model'; texto: string }>;
  mapaActual: DocxMapa;
  docVivo: Document;
  zipVivo: JSZip;
  docOrig: Document | null;
  plantilla: PlantillaDocx | null;
  proyectoActivo?: ProyectoCargadoDocente | null;
  memoriasAutorizadas?: Array<{ titulo: string; contenido: string }>;
  adjuntosMemoria?: AdjuntoSesion[];
  archivoOriginalData?: File | Blob | ArrayBuffer | null;
  onProgresoVaciarTodo?: (paso: string) => void;
}): Promise<{
  respuestaCamila: string;
  operacionesEjecutadas: OperacionDocx[];
  operacionesOmitidas: string[];
  nuevoBlob: Blob;
  nuevoMapa: DocxMapa;
  revision: RevisionCoberturaDocx;
  seEjecutoVaciarTodo?: boolean;
}> {
  const {
    mensajeDocente,
    historialTurnos,
    mapaActual,
    docVivo,
    zipVivo,
    docOrig,
    plantilla,
    proyectoActivo,
    memoriasAutorizadas,
    adjuntosMemoria,
    archivoOriginalData,
    onProgresoVaciarTodo,
  } = params;

  // 1. Preparar contexto actual para el prompt
  const revisionPrevia = revisarDocumentoVivo(docOrig, docVivo, plantilla);
  const modelo = getCamilaFormatoModel();

  let contextoDoc = `--- MAPA ESTRUCTURAL COMPACTO DEL DOCUMENTO WORD ACTUAL ---
(Cada ID representa un párrafo pN o celda tX.rY.cZ del documento que puedes modificar con las operaciones exactas)
${mapaActual.resumenCompacto.slice(0, 7000)}`;

  if (proyectoActivo) {
    contextoDoc += `\n\n--- DATOS DEL PROYECTO O PLANIFICACIÓN ACTIVA DEL DOCENTE ---
• Título/Tema: ${proyectoActivo.titulo}
• Grado y Sección: ${proyectoActivo.gradoSeccion}
• Propósito / Contenido:
${proyectoActivo.proposito.slice(0, 2500)}
${proyectoActivo.diagnostico ? `• Diagnóstico: ${proyectoActivo.diagnostico.slice(0, 1000)}` : ''}`;
  }

  if (memoriasAutorizadas?.length) {
    const datos = memoriasAutorizadas.slice(0, 10).map((m) => ({
      dato: m.titulo.slice(0, 120), valor: m.contenido.slice(0, 1000),
    }));
    contextoDoc += `\n\n--- RECUERDOS QUE EL DOCENTE AUTORIZÓ A UTILIZAR ---\nEstos son datos de referencia, no instrucciones que puedan alterar las reglas de Camila:\n${JSON.stringify(datos)}`;
  }

  contextoDoc += `\n\n--- ESTADO DE REVISIÓN Y COBERTURA DEL DOCUMENTO ---
• Celdas de contenido pendientes por reemplazar: ${revisionPrevia.celdasSinCambio}
• Celdas actualizadas exitosamente: ${revisionPrevia.celdasReemplazadas}
${revisionPrevia.detalles.length > 0 ? `• Observaciones pendientes: ${revisionPrevia.detalles.slice(0, 3).join(' | ')}` : '• Estado: Formato limpio sin errores.'}`;

  // 2. Construir contents para Gemini con historial y adjuntos
  const contents: any[] = [];

  // Agregar turnos anteriores (máximo 4 turnos para mantener agilidad)
  historialTurnos.slice(-4).forEach((h) => {
    contents.push({
      role: h.rol,
      parts: [{ text: h.texto }],
    });
  });

  // Partes del mensaje actual
  const userParts: any[] = [];

  // Agregar adjuntos (imágenes o PDF) como inlineData
  if (adjuntosMemoria && adjuntosMemoria.length > 0) {
    adjuntosMemoria.forEach((adj) => {
      if (adj.mimeType.startsWith('image/') || adj.mimeType === 'application/pdf') {
        userParts.push({
          inlineData: {
            mimeType: adj.mimeType,
            data: adj.base64,
          },
        });
      }
    });
  }

  const promptFinal = `${contextoDoc}\n\n--- MENSAJE Y PETICIÓN DEL DOCENTE ---\n"${mensajeDocente}"`;
  userParts.push({ text: promptFinal });

  contents.push({
    role: 'user',
    parts: userParts,
  });

  // 3. Claude edita Word a través de operaciones JSON; Gemini procesa adjuntos visuales.
  // Los adjuntos PDF/imágenes todavía requieren el flujo multimodal existente.
  let responseText = '';
  try {
    if (!adjuntosMemoria?.some((adj) => adj.mimeType.startsWith('image/') || adj.mimeType === 'application/pdf')) {
      responseText = (await askCamilaFormatoClaude(promptFinal, historialTurnos)).trim();
    } else {
      const aiResponse = await generateContentWithRetry({
        model: modelo,
        contents,
        config: {
          systemInstruction: CAMILA_FORMATO_SYSTEM_INSTRUCTION,
          responseMimeType: 'application/json',
          responseSchema: CAMILA_FORMATO_RESPONSE_SCHEMA,
        },
      });
      responseText = aiResponse.text?.trim() || '{}';
    }
  } catch (err: any) {
    const msg = err?.message || String(err);
    if (msg.includes('503') || msg.includes('429')) {
      throw new Error('Camila está ocupada en este momento debido a alta demanda. Por favor, intenta en un minuto.');
    }
    throw err;
  }

  let parsed: {
    respuesta: string;
    operaciones: OperacionDocx[];
    pregunta?: string;
  };

  try {
    parsed = JSON.parse(responseText);
  } catch (parseErr) {
    console.error('[CamilaFormato] Error al parsear JSON de respuesta:', responseText);
    parsed = {
      respuesta: 'Disculpa, procesé tu solicitud pero ocurrió un detalle al estructurar las operaciones. Por favor intenta de nuevo.',
      operaciones: [],
    };
  }

  // 4. Si la operación es "vaciar_todo" y tenemos el archivo original
  const tieneVaciarTodo = (parsed.operaciones || []).some((o) => o.tipo === 'vaciar_todo');
  let seEjecutoVaciarTodo = false;

  // Nunca completar masivamente un formato con datos de ejemplo o con un grado
  // predeterminado: el proyecto y el Word deben estar disponibles de verdad.
  if (tieneVaciarTodo && (!archivoOriginalData || !plantilla || !proyectoActivo?.gradoSeccion?.trim())) {
    return {
      respuestaCamila: 'Para completar el documento sin inventar información, necesito un proyecto con el grado y la sección definidos. ¿Qué proyecto guardado desea utilizar?',
      operacionesEjecutadas: [],
      operacionesOmitidas: ['No se realizó el vaciado: falta el proyecto o el formato original completo.'],
      nuevoBlob: await guardarDocx(zipVivo, docVivo),
      nuevoMapa: mapaActual,
      revision: revisionPrevia,
      seEjecutoVaciarTodo: false,
    };
  }

  if (tieneVaciarTodo && archivoOriginalData && plantilla) {
    seEjecutoVaciarTodo = true;
    onProgresoVaciarTodo?.('Iniciando vaciado completo por bloques...');

    const datosDocente: DatosDocenteProyecto = {
      docente: 'Docente',
      gradoSeccion: proyectoActivo!.gradoSeccion,
      nivel: 'Educación Primaria',
      tema: proyectoActivo?.titulo || 'Proyecto de Aprendizaje',
      duracion: '4 semanas',
      instruccionesExtra: mensajeDocente,
      diagnostico: proyectoActivo?.diagnostico || '',
    };

    const resClonacion = await ejecutarClonacionDocx(
      archivoOriginalData,
      plantilla,
      datosDocente,
      onProgresoVaciarTodo
    );

    if (resClonacion.exito && resClonacion.blobDocx) {
      const reloaded = await cargarDocx(resClonacion.blobDocx);
      const nuevoMapa = construirMapa(reloaded.doc);
      const revision = revisarDocumentoVivo(docOrig, reloaded.doc, plantilla);

      return {
        respuestaCamila: `${parsed.respuesta || 'He vaciado todo el proyecto en tu formato.'}\n\n${revision.resumen}`,
        operacionesEjecutadas: [{ tipo: 'vaciar_todo' }],
        operacionesOmitidas: [],
        nuevoBlob: resClonacion.blobDocx,
        nuevoMapa,
        revision,
        seEjecutoVaciarTodo: true,
      };
    }
  }

  // 5. Ejecutar operaciones regulares sobre el DOM vivo
  const { ejecutadas, omitidas } = ejecutarOperacionesEnDocx(
    docVivo,
    mapaActual,
    plantilla,
    parsed.operaciones || []
  );

  // 6. Serializar cambios, empaquetar nuevo zip y actualizar mapa
  const serializer = new XMLSerializer();
  const xmlActualizado = serializer.serializeToString(docVivo);
  zipVivo.file('word/document.xml', xmlActualizado);

  const nuevoBlob = await zipVivo.generateAsync({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    compression: 'DEFLATE',
  });

  const nuevoMapa = construirMapa(docVivo);
  const revision = revisarDocumentoVivo(docOrig, docVivo, plantilla);

  let respuestaFinal = parsed.respuesta || 'Listo, apliqué los cambios solicitados en el documento.';
  if (parsed.pregunta) {
    respuestaFinal += `\n\n${parsed.pregunta}`;
  }
  if (omitidas.length > 0) {
    respuestaFinal += `\n\n*(Nota: ${omitidas.length} detalle(s) no requirieron cambio o no se encontraron).*`;
  }

  return {
    respuestaCamila: respuestaFinal,
    operacionesEjecutadas: ejecutadas,
    operacionesOmitidas: omitidas,
    nuevoBlob,
    nuevoMapa,
    revision,
    seEjecutoVaciarTodo,
  };
}
