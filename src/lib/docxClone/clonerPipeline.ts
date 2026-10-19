import {
  cargarDocx,
  guardarDocx,
  setTextoParrafo,
  setTextoCelda,
  setValorSegmento,
  setTextoParrafosMultiples,
  clonarFila,
  insertarFilaDespues,
  eliminarFila,
  validarDocxClonado,
  getTextoCompleto,
  buscarParrafoPorId,
  buscarTablaPorId,
  buscarFilaPorId,
  buscarCeldaPorId,
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
 * Edita una COPIA exacta del archivo original byte a byte y sustituye exclusivamente los textos pedagógicos.
 * Cumple estrictamente con:
 * 1. Eliminación total de filas de ejemplo antes de clonar en Cronograma y Evaluación.
 * 2. Vaciado y reintento de celdas de contenido en tablas de áreas y ajuste de filas en estrategias/diaria.
 * 3. Búsqueda de párrafos por ID exclusivamente entre hijos directos de w:body (buscarParrafoPorId).
 * 4. Modificación de encabezados preservando etiquetas y cambiando solo el valor en su run correspondiente.
 * 5. Redacción multi-párrafo para Diagnóstico y Finalidad con eliminación de viejos sobrantes.
 * 6. Validación exhaustiva de conteo de filas, texto residual y ausencia de etiquetas duplicadas.
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
        const targetP = buscarParrafoPorId(doc, enc.parrafoId);

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
            setValorSegmento(targetP, enc.etiqueta || enc.segmentoIndice || 0, valNuevo);
          }
        }
      });

      // 2. BLOQUE TEXTOS LIBRES (Diagnóstico y Finalidad)
      onProgress?.('Redactando diagnóstico pedagógico y finalidad institucional...');
      const textosLibres = await generarTextosLibres(plantilla, datos);

      Object.entries(textosLibres).forEach(([nodoId, lineas]) => {
        if (nodoId.includes('.c')) {
          // Celda
          const tcTarget = buscarCeldaPorId(doc, nodoId);
          if (tcTarget) {
            setTextoCelda(tcTarget, lineas);
          }
        } else if (nodoId.startsWith('p')) {
          // Párrafo directo del cuerpo
          const targetP = buscarParrafoPorId(doc, nodoId);
          if (targetP) {
            const infoTextoLibre = plantilla.celdasTextoLibre.find((tl) => tl.id === nodoId);
            const otrosViejos = plantilla.celdasTextoLibre
              .filter((tl) => tl.id !== nodoId && tl.tipo === infoTextoLibre?.tipo && tl.id.startsWith('p'))
              .map((tl) => buscarParrafoPorId(doc, tl.id))
              .filter(Boolean) as Element[];

            setTextoParrafosMultiples(doc, targetP, lineas, otrosViejos);
          }
        }
      });

      // 3. BLOQUE TABLAS DE ÁREAS Y ESTRATEGIAS
      const tablasAreas = plantilla.tablas.filter(
        (t) => t.tipo === 'ficha_area' || t.tipo === 'construccion_estrategias' || t.tipo === 'planificacion_diaria'
      );

      for (let i = 0; i < tablasAreas.length; i++) {
        const tblInfo = tablasAreas[i];
        onProgress?.(`Generando contenido curricular para ${tblInfo.titulo || `tabla ${i + 1}`}...`);

        const tblElem = buscarTablaPorId(doc, tblInfo.id);
        const ejemploTexto = tblElem ? getTextoCompleto(tblElem) : '';
        const areaName = tblInfo.titulo || `Área Curricular ${i + 1}`;

        let areaRes = await generarTablaArea(tblInfo, areaName, datos, ejemploTexto);

        // Si es Planificación Diaria o Construcción de Estrategias con prototipo de fila, ajustar filas
        if (
          (tblInfo.tipo === 'planificacion_diaria' || tblInfo.tipo === 'construccion_estrategias') &&
          tblElem &&
          tblInfo.filaPrototipoId
        ) {
          const protoTr = buscarFilaPorId(doc, tblInfo.filaPrototipoId);
          if (protoTr) {
            const protoClean = clonarFila(protoTr);
            const allTr = Array.from(tblElem.children).filter(
              (c) => (c.localName || c.nodeName.replace(/^.*:/, '')) === 'tr'
            );
            const headerRows = allTr.filter((tr, rIdx) => {
              const rId = `${tblInfo.id}.r${rIdx}`;
              return (
                tblInfo.filasEncabezadoIds.includes(rId) ||
                tr.getElementsByTagNameNS('http://schemas.openxmlformats.org/wordprocessingml/2006/main', 'tblHeader').length > 0 ||
                tr.querySelector('tblHeader') !== null
              );
            });

            const anchorRow = headerRows.length > 0 ? headerRows[headerRows.length - 1] : allTr[0];

            if (areaRes.filasNuevas && areaRes.filasNuevas.length > 0) {
              const dataRows = allTr.filter((tr) => !headerRows.includes(tr));
              dataRows.forEach((r) => eliminarFila(r));

              let lastInserted = anchorRow;
              areaRes.filasNuevas.forEach((filaGen) => {
                const nuevaTr = clonarFila(protoClean);
                const celdasNuevas = Array.from(nuevaTr.children).filter(
                  (c) => (c.localName || c.nodeName.replace(/^.*:/, '')) === 'tc'
                );
                filaGen.celdas.forEach((txt, cIdx) => {
                  if (celdasNuevas[cIdx]) setTextoCelda(celdasNuevas[cIdx], [txt]);
                });
                insertarFilaDespues(lastInserted, nuevaTr);
                lastInserted = nuevaTr;
              });
            }
          }
        }

        // Aplicar textos devueltos a celdas identificadas
        Object.entries(areaRes.celdasActualizadas).forEach(([cId, lineas]) => {
          const tc = buscarCeldaPorId(doc, cId);
          if (tc) {
            setTextoCelda(tc, lineas);
          }
        });

        // Toda celda de plantilla.celdasContenidoIds debe recibir texto nuevo
        const celdasFaltantes = tblInfo.celdasContenidoIds.filter((cId) => {
          const res = areaRes.celdasActualizadas[cId];
          return !res || res.length === 0 || !res.some((t) => t.trim().length > 0);
        });

        if (celdasFaltantes.length > 0) {
          try {
            const reintento = await generarTablaArea(
              { ...tblInfo, celdasContenidoIds: celdasFaltantes },
              areaName,
              datos,
              ejemploTexto
            );
            Object.entries(reintento.celdasActualizadas).forEach(([cId, lineas]) => {
              if (lineas && lineas.some((t) => t.trim().length > 0)) {
                areaRes.celdasActualizadas[cId] = lineas;
                const tc = buscarCeldaPorId(doc, cId);
                if (tc) setTextoCelda(tc, lineas);
              }
            });
          } catch (retryErr) {
            console.warn('[DocxClone] Falló reintento de celdas faltantes en tabla:', retryErr);
          }

          // Si aún siguen vacías, dejarlas vacías con setTextoCelda(tc, ['']) para no dejar texto residual
          tblInfo.celdasContenidoIds.forEach((cId) => {
            const res = areaRes.celdasActualizadas[cId];
            if (!res || res.length === 0 || !res.some((t) => t.trim().length > 0)) {
              const tc = buscarCeldaPorId(doc, cId);
              if (tc) {
                setTextoCelda(tc, ['']);
              }
            }
          });
        }
      }

      // 4. BLOQUE CRONOGRAMA SEMANAL
      // Regla: antes de clonar, elimina con eliminarFila TODAS las filas de datos de la tabla (conserva las de encabezado)
      // y clona el prototipo N veces. Nunca dejes filas de ejemplo.
      const tablaCronograma = plantilla.tablas.find((t) => t.tipo === 'cronograma');
      let conteoCronoEsperado = 0;
      if (tablaCronograma) {
        onProgress?.('Elaborando cronograma semanal secuencial...');
        const tblElem = buscarTablaPorId(doc, tablaCronograma.id);
        const ejemploTexto = tblElem ? getTextoCompleto(tblElem) : '';

        const cronoRes = await generarCronograma(tablaCronograma, datos, ejemploTexto);

        if (tblElem && tablaCronograma.filaPrototipoId && cronoRes.filas.length > 0) {
          const protoTr = buscarFilaPorId(doc, tablaCronograma.filaPrototipoId);
          if (protoTr) {
            const protoClean = clonarFila(protoTr);

            // Obtener todas las filas de la tabla
            const allTr = Array.from(tblElem.children).filter(
              (c) => (c.localName || c.nodeName.replace(/^.*:/, '')) === 'tr'
            );

            // Identificar filas de encabezado fijas
            const headerRows = allTr.filter((tr, idx) => {
              const rId = `${tablaCronograma.id}.r${idx}`;
              return (
                tablaCronograma.filasEncabezadoIds.includes(rId) ||
                tr.getElementsByTagNameNS('http://schemas.openxmlformats.org/wordprocessingml/2006/main', 'tblHeader').length > 0 ||
                tr.querySelector('tblHeader') !== null
              );
            });

            const anchorRow = headerRows.length > 0 ? headerRows[headerRows.length - 1] : allTr[0];

            // Eliminar con eliminarFila TODAS las filas de datos
            const dataRows = allTr.filter((tr) => !headerRows.includes(tr));
            dataRows.forEach((tr) => eliminarFila(tr));

            // Clonar el prototipo N veces con el contenido nuevo
            let lastInserted = anchorRow;
            for (let f = 0; f < cronoRes.filas.length; f++) {
              const filaGen = cronoRes.filas[f];
              const nuevaFila = clonarFila(protoClean);
              const celdasNuevas = Array.from(nuevaFila.children).filter(
                (c) => (c.localName || c.nodeName.replace(/^.*:/, '')) === 'tc'
              );
              filaGen.celdas.forEach((texto, cIdx) => {
                if (celdasNuevas[cIdx]) {
                  setTextoCelda(celdasNuevas[cIdx], [texto]);
                }
              });
              insertarFilaDespues(lastInserted, nuevaFila);
              lastInserted = nuevaFila;
            }

            conteoCronoEsperado = headerRows.length + cronoRes.filas.length;
          }
        }
      }

      // 5. BLOQUE PLAN DE EVALUACIÓN
      // Regla: antes de clonar, elimina con eliminarFila TODAS las filas de datos de la tabla (conserva las de encabezado)
      // y clona el prototipo N veces. Nunca dejes filas de ejemplo.
      const tablaEvaluacion = plantilla.tablas.find((t) => t.tipo === 'plan_evaluacion');
      let conteoEvalEsperado = 0;
      if (tablaEvaluacion) {
        onProgress?.('Generando indicadores e instrumentos de evaluación...');
        const tblElem = buscarTablaPorId(doc, tablaEvaluacion.id);
        const ejemploTexto = tblElem ? getTextoCompleto(tblElem) : '';

        const evalRes = await generarPlanEvaluacion(tablaEvaluacion, datos, ejemploTexto);

        if (tblElem && tablaEvaluacion.filaPrototipoId && evalRes.filas.length > 0) {
          const protoTr = buscarFilaPorId(doc, tablaEvaluacion.filaPrototipoId);
          if (protoTr) {
            const protoClean = clonarFila(protoTr);

            const allTr = Array.from(tblElem.children).filter(
              (c) => (c.localName || c.nodeName.replace(/^.*:/, '')) === 'tr'
            );

            const headerRows = allTr.filter((tr, idx) => {
              const rId = `${tablaEvaluacion.id}.r${idx}`;
              return (
                tablaEvaluacion.filasEncabezadoIds.includes(rId) ||
                tr.getElementsByTagNameNS('http://schemas.openxmlformats.org/wordprocessingml/2006/main', 'tblHeader').length > 0 ||
                tr.querySelector('tblHeader') !== null
              );
            });

            const anchorRow = headerRows.length > 0 ? headerRows[headerRows.length - 1] : allTr[0];

            // Eliminar con eliminarFila TODAS las filas de datos
            const dataRows = allTr.filter((tr) => !headerRows.includes(tr));
            dataRows.forEach((tr) => eliminarFila(tr));

            // Clonar el prototipo N veces
            let lastInserted = anchorRow;
            for (let f = 0; f < evalRes.filas.length; f++) {
              const filaGen = evalRes.filas[f];
              const nuevaFila = clonarFila(protoClean);
              const celdasNuevas = Array.from(nuevaFila.children).filter(
                (c) => (c.localName || c.nodeName.replace(/^.*:/, '')) === 'tc'
              );
              filaGen.celdas.forEach((texto, cIdx) => {
                if (celdasNuevas[cIdx]) {
                  setTextoCelda(celdasNuevas[cIdx], [texto]);
                }
              });
              insertarFilaDespues(lastInserted, nuevaFila);
              lastInserted = nuevaFila;
            }

            conteoEvalEsperado = headerRows.length + evalRes.filas.length;
          }
        }
      }

      // 6. SERIALIZAR Y VALIDAR
      onProgress?.('Empaquetando archivo Word final y validando integridad...');
      const finalBlob = await guardarDocx(zip, doc);

      // Conteos de filas esperadas
      const conteoEsperadoFilas: Record<string, number> = {};
      if (tablaCronograma && conteoCronoEsperado > 0) {
        conteoEsperadoFilas[tablaCronograma.id] = conteoCronoEsperado;
      }
      if (tablaEvaluacion && conteoEvalEsperado > 0) {
        conteoEsperadoFilas[tablaEvaluacion.id] = conteoEvalEsperado;
      }

      // Textos originales para verificación de texto residual
      const textosOriginalesContenido: string[] = [];
      plantilla.celdasTextoLibre.forEach((tl) => {
        if (tl.textoOriginal && tl.textoOriginal.length > 15) {
          textosOriginalesContenido.push(tl.textoOriginal);
        }
      });

      const membreteYEtiquetas: string[] = [
        datos.institucion || '',
        datos.docente || '',
        datos.gradoSeccion || '',
        datos.tema || '',
        datos.peic || '',
        ...plantilla.encabezados.map((e) => e.etiqueta),
        ...plantilla.tablas.flatMap((t) => t.columnas),
      ];

      const validacion = await validarDocxClonado(zip, finalBlob, {
        plantilla,
        conteoEsperadoFilas,
        textosOriginalesContenido,
        membreteYEtiquetas,
      });

      if (!validacion.valido) {
        console.warn(`[DocxClone] Intento ${intento} falló validación:`, validacion.errores);
        if (intento === 1) {
          onProgress?.('Ajustando formato y reintentando...');
          continue; // Reintentar una vez
        }
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
