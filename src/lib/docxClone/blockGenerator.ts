import { generarBloquePpaClaude } from '../camila/claudeClient';
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
    return 'No hay una referencia curricular local específica para este grado y área. No inventar contenidos oficiales.';
  }

  const componentes = Object.entries(areaData.grados[grado]);
  let resumen = `ÁREA DE REFERENCIA INTERNA: ${areaData.nombre} (${grado}° Grado). Verificar vigencia con el MPPE y las fichas del docente.\n`;
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

function filasValidas(datos: unknown): Array<{ celdas: string[] }> {
  if (!Array.isArray(datos) || !datos.every((fila) =>
    fila && Array.isArray(fila.celdas) && fila.celdas.length > 0 &&
    fila.celdas.every((celda: unknown) => typeof celda === 'string'))) {
    throw new Error('El bloque generado contiene filas inválidas; el Word original permanece intacto.');
  }
  return datos.map((fila) => ({ celdas: fila.celdas }));
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

  if (targets.length === 0) return {};

  const prompt = `${construirEncabezadoCoherencia(ctx)}

SECCIONES A REDACTAR (Usa el ejemplo como referencia de estilo, extensión y formalidad; iguálalo o supéralo):
${JSON.stringify(targets, null, 2)}

Redacta párrafos formales, detallados y completos (mínimo 2-3 párrafos sustanciales para Diagnóstico y 2 párrafos para Finalidad) adaptados a ${ctx.gradoSeccion}.`;

  const parsed = await generarBloquePpaClaude('textos', prompt) as {
    resultados?: Array<{ id: string; lineas: string[] }>;
  };
  const mapa: Record<string, string[]> = {};
  const permitidos = new Set(targets.map((t) => t.id));
  if (!Array.isArray(parsed.resultados)) throw new Error('Camila no devolvió las secciones del PPA.');
  for (const r of parsed.resultados) {
    if (permitidos.has(r.id) && Array.isArray(r.lineas) && r.lineas.every((v) => typeof v === 'string')) {
      mapa[r.id] = r.lineas;
    }
  }

  if (Object.keys(mapa).length !== targets.length) {
    throw new Error('Camila no completó todas las secciones textuales del PPA; el Word original está intacto.');
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
REFERENCIA CURRICULAR INTERNA A VERIFICAR CON EL DOCENTE (${ctx.gradoSeccion}):
${curricularInfo}

COLUMNAS DE LA TABLA:
${JSON.stringify(tabla.columnas)}

CELDAS A LLENAR (IDs exactos):
${JSON.stringify(tabla.celdasContenidoIds)}

EJEMPLO QUE TRAÍA EL WORD ORIGINAL (Guía de longitud y profundidad pedagógica):
${ejemploFilas.slice(0, 700)}

Genera contenido pedagógico concreto para CADA celda requerida, completamente articulado con el diagnóstico y la finalidad.`;

  const parsed = await generarBloquePpaClaude('area', prompt) as {
    celdas?: Array<{ id: string; lineas: string[] }>;
    filasNuevas?: Array<{ celdas: string[] }>;
  };
  const celdasActualizadas: Record<string, string[]> = {};
  const permitidas = new Set(tabla.celdasContenidoIds);
  if (!Array.isArray(parsed.celdas)) throw new Error('Camila no devolvió las celdas del área.');
  for (const celda of parsed.celdas) {
    if (permitidas.has(celda.id) && Array.isArray(celda.lineas) &&
        celda.lineas.every((v) => typeof v === 'string')) {
      celdasActualizadas[celda.id] = celda.lineas;
    }
  }
  if (Object.keys(celdasActualizadas).length !== permitidas.size) {
    throw new Error('Camila omitió celdas del área curricular; no se aplicaron cambios al Word original.');
  }
  const filasNuevas = filasValidas(parsed.filasNuevas);

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

  const parsed = await generarBloquePpaClaude('cronograma', prompt) as { filas?: Array<{ celdas: string[] }> };
  const filas = filasValidas(parsed.filas);
  if (filas.length !== numSemanas) {
    throw new Error(`El cronograma generado tiene ${filas.length} semanas, pero se solicitaron ${numSemanas}.`);
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

  const parsed = await generarBloquePpaClaude('evaluacion', prompt) as { filas?: Array<{ celdas: string[] }> };
  const filas = filasValidas(parsed.filas);
  if (filas.length !== areasParaEvaluacion.length) {
    throw new Error('El plan de evaluación no cubre todas las áreas activas solicitadas.');
  }

  return { filas };
}
