import test from 'node:test';
import assert from 'node:assert/strict';
import JSZip from 'jszip';
import {
  detectarCreacionPlanificacion, prepararPlanificacion, generarPlanificacionSinPlantilla,
} from '../src/lib/camilaFormato/planificacionSinPlantilla.ts';

const datos = {
  gradoSeccion: '5.º grado A',
  tema: 'Conservación del agua',
  diagnostico: 'El grupo requiere fortalecer la comprensión del ciclo del agua.',
};

function respuesta(periodo = 'semanal') {
  const etapas = periodo === 'diaria' ? 1 : periodo === 'semanal' ? 5 : periodo === 'quincenal' ? 10 : 4;
  const unidad = periodo === 'mensual' ? 'Semana' : 'Día';
  const bloque = (id, lineas) => ({ id, lineas });
  return { resultados: [
    bloque('proposito', ['Comprender el cuidado del agua en la comunidad.']),
    bloque('inicio', ['Conversar sobre experiencias del hogar.', 'Recuperar ideas previas.']),
    bloque('desarrollo', ['Observar representaciones del ciclo del agua.', 'Debatir formas de conservación.', 'Crear recomendaciones.']),
    bloque('cierre', ['Compartir conclusiones.', 'Registrar un compromiso.']),
    bloque('recursos', ['Cuaderno.', 'Láminas pedagógicas.']),
    bloque('evaluacion', ['Observación directa.', 'Lista de cotejo.']),
    bloque('indicadores', ['Explica el uso del agua.', 'Participa.', 'Propone acciones.']),
    bloque('secuencia', Array.from({ length: etapas }, (_, i) => unidad + ' ' + (i + 1) + ': Actividad de aprendizaje ' + (i + 1))),
  ] };
}

test('Camila detecta las cuatro periodicidades sin fabricar una periodicidad ausente', () => {
  assert.equal(detectarCreacionPlanificacion('Crea una planificación diaria'), 'diaria');
  assert.equal(detectarCreacionPlanificacion('Elabora planificación SEMANAL'), 'semanal');
  assert.equal(detectarCreacionPlanificacion('Haz una planificación quincenal'), 'quincenal');
  assert.equal(detectarCreacionPlanificacion('Prepara mi planificación mensual'), 'mensual');
  assert.equal(detectarCreacionPlanificacion('Crea una planificación'), 'sin_periodo');
  assert.equal(detectarCreacionPlanificacion('Corrige mi planificación semanal'), null);
  assert.equal(detectarCreacionPlanificacion('¿Qué es una planificación?'), null);
});

test('Camila solicita grado, tema y diagnóstico por separado', () => {
  assert.match(prepararPlanificacion({}, 'diaria').pregunta, /grado/);
  assert.match(prepararPlanificacion({ gradoSeccion: '5.º A' }, 'diaria').pregunta, /tema/);
  assert.match(prepararPlanificacion({ gradoSeccion: '5.º A', tema: 'Agua' }, 'diaria').pregunta, /conocimientos previos|necesidades/);
  assert.deepEqual(prepararPlanificacion(datos, 'diaria'), { listo: true });
});

for (const periodo of ['diaria', 'semanal', 'quincenal', 'mensual']) {
  test('Camila genera Word para planificación ' + periodo + ' sin inventar identidad', async () => {
    const { blob, pendientes } = await generarPlanificacionSinPlantilla(
      datos, periodo, async () => respuesta(periodo),
    );
    assert.ok(blob.size > 1500);
    const zip = await JSZip.loadAsync(await blob.arrayBuffer());
    const xml = await zip.file('word/document.xml').async('string');
    assert.match(xml, /Conservación del agua/);
    assert.match(xml, /5.º grado A/);
    assert.match(xml, /ciclo del agua/);
    assert.match(xml, /BORRADOR DE APOYO/);
    assert.match(xml, /Por confirmar/);
    assert.ok(pendientes.includes('Institución'));
    assert.ok(pendientes.includes('Docente'));
    assert.doesNotMatch(xml, /Camila Plus|DOCENTY PRO|Docente Ficticio A/);
  });
}

test('Camila rechaza un documento incompleto y no entrega un Word mal estructurado', async () => {
  await assert.rejects(
    generarPlanificacionSinPlantilla(datos, 'quincenal', async () => respuesta('semanal')),
    /secuencia pedagógica/,
  );
  await assert.rejects(
    generarPlanificacionSinPlantilla(datos, 'diaria', async () => ({ resultados: respuesta('diaria').resultados.slice(0, 6) })),
    /incompleta/,
  );
  await assert.rejects(
    generarPlanificacionSinPlantilla(datos, 'mensual', async () => ({ resultados: [
      ...respuesta('mensual').resultados.slice(0, -1),
      { id: 'secuencia', lineas: ['Semana 7: Actividad falsa'] },
    ] })),
    /secuencia pedagógica/,
  );
});
