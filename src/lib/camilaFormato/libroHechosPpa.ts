/**
 * Libro de hechos de un PPA: distingue datos proporcionados, inferencias,
 * preguntas pendientes y contradicciones. Es contexto de sesión; no memoria.
 */
export type EstadoHechoPpa = 'dicho' | 'supuesto' | 'falta' | 'contradiccion';
export type OrigenHechoPpa = 'mensaje_docente' | 'archivo_actual' | 'memoria_autorizada' | 'plantilla_referencia';

export interface HechoPpa {
  campo: string;
  valor: string | null;
  estado: EstadoHechoPpa;
  fuente: { origen: OrigenHechoPpa; referencia: string } | null;
  observacion?: string;
}

export interface LibroHechosPpa {
  version: 1;
  hechos: HechoPpa[];
  // Las contradicciones y los supuestos deben mostrarse antes de generar el Word.
  pendientes: string[];
}

const ORIGENES = new Set<OrigenHechoPpa>([
  'mensaje_docente', 'archivo_actual', 'memoria_autorizada', 'plantilla_referencia',
]);

const CAMPOS_PROYECTO = [
  'gradoSeccion', 'tema', 'diagnostico', 'duracion', 'docente', 'institucion', 'matricula',
  'anioEscolar', 'fechaInicio', 'fechaFin',
] as const;

export type DatosProyectoDesdeLibro = Partial<Record<typeof CAMPOS_PROYECTO[number], string>>;

export const INSTRUCCION_LIBRO_HECHOS_PPA = `Extraiga datos para un PPA venezolano exclusivamente de mensajes y archivos adjuntos.
Responda como objeto JSON: {version:1,hechos:[{campo,valor,estado,fuente:{origen,referencia},observacion}],pendientes:[]}.
Los estados permitidos son dicho, supuesto, falta, contradiccion.
Para 'dicho', cite el mensaje o archivo actual; no atribuya a la docente datos tomados de un Word anterior.
Extraiga también anioEscolar, fechaInicio y fechaFin (formato AAAA-MM-DD o DD-MM-AAAA), SOLO si fueron confirmados. Si una fecha, matrícula o grado aparece en dos versiones incompatibles, marque contradiccion.
Los datos de una plantilla anterior sirven para entender la estructura, jamás para copiar identidad, escuela o estudiantes.
No invente valores para campos faltantes. Muestre las suposiciones y pida confirmación de una en una.
No guarde memoria permanente ni incluya nombres de menores si no son imprescindibles.`;

export function validarLibroHechosPpa(libro: LibroHechosPpa): string[] {
  const errores: string[] = [];
  if (libro?.version !== 1 || !Array.isArray(libro.hechos) || !Array.isArray(libro.pendientes)) {
    return ['El libro de hechos no tiene la estructura esperada.'];
  }
  if (libro.hechos.length > 40 || libro.pendientes.length > 15 ||
      libro.pendientes.some((p) => typeof p !== 'string' || p.length > 500)) {
    return ['El libro de hechos excede los límites permitidos.'];
  }
  const estados = new Set<EstadoHechoPpa>(['dicho', 'supuesto', 'falta', 'contradiccion']);
  const confirmados = new Map<string, string>();
  for (const h of libro.hechos) {
    if (!h || typeof h.campo !== 'string' || !h.campo.trim() || h.campo.length > 80 || !estados.has(h.estado) ||
        (h.valor !== null && (typeof h.valor !== 'string' || h.valor.length > 2500))) {
      errores.push('Existe un hecho sin campo o estado válido.');
      continue;
    }
    if (h.fuente !== null && (!h.fuente || !ORIGENES.has(h.fuente.origen) ||
        typeof h.fuente.referencia !== 'string' || h.fuente.referencia.length > 500)) {
      errores.push(`${h.campo}: la fuente del dato no es válida.`);
      continue;
    }
    if (h.estado === 'dicho' &&
        (!h.fuente || h.fuente.origen === 'plantilla_referencia' || !h.fuente.referencia?.trim() ||
         !h.valor?.trim())) {
      errores.push(`${h.campo}: no se puede confirmar un dato sin fuente actual o autorizada.`);
    }
    if (h.estado === 'falta' && h.valor !== null) {
      errores.push(`${h.campo}: un dato faltante no debe contener un valor inventado.`);
    }
    if (h.estado === 'dicho' && h.valor?.trim()) {
      const previo = confirmados.get(h.campo);
      if (previo && previo.toLocaleLowerCase('es') !== h.valor.trim().toLocaleLowerCase('es')) {
        errores.push(`${h.campo}: hay dos valores confirmados incompatibles.`);
      }
      confirmados.set(h.campo, h.valor.trim());
    }
  }
  const numeros = new Map<string, number>();
  for (const h of libro.hechos) {
    if (h.estado === 'dicho' && h.valor && /^\d+$/.test(h.valor.trim())) {
      numeros.set(h.campo, Number(h.valor));
    }
  }
  const total = numeros.get('matricula_total');
  const varones = numeros.get('matricula_varones');
  const hembras = numeros.get('matricula_hembras');
  if (total !== undefined && varones !== undefined && hembras !== undefined && total !== varones + hembras) {
    errores.push('La matrícula total no coincide con el desglose aportado.');
  }
  return errores;
}

/** Solo datos explícitos y con fuente entran en un borrador institucional. */
export function datosConfirmadosDelLibro(libro: LibroHechosPpa): Record<string, string> {
  if (validarLibroHechosPpa(libro).length) return {};
  return Object.fromEntries(libro.hechos
    .filter((h) => h.estado === 'dicho' && h.valor?.trim() && h.fuente?.origen !== 'plantilla_referencia')
    .map((h) => [h.campo, h.valor!.trim()]));
}

/** Nunca trasladar una suposición o un dato de una plantilla ajena al PPA. */
export function datosProyectoDesdeLibro(libro: LibroHechosPpa): DatosProyectoDesdeLibro {
  const confirmados = datosConfirmadosDelLibro(libro);
  const ambiguos = new Set(libro.hechos.filter((h) => h.estado === 'contradiccion').map((h) => h.campo));
  const datos: DatosProyectoDesdeLibro = {};
  for (const campo of CAMPOS_PROYECTO) {
    if (confirmados[campo] && !ambiguos.has(campo)) datos[campo] = confirmados[campo];
  }
  // Alias estructurados usados por la extracción de fotografías y conversaciones.
  if (!datos.gradoSeccion && confirmados.grado && !ambiguos.has('grado')) datos.gradoSeccion = confirmados.grado;
  if (!datos.matricula && confirmados.matricula_total && !ambiguos.has('matricula_total')) datos.matricula = confirmados.matricula_total;
  return datos;
}

export function preguntaPendienteLibroPpa(libro: LibroHechosPpa): string | null {
  const errores = validarLibroHechosPpa(libro);
  if (errores.length > 0) {
    return `${errores[0]} ¿Puede aclararme ese dato antes de preparar el documento?`;
  }
  const conflicto = libro.hechos.find((h) => h.estado === 'contradiccion');
  if (conflicto) {
    return `Encontré información contradictoria sobre ${conflicto.campo}. ¿Cuál dato es el correcto?`;
  }
  return null;
}
