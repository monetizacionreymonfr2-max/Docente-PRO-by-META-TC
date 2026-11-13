import JSZip from 'jszip';
import { cargarDocx, construirMapa } from '../docxClone/docxEditor';
import type { DocxMapa } from '../docxClone/types';

/** Prepara un deshacer sobre una copia aislada; jamás modifica el ZIP activo. */
export async function prepararDeshacerSeguro(
  blobActivo: Blob,
  xmlAnterior: string,
  blobAnterior?: Blob,
): Promise<{ blob: Blob; zip: JSZip; doc: Document; mapa: DocxMapa }> {
  // Para sesiones nuevas, recuperar la copia COMPLETA. El respaldo antiguo de
  // solo XML se admite únicamente como compatibilidad de documentos previos.
  if (blobAnterior) {
    const revertido = await cargarDocx(blobAnterior);
    return { blob: blobAnterior, zip: revertido.zip, doc: revertido.doc, mapa: construirMapa(revertido.doc) };
  }
  const copia = await JSZip.loadAsync(await blobActivo.arrayBuffer());
  copia.file('word/document.xml', xmlAnterior);
  const blob = await copia.generateAsync({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    compression: 'DEFLATE',
  });

  // Si el XML anterior no abre, el documento activo sigue intacto.
  try {
    const revertido = await cargarDocx(blob);
    const mapa = construirMapa(revertido.doc);
    return { blob, zip: revertido.zip, doc: revertido.doc, mapa };
  } catch (error) {
    throw new Error(`Error al validar el XML anterior del Word: ${(error as Error).message}`);
  }
}
