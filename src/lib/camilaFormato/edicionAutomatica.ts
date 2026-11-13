import { cargarDocx, construirMapa } from '../docxClone/docxEditor';
import type { SnapshotDocx } from './camilaFormatoEngine';

/**
 * Comprueba que el Word editado puede abrirse antes de mostrarlo como documento
 * activo. No escribe en almacenamiento ni modifica el archivo institucional.
 */
export async function prepararEdicionAutomatica(blob: Blob, solicitud: string) {
  const word = await cargarDocx(blob);
  const mapa = construirMapa(word.doc);
  const snapshot: SnapshotDocx = {
    id: `snap-${Date.now()}`,
    xml: new XMLSerializer().serializeToString(word.doc),
    blob,
    mapa,
    descripcion: solicitud.slice(0, 40) || 'Edición de Camila',
    timestamp: Date.now(),
  };
  return { ...word, mapa, snapshot };
}
