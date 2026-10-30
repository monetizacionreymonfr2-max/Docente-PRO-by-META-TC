import type { DatosDocenteProyecto } from '../docxClone/blockGenerator';

/** Datos temporales del trabajo en curso: nunca se guardan como memoria automática. */
export interface DatosProyectoPropuesto {
  gradoSeccion?: string;
  tema?: string;
  diagnostico?: string;
  duracion?: string;
  docente?: string;
  institucion?: string;
  matricula?: string;
}

const CAMPOS: Array<keyof DatosProyectoPropuesto> = [
  'gradoSeccion', 'tema', 'diagnostico', 'duracion', 'docente', 'institucion', 'matricula',
];

export function combinarDatosProyecto(
  previo: DatosProyectoPropuesto = {}, nuevo: DatosProyectoPropuesto = {}
): DatosProyectoPropuesto {
  const combinado = { ...previo };
  for (const campo of CAMPOS) {
    const valor = nuevo[campo];
    if (typeof valor === 'string' && valor.trim()) combinado[campo] = valor.trim().slice(0, 2500);
  }
  return combinado;
}

export function prepararVaciadoPpa(datos: DatosProyectoPropuesto):
  | { listo: false; pregunta: string }
  | { listo: true; datos: DatosDocenteProyecto } {
  // Nada de ejemplos implícitos ni reutilización de la identidad de otro docente.
  if (!datos.gradoSeccion?.trim()) return { listo: false, pregunta: '¿Qué grado o grados atiende el grupo?' };
  if (!datos.tema?.trim()) return { listo: false, pregunta: '¿Cuál es el tema central del PPA?' };
  if (!datos.diagnostico?.trim()) return { listo: false, pregunta: '¿Qué diagnóstico o necesidades de aprendizaje tiene ese grupo?' };
  if (!datos.docente?.trim()) return { listo: false, pregunta: '¿Cuál es el nombre de la docente o el docente que debe aparecer en el formato?' };
  if (!datos.institucion?.trim()) return { listo: false, pregunta: '¿Cuál es el nombre de la institución educativa?' };
  if (!datos.duracion?.trim()) return { listo: false, pregunta: '¿Cuántas semanas debe durar el PPA?' };
  if (extraerDuracionSemanas(datos.duracion) === null) {
    return { listo: false, pregunta: '¿Puede indicar la duración exacta del PPA en semanas (por ejemplo, 3 o 4 semanas)?' };
  }
  return { listo: true, datos: {
    docente: datos.docente.trim(), institucion: datos.institucion.trim(),
    gradoSeccion: datos.gradoSeccion.trim(), nivel: 'Educación Primaria',
    tema: datos.tema.trim(), duracion: datos.duracion.trim(),
    diagnostico: datos.diagnostico.trim(), matricula: datos.matricula?.trim() || undefined,
  } };
}

export function extraerDuracionSemanas(duracion: string): number | null {
  const match = duracion.match(/\b(\d{1,2})\s*semanas?\b/i);
  if (!match) return null;
  const semanas = Number(match[1]);
  return Number.isInteger(semanas) && semanas >= 1 && semanas <= 12 ? semanas : null;
}
