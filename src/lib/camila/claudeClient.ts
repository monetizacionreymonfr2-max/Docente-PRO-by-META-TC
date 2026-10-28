import { supabase } from '../supabase';

export type CamilaTurn = { role: 'user' | 'assistant'; content: string };
export type CamilaAdjuntoVisual = { mimeType: string; base64: string };
type BloqueClaude =
  | { type: 'text'; text: string }
  | { type: 'image' | 'document'; source: { type: 'base64'; media_type: string; data: string } };
type MensajeClaude = { role: 'user' | 'assistant'; content: string | BloqueClaude[] };

export async function askCamilaClaude(messages: CamilaTurn[]): Promise<string> {
  return sendCamilaClaude(messages, 'chat');
}

/** Envía imágenes/PDF únicamente durante este turno; no se incorporan al historial persistente. */
export async function askCamilaClaudeConAdjuntos(
  messages: CamilaTurn[], adjuntos: CamilaAdjuntoVisual[]
): Promise<string> {
  return sendCamilaClaude(conAdjuntosEnUltimoTurno(messages, adjuntos), 'chat');
}

function conAdjuntosEnUltimoTurno(messages: CamilaTurn[], adjuntos: CamilaAdjuntoVisual[]): MensajeClaude[] {
  if (!messages.length || messages[messages.length - 1].role !== 'user') {
    throw new Error('Se necesita una solicitud del docente para analizar adjuntos.');
  }
  const ultimo = messages[messages.length - 1];
  const bloques: BloqueClaude[] = adjuntos.map(({ mimeType, base64 }) => ({
    type: mimeType === 'application/pdf' ? 'document' : 'image',
    source: { type: 'base64', media_type: mimeType, data: base64 },
  }));
  bloques.push({ type: 'text', text: ultimo.content });
  return [...messages.slice(0, -1), { role: 'user', content: bloques }];
}

async function sendCamilaClaude(messages: MensajeClaude[], mode: 'chat' | 'formato'): Promise<string> {
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
  historial: Array<{ rol: 'user' | 'model'; texto: string }>,
  adjuntos: CamilaAdjuntoVisual[] = []
): Promise<string> {
  const messages: CamilaTurn[] = historial.slice(-6).map((item) => ({
    role: item.rol === 'model' ? 'assistant' : 'user',
    content: item.texto.slice(0, 12000),
  }));
  messages.push({ role: 'user', content: instruccionConContexto });
  return sendCamilaClaude(adjuntos.length ? conAdjuntosEnUltimoTurno(messages, adjuntos) : messages, 'formato');
}
