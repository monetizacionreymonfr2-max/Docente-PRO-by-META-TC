import { supabase } from '../supabase';

const BUCKET = 'camila-documentos';
const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
export interface VersionDocumentoPpa {
  id: string; nombre: string; version: number; ruta_storage: string;
  estado: 'borrador' | 'aprobado' | 'descartado'; conversacion_id: string | null;
  created_at: string;
}
/**
 * Almacenamiento propio de cada docente. NO se invoca sin un clic confirmado
 * en "Guardar versión"; tampoco registra memoria personal automáticamente.
 */
export const VersionesPpa = {
  async listar(teacherId: string, conversacionId?: string | null): Promise<VersionDocumentoPpa[]> {
    let q = supabase.from('camila_ppa_versiones')
      .select('id,nombre,version,ruta_storage,estado,conversacion_id,created_at')
      .eq('teacher_id',teacherId).order('created_at',{ascending:false}).limit(50);
    if (conversacionId) q = q.eq('conversacion_id',conversacionId);
    const { data, error } = await q;
    if (error) throw new Error('No se pudieron consultar las versiones privadas del PPA.');
    return (data || []) as VersionDocumentoPpa[];
  },
  async guardar(input: {
    teacherId: string; conversacionId?: string | null;
    nombre: string; blob: Blob; ppaJson?: unknown;
  }): Promise<void> {
    const { teacherId, conversacionId, nombre, blob, ppaJson } = input;
    if (!teacherId || !nombre.trim() || blob.size < 100 || blob.size > 10*1024*1024) {
      throw new Error('El Word no es válido para guardar como versión.');
    }
    const prev = await this.listar(teacherId,conversacionId);
    const n = Math.max(0,...prev.map(p=>p.version)) + 1;
    const ruta = `${teacherId}/${crypto.randomUUID()}.docx`;
    const { error: uploadError } = await supabase.storage.from(BUCKET).upload(ruta,blob,{
      contentType:DOCX_MIME,upsert:false,cacheControl:'0',
    });
    if (uploadError) throw new Error('No se pudo guardar el Word en el almacenamiento privado.');
    const { error } = await supabase.from('camila_ppa_versiones').insert({
      teacher_id:teacherId,conversacion_id:conversacionId || null,
      nombre:nombre.slice(0,150),version:n,ruta_storage:ruta,estado:'aprobado',
      ppa_json:ppaJson || null, consentimiento_documento_en:new Date().toISOString(),
    });
    if (error) {
      await supabase.storage.from(BUCKET).remove([ruta]);
      throw new Error('No se pudo registrar la versión; se canceló el guardado del Word.');
    }
  },
  async descargar(version: VersionDocumentoPpa): Promise<Blob> {
    // URL firmada por Supabase con vencimiento de dos minutos.
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(version.ruta_storage,120);
    if (error || !data?.signedUrl) throw new Error('No se pudo autorizar la descarga.');
    const response=await fetch(data.signedUrl,{cache:'no-store'});
    if (!response.ok) throw new Error('No se pudo descargar el Word privado.');
    return new Blob([await response.arrayBuffer()],{type:DOCX_MIME});
  },
};
