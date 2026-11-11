/** Auditoría conservadora: nunca entregar una adaptación de grado con rastros del grado anterior. */
const FORMAS_GRADO: string[][] = [
  ['primer', 'primero', '1er', '1ero', '1ro', '1°', '1º'],
  ['segundo', '2do', '2°', '2º'],
  ['tercer', 'tercero', '3er', '3ero', '3°', '3º'],
  ['cuarto', '4to', '4°', '4º'],
  ['quinto', '5to', '5°', '5º'],
  ['sexto', '6to', '6°', '6º'],
];

const limpiar = (valor: string) => valor.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const escapar = (valor: string) => valor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function patron(numero: number): RegExp {
  const formas = FORMAS_GRADO[numero - 1].map(escapar).join('|');
  return new RegExp(`(?:^|[^a-z0-9])(?:${formas})\\s*\\.?\\s*(?:grado|ano)\\b`, 'gi');
}

export function extraerGradoPrimaria(valor: string): number | null {
  const normal = limpiar(valor);
  for (let grado = 1; grado <= 6; grado++) {
    if (patron(grado).test(normal)) return grado;
  }
  const soloNumero = normal.match(/^\s*([1-6])\s*(?:er|ero|do|to|ro|[º°])?\s*(?:["'a-z])?\s*$/);
  return soloNumero ? Number(soloNumero[1]) : null;
}

/** Devuelve las expresiones del grado previo todavía presentes en el documento final. */
export function referenciasGradoAnterior(texto: string, gradoOriginal: string, gradoNuevo: string): string[] {
  const origen = extraerGradoPrimaria(gradoOriginal);
  const destino = extraerGradoPrimaria(gradoNuevo);
  if (!origen || !destino || origen === destino) return [];
  const referencias = limpiar(texto).match(patron(origen)) || [];
  return [...new Set(referencias.map(ref => ref.trim()))].slice(0, 10);
}
