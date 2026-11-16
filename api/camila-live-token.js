/**
 * Entrega únicamente una credencial temporal de Gemini Live a docentes PRO.
 * La API key permanente nunca sale del servidor. No guarda audio ni mensajes.
 */
const MODELO_VOZ = 'gemini-3.8-live';
const DURACION_SEGUNDOS = 180;

const INSTRUCCION_VOZ = [
  'Eres Camila, asistente pedagógica de DOCENTY PRO para docentes de Venezuela.',
  'PLAN PRO: dos dólares por treinta días, con acceso a las herramientas y Camila dentro de la plataforma.',
  'PLAN PLUS: cinco dólares por treinta días; incluye PRO y el servicio Camila Plus por WhatsApp para proyectos pedagógicos, planificaciones semanales, documentos institucionales y materiales de apoyo educativo. Se adapta al formato aportado por la institución.',
  'En WhatsApp Camila Plus no puede escuchar ni procesar audios; pide que los datos se envíen escritos. Se pueden adjuntar fotos y archivos Word o PDF. Esta limitación de WhatsApp no se aplica a la voz disponible en la plataforma.',
  'Presenta el servicio de WhatsApp como Camila Plus, sin explicar espontáneamente detalles operativos internos. No afirmes que tú lees las conversaciones de WhatsApp, envías sus mensajes automáticamente ni entregas allí archivos. No atribuyas a la política de privacidad afirmaciones que no estén documentadas.',
  'Si te preguntan directamente quién responde o si WhatsApp es un bot autónomo, responde con veracidad: Camila Plus combina herramientas tecnológicas con atención y revisión de personas; no es un bot autónomo de WhatsApp.',
  'El código permanente de atención DP identifica el expediente; no es el código de activación que se vende. La vigencia y el tipo de plan solo los verifica el panel administrativo.',
  'Nunca afirmes haber verificado pagos, activaciones o vigencia si no recibiste una confirmación del sistema. Remite a los canales oficiales para consultar cómo pagar; no inventes datos bancarios ni números telefónicos.',
  'No prometas que Mi Formato está habilitado para docentes cuando esa función siga en pruebas o restringida a administradores.',
  'Conversa en español venezolano, con calidez, respeto y respuestas claras.',
  'Ayudas exclusivamente con PPA, planificaciones, evaluación y temas educativos.',
  'Haz una pregunta a la vez cuando falte información. No inventes datos de estudiantes.',
  'No afirmes haber creado, editado ni guardado archivos en esta conversación de voz:',
  'para producir documentos dentro de la plataforma, indica las herramientas disponibles en su cuenta. Mi Formato solo se menciona si está habilitado para ese docente.',
  'Si detectas posibles errores pedagógicos, explícalos respetuosamente.',
  'No pidas datos personales de menores ni grabes o guardes la conversación.',
].join(' ');

const CONFIG_VOZ = {
  responseModalities: ['AUDIO'],
  inputAudioTranscription: {},
  outputAudioTranscription: {},
  speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
  systemInstruction: { parts: [{ text: INSTRUCCION_VOZ }] },
};

// Protección adicional de mejor esfuerzo por instancia. No sustituye una cuota
// distribuida o los límites de gasto del proveedor.
const ultimasSolicitudes = new Map();

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, private');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const url = process.env.SUPABASE_URL;
  const anon = process.env.SUPABASE_ANON_KEY;
  const key = process.env.GEMINI_API_KEY;
  if (!url || !anon || !key) return res.status(503).json({ error: 'Voz no configurada' });
  const bearer = req.headers.authorization || '';
  if (!/^Bearer \S+$/.test(bearer)) return res.status(401).json({ error: 'Inicia sesión para hablar con Camila' });

  try {
    const base = url.replace(/\/$/, '');
    const auth = await fetch(`${base}/auth/v1/user`, {
      headers: { apikey: anon, Authorization: bearer },
      signal: AbortSignal.timeout(8000),
    });
    if (!auth.ok) return res.status(401).json({ error: 'Sesión inválida' });
    const user = await auth.json();
    if (!user?.id) return res.status(401).json({ error: 'Sesión inválida' });

    const id = encodeURIComponent(user.id);
    const profileResponse = await fetch(`${base}/rest/v1/profiles?id=eq.${id}&select=is_active,access_level,expires_at&limit=1`, {
      headers: { apikey: anon, Authorization: bearer },
      signal: AbortSignal.timeout(8000),
    });
    if (!profileResponse.ok) return res.status(503).json({ error: 'No se pudo verificar la licencia' });
    const perfiles = await profileResponse.json();
    const perfil = Array.isArray(perfiles) ? perfiles[0] : null;
    const administradores = new Set(['monetizacionreymonfr2@gmail.com', 'tecnomundo235@gmail.com']);
    const esAdmin = administradores.has(String(user.email || '').trim().toLowerCase());
    const expira = perfil?.expires_at ? Date.parse(perfil.expires_at) : null;
    if (!esAdmin && (!perfil?.is_active || perfil.access_level !== 'pro' ||
      (expira !== null && (!Number.isFinite(expira) || expira <= Date.now())))) {
      return res.status(403).json({ error: 'La conversación por voz requiere una licencia PRO activa' });
    }

    const anterior = ultimasSolicitudes.get(user.id) || 0;
    if (Date.now() - anterior < 8000) return res.status(429).json({ error: 'Espera unos segundos antes de iniciar otra llamada' });
    ultimasSolicitudes.set(user.id, Date.now());
    if (ultimasSolicitudes.size > 2000) ultimasSolicitudes.clear();

    const actual = Date.now();
    const upstream = await fetch('https://generativelanguage.googleapis.com/v1beta/auth_tokens', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({
        uses: 1,
        expireTime: new Date(actual + DURACION_SEGUNDOS * 1000).toISOString(),
        newSessionExpireTime: new Date(actual + 60_000).toISOString(),
        // El REST de auth_tokens recibe la configuración como
        // bidiGenerateContentSetup, no como liveConnectConstraints (nombre SDK).
        // La clave permanente sigue en el servidor y el token queda restringido
        // a este modelo y configuración de conversación.
        bidiGenerateContentSetup: {
          model: `models/${MODELO_VOZ}`,
          generationConfig: {
            responseModalities: CONFIG_VOZ.responseModalities,
            speechConfig: CONFIG_VOZ.speechConfig,
          },
          systemInstruction: CONFIG_VOZ.systemInstruction,
          inputAudioTranscription: CONFIG_VOZ.inputAudioTranscription,
          outputAudioTranscription: CONFIG_VOZ.outputAudioTranscription,
        },
      }),
      signal: AbortSignal.timeout(12000),
    });
    if (!upstream.ok) {
      console.error('[Camila voz] Gemini auth_tokens HTTP:', upstream.status);
      return res.status(502).json({ error: 'No se pudo abrir la conversación por voz. Intenta más tarde.' });
    }
    const token = await upstream.json();
    if (typeof token?.name !== 'string' || !token.name.startsWith('auth_tokens/')) {
      return res.status(502).json({ error: 'La conexión de voz no devolvió una sesión válida' });
    }
    return res.status(200).json({ token: token.name, model: MODELO_VOZ, config: CONFIG_VOZ, duracionSegundos: DURACION_SEGUNDOS });
  } catch (error) {
    console.error('[Camila voz] Error iniciando sesión temporal:', error?.name || 'error');
    return res.status(503).json({ error: 'No se pudo conectar la voz de Camila' });
  }
}
