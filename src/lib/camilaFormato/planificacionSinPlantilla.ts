import {
  AlignmentType, Document, HeadingLevel, Packer, Paragraph,
  Table, TableCell, TableRow, TextRun, WidthType,
} from 'docx';
import { generarBloquePpaClaude } from '../camila/geminiFormatoClient';
import type { DatosProyectoPropuesto } from './contextoProyectoPpa';

export type PeriodoPlanificacion = 'diaria' | 'semanal' | 'quincenal' | 'mensual';

const PERIODOS: Record<PeriodoPlanificacion, { nombre: string; etapas: number; unidad: 'Día' | 'Semana' }> = {
  diaria: { nombre: 'DIARIA', etapas: 1, unidad: 'Día' },
  semanal: { nombre: 'SEMANAL', etapas: 5, unidad: 'Día' },
  quincenal: { nombre: 'QUINCENAL', etapas: 10, unidad: 'Día' },
  mensual: { nombre: 'MENSUAL', etapas: 4, unidad: 'Semana' },
};
const BLOQUES = [
  'proposito', 'inicio', 'desarrollo', 'cierre',
  'recursos', 'evaluacion', 'indicadores', 'secuencia',
] as const;
type ClaveBloque = typeof BLOQUES[number];

export function detectarCreacionPlanificacion(texto: string): PeriodoPlanificacion | 'sin_periodo' | null {
  const normal = texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const accion = /\b(crea(?:r|me)?|genera(?:r|me)?|elabora(?:r|me)?|haz(?:me)?|prepara(?:r|me)?|redacta(?:r|me)?)\b/.test(normal);
  const objeto = /\b(planificacion|planificaciones|plan de clase|plan de clases)\b/.test(normal);
  if (!accion || !objeto) return null;
  // No atribuir una periodicidad que el docente no indicó.
  if (/\b(quincenal|quincena|dos semanas)\b/.test(normal)) return 'quincenal';
  if (/\b(mensual|mes)\b/.test(normal)) return 'mensual';
  if (/\b(semanal|semana)\b/.test(normal)) return 'semanal';
  if (/\b(diaria|diario|del dia|de hoy)\b/.test(normal)) return 'diaria';
  return 'sin_periodo';
}

export function prepararPlanificacion(datos: DatosProyectoPropuesto, periodo: PeriodoPlanificacion):
  | { listo: false; pregunta: string }
  | { listo: true } {
  if (!PERIODOS[periodo]) throw new Error('Periodicidad de planificación no reconocida.');
  if (!datos.gradoSeccion?.trim()) return { listo: false, pregunta: '¿Qué grado y sección atiende?' };
  if (!datos.tema?.trim()) return { listo: false, pregunta: '¿Cuál es el contenido o tema de la planificación?' };
  if (!datos.diagnostico?.trim()) return { listo: false, pregunta: '¿Qué conocimientos previos o necesidades tiene el grupo sobre ese tema?' };
  return { listo: true };
}

function validarSecciones(valor: unknown, periodo: PeriodoPlanificacion): Record<ClaveBloque, string[]> {
  if (!valor || typeof valor !== 'object') throw new Error('Camila no pudo estructurar la planificación.');
  const resultados = (valor as { resultados?: unknown }).resultados;
  if (!Array.isArray(resultados) || resultados.length !== BLOQUES.length) {
    throw new Error('La planificación está incompleta; no se creó ningún documento.');
  }
  const recibidas: Partial<Record<ClaveBloque, string[]>> = {};
  for (const item of resultados) {
    const bloque = item as { id?: unknown; lineas?: unknown };
    if (typeof bloque?.id !== 'string' || !BLOQUES.includes(bloque.id as ClaveBloque) ||
        Object.hasOwn(recibidas, bloque.id) || !Array.isArray(bloque.lineas) ||
        bloque.lineas.length < 1 || bloque.lineas.length > 16 ||
        bloque.lineas.some((l: unknown) => typeof l !== 'string' || !l.trim() || l.length > 2000)) {
      throw new Error('Camila entregó apartados incorrectos; el Word original permanece intacto.');
    }
    recibidas[bloque.id as ClaveBloque] = bloque.lineas.map((l: string) => l.trim());
  }
  if (BLOQUES.some((k) => !recibidas[k])) throw new Error('Faltan apartados esenciales de la planificación.');
  const { unidad, etapas } = PERIODOS[periodo];
  const pasos = recibidas.secuencia!;
  if (pasos.length !== etapas ||
      pasos.some((linea, i) => !new RegExp('^' + unidad + '\\s+' + (i + 1) + '\\s*[:.\\-–]', 'i').test(linea))) {
    throw new Error('La secuencia pedagógica no coincide con la periodicidad solicitada.');
  }
  return recibidas as Record<ClaveBloque, string[]>;
}

/** Crea un Word de referencia no oficial; los datos del docente se obtienen solo del contexto confirmado. */
export async function generarPlanificacionSinPlantilla(
  datos: DatosProyectoPropuesto,
  periodo: PeriodoPlanificacion,
  generador: (prompt: string) => Promise<unknown> =
    (prompt) => generarBloquePpaClaude('textos', prompt),
): Promise<{ blob: Blob; pendientes: string[] }> {
  const estado = prepararPlanificacion(datos, periodo);
  if (estado.listo === false) throw new Error(estado.pregunta);
  const { nombre, unidad, etapas } = PERIODOS[periodo];
  const pendientes = [
    ...(!datos.institucion?.trim() ? ['Institución'] : []),
    ...(!datos.docente?.trim() ? ['Docente'] : []),
    ...(!datos.anioEscolar?.trim() ? ['Año escolar'] : []),
    ...(!datos.fechaInicio?.trim() ? ['Fecha de inicio'] : []),
  ];
  const prompt = JSON.stringify({
    tarea: 'Crear un BORRADOR de planificación pedagógica venezolana, no un formato oficial',
    periodicidad: nombre, unidad, etapas,
    gradoSeccion: datos.gradoSeccion, tema: datos.tema, diagnostico: datos.diagnostico,
    restricciones: [
      'No inventar nombres de estudiantes, escuela, fechas ni citas del MPPE',
      'Redactar estrategias concretas y pertinentes a la edad y al diagnóstico',
      'No afirmar que una propuesta fue validada oficialmente',
      'Responder JSON con resultados: lista de 8 elementos, cada uno {id, lineas}',
      'IDs y orden exactos: ' + BLOQUES.join(', '),
      'proposito: 1 o 2 líneas; inicio: 2; desarrollo: 3 a 6; cierre: 2',
      'recursos: 2 a 4; evaluacion: 2 a 4; indicadores: 3 a 6',
      'secuencia: EXACTAMENTE ' + etapas + ' líneas, en orden, cada una iniciada por "' + unidad + ' 1:", "' + unidad + ' 2:", etc',
      'Solo sugerencias pedagógicas; no inventar logros reales del grupo',
    ],
  });
  const secciones = validarSecciones(await generador(prompt), periodo);
  const parrafo = (texto: string) => new Paragraph({
    spacing: { after: 110 }, children: [new TextRun({ text: texto, size: 21 })],
  });
  const titulo = (texto: string) => new Paragraph({
    heading: HeadingLevel.HEADING_2, spacing: { before: 175, after: 100 },
    children: [new TextRun({ text: texto, bold: true, size: 24 })],
  });
  const campo = (etiqueta: string, valor?: string) => new TableRow({ children: [
    new TableCell({ width: { size: 30, type: WidthType.PERCENTAGE },
      children: [parrafo(etiqueta)] }),
    new TableCell({ children: [parrafo(valor?.trim() || 'Por confirmar')] }),
  ] });
  const cuerpo: Array<Paragraph | Table> = [
    new Paragraph({
      heading: HeadingLevel.TITLE, alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: 'PLANIFICACIÓN ' + nombre, bold: true, size: 30 })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: 'BORRADOR DE APOYO — NO ES FORMATO OFICIAL', italics: true, size: 18 })],
    }),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        campo('Institución', datos.institucion), campo('Docente', datos.docente),
        campo('Grado y sección', datos.gradoSeccion), campo('Tema', datos.tema),
        campo('Año escolar', datos.anioEscolar), campo('Fecha de inicio', datos.fechaInicio),
      ],
    }),
    titulo('Diagnóstico aportado'), parrafo(datos.diagnostico!.trim()),
    titulo('Propósito de aprendizaje'), ...secciones.proposito.map(parrafo),
    titulo('Inicio'), ...secciones.inicio.map(parrafo),
    titulo('Desarrollo'), ...secciones.desarrollo.map(parrafo),
    titulo('Cierre'), ...secciones.cierre.map(parrafo),
    titulo('Recursos'), ...secciones.recursos.map(parrafo),
    titulo('Estrategias e instrumentos de evaluación'), ...secciones.evaluacion.map(parrafo),
    titulo('Indicadores de aprendizaje'), ...secciones.indicadores.map(parrafo),
    titulo(periodo === 'mensual' ? 'Secuencia por semanas' : 'Secuencia de actividades'),
    ...secciones.secuencia.map(parrafo),
    titulo('Datos por confirmar'),
    ...(pendientes.length ? pendientes : ['Ninguno']).map((dato) => parrafo('• ' + dato)),
  ];
  const documento = new Document({ sections: [{ children: cuerpo }] });
  return { blob: await Packer.toBlob(documento), pendientes };
}
