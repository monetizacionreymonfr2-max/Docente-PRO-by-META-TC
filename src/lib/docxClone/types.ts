/**
 * Tipos y estructuras para el motor de clonación exacta de Word (.docx)
 */

export interface DocxSegmento {
  texto: string;
  negrita: boolean;
  runIndex: number;
}

export interface DocxParrafoNode {
  id: string; // ej: p0, p1
  rawText: string;
  segmentos: DocxSegmento[];
  domNode?: Element;
}

export interface DocxCeldaNode {
  id: string; // ej: t0.r0.c0
  rawText: string;
  lineas: string[];
  gridSpan: number;
  vMerge?: string; // 'restart' | 'continue' | undefined
  domNode?: Element;
}

export interface DocxFilaNode {
  id: string; // ej: t0.r0
  celdas: DocxCeldaNode[];
  isHeader: boolean;
  cantSplit: boolean;
  domNode?: Element;
}

export interface DocxTablaNode {
  id: string; // ej: t0
  filas: DocxFilaNode[];
  domNode?: Element;
}

export interface DocxMapa {
  parrafos: DocxParrafoNode[];
  tablas: DocxTablaNode[];
  resumenCompacto: string; // Versión en texto conciso para alimentar el prompt de Gemini
}

export interface PlantillaEncabezadoCampo {
  id: string; // ej: docente, grado_seccion, ano_escolar, nombre_peic, nombre_pa, lapso, matricula, turno
  etiqueta: string;
  valorOriginal: string;
  parrafoId: string;
  segmentoIndice?: number; // Índice en segmentos[] si es párrafo compuesto
}

export interface PlantillaTablaInfo {
  id: string; // ej: t0, t1
  tipo:
    | 'cronograma'
    | 'planificacion_diaria'
    | 'construccion_estrategias'
    | 'plan_evaluacion'
    | 'ficha_area'
    | 'general';
  titulo?: string;
  filaPrototipoId?: string; // ej: t1.r2
  filasEncabezadoIds: string[]; // ej: ['t1.r0', 't1.r1']
  columnas: string[];
  celdasContenidoIds: string[];
  celdasEtiquetaIds: string[];
}

export interface PlantillaBloqueRepetido {
  id: string;
  tipo: 'area';
  tablasIds: string[];
  prototipoTablaId: string;
  areaNombreDetectada?: string;
}

export interface PlantillaTextoLibre {
  id: string; // celda o párrafo ID
  tipo: 'diagnostico' | 'finalidad' | 'observaciones' | 'general';
  textoOriginal: string;
}

export interface PlantillaDocx {
  encabezados: PlantillaEncabezadoCampo[];
  tablas: PlantillaTablaInfo[];
  bloquesRepetidos: PlantillaBloqueRepetido[];
  celdasTextoLibre: PlantillaTextoLibre[];
  areasDetectadas?: string[];
  lapsoSemanasEstimadas?: number;
}
