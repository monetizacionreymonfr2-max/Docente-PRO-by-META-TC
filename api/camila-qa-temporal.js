// RUTA TEMPORAL PARA PRUEBA REAL DE CLAUDE, SOLO PREVIEW DE DESARROLLO.
// Quitarla inmediatamente después de comprobar el resultado. Datos ficticios.
import { PPA_COMPLETO_SCHEMA, SYSTEM_PPA_COMPLETO } from './camila-claude.js';

export default async function handler(req,res) {
  res.setHeader('Cache-Control','no-store');
  if(req.method!=='POST')return res.status(405).json({error:'Método no permitido'});
  const branch='implementacion-claude-flujo-completo-20261030';
  if(process.env.VERCEL_ENV!=='preview' ||
      process.env.VERCEL_GIT_COMMIT_REF!==branch ||
      !process.env.CAMILA_QA_TOKEN ||
      req.headers['x-camila-qa']!==process.env.CAMILA_QA_TOKEN) {
    return res.status(403).json({error:'Prueba no autorizada'});
  }
  const key=process.env.ANTHROPIC_API_KEY;
  if(!key)return res.status(503).json({error:'La clave no está configurada'});
  const identidad={
    gradoSeccion:'2do grado, sección E',tema:'Identidad, familia y comunidad',
    diagnostico:'Grupo ficticio. Dificultad para reconocer sílabas. En Matemática solo suman.',
    duracion:'6 semanas',docente:'Docente Ficticia de Pruebas',
    institucion:'Escuela Ficticia de Pruebas',anioEscolar:'2026-2027',
    fechaInicio:'03-11-2026',fechaFin:'10-12-2026',
  };
  const instruccion=JSON.stringify({
    identidad,areasExcluidas:['Inglés'],
    solicitudActual:'Crea el PPA completo sobre identidad, 6 semanas exactas.',
    reglas:'Cada semana debe tener cuatro filas con las áreas Lenguaje, Matemática, Ciencia Tecnología y Sociedad, y Ciencias Sociales. Campos llenos, progresión de lectura silábica, suma contextual y respeto comunitario; solo propuestas pedagógicas. NO inventar institución ni estudiantes reales.',
  });
  try {
    const response=await fetch('https://api.anthropic.com/v1/messages',{
      method:'POST',
      headers:{'Content-Type':'application/json','x-api-key':key,'anthropic-version':'2023-06-01'},
      body:JSON.stringify({
        model:process.env.ANTHROPIC_MODEL||'claude-sonnet-5-5',
        max_tokens:16000,
        output_config:{effort:'medium',format:{type:'json_schema',schema:PPA_COMPLETO_SCHEMA}},
        system:[{type:'text',text:SYSTEM_PPA_COMPLETO,cache_control:{type:'ephemeral'}}],
        messages:[{role:'user',content:instruccion}],
      }),
      signal:AbortSignal.timeout(60000),
    });
    if(!response.ok){
      const errorBody=await response.json().catch(()=>({}));
      return res.status(502).json({
        ok:false,providerStatus:response.status,
        category:errorBody?.error?.type||'unknown',
        // No divulgar mensajes de error del proveedor ni clave.
      });
    }
    const data=await response.json();
    const content=(data.content||[]).filter(x=>x.type==='text').map(x=>x.text).join('');
    let doc;
    try{doc=JSON.parse(content)}catch{return res.status(502).json({ok:false,reason:'json_invalid',usage:data.usage});}
    const filaFields=['area','componente','contenidos','tejidosTematicos','aprendizajes','recursos','indicadores','tecnicaInstrumentos'];
    const weeks=Array.isArray(doc.semanas)?doc.semanas:[];
    const rows=weeks.reduce((n,s)=>n+(Array.isArray(s.filas)?s.filas.length:0),0);
    const missing=weeks.flatMap((s,i)=>(s.filas||[]).flatMap((f,j)=>filaFields.filter(k=>typeof f[k]!=='string'||!f[k].trim()).map(k=>`${i+1}:${j+1}:${k}`)));
    const excluded=weeks.some(s=>(s.filas||[]).some(f=>/ingl[eé]s/i.test(f.area)));
    const proper=weeks.length===6 && weeks.every((s,i)=>s.numero===i+1 && s.filas.length===4);
    return res.status(200).json({
      ok:proper&&!missing.length&&!excluded,
      weeks:weeks.length,rows,missing:missing.slice(0,8),excluded,
      usage:data.usage,stopReason:data.stop_reason,
    });
  }catch(e){
    const category=e?.name==='TimeoutError'?'timeout':'request_error';
    return res.status(502).json({ok:false,reason:category});
  }
}
