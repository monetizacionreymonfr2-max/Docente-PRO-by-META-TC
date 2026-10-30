/** Determina cuándo una petición exige generar TODO el PPA, no parches individuales. */
export function solicitaPpaIntegral(texto: string): boolean {
  const normal = texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const accion = /\b(crea(?:r|me)?|haz(?:me)?|genera(?:r|me)?|redacta(?:r|me)?|elabora(?:r)?|prepara(?:r)?|completa(?:r|lo|me)?|adapta(?:r|lo)?|llena(?:r)?|vacia(?:r)?|ajusta(?:r|rlo|lo)?|termina(?:r|lo)?)\b/.test(normal);
  const objeto = /\b(ppa|proyecto|identidad|formato|word|documento)\b/.test(normal);
  // Una instrucción de completar o adaptar el documento abierto también es integral.
  const explicitamenteCompleto = /\b(completalo|completarlo|terminarlo|llenarlo|vaciarlo)\b/.test(normal);
  return (accion && objeto) || explicitamenteCompleto;
}
