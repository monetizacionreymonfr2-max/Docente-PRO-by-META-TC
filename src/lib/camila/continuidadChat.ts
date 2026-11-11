/**
 * Solo se conserva el ID de una conversación que el docente decidió guardar.
 * Nunca se escriben mensajes, audios, documentos ni tokens en localStorage.
 * El contenido se recupera exclusivamente desde Supabase con RLS y sesión válida.
 */
const PREFIJO = 'docenty.camila.chat-autorizado.v1.';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Almacenamiento = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

function clave(teacherId: string): string | null {
  return UUID.test(teacherId) ? `${PREFIJO}${teacherId}` : null;
}

export function leerUltimoChatAutorizado(storage: Almacenamiento, teacherId: string): string | null {
  const k = clave(teacherId);
  if (!k) return null;
  try {
    const id = storage.getItem(k);
    return id && UUID.test(id) ? id : null;
  } catch {
    return null;
  }
}

export function recordarUltimoChatAutorizado(storage: Almacenamiento, teacherId: string, id: string): void {
  const k = clave(teacherId);
  if (!k || !UUID.test(id)) return;
  try { storage.setItem(k, id); } catch { /* almacenamiento bloqueado */ }
}

export function olvidarUltimoChatAutorizado(storage: Almacenamiento, teacherId: string): void {
  const k = clave(teacherId);
  if (!k) return;
  try { storage.removeItem(k); } catch { /* almacenamiento bloqueado */ }
}
