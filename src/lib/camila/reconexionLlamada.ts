/** Política local de reconexión: una sola llamada conserva su presupuesto de nueve minutos. */
export const DURACION_LLAMADA_CAMILA_SEGUNDOS = 540;
export const REINTENTOS_MAXIMOS_CAMILA = 2;

export function segundosRestantesLlamada(inicioMs: number, ahoraMs: number): number {
  if (!Number.isFinite(inicioMs) || !Number.isFinite(ahoraMs) || ahoraMs < inicioMs) return 0;
  return Math.max(0, Math.ceil((inicioMs + DURACION_LLAMADA_CAMILA_SEGUNDOS * 1000 - ahoraMs) / 1000));
}

export function puedeReconectarLlamada(inicioMs: number, ahoraMs: number, reintentosRealizados: number): boolean {
  return Number.isInteger(reintentosRealizados) &&
    reintentosRealizados >= 0 &&
    reintentosRealizados < REINTENTOS_MAXIMOS_CAMILA &&
    segundosRestantesLlamada(inicioMs, ahoraMs) >= 15;
}
