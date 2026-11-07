/**
 * Contexto temporal de voz dentro del espacio de trabajo actual.
 * No usa almacenamiento persistente, cookies ni audios grabados.
 */
export interface TurnoVozCamila {
  docente: string;
  camila: string;
}

export interface MensajeContextoVoz {
  role: 'user' | 'model';
  parts: Array<{ text: string }>;
}

interface MensajeChatReferencia {
  emisor: string;
  texto: string;
}

interface EstadoTrabajoVoz {
  formato?: string;
  proyecto?: string;
  hayPropuesta?: boolean;
}

function limpiarTexto(texto: string, limite: number): string {
  return texto.replace(/\s+/g, ' ').trim().slice(0, limite);
}

export function registrarTurnoVozCamila(
  historial: TurnoVozCamila[],
  docente: string,
  camila: string,
): TurnoVozCamila[] {
  const turno = {
    docente: limpiarTexto(docente, 1400),
    camila: limpiarTexto(camila, 1400),
  };
  if (!turno.docente && !turno.camila) return historial;
  // Límite de memoria y de tokens para sucesivas reconexiones.
  return [...historial, turno].slice(-16);
}

export function prepararContextoLlamadaCamila(
  historial: TurnoVozCamila[],
  mensajesChat: MensajeChatReferencia[],
  estado: EstadoTrabajoVoz,
): MensajeContextoVoz[] {
  const turnos: MensajeContextoVoz[] = [];
  // Últimos turnos del chat escrito, sin avisos técnicos ni mensajes de sistema.
  for (const mensaje of mensajesChat
    .filter(m => (m.emisor === 'docente' || m.emisor === 'camila') && m.texto.trim())
    .slice(-6)) {
    turnos.push({
      role: mensaje.emisor === 'docente' ? 'user' : 'model',
      parts: [{ text: limpiarTexto(mensaje.texto, 1100) }],
    });
  }

  // Turnos de voz anteriores al corte: conservar tanto lo dicho por el
  // docente como la respuesta de Camila, en el orden original.
  for (const turno of historial.slice(-16)) {
    if (turno.docente) turnos.push({ role: 'user', parts: [{ text: limpiarTexto(turno.docente, 1400) }] });
    if (turno.camila) turnos.push({ role: 'model', parts: [{ text: limpiarTexto(turno.camila, 1400) }] });
  }

  const notas = [
    estado.formato ? `Word abierto: ${limpiarTexto(estado.formato, 140)}` : '',
    estado.proyecto ? `Proyecto vinculado: ${limpiarTexto(estado.proyecto, 140)}` : '',
    estado.hayPropuesta ? 'Existe una propuesta de cambios pendiente de revisión y aprobación del docente.' : '',
  ].filter(Boolean);
  if (notas.length) {
    turnos.push({
      role: 'user',
      parts: [{ text: 'Contexto de la aplicación, NO una nueva petición ni hechos que debas inventar: ' + notas.join(' | ') + '. Continúa desde lo ya conversado y no apliques modificaciones sin aprobación.' }],
    });
  }

  // No activar respuesta al cargar este historial; el docente iniciará
  // el siguiente turno hablando. El envío usa turnComplete:false.
  return turnos;
}
