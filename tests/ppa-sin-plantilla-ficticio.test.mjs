import assert from 'node:assert/strict';
import { test } from 'node:test';
import { writeFile } from 'node:fs/promises';
import JSZip from 'jszip';
import { prepararBorradorPpa, generarBorradorPpaSinPlantilla, solicitaCrearWordPpa } from '../src/lib/camilaFormato/borradorPpaSinPlantilla.ts';

const datos = {
  gradoSeccion: '4.º y 5.º grado',
  tema: 'Convivencia y cuidado de nuestra comunidad',
  diagnostico: 'Grupo ficticio que requiere fortalecer lectura y resolución de problemas.',
};

function respuesta(semanas = null) {
  return { resultados: [
    { id: 'finalidad', lineas: ['Fortalecer lectura y convivencia.', 'Desarrollar capacidades de colaboración.'] },
    { id: 'estrategias', lineas: ['Lecturas guiadas.', 'Conversatorios y carteles.', 'Resolución de situaciones cotidianas.'] },
    { id: 'evaluacion', lineas: ['Observación de participación.', 'Registro descriptivo del proceso.'] },
    ...(semanas ? [{ id: 'cronograma', lineas: Array.from({ length: semanas }, (_, i) => `Semana ${i + 1}: Actividad de práctica ${i + 1}.`) }] : []),
  ] };
}

test('sin Word ni proyecto guardado pregunta únicamente datos esenciales', () => {
  assert.match(prepararBorradorPpa({}).pregunta, /grado/i);
  assert.match(prepararBorradorPpa({ gradoSeccion: '5to' }).pregunta, /tema/i);
  assert.match(prepararBorradorPpa({ gradoSeccion: '5to', tema: 'Identidad' }).pregunta, /necesidades/i);
  assert.equal(prepararBorradorPpa(datos).listo, true);
});

test('reconoce una orden real para crear un PPA y evita hacerlo al consultar fotos', () => {
  assert.equal(solicitaCrearWordPpa('Créame un PPA de identidad usando la foto'), true);
  assert.equal(solicitaCrearWordPpa('Por favor elabora un proyecto pedagógico con el diagnóstico'), true);
  assert.equal(solicitaCrearWordPpa('¿Qué dice esta captura de WhatsApp?'), false);
  assert.equal(solicitaCrearWordPpa('Quiero que revises mi PPA antes de crearlo'), false);
});

test('genera un DOCX real sin nombre ajeno, logo ni semanas inventadas', async () => {
  let llamadas = 0;
  const { blob, pendientes } = await generarBorradorPpaSinPlantilla(datos, async (prompt) => {
    llamadas++;
    assert.match(prompt, /NO genere cronograma/);
    return respuesta();
  });
  assert.equal(llamadas, 1);
  assert.deepEqual(pendientes, ['Nombre del docente', 'Institución educativa', 'Duración y cronograma semanal']);
  const zip = await JSZip.loadAsync(await blob.arrayBuffer());
  const xml = await zip.file('word/document.xml').async('string');
  assert.match(xml, /Convivencia y cuidado de nuestra comunidad/);
  assert.match(xml, /Grupo ficticio/);
  assert.match(xml, /Pendiente por confirmar/);
  assert.match(xml, /NO ES FORMATO OFICIAL/);
  assert.doesNotMatch(xml, /Semana 1:/);
  assert.equal(Object.keys(zip.files).filter((p) => p.startsWith('word/media/')).length, 0);
});

test('mantiene exactamente la duración y rechaza cronogramas incoherentes', async () => {
  const tres = { ...datos, duracion: '3 semanas', docente: 'Docente Ficticia', institucion: 'Escuela de Prueba' };
  const { blob, pendientes } = await generarBorradorPpaSinPlantilla(tres, async () => respuesta(3));
  assert.deepEqual(pendientes, []);
  // El archivo se escribe solo durante una revisión visual explícita, no en CI.
  if (process.env.CAMILA_PPA_QA_OUTPUT) {
    await writeFile(process.env.CAMILA_PPA_QA_OUTPUT, Buffer.from(await blob.arrayBuffer()));
  }
  const xml = await (await JSZip.loadAsync(await blob.arrayBuffer())).file('word/document.xml').async('string');
  assert.match(xml, /Semana 3:/);
  assert.doesNotMatch(xml, /Semana 4:/);
  await assert.rejects(() => generarBorradorPpaSinPlantilla(tres, async () => respuesta(4)), /exactamente 3 semanas/i);
  assert.match(prepararBorradorPpa({ ...tres, duracion: '21 días' }).pregunta, /semanas/i);
});

test('bloque repetido o incompleto no llega a convertirse en documento', async () => {
  const mal = respuesta();
  mal.resultados[1].id = 'finalidad';
  await assert.rejects(() => generarBorradorPpaSinPlantilla(datos, async () => mal), /incompleto|inesperado/i);
});
