import { createHmac } from 'node:crypto';
import { verificarAdministradorCamila } from '../server/camilaAdmin.js';

// Herramienta opcional: solo Preview + administrador + archivos ficticios.
// Nunca expone el secreto del worker ni permite ejecutar Python arbitrario.
export const maxDuration = 60;
const MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';


const sinControles = text => typeof text === 'string' && text.length <= 5000 && !/[\u0000-\u001f\u007f]/.test(text);
const idsParrafo = /^p(0|[1-9]\d{0,4})$/;
const idsCelda = /^t(0|[1-9]\d{0,4})\.r(0|[1-9]\d{0,4})\.c(0|[1-9]\d{0,4})$/;
const idsTabla = /^t(0|[1-9]\d{0,4})$/;
const idFilaDeTabla = (id, tabla) =>
  typeof id === 'string' && idsTabla.test(tabla) &&
  new RegExp('^' + tabla + '\\.r(0|[1-9]\\d{0,4})$').test(id);
const filasValidas = (filas) => {
  if (!Array.isArray(filas) || filas.length < 1 || filas.length > 24) return false;
  const cols = Array.isArray(filas[0]) ? filas[0].length : 0;
  return cols > 0 && cols <= 12 && filas.every(fila =>
    Array.isArray(fila) && fila.length === cols &&
    fila.every(text => sinControles(text) && text.length <= 1000)
  ) && filas.flat().reduce((n, str) => n + str.length, 0) <= 40000;
};

/** Solo operaciones declarativas compatibles con el worker Python. */
export function operacionWordValida(op) {
  if (!op || typeof op !== 'object' || Array.isArray(op)) return false;
  const keys = Object.keys(op).sort().join(',');
  if (op.tipo === 'reemplazar_texto') {
    return keys === 'buscar,reemplazar,tipo' &&
      sinControles(op.buscar) && op.buscar.length > 0 && op.buscar.length <= 500 &&
      sinControles(op.reemplazar);
  }
  if (op.tipo === 'set_parrafo') {
    return keys === 'esperado,id,texto,tipo' && idsParrafo.test(op.id) &&
      sinControles(op.esperado) && sinControles(op.texto);
  }
  if (op.tipo === 'set_celda') {
    return keys === 'esperado,id,lineas,tipo' && idsCelda.test(op.id) &&
      sinControles(op.esperado) && Array.isArray(op.lineas) && op.lineas.length === 1 &&
      sinControles(op.lineas[0]);
  }
  if (op.tipo === 'agregar_filas') {
    return keys === 'despuesDeFilaId,esperadoModelo,filas,tablaId,tipo' &&
      idsTabla.test(op.tablaId) && idFilaDeTabla(op.despuesDeFilaId, op.tablaId) &&
      filasValidas([op.esperadoModelo]) && filasValidas(op.filas);
  }
  if (op.tipo === 'reemplazar_filas') {
    return keys === 'esperadas,filaInicioId,filas,tablaId,tipo' &&
      idsTabla.test(op.tablaId) && idFilaDeTabla(op.filaInicioId, op.tablaId) &&
      filasValidas(op.esperadas) && filasValidas(op.filas);
  }
  if (op.tipo === 'set_seccion') {
    if (keys !== 'parrafos,tipo,tituloEsperado,tituloId' || !idsParrafo.test(op.tituloId) ||
        !sinControles(op.tituloEsperado) || !op.tituloEsperado ||
        !Array.isArray(op.parrafos) || op.parrafos.length < 1 || op.parrafos.length > 16) return false;
    const first = Number(op.tituloId.slice(1)) + 1;
    return op.parrafos.every((p, i) =>
      p && typeof p === 'object' && !Array.isArray(p) &&
      Object.keys(p).sort().join(',') === 'esperado,id,texto' &&
      p.id === 'p' + (first + i) && sinControles(p.esperado) && sinControles(p.texto));
  }
  return false;
}

export function loteWordValido(operaciones) {
  if (!Array.isArray(operaciones) || operaciones.length < 1 || operaciones.length > 20 ||
      !operaciones.every(operacionWordValida)) return false;
  const tablas = new Set();
  const secciones = new Set();
  for (const op of operaciones) {
    if (op.tipo === 'agregar_filas' || op.tipo === 'reemplazar_filas') {
      if (tablas.has(op.tablaId)) return false;
      tablas.add(op.tablaId);
    }
    if (op.tipo === 'set_seccion') {
      if (secciones.has(op.tituloId)) return false;
      secciones.add(op.tituloId);
    }
  }
  return !operaciones.some(op => op.tipo === 'set_celda' && tablas.has(op.id.split('.')[0]));
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });
  if (process.env.VERCEL_ENV !== 'preview' ||
      process.env.CAMILA_DOCX_EDIT_PREVIEW_ENABLED !== 'true') {
    return res.status(404).json({ error: 'Edición de Word no habilitada' });
  }
  const auth = await verificarAdministradorCamila(req);
  if (!auth.ok) return res.status(auth.status).json({ error: auth.error });

  const { archivoBase64, operaciones, consentimiento, soloFicticio } = req.body || {};
  if (consentimiento !== true || soloFicticio !== true) {
    return res.status(403).json({ error: 'Solo pruebas consentidas con documentos ficticios' });
  }
  if (typeof archivoBase64 !== 'string' || archivoBase64.length < 40 ||
      archivoBase64.length > 2_020_000 || !/^[A-Za-z0-9+/]+={0,2}$/.test(archivoBase64) ||
      !loteWordValido(operaciones)) {
    return res.status(400).json({ error: 'Documento u operaciones inválidos' });
  }
  const decoded = Buffer.from(archivoBase64, 'base64');
  if (decoded.length > 1_500_000 || !decoded.subarray(0, 4).equals(Buffer.from('504b0304', 'hex'))) {
    return res.status(413).json({ error: 'Word demasiado grande o inválido' });
  }
  const secret = process.env.CAMILA_PDF_WORKER_SECRET || '';
  let url;
  try {
    url = new URL(process.env.CAMILA_PDF_WORKER_URL || '');
    if (url.protocol !== 'https:' || url.username || url.password ||
        url.search || url.hash || url.pathname !== '/convert' || secret.length < 32) {
      throw new Error('Configuración incorrecta');
    }
    url.pathname = '/edit';
  } catch {
    return res.status(503).json({ error: 'Procesador Word no configurado' });
  }

  const body = Buffer.from(JSON.stringify({ archivoBase64, operaciones }), 'utf8');
  if (body.length > 2_100_000) return res.status(413).json({ error: 'Solicitud demasiado grande' });
  const timestamp = String(Math.floor(Date.now() / 1000));
  const signature = createHmac('sha256', secret).update(timestamp + '\n').update(body).digest('hex');
  try {
    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Camila-Timestamp': timestamp,
        'X-Camila-Signature': signature,
      },
      body,
      redirect: 'error',
      signal: AbortSignal.timeout(42000),
    });
    if (!response.ok) return res.status(502).json({ error: 'No se pudo aplicar la edición segura' });
    const result = await response.json();
    if (!Number.isInteger(result.operacionesAplicadas) ||
        result.operacionesAplicadas !== operaciones.length ||
        typeof result.archivoBase64 !== 'string' || result.archivoBase64.length > 3_400_000) {
      return res.status(502).json({ error: 'Resultado Word inválido' });
    }
    const modified = Buffer.from(result.archivoBase64, 'base64');
    if (modified.length > 2_500_000 ||
        !modified.subarray(0, 4).equals(Buffer.from('504b0304', 'hex'))) {
      return res.status(502).json({ error: 'Archivo Word resultante inválido' });
    }
    return res.status(200).json({
      archivoBase64: result.archivoBase64,
      operacionesAplicadas: result.operacionesAplicadas,
      mimeType: MIME,
    });
  } catch {
    return res.status(502).json({ error: 'El procesador Word no respondió' });
  }
}
