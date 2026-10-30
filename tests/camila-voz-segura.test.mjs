import assert from 'node:assert/strict';
import test from 'node:test';
import handler from '../api/camila-live-token.js';

const backupEnv = {
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
};
const originalFetch = globalThis.fetch;

function respuestaJson(datos, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => datos };
}

function respuestaServidor() {
  return {
    code: 200,
    headers: {},
    payload: null,
    setHeader(k, v) { this.headers[k.toLowerCase()] = v; },
    status(code) { this.code = code; return this; },
    json(datos) { this.payload = datos; return this; },
  };
}

async function llamar({ bearer = 'Bearer token-ficticio', method = 'POST' } = {}) {
  const res = respuestaServidor();
  await handler({ method, headers: bearer ? { authorization: bearer } : {}, body: {} }, res);
  return res;
}

test('la voz requiere POST y una sesión autenticada', async () => {
  process.env.GEMINI_API_KEY = 'clave-ficticia-no-real';
  process.env.SUPABASE_URL = 'https://supabase.ficticio.test';
  process.env.SUPABASE_ANON_KEY = 'anon-ficticia';
  globalThis.fetch = async () => { throw new Error('No debe llegar al proveedor'); };
  try {
    const method = await llamar({ method: 'GET' });
    assert.equal(method.code, 405);
    const noLogin = await llamar({ bearer: null });
    assert.equal(noLogin.code, 401);
    assert.match(noLogin.headers['cache-control'], /no-store/);
  } finally { globalThis.fetch = originalFetch; Object.assign(process.env, backupEnv); }
});

test('no emite token para un docente sin licencia PRO', async () => {
  process.env.GEMINI_API_KEY = 'clave-ficticia-no-real';
  process.env.SUPABASE_URL = 'https://supabase.ficticio.test';
  process.env.SUPABASE_ANON_KEY = 'anon-ficticia';
  let llamadasGoogle = 0;
  globalThis.fetch = async (url) => {
    if (String(url).includes('/auth/v1/user')) return respuestaJson({ id: 'docente-ficticio-inactivo', email: 'docente@example.test' });
    if (String(url).includes('/rest/v1/profiles')) return respuestaJson([{ is_active: false, access_level: 'free' }]);
    llamadasGoogle++;
    throw new Error('No debe solicitar token a Google');
  };
  try {
    const respuesta = await llamar();
    assert.equal(respuesta.code, 403);
    assert.equal(llamadasGoogle, 0);
  } finally { globalThis.fetch = originalFetch; Object.assign(process.env, backupEnv); }
});

test('el servidor emite solo un token efímero limitado y jamás la clave real', async () => {
  process.env.GEMINI_API_KEY = 'clave-ficticia-no-real';
  process.env.SUPABASE_URL = 'https://supabase.ficticio.test';
  process.env.SUPABASE_ANON_KEY = 'anon-ficticia';
  let configuracionGoogle;
  globalThis.fetch = async (url, init) => {
    if (String(url).includes('/auth/v1/user')) return respuestaJson({ id: 'docente-ficticio-activo-uno', email: 'docente@example.test' });
    if (String(url).includes('/rest/v1/profiles')) return respuestaJson([{ is_active: true, access_level: 'pro', expires_at: '2099-01-01T00:00:00Z' }]);
    if (String(url).endsWith('/auth_tokens')) {
      assert.equal(init.headers['x-goog-api-key'], 'clave-ficticia-no-real');
      configuracionGoogle = JSON.parse(init.body);
      return respuestaJson({ name: 'auth_tokens/token-temporal-de-un-solo-uso' });
    }
    throw new Error('URL inesperada');
  };
  try {
    const respuesta = await llamar();
    assert.equal(respuesta.code, 200);
    assert.equal(respuesta.payload.token, 'auth_tokens/token-temporal-de-un-solo-uso');
    assert.equal(respuesta.payload.model, 'gemini-3.8-live');
    assert.equal(configuracionGoogle.uses, 1);
    assert.equal(configuracionGoogle.bidiGenerateContentSetup.model, 'models/gemini-3.8-live');
    assert.deepEqual(configuracionGoogle.bidiGenerateContentSetup.generationConfig.responseModalities, ['AUDIO']);
    assert.equal(configuracionGoogle.bidiGenerateContentSetup.generationConfig.speechConfig.voiceConfig.prebuiltVoiceConfig.voiceName, 'Kore');
    assert.match(configuracionGoogle.bidiGenerateContentSetup.systemInstruction.parts[0].text, /Camila/);
    assert.ok(!('liveConnectConstraints' in configuracionGoogle));
    assert.ok(Date.parse(configuracionGoogle.expireTime) - Date.now() <= 181000);
    assert.ok(Date.parse(configuracionGoogle.newSessionExpireTime) - Date.now() <= 61000);
    assert.ok(!JSON.stringify(respuesta.payload).includes('clave-ficticia-no-real'));
    assert.match(respuesta.headers['cache-control'], /no-store/);
    const repetida = await llamar();
    assert.equal(repetida.code, 429);
  } finally { globalThis.fetch = originalFetch; Object.assign(process.env, backupEnv); }
});
