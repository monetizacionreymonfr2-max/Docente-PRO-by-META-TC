import { supabase } from '../supabase';

export type CamilaTurn = { role: 'user' | 'assistant'; content: string };

export async function askCamilaClaude(messages: CamilaTurn[]): Promise<string> {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error || !session?.access_token) throw new Error('Inicie sesión para conversar con Camila.');
  const response = await fetch('/api/camila-claude', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
    body: JSON.stringify({ messages: messages.slice(-20) }),
  });
  let payload: { text?: string; error?: string };
  try { payload = await response.json(); } catch { throw new Error('La respuesta del servidor no es válida.'); }
  if (!response.ok) throw new Error(payload.error || 'Camila no está disponible en este momento.');
  if (typeof payload.text !== 'string' || !payload.text.trim()) throw new Error('Camila no devolvió contenido.');
  return payload.text;
}
