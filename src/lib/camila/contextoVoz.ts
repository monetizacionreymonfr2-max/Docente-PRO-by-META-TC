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
  recuerdosAutorizados?: Array<{ titulo: string; contenido: string }>;
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
  return [...historial, turno].slice(-60);
}

export function prepararContextoLlamadaCamila(
  historial: TurnoVozCamila[],
  mensajesChat: MensajeChatReferencia[],
  estado: EstadoTrabajoVoz,
): MensajeContextoVoz[] {
  const turnos: MensajeContextoVoz[] = [];
  const clavesYaIncluidas = new Set<string>();
  const agregar = (role: 'user' | 'model', texto: string, limite: number) => {
    const limpio = limpiarTexto(texto, limite);
    if (!limpio) return;
    const clave = role + ':' + limpio;
    if (clavesYaIncluidas.has(clave)) return;
    clavesYaIncluidas.add(clave);
    turnos.push({ role, parts: [{ text: limpio }] });
  };
  // Últimos turnos del chat escrito, sin avisos técnicos ni mensajes de sistema.
  for (const mensaje of mensajesChat
    .filter(m => (m.emisor === 'docente' || m.emisor === 'camila') && m.texto.trim())
    .slice(-60)) {
    agregar(mensaje.emisor === 'docente' ? 'user' : 'model', mensaje.texto, 1400);
  }

  // Turnos de voz anteriores al corte: conservar tanto lo dicho por el
  // docente como la respuesta de Camila, en el orden original.
  for (const turno of historial.slice(-60)) {
    agregar('user', turno.docente, 1400);
    agregar('model', turno.camila, 1400);
  }

  const notas = [
    estado.formato ? `Word abierto: ${limpiarTexto(estado.formato, 140)}` : '',
    estado.proyecto ? `Proyecto vinculado: ${limpiarTexto(estado.proyecto, 140)}` : '',
    ...(estado.recuerdosAutorizados || []).slice(0, 15).map(r =>
      `Dato autorizado «${limpiarTexto(r.titulo, 80)}»: ${limpiarTexto(r.contenido, 700)}`),
  ].filter(Boolean);
  if (notas.length) {
    turnos.push({
      role: 'user',
      parts: [{ text: 'Contexto de la aplicación, NO una nueva petición ni hechos que debas inventar: ' + notas.join(' | ') + '. Continúa desde lo ya conversado. Cuando el docente pida editar el Word, los cambios se verán directamente en la vista previa, con opción de Deshacer; no se guardan en la nube sin permiso.' }],
    });
  }

  // El historial se conserva en el chat privado únicamente tras autorización para guardar.
  // Esta preparación solo transmite texto, nunca audios, archivos ni claves.
  // No activar respuesta al cargar este historial; el docente iniciará
  // el siguiente turno hablando. El envío usa turnComplete:false.
  return turnos;
}
