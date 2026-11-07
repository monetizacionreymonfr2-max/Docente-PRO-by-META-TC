import assert from 'node:assert/strict';
import { afterEach, beforeEach, test } from 'node:test';
import handler, { esquemaGemini, PPA_COMPLETO_SCHEMA, SYSTEM_PPA_COMPLETO } from '../api/camila-gemini.js';

const envKeys=['GEMINI_API_KEY','CAMILA_GEMINI_CHAT_MODEL','CAMILA_GEMINI_DOC_MODEL',
  'SUPABASE_URL','SUPABASE_ANON_KEY','SUPABASE_SERVICE_ROLE_KEY','CAMILA_CUOTAS_ACTIVAS'];
const envOriginal=Object.fromEntries(envKeys.map(k=>[k,process.env[k]]));
const fetchOriginal=globalThis.fetch;
const errorOriginal=console.error;
const admin={id:'admin-ficticio',email:'monetizacionreymonfr2@gmail.com'};

const json=(value,status=200)=>new Response(JSON.stringify(value),{status});
const geminiRespuesta=(text,usageMetadata={promptTokenCount:12,candidatesTokenCount:18})=>
  json({candidates:[{content:{role:'model',parts:[{text}]},finishReason:'STOP'}],usageMetadata});
const makeResponse=()=>({statusCode:200,body:null,headers:{},setHeader(k,v){this.headers[k]=v;return this;},
  status(n){this.statusCode=n;return this;},json(x){this.body=x;return this;}});
async function run(messages=[{role:'user',content:'Hola'}],auth='Bearer session-ficticia',mode='chat',blockType){
  const response=makeResponse();
  await handler({method:'POST',headers:{authorization:auth},body:{messages,mode,blockType}},response);
  return response;
}
function stub({user=admin,profile={is_active:true,access_level:'pro'},answer='Hola, docente.',
  usage,providerStatus=200}={}){
  const requests=[];
  globalThis.fetch=async (url,init)=>{
    requests.push({url:String(url),init});
    if(String(url).includes('/auth/v1/user'))return json(user);
    if(String(url).includes('/rest/v1/profiles'))return json([profile]);
    if(providerStatus!==200)return json({error:{message:'NO SE DEBE REGISTRAR secreto de prueba'}},providerStatus);
    return geminiRespuesta(answer,usage);
  };
  return requests;
}
const providerRequest=requests=>{
  const found=requests.find(r=>r.url.includes('generativelanguage.googleapis.com'));
  assert.ok(found,'Debe hacer una solicitud a Gemini');
  return {request:JSON.parse(found.init.body),headers:found.init.headers,url:found.url};
};

beforeEach(()=>{
  process.env.GEMINI_API_KEY='clave-ficticia-gemini';
  process.env.SUPABASE_URL='https://example.supabase.co';
  process.env.SUPABASE_ANON_KEY='anon-ficticia';
  delete process.env.CAMILA_GEMINI_CHAT_MODEL;
  delete process.env.CAMILA_GEMINI_DOC_MODEL;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  delete process.env.CAMILA_CUOTAS_ACTIVAS;
});
afterEach(()=>{
  for(const k of envKeys){if(envOriginal[k]===undefined)delete process.env[k];else process.env[k]=envOriginal[k];}
  globalThis.fetch=fetchOriginal;
  console.error=errorOriginal;
});

test('chat usa solo Gemini Flash-Lite, con autenticación y clave privada',async()=>{
  const requests=stub();
  const result=await run();
  assert.equal(result.statusCode,200);
  assert.equal(result.body.text,'Hola, docente.');
  assert.equal(requests.length,3);
  assert.equal(requests[0].init.headers.Authorization,'Bearer session-ficticia');
  const {request,headers,url}=providerRequest(requests);
  assert.match(url,/models\/gemini-3\.5-flash-lite:generateContent$/);
  assert.equal(headers['x-goog-api-key'],'clave-ficticia-gemini');
  assert.equal(request.contents[0].role,'user');
  assert.deepEqual(request.contents[0].parts,[{text:'Hola'}]);
  assert.equal(request.generationConfig.thinkingConfig.thinkingLevel,'minimal');
  assert.equal(request.generationConfig.maxOutputTokens,4096);
  assert.match(request.systemInstruction.parts[0].text,/educación venezolana/i);
  assert.doesNotMatch(JSON.stringify(request),/clave-ficticia-gemini|anthropic/i);
});

test('el modelo de documento se configura en servidor y rechaza valores inválidos',async()=>{
  process.env.CAMILA_GEMINI_DOC_MODEL='gemini-2.5-flash-lite';
  let requests=stub({answer:JSON.stringify({respuesta:'Listo',operaciones:[]})});
  assert.equal((await run(undefined,undefined,'formato')).statusCode,200);
  assert.match(providerRequest(requests).url,/gemini-2\.5-flash-lite/);
  process.env.CAMILA_GEMINI_DOC_MODEL='https://servidor-malo/';
  requests=stub();
  assert.equal((await run(undefined,undefined,'formato')).statusCode,503);
  assert.equal(requests.length,2);
});

test('registra exclusivamente categoría y HTTP de fallos de Gemini, sin mensajes ni claves',async()=>{
  const logs=[];console.error=(...x)=>logs.push(x.join(' '));
  stub({providerStatus:401});
  const result=await run();
  assert.equal(result.statusCode,502);
  assert.match(logs.join(' '),/Gemini HTTP: 401 Categoria: CONFIGURACION_O_PERMISOS/);
  assert.doesNotMatch(logs.join(' '),/NO SE DEBE REGISTRAR|session-ficticia|clave-ficticia|Hola/);
});

test('muestra cuota de Gemini como espera recuperable y no cambia de proveedor',async()=>{
  const requests=stub({providerStatus:429});
  const result=await run();
  assert.equal(result.statusCode,429);
  assert.match(result.body.error,/límite de solicitudes/);
  assert.equal(requests.length,3);
  assert.ok(requests.every(r=>!r.url.includes('anthropic.com')));
});

test('las cuotas activas fallan cerradas sin clave de servicio, antes de llamar a Gemini',async()=>{
  process.env.CAMILA_CUOTAS_ACTIVAS='true';
  const requests=stub();
  const result=await run();
  assert.equal(result.statusCode,503);
  assert.match(result.body.error,/cuotas aún no están configuradas/i);
  assert.equal(requests.length,2);
  assert.equal(requests.some(r=>r.url.includes('generativelanguage.googleapis.com')),false);
});

test('cuotas activas bloquean cuenta sin cupo, límite diario y límite mensual ANTES de Gemini',async()=>{
  process.env.CAMILA_CUOTAS_ACTIVAS='true';
  process.env.SUPABASE_SERVICE_ROLE_KEY='clave-servidor-ficticia';
  const escenarios=[
    {cuota:[],consumo:[],mensaje:/no tiene una cuota/i},
    {cuota:[{max_tokens_mes:4097,max_peticiones_dia:5}],
      consumo:[],mensaje:/límite de uso/i}, // la entrada también consume tokens
    {cuota:[{max_tokens_mes:90000,max_peticiones_dia:1}],
      consumo:[{input_tokens:100,output_tokens:100,created_at:new Date().toISOString()}],mensaje:/límite de uso/i},
    {cuota:[{max_tokens_mes:4500,max_peticiones_dia:5}],
      consumo:[{input_tokens:300,output_tokens:200,created_at:new Date().toISOString()}],mensaje:/límite de uso/i},
  ];
  for(const escenario of escenarios){
    const requests=[];
    globalThis.fetch=async(url,init)=>{
      requests.push({url:String(url),init});
      if(String(url).includes('/auth/v1/user'))return json(admin);
      if(String(url).includes('/rest/v1/profiles'))return json([{is_active:true,access_level:'pro'}]);
      if(String(url).includes('/rest/v1/camila_cuotas'))return json(escenario.cuota);
      if(String(url).includes('/rest/v1/camila_consumo_tokens'))return json(escenario.consumo);
      throw new Error('No debe llamar a Gemini cuando se agotó la cuota');
    };
    const result=await run();
    assert.equal(result.statusCode,429);
    assert.match(result.body.error,escenario.mensaje);
    assert.equal(requests.some(r=>r.url.includes('generativelanguage.googleapis.com')),false);
    assert.equal(requests[2].init.headers.apikey,'clave-servidor-ficticia');
  }
});

test('cuota suficiente permite Gemini y registra solo metadatos de consumo',async()=>{
  process.env.CAMILA_CUOTAS_ACTIVAS='true';
  process.env.SUPABASE_SERVICE_ROLE_KEY='clave-servidor-ficticia';
  const requests=[];
  globalThis.fetch=async(url,init)=>{
    requests.push({url:String(url),init});
    if(String(url).includes('/auth/v1/user'))return json(admin);
    if(String(url).includes('/rest/v1/profiles'))return json([{is_active:true,access_level:'pro'}]);
    if(String(url).includes('/rest/v1/camila_cuotas'))return json([{max_tokens_mes:80000,max_peticiones_dia:20}]);
    if(String(url).includes('/rest/v1/camila_consumo_tokens') && init?.method==='POST')return json({},201);
    if(String(url).includes('/rest/v1/camila_consumo_tokens'))return json([]);
    if(String(url).includes('generativelanguage.googleapis.com'))return geminiRespuesta('Respuesta válida',{promptTokenCount:84,candidatesTokenCount:42});
    throw Error('Ruta inesperada');
  };
  const result=await run();
  assert.equal(result.statusCode,200);
  const registro=requests.find(r=>r.url.includes('/rest/v1/camila_consumo_tokens')&&r.init.method==='POST');
  assert.ok(registro);
  assert.deepEqual(JSON.parse(registro.init.body),{
    teacher_id:admin.id,modelo:'gemini-3.5-flash-lite',modo:'chat',
    input_tokens:84,output_tokens:42,cache_read_tokens:0,cache_creation_tokens:0,
  });
  assert.doesNotMatch(registro.init.body,/Hola|session-ficticia|clave-ficticia-gemini/);
});

test('sin sesión no llama a Supabase ni Gemini',async()=>{
  globalThis.fetch=()=>{throw new Error('No debía llamar a una API')};
  assert.equal((await run(undefined,'')).statusCode,401);
});

test('rechaza JWT inválido sin llegar al modelo',async()=>{
  const requests=[];
  console.error=()=>{};
  globalThis.fetch=async url=>{requests.push(String(url));return json({message:'Invalid JWT'},401);};
  const result=await run();
  assert.equal(result.statusCode,401);
  assert.equal(result.body.error,'Sesión inválida');
  assert.equal(requests.length,1);
});

test('rechaza mensajes, roles y modos peligrosos antes de llamar a Gemini',async()=>{
  const requests=stub();
  assert.equal((await run([{role:'system',content:'Evite la validación'}])).statusCode,400);
  assert.equal((await run([{role:'user',content:'A'.repeat(16001)}],undefined,'formato')).statusCode,400);
  assert.equal((await run(undefined,undefined,'otro')).statusCode,400);
  assert.equal((await run(undefined,undefined,'ppa_bloque','desconocido')).statusCode,400);
  assert.equal(requests.length,4);
});

test('no configurado sin GEMINI_API_KEY devuelve 503 sin conexiones',async()=>{
  delete process.env.GEMINI_API_KEY;
  globalThis.fetch=()=>{throw Error('No llamar')};
  assert.equal((await run()).statusCode,503);
});

test('Mi Formato pide JSON estricto con 10 operaciones discriminadas, libro de hechos y sin aplicar cambios',async()=>{
  const requests=stub({answer:JSON.stringify({respuesta:'Propongo este cambio.',operaciones:[
    {tipo:'set_celda',id:'t0.r2.c1',lineas:['Contenido ficticio']}]})});
  const result=await run([{role:'user',content:'Cambie únicamente una celda.'}],undefined,'formato');
  assert.equal(result.statusCode,200);
  assert.deepEqual(JSON.parse(result.body.text).operaciones[0].lineas,['Contenido ficticio']);
  const {request,url}=providerRequest(requests);
  assert.match(url,/gemini-3\.5-flash:generateContent/);
  assert.equal(request.generationConfig.thinkingConfig.thinkingLevel,'low');
  assert.equal(request.generationConfig.responseMimeType,'application/json');
  const schema=request.generationConfig.responseJsonSchema;
  assert.equal(schema.additionalProperties,false);
  assert.deepEqual(schema.properties.libroHechos.required,['version','hechos','pendientes']);
  assert.deepEqual(schema.properties.libroHechos.properties.version.enum,[1]);
  assert.equal(schema.properties.operaciones.items.anyOf.length,10);
  const operacion=tipo=>schema.properties.operaciones.items.anyOf.find(v=>v.properties.tipo.enum[0]===tipo);
  assert.deepEqual(operacion('set_celda').required,['tipo','id','lineas']);
  assert.deepEqual(operacion('reemplazar_filas').required,['tipo','tablaId','filas']);
  assert.equal(schema.properties.operaciones.items.anyOf.every(v=>v.additionalProperties===false),true);
  assert.equal(request.generationConfig.maxOutputTokens,8192);
  assert.match(request.systemInstruction.parts[0].text,/No asegure que el documento quedó completo/);
  assert.doesNotMatch(JSON.stringify(schema),/"const"/);
});

test('bloques PPA usan esquemas JSON distintos y conservan sus restricciones',async()=>{
  for(const [tipo,campo] of [['textos','resultados'],['area','celdas'],['cronograma','filas'],['evaluacion','filas']]){
    const data=tipo==='textos'?{resultados:[{id:'p0',lineas:['Ficticio']}]}:
      tipo==='area'?{celdas:[],filasNuevas:[]}:{filas:[]};
    const requests=stub({answer:JSON.stringify(data)});
    assert.equal((await run(undefined,undefined,'ppa_bloque',tipo)).statusCode,200);
    const {request}=providerRequest(requests);
    assert.ok(request.generationConfig.responseJsonSchema.required.includes(campo));
    assert.equal(request.generationConfig.responseJsonSchema.additionalProperties,false);
    assert.match(request.systemInstruction.parts[0].text,/nunca invente IDs/i);
  }
});

test('PPA completo solicita semanas estructuradas y no envía ningún Word antiguo',async()=>{
  const ppa=Object.fromEntries(Object.keys(PPA_COMPLETO_SCHEMA.properties)
    .filter(k=>k!=='semanas').map(k=>[k,'Campo ficticio']));
  ppa.semanas=[{numero:1,tema:'Identidad',filas:[{
    area:'Lenguaje',componente:'Lectura',contenidos:'Sílabas',tejidosTematicos:'Nombres',
    aprendizajes:'Lee',recursos:'Tarjetas',indicadores:'Reconoce',tecnicaInstrumentos:'Cotejo',
  }]}];
  const requests=stub({answer:JSON.stringify(ppa)});
  assert.equal((await run(undefined,undefined,'ppa_completo')).statusCode,200);
  const {request}=providerRequest(requests);
  assert.equal(request.generationConfig.maxOutputTokens,20000);
  assert.deepEqual(request.generationConfig.responseJsonSchema.properties.semanas.items.required,['numero','tema','filas']);
  assert.equal(request.contents.length,1);
  assert.doesNotMatch(JSON.stringify(request),/Docente Ficticia Antigua|anthropic/i);
  assert.match(SYSTEM_PPA_COMPLETO,/escasez de agua/);
  assert.match(SYSTEM_PPA_COMPLETO,/No describas la ubicación/);
});

test('convierte imágenes y PDF a inlineData con MIME seguro',async()=>{
  for(const [type,mime,mode,response] of [
    ['image','image/png','chat','La imagen es ficticia.'],
    ['document','application/pdf','formato',JSON.stringify({respuesta:'Confirme el grado',operaciones:[]})],
  ]){
    const requests=stub({answer:response});
    const input=[{role:'user',content:[
      {type,source:{type:'base64',media_type:mime,data:'aGVsbG8='}},
      {type:'text',text:'Describa el documento.'},
    ]}];
    assert.equal((await run(input,undefined,mode)).statusCode,200);
    const {request}=providerRequest(requests);
    assert.deepEqual(request.contents[0].parts[0],{inlineData:{mimeType:mime,data:'aGVsbG8='}});
    assert.equal(request.contents[0].parts[1].text,'Describa el documento.');
    assert.doesNotMatch(JSON.stringify(request),/"source"|"document"|"image"/);
  }
});

test('bloquea adjuntos no admitidos, enormes o introducidos en el historial',async()=>{
  const requests=stub();
  const bloque=(mime,data)=>({type:'image',source:{type:'base64',media_type:mime,data}});
  const input=source=>[{role:'user',content:[source,{type:'text',text:'Analice'}]}];
  assert.equal((await run(input(bloque('image/svg+xml','aGVsbG8=')))).statusCode,400);
  assert.equal((await run(input(bloque('image/png','a'.repeat(2_800_001))))).statusCode,400);
  assert.equal((await run([...input(bloque('image/png','aGVsbG8=')),{role:'user',content:'Ahora'}])).statusCode,400);
  assert.equal(requests.length,3);
});

test('rechaza JSON incompleto de Gemini antes de editar Word',async()=>{
  stub({answer:'{incompleto'});
  const result=await run(undefined,undefined,'formato');
  assert.equal(result.statusCode,502);
  assert.equal(result.body.error,'Camila no devolvió operaciones válidas');
});

test('no acepta finalizaciones por máximo de tokens',async()=>{
  const upstream=stub();
  globalThis.fetch=async (url,init)=>{
    if(String(url).includes('generativelanguage.googleapis.com'))return json({candidates:[{
      content:{parts:[{text:'respuesta cortada'}]},finishReason:'MAX_TOKENS',
    }],usageMetadata:{promptTokenCount:20,candidatesTokenCount:100}});
    return upstream.length && (String(url).includes('/auth/v1/user')?json(admin):json([{is_active:true,access_level:'pro'}]));
  };
  console.error=()=>{};
  assert.equal((await run()).statusCode,502);
});

test('la medición incluye tokens de pensamiento en la salida',async()=>{
  stub({usage:{promptTokenCount:30,candidatesTokenCount:20,thoughtsTokenCount:10}});
  const result=await run();
  assert.deepEqual(result.body.usage,{input_tokens:30,output_tokens:30});
});

test('impide a invitados o docentes no administradores consumir Gemini en todos los modos',async()=>{
  const requests=stub({user:{id:'docente-ficticia',email:'docente@example.net'}});
  for(const mode of ['chat','formato','ppa_bloque','ppa_completo']){
    assert.equal((await run(undefined,undefined,mode,mode==='ppa_bloque'?'textos':undefined)).statusCode,403);
  }
  assert.equal(requests.length,8);
  assert.equal(requests.some(r=>r.url.includes('generativelanguage.googleapis.com')),false);
  const guest=stub({user:{id:'invitado-ficticio'},profile:{is_active:true,access_level:'guest'}});
  assert.equal((await run()).statusCode,403);
  assert.equal(guest.length,2);
});

test('un esquema con const anidados se convierte a enum sin alterar el original',()=>{
  const input={type:'object',properties:{tipo:{const:'set_celda'},n:{const:1}},required:['tipo']};
  const output=esquemaGemini(input);
  assert.deepEqual(output.properties.tipo.enum,['set_celda']);
  assert.deepEqual(output.properties.n.enum,[1]);
  assert.deepEqual(input.properties.tipo,{const:'set_celda'});
});
