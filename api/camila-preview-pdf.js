import { createHmac } from 'node:crypto';
import { verificarAdministradorCamila } from './_camilaAdmin.js';

export const maxDuration = 60;
export default async function handler(req,res) {
  res.setHeader('Cache-Control','private, no-store');
  res.setHeader('X-Content-Type-Options','nosniff');
  if (req.method!=='POST') return res.status(405).json({error:'Método no permitido'});
  // Debe habilitarse solamente para la rama Preview y nunca al inferir un host.
  if (process.env.VERCEL_ENV!=='preview' || process.env.CAMILA_LIBREOFFICE_PREVIEW_ENABLED!=='true')
    return res.status(404).json({error:'Vista fiel no habilitada'});
  const auth=await verificarAdministradorCamila(req);
  if (!auth.ok) return res.status(auth.status).json({error:auth.error});
  const { archivoBase64, consentimiento }=req.body||{};
  if (consentimiento!==true || typeof archivoBase64!=='string' ||
      archivoBase64.length<12 || archivoBase64.length>2_050_000 ||
      !/^[A-Za-z0-9+/]+={0,2}$/.test(archivoBase64))
    return res.status(400).json({error:'Word ficticio y consentimiento requeridos'});
  const bytes=Buffer.from(archivoBase64,'base64');
  if (bytes.length>1_500_000 || !bytes.subarray(0,4).equals(Buffer.from('504b0304','hex')))
    return res.status(413).json({error:'Word inválido o demasiado grande'});
  const worker=process.env.CAMILA_PDF_WORKER_URL||'';
  const secret=process.env.CAMILA_PDF_WORKER_SECRET||'';
  let url;
  try {
    url=new URL(worker);
    if (url.protocol!=='https:' || url.username || url.password || url.search || url.hash ||
        url.pathname!=='/convert' || secret.length<32)
      throw Error('Configuración inválida');
  } catch { return res.status(503).json({error:'Worker de vista previa no configurado'}); }
  const timestamp=String(Math.floor(Date.now()/1000));
  const signature=createHmac('sha256',secret).update(timestamp+'\n').update(bytes).digest('hex');
  try {
    const response=await fetch(url.toString(),{
      method:'POST',
      headers:{
        'Content-Type':'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'X-Camila-Timestamp':timestamp,'X-Camila-Signature':signature,
      },
      body:bytes,
      redirect:'error',
      signal:AbortSignal.timeout(42000),
    });
    if (!response.ok) return res.status(502).json({error:'LibreOffice no pudo procesar el Word'});
    const pdf=Buffer.from(await response.arrayBuffer());
    if (pdf.length<50 || pdf.length>14_000_000 || !pdf.subarray(0,5).equals(Buffer.from('%PDF-')))
      return res.status(502).json({error:'Vista PDF inválida'});
    return res.status(200).json({mimeType:'application/pdf',pdfBase64:pdf.toString('base64')});
  } catch { return res.status(502).json({error:'El worker de vista previa no respondió'}); }
}
