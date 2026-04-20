import { GoogleGenAI, GenerateContentParameters } from '@google/genai';

const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || 
               (process as any).env?.GEMINI_API_KEY || 
               '';

export const ai = new GoogleGenAI({ apiKey });

export async function generateContentWithRetry(
  params: GenerateContentParameters,
  maxRetries = 3
) {
  let lastError;
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await ai.models.generateContent(params);
      return response;
    } catch (error: any) {
      lastError = error;
      const errorMessage = error?.message || String(error);
      const is503 = errorMessage.includes('503') || errorMessage.includes('Unavailable') || errorMessage.includes('overloaded');
      const is429 = errorMessage.includes('429') && !errorMessage.includes('quota'); // 429 can be rate limit too, not just quota. But if it says "quota" it's permanent.

      if ((is503 || is429) && i < maxRetries - 1) {
        console.warn(`[GenAI Retry] Attempt ${i + 1} failed with ${errorMessage}. Retrying in ${1.5 * Math.pow(2, i)}s...`);
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, 1500 * Math.pow(2, i)));
        continue;
      }
      
      throw error; // If it's another error or we run out of retries, throw
    }
  }
  throw lastError;
}
