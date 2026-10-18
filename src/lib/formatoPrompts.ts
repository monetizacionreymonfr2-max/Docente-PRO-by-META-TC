import { Type } from '@google/genai';

/**
 * Modelo de Gemini utilizado para Mi Formato (mismo que usa el resto de la app)
 */
export const GEMINI_FORMATO_MODEL = 'gemini-3.1-flash-lite';

/**
 * Schema estricto para la lectura y análisis del formato escolar subido por el docente.
 */
export const FORMATO_ANALISIS_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    tipoDocumento: {
      type: Type.STRING,
      description: 'Clasificacion del documento: PPA, planificacion_diaria, planificacion_semanal o planificacion_mensual',
    },
    orientacion: {
      type: Type.STRING,
      description: 'Orientacion visual de la pagina: vertical u horizontal',
    },
    encabezado: {
      type: Type.OBJECT,
      properties: {
        institucion: { type: Type.STRING, description: 'Nombre exacto de la institucion, escuela o colegio en el membrete' },
        docente: { type: Type.STRING, description: 'Etiqueta o nombre del docente si figura' },
        grado: { type: Type.STRING, description: 'Grado escolar si aparece en el formato' },
        seccion: { type: Type.STRING, description: 'Seccion escolar si aparece' },
        anoEscolar: { type: Type.STRING, description: 'Ano escolar (ej: 2026-2027) si aparece' },
        tituloDocumento: { type: Type.STRING, description: 'Titulo o encabezado principal del formato' },
        subtitulo: { type: Type.STRING, description: 'Subtitulo, circuito escolar o lema institucional' },
      },
      required: ['institucion', 'tituloDocumento'],
    },
    secciones: {
      type: Type.ARRAY,
      description: 'Lista rigurosa de todas las secciones, cuadros y tablas del formato en el orden exacto del original',
      items: {
        type: Type.OBJECT,
        properties: {
          id: {
            type: Type.STRING,
            description: 'Identificador unico en formato snake_case (ej: datos_identificacion, diagnostico, plan_accion)',
          },
          titulo: {
            type: Type.STRING,
            description: 'Titulo EXACTO como aparece en el formato original, sin cambiar mayusculas, palabras ni orden',
          },
          tipo: {
            type: Type.STRING,
            description: 'Tipo estructural de la seccion: campo (dato corto), parrafo (texto libre/narrativo), tabla (cuadro con columnas) o lista (items con vinetas)',
          },
          columnas: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Si el tipo es tabla, la lista exacta de nombres de columnas de izquierda a derecha. Vacio si no es tabla.',
          },
          filasSugeridas: {
            type: Type.INTEGER,
            description: 'Cantidad estimada de filas en la tabla del formato si aplica',
          },
          instruccion: {
            type: Type.STRING,
            description: 'Instruccion pedagogica sobre que contenido debe llenarse en esta seccion',
          },
        },
        required: ['id', 'titulo', 'tipo'],
      },
    },
    estilo: {
      type: Type.OBJECT,
      properties: {
        colorPrincipal: { type: Type.STRING, description: 'Color predominante en hex (ej: #1e3a8a, #047857) de los titulos/tablas' },
        colorSecundario: { type: Type.STRING, description: 'Color de relleno suave o alternativo en hex' },
        fuente: { type: Type.STRING, description: 'Tipo de fuente detectada (Arial, Calibri, Times New Roman, etc.)' },
        bordes: { type: Type.STRING, description: 'Estilo de bordes de las tablas (solido, simple, cuadricula)' },
        piePagina: { type: Type.STRING, description: 'Texto que figure en el pie de pagina si lo hay' },
      },
      required: ['colorPrincipal'],
    },
    resumenPedagogico: {
      type: Type.STRING,
      description: 'Resumen en español claro y conciso de la estructura detectada para que el docente lo revise y confirme.',
    },
  },
  required: ['tipoDocumento', 'orientacion', 'encabezado', 'secciones', 'estilo', 'resumenPedagogico'],
};

/**
 * System Instruction para el análisis de formato.
 */
export const FORMATO_ANALISIS_SYSTEM_INSTRUCTION = `Eres Camila, la especialista en pedagogía escolar de Venezuela de Docenty PRO.
Tu misión es inspeccionar minuciosamente el archivo de formato docente subido (puede ser PDF, Word o foto de documento).
Debes identificar con precisión absoluta:
1. Membrete / Encabezado institucional (Nombre de la escuela, estado, municipio, circuito escolar).
2. Títulos EXACTOS de cada sección. NO cambies, NO resumas, NO traduzcas ni alteres una sola palabra de los títulos.
3. Tipo de cada sección: si es un 'campo' (ej. Nombre del docente, Grado), 'parrafo' (ej. Diagnóstico pedagógico, Propósito general), 'tabla' (cuadro con columnas definidas) o 'lista' (viñetas).
4. Para cada 'tabla', extrae los títulos EXACTOS de cada columna en su orden original de izquierda a derecha.
5. El estilo visual: color dominante de los títulos o cuadros, fuente aproximada y orientación de la hoja (vertical u horizontal).
6. Genera un resumen pedagógico breve y amable para el docente venezolano explicando lo que identificaste.

REGLA DE ORO: Devuelve EXCLUSIVAMENTE el objeto JSON cumpliendo el responseSchema sin texto adicional ni bloques markdown fuera del JSON.`;

/**
 * Schema estricto para la generación de contenido vaciado en el formato.
 */
export const FORMATO_GENERACION_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    secciones: {
      type: Type.ARRAY,
      description: 'Lista de secciones completas con el contenido pedagógico vaciado, en el mismo orden e ids',
      items: {
        type: Type.OBJECT,
        properties: {
          seccionId: { type: Type.STRING, description: 'El id exacto de la seccion del formato' },
          titulo: { type: Type.STRING, description: 'El titulo exacto de la seccion' },
          tipo: { type: Type.STRING, description: 'campo, parrafo, tabla o lista' },
          contenidoTexto: { type: Type.STRING, description: 'Texto narrativo o valor del campo para secciones tipo campo o parrafo' },
          contenidoTabla: {
            type: Type.ARRAY,
            description: 'Matriz de filas para secciones tipo tabla. Cada fila es un arreglo de cadenas con exactamente tantas celdas como columnas tiene la tabla.',
            items: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          contenidoLista: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Items de la lista para secciones tipo lista',
          },
        },
        required: ['seccionId', 'titulo', 'tipo'],
      },
    },
    observacionesPedagogicas: {
      type: Type.STRING,
      description: 'Nota breve de Camila para el docente sobre cómo se adaptó el currículo MPPE 2026-2027 a su formato',
    },
  },
  required: ['secciones'],
};

/**
 * System Instruction para la generación de contenido vaciado en el formato.
 */
export const FORMATO_GENERACION_SYSTEM_INSTRUCTION = `Eres Camila, la asistente pedagógica avanzada de Docenty PRO para el sistema escolar de Venezuela, bajo los lineamientos curriculares oficiales MPPE 2026-2027.
Tu objetivo es redactar todo el contenido pedagógico de una planificación o PPA y vaciarlo EXACTAMENTE dentro de la estructura y tablas del formato escolar provisto por la institución del docente.

NORMAS OBLIGATORIAS:
1. Respeta fielmente la estructura del formato JSON recibido: no agregues ni omitas secciones. Usa los mismos seccionId y títulos.
2. Si una sección es de tipo 'tabla', genera filas bien elaboradas donde cada fila contenga celdas que respondan con rigor pedagógico a las columnas de esa tabla (ej: Área de Formación, Contenido/Eje Temático, Estrategia Didáctica, Recursos, Indicadores de Evaluación, Técnicas e Instrumentos).
3. Si el docente incluye 'instruccionesExtra' (por ejemplo: 'sin inglés ni educación física' o 'énfasis en comprensión lectora'), cúmplelas estrictamente.
4. Aplica el enfoque sociocrítico, de desarrollo integral y pertinencia comunitaria del currículo venezolano MPPE 2026-2027.
5. Vocabulario técnico, docente formal, claro y listo para imprimir y presentar a la coordinación de la escuela.
6. Devuelve EXCLUSIVAMENTE el JSON estructurado.`;
