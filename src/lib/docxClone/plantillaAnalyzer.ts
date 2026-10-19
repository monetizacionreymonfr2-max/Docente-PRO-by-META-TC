import { Type } from '@google/genai';
import { generateContentWithRetry } from '../gemini';
import { GEMINI_FORMATO_MODEL } from '../formatoPrompts';
import { DocxMapa, PlantillaDocx } from './types';

const PLANTILLA_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    encabezados: {
      type: Type.ARRAY,
      description: 'Campos de identificación institucional (docente, grado, sección, PEIC, nombre del PA, año escolar, turno, matrícula, etc.)',
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING, description: 'Clave identificadora snake_case (ej: docente, grado_seccion, ano_escolar, nombre_pa, nombre_peic, lapso, matricula, turno)' },
          etiqueta: { type: Type.STRING, description: 'Texto de la etiqueta literal (ej: "DOCENTE:", "GRADO Y SECCIÓN:")' },
          valorOriginal: { type: Type.STRING, description: 'El valor de ejemplo que traía el Word' },
          parrafoId: { type: Type.STRING, description: 'ID del párrafo (ej: p2, p3)' },
          segmentoIndice: { type: Type.INTEGER, description: 'Índice del segmento que contiene el valor editable (0, 1, 2...)' },
        },
        required: ['id', 'etiqueta', 'valorOriginal', 'parrafoId'],
      },
    },
    tablas: {
      type: Type.ARRAY,
      description: 'Clasificación de cada tabla del documento',
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING, description: 'ID de la tabla (ej: t0, t1, t2)' },
          tipo: {
            type: Type.STRING,
            description: 'cronograma, planificacion_diaria, construccion_estrategias, plan_evaluacion, ficha_area, general',
          },
          titulo: { type: Type.STRING, description: 'Título o propósito de la tabla' },
          filaPrototipoId: { type: Type.STRING, description: 'ID de la fila modelo a clonar (ej: t1.r2)' },
          filasEncabezadoIds: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'IDs de las filas que son encabezados fijos (ej: ["t1.r0", "t1.r1"])',
          },
          columnas: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Nombres de las columnas detectadas',
          },
          celdasContenidoIds: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'IDs de las celdas que contienen texto a sustituir',
          },
          celdasEtiquetaIds: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'IDs de las celdas con títulos/etiquetas fijas a preservar',
          },
        },
        required: ['id', 'tipo', 'filasEncabezadoIds', 'columnas', 'celdasContenidoIds'],
      },
    },
    bloquesRepetidos: {
      type: Type.ARRAY,
      description: 'Bloques de tablas que se repiten por cada área de formación (ej: fichas curriculares)',
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING, description: 'ID único del bloque' },
          tipo: { type: Type.STRING, description: 'area' },
          tablasIds: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'IDs de las tablas que pertenecen a este bloque',
          },
          prototipoTablaId: { type: Type.STRING, description: 'ID de la tabla modelo a clonar para otras áreas' },
          areaNombreDetectada: { type: Type.STRING, description: 'Nombre del área que ejemplificaba (ej: Lengua y Comunicación)' },
        },
        required: ['id', 'tipo', 'tablasIds', 'prototipoTablaId'],
      },
    },
    celdasTextoLibre: {
      type: Type.ARRAY,
      description: 'Párrafos o celdas de redacción continua (Diagnóstico pedagógico, Finalidad, Justificación, etc.)',
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING, description: 'ID del párrafo o de la celda (ej: p10 o t0.r1.c0)' },
          tipo: { type: Type.STRING, description: 'diagnostico, finalidad, observaciones, general' },
          textoOriginal: { type: Type.STRING, description: 'Texto original de ejemplo que traía la plantilla' },
        },
        required: ['id', 'tipo', 'textoOriginal'],
      },
    },
  },
  required: ['encabezados', 'tablas', 'bloquesRepetidos', 'celdasTextoLibre'],
};

const SYSTEM_INSTRUCTION = `Eres el Analizador Estructural de Plantillas Word (.docx) de Docenty PRO para educación venezolana (MPPE 2026-2027).
Se te proporciona el MAPA en texto compacto de un documento Word oficial.
Tu misión es inspeccionar minuciosamente el mapa y clasificar:
1. Campos de encabezado (Docente, Grado, Sección, Año Escolar, Nombre del PEIC, Nombre del PA, Lapso, Turno, Matrícula). Indica el ID del párrafo (pX) y el segmento del valor.
2. Celdas ETIQUETA fijas (conservar siempre) vs Celdas CONTENIDO (que deben rellenarse con la planificación).
3. Tablas de filas repetibles: Cronograma (por semanas), Planificación diaria (por área), Plan de evaluación (por área), Fichas por área. Identifica la fila prototipo (modelo a clonar) y las filas de encabezado fijas.
4. Bloques repetidos por área de formación.
5. Celdas de texto libre (Diagnóstico, Finalidad, Observaciones).

REGLA CRÍTICA: TODOS los IDs que devuelvas (pX, tX, tX.rY, tX.rY.cZ) DEBEN existir exactamente en el mapa proporcionado.
Devuelve EXCLUSIVAMENTE el JSON con el responseSchema.`;

/**
 * Valida que todos los IDs devueltos por Gemini existan efectivamente en el mapa
 */
function validarIdsEnMapa(plantilla: PlantillaDocx, mapa: DocxMapa): { valido: boolean; idsFaltantes: string[] } {
  const idsExistentes = new Set<string>();

  mapa.parrafos.forEach((p) => idsExistentes.add(p.id));
  mapa.tablas.forEach((t) => {
    idsExistentes.add(t.id);
    t.filas.forEach((f) => {
      idsExistentes.add(f.id);
      f.celdas.forEach((c) => idsExistentes.add(c.id));
    });
  });

  const idsFaltantes: string[] = [];

  // Validar encabezados
  plantilla.encabezados.forEach((enc) => {
    if (!idsExistentes.has(enc.parrafoId)) {
      idsFaltantes.push(`encabezado.${enc.id} -> ${enc.parrafoId}`);
    }
  });

  // Validar tablas
  plantilla.tablas.forEach((tbl) => {
    if (!idsExistentes.has(tbl.id)) {
      idsFaltantes.push(`tabla.${tbl.id}`);
    }
    if (tbl.filaPrototipoId && !idsExistentes.has(tbl.filaPrototipoId)) {
      idsFaltantes.push(`tabla.${tbl.id}.filaPrototipo -> ${tbl.filaPrototipoId}`);
    }
  });

  return {
    valido: idsFaltantes.length === 0,
    idsFaltantes,
  };
}

/**
 * Analiza la plantilla docx mediante su mapa compacto una sola vez
 */
export async function analizarPlantillaDocx(mapa: DocxMapa): Promise<PlantillaDocx> {
  const prompt = `Analiza la estructura de este documento Word oficial de planificación docente en Venezuela.

--- MAPA COMPACTO DEL DOCUMENTO (PÁRRAFOS Y TABLAS CON SUS IDS) ---
${mapa.resumenCompacto}

Identifica con máxima precisión:
- Campos de membrete y datos de identificación.
- Tablas y cuáles filas son encabezados vs cuáles son filas prototipo de contenido.
- Celdas etiqueta vs celdas de contenido.
- Celdas de texto libre (Diagnóstico, Finalidad, etc.).`;

  let lastPlantilla: PlantillaDocx | null = null;

  for (let intento = 0; intento < 2; intento++) {
    try {
      const response = await generateContentWithRetry({
        model: GEMINI_FORMATO_MODEL,
        contents: intento === 0 ? prompt : prompt + `\n\nATENCIÓN: Asegúrate de que todos los IDs existan exactamente en el mapa (ej: p0, t0.r0.c0).`,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseMimeType: 'application/json',
          responseSchema: PLANTILLA_SCHEMA,
        },
      });

      const parsed: PlantillaDocx = JSON.parse(response.text?.trim() || '{}');
      const validacion = validarIdsEnMapa(parsed, mapa);

      if (validacion.valido) {
        return parsed;
      }

      console.warn(`[DocxClone] Intento ${intento + 1}: IDs no encontrados en mapa:`, validacion.idsFaltantes);
      lastPlantilla = parsed;
    } catch (e) {
      console.error(`[DocxClone] Error en análisis de plantilla (intento ${intento + 1}):`, e);
      if (intento === 1) throw e;
    }
  }

  // Si después del reintento hay plantilla, se sanean los IDs que no coincidan
  if (lastPlantilla) {
    const idsValidos = new Set<string>();
    mapa.parrafos.forEach((p) => idsValidos.add(p.id));
    mapa.tablas.forEach((t) => {
      idsValidos.add(t.id);
      t.filas.forEach((f) => {
        idsValidos.add(f.id);
        f.celdas.forEach((c) => idsValidos.add(c.id));
      });
    });

    lastPlantilla.encabezados = lastPlantilla.encabezados.filter((e) => idsValidos.has(e.parrafoId));
    lastPlantilla.tablas = lastPlantilla.tablas.filter((t) => idsValidos.has(t.id));
    return lastPlantilla;
  }

  throw new Error('No se pudo generar una plantilla válida del documento Word.');
}
