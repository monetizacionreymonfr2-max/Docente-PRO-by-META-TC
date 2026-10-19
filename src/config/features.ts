/**
 * Feature flags for Docenty PRO.
 * Allows safely turning features on/off without touching core application logic.
 */
export const FEATURE_FLAGS = {
  // Feature flag for "Mi Formato" (subida de formatos escolares PDF, Word, fotos)
  MI_FORMATO_ENABLED: true,
  // Poner en false para abrir Mi Formato a todos los docentes Pro
  MI_FORMATO_SOLO_ADMIN: true,
  // Feature flag para clonación exacta byte a byte de archivos Word .docx
  MI_FORMATO_CLONAR_ENABLED: true,
  // Máximo tamaño de archivo en bytes (10 MB)
  MAX_FORMATO_FILE_SIZE: 10 * 1024 * 1024,
  // Formatos permitidos
  ALLOWED_EXTENSIONS: ['.pdf', '.docx', '.jpg', '.jpeg', '.png', '.webp'],
};

/**
 * Determina si el usuario actual tiene permisos para ver y usar "Mi Formato".
 * Si MI_FORMATO_ENABLED es false, nadie lo ve.
 * Si MI_FORMATO_SOLO_ADMIN es true, solo los administradores tienen acceso.
 * Poner MI_FORMATO_SOLO_ADMIN en false abre la función a todos los usuarios.
 */
export const puedeVerMiFormato = (isAdmin?: boolean): boolean => {
  return Boolean(FEATURE_FLAGS.MI_FORMATO_ENABLED && (!FEATURE_FLAGS.MI_FORMATO_SOLO_ADMIN || isAdmin));
};

