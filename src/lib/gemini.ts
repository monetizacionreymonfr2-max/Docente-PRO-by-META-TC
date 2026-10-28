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
      const payload = await response.json();
      if (!response.ok) {
        const error = new Error(payload.error || 'Error al generar contenido');
        (error as any).status = response.status;
        throw error;
      }
      return { text: payload.text || '' };
    } catch (error: any) {
      lastError = error;
      if (![429, 503].includes(error.status) || attempt === maxRetries - 1) break;
      await new Promise(resolve => setTimeout(resolve, 1500 * 2 ** attempt));
    }
  }
  throw lastError || new Error('No se pudo generar contenido.');
}
