/**
 * Instala DOMParser/XMLSerializer globales para ejecutar el código del navegador en Node.
 * Usa @xmldom/xmldom (dependencia del proyecto). Si no está instalado (entornos sin red),
 * usa el DOM de respaldo de helpers/xmlDomOffline.mjs y lo declara en `DOM_ORIGEN`.
 */
let impl;
try { impl = await import('@xmldom/xmldom'); } catch { impl = await import('./xmlDomOffline.mjs'); }
export const DOM_ORIGEN = impl.DOM_OFFLINE ? 'respaldo-offline (tests/helpers/xmlDomOffline.mjs)' : '@xmldom/xmldom';
const W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';

export function instalarDom() {
  const previos = { P: globalThis.DOMParser, S: globalThis.XMLSerializer };
  if (impl.DOM_OFFLINE) {
    globalThis.DOMParser = impl.DOMParser; globalThis.XMLSerializer = impl.XMLSerializer;
  } else {
    // xmldom real no implementa querySelector(All): el editor solo lo usa como alternativa en navegador.
    const proto = new impl.DOMParser().parseFromString(`<w:x xmlns:w="${W}"/>`, 'application/xml').documentElement.constructor.prototype;
    proto.querySelector = () => null; proto.querySelectorAll = () => [];
    globalThis.DOMParser = class { parseFromString(s, m) { const d = new impl.DOMParser().parseFromString(s, m); d.querySelector = () => null; return d; } };
    globalThis.XMLSerializer = impl.XMLSerializer;
  }
  return () => { globalThis.DOMParser = previos.P; globalThis.XMLSerializer = previos.S; };
}
