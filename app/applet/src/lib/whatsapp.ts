const DEFAULT_WHATSAPP = '584262953484';
const STORAGE_KEY = 'docente_pro_whatsapp_number';

export function getWhatsAppNumber(): string {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? saved : DEFAULT_WHATSAPP;
  } catch {
    return DEFAULT_WHATSAPP;
  }
}

export function setWhatsAppNumber(num: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, num.trim());
    window.dispatchEvent(new CustomEvent('whatsapp-number-changed', { detail: num.trim() }));
  } catch (err) {
    console.error('Error saving whatsapp number', err);
  }
}

export function getWhatsAppUrl(customMessage?: string): string {
  const number = getWhatsAppNumber();
  const defaultMsg = 'Hola, vengo de DOCENTE PRO y quiero información sobre los códigos PRO / activación.';
  const message = encodeURIComponent(customMessage || defaultMsg);
  return `https://wa.me/${number}?text=${message}`;
}
