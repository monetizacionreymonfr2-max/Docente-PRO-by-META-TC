import {
  AlignmentType,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx';
import { extraerDuracionSemanas, type DatosProyectoPropuesto } from './contextoProyectoPpa';

type Bloque = { id: string; lineas: string[] };
type RespuestaBloques = { resultados?: Bloque[] };
type Generador = (instruccion: string) => Promise<unknown>;

/** Evita generar documentos o consumir créditos si el docente solo hace una consulta. */
export function solicitaCrearWordPpa(texto: string): boolean {
  const normalizado = texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  return /\b(crea(me|r)?|genera(me|r)?|haz(me)?|elabora(me|r)?|prepara(me|r)?|redacta(me|r)?)\b/.test(normalizado) &&
    /\b(ppa|proyecto|word|documento)\b/.test(normalizado);
}

/** Un borrador propio requiere menos datos que el llenado de un Word institucional. */
export function prepararBorradorPpa(datos: DatosProyectoPropuesto):
  | { listo: false; pregunta: string }
  | { listo: true; semanas: number | null } {
  if (!datos.gradoSeccion?.trim()) return { listo: false, pregunta: '¿Qué grado o grados atiende el grupo?' };
  if (!datos.tema?.trim()) return { listo: false, pregunta: '¿Cuál es el tema central del PPA?' };
  if (!datos.diagnostico?.trim()) return { listo: false, pregunta: '¿Qué necesidades de aprendizaje presenta el grupo?' };
  if (datos.duracion?.trim() && extraerDuracionSemanas(datos.duracion) === null) {
    return { listo: false, pregunta: '¿Cuántas semanas durará el PPA? Encontré una duración que debo confirmar.' };
  }
  return { listo: true, semanas: datos.duracion?.trim() ? extraerDuracionSemanas(datos.duracion) : null };
}

function validarBloques(respuesta: unknown, semanas: number | null): Record<string, string[]> {
  const requeridos = ['finalidad', 'estrategias', 'evaluacion', ...(semanas ? ['cronograma'] : [])];
  const recibido = (respuesta || {}) as RespuestaBloques;
  if (!Array.isArray(recibido.resultados) || recibido.resultados.length !== requeridos.length) {
    throw new Error('Camila no completó las secciones del borrador. No se generó un Word incompleto.');
  }
  const bloques: Record<string, string[]> = {};
  for (const bloque of recibido.resultados) {
    if (!bloque || !requeridos.includes(bloque.id) || Object.hasOwn(bloques, bloque.id) ||
        !Array.isArray(bloque.lineas) || bloque.lineas.length < 1 || bloque.lineas.length > 12 ||
        bloque.lineas.some((linea) => typeof linea !== 'string' || !linea.trim() || linea.length > 2500)) {
      throw new Error('Camila devolvió contenido incompleto o inesperado; no se creó un documento.');
    }
    bloques[bloque.id] = bloque.lineas.map((linea) => linea.trim());
  }
  if (requeridos.some((id) => !bloques[id])) {
    throw new Error('Faltan secciones pedagógicas para generar el Word.');
  }
  if (semanas && (bloques.cronograma.length !== semanas ||
      bloques.cronograma.some((linea, indice) => !new RegExp(`^Semana\\s+${indice + 1}\\s*[:.\\-–]`, 'i').test(linea)))) {
    throw new Error(`El cronograma debe contener exactamente ${semanas} semanas, en orden. No se creó el Word.`);
  }
  return bloques;
}

/**
 * Genera un PPA de referencia descargable sin plantilla institucional.
 * Los datos de identidad son exclusivamente los confirmados en la sesión.
 * Nunca reutiliza logos ni nombres de documentos anteriores.
 */
export async function generarBorradorPpaSinPlantilla(
  datos: DatosProyectoPropuesto,
  generador?: Generador,
): Promise<{ blob: Blob; pendientes: string[] }> {
  const decision = prepararBorradorPpa(datos);
  if (decision.listo === false) throw new Error(decision.pregunta);
  const semanas = decision.semanas;
  const pendientes = [
    ...(!datos.docente?.trim() ? ['Nombre del docente'] : []),
    ...(!datos.institucion?.trim() ? ['Institución educativa'] : []),
    ...(!semanas ? ['Duración y cronograma semanal'] : []),
  ];
  const instruccion = `Cree contenido pedagógico para un BORRADOR PPA de Venezuela; NO es un formato institucional oficial.
Datos explícitos de la conversación: ${JSON.stringify({
    gradoSeccion: datos.gradoSeccion?.trim(), tema: datos.tema?.trim(),
    diagnostico: datos.diagnostico?.trim(), duracion: datos.duracion?.trim() || null,
    matricula: datos.matricula?.trim() || null,
  })}.
Responda JSON con resultados e IDs exactos: finalidad, estrategias, evaluacion${semanas ? ', cronograma' : ''}.
Cada elemento tendrá lineas como lista de textos. Finalidad: 2 párrafos, estrategias: 3 actividades concretas,
evaluacion: 2 criterios e instrumentos formativos, sin inventar normas o contenidos oficiales del MPPE.
${semanas ? `Cronograma: EXACTAMENTE ${semanas} líneas, una por semana y en orden, cada una iniciada por "Semana 1:", "Semana 2:", etc.` : 'NO genere cronograma ni suponga cuántas semanas tendrá el proyecto.'}
Fundamente todo en el diagnóstico dado, sin inventar estudiantes, institución, fechas ni hechos nuevos.
No repita el texto de este prompt como contenido. Las propuestas pedagógicas deben ser claramente sugerencias revisables.`;
  const producir = generador || (async (prompt: string) => {
    const { generarBloquePpaClaude } = await import('../camila/claudeClient');
    return generarBloquePpaClaude('textos', prompt);
  });
  const bloques = validarBloques(await producir(instruccion), semanas);

  const titulo = (texto: string) => new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 230, after: 100 },
    children: [new TextRun({ text: texto, bold: true, color: '000000' })],
  });
  const parrafos = (lineas: string[]) => lineas.map((texto) => new Paragraph({
    spacing: { after: 120 }, children: [new TextRun({ text: texto, size: 21 })],
  }));
  const campo = (nombre: string, valor?: string) => new TableRow({ children: [
    new TableCell({ width: { size: 33, type: WidthType.PERCENTAGE },
      children: [new Paragraph({ children: [new TextRun({ text: nombre, bold: true })] })] }),
    new TableCell({ children: [new Paragraph({ text: valor?.trim() || 'Pendiente por confirmar' })] }),
  ] });
  const cuerpo = [
    new Paragraph({ heading: HeadingLevel.TITLE, alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: 'PROYECTO PEDAGÓGICO DE AULA', bold: true, color: '000000', size: 30 })] }),
    new Paragraph({ alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: 'BORRADOR PARA REVISIÓN DEL DOCENTE — NO ES FORMATO OFICIAL', italics: true, size: 18 })] }),
    new Paragraph({ spacing: { before: 150, after: 200 }, alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: datos.tema!.trim(), bold: true, size: 26 })] }),
    new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [
      campo('Institución', datos.institucion), campo('Docente', datos.docente),
      campo('Grado y sección', datos.gradoSeccion), campo('Duración', datos.duracion),
      ...(datos.matricula?.trim() ? [campo('Matrícula', datos.matricula)] : []),
    ] }),
    titulo('Diagnóstico aportado por el docente'), ...parrafos([datos.diagnostico!.trim()]),
    titulo('Finalidad pedagógica propuesta'), ...parrafos(bloques.finalidad),
    titulo('Estrategias y actividades propuestas'), ...parrafos(bloques.estrategias),
    titulo('Evaluación formativa propuesta'), ...parrafos(bloques.evaluacion),
    titulo('Cronograma semanal'),
    ...parrafos(semanas ? bloques.cronograma : ['Pendiente de confirmar la duración del proyecto.']),
    titulo('Datos por confirmar'),
    ...parrafos(pendientes.length ? pendientes.map((p) => `• ${p}`) : ['Sin datos administrativos pendientes en el borrador.']),
    new Paragraph({ spacing: { before: 200 }, children: [new TextRun({
      text: 'Revise y apruebe el contenido. Si su escuela exige un formato institucional, adjunte ese Word para adaptarlo.',
      italics: true, color: '555555', size: 18,
    })] }),
  ];
  const documento = new Document({ sections: [{ children: cuerpo }] });
  return { blob: await Packer.toBlob(documento), pendientes };
}
