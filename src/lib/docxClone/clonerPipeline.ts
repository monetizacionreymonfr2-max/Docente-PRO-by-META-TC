import {
  cargarDocx,
  guardarDocx,
  setTextoParrafo,
  setTextoCelda,
  setValorSegmento,
  clonarFila,
  insertarFilaDespues,
  eliminarFila,
  validarDocxClonado,
  getTextoCompleto,
} from './docxEditor';
import { PlantillaDocx } from './types';
import {
  DatosDocenteProyecto,
  generarTextosLibres,
  generarTablaArea,
  generarCronograma,
  generarPlanEvaluacion,
} from './blockGenerator';

export interface ClonacionResultado {
  exito: boolean;
  blobDocx?: Blob;
  mensaje: string;
  fallbackRequerido: boolean;
  detallesValidacion?: string[];
  tiempoSegundos?: number;
}

/**
 * Pipeline principal de clonación de Word:
 * Edita una COPIA exacta del archivo original byte a byte y sustituye exclusivamente los textos pedagógicos
 */
export async function ejecutarClonacionDocx(
  fileData: File | Blob | ArrayBuffer,
  plantilla: PlantillaDocx,
  datos: DatosDocenteProyecto,
  onProgress?: (paso: string) => void
): Promise<ClonacionResultado> {
  const tStart = Date.now();

  for (let intento = 1; intento <= 2; intento++) {
    try {
      onProgress?.('Cargando archivo original y parseando estructura XML...');
      const { zip, doc } = await cargarDocx(fileData);

      // 1. APLICAR CAMPOS DE ENCABEZADO
      onProgress?.('Actualizando datos de identificación y membrete...');
      const mapaEncabezados = datos.encabezadosPersonalizados || {};

      plantilla.encabezados.forEach((enc) => {
        const pElem = doc.getElementById ? doc.getElementById(enc.parrafoId) : null;
        // Buscar por id generado o recorrer párrafos
        const pAll = doc.getElementsByTagNameNS('http://schemas.openxmlformats.org/wordprocessingml/2006/main', 'p');
        const pList = pAll.length > 0 ? Array.from(pAll) : Array.from(doc.querySelectorAll('p'));
        const pIndex = parseInt(enc.parrafoId.replace('p', ''), 10);
        const targetP = pList[pIndex];

        if (targetP) {
          const valNuevo =
            mapaEncabezados[enc.id] ||
            (enc.id === 'docente' ? datos.docente : undefined) ||
            (enc.id === 'grado_seccion' ? datos.gradoSeccion : undefined) ||
            (enc.id === 'nombre_pa' ? datos.nombrePa || datos.tema : undefined) ||
            (enc.id === 'nombre_peic' ? datos.peic : undefined) ||
            (enc.id === 'lapso' ? datos.lapsoEjecucion : undefined) ||
            (enc.id === 'matricula' ? datos.matricula : undefined) ||
            (enc.id === 'turno' ? datos.turno : undefined) ||
            enc.valorOriginal;

          if (valNuevo) {
            if (enc.segmentoIndice !== undefined) {
              setValorSegmento(targetP, enc.segmentoIndice, valNuevo);
            } else {
              // Si todo el párrafo era el valor
              setTextoParrafo(targetP, `${enc.etiqueta}: ${valNuevo}`);
            }
          }
        }
      });

      // 2. BLOQUE TEXTOS LIBRES (Diagnóstico y Finalidad)
      onProgress?.('Redactando diagnóstico pedagógico y finalidad institucional...');
      const textosLibres = await generarTextosLibres(plantilla, datos);

      Object.entries(textosLibres).forEach(([nodoId, lineas]) => {
        // Puede ser celda (tX.rY.cZ) o párrafo (pX)
        if (nodoId.includes('.c')) {
          // Celda
          const tcTarget = buscarCeldaPorId(doc, nodoId);
          if (tcTarget) {
            setTextoCelda(tcTarget, lineas);
          }
        } else if (nodoId.startsWith('p')) {
          // Párrafo
          const pIndex = parseInt(nodoId.replace('p', ''), 10);
          const pList = Array.from(doc.querySelectorAll('p'));
          if (pList[pIndex]) {
            setTextoParrafo(pList[pIndex], lineas.join('\n'));
          }
        }
      });

      // 3. BLOQUE TABLAS DE ÁREAS Y ESTRATEGIAS
      const tablasAreas = plantilla.tablas.filter(
        (t) => t.tipo === 'ficha_area' || t.tipo === 'construccion_estrategias' || t.tipo === 'planificacion_diaria'
      );

      for (let i = 0; i < tablasAreas.length; i++) {
        const tblInfo = tablasAreas[i];
        onProgress?.(`Generando contenido curricular para tabla ${tblInfo.titulo || i + 1}...`);

        const tblElem = buscarTablaPorId(doc, tblInfo.id);
        const ejemploTexto = tblElem ? getTextoCompleto(tblElem) : '';

        const areaName = tblInfo.titulo || `Área Curricular ${i + 1}`;
        const areaRes = await generarTablaArea(tblInfo, areaName, datos, ejemploTexto);

        // Llenar celdas identificadas
        Object.entries(areaRes.celdasActualizadas).forEach(([cId, lineas]) => {
          const tc = buscarCeldaPorId(doc, cId);
          if (tc) {
            setTextoCelda(tc, lineas);
          }
        });
      }

      // 4. BLOQUE CRONOGRAMA SEMANAL
      const tablaCronograma = plantilla.tablas.find((t) => t.tipo === 'cronograma');
      if (tablaCronograma) {
        onProgress?.('Elaborando cronograma semanal secuencial...');
        const tblElem = buscarTablaPorId(doc, tablaCronograma.id);
        const ejemploTexto = tblElem ? getTextoCompleto(tblElem) : '';

        const cronoRes = await generarCronograma(tablaCronograma, datos, ejemploTexto);

        if (cronoRes.filas.length > 0 && tablaCronograma.filaPrototipoId) {
          const protoTr = buscarFilaPorId(doc, tablaCronograma.filaPrototipoId);
          if (protoTr) {
            let lastInserted = protoTr;
            // La primera fila generada usa el prototipo
            const primeraFila = cronoRes.filas[0];
            const celdasProto = Array.from(protoTr.querySelectorAll('tc'));
            primeraFila.celdas.forEach((texto, cIdx) => {
              if (celdasProto[cIdx]) {
                setTextoCelda(celdasProto[cIdx], [texto]);
              }
            });

            // Para las siguientes semanas, clonar e insertar
            for (let f = 1; f < cronoRes.filas.length; f++) {
              const filaGen = cronoRes.filas[f];
              const nuevaFila = clonarFila(protoTr);
              const celdasNuevas = Array.from(nuevaFila.querySelectorAll('tc'));
              filaGen.celdas.forEach((texto, cIdx) => {
                if (celdasNuevas[cIdx]) {
                  setTextoCelda(celdasNuevas[cIdx], [texto]);
                }
              });
              insertarFilaDespues(lastInserted, nuevaFila);
              lastInserted = nuevaFila;
            }
          }
        }
      }

      // 5. BLOQUE PLAN DE EVALUACIÓN
      const tablaEvaluacion = plantilla.tablas.find((t) => t.tipo === 'plan_evaluacion');
      if (tablaEvaluacion) {
        onProgress?.('Generando indicadores e instrumentos de evaluación...');
        const tblElem = buscarTablaPorId(doc, tablaEvaluacion.id);
        const ejemploTexto = tblElem ? getTextoCompleto(tblElem) : '';

        const evalRes = await generarPlanEvaluacion(tablaEvaluacion, datos, ejemploTexto);

        if (evalRes.filas.length > 0 && tablaEvaluacion.filaPrototipoId) {
          const protoTr = buscarFilaPorId(doc, tablaEvaluacion.filaPrototipoId);
          if (protoTr) {
            let lastInserted = protoTr;
            const primeraFila = evalRes.filas[0];
            const celdasProto = Array.from(protoTr.querySelectorAll('tc'));
            primeraFila.celdas.forEach((texto, cIdx) => {
              if (celdasProto[cIdx]) {
                setTextoCelda(celdasProto[cIdx], [texto]);
              }
            });

            for (let f = 1; f < evalRes.filas.length; f++) {
              const filaGen = evalRes.filas[f];
              const nuevaFila = clonarFila(protoTr);
              const celdasNuevas = Array.from(nuevaFila.querySelectorAll('tc'));
              filaGen.celdas.forEach((texto, cIdx) => {
                if (celdasNuevas[cIdx]) {
                  setTextoCelda(celdasNuevas[cIdx], [texto]);
                }
              });
              insertarFilaDespues(lastInserted, nuevaFila);
              lastInserted = nuevaFila;
            }
          }
        }
      }

      // 6. SERIALIZAR Y VALIDAR
      onProgress?.('Empaquetando archivo Word final y validando integridad...');
      const finalBlob = await guardarDocx(zip, doc);

      const validacion = await validarDocxClonado(zip, finalBlob);
      if (!validacion.valido) {
        console.warn(`[DocxClone] Intento ${intento} falló validación:`, validacion.errores);
        if (intento === 1) continue; // Reintentar una vez
        return {
          exito: false,
          fallbackRequerido: true,
          mensaje: 'No pude copiar tu Word exacto, aquí está en el formato estándar.',
          detallesValidacion: validacion.errores,
        };
      }

      const tiempoSegundos = Math.round((Date.now() - tStart) / 1000);
      return {
        exito: true,
        blobDocx: finalBlob,
        mensaje: `Copia exacta de Word generada en ${tiempoSegundos} segundos. Mismos logos, orientación y márgenes.`,
        fallbackRequerido: false,
        tiempoSegundos,
      };
    } catch (err: any) {
      console.error(`[DocxClone] Error durante clonación (intento ${intento}):`, err);
      if (intento === 2) {
        return {
          exito: false,
          fallbackRequerido: true,
          mensaje: 'No pude copiar tu Word exacto, aquí está en el formato estándar.',
          detallesValidacion: [err?.message || String(err)],
        };
      }
    }
  }

  return {
    exito: false,
    fallbackRequerido: true,
    mensaje: 'No pude copiar tu Word exacto, aquí está en el formato estándar.',
  };
}

/**
 * Helpers para ubicar nodos en el DOM por ID
 */
function buscarTablaPorId(doc: Document, tId: string): Element | null {
  const tIndex = parseInt(tId.replace('t', ''), 10);
  const tablas = Array.from(doc.getElementsByTagNameNS('http://schemas.openxmlformats.org/wordprocessingml/2006/main', 'tbl'));
  const fallback = tablas.length > 0 ? tablas : Array.from(doc.querySelectorAll('tbl'));
  return fallback[tIndex] || null;
}

function buscarFilaPorId(doc: Document, rId: string): Element | null {
  // rId tiene formato "tX.rY"
  const parts = rId.split('.');
  if (parts.length < 2) return null;
  const tbl = buscarTablaPorId(doc, parts[0]);
  if (!tbl) return null;

  const rIndex = parseInt(parts[1].replace('r', ''), 10);
  const rows = Array.from(tbl.children).filter((c) => (c.localName || c.nodeName.replace(/^.*:/, '')) === 'tr');
  return rows[rIndex] || null;
}

function buscarCeldaPorId(doc: Document, cId: string): Element | null {
  // cId tiene formato "tX.rY.cZ"
  const parts = cId.split('.');
  if (parts.length < 3) return null;
  const tr = buscarFilaPorId(doc, `${parts[0]}.${parts[1]}`);
  if (!tr) return null;

  const cIndex = parseInt(parts[2].replace('c', ''), 10);
  const celdas = Array.from(tr.children).filter((c) => (c.localName || c.nodeName.replace(/^.*:/, '')) === 'tc');
  return celdas[cIndex] || null;
}
