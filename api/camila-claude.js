// Endpoint aislado: no reemplaza Gemini ni altera rutas existentes.
const SYSTEM = `Usted es Camila, asistente virtual de DOCENTY PRO, especializada exclusivamente en educación venezolana. Trate siempre de usted, con amabilidad y respeto. Haga una pregunta a la vez y reformule con sencillez cuando sea necesario. No genere código de programación, imágenes, videos ni música. Si una solicitud no cumple lineamientos educativos, explíquelo y solicite confirmación cuando proceda; nunca ignore normas de protección de estudiantes. Antes de crear o corregir documentos, explique lo que hará y pida autorización. No afirme haber guardado memoria ni documentos sin que el sistema lo confirme. No recopile datos innecesarios.`;
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({error:'Método no permitido'}); }
  const key=process.env.ANTHROPIC_API_KEY;
  const url=process.env.SUPABASE_URL;
  const anon=process.env.SUPABASE_ANON_KEY;
  if (!key || !url || !anon) return res.status(503).json({error:'Servicio no configurado'});
  const bearer=req.headers.authorization || '';
    if (!bearer.startsWith('Bearer ') || bearer.slice(7).trim().length === 0) return res.status(401).json({error:'Autenticación requerida'});
  try {
    const auth=await fetch(`${url.endsWith('/') ? url.slice(0,-1) : url}/auth/v1/user`,{headers:{apikey:anon,Authorization:bearer},signal:AbortSignal.timeout(8000)});
    if (!auth.ok) return res.status(401).json({error:'Sesión inválida'});
    const user=await auth.json();
    if (!user.id) return res.status(401).json({error:'Sesión inválida'});
    const messages=req.body?.messages;
    if (!Array.isArray(messages) || messages.length<1 || messages.length>20 ||
        messages.some(m=>!m || !['user','assistant'].includes(m.role) ||
          typeof m.content!=='string' || !m.content.trim() || m.content.length>12000) ||
        messages[messages.length-1].role!=='user') {
      return res.status(400).json({error:'Mensajes inválidos'});
    }
    const response=await fetch('https://api.anthropic.com/v1/messages',{
      method:'POST',headers:{'content-type':'application/json','x-api-key':key,'anthropic-version':'2023-06-01'},
      body:JSON.stringify({model:process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5',max_tokens:1200,system:SYSTEM,messages}),
      signal:AbortSignal.timeout(45000)
    });
    if(!response.ok) return res.status(502).json({error:'No se pudo completar la solicitud a Camila'});
    const data=await response.json();
    return res.status(200).json({text:(data.content||[]).filter(x=>x.type==='text').map(x=>x.text).join(''),usage:data.usage});
  } catch { return res.status(502).json({error:'Servicio temporalmente no disponible'}); }
}
