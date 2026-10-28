import { supabase } from '../supabase';
import { prepararMensajesParaGuardar, recuperarMensajesGuardados } from './camilaPersistenceCodec';
import type { MensajeHistorial, MensajeParaHistorial } from './camilaPersistenceCodec';
export type { MensajeHistorial, MensajeParaHistorial } from './camilaPersistenceCodec';

export type ConversacionCamila = {
  id: string;
  titulo: string;
  mensajes: MensajeHistorial[];
  updated_at: string;
};

export type ResumenConversacion = Pick<ConversacionCamila, 'id' | 'titulo' | 'updated_at'>;

export type RecuerdoCamila = {
  id: string;
  titulo: string;
  contenido: string;
  updated_at: string;
};

const errorLegible = (error: { code?: string; message?: string } | null) => {
  if (!error) return new Error('No se pudo completar la operación.');
  if (error.code === 'PGRST116') return new Error('El elemento no existe o no pertenece a esta cuenta.');
  if (['42P01', 'PGRST205'].includes(error.code || '') ||
      /schema cache|relation .* does not exist/i.test(error.message || '')) {
    return new Error('El historial y la memoria todavía no están habilitados en esta instalación.');
  }
  return new Error('No se pudo acceder a sus datos privados de Camila. Inténtelo nuevamente.');
};

export const CamilaPersistence = {
  async listarConversaciones(teacherId: string): Promise<ResumenConversacion[]> {
    const { data, error } = await supabase.from('camila_conversaciones')
      .select('id,titulo,updated_at').eq('teacher_id', teacherId)
      .order('updated_at', { ascending: false }).limit(50);
    if (error) throw errorLegible(error);
    return data || [];
  },

  async obtenerConversacion(teacherId: string, id: string): Promise<ConversacionCamila> {
    const { data, error } = await supabase.from('camila_conversaciones')
      .select('id,titulo,mensajes,updated_at').eq('teacher_id', teacherId).eq('id', id).single();
    if (error || !data) throw errorLegible(error);
    return { ...data, mensajes: recuperarMensajesGuardados(data.mensajes) };
  },

  async crearConversacion(teacherId: string, mensajes: MensajeParaHistorial[]): Promise<string> {
    const titulo = `Conversación del ${new Date().toLocaleDateString('es-VE')}`;
    const { data, error } = await supabase.from('camila_conversaciones').insert({
      teacher_id: teacherId, titulo, mensajes: prepararMensajesParaGuardar(mensajes),
    }).select('id').single();
    if (error || !data) throw errorLegible(error);
    return data.id;
  },

  async actualizarConversacion(teacherId: string, id: string, mensajes: MensajeParaHistorial[]): Promise<void> {
    const { data, error } = await supabase.from('camila_conversaciones').update({
      mensajes: prepararMensajesParaGuardar(mensajes), updated_at: new Date().toISOString(),
    }).eq('teacher_id', teacherId).eq('id', id).select('id').single();
    if (error || !data) throw errorLegible(error);
  },

  async eliminarConversacion(teacherId: string, id: string): Promise<void> {
    const { error } = await supabase.from('camila_conversaciones')
      .delete().eq('teacher_id', teacherId).eq('id', id);
    if (error) throw errorLegible(error);
  },

  async listarRecuerdos(teacherId: string): Promise<RecuerdoCamila[]> {
    const { data, error } = await supabase.from('camila_memorias')
      .select('id,titulo,contenido,updated_at').eq('teacher_id', teacherId)
      .order('updated_at', { ascending: false }).limit(50);
    if (error) throw errorLegible(error);
    return data || [];
  },

  async guardarRecuerdo(teacherId: string, titulo: string, contenido: string, id?: string): Promise<void> {
    const limpioTitulo = titulo.trim();
    const limpioContenido = contenido.trim();
    if (!limpioTitulo || limpioTitulo.length > 120 || !limpioContenido || limpioContenido.length > 1500) {
      throw new Error('Introduzca un título (máximo 120 caracteres) y un dato (máximo 1500 caracteres).');
    }
    if (id) {
      const { data, error } = await supabase.from('camila_memorias')
        .update({ titulo: limpioTitulo, contenido: limpioContenido, updated_at: new Date().toISOString() })
        .eq('teacher_id', teacherId).eq('id', id).select('id').single();
      if (error || !data) throw errorLegible(error);
      return;
    }
    const { error } = await supabase.from('camila_memorias').insert({
      teacher_id: teacherId, titulo: limpioTitulo, contenido: limpioContenido,
    });
    if (error) throw errorLegible(error);
  },

  async eliminarRecuerdo(teacherId: string, id: string): Promise<void> {
    const { error } = await supabase.from('camila_memorias').delete()
      .eq('teacher_id', teacherId).eq('id', id);
    if (error) throw errorLegible(error);
  },
};
