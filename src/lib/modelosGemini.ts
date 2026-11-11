/** Modelos aprobados para texto y documentos de DOCENTY PRO. */
export const GEMINI_MODELO_DOCUMENTOS = 'gemini-3.5-flash';
export const GEMINI_MODELO_CHAT = 'gemini-3.5-flash-lite';

export function esModeloGeminiTextoPermitido(modelo: unknown): modelo is string {
  return modelo === GEMINI_MODELO_DOCUMENTOS || modelo === GEMINI_MODELO_CHAT;
}

