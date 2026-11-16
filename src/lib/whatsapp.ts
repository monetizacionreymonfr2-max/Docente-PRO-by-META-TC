/**
 * Helper utility for WhatsApp links and actions across Docenty PRO
 */

const STORAGE_KEY = 'docenty_whatsapp_number';
export const DEFAULT_WHATSAPP_PHONE = '584262953484';
export const DEFAULT_WHATSAPP_NUMBER = DEFAULT_WHATSAPP_PHONE;
export const WHATSAPP_NUMBER = DEFAULT_WHATSAPP_PHONE;

/**
 * Gets the configured WhatsApp number, falling back to the default
 */
export function getWhatsAppNumber(): string {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved && saved.trim()) return saved.trim();
    }
  } catch (e) {
    console.warn('Error reading whatsapp number from localStorage', e);
  }
  return DEFAULT_WHATSAPP_PHONE;
}

/**
 * Sets and saves the WhatsApp number to localStorage
 */
export function setWhatsAppNumber(number: string): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(STORAGE_KEY, number.trim());
    }
  } catch (e) {
    console.warn('Error saving whatsapp number to localStorage', e);
  }
}

export const saveWhatsAppNumber = setWhatsAppNumber;
export const loadWhatsAppNumber = getWhatsAppNumber;

export function getWhatsAppUrl(phone: string = getWhatsAppNumber(), text: string = ''): string {
  const cleanPhone = (phone || DEFAULT_WHATSAPP_PHONE).replace(/[^0-9]/g, '');
  const encodedText = encodeURIComponent(text);
  return `https://wa.me/${cleanPhone}${encodedText ? `?text=${encodedText}` : ''}`;
}

/** Mensaje de contacto predeterminado de Camila Plus; no es una respuesta automática. */
export const CAMILA_PLUS_WHATSAPP_MESSAGE = 'Hola, Camila. Soy docente de DOCENTY PRO y quiero conocer el Plan Camila Plus de $5 por 30 días para solicitar proyectos pedagógicos, planificaciones semanales, documentos institucionales y materiales de apoyo educativo. Te enviaré los datos por escrito, sin audios, y puedo adjuntar el formato de mi institución si lo necesito.';

export function getCamilaPlusWhatsAppMessage(customerCode = ''): string {
  const code = customerCode.trim().toUpperCase();
  return CAMILA_PLUS_WHATSAPP_MESSAGE +
    ( /^DP-[A-Z0-9]+$/.test(code) ? ' Mi código de atención es: ' + code + '.' : '' );
}

export function openWhatsApp(text: string = CAMILA_PLUS_WHATSAPP_MESSAGE, phone: string = getWhatsAppNumber()): void {
  const url = getWhatsAppUrl(phone, text);
  window.open(url, '_blank', 'noopener,noreferrer');
}

export const whatsapp = {
  phone: DEFAULT_WHATSAPP_PHONE,
  getNumber: getWhatsAppNumber,
  setNumber: setWhatsAppNumber,
  getUrl: getWhatsAppUrl,
  open: openWhatsApp,
};

export default openWhatsApp;
