import test from 'node:test';
import assert from 'node:assert/strict';
import workerHandler from '../api/camila-preview-pdf.js';
import skillHandler from '../api/camila-docx-skills.js';

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
const base64=docx.toString('base64');
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
        assert.equal(opts.body.toString('hex'),docx.toString('hex'));
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
test('Skill no se activa sin flag Preview',async()=>{
  setup();
  try {
    const {res,result}=getRes();
    await skillHandler({method:'POST',headers:{},body:{}},res);
    assert.equal(result.statusCode,404);
  } finally {cleanup();}
});
test('Skill no permite documentos sin consentimiento ficticio',async()=>{
  setup();
  try {
    process.env.VERCEL_ENV='preview';process.env.CAMILA_DOCX_SKILLS_ENABLED='true';
    const {res,result}=getRes();
    await skillHandler({method:'POST',headers:{authorization:'Bearer ficticio'},body:{
      archivoBase64:base64,instruccion:'Adaptar el PPA completo y conservar tablas',consentimiento:true,soloFicticio:false,
    }},res);
    assert.equal(result.statusCode,403);
  } finally {cleanup();}
});
test('Skill carga, ejecuta, descarga y elimina archivos del workspace ficticios',async()=>{
  setup();
  try {
    process.env.VERCEL_ENV='preview';process.env.CAMILA_DOCX_SKILLS_ENABLED='true';process.env.ANTHROPIC_API_KEY='fake-secret';
    const supabaseFetch=globalThis.fetch;
    const deletes=[];let sawSkill=false;
    globalThis.fetch=async(url,opts={})=>{
      const path=String(url);
      if(!path.startsWith('https://api.anthropic.com'))return supabaseFetch(url,opts);
      if(opts.method==='DELETE'){deletes.push(path);return new Response('{}',{status:200});}
      if(path.endsWith('/v1/files') && opts.method==='POST'){
        assert.ok(opts.body instanceof FormData);
        return new Response(JSON.stringify({id:'file_input123'}),{status:200});
      }
      if(path.endsWith('/v1/messages')){
        const payload=JSON.parse(opts.body);
        assert.equal(payload.container.skills[0].skill_id,'docx');
        assert.equal(payload.tools[0].name,'code_execution');
        assert.equal(payload.messages[0].content[1].file_id,'file_input123');
        sawSkill=true;
        return new Response(JSON.stringify({
          stop_reason:'end_turn',usage:{input_tokens:100,output_tokens:200},
          content:[{type:'bash_code_execution_tool_result',
            content:{type:'bash_code_execution_result',content:[{file_id:'file_output456'}]}}],
        }),{status:200});
      }
      if(path.endsWith('/v1/files/file_output456'))return new Response(JSON.stringify({
        downloadable:true,filename:'PPA_ficticio.docx',size_bytes:docx.length,
      }),{status:200});
      if(path.endsWith('/v1/files/file_output456/content'))return new Response(docx,{status:200});
      throw Error('Unexpected Anthropic request '+path);
    };
    const {res,result}=getRes();
    await skillHandler({method:'POST',headers:{authorization:'Bearer ficticio'},body:{
      archivoBase64:Buffer.concat([docx,Buffer.alloc(40)]).toString('base64'),
      instruccion:'Adaptar este Word ficticio al segundo grado',consentimiento:true,soloFicticio:true,
    }},res);
    assert.equal(result.statusCode,200,JSON.stringify(result.body));
    assert.equal(result.body.requiereAprobacion,true);
    assert.equal(sawSkill,true);assert.equal(deletes.length,2);
  } finally {cleanup();}
});
