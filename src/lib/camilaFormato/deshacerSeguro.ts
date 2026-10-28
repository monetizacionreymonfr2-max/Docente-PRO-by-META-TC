import JSZip from 'jszip';
import { cargarDocx, construirMapa } from '../docxClone/docxEditor';
import type { DocxMapa } from '../docxClone/types';

/** Prepara un deshacer sobre una copia aislada; jamás modifica el ZIP activo. */
export async function prepararDeshacerSeguro(
  blobActivo: Blob,
  xmlAnterior: string,
): Promise<{ blob: Blob; zip: JSZip; doc: Document; mapa: DocxMapa }> {
  const copia = await JSZip.loadAsync(await blobActivo.arrayBuffer());
  copia.file('word/document.xml', xmlAnterior);
  const blob = await copia.generateAsync({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    compression: 'DEFLATE',
  });

  // Si el XML anterior no abre o no tiene cuerpo, el documento activo sigue intacto.
  const revertido = await cargarDocx(blob);
  const mapa = construirMapa(revertido.doc);
  return { blob, zip: revertido.zip, doc: revertido.doc, mapa };
}
