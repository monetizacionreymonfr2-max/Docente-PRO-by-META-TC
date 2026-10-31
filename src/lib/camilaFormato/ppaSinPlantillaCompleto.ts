import {
  AlignmentType, Document, HeadingLevel, Packer, Paragraph,
  Table, TableCell, TableRow, TextRun, WidthType,
} from 'docx';
import { generarPpaCompletoClaude } from '../camila/claudeClient';
import { type DatosProyectoPropuesto } from './contextoProyectoPpa';
import { type IdentidadPpa, type PpaCompleto, validarPpaCompleto,
  semanasDeCalendario, textoFecha } from './ppaEstructurado';

/** Plantilla propia determinista: sin logotipos, ni datos prestados de otro Word. */
export async function generarPpaSinPlantillaCompleto(
  datos: DatosProyectoPropuesto,
  generador: (instruccion: string) => Promise<unknown> = generarPpaCompletoClaude
): Promise<{ blob: Blob; pendientes: string[] }> {
  const identidad: IdentidadPpa = {
    gradoSeccion: datos.gradoSeccion || '', tema: datos.tema || '',
    diagnostico: datos.diagnostico || '', duracion: datos.duracion || '',
    docente: datos.docente || '', institucion: datos.institucion || '',
    anioEscolar: datos.anioEscolar, fechaInicio: datos.fechaInicio,
    fechaFin: datos.fechaFin, matricula: datos.matricula,
  };
  if (!identidad.gradoSeccion || !identidad.tema || !identidad.diagnostico || !identidad.duracion) {
    throw new Error('Se requieren grado, tema, diagnóstico y duración para el PPA integral.');
  }
  const pendientes = [
    ...(!datos.docente ? ['Nombre de docente'] : []),
    ...(!datos.institucion ? ['Institución'] : []),
    ...(!datos.anioEscolar ? ['Año escolar'] : []),
    ...(!datos.fechaInicio || !datos.fechaFin ? ['Fechas de inicio y cierre'] : []),
  ];
  // La plantilla no es oficial, por lo que los datos administrativos pueden
  // figurar POR CONFIRMAR; jamás se copian de documentos ajenos.
  const prompt = JSON.stringify({
    identidad, areasExcluidas: [], solicitud: 'Genere PPA completo para Word de referencia no oficial.',
    requisitos: 'Una fila por área (Lenguaje, Matemática, Ciencia Tecnología y Sociedad, Ciencias Sociales) en CADA semana, con 8 campos. Todas las semanas exactas. Sin datos inventados.',
  });
  const plan = await generador(prompt) as PpaCompleto;
  const errores = validarPpaCompleto(plan, {
    ...identidad, docente: identidad.docente || 'POR CONFIRMAR',
    institucion: identidad.institucion || 'POR CONFIRMAR',
  });
  if (errores.length) throw new Error(`Camila no entregó un PPA completo: ${errores[0]}`);
  const paragraph = (s: string) => new Paragraph({ spacing:{after:90},
    children:[new TextRun({text:s,size:19})] });
  const heading = (s: string) => new Paragraph({ heading: HeadingLevel.HEADING_2,
    spacing:{before:200,after:110}, children:[new TextRun({text:s,bold:true,size:23})] });
  const row = (key: string, value: string) => new TableRow({children:[
    new TableCell({width:{size:28,type:WidthType.PERCENTAGE},
      children:[new Paragraph({children:[new TextRun({text:key,bold:true,size:18})]})]}),
    new TableCell({children:[paragraph(value || 'Por confirmar')]}),
  ]});
  const table = (fields: Array<[string,string]>) => new Table({
    width:{size:100,type:WidthType.PERCENTAGE},
    rows:fields.map(([k,v])=>row(k,v)),
  });
  const children: Array<Paragraph | Table> = [
    new Paragraph({heading:HeadingLevel.TITLE,alignment:AlignmentType.CENTER,
      children:[new TextRun({text:'PROYECTO PEDAGÓGICO DE AULA (PPA)',bold:true,size:28})]}),
    new Paragraph({alignment:AlignmentType.CENTER,
      children:[new TextRun({text:'BORRADOR PARA REVISIÓN — NO ES FORMATO OFICIAL',italics:true,size:18})]}),
    heading(plan.titulo),
    table([
      ['Institución',identidad.institucion],['Docente',identidad.docente],
      ['Grado y sección',identidad.gradoSeccion],['Año escolar',identidad.anioEscolar || ''],
      ['Duración',identidad.duracion],
      ['Período',identidad.fechaInicio && identidad.fechaFin
        ? `${identidad.fechaInicio} al ${identidad.fechaFin}` : ''],
      ['Título',plan.titulo],['Pregunta generadora',plan.preguntaGeneradora],
      ['Producto final',plan.productoFinal],['Vinculación nacional',plan.vinculacionNacional],
    ]),
    heading('DIAGNÓSTICO'),
    table([
      ['Contexto',plan.contexto],['Necesidades',plan.necesidades],
      ['Potencialidades',plan.potencialidades],['Técnicas e instrumentos',plan.instrumentosDiagnostico],
    ]),
    heading('PROPÓSITOS'),
    table([['General',plan.propositoGeneral],['Específicos',plan.propositosEspecificos]]),
    heading('PARRILLA DE PLANIFICACIÓN'),
  ];
  const rangos=semanasDeCalendario(identidad.fechaInicio,identidad.fechaFin);
  plan.semanas.forEach((semana,i)=>{
    children.push(heading(`SEMANA ${semana.numero} — ${semana.tema}`));
    const fechas=rangos?.[i] ? `${textoFecha(rangos[i].inicio)} al ${textoFecha(rangos[i].fin)}` : 'Fechas por confirmar';
    semana.filas.forEach((fila)=>{
      children.push(table([
        ['Área',fila.area],['Fechas',fechas],['Componentes',fila.componente],
        ['Contenidos',fila.contenidos],['Tejidos temáticos',fila.tejidosTematicos],
        ['Aprendizajes esperados',fila.aprendizajes],['Recursos',fila.recursos],
        ['Indicadores',fila.indicadores],['Técnica e instrumentos',fila.tecnicaInstrumentos],
      ]));
      children.push(paragraph(''));
    });
  });
  children.push(heading('CIERRE DEL PROYECTO'),paragraph(plan.cierre));
  children.push(heading('DATOS POR CONFIRMAR'),...(
    pendientes.length ? pendientes.map(x=>paragraph('• '+x)) : [paragraph('Ninguno')]));
  const doc = new Document({ sections:[{children}]});
  return {blob:await Packer.toBlob(doc),pendientes};
}
