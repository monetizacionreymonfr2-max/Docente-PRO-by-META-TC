/** Impide reemplazar un chat temporal con contenido sin avisar al docente. */
export function hayConversacionSinGuardar(
  conversacionId: string | null,
  cantidadMensajes: number,
): boolean {
  return !conversacionId && cantidadMensajes > 1;
}
