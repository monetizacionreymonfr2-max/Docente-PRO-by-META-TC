/**
 * Doble de Gemini para pruebas SIN red. No evalúa la calidad pedagógica del modelo real:
 * solo permite comprobar el comportamiento del motor alrededor del proveedor.
 * `modo` simula respuestas defectuosas para verificar que se rechazan.
 */
function eliminarMencionGradoAnterior(texto, destino) {
  const ord = { 1: 'primer', 2: 'segundo', 3: 'tercer', 4: 'cuarto', 5: 'quinto', 6: 'sexto' };
  const nuevo = ord[destino] || 'quinto';
  return texto
    .replace(/\b(?:3er|3ro|3\.º|tercer|tercero)\s+grado\b/giu, `${nuevo} grado`)
    .replace(/\bgrado\s+(?:3|tercero)\b/giu, `grado ${destino}`)
    .replace(/\b(?:de|para)\s+tercero\b/giu, (m) => m.replace(/tercero/iu, nuevo));
}
const BASE = {
  'Lectura de relatos de un párrafo; ortografía de palabras de uso frecuente': ['Lectura de textos expositivos y narrativos de varios párrafos; uso de signos de puntuación y acentuación'],
  'Lee relatos breves de 3er grado y responde preguntas literales': ['Lee textos de varios párrafos y responde preguntas literales e inferenciales'],
  'Suma y resta con reagrupación hasta 1000; tablas del 2, 3 y 5': ['Multiplicación y división de números naturales; fracciones sencillas'],
  'Resuelve problemas de suma y resta con números hasta 1000': ['Resuelve problemas de multiplicación y división con números de hasta cinco cifras'],
  'Que los niños y niñas de tercer grado reconozcan la historia de su comunidad y la cuenten con textos sencillos.': ['Que los niños y niñas reconozcan la historia de su comunidad, la investiguen en varias fuentes y la redacten en textos de varios párrafos.'],
};
export function crearProveedorFicticio({ modo = 'ok' } = {}) {
  const llamadas = [];
  const proveedor = async (peticion) => {
    llamadas.push(peticion);
    const { gradoDestino, bloques, recordatorio } = peticion;
    if (modo === 'lanza') throw new Error('Camila está ocupada en este momento');
    const salida = {};
    for (const [i, b] of bloques.entries()) {
      const original = b.lineas.join(' ');
      const conocido = BASE[original];
      let lineas = conocido ?? b.lineas.map((l) => `${eliminarMencionGradoAnterior(l, gradoDestino)} — propuesta adaptada al nivel de ${gradoDestino}.º grado`);
      if (modo === 'omite_id' && i === 0 && !recordatorio) continue;
      if (modo === 'omite_siempre' && i === 0) continue;
      if (modo === 'grado_viejo' && i === 0) lineas = ['Actividad pensada para tercer grado'];
      if (modo === 'fecha_inventada' && i === 0) lineas = ['Entrega el 25-12-2026'];
      if (modo === 'markdown' && i === 0) lineas = ['**Lectura crítica** de textos', '- Debate guiado'];
      if (modo === 'vacio' && i === 0) lineas = [''];
      if (modo === 'xml' && i === 0) lineas = ['<w:t>hola</w:t>'];
      salida[b.id] = lineas;
    }
    if (modo === 'id_extra') salida['inventado#t99'] = ['x'];
    return salida;
  };
  proveedor.llamadas = llamadas;
  return proveedor;
}
