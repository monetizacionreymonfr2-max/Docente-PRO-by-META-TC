/**
 * Helper utility for WhatsApp links and actions across Docenty PRO
 */

export const DEFAULT_WHATSAPP_PHONE = '584262953484';

export function getWhatsAppUrl(phone: string = DEFAULT_WHATSAPP_PHONE, text: string = ''): string {
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const encodedText = encodeURIComponent(text);
  return `https://wa.me/${cleanPhone}${encodedText ? `?text=${encodedText}` : ''}`;
}

export function openWhatsApp(text: string = '', phone: string = DEFAULT_WHATSAPP_PHONE): void {
  const url = getWhatsAppUrl(phone, text);
  window.open(url, '_blank', 'noopener,noreferrer');
}

export const whatsapp = {
  phone: DEFAULT_WHATSAPP_PHONE,
  getUrl: getWhatsAppUrl,
  open: openWhatsApp,
};

export default openWhatsApp;
