/**
 * Interpreta pedidos como «Este proyecto es de tercer grado, adáptalo completamente a
 * quinto y cambia el docente a Reymon Castillo». Considera el historial: si el docente
 * ya dijo el grado destino antes y ahora solo confirma, la orden sigue siendo integral.
 */
import { solicitaPpaIntegral } from '../solicitudIntegral';
import { interpretarGradoTexto, sinAcentos, type NumeroGrado } from './gradoEscolar';

export interface SolicitudAdaptacion {
  esAdaptacionIntegral: boolean;
  gradoDestino: NumeroGrado | null;
  gradoOrigenDeclarado: NumeroGrado | null;
  docenteDestino: string | null;
  soloPuntual: boolean;
  origenDelGradoDestino: 'mensaje' | 'historial' | 'ninguno';
}

type Turno = { rol: 'user' | 'model'; texto: string };

const GRADO = '(primer|primero|segundo|tercer|tercero|cuarto|quinto|sexto|[1-6](?:\\.?(?:er|ro|do|to|o|º|°))?)';
const TEMPORAL = '(?!\\s+(?:lapso|momento|trimestre|semana|periodo|corte|lugar|puesto|piso|parcial|etapa|fase|paso|dia))';
const RE_MENCION = new RegExp(`(?:^|[^\\p{L}\\d])((?:a|al|para|hasta|hacia|de|del|es|era)\\s+(?:el\\s+)?(?:grado\\s+)?)?${GRADO}(?![\\p{L}\\d])${TEMPORAL}`, 'giu');
const PREPOSICION_DESTINO = /^(?:a|al|para|hasta|hacia)\s/;

const NOMBRE = /[A-ZÁÉÍÓÚÑ][\p{L}'’-]+(?:\s+(?:(?:de\s+la|de\s+los|de\s+las|del|de|la)\s+)?[A-ZÁÉÍÓÚÑ][\p{L}'’-]+){0,3}/uy;
const NO_ES_NOMBRE = new Set(['word', 'ppa', 'docente', 'maestra', 'maestro', 'profesor', 'profesora', 'grado', 'quinto', 'cuarto',
  'tercero', 'tercer', 'segundo', 'sexto', 'primero', 'primer', 'camila', 'docenty', 'primaria', 'proyecto', 'documento']);

function extraerGrados(mensaje: string): Array<{ grado: NumeroGrado; destino: boolean }> {
  const salida: Array<{ grado: NumeroGrado; destino: boolean }> = [];
  for (const m of mensaje.matchAll(RE_MENCION)) {
    const grado = interpretarGradoTexto(m[2]);
    if (!grado) continue;
    const prep = sinAcentos((m[1] || '').trim() + ' ');
    // «de/del» sin más contexto es ambiguo: solo cuenta como origen.
    salida.push({ grado, destino: PREPOSICION_DESTINO.test(prep) });
  }
  return salida;
}

export function extraerDocenteDestino(mensaje: string): string | null {
  const marcadores = [
    /\b(?:docente|maestr[oa]|profesor(?:a)?|facilitador(?:a)?)\b\s*(?:a|por|es|sea|como|:|=)?\s*/giu,
    /\b(?:escrib\w+|pon\w*|coloc\w*|nombre)\s+(?:el\s+nombre\s+)?(?:de\s+)?/giu,
  ];
  for (const re of marcadores) {
    for (const m of mensaje.matchAll(re)) {
      NOMBRE.lastIndex = (m.index ?? 0) + m[0].length;
      const hit = NOMBRE.exec(mensaje);
      if (!hit) continue;
      const nombre = hit[0].trim().replace(/[.,;:]+$/, '');
      const primera = sinAcentos(nombre.split(/\s+/)[0]);
      if (nombre.length >= 3 && !NO_ES_NOMBRE.has(primera)) return nombre;
    }
  }
  return null;
}

function interpretarMensaje(mensaje: string): Omit<SolicitudAdaptacion, 'origenDelGradoDestino'> {
  const n = sinAcentos(mensaje);
  const soloPuntual = /\b(?:solo|solamente|unicamente)\b.{0,70}\b(?:grado|encabezado|titulo|nombre|fecha|portada|docente)\b/.test(n)
    || /\bsin\s+adaptar\b/.test(n);
  const informativa = /^\s*¿?\s*(?:como|que|cual|cuando|donde|por que)\b/.test(n);
  const verbo = /\b(?:adapt\w*|adecu\w*|convert\w*|convi\w*|transform\w*|pas[ae]\w*|llev[ae]\w*|cambi\w*|ajust\w*|actualiz\w*|reescrib\w*|rehaz\w*|rehac\w*)\b/.test(n);
  const grados = extraerGrados(mensaje);
  let destino: NumeroGrado | null = null;
  let origen: NumeroGrado | null = null;
  const conPrep = grados.filter((g) => g.destino);
  if (conPrep.length) {
    destino = conPrep[conPrep.length - 1].grado;
    const otros = grados.filter((g) => g.grado !== destino);
    origen = otros.length ? otros[0].grado : null;
  } else if (grados.length === 1 && verbo) destino = grados[0].grado;
  else if (grados.length >= 2) { destino = grados[grados.length - 1].grado; origen = grados[0].grado; }
  const docente = extraerDocenteDestino(mensaje);
  const integral = !soloPuntual && !informativa && (verbo || solicitaPpaIntegral(mensaje)) &&
    (destino !== null || solicitaPpaIntegral(mensaje));
  // Un cambio de nombre sin grado ni alcance integral no es adaptación integral.
  return { esAdaptacionIntegral: integral && destino !== null, gradoDestino: destino, gradoOrigenDeclarado: origen, docenteDestino: docente, soloPuntual };
}

export function interpretarSolicitudAdaptacion(mensaje: string, historial: Turno[] = []): SolicitudAdaptacion {
  const actual = interpretarMensaje(mensaje);
  if (actual.gradoDestino !== null) return { ...actual, origenDelGradoDestino: 'mensaje' };
  // Sin grado en este mensaje: ¿es la continuación de un pedido integral anterior?
  const n = sinAcentos(mensaje);
  const continuacion = /\b(?:si|adelante|hazlo|procede|continua|ok|dale|aplicalo|aplicala|confirmo|correcto)\b/.test(n)
    || solicitaPpaIntegral(mensaje) || /\b(?:adapt\w*|adecu\w*)\b/.test(n);
  if (continuacion && !actual.soloPuntual) {
    const previos = [...historial].reverse().filter((t) => t.rol === 'user').slice(0, 6);
    for (const t of previos) {
      const previo = interpretarMensaje(t.texto);
      if (previo.gradoDestino !== null) {
        return {
          esAdaptacionIntegral: true,
          gradoDestino: previo.gradoDestino,
          gradoOrigenDeclarado: previo.gradoOrigenDeclarado,
          docenteDestino: actual.docenteDestino ?? previo.docenteDestino,
          soloPuntual: false,
          origenDelGradoDestino: 'historial',
        };
      }
    }
  }
  return { ...actual, origenDelGradoDestino: 'ninguno' };
}
