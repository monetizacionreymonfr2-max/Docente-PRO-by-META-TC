import { GenerateContentParameters } from '@google/genai';

export async function generateContentWithRetry(
  params: GenerateContentParameters,
  maxRetries = 3
) {
  let lastError;
  for (let i = 0; i < maxRetries; i++) {
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: params.model,
          prompt: params.contents,
          config: params.config
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error generating content from server');
      }

      return { text: data.text };
    } catch (error: any) {
      lastError = error;
      const errorMessage = error?.message || String(error);
      const is503 = errorMessage.includes('503') || errorMessage.includes('Unavailable') || errorMessage.includes('overloaded') || errorMessage.includes('UNAVAILABLE');
      const is429 = errorMessage.includes('429') && !errorMessage.includes('quota');

      if ((is503 || is429) && i < maxRetries - 1) {
        console.warn(`[GenAI Retry] Attempt ${i + 1} failed with ${errorMessage}. Retrying in ${1.5 * Math.pow(2, i)}s...`);
        await new Promise(resolve => setTimeout(resolve, 1500 * Math.pow(2, i)));
        continue;
      }

      if (is503) {
        throw new Error("Los servidores de IA están experimentando una altísima demanda en este momento. Por favor, intenta de nuevo en unos minutos.");
      }

      throw error;
    }
  }

  const errorMessage = lastError?.message || String(lastError);
  if (errorMessage.includes('503') || errorMessage.includes('UNAVAILABLE')) {
    throw new Error("Los servidores de IA están muy saturados. Por favor, intenta nuevamente más tarde.");
  }

  throw lastError;
}
