import { verificarAdministradorCamila } from '../server/camilaAdmin.js';

export const maxDuration = 60;
const API='https://api.anthropic.com';
const SKILL_BETAS='skills-2025-10-02';
const MIME='application/vnd.openxmlformats-officedocument.wordprocessingml.document';

function getFiles(data) {
  const result=[];
  for (const item of data?.content||[]) {
    if(item.type!=='bash_code_execution_tool_result' ||
       item.content?.type!=='bash_code_execution_result')continue;
    for(const output of item.content.content||[]){
      if(typeof output.file_id==='string' && /^file_[A-Za-z0-9]+$/.test(output.file_id))
        result.push(output.file_id);
    }
  }
  return [...new Set(result)];
}
async function jsonResult(resp) {
  const value=await resp.json().catch(()=>({}));
  if(!resp.ok) throw Error('anthropic_http_'+resp.status);
  return value;
}

export default async function handler(req,res) {
  res.setHeader('Cache-Control','private, no-store');
  if(req.method!=='POST')return res.status(405).json({error:'Método no permitido'});
  // Feature *aparte*, desactivado por defecto; los contenidos escolares reales
  // no se deben enviar a un contenedor de retención hasta 30 días.
  if(process.env.VERCEL_ENV!=='preview' || process.env.CAMILA_DOCX_SKILLS_ENABLED!=='true')
    return res.status(404).json({error:'Skills de Word no habilitadas'});
  const auth=await verificarAdministradorCamila(req);
  if(!auth.ok)return res.status(auth.status).json({error:auth.error});
  const {archivoBase64,instruccion,consentimiento,soloFicticio}=req.body||{};
  if(consentimiento!==true || soloFicticio!==true)
    return res.status(403).json({error:'Solo pruebas con archivos ficticios y consentimiento explícito'});
  if(typeof archivoBase64!=='string' || archivoBase64.length<40 ||
     archivoBase64.length>1_400_000 || !/^[A-Za-z0-9+/]+={0,2}$/.test(archivoBase64) ||
     typeof instruccion!=='string' || instruccion.trim().length<10 || instruccion.length>1100)
    return res.status(400).json({error:'Formato Word o instrucción inválida'});
  const input=Buffer.from(archivoBase64,'base64');
  if(input.length>1_000_000 || !input.subarray(0,4).equals(Buffer.from('504b0304','hex')))
    return res.status(413).json({error:'Documento Word inválido'});
  const key=process.env.ANTHROPIC_API_KEY;
  if(!key)return res.status(503).json({error:'Anthropic no está configurado'});
  const headers={'x-api-key':key,'anthropic-version':'2023-06-01','anthropic-beta':SKILL_BETAS};
  const idsToDelete=[];
  const ctl=new AbortController();
  const timer=setTimeout(()=>ctl.abort(),48000);
  let usage={input_tokens:0,output_tokens:0};
  try {
    // 1. El servidor sube DOCX a Anthropic; nunca envía el file_id al navegador.
    const form=new FormData();
    form.append('file',new Blob([input],{type:MIME}),'plantilla_ficticia.docx');
    form.append('expires_in_seconds','3600');
    const uploaded=await jsonResult(await fetch(API+'/v1/files',{
      method:'POST',headers,body:form,signal:ctl.signal,
    }));
    if(typeof uploaded.id!=='string')throw Error('upload_missing_id');
    idsToDelete.push(uploaded.id);
    // 2. Skill predefinida docx, Code Execution y archivo como container_upload.
    //    El texto debe impedir cambios inventados y conservar la plantilla.
    const userText='Trabaja ÚNICAMENTE con el archivo Word ficticio adjunto.\n'+
      'Solicitud: '+instruccion.trim()+'\n'+
      'Usa la Skill docx, conserva tablas, estilos, logotipos y pies cuando corresponda. '+
      'No copies datos de otro docente, no inventes alumnos ni ministeriales; '+ 
      'si faltan datos, indica POR CONFIRMAR. Crea un archivo .docx terminado y adjúntalo.';
    const messages=[{role:'user',content:[
      {type:'text',text:userText},{type:'container_upload',file_id:uploaded.id},
    ]}];
    const reqBase={
      model:process.env.ANTHROPIC_MODEL||'claude-sonnet-5-5',
      max_tokens:6000,
      tools:[{type:'code_execution_20250825',name:'code_execution'}],
    };
    let container;
    let fileId;
    for(let attempt=0;attempt<3;attempt++){
      const payload={...reqBase,
        container:container?{id:container,skills:[{type:'anthropic',skill_id:'docx',version:'latest'}]}:
          {skills:[{type:'anthropic',skill_id:'docx',version:'latest'}]},
        messages,
      };
      const result=await jsonResult(await fetch(API+'/v1/messages',{
        method:'POST',
        headers:{...headers,'content-type':'application/json'},
        body:JSON.stringify(payload),signal:ctl.signal,
      }));
      usage.input_tokens+=Number(result.usage?.input_tokens||0);
      usage.output_tokens+=Number(result.usage?.output_tokens||0);
      container=result.container?.id;
      const files=getFiles(result);
      if(files.length)fileId=files[files.length-1];
      if(result.stop_reason==='pause_turn' && container && attempt<2){
        messages.push({role:'assistant',content:result.content});
        continue;
      }
      break;
    }
    if(!fileId)throw Error('skill_no_docx');
    idsToDelete.push(fileId);
    const info=await jsonResult(await fetch(API+'/v1/files/'+encodeURIComponent(fileId),{
      headers,signal:ctl.signal,
    }));
    if(info.downloadable===false || !String(info.filename||'').toLowerCase().endsWith('.docx') ||
       Number(info.size_bytes||0)>3_000_000)throw Error('skill_bad_output');
    const download=await fetch(API+'/v1/files/'+encodeURIComponent(fileId)+'/content',{
      headers,signal:ctl.signal,
    });
    if(!download.ok)throw Error('skill_download_failed');
    const content=Buffer.from(await download.arrayBuffer());
    if(content.length>3_000_000||!content.subarray(0,4).equals(Buffer.from('504b0304','hex')))
      throw Error('skill_not_a_word');
    return res.status(200).json({
      archivoBase64:content.toString('base64'),mimeType:MIME,
      usage,requiereAprobacion:true,retencionContenedorHastaDias:30,
    });
  } catch(error) {
    console.error('[Camila Skill] Tipo de error:',String(error.message||'unknown').replace(/[^a-zA-Z0-9_]/g,'').slice(0,60));
    return res.status(502).json({error:'La Skill no pudo terminar el Word. No se aplicaron cambios'});
  } finally {
    clearTimeout(timer);
    // Archivos de entrada/salida deben eliminarse, nunca persistir ids.
    // La retención del contenedor de ejecución continúa bajo reglas de Anthropic.
    await Promise.allSettled(idsToDelete.map(id=>fetch(API+'/v1/files/'+encodeURIComponent(id),{
      method:'DELETE',headers,signal:AbortSignal.timeout(4000),
    })));
  }
}
