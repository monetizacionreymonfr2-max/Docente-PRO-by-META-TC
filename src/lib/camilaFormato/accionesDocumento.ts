/** Reglas compartidas por los botones y sus handlers de Mi Formato. */
export function obtenerAccionesDocumento(estado: {
  hayDocumento: boolean;
  hayZip: boolean;
  cantidadSnapshots: number;
  procesando: boolean;
}): { deshacer: boolean; descargar: boolean } {
  const documentoDisponible = estado.hayDocumento && !estado.procesando;

  return {
    deshacer: documentoDisponible && estado.hayZip && estado.cantidadSnapshots > 1,
    descargar: documentoDisponible,
  };
}
