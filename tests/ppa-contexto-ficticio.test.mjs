import assert from 'node:assert/strict';
import { test } from 'node:test';
import { combinarDatosProyecto, prepararVaciadoPpa, extraerDuracionSemanas } from '../src/lib/camilaFormato/contextoProyectoPpa.ts';

const ficticio = {
  gradoSeccion: '4to, 5to y 6to grado', tema: 'Identidad y convivencia',
  diagnostico: 'Grupo ficticio con necesidades de lectura y operaciones básicas.',
  docente: 'Profesora de Prueba', institucion: 'Escuela Ficticia del Valle',
  duracion: '4 semanas', matricula: '6 estudiantes ficticios',
};

test('un PPA nuevo no exige un proyecto previamente guardado', () => {
  const decision = prepararVaciadoPpa({});
  assert.equal(decision.listo, false);
  assert.match(decision.pregunta, /grado o grados/i);
  assert.doesNotMatch(decision.pregunta, /proyecto guardado/i);
});

test('Camila pregunta un dato esencial a la vez, sin inventar nombres de terceros', () => {
  const sinDocente = { ...ficticio, docente: '' };
  const decision = prepararVaciadoPpa(sinDocente);
  assert.equal(decision.listo, false);
  assert.match(decision.pregunta, /nombre de la docente/i);
  assert.doesNotMatch(decision.pregunta, /escuela ficticia/i);
});

test('fusiona datos temporales de la conversación sin borrar datos confirmados con respuestas vacías', () => {
  const contexto = combinarDatosProyecto({ gradoSeccion: ficticio.gradoSeccion }, { tema: ficticio.tema, gradoSeccion: '  ' });
  assert.equal(contexto.gradoSeccion, ficticio.gradoSeccion);
  assert.equal(contexto.tema, ficticio.tema);
  assert.equal(Object.hasOwn(contexto, 'docente'), false);
});

test('prepara datos reales de PPA multigrado sin copiar identidades ni duración por defecto', () => {
  const decision = prepararVaciadoPpa(ficticio);
  assert.equal(decision.listo, true);
  assert.equal(decision.datos.gradoSeccion, ficticio.gradoSeccion);
  assert.equal(decision.datos.diagnostico, ficticio.diagnostico);
  assert.equal(decision.datos.docente, ficticio.docente);
  assert.equal(decision.datos.institucion, ficticio.institucion);
  assert.equal(decision.datos.duracion, ficticio.duracion);
});

test('sin diagnóstico explícito no fabrica características de estudiantes', () => {
  const decision = prepararVaciadoPpa({ ...ficticio, diagnostico: '' });
  assert.equal(decision.listo, false);
  assert.match(decision.pregunta, /diagnóstico|necesidades de aprendizaje/i);
});

test('las semanas se interpretan exactamente, nunca se sustituyen silenciosamente por cuatro', () => {
  assert.equal(extraerDuracionSemanas('3 semanas'), 3);
  assert.equal(extraerDuracionSemanas('6 semanas'), 6);
  assert.equal(extraerDuracionSemanas('21 días'), null);
  assert.equal(prepararVaciadoPpa({ ...ficticio, duracion: '21 días' }).listo, false);
});
