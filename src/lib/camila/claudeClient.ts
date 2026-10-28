import { supabase } from '../supabase';

export type CamilaTurn = { role: 'user' | 'assistant'; content: string };

export async function askCamilaClaude(messages: CamilaTurn[]): Promise<string> {
  return sendCamilaClaude(messages, 'chat');
}

async function sendCamilaClaude(messages: CamilaTurn[], mode: 'chat' | 'formato'): Promise<string> {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error || !session?.access_token) throw new Error('Inicie sesión para conversar con Camila.');
  const response = await fetch('/api/camila-claude', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
    body: JSON.stringify({ mode, messages: messages.slice(mode === 'formato' ? -8 : -20) }),
  });
  let payload: { text?: string; error?: string };
  try { payload = await response.json(); } catch { throw new Error('La respuesta del servidor no es válida.'); }
  if (!response.ok) throw new Error(payload.error || 'Camila no está disponible en este momento.');
  if (typeof payload.text !== 'string' || !payload.text.trim()) throw new Error('Camila no devolvió contenido.');
  return payload.text;
}

/** Obtiene operaciones estructuradas de Claude; la ejecución queda en el editor de Word. */
export async function askCamilaFormatoClaude(
  instruccionConContexto: string,
  historial: Array<{ rol: 'user' | 'model'; texto: string }>
): Promise<string> {
  const messages: CamilaTurn[] = historial.slice(-4).map((item) => ({
    role: item.rol === 'model' ? 'assistant' : 'user',
    content: item.texto.slice(0, 12000),
  }));
  messages.push({ role: 'user', content: instruccionConContexto });
  return sendCamilaClaude(messages, 'formato');
}
