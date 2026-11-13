/** Las respuestas de Gemini solo contienen líneas de texto; el motor local valida IDs y OOXML. */
import { generarBloquePpaClaude } from '../../camila/claudeClient';
import { construirInstruccionAdaptacion, type ProveedorPropuestas } from './propuestasBloques';

export const proveedorGeminiAdaptacion: ProveedorPropuestas = async (peticion) => {
  const bruto = await generarBloquePpaClaude('textos', construirInstruccionAdaptacion(peticion));
  if (!bruto || typeof bruto !== 'object' ||
      !Array.isArray((bruto as { resultados?: unknown }).resultados)) {
    throw new Error('Gemini no devolvió propuestas pedagógicas con la estructura requerida.');
  }
  const salida: Record<string, string[]> = Object.create(null);
  for (const entrada of (bruto as { resultados: unknown[] }).resultados) {
    if (!entrada || typeof entrada !== 'object') throw new Error('Respuesta incompleta de Gemini.');
    const { id, lineas } = entrada as { id?: unknown; lineas?: unknown };
    if (typeof id !== 'string' || !Array.isArray(lineas) ||
        !lineas.every((l) => typeof l === 'string') || Object.hasOwn(salida, id)) {
      throw new Error('Gemini devolvió un bloque duplicado o inválido.');
    }
    salida[id] = lineas as string[];
  }
  return salida;
};
