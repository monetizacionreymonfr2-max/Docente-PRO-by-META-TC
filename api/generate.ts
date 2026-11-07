import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';
// Lista permitida en este endpoint de Vercel. Evitamos importar un módulo
// TypeScript del frontend: el runtime Node ESM no resuelve esa ruta sin
// extensión y el proceso fallaba antes de atender cualquier solicitud.
const MODELOS_GEMINI_TEXTO = new Set(['gemini-3.5-flash', 'gemini-3.5-flash-lite']);

function esModeloGeminiTextoPermitido(modelo: unknown): modelo is string {
  return typeof modelo === 'string' && MODELOS_GEMINI_TEXTO.has(modelo);
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });
  const key = process.env.GEMINI_API_KEY;
  const url = process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
  if (!key || !url || !anonKey) return res.status(503).json({ error: 'Servicio de IA no configurado' });
  const token = req.headers.authorization?.match(/^Bearer (.+)$/)?.[1];
  if (!token) return res.status(401).json({ error: 'Sesión requerida' });
  const supabase = createClient(url, anonKey, { auth: { persistSession: false } });
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return res.status(401).json({ error: 'Sesión inválida' });
  const { model, contents, config } = req.body || {};
  if (typeof model !== 'string' || !contents) return res.status(400).json({ error: 'Solicitud inválida' });
  if (!esModeloGeminiTextoPermitido(model)) return res.status(400).json({ error: 'Modelo de IA no autorizado' });
  try {
    const ai = new GoogleGenAI({ apiKey: key });
    const result = await ai.models.generateContent({ model, contents, config });
    return res.status(200).json({ text: result.text || '' });
  } catch (e: any) {
    console.error('Gemini generation error', e?.status || e?.name || 'unknown');
    return res.status(502).json({ error: 'No se pudo generar el contenido. Inténtalo nuevamente.' });
  }
}
