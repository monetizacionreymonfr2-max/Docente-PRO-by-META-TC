// Campaña de reactivación: fechas de Venezuela (UTC-04:00).
export const REACTIVATION_PRICE_USD = 2;
export const REACTIVATION_DAYS = 37;
export const REACTIVATION_END = Date.parse('2027-01-01T04:00:00Z');
export const REACTIVATION_START = Date.parse('2026-11-26T04:00:00Z');

export function isReactivationCampaignOpen(now = Date.now()): boolean {
  return now >= REACTIVATION_START && now < REACTIVATION_END;
}

export function isExpiredPro(profile: { role?: string; planType?: string; access_level?: string; expiresAt?: unknown } | null | undefined, now = Date.now()): boolean {
  if (!profile || profile.role !== 'teacher' || profile.planType !== 'pro' || profile.access_level !== 'pro' || typeof profile.expiresAt !== 'string') return false;
  const expiration = Date.parse(profile.expiresAt);
  return Number.isFinite(expiration) && expiration <= now;
}

export const REACTIVATION_MESSAGE = '¡Hola, profe! Queremos seguir acompañándote en tus actividades escolares con DOCENTY PRO. Reactiva tu plan Pro por $2 y disfruta 37 días (30 días + 7 de regalo), previa confirmación de tu pago y elegibilidad. Promoción hasta el 31 de diciembre de 2026. Si no deseas recibir más mensajes, puedes indicárnoslo. ¿Te gustaría regresar?';
