import test from 'node:test';
import assert from 'node:assert/strict';
import JSZip from 'jszip';
import { generarPpaSinPlantillaCompleto } from '../src/lib/camilaFormato/ppaSinPlantillaCompleto.ts';
import {
  semanasDeCalendario, textoFecha, validarPpaCompleto, fechaDesdeDato,
  resguardarHechosInstitucionalesPpa,
} from '../src/lib/camilaFormato/ppaEstructurado.ts';

const identidad = {
  gradoSeccion:'2do grado, sección E', tema:'Identidad y familia',
  diagnostico:'Dificultad lectora, solo saben sumar', duracion:'6 semanas',
  docente:'Docente Ficticia Nueva', institucion:'Escuela Ficticia Nueva',
  anioEscolar:'2026-2027', fechaInicio:'03-11-2026', fechaFin:'10-12-2026',
};
const fila=(area)=>({
  area, componente:'Identidad comunitaria', contenidos:'Reconocer nombres propios',
  tejidosTematicos:'Lectura guiada de nombres y sílabas',
  aprendizajes:'Identifica palabras de su familia',
  recursos:'Tarjetas, lápices y aula', indicadores:'Lee con apoyo',
  tecnicaInstrumentos:'Observación y lista de cotejo',
});
const plan=()=>({
  titulo:'Conozco mi familia y mi comunidad',
  preguntaGeneradora:'¿Quién soy y qué hace especial mi familia?',
  productoFinal:'Álbum con dibujos, nombres y frases cortas',
  vinculacionNacional:'Identidad personal, familiar y comunitaria',
  contexto:'Estudiantes de segundo grado que requieren ayuda lectora',
  necesidades:'Fortalecer lectura silábica y sumas sencillas',
  potencialidades:'Aprendizaje colaborativo con familiares',
  instrumentosDiagnostico:'Observación, lista de cotejo y registro',
  propositoGeneral:'Fortalecer comunicación y comprensión de la identidad',
  propositosEspecificos:'Leer palabras; realizar sumas; valorar a la familia',
  cierre:'Presentación del álbum de la comunidad',
  semanas:Array.from({length:6},(_,i)=>({ numero:i+1,tema:'Identidad y familia',filas:[
    fila('Lenguaje'),fila('Matemática'),fila('Ciencia, Tecnología y Sociedad'),fila('Ciencias Sociales'),
  ]}))
});
test('seis semanas reales desde el 3 de noviembre hasta el 10 de diciembre',()=>{
  const s=semanasDeCalendario(identidad.fechaInicio,identidad.fechaFin);
  assert.equal(s.length,6);
  assert.equal(textoFecha(s[0].inicio),'03-11-26');
  assert.equal(textoFecha(s[0].fin),'06-11-26');
  assert.equal(textoFecha(s[1].inicio),'09-11-26');
  assert.equal(textoFecha(s[4].fin),'04-12-26');
  assert.equal(textoFecha(s[5].fin),'10-12-26');
});
test('no inventa ni acepta fechas fuera de calendario',()=>{
  assert.equal(fechaDesdeDato('31-11-2026'),null);
  assert.equal(semanasDeCalendario('01-01-2026','01-01-2025'),null);
});
test('valida un PPA completo antes de tocar el Word',()=>{
  assert.deepEqual(validarPpaCompleto(plan(),identidad),[]);
});
test('no convierte supuestos de Gemini sobre una institución en hechos del PPA',()=>{
  const generada = plan();
  generada.contexto='La escuela está en un barrio sin agua potable y los estudiantes no tienen libros.';
  generada.necesidades='Aulas sin electricidad ni acceso a materiales.';
  generada.potencialidades='Se observó gran interés familiar en visitas domiciliarias.';
  generada.instrumentosDiagnostico='Ya se aplicaron encuestas a los padres.';
  generada.vinculacionNacional='Resolución ministerial ficticia 1234 de 2026.';
  const revisada=resguardarHechosInstitucionalesPpa(generada,identidad);
  const campos=['contexto','necesidades','potencialidades','instrumentosDiagnostico','vinculacionNacional'];
  for(const campo of campos){
    assert.doesNotMatch(revisada[campo],/sin agua potable|sin electricidad|visitas domiciliarias|Ya se aplicaron|1234/);
  }
  assert.match(revisada.contexto,/Dificultad lectora, solo saben sumar/);
  assert.match(revisada.potencialidades,/Pendiente de confirmar/);
  assert.match(revisada.instrumentosDiagnostico,/no aplicada ni verificada/);
  assert.match(revisada.vinculacionNacional,/lineamientos vigentes del MPPE/);
  assert.equal(generada.contexto,'La escuela está en un barrio sin agua potable y los estudiantes no tienen libros.');
  assert.deepEqual(validarPpaCompleto(revisada,identidad),[]);
});
test('el Word final tampoco contiene hechos escolares inventados por el modelo',async()=>{
  const inventado=plan();
  inventado.contexto='La escuela está ubicada en una zona sin agua potable.';
  inventado.necesidades='La escuela carece de biblioteca y comedor.';
  inventado.potencialidades='Las familias ya organizaron jornadas de limpieza.';
  inventado.instrumentosDiagnostico='Ya se aplicaron encuestas domiciliarias.';
  inventado.vinculacionNacional='Artículo ministerial ficticio 2026.';
  const {blob}=await generarPpaSinPlantillaCompleto(identidad,async()=>inventado);
  const zip=await JSZip.loadAsync(await blob.arrayBuffer());
  const xml=await zip.file('word/document.xml').async('string');
  assert.match(xml,/Diagnóstico informado por el docente/);
  assert.match(xml,/Dificultad lectora, solo saben sumar/);
  assert.doesNotMatch(xml,/zona sin agua potable|carece de biblioteca|jornadas de limpieza|encuestas domiciliarias|ministerial ficticio/);
  await assert.rejects(
    ()=>generarPpaSinPlantillaCompleto(identidad,async()=>({...inventado,contexto:''})),
    /Campo incompleto: contexto/,
  );
});
test('rechaza 5 semanas de las 6 solicitadas',()=>{
  const p=plan();p.semanas.pop();
  assert.match(validarPpaCompleto(p,identidad).join(' '),/6 semanas/);
});
test('rechaza inconsistencias entre fechas y duración',()=>{
  const id={...identidad,fechaFin:'20-11-2026'};
  assert.match(validarPpaCompleto(plan(),id).join(' '),/fechas abarcan/i);
});
test('rechaza áreas prohibidas y celdas incompletas',()=>{
  const p=plan();p.semanas[0].filas.push(fila('Inglés'));
  assert.match(validarPpaCompleto(p,identidad,['Inglés']).join(' '),/excluida/i);
  p.semanas[0].filas.pop();
  p.semanas[2].filas[1].indicadores='';
  assert.match(validarPpaCompleto(p,identidad).join(' '),/indicadores/);
});

test('rechaza periodos con inicio o cierre en fin de semana',()=>{
  assert.equal(semanasDeCalendario('07-11-2026','10-12-2026'),null);
  assert.equal(semanasDeCalendario('03-11-2026','12-12-2026'),null);
});
