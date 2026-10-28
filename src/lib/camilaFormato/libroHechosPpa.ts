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

export const INSTRUCCION_LIBRO_HECHOS_PPA = `Extraiga datos para un PPA venezolano exclusivamente de mensajes y archivos adjuntos.
Responda como objeto JSON: {version:1,hechos:[{campo,valor,estado,fuente:{origen,referencia},observacion}],pendientes:[]}.
Los estados permitidos son dicho, supuesto, falta, contradiccion.
Para 'dicho', cite el mensaje o archivo actual; no atribuya a la docente datos tomados de un Word anterior.
Si una fecha, matrícula o grado aparece en dos versiones incompatibles, marque contradiccion.
Los datos de una plantilla anterior sirven para entender la estructura, jamás para copiar identidad, escuela o estudiantes.
No invente valores para campos faltantes. Muestre las suposiciones y pida confirmación de una en una.
No guarde memoria permanente ni incluya nombres de menores si no son imprescindibles.`;

export function validarLibroHechosPpa(libro: LibroHechosPpa): string[] {
  const errores: string[] = [];
  if (libro?.version !== 1 || !Array.isArray(libro.hechos) || !Array.isArray(libro.pendientes)) {
    return ['El libro de hechos no tiene la estructura esperada.'];
  }
  const estados = new Set<EstadoHechoPpa>(['dicho', 'supuesto', 'falta', 'contradiccion']);
  for (const h of libro.hechos) {
    if (!h || typeof h.campo !== 'string' || !h.campo.trim() || !estados.has(h.estado)) {
      errores.push('Existe un hecho sin campo o estado válido.');
      continue;
    }
    if (h.estado === 'dicho' &&
        (!h.fuente || h.fuente.origen === 'plantilla_referencia' || !h.fuente.referencia?.trim())) {
      errores.push(`${h.campo}: no se puede confirmar un dato sin fuente actual o autorizada.`);
    }
    if (h.estado === 'falta' && h.valor !== null) {
      errores.push(`${h.campo}: un dato faltante no debe contener un valor inventado.`);
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
