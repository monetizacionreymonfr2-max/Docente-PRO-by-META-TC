// Solo se conserva texto aprobado por el docente, nunca el contenido binario
// de Word, adjuntos, tokens, credenciales ni estado interno del editor.
export type MensajeHistorial = {
  id: string;
  emisor: 'docente' | 'camila';
  texto: string;
  fecha: string;
};

export type MensajeParaHistorial = {
  id: string;
  emisor: string;
  texto: string;
  fecha: Date;
};

export function prepararMensajesParaGuardar(mensajes: MensajeParaHistorial[]): MensajeHistorial[] {
  return mensajes
    .filter((m) => (m.emisor === 'docente' || m.emisor === 'camila') && typeof m.texto === 'string')
    .slice(-100)
    .map((m, index) => ({
      id: `${m.id || 'mensaje'}-${index}`.slice(0, 100),
      emisor: m.emisor as 'docente' | 'camila',
      texto: m.texto.slice(0, 5000),
      fecha: m.fecha instanceof Date && !Number.isNaN(m.fecha.getTime())
        ? m.fecha.toISOString() : new Date().toISOString(),
    }));
}

export function recuperarMensajesGuardados(valor: unknown): MensajeHistorial[] {
  if (!Array.isArray(valor)) return [];
  return valor.slice(-100).flatMap((m: unknown, index) => {
    if (!m || typeof m !== 'object') return [];
    const item = m as Partial<MensajeHistorial>;
    if ((item.emisor !== 'camila' && item.emisor !== 'docente') || typeof item.texto !== 'string') return [];
    const fecha = typeof item.fecha === 'string' && !Number.isNaN(Date.parse(item.fecha))
      ? item.fecha : new Date().toISOString();
    return [{ id: `${String(item.id || 'mensaje').slice(0, 90)}-${index}`, emisor: item.emisor,
      texto: item.texto.slice(0, 5000), fecha }];
  });
}
