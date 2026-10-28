/** Reglas compartidas por los botones y sus handlers de Mi Formato. */
export function obtenerAccionesDocumento(estado: {
  hayDocumento: boolean;
  hayZip: boolean;
  cantidadSnapshots: number;
  hayPropuesta: boolean;
  procesando: boolean;
}): { aprobar: boolean; descartar: boolean; deshacer: boolean; descargar: boolean } {
  const libre = !estado.procesando;
  const esperandoDecision = estado.hayPropuesta && libre;
  const documentoDisponible = estado.hayDocumento && libre && !estado.hayPropuesta;

  return {
    aprobar: esperandoDecision,
    descartar: esperandoDecision,
    deshacer: documentoDisponible && estado.hayZip && estado.cantidadSnapshots > 1,
    descargar: documentoDisponible,
  };
}
