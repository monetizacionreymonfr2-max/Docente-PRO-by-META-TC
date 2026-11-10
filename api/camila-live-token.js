/**
 * Entrega únicamente una credencial temporal de Gemini Live a docentes PRO.
 * La API key permanente nunca sale del servidor. No guarda audio ni mensajes.
 */
const MODELO_VOZ = 'gemini-3.8-live';
const DURACION_SEGUNDOS = 9 * 60; // nueve minutos por llamada, incluida la reconexión controlada

const INSTRUCCION_VOZ = [
  'Eres Camila, asistente pedagógica de DOCENTY PRO para docentes de Venezuela.',
  'Conversa en español venezolano natural, con turnos breves y pausas; permite interrupciones sin hablar encima.',
  'Escucha primero la necesidad del docente; guía paso a paso, haciendo una sola pregunta cada vez y recordando lo ya dicho.',
  'Conoces el menú lateral de DOCENTY PRO: Inicio /home, Panel de Estudiantes /students, Gestor de PPA /ppa, Educación Especial /especial, Control de Asistencia /attendance, Sección Maternal /maternal, Planificador Diario /planner, Generador de Boletines /reports, IA Camila /camila, Mi Formato /mi-formato, Camila Formato /camila-formato y Ganar dinero con docentes /earn-money; Panel SaaS Admin /admin solo administradores.',
  'Cuando pregunten por ubicación, un paso de navegación o cómo utilizar un apartado, consulta la herramienta consultar_plataforma.',
  'No digas que pulsaste botones o verificaste una pantalla que no ves; si una opción no aparece, orienta según el menú disponible y pide aclaración.',
  'Ayudas exclusivamente con PPA, planificaciones, evaluación y temas educativos.',
  'Haz una pregunta a la vez cuando falte información. No inventes datos de estudiantes.',
  'Si el docente pide expresamente preparar, crear o modificar un documento,',
  'utiliza la herramienta preparar_documento con su instrucción exacta y explícales',
  'que podrán seguir conversando mientras se actualiza la vista previa del Word.',
  'La herramienta aplica las ediciones solicitadas al Word temporal de trabajo,',
  'permite Deshacer y nunca guarda documentos ni datos privados sin autorización.',
  'No afirmes que el documento quedó listo hasta recibir el resultado de la herramienta.',
  'Si la herramienta indica que Camila está ocupada, pide esperar sin iniciar otra tarea.',
  'Si detectas posibles errores pedagógicos, explícalos respetuosamente.',
  'No pidas datos personales de menores ni grabes o guardes la conversación.',
].join(' ');

const CONFIG_VOZ = {
  responseModalities: ['AUDIO'],
  inputAudioTranscription: {},
  outputAudioTranscription: {},
  speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
  systemInstruction: { parts: [{ text: INSTRUCCION_VOZ }] },
  tools: [{
    functionDeclarations: [{
      name: 'preparar_documento',
      description: 'Edita el Word temporal SOLO por solicitud explícita del docente, con vista previa y Deshacer. Nunca lo guarda permanentemente.',
      behavior: 'NON_BLOCKING',
      parameters: {
        type: 'OBJECT',
        properties: {
          instruccion: { type: 'STRING', description: 'Solicitud concreta del docente, fiel a lo que pidió por voz.' },
        },
        required: ['instruccion'],
      },
    }, {
      name: 'consultar_plataforma',
      description: 'Devuelve la ruta y pasos de uso de apartados reales del menú de DOCENTY PRO. Consulta antes de explicar navegación específica.',
      behavior: 'NON_BLOCKING',
      parameters: {
        type: 'OBJECT',
        properties: { consulta: { type: 'STRING', description: 'Sección o tarea del docente, como asistencia, PPA, Mi Formato o boletines.' } },
        required: ['consulta'],
      },
    }],
  }],
  // La compresión protege la continuidad de la sesión de voz frente al límite de contexto.
  contextWindowCompression: { slidingWindow: {} },
  sessionResumption: {},
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
    // Durante las pruebas, solo el administrador puede gastar minutos de voz.
    // El despliegue a docentes requiere habilitar CAMILA_LIVE_ROLLOUT=pro en Vercel.
    if (!esAdmin && process.env.CAMILA_LIVE_ROLLOUT !== 'pro') {
      return res.status(403).json({ error: 'Las llamadas de Camila todavía están en pruebas.' });
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
        // El SDK de Google transforma liveConnectConstraints en
        // bidiGenerateContentSetup antes de enviarlo por REST.
        // La clave permanente sigue en el servidor y el token queda restringido
        // a este modelo y configuración de conversación.
        bidiGenerateContentSetup: {
          model: `models/${MODELO_VOZ}`,
          generationConfig: {
            responseModalities: CONFIG_VOZ.responseModalities,
            speechConfig: CONFIG_VOZ.speechConfig,
          },
          systemInstruction: CONFIG_VOZ.systemInstruction,
          tools: CONFIG_VOZ.tools,
          inputAudioTranscription: CONFIG_VOZ.inputAudioTranscription,
          outputAudioTranscription: CONFIG_VOZ.outputAudioTranscription,
          contextWindowCompression: CONFIG_VOZ.contextWindowCompression,
          sessionResumption: CONFIG_VOZ.sessionResumption,
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
