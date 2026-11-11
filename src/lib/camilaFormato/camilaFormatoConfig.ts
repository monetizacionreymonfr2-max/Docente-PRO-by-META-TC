
import { GEMINI_MODELO_CHAT, GEMINI_MODELO_DOCUMENTOS } from '../modelosGemini';

export const DEFAULT_CAMILA_FORMATO_MODEL = GEMINI_MODELO_DOCUMENTOS;

export interface ModeloGeminiInfo {
  name: string; // ej: "models/gemini-2.5-flash"
  id: string; // ej: "gemini-2.5-flash"
  displayName?: string;
  description?: string;
  supportedActions?: string[];
}

/**
 * Lista los modelos disponibles usando ai.models.list() que soportan generateContent
 */
export async function listarModelosDisponibles(): Promise<ModeloGeminiInfo[]> {
  // El servidor elige el modelo por función; este listado es informativo.
  return [
    { name: `models/${GEMINI_MODELO_DOCUMENTOS}`, id: GEMINI_MODELO_DOCUMENTOS, displayName: 'Gemini 3.5 Flash', description: 'PPA, planificaciones y documentos Word' },
    { name: `models/${GEMINI_MODELO_CHAT}`, id: GEMINI_MODELO_CHAT, displayName: 'Gemini 3.5 Flash-Lite', description: 'Consultas pedagógicas rápidas' },
  ];
}
