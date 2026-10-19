/**
 * Feature flags for Docenty PRO.
 * Allows safely turning features on/off without touching core application logic.
 */
export const FEATURE_FLAGS = {
  // Feature flag for "Mi Formato" (subida de formatos escolares PDF, Word, fotos)
  MI_FORMATO_ENABLED: true,
  // Feature flag para clonación exacta byte a byte de archivos Word .docx
  MI_FORMATO_CLONAR_ENABLED: true,
  // Máximo tamaño de archivo en bytes (10 MB)
  MAX_FORMATO_FILE_SIZE: 10 * 1024 * 1024,
  // Formatos permitidos
  ALLOWED_EXTENSIONS: ['.pdf', '.docx', '.jpg', '.jpeg', '.png', '.webp'],
};
