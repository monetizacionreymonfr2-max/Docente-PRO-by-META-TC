import { Type } from '@google/genai';
import { generateContentWithRetry } from '../gemini';
import { GEMINI_FORMATO_MODEL } from '../formatoPrompts';
import {
  CURRICULO_MPPE_2026_2027,
  AREAS_CURRICULARES,
  AreaCurricular,
  GradoPrimaria,
} from '../../data/curriculoMPPE';
import { PlantillaDocx, PlantillaTablaInfo, PlantillaTextoLibre } from './types';

export interface DatosDocenteProyecto {
  institucion?: string;
  docente?: string;
  gradoSeccion: string;
  nivel: string;
  tema: string;
  duracion: string;
  lapsoEjecucion?: string;
  diagnostico: string;
  peic?: string;
  nombrePa?: string;
  matricula?: string;
  turno?: string;
  instruccionesExtra?: string;
  encabezadosPersonalizados?: Record<string, string>; // campoId -> valor
}

export interface BloqueContenidoGenerado {
  // Mapa de celdaId o parrafoId -> lineas de texto a escribir
  celdas: Record<string, string[]>;
  // Nuevas filas a insertar para tablas repetibles (idTabla -> filas con celdas)
  filasTablas?: Record<string, Array<{ celdas: string[] }>>;
}

/**
 * Obtiene información curricular oficial del MPPE para el grado y área especificada
 */
function obtenerCurriculoOficial(gradoStr: string, areaName: string): string {
  const match = gradoStr.match(/([1-6])/);
  const grado: GradoPrimaria = match ? (match[1] as GradoPrimaria) : '3';

  // Buscar coincidencia en áreas oficiales
  const areaKey = AREAS_CURRICULARES.find(
    (a) => a.toLowerCase().includes(areaName.toLowerCase()) || areaName.toLowerCase().includes(a.toLowerCase())
  ) || 'Prácticas del Lenguaje';

  const areaData = CURRICULO_MPPE_2026_2027[areaKey];
  if (!areaData || !areaData.grados[grado]) {
    return 'Lineamientos Generales del Currículo Bolivariano MPPE 2026-2027.';
  }

  const componentes = Object.entries(areaData.grados[grado]);
  let resumen = `ÁREA OFICIAL: ${areaData.nombre} (${grado}° Grado)\n`;
  componentes.forEach(([comp, items]) => {
    resumen += `• COMPONENTE: ${comp}\n`;
    items.slice(0, 3).forEach((it) => {
      resumen += `  - Contenido: ${it.contenido}\n`;
      it.aprendizajesEsperados.slice(0, 2).forEach((ae) => {
        resumen += `    * Aprendizaje: ${ae.texto}\n`;
      });
    });
  });

  return resumen;
}

/**
 * Bloque 1: Generación de textos libres (Diagnóstico pedagógico, Finalidad del PA, Justificación)
 */
export async function generarTextosLibres(
  plantilla: PlantillaDocx,
  datos: DatosDocenteProyecto
): Promise<Record<string, string[]>> {
  if (plantilla.celdasTextoLibre.length === 0) return {};

  const targets = plantilla.celdasTextoLibre.map((tl) => ({
    id: tl.id,
    tipo: tl.tipo,
    ejemploReferencia: tl.textoOriginal.slice(0, 300),
  }));

  const prompt = `Redacta el contenido pedagógico formal para las siguientes secciones de texto libre del Proyecto de Aprendizaje (PA) de Venezuela MPPE 2026-2027:
- TÍTULO DEL PA: ${datos.nombrePa || datos.tema}
- GRADO Y SECCIÓN: ${datos.gradoSeccion} (${datos.nivel})
- DIAGNÓSTICO DOCENTE PROVISTO: ${datos.diagnostico || 'Grupo dinámico con motivación constructiva hacia el aprendizaje.'}
- PROYECTO PEIC INSTITUCIONAL: ${datos.peic || 'Educación integral y soberanía productiva'}
${datos.instruccionesExtra ? `- INSTRUCCIONES EXTRA: ${datos.instruccionesExtra}` : ''}

SECCIONES A REDACTAR (Usa el ejemplo como referencia de estilo, extensión y formalidad; iguálalo o supéralo):
${JSON.stringify(targets, null, 2)}`;

  const schema = {
    type: Type.OBJECT,
    properties: {
      resultados: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            lineas: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ['id', 'lineas'],
        },
      },
    },
    required: ['resultados'],
  };

  const response = await generateContentWithRetry({
    model: GEMINI_FORMATO_MODEL,
    contents: prompt,
    config: {
      systemInstruction: 'Eres Camila, redactora curricular experta del MPPE 2026-2027. Redacta párrafos pedagógicos formales y completos sin resumir.',
      responseMimeType: 'application/json',
      responseSchema: schema,
    },
  });

  const parsed = JSON.parse(response.text?.trim() || '{}');
  const mapa: Record<string, string[]> = {};
  if (Array.isArray(parsed.resultados)) {
    parsed.resultados.forEach((r: any) => {
      mapa[r.id] = Array.isArray(r.lineas) ? r.lineas : [String(r.lineas)];
    });
  }

  return mapa;
}

/**
 * Bloque 2: Generación de contenido para tablas de áreas curriculares o construcción de estrategias
 */
export async function generarTablaArea(
  tabla: PlantillaTablaInfo,
  areaName: string,
  datos: DatosDocenteProyecto,
  ejemploFilas: string
): Promise<{ celdasActualizadas: Record<string, string[]>; filasNuevas?: Array<{ celdas: string[] }> }> {
  const curricularInfo = obtenerCurriculoOficial(datos.gradoSeccion, areaName);

  const prompt = `Genera el contenido pedagógico para la tabla de planificación del ÁREA: ${areaName}.
LINEAMIENTOS MPPE 2026-2027 (Obligatorio extraer componentes, temas y aprendizajes de aquí):
${curricularInfo}

DATOS DEL PROYECTO:
- PA: ${datos.nombrePa || datos.tema}
- Grado y Sección: ${datosDocenteInfo(datos)}
${datos.instruccionesExtra ? `- INSTRUCCIONES ESPECIALES: ${datos.instruccionesExtra}` : ''}

COLUMNAS DE LA TABLA:
${JSON.stringify(tabla.columnas)}

CELDAS A LLENAR (IDs exactos):
${JSON.stringify(tabla.celdasContenidoIds)}

EJEMPLO QUE TRAÍA EL WORD ORIGINAL (Guía de longitud y profundidad pedagógica, igualar o superar):
${ejemploFilas.slice(0, 800)}`;

  const schema = {
    type: Type.OBJECT,
    properties: {
      celdas: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            lineas: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ['id', 'lineas'],
        },
      },
    },
    required: ['celdas'],
  };

  const response = await generateContentWithRetry({
    model: GEMINI_FORMATO_MODEL,
    contents: prompt,
    config: {
      systemInstruction: 'Eres Camila de Docenty PRO. Genera contenido para cada celda de la tabla de área respetando el currículo MPPE.',
      responseMimeType: 'application/json',
      responseSchema: schema,
    },
  });

  const parsed = JSON.parse(response.text?.trim() || '{}');
  const celdasActualizadas: Record<string, string[]> = {};
  if (Array.isArray(parsed.celdas)) {
    parsed.celdas.forEach((c: any) => {
      celdasActualizadas[c.id] = Array.isArray(c.lineas) ? c.lineas : [String(c.lineas)];
    });
  }

  return { celdasActualizadas };
}

/**
 * Bloque 3: Generación de cronograma semanal
 */
export async function generarCronograma(
  tabla: PlantillaTablaInfo,
  datos: DatosDocenteProyecto,
  ejemploFilas: string
): Promise<{ filas: Array<{ celdas: string[] }> }> {
  const numSemanas = datos.duracion.includes('6') ? 6 : datos.duracion.includes('8') ? 8 : 4;

  const prompt = `Genera un CRONOGRAMA SEMANAL pedagógico de ${numSemanas} semanas para el Proyecto de Aprendizaje: "${datos.nombrePa || datos.tema}".
COLUMNAS DE LA TABLA DE CRONOGRAMA:
${JSON.stringify(tabla.columnas)}

EJEMPLO QUE TRAÍA EL WORD ORIGINAL:
${ejemploFilas.slice(0, 500)}

Genera exactamente ${numSemanas} filas (una por cada semana: Semana 1, Semana 2, etc.) con actividades y propósitos secuenciales.`;

  const schema = {
    type: Type.OBJECT,
    properties: {
      filas: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            celdas: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ['celdas'],
        },
      },
    },
    required: ['filas'],
  };

  const response = await generateContentWithRetry({
    model: GEMINI_FORMATO_MODEL,
    contents: prompt,
    config: {
      systemInstruction: 'Eres Camila. Genera las filas del cronograma semanal escolar con actividades detalladas.',
      responseMimeType: 'application/json',
      responseSchema: schema,
    },
  });

  const parsed = JSON.parse(response.text?.trim() || '{}');
  const filas: Array<{ celdas: string[] }> = [];
  if (Array.isArray(parsed.filas)) {
    parsed.filas.forEach((f: any) => {
      if (Array.isArray(f.celdas)) {
        filas.push({ celdas: f.celdas });
      }
    });
  }

  return { filas };
}

/**
 * Bloque 4: Generación de plan de evaluación
 */
export async function generarPlanEvaluacion(
  tabla: PlantillaTablaInfo,
  datos: DatosDocenteProyecto,
  ejemploFilas: string
): Promise<{ filas: Array<{ celdas: string[] }> }> {
  const prompt = `Genera las filas del PLAN DE EVALUACIÓN del Proyecto de Aprendizaje: "${datos.nombrePa || datos.tema}".
COLUMNAS DEL PLAN DE EVALUACIÓN:
${JSON.stringify(tabla.columnas)}

EJEMPLO ORIGINAL:
${ejemploFilas.slice(0, 500)}

Genera una fila por cada una de las 4 áreas académicas oficiales del MPPE (Lenguaje, Matemáticas, Ciencias Naturales e Identidad/Ciencias Sociales) más una fila final transversal socio-productiva.
Incluye: Indicadores de logro precisos, Técnicas (observación, análisis de producción) e Instrumentos (escala de estimación, registro descriptivo).`;

  const schema = {
    type: Type.OBJECT,
    properties: {
      filas: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            celdas: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ['celdas'],
        },
      },
    },
    required: ['filas'],
  };

  const response = await generateContentWithRetry({
    model: GEMINI_FORMATO_MODEL,
    contents: prompt,
    config: {
      systemInstruction: 'Eres Camila. Genera las filas de evaluación formativa del MPPE.',
      responseMimeType: 'application/json',
      responseSchema: schema,
    },
  });

  const parsed = JSON.parse(response.text?.trim() || '{}');
  const filas: Array<{ celdas: string[] }> = [];
  if (Array.isArray(parsed.filas)) {
    parsed.filas.forEach((f: any) => {
      if (Array.isArray(f.celdas)) {
        filas.push({ celdas: f.celdas });
      }
    });
  }

  return { filas };
}

function datosDocenteInfo(datos: DatosDocenteProyecto): string {
  return `${datos.gradoSeccion} | Docente: ${datos.docente || 'Docente'} | Escuela: ${datos.institucion || 'Institución'} | Año: 2026-2027`;
}
