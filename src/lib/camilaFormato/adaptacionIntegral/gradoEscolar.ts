/**
 * Detección y sustitución de menciones de grado escolar (Educación Primaria,
 * 1.º a 6.º). Es determinista: nunca consulta a un modelo. Se usa tanto para
 * escribir el grado destino como para AUDITAR que no queden menciones del
 * grado anterior en el Word resultante.
 */
export type NumeroGrado = 1 | 2 | 3 | 4 | 5 | 6;

export interface MencionGrado {
  inicio: number;
  fin: number;
  texto: string;
  grado: NumeroGrado;
  forma: 'palabra' | 'abreviatura' | 'numero';
  confianza: 'alta' | 'media';
}

const PALABRA_A_GRADO: Record<string, NumeroGrado> = {
  primer: 1, primero: 1, segundo: 2, tercer: 3, tercero: 3, cuarto: 4, quinto: 5, sexto: 6,
};
const PALABRA_COMPLETA: Record<NumeroGrado, string> = {
  1: 'primero', 2: 'segundo', 3: 'tercero', 4: 'cuarto', 5: 'quinto', 6: 'sexto',
};
const PALABRA_APOCOPADA: Record<NumeroGrado, string> = {
  1: 'primer', 2: 'segundo', 3: 'tercer', 4: 'cuarto', 5: 'quinto', 6: 'sexto',
};
const ABREVIATURA: Record<NumeroGrado, string> = { 1: '1er', 2: '2do', 3: '3er', 4: '4to', 5: '5to', 6: '6to' };

const RE_TOKEN = new RegExp(
  '(?<![\\p{L}\\d])(?:(primer|primero|segundo|tercer|tercero|cuarto|quinto|sexto)|([1-6])\\.?(?:er|ro|do|to|º|°|ᵒ))(?![\\p{L}\\d])',
  'giu',
);
const RE_NUMERO_ANTES_GRADO = /(?<![\p{L}\d.,])([1-6])(?=\s+grado\b)/giu;
const RE_NUMERO_DESPUES_GRADO = /(?<=\bgrado\s{0,2}[:\-–]?\s{0,2})([1-6])(?![\d\p{L}º°])/giu;
const RE_TEMPORAL_DESPUES = /^\s+(?:lapso|momento|trimestre|semana|per[ií]odo|corte|lugar|puesto|piso|parcial|evaluaci[oó]n|etapa|fase|paso|d[ií]a|premio|nivel de logro)/iu;
const RE_GRADO_DESPUES = /^\s*(?:grado\b|de\s+(?:educaci[oó]n\s+)?primaria\b)/iu;
const RE_GRADO_ANTES = /\bgrado\s*[:\-–]?\s*$/iu;
const RE_PERSONAS_ANTES = /\b(?:estudiantes|ni[ñn]os|ni[ñn]as|alumnos|alumnas|escolares|grupo|aula|curso|secci[oó]n|clase)\s+(?:de|del)\s+(?:el\s+)?$/iu;
const RE_DE_ANTES = /\b(?:de|del)\s+(?:el\s+)?$/iu;

/** Normaliza para comparar sin acentos ni mayúsculas. */
export const sinAcentos = (s: string): string => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

export function nombreGrado(n: NumeroGrado, apocope = true): string {
  return (apocope ? PALABRA_APOCOPADA : PALABRA_COMPLETA)[n];
}
export function etiquetaGrado(n: NumeroGrado): string { return `${nombreGrado(n, true)} grado`; }

/**
 * Menciona grados en `texto`. Con `contextoGrado` (celda de «Grado y sección»)
 * también se aceptan palabras sueltas como «Tercero B».
 */
export function detectarMencionesGrado(texto: string, opciones: { contextoGrado?: boolean } = {}): MencionGrado[] {
  const resultado = new Map<number, MencionGrado>();
  for (const m of texto.matchAll(RE_TOKEN)) {
    const inicio = m.index ?? 0;
    const fin = inicio + m[0].length;
    const despues = texto.slice(fin, fin + 60);
    const antes = texto.slice(Math.max(0, inicio - 60), inicio);
    if (RE_TEMPORAL_DESPUES.test(despues)) continue;
    const esPalabra = m[1] !== undefined;
    const grado = (esPalabra ? PALABRA_A_GRADO[m[1].toLowerCase()] : Number(m[2])) as NumeroGrado;
    let confianza: 'alta' | 'media' | null = null;
    if (RE_GRADO_DESPUES.test(despues) || RE_GRADO_ANTES.test(antes) || opciones.contextoGrado) confianza = 'alta';
    else if (RE_PERSONAS_ANTES.test(antes) || (!esPalabra && RE_DE_ANTES.test(antes))) confianza = 'media';
    if (!confianza) continue;
    resultado.set(inicio, { inicio, fin, texto: m[0], grado, forma: esPalabra ? 'palabra' : 'abreviatura', confianza });
  }
  for (const re of [RE_NUMERO_ANTES_GRADO, RE_NUMERO_DESPUES_GRADO]) {
    for (const m of texto.matchAll(re)) {
      const inicio = m.index ?? 0;
      if (resultado.has(inicio)) continue;
      resultado.set(inicio, { inicio, fin: inicio + m[0].length, texto: m[0], grado: Number(m[1]) as NumeroGrado, forma: 'numero', confianza: 'alta' });
    }
  }
  return [...resultado.values()].sort((a, b) => a.inicio - b.inicio);
}

function aplicarMayusculas(original: string, nuevo: string): string {
  const letras = original.replace(/[^\p{L}]/gu, '');
  if (letras.length > 1 && letras === letras.toUpperCase()) return nuevo.toUpperCase();
  if (letras.length && letras[0] === letras[0].toUpperCase() && letras[0] !== letras[0].toLowerCase()) {
    return nuevo.charAt(0).toUpperCase() + nuevo.slice(1);
  }
  return nuevo;
}

function renderizarMencion(m: MencionGrado, destino: NumeroGrado, despues: string): string {
  if (m.forma === 'numero') return String(destino);
  if (m.forma === 'palabra') {
    const apocope = /^\s+grado\b/iu.test(despues) || /^\s+(?:de\s+)?primaria\b/iu.test(despues);
    return aplicarMayusculas(m.texto, nombreGrado(destino, apocope));
  }
  // Abreviatura: conservar el estilo ordinal (º, °) si lo traía; si no, forma canónica.
  const simbolo = /([º°ᵒ])/u.exec(m.texto);
  if (simbolo) return m.texto.replace(/[1-6]/, String(destino));
  return aplicarMayusculas(m.texto, ABREVIATURA[destino]);
}

/**
 * Cambia las menciones del grado `origen` (o de cualquier grado si no se indica)
 * por `destino`. Conserva letras de sección, mayúsculas y la redacción alrededor.
 * Las menciones de OTROS grados (p. ej. «retoma lo visto en segundo grado») se
 * respetan cuando se conoce `origen`.
 */
export function reemplazarGradoEnTexto(
  texto: string,
  destino: NumeroGrado,
  opciones: { origen?: NumeroGrado; contextoGrado?: boolean } = {},
): { texto: string; reemplazos: number } {
  const menciones = detectarMencionesGrado(texto, { contextoGrado: opciones.contextoGrado })
    .filter((m) => m.grado !== destino && (opciones.origen === undefined || m.grado === opciones.origen));
  if (!menciones.length) return { texto, reemplazos: 0 };
  let salida = '';
  let cursor = 0;
  for (const m of menciones) {
    salida += texto.slice(cursor, m.inicio) + renderizarMencion(m, destino, texto.slice(m.fin, m.fin + 20));
    cursor = m.fin;
  }
  salida += texto.slice(cursor);
  return { texto: salida, reemplazos: menciones.length };
}

/** Rangos de edición equivalentes a `reemplazarGradoEnTexto`, para escribirlos run por run. */
export function edicionesDeGrado(
  texto: string,
  destino: NumeroGrado,
  opciones: { origen?: NumeroGrado; contextoGrado?: boolean } = {},
): Array<{ inicio: number; fin: number; reemplazo: string }> {
  return detectarMencionesGrado(texto, { contextoGrado: opciones.contextoGrado })
    .filter((m) => m.grado !== destino && (opciones.origen === undefined || m.grado === opciones.origen))
    .map((m) => ({ inicio: m.inicio, fin: m.fin, reemplazo: renderizarMencion(m, destino, texto.slice(m.fin, m.fin + 20)) }));
}

/** Grado nombrado en una frase como DESTINO («adáptalo a quinto», «para 5to grado»). */
export function interpretarGradoTexto(palabra: string): NumeroGrado | null {
  const t = sinAcentos(palabra).trim();
  if (PALABRA_A_GRADO[t]) return PALABRA_A_GRADO[t];
  const n = /^([1-6])\.?(?:er|ro|do|to|o|º|°|ᵒ)?$/u.exec(t);
  return n ? (Number(n[1]) as NumeroGrado) : null;
}

export function gradosMencionados(texto: string, opciones: { contextoGrado?: boolean } = {}): Set<NumeroGrado> {
  return new Set(detectarMencionesGrado(texto, opciones).map((m) => m.grado));
}
