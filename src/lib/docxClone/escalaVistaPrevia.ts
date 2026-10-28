/** Escala un Word de ancho fijo al espacio útil de la pantalla, sin ampliarlo artificialmente. */
export function calcularEscalaVistaPrevia(
  anchoNatural: number,
  anchoDisponible: number,
  ajustarAlAncho: boolean,
): number {
  if (!ajustarAlAncho || !Number.isFinite(anchoNatural) || !Number.isFinite(anchoDisponible)
    || anchoNatural <= 0 || anchoDisponible <= 0) return 1;

  // Reserva un pequeño margen de seguridad para evitar desplazamiento horizontal.
  return Math.min(1, Math.max(1, anchoDisponible - 4) / anchoNatural);
}
