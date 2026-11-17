import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { readFileSync } from 'node:fs';
import handler from '../api/camila-edit-docx.js';

const SECRET = 'secret-for-tests-longer-than-thirty-two-bytes';
const DOCX = Buffer.concat([Buffer.from([0x50, 0x4b, 0x03, 0x04]), Buffer.from('WORD FICTICIO PARA TEST DE AUTENTICACION Y RESPUESTA DE SERVICIO')]).toString('base64');
const operation = { tipo: 'reemplazar_texto', buscar: 'Segundo', reemplazar: 'Quinto' };
const fields = ['VERCEL_ENV', 'CAMILA_DOCX_EDIT_PREVIEW_ENABLED', 'SUPABASE_URL',
  'SUPABASE_ANON_KEY', 'CAMILA_PDF_WORKER_URL', 'CAMILA_PDF_WORKER_SECRET'];

async function environment(env, action, fakeFetch) {
  const saved = Object.fromEntries(fields.map(field => [field, process.env[field]]));
  const fetchOriginal = globalThis.fetch;
  try {
    for (const field of fields) {
      if (env[field] === undefined) delete process.env[field];
      else process.env[field] = env[field];
    }
    if (fakeFetch) globalThis.fetch = fakeFetch;
    return await action();
  } finally {
    for (const field of fields) {
      if (saved[field] === undefined) delete process.env[field];
      else process.env[field] = saved[field];
    }
    globalThis.fetch = fetchOriginal;
  }
}

function response() {
  return {
    statusCode: 200, headers: {},
    setHeader(k, v) { this.headers[k] = v; },
    status(n) { this.statusCode = n; return this; },
    json(value) { this.payload = value; return this; },
  };
}

test('el proxy nunca se habilita en producción', async () => {
  await environment({ VERCEL_ENV: 'production', CAMILA_DOCX_EDIT_PREVIEW_ENABLED: 'true' }, async () => {
    const res = response();
    await handler({ method: 'POST', body: {} }, res);
    assert.equal(res.statusCode, 404);
    assert.equal(res.headers['Cache-Control'], 'private, no-store');
  });
});

test('Preview rechaza solicitudes sin sesión de administrador', async () => {
  await environment({ VERCEL_ENV: 'preview', CAMILA_DOCX_EDIT_PREVIEW_ENABLED: 'true' }, async () => {
    const res = response();
    await handler({ method: 'POST', headers: {}, body: {} }, res);
    assert.equal(res.statusCode, 401);
  });
});

test('un administrador ficticio puede enviar únicamente reemplazos firmados con HMAC', async () => {
  const requests = [];
  const fakeFetch = async (url, options) => {
    requests.push({ url, options });
    if (String(url).endsWith('/auth/v1/user')) {
      return Response.json({ id: 'teacher-ficticio', email: 'monetizacionreymonfr2@gmail.com' });
    }
    if (String(url).includes('/rest/v1/profiles')) {
      return Response.json([{ id: 'teacher-ficticio' }]);
    }
    assert.equal(url, 'https://worker.example.test/edit');
    const ts = options.headers['X-Camila-Timestamp'];
    const signature = createHmac('sha256', SECRET)
      .update(ts + '\n').update(options.body).digest('hex');
    assert.equal(options.headers['X-Camila-Signature'], signature);
    assert.equal(JSON.parse(options.body.toString()).operaciones.length, 1);
    return Response.json({ archivoBase64: DOCX, operacionesAplicadas: 1 });
  };
  await environment({
    VERCEL_ENV: 'preview',
    CAMILA_DOCX_EDIT_PREVIEW_ENABLED: 'true',
    SUPABASE_URL: 'https://fake.supabase.test',
    SUPABASE_ANON_KEY: 'clave-publica-ficticia',
    CAMILA_PDF_WORKER_URL: 'https://worker.example.test/convert',
    CAMILA_PDF_WORKER_SECRET: SECRET,
  }, async () => {
    const req = {
      method: 'POST', headers: { authorization: 'Bearer credencial-ficticia' },
      body: { archivoBase64: DOCX, operaciones: [operation], consentimiento: true, soloFicticio: true },
    };
    const res = response();
    await handler(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.payload.operacionesAplicadas, 1);
    assert.equal(res.payload.archivoBase64, DOCX);
    assert.equal(requests.length, 3);
  }, fakeFetch);
});

test('el editor experimental aparece solo bajo una bandera de administrador', () => {
  const page = readFileSync(new URL('../src/pages/CamilaFormato.tsx', import.meta.url), 'utf8');
  assert.match(page, /editorPythonVisible = isAdmin === true && opcionesEntorno\?\.VITE_CAMILA_DOCX_EDIT_TOOLS === 'true'/);
  assert.match(page, /onClick=\{solicitarEdicionWordPythonFicticio\}/);
  assert.match(page, /consentimiento: true, soloFicticio: true/);
});
