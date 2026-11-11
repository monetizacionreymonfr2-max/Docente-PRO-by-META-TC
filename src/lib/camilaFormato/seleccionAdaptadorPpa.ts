import { extraerGradoPrimaria, referenciasGradoAnterior } from './auditoriaGrado';

const normalizar = (valor: string) => valor.normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim().toLowerCase();

/** Permite el motor flexible solo si el adaptador determinista rechazó la estructura. */
export function esIncompatibilidadEstructuralPpa(error: unknown): boolean {
  return error instanceof Error &&
    error.message.includes('Esta plantilla Word tiene una estructura distinta.');
}

/** Auditar el texto de documento.xml y de todos los encabezados y pies del resultado. */
export function erroresAuditoriaPpaGenerico(textoFinal: string, gradoNuevo: string, tituloNuevo: string): string[] {
  const errores: string[] = [];
  const grado = extraerGradoPrimaria(gradoNuevo);
  if (!grado || !textoFinal.trim()) return ['No se pudo verificar el nuevo grado dentro del Word.'];
  const gradosPresentes = new Set<number>();
  for (let anterior = 1; anterior <= 6; anterior++) {
    if (referenciasGradoAnterior(textoFinal, `${anterior}° grado`,
      `${anterior === 6 ? 1 : anterior + 1}° grado`).length) {
      gradosPresentes.add(anterior);
    }
  }
  if (!gradosPresentes.has(grado)) errores.push('No figura el grado solicitado en el Word final.');
  for (const anterior of gradosPresentes) {
    if (anterior !== grado) errores.push(`Persisten referencias al grado ${anterior} después de la adaptación.`);
  }
  if (tituloNuevo.trim().length > 3 && !normalizar(textoFinal).includes(normalizar(tituloNuevo))) {
    errores.push('No se encontró el título nuevo del proyecto dentro del Word final.');
  }
  return errores;
}
