import test from 'node:test';
import assert from 'node:assert/strict';
import JSZip from 'jszip';
import { DOMParser as XmlDOMParser, XMLSerializer } from '@xmldom/xmldom';
import { adaptarPpaCompletoAWord } from '../src/lib/camilaFormato/adaptarPpaDocx.ts';

const W='http://schemas.openxmlformats.org/wordprocessingml/2006/main';
const xml=(str)=>str.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
const p=(x)=>`<w:p><w:r><w:t>${xml(x)}</w:t></w:r></w:p>`;
const cell=(x)=>`<w:tc>${p(x)}</w:tc>`;
const row=(arr)=>`<w:tr>${arr.map(cell).join('')}</w:tr>`;
const table=(rows)=>`<w:tbl>${rows.map(row).join('')}</w:tbl>`;
const vieja='Docente Ficticia Antigua',nueva='Docente Ficticia Nueva';
const colegioViejo='Institución Ficticia Anterior', colegioNuevo='Institución Ficticia Nueva';
const identidad={docente:nueva,institucion:colegioNuevo,gradoSeccion:'2do grado, sección E',
  tema:'Mi identidad',diagnostico:'Dificultad lectora y solo suman',duracion:'6 semanas',
  anioEscolar:'2026-2027',fechaInicio:'03-11-2026',fechaFin:'10-12-2026'};
const fila=(area)=>({area,componente:'Vínculo comunitario',contenidos:'Palabras y sílabas',
  tejidosTematicos:'Lectura de nombres y objetos',aprendizajes:'Lee palabras con apoyo',
  recursos:'Tarjetas y cuaderno',indicadores:'Identifica sílabas',tecnicaInstrumentos:'Observación, lista de cotejo'});
const plan=()=>({
  titulo:'Soy yo, soy mi comunidad',preguntaGeneradora:'¿Quién soy?',
  productoFinal:'Álbum de identidad',vinculacionNacional:'Educación venezolana',
  contexto:'Grupo de segundo grado',necesidades:'Reforzar lectura y suma',potencialidades:'Aprender en familia',
  instrumentosDiagnostico:'Lista de cotejo',propositoGeneral:'Fortalecer identidad',
  propositosEspecificos:'Leer palabras y sumar cantidades',cierre:'Presentación de álbumes',
  semanas:Array.from({length:6},(_,i)=>({numero:i+1,tema:'Identidad',filas:[
    fila('Lenguaje'),fila('Matemática'),fila('Ciencia, Tecnología y Sociedad'),fila('Ciencias Sociales')
  ]}))
});
async function fixture(){
  const oldHeader=row(['Áreas de Aprendizaje','Componentes','Contenidos','Tejidos Temáticos','Aprendizajes Esperados','Recursos','Indicadores','Técnicas','Fechas']);
  const viejo=row(['Lenguaje','Sexto Grado','Contenido viejo','Actividad vieja','Logros viejos','Recursos viejos','Indicadores viejos','Técnicas viejas','26-10-26']);
  const cuadrito=`<w:tbl>${oldHeader}${row(['SEMANA 1 · 26-10-2026'])}${viejo}${row(['SEMANA 2'])}${viejo}</w:tbl>`;
  const completo=`<w:document xmlns:w="${W}"><w:body>
    ${p('PROYECTO PEDAGÓGICO DE AULA (PPA)')}
    ${p('Educación Primaria · Sexto grado')}
    ${table([
      ['Institución',colegioViejo,'Docente',vieja],
      ['Grado y sección','6to grado, sección U','Año escolar','2026-2027'],
      ['Duración','5 semanas','Período','Del 26-10-26 al 27-11-26']])}
    ${table([
      ['Título del proyecto','TÍTULO ANTIGUO'],['Pregunta generadora','Pregunta anterior'],
      ['Producto final','Antiguo'],['Vinculación nacional','Anterior']])}
    ${p('DIAGNÓSTICO DEL PROYECTO')}
    ${table([
      ['Contexto y situación','Contexto anterior'],['Necesidades de aprendizaje','Otra dificultad'],
      ['Potencialidades','Otros datos'],['Técnicas e instrumentos del diagnóstico','Otro instrumento']])}
    ${p('PROPÓSITO DEL PROYECTO')}
    ${table([['Propósito general','Propósito viejo'],['Propósitos específicos','Objetivos viejos']])}
    ${p('PARRILLA DE PLANIFICACIÓN — 5 SEMANAS')}
    ${cuadrito}
    ${p('ORGANIZACIÓN DE LA SEMANA DE FERIA')}
    ${table([['Lunes','Martes','Miércoles','Jueves','Viernes'],['Feria vieja','Feria vieja','Feria vieja','Feria vieja','Feria vieja']])}
    ${p('Cierre del proyecto: antigua feria')}
    ${table([['Docente: '+vieja,'','Director(a)']])}
    </w:body></w:document>`;
  const pie=`<w:ftr xmlns:w="${W}"><w:p><w:r><w:t>PPA “TÍTULO ANTIGUO” · 6to grado · Prof. ${vieja} · Página </w:t></w:r><w:r><w:fldChar w:fldCharType="begin"/></w:r><w:r><w:instrText>PAGE</w:instrText></w:r></w:p></w:ftr>`;
  const zip=new JSZip();zip.file('word/document.xml',completo);zip.file('word/footer1.xml',pie);
  zip.file('word/media/logo-colegio.png',new Uint8Array([137,80,78,71,10,2,1]));
  return zip.generateAsync({type:'blob'});
}
async function withXmlDom(work){
  const prevP=globalThis.DOMParser, prevS=globalThis.XMLSerializer;
  const proto=new XmlDOMParser().parseFromString(`<w:x xmlns:w="${W}"/>`,'application/xml').documentElement.constructor.prototype;
  const oldQ=proto.querySelector,oldQA=proto.querySelectorAll;
  proto.querySelector=()=>null;proto.querySelectorAll=()=>[];
  globalThis.DOMParser=class{parseFromString(s,m){const d=new XmlDOMParser().parseFromString(s,m);d.querySelector=()=>null;return d;}};
  globalThis.XMLSerializer=XMLSerializer;
  try{return await work();}finally{
    globalThis.DOMParser=prevP;globalThis.XMLSerializer=prevS;
    if(oldQ)proto.querySelector=oldQ;else delete proto.querySelector;
    if(oldQA)proto.querySelectorAll=oldQA;else delete proto.querySelectorAll;
  }
}
test('DOCX integral: reconstruye 6 semanas, borra identidad antigua y conserva logo', async()=>{
  await withXmlDom(async()=>{
    const original=await fixture();
    const originalBytes=Buffer.from(await original.arrayBuffer());
    const terminado=await adaptarPpaCompletoAWord(original,plan(),identidad,['Inglés']);
    const nuevo=await JSZip.loadAsync(await terminado.arrayBuffer());
    const xmlDoc=await nuevo.file('word/document.xml').async('string');
    const pie=await nuevo.file('word/footer1.xml').async('string');
    assert.equal((xmlDoc.match(/SEMANA \d+ ·/g)||[]).length,6);
    for(let i=1;i<=6;i++)assert.match(xmlDoc,new RegExp('SEMANA '+i+' ·'));
    assert.doesNotMatch(xmlDoc,/Sexto Grado|26-10-26|TÍTULO ANTIGUO/);
    assert.doesNotMatch(xmlDoc,new RegExp(vieja));
    assert.doesNotMatch(pie,new RegExp(vieja));
    assert.match(pie,new RegExp(nueva));
    assert.match(xmlDoc,/03-11-26/);assert.match(xmlDoc,/10-12-26/);
    assert.deepEqual(await nuevo.file('word/media/logo-colegio.png').async('uint8array'),new Uint8Array([137,80,78,71,10,2,1]));
    assert.deepEqual(Buffer.from(await original.arrayBuffer()),originalBytes,'El original nunca se modifica');
  });
});
test('rechaza un PPA incompleto sin modificar el archivo anterior',async()=>{
  await withXmlDom(async()=>{
    const x=plan();x.semanas.pop();
    await assert.rejects(()=>adaptarPpaCompletoAWord(await fixture(),x,identidad),/6 semanas/);
  });
});
