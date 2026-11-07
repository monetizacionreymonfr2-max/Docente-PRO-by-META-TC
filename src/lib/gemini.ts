import type { GenerateContentParameters } from '@google/genai';
import { supabase } from './supabase';

/** Gemini is invoked on the server. Never read or bundle a private API key in the browser. */
export async function generateContentWithRetry(params: GenerateContentParameters, maxRetries = 3): Promise<{ text: string }> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error('Inicia sesión para utilizar las funciones de IA.');
  let lastError: Error | undefined;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify(params),
      });
      // Algunas fallas de infraestructura de Vercel devuelven texto plano
      // (por ejemplo, "A server error has occurred") y no JSON.
      // No incluir esa respuesta técnica ni datos internos en el chat docente.
      let payload: { error?: string; text?: string };
      try {
        payload = await response.json();
      } catch {
        const error = new Error(response.ok
          ? 'Camila recibió una respuesta inesperada. Inténtelo nuevamente.'
          : 'No se pudo procesar el formato en este momento. Inténtelo nuevamente.');
        (error as any).status = response.status;
        throw error;
      }
      if (!response.ok) {
        const error = new Error(typeof payload.error === 'string'
          ? payload.error
          : 'No se pudo generar el contenido. Inténtelo nuevamente.');
        (error as any).status = response.status;
        throw error;
      }
      if (typeof payload.text !== 'string') {
        throw new Error('Camila recibió una respuesta incompleta. Inténtelo nuevamente.');
      }
      return { text: payload.text };
    } catch (error: any) {
      lastError = error;
      if (![429, 503].includes(error.status) || attempt === maxRetries - 1) break;
      await new Promise(resolve => setTimeout(resolve, 1500 * 2 ** attempt));
    }
  }
  throw lastError || new Error('No se pudo generar contenido.');
}
