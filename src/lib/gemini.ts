import { GoogleGenAI, GenerateContentParameters } from '@google/genai';

const getApiKey = () => {
  try {
    if (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_GEMINI_API_KEY) {
      return (import.meta as any).env.VITE_GEMINI_API_KEY;
    }
  } catch (e) {}
  
  try {
    // Vite statically replaces process.env.GEMINI_API_KEY via define in vite.config.ts
    const key = process.env.GEMINI_API_KEY;
    if (key && key.trim() !== '') return key;
  } catch (e) {}

  return '';
};

export const getGeminiApiKey = getApiKey;

const apiKey = getApiKey();

export const ai = new GoogleGenAI({ apiKey: apiKey || 'dummy-key-for-init' });

export async function generateContentWithRetry(
  params: GenerateContentParameters,
  maxRetries = 3
) {
  const currentKey = getApiKey();
  if (!currentKey || currentKey.trim() === '') {
    throw new Error('Falta configurar la clave de Gemini');
  }
  let lastError;
  for (let i = 0; i < maxRetries; i++) {
    try {
      // Ensure we use a stable model instead of experimental/non-existent ones if not explicitly passed,
      // but here we just pass the params.
      const response = await ai.models.generateContent(params);
      return response;
    } catch (error: any) {
      lastError = error;
      const errorMessage = error?.message || String(error);
      const is503 = errorMessage.includes('503') || errorMessage.includes('Unavailable') || errorMessage.includes('overloaded') || errorMessage.includes('UNAVAILABLE');
      const is429 = errorMessage.includes('429') && !errorMessage.includes('quota'); // 429 can be rate limit too, not just quota. But if it says "quota" it's permanent.

      if ((is503 || is429) && i < maxRetries - 1) {
        console.warn(`[GenAI Retry] Attempt ${i + 1} failed with ${errorMessage}. Retrying in ${1.5 * Math.pow(2, i)}s...`);
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, 1500 * Math.pow(2, i)));
        continue;
      }
      
      // If it's a 503 after retries, throw a friendly error
      if (is503) {
        throw new Error("Los servidores de IA están experimentando una altísima demanda en este momento. Por favor, intenta de nuevo en unos minutos.");
      }
      
      throw error; // If it's another error or we run out of retries, throw
    }
  }
  
  const errorMessage = lastError?.message || String(lastError);
  if (errorMessage.includes('503') || errorMessage.includes('UNAVAILABLE')) {
    throw new Error("Los servidores de IA están muy saturados. Por favor, intenta nuevamente más tarde.");
  }
  
  throw lastError;
}
