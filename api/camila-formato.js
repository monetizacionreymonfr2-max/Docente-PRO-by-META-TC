import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';
import {
  SYSTEM, SYSTEM_FORMATO, SYSTEM_PPA_BLOQUE, SYSTEM_PPA_COMPLETO,
  FORMATO_RESPONSE_SCHEMA, PPA_BLOQUE_SCHEMAS, PPA_COMPLETO_SCHEMA,
} from './camila-claude.js';

// Ruta independiente para Mi Formato. Usa Gemini en el servidor:
// ninguna clave del proveedor se envía al navegador.
const ADMIN_EMAILS = new Set([
  'monetizacionreymonfr2@gmail.com',
  'tecnomundo235@gmail.com',
]);
const ALLOWED_MODES = new Set(['chat', 'formato', 'ppa_bloque', 'ppa_completo']);
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']);
const MAX_BASE64_PER_FILE = 2_800_000;
const MAX_BASE64_PER_REQUEST = 3_500_000;
const REQUIRED_PPA_FIELDS = [
  'titulo', 'preguntaGeneradora', 'productoFinal', 'vinculacionNacional',
  'contexto', 'necesidades', 'potencialidades', 'instrumentosDiagnostico',
  'propositoGeneral', 'propositosEspecificos', 'cierre',
];

function validMessage(m, position, total, mode) {
  if (!m || (m.role !== 'user' && m.role !== 'assistant')) return false;
  const maxText = mode === 'chat' ? 12000 : 16000;
  if (typeof m.content === 'string') {
    return m.content.trim().length > 0 && m.content.length <= maxText;
  }
  if (!Array.isArray(m.content) || m.role !== 'user' || position !== total - 1 ||
      m.content.length < 2 || m.content.length > 4 ||
      mode === 'ppa_bloque' || mode === 'ppa_completo') return false;

  let textCount = 0;
  let binaryCount = 0;
  let totalSize = 0;
  for (const block of m.content) {
    if (block?.type === 'text') {
      if (Object.keys(block).some((k) => k !== 'type' && k !== 'text') ||
          typeof block.text !== 'string' || !block.text.trim() || block.text.length > maxText) return false;
      textCount++;
      continue;
    }
    if (block?.type !== 'image' && block?.type !== 'document') return false;
    const source = block.source;
    if (!source || source.type !== 'base64' || !ALLOWED_MIME.has(source.media_type) ||
        (block.type === 'document' && source.media_type !== 'application/pdf') ||
        (block.type === 'image' && source.media_type === 'application/pdf') ||
        Object.keys(source).some((k) => !['type', 'media_type', 'data'].includes(k)) ||
        Object.keys(block).some((k) => !['type', 'source'].includes(k)) ||
        typeof source.data !== 'string' || source.data.length > MAX_BASE64_PER_FILE ||
        source.data.length < 4 || !/^[A-Za-z0-9+/]+={0,2}$/.test(source.data)) return false;
    totalSize += source.data.length;
    binaryCount++;
  }
  return textCount === 1 && binaryCount >= 1 && binaryCount <= 2 &&
    totalSize <= MAX_BASE64_PER_REQUEST;
}

function convertirMensajes(messages) {
  return messages.map((message) => ({
    role: message.role === 'assistant' ? 'model' : 'user',
    parts: typeof message.content === 'string'
      ? [{ text: message.content }]
      : message.content.map((block) => block.type === 'text'
        ? { text: block.text }
        : { inlineData: { mimeType: block.source.media_type, data: block.source.data } }),
  }));
}

// Gemini acepta JSON Schema con "enum" pero no "const" en este contrato.
function esquemaGemini(valor) {
  if (Array.isArray(valor)) return valor.map(esquemaGemini);
  if (!valor || typeof valor !== 'object') return valor;
  const res = {};
  for (const [key, item] of Object.entries(valor)) {
    if (key === 'const') res.enum = [item];
    else res[key] = esquemaGemini(item);
  }
  return res;
}

function respuestaEstructuradaValida(mode, blockType, texto) {
  try {
    const obj = JSON.parse(texto);
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return false;
    if (mode === 'formato') {
      return typeof obj.respuesta === 'string' && Array.isArray(obj.operaciones) &&
        obj.operaciones.length <= 100 &&
        obj.operaciones.every((op) => op && typeof op.tipo === 'string' &&
          ['set_celda', 'set_parrafo', 'set_encabezado', 'reemplazar_filas',
            'agregar_filas', 'eliminar_filas', 'eliminar_ficha', 'clonar_ficha',
            'set_titulo', 'vaciar_todo'].includes(op.tipo));
    }
    if (mode === 'ppa_completo') {
      return REQUIRED_PPA_FIELDS.every((k) => typeof obj[k] === 'string') &&
        Array.isArray(obj.semanas) && obj.semanas.length > 0 && obj.semanas.length <= 12;
    }
    const key = blockType === 'textos' ? 'resultados' : blockType === 'area' ? 'celdas' : 'filas';
    return Array.isArray(obj[key]);
  } catch {
    return false;
  }
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const key = process.env.GEMINI_API_KEY;
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const anon = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  if (!key || !url || !anon) return res.status(503).json({ error: 'Camila no está configurada en este entorno' });
  const token = typeof req.headers.authorization === 'string'
    ? req.headers.authorization.match(/^Bearer ([A-Za-z0-9._~-]+)$/)?.[1] : null;
  if (!token) return res.status(401).json({ error: 'Sesión requerida' });

  const mode = req.body?.mode || 'chat';
  const blockType = req.body?.blockType;
  if (!ALLOWED_MODES.has(mode) ||
      (mode === 'ppa_bloque' && !Object.hasOwn(PPA_BLOQUE_SCHEMAS, blockType))) {
    return res.status(400).json({ error: 'Tipo de solicitud inválido' });
  }
  const messages = req.body?.messages;
  const maxMessages = ['ppa_bloque', 'ppa_completo'].includes(mode) ? 2 : mode === 'formato' ? 8 : 20;
  if (!Array.isArray(messages) || messages.length < 1 || messages.length > maxMessages ||
      messages[messages.length - 1]?.role !== 'user' ||
      messages.some((m, index) => !validMessage(m, index, messages.length, mode))) {
    return res.status(400).json({ error: 'Mensajes inválidos' });
  }

  try {
    const userClient = createClient(url, anon, {
      global: { headers: { Authorization: 'Bearer ' + token } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser(token);
    if (authError || !user?.id) return res.status(401).json({ error: 'Sesión inválida' });

    // Mi Formato permanece cerrado a docentes en esta fase; proteger también
    // la API evita usar créditos de IA saltándose el control de interfaz.
    if (!ADMIN_EMAILS.has(String(user.email || '').trim().toLowerCase())) {
      return res.status(403).json({ error: 'Mi Formato está disponible temporalmente para pruebas administrativas' });
    }
    const { data: profile, error: profileError } = await userClient
      .from('profiles').select('id,role').eq('id', user.id).maybeSingle();
    if (profileError || !profile) {
      return res.status(403).json({ error: 'No se pudo verificar el acceso administrativo' });
    }

    const structured = mode !== 'chat';
    const schema = mode === 'formato' ? FORMATO_RESPONSE_SCHEMA
      : mode === 'ppa_completo' ? PPA_COMPLETO_SCHEMA : PPA_BLOQUE_SCHEMAS[blockType];
    const instruction = mode === 'formato' ? SYSTEM_FORMATO
      : mode === 'ppa_completo' ? SYSTEM_PPA_COMPLETO
        : mode === 'ppa_bloque' ? SYSTEM_PPA_BLOQUE : SYSTEM;
    const reglasEdicion = '\n\nEl docente puede solicitar cambios directamente; el editor hará una vista previa y conservará Deshacer. No exija aprobaciones repetidas antes de preparar una edición explícitamente solicitada. Nunca afirme haber guardado el archivo o una memoria sin confirmación del almacenamiento. Ante datos esenciales ausentes, haga solo una pregunta.';
    const model = process.env.CAMILA_FORMATO_GEMINI_MODEL || 'gemini-3.1-flash-lite';
    const ai = new GoogleGenAI({ apiKey: key });
    const result = await ai.models.generateContent({
      model,
      contents: convertirMensajes(messages),
      config: {
        systemInstruction: instruction + reglasEdicion,
        temperature: 0.2,
        maxOutputTokens: mode === 'ppa_completo' ? 24576 : mode === 'chat' ? 4096 : 12288,
        ...(structured ? {
          responseMimeType: 'application/json',
          responseJsonSchema: esquemaGemini(schema),
        } : {}),
      },
    });
    const answer = typeof result.text === 'string' ? result.text.trim() : '';
    if (!answer || answer.length > 750000) {
      return res.status(502).json({ error: 'Camila no devolvió contenido válido' });
    }
    if (structured && !respuestaEstructuradaValida(mode, blockType, answer)) {
      return res.status(502).json({ error: 'Camila no devolvió una estructura documental válida' });
    }
    return res.status(200).json({ text: answer });
  } catch (error) {
    // No registrar documentos, datos del docente, tokens ni claves en los logs.
    const tipo = error?.name === 'TimeoutError' ? 'timeout' : 'respuesta_no_disponible';
    console.error('[Camila Formato Gemini]', tipo);
    return res.status(502).json({ error: 'Camila no pudo completar la solicitud. Inténtelo de nuevo.' });
  }
}
