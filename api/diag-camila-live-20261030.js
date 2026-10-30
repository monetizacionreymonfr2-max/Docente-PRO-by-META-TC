import { timingSafeEqual } from 'node:crypto';

// Diagnóstico temporal de un solo uso en Preview. Este archivo se elimina
// después de identificar el error del proveedor; nunca va a producción.
const RAMA = 'fix-camila-voz-segura-20261029';
let intentos = 0;

function autorizado(recibido, esperado) {
  if (typeof recibido !== 'string' || !esperado) return false;
  const a = Buffer.from(recibido);
  const b = Buffer.from(esperado);
  return a.length === b.length && timingSafeEqual(a, b);
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store');
  if (process.env.VERCEL_ENV !== 'preview' || process.env.VERCEL_GIT_COMMIT_REF !== RAMA) {
    return res.status(404).json({ error: 'No disponible' });
  }
  if (req.method !== 'GET' || !autorizado(req.query.clave, process.env.CAMILA_VOICE_DIAG_KEY)) {
    return res.status(404).json({ error: 'No disponible' });
  }
  if (intentos++ > 0) return res.status(429).json({ error: 'Diagnóstico ya utilizado' });
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(503).json({ error: 'Falta configuración' });

  const ahora = Date.now();
  const base = {
    uses: 1,
    expireTime: new Date(ahora + 3 * 60_000).toISOString(),
    newSessionExpireTime: new Date(ahora + 60_000).toISOString(),
  };
  const configuracion = {
    responseModalities: ['AUDIO'],
    inputAudioTranscription: {},
    outputAudioTranscription: {},
    speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
    systemInstruction: { parts: [{ text: 'Eres Camila, asistente pedagógica de Venezuela.' }] },
  };
  const casos = [
    ['mínimo', base],
    ['restricción básica', { ...base, liveConnectConstraints: { model: 'models/gemini-3.8-live', config: { responseModalities: ['AUDIO'] } } }],
    ['restricción completa', { ...base, liveConnectConstraints: { model: 'models/gemini-3.8-live', config: configuracion } }],
  ];

  const pruebas = [];
  for (const [nombre, cuerpo] of casos) {
    try {
      const respuesta = await fetch('https://generativelanguage.googleapis.com/v1beta/auth_tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
        body: JSON.stringify(cuerpo),
        signal: AbortSignal.timeout(10000),
      });
      const datos = await respuesta.json().catch(() => ({}));
      const mensaje = String(datos?.error?.message || '').replaceAll(apiKey, '[oculto]').slice(0, 350);
      pruebas.push({ caso: nombre, codigo: respuesta.status, tokenCreado: respuesta.ok && typeof datos.name === 'string', tipoError: datos?.error?.status, motivo: mensaje });
    } catch (error) {
      pruebas.push({ caso: nombre, fallo: error?.name || 'Error' });
    }
  }
  return res.status(200).json({ pruebas });
}
