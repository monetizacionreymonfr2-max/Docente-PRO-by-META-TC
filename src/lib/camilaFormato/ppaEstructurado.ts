/**
 * Contrato único entre Claude y el renderizador DOCX. El modelo entrega datos,
 * NUNCA XML ni una colección arbitraria de cambios para un PPA completo.
 * Los documentos originales se usan SOLO como estructura y se conservan.
 */
export interface FilaPpa {
  area: string;
  componente: string;
  contenidos: string;
  tejidosTematicos: string;
  aprendizajes: string;
  recursos: string;
  indicadores: string;
  tecnicaInstrumentos: string;
}
export interface SemanaPpa {
  numero: number;
  tema: string;
  filas: FilaPpa[];
}
export interface PpaCompleto {
  titulo: string;
  preguntaGeneradora: string;
  productoFinal: string;
  vinculacionNacional: string;
  contexto: string;
  necesidades: string;
  potencialidades: string;
  instrumentosDiagnostico: string;
  propositoGeneral: string;
  propositosEspecificos: string;
  semanas: SemanaPpa[];
  cierre: string;
}
export interface IdentidadPpa {
  gradoSeccion: string;
  tema: string;
  diagnostico: string;
  duracion: string;
  docente: string;
  institucion: string;
  anioEscolar?: string;
  fechaInicio?: string;
  fechaFin?: string;
  matricula?: string;
}
const CAMPOS_FILA: Array<keyof FilaPpa> = [
  'area', 'componente', 'contenidos', 'tejidosTematicos',
  'aprendizajes', 'recursos', 'indicadores', 'tecnicaInstrumentos',
];
const CAMPOS_TEXTO: Array<keyof Omit<PpaCompleto, 'semanas'>> = [
  'titulo', 'preguntaGeneradora', 'productoFinal', 'vinculacionNacional',
  'contexto', 'necesidades', 'potencialidades', 'instrumentosDiagnostico',
  'propositoGeneral', 'propositosEspecificos', 'cierre',
];
const normalizar = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
export function fechaDesdeDato(texto?: string): Date | null {
  if (!texto) return null;
  const t = texto.trim();
  let y: number, m: number, d: number;
  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(t);
  const lat = /^(\d{1,2})[-/](\d{1,2})[-/](\d{2}|\d{4})$/.exec(t);
  if (iso) { y = +iso[1]; m = +iso[2]; d = +iso[3]; }
  else if (lat) { d = +lat[1]; m = +lat[2]; y = +lat[3]; if (y < 100) y += 2000; }
  else return null;
  const z = new Date(Date.UTC(y, m - 1, d));
  return z.getUTCFullYear() === y && z.getUTCMonth() === m - 1 && z.getUTCDate() === d ? z : null;
}
function agregarDias(fecha: Date, dias: number): Date {
  return new Date(fecha.getTime() + dias * 86400000);
}
export function semanasDeCalendario(inicio?: string, fin?: string): Array<{ inicio: Date; fin: Date }> | null {
  const a = fechaDesdeDato(inicio), b = fechaDesdeDato(fin);
  if (!a || !b || b < a) return null;
  const resultado: Array<{ inicio: Date; fin: Date }> = [];
  for (let cursor = a; cursor <= b; ) {
    const domingo = agregarDias(cursor, (7 - cursor.getUTCDay()) % 7);
    const ultimo = domingo > b ? b : domingo;
    resultado.push({ inicio: cursor, fin: ultimo });
    cursor = agregarDias(ultimo, 1);
    if (resultado.length > 12) return null;
  }
  return resultado;
}
export function textoFecha(date: Date): string {
  return [String(date.getUTCDate()).padStart(2, '0'),
    String(date.getUTCMonth() + 1).padStart(2, '0'), String(date.getUTCFullYear()).slice(-2)].join('-');
}
export function semanasSolicitadas(duracion: string): number | null {
  const m = /\b(\d{1,2})\s*semanas?\b/i.exec(duracion);
  const n = m ? +m[1] : NaN;
  return Number.isInteger(n) && n >= 1 && n <= 12 ? n : null;
}
export function validarPpaCompleto(plan: PpaCompleto, identidad: IdentidadPpa, areasExcluidas: string[] = []): string[] {
  const errores: string[] = [];
  if (!plan || typeof plan !== 'object') return ['Claude no devolvió el PPA estructurado.'];
  for (const campo of CAMPOS_TEXTO) {
    if (typeof plan[campo] !== 'string' || !plan[campo].trim()) errores.push(`Campo incompleto: ${campo}.`);
  }
  const total = semanasSolicitadas(identidad.duracion);
  if (!total) errores.push('La duración confirmada no indica semanas válidas.');
  if (!Array.isArray(plan.semanas) || plan.semanas.length !== total) {
    errores.push(`Se pidieron ${total || '?'} semanas, pero Claude no generó exactamente esa cantidad.`);
    return errores;
  }
  const fechas = semanasDeCalendario(identidad.fechaInicio, identidad.fechaFin);
  if ((identidad.fechaInicio || identidad.fechaFin) && !fechas) errores.push('Las fechas confirmadas son inválidas.');
  if (fechas && fechas.length !== total) errores.push(
    `Las fechas abarcan ${fechas.length} semanas de calendario, pero se indicó ${total}.`);
  plan.semanas.forEach((semana, i) => {
    if (!semana || semana.numero !== i + 1 || typeof semana.tema !== 'string' || !semana.tema.trim()) {
      errores.push(`La semana ${i + 1} no tiene número y tema coherentes.`);
    }
    if (!Array.isArray(semana?.filas) || semana.filas.length < 1 || semana.filas.length > 8) {
      errores.push(`La semana ${i + 1} no contiene entre 1 y 8 áreas de planificación.`);
      return;
    }
    const usadas = new Set<string>();
    semana.filas.forEach((fila, j) => {
      for (const campo of CAMPOS_FILA) {
        if (typeof fila?.[campo] !== 'string' || !fila[campo].trim()) {
          errores.push(`Semana ${i + 1}, fila ${j + 1}: falta ${campo}.`);
        }
      }
      const area = normalizar(fila?.area || '');
      if (usadas.has(area)) errores.push(`Semana ${i + 1}: área duplicada.`);
      usadas.add(area);
      if (areasExcluidas.some(ex => area.includes(normalizar(ex)))) {
        errores.push(`Semana ${i + 1}: incluyó un área excluida por el docente.`);
      }
    });
  });
  // Nunca aceptar que una identidad de una plantilla anterior pase a la salida.
  for (const v of [identidad.docente, identidad.institucion, identidad.gradoSeccion]) {
    if (!v?.trim()) errores.push('Falta un dato de identidad confirmado por el docente.');
  }
  return errores;
}
