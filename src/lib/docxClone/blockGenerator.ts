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
import { extraerDuracionSemanas } from '../camilaFormato/contextoProyectoPpa';

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

export interface ContextoProyectoBloque {
  tema: string;
  gradoSeccion: string;
  docente?: string;
  institucion?: string;
  duracion?: string;
  diagnosticoGenerado?: string;
  finalidadGenerada?: string;
  instruccionesExtra?: string;
  areasActivas: string[];
  areasExcluidas: string[];
}

/**
 * Prompt base de coherencia temática obligatoria para TODOS los bloques
 */
function construirEncabezadoCoherencia(ctx: ContextoProyectoBloque): string {
  return `--- CONTEXTO PEDAGÓGICO INTEGRAL DEL PROYECTO ---
• TÍTULO DEL PROYECTO: "${ctx.tema}"
• GRADO Y SECCIÓN: "${ctx.gradoSeccion}" (Docente: ${ctx.docente || 'Docente'} | Escuela: ${ctx.institucion || 'Institución'} | MPPE 2026-2027)
${ctx.diagnosticoGenerado ? `• DIAGNÓSTICO PEDAGÓGICO DE BASE:\n${ctx.diagnosticoGenerado}\n` : ''}
${ctx.finalidadGenerada ? `• FINALIDAD INSTITUCIONAL DEL PROYECTO:\n${ctx.finalidadGenerada}\n` : ''}
• ÁREAS DE FORMACIÓN ACTIVAS: ${ctx.areasActivas.join(', ')}
${ctx.areasExcluidas.length > 0 ? `• ÁREAS EXCLUIDAS (PROHIBIDO TOTALMENTE GENERAR CONTENIDO PARA ESTAS ÁREAS): ${ctx.areasExcluidas.join(', ')}` : ''}
${ctx.instruccionesExtra ? `• INSTRUCCIONES ESPECIALES DEL DOCENTE: "${ctx.instruccionesExtra}"` : ''}

REGLA DE COHERENCIA OBLIGATORIA:
El nombre del proyecto es simbólico; no lo interpretes literalmente (por ejemplo 'Gotitas de Amor' no trata del agua). Basa todo en el diagnóstico y la finalidad indicados arriba. NO inventes contenidos de ciencias naturales o agua a menos que el diagnóstico explícitamente lo pida.`;
}

/**
 * Bloque 1: Generación de textos libres (Diagnóstico pedagógico, Finalidad del PA, Justificación)
 */
export async function generarTextosLibres(
  plantilla: PlantillaDocx,
  datos: DatosDocenteProyecto,
  ctx: ContextoProyectoBloque
): Promise<Record<string, string[]>> {
  const targets = plantilla.celdasTextoLibre.map((tl) => ({
    id: tl.id,
    tipo: tl.tipo,
    ejemploReferencia: tl.textoOriginal.slice(0, 300),
  }));

  const prompt = `${construirEncabezadoCoherencia(ctx)}

SECCIONES A REDACTAR (Usa el ejemplo como referencia de estilo, extensión y formalidad; iguálalo o supéralo):
${JSON.stringify(targets, null, 2)}

Redacta párrafos formales, detallados y completos (mínimo 2-3 párrafos sustanciales para Diagnóstico y 2 párrafos para Finalidad) adaptados a ${ctx.gradoSeccion}.`;

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
      systemInstruction: 'Eres Camila, redactora curricular experta del MPPE 2026-2027. Redacta diagnósticos pedagógicos y finalidades institucionales formales, completas y extensas sin resumir.',
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
  ejemploFilas: string,
  ctx: ContextoProyectoBloque
): Promise<{ celdasActualizadas: Record<string, string[]>; filasNuevas?: Array<{ celdas: string[] }> }> {
  const curricularInfo = obtenerCurriculoOficial(datos.gradoSeccion, areaName);

  const prompt = `${construirEncabezadoCoherencia(ctx)}

ÁREA A PLANIFICAR: ${areaName}
CURRÍCULO OFICIAL MPPE (${ctx.gradoSeccion}):
${curricularInfo}

COLUMNAS DE LA TABLA:
${JSON.stringify(tabla.columnas)}

CELDAS A LLENAR (IDs exactos):
${JSON.stringify(tabla.celdasContenidoIds)}

EJEMPLO QUE TRAÍA EL WORD ORIGINAL (Guía de longitud y profundidad pedagógica):
${ejemploFilas.slice(0, 700)}

Genera contenido pedagógico concreto para CADA celda requerida, completamente articulado con el diagnóstico y la finalidad.`;

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
      filasNuevas: {
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
    required: ['celdas'],
  };

  const response = await generateContentWithRetry({
    model: GEMINI_FORMATO_MODEL,
    contents: prompt,
    config: {
      systemInstruction: 'Eres Camila de Docenty PRO. Genera contenido curricular para cada celda de la tabla de área respetando el currículo MPPE y la coherencia del proyecto.',
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

  const filasNuevas: Array<{ celdas: string[] }> = [];
  if (Array.isArray(parsed.filasNuevas)) {
    parsed.filasNuevas.forEach((f: any) => {
      if (Array.isArray(f.celdas)) filasNuevas.push({ celdas: f.celdas });
    });
  }

  return { celdasActualizadas, filasNuevas: filasNuevas.length > 0 ? filasNuevas : undefined };
}

/**
 * Bloque 3: Generación de cronograma semanal
 */
export async function generarCronograma(
  tabla: PlantillaTablaInfo,
  datos: DatosDocenteProyecto,
  ejemploFilas: string,
  ctx: ContextoProyectoBloque
): Promise<{ filas: Array<{ celdas: string[] }> }> {
  const numSemanas = extraerDuracionSemanas(datos.duracion);
  if (numSemanas === null) throw new Error('La duración debe indicar entre 1 y 12 semanas.');

  const prompt = `${construirEncabezadoCoherencia(ctx)}

Genera un CRONOGRAMA SEMANAL pedagógico de exactamente ${numSemanas} semanas para el Proyecto: "${ctx.tema}".
COLUMNAS DE LA TABLA DE CRONOGRAMA:
${JSON.stringify(tabla.columnas)}

EJEMPLO QUE TRAÍA EL WORD ORIGINAL:
${ejemploFilas.slice(0, 500)}

Genera exactamente ${numSemanas} filas secuenciales (Semana 1, Semana 2, Semana 3, Semana 4...).
Las actividades deben desarrollar la lectura, escritura y convivencia del diagnóstico, NUNCA temas ajenos como el agua.`;

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
      systemInstruction: 'Eres Camila. Genera las filas del cronograma semanal escolar respetando la coherencia pedagógica con el diagnóstico.',
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
  ejemploFilas: string,
  ctx: ContextoProyectoBloque
): Promise<{ filas: Array<{ celdas: string[] }> }> {
  // Solo incluir las áreas que estén activas (excluir matemáticas si el usuario pidió sin matemáticas)
  const areasParaEvaluacion = ctx.areasActivas;

  const prompt = `${construirEncabezadoCoherencia(ctx)}

Genera las filas del PLAN DE EVALUACIÓN del Proyecto de Aprendizaje: "${ctx.tema}".
COLUMNAS DEL PLAN DE EVALUACIÓN:
${JSON.stringify(tabla.columnas)}

EJEMPLO ORIGINAL:
${ejemploFilas.slice(0, 500)}

Genera exactamente UNA fila por cada una de las siguientes áreas activas:
${areasParaEvaluacion.map((a, i) => `${i + 1}. ${a}`).join('\n')}
${ctx.areasExcluidas.length > 0 ? `RECUERDA: NO incluyas ninguna fila para las áreas excluidas: ${ctx.areasExcluidas.join(', ')}.` : ''}

Cada fila debe contener: Área, Indicadores de logro precisos de ${ctx.gradoSeccion}, Técnicas e Instrumentos de evaluación formativa acordes a la finalidad del proyecto.`;

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
      systemInstruction: 'Eres Camila. Genera las filas de evaluación formativa del MPPE articuladas con el diagnóstico.',
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
