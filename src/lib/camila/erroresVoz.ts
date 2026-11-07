/** Mensajes seguros y concretos para problemas de conexión con Gemini Live. */
export function describirErrorVoz(error: unknown): string {
  const codigo = error instanceof Error ? error.message : '';
  const tipo = error instanceof Error ? error.name : '';

  if (codigo === 'MICROFONO_NO_DISPONIBLE') {
    return 'Este navegador no permite usar el micrófono. Prueba desde Chrome o Safari actualizado.';
  }
  if (codigo === 'SESION_REQUERIDA' || codigo === 'Sesión inválida') {
    return 'Tu sesión venció. Inicia sesión nuevamente para hablar con Camila.';
  }
  if (tipo === 'NotAllowedError' || tipo === 'SecurityError') {
    return 'Debes permitir el acceso al micrófono para hablar con Camila.';
  }
  if (tipo === 'NotFoundError' || tipo === 'DevicesNotFoundError') {
    return 'No se encontró un micrófono disponible en este dispositivo. Conecta uno o prueba desde tu teléfono.';
  }
  if (tipo === 'NotReadableError' || tipo === 'TrackStartError') {
    return 'El micrófono está ocupado o no se pudo abrir. Cierra otras aplicaciones que lo estén usando.';
  }
  if (tipo === 'OverconstrainedError') {
    return 'El micrófono no admite esta configuración de audio. Intenta con otro dispositivo.';
  }
  if (tipo === 'NotSupportedError') {
    return 'Tu navegador no admite este modo de audio. Prueba con Chrome o Safari actualizado.';
  }
  if (codigo === 'Voz no configurada') {
    return 'La voz de Camila no está configurada en este entorno. Comunícalo al administrador.';
  }
  if (/^(La conversación por voz requiere|Las llamadas de Camila todavía|No se pudo iniciar Camila por voz|No se pudo abrir la conversación por voz|No se pudo conectar la voz de Camila|La conexión de voz no devolvió una sesión válida|Espera unos segundos|No se pudo verificar la licencia)/.test(codigo)) {
    return codigo;
  }
  return 'No se pudo iniciar la voz de Camila. Inténtalo nuevamente.';
}
