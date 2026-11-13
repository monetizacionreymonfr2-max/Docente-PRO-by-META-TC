import JSZip from 'jszip';
import type { ParteDocx } from './inventarioDocx';

export const RE_PARTE_EDITABLE = /^word\/(?:document|header\d*|footer\d*|footnotes|endnotes)\.xml$/;
const RE_AUXILIAR = /^word\/(?:header\d*|footer\d*|footnotes|endnotes)\.xml$/;

export type EntradaZip = ArrayBuffer | Uint8Array | Blob;
export async function aBytes(entrada: EntradaZip): Promise<Uint8Array> {
  if (entrada instanceof Uint8Array) return entrada;
  if (entrada instanceof ArrayBuffer) return new Uint8Array(entrada);
  return new Uint8Array(await (entrada as Blob).arrayBuffer());
}

/** Abre el ZIP y analiza (sin modificar) cuerpo, encabezados, pies y notas. */
export async function abrirPartesDocx(entrada: EntradaZip): Promise<{ zip: JSZip; partes: ParteDocx[] }> {
  const zip = await JSZip.loadAsync(await aBytes(entrada));
  if (!zip.file('word/document.xml')) throw new Error('El archivo DOCX no contiene word/document.xml válido.');
  const partes: ParteDocx[] = [];
  const rutas = Object.keys(zip.files).filter((r) => RE_PARTE_EDITABLE.test(r)).sort((a, b) =>
    a === 'word/document.xml' ? -1 : b === 'word/document.xml' ? 1 : a.localeCompare(b));
  for (const ruta of rutas) {
    const xml = await zip.file(ruta)!.async('string');
    const doc = new DOMParser().parseFromString(xml, 'application/xml');
    if (!doc.documentElement || doc.getElementsByTagName('parsererror').length) {
      throw new Error(`El XML de ${ruta} no es válido.`);
    }
    partes.push({ ruta, xml, doc, auxiliar: RE_AUXILIAR.test(ruta) });
  }
  return { zip, partes };
}

/** Declaración XML original (el serializador del navegador la omite). */
export function declaracionXml(xmlOriginal: string): string {
  const m = /^\s*(<\?xml[^>]*\?>)\s*/.exec(xmlOriginal);
  return m ? `${m[1]}\n` : '';
}
