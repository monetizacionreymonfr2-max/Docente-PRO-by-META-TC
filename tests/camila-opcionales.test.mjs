import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import workerHandler from '../api/camila-preview-pdf.js';

const oldEnv={...process.env};
const originalFetch=globalThis.fetch;
const getRes=()=>{
  const result={statusCode:200,headers:{},body:null};
  return {result,res:{
    setHeader:(k,v)=>{result.headers[k]=v;},
    status(n){result.statusCode=n;return this;},
    json(x){result.body=x;return this;},
  }};
};
const docx=Buffer.from('504b0304ffff', 'hex');
const inputWord=Buffer.concat([docx,Buffer.alloc(40)]);
const base64=inputWord.toString('base64');
const adminUser={id:'uuid-admin-ficticio',email:'monetizacionreymonfr2@gmail.com'};
function mockSupabase(){
  return async (url,opts)=>{
    const path=String(url);
    if(path.includes('/auth/v1/user'))return new Response(JSON.stringify(adminUser),{status:200});
    if(path.includes('/profiles?'))return new Response(JSON.stringify([{id:adminUser.id}]),{status:200});
    throw Error('Unexpected backend '+path);
  };
}
function setup(){process.env={...oldEnv,SUPABASE_URL:'https://example.supabase.co',SUPABASE_ANON_KEY:'anon-test'};
  globalThis.fetch=mockSupabase();}
function cleanup(){process.env={...oldEnv};globalThis.fetch=originalFetch;}

test('LibreOffice deshabilitado por defecto',async()=>{
  setup();
  try {
    process.env.VERCEL_ENV='preview';
    const {res,result}=getRes();
    await workerHandler({method:'POST',headers:{}},res);
    assert.equal(result.statusCode,404);
  } finally {cleanup();}
});
test('LibreOffice en producción requiere flag y sesión de administrador',async()=>{
  setup();
  try {
    process.env.VERCEL_ENV='production';
    let respuesta=getRes();
    await workerHandler({method:'POST',headers:{}},respuesta.res);
    assert.equal(respuesta.result.statusCode,404);
    process.env.CAMILA_LIBREOFFICE_ENABLED='true';
    respuesta=getRes();
    await workerHandler({method:'POST',headers:{},body:{archivoBase64:base64,consentimiento:true}},respuesta.res);
    assert.equal(respuesta.result.statusCode,401);
  } finally {cleanup();}
});
test('LibreOffice rechaza sesión anónima antes del worker',async()=>{
  setup();
  try {
    process.env.VERCEL_ENV='preview';process.env.CAMILA_LIBREOFFICE_PREVIEW_ENABLED='true';
    const {res,result}=getRes();
    await workerHandler({method:'POST',headers:{},body:{archivoBase64:base64,consentimiento:true}},res);
    assert.equal(result.statusCode,401);
  } finally {cleanup();}
});
test('LibreOffice verifica firma HMAC y entrega PDF ficticio',async()=>{
  setup();
  try {
    process.env.VERCEL_ENV='preview';process.env.CAMILA_LIBREOFFICE_PREVIEW_ENABLED='true';
    process.env.CAMILA_PDF_WORKER_URL='https://worker.example.com/convert';
    process.env.CAMILA_PDF_WORKER_SECRET='12345678901234567890123456789012';
    const upstream=globalThis.fetch;
    globalThis.fetch=async (url,opts)=>{
      if(String(url).includes('worker.example.com')){
        assert.match(opts.headers['X-Camila-Signature'],/^[a-f0-9]{64}$/);
        assert.equal(opts.body.toString('hex'),inputWord.toString('hex'));
        return new Response(Buffer.from('%PDF-'+'.'.repeat(60)),{status:200});
      }
      return upstream(url,opts);
    };
    const {res,result}=getRes();
    await workerHandler({method:'POST',headers:{authorization:'Bearer ficticio'},body:{archivoBase64:base64,consentimiento:true}},res);
    assert.equal(result.statusCode,200);
    assert.match(Buffer.from(result.body.pdfBase64,'base64').toString(),/^%PDF-/);
  } finally {cleanup();}
});
test('se retiró el endpoint opcional de Anthropic y no puede generar cargos',()=>{
  const ruta=fileURLToPath(new URL('../api/camila-docx-skills.js',import.meta.url));
  assert.equal(existsSync(ruta),false);
});
