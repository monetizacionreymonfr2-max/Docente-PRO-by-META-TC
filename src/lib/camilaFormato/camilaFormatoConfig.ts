import { ai } from '../gemini';

export const DEFAULT_CAMILA_FORMATO_MODEL = 'gemini-2.5-flash';

const STORAGE_KEY_MODEL = 'docenty_camila_formato_model';

/**
 * Obtiene el modelo configurado para Camila Formato
 */
export function getCamilaFormatoModel(): string {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_MODEL);
    if (saved && saved.trim()) return saved.trim();
  } catch (e) {}
  return DEFAULT_CAMILA_FORMATO_MODEL;
}

/**
 * Guarda el modelo preferido para Camila Formato
 */
export function setCamilaFormatoModel(modelName: string): void {
  try {
    localStorage.setItem(STORAGE_KEY_MODEL, modelName.trim());
  } catch (e) {}
}

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
  try {
    const response = await (ai.models as any).list();
    const items: any[] = Array.isArray(response) ? response : response?.models || [];
    
    const validos: ModeloGeminiInfo[] = [];
    for (const m of items) {
      const actions: string[] = m.supportedActions || m.supportedGenerationMethods || [];
      const supportsGenerate = actions.length === 0 || actions.some((a: string) => a.toLowerCase().includes('generatecontent'));
      
      if (supportsGenerate) {
        const id = (m.name || '').replace(/^models\//, '');
        // Filtrar modelos obsoletos o de embeddings
        if (id.includes('embedding') || id.includes('aqa') || id.includes('imagen')) continue;
        
        validos.push({
          name: m.name || `models/${id}`,
          id: id,
          displayName: m.displayName || id,
          description: m.description || '',
          supportedActions: actions,
        });
      }
    }

    if (validos.length > 0) return validos;
  } catch (e) {
    console.warn('[CamilaFormatoConfig] Error al consultar ai.models.list():', e);
  }

  // Fallback seguro con modelos oficiales estándar
  return [
    { name: 'models/gemini-2.5-flash', id: 'gemini-2.5-flash', displayName: 'Gemini 2.5 Flash (Recomendado)', description: 'Rápido, preciso y altamente estructurado.' },
    { name: 'models/gemini-2.5-pro', id: 'gemini-2.5-pro', displayName: 'Gemini 2.5 Pro', description: 'Máxima capacidad analítica para documentos extensos.' },
    { name: 'models/gemini-3.1-flash-lite-preview', id: 'gemini-3.1-flash-lite-preview', displayName: 'Gemini 3.1 Flash Lite Preview', description: 'Ultra rápido y económico.' },
  ];
}
