import JSZip from 'jszip';
import { DOMParser, XMLSerializer } from '@xmldom/xmldom';
import {
  ejecutarOperacionesEnDocx,
  revisarDocumentoVivo,
  OperacionDocx,
} from './src/lib/camilaFormato/camilaFormatoEngine';
import { construirMapa } from './src/lib/docxClone/docxEditor';
import { PlantillaDocx } from './src/lib/docxClone/types';
import { getCamilaFormatoModel, setCamilaFormatoModel } from './src/lib/camilaFormato/camilaFormatoConfig';

async function testCamilaFormato() {
  console.log('--- TEST 1: Configuración de modelos ---');
  console.log('Modelo por defecto:', getCamilaFormatoModel());
  setCamilaFormatoModel('gemini-2.5-pro');
  console.log('Modelo tras set:', getCamilaFormatoModel());
  setCamilaFormatoModel('gemini-2.5-flash');
  console.log('Modelo restaurado:', getCamilaFormatoModel());

  console.log('\n--- TEST 2: Operaciones sobre documento XML vivo ---');
  const xml = `
    <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
      <w:body>
        <w:p><w:r><w:t>Docente: Juan Perez   Grado: 3er Grado</w:t></w:r></w:p>
        <w:p><w:r><w:t>DIAGNÓSTICO</w:t></w:r></w:p>
        <w:p><w:r><w:t>Texto original de diagnóstico</w:t></w:r></w:p>
        <w:p><w:r><w:t>CRONOGRAMA DE ACTIVIDADES (3 SEMANAS)</w:t></w:r></w:p>
        <w:tbl>
          <w:tr><w:tc><w:p><w:r><w:t>ÁREA: LENGUA</w:t></w:r></w:p></w:tc></w:tr>
          <w:tr><w:tc><w:p><w:r><w:t>Contenido original viejo</w:t></w:r></w:p></w:tc></w:tr>
        </w:tbl>
        <w:tbl>
          <w:tr>
            <w:tc><w:p><w:r><w:t>SEMANA</w:t></w:r></w:p></w:tc>
            <w:tc><w:p><w:r><w:t>ACTIVIDAD</w:t></w:r></w:p></w:tc>
          </w:tr>
          <w:tr>
            <w:tc><w:p><w:r><w:t>Semana 1</w:t></w:r></w:p></w:tc>
            <w:tc><w:p><w:r><w:t>Actividad 1</w:t></w:r></w:p></w:tc>
          </w:tr>
        </w:tbl>
      </w:body>
    </w:document>
  `;

  const doc = new DOMParser().parseFromString(xml, 'application/xml');
  const mapa = construirMapa(doc as any);

  const plantilla: PlantillaDocx = {
    encabezados: [
      { id: 'docente', campo: 'docente', parrafoId: 'p0', etiqueta: 'Docente:', valorOriginal: 'Juan Perez' },
      { id: 'grado', campo: 'grado', parrafoId: 'p0', etiqueta: 'Grado:', valorOriginal: '3er Grado' },
    ],
    tablas: [
      { id: 't0', tipo: 'ficha_area', titulo: 'ÁREA: LENGUA', columnas: ['Contenido'], celdasContenidoIds: ['t0.r1.c0'], celdasEtiquetaIds: ['t0.r0.c0'], filasEncabezadoIds: ['t0.r0'] },
      { id: 't1', tipo: 'cronograma', titulo: 'Cronograma', columnas: ['Semana', 'Actividad'], celdasContenidoIds: ['t1.r1.c0', 't1.r1.c1'], celdasEtiquetaIds: [], filasEncabezadoIds: ['t1.r0'] },
    ],
    bloquesRepetidos: [],
    celdasTextoLibre: [{ id: 'p2', tipo: 'diagnostico', textoOriginal: 'Texto original de diagnóstico' }],
    lapsoSemanasEstimado: 3,
  };

  const ops: OperacionDocx[] = [
    { tipo: 'set_parrafo', id: 'p2', texto: 'Nuevo diagnóstico para 1er grado enfocado en lectura y convivencia.' },
    { tipo: 'set_celda', id: 't0.r1.c0', lineas: ['Producción de textos creativos y rondas infantiles'] },
    { tipo: 'set_titulo', id: 'p3', texto: 'CRONOGRAMA DE ACTIVIDADES (4 SEMANAS)' },
    {
      tipo: 'agregar_filas',
      tablaId: 't1',
      filas: [['Semana 2', 'Taller de caligrafía y juegos cooperativos']],
    },
    { tipo: 'set_encabezado', etiqueta: 'Grado:', valor: '1er Grado A' },
  ];

  const { ejecutadas, omitidas } = ejecutarOperacionesEnDocx(doc as any, mapa, plantilla, ops);
  console.log('Operaciones ejecutadas:', ejecutadas.length, 'de', ops.length);
  console.log('Operaciones omitidas:', omitidas);

  const docActualizadoXml = new XMLSerializer().serializeToString(doc);
  const mapaNuevo = construirMapa(doc as any);

  console.log('\n--- VERIFICACIONES DE CONTENIDO MODIFICADO ---');
  console.log('¿Diagnóstico actualizado?:', docActualizadoXml.includes('Nuevo diagnóstico para 1er grado'));
  console.log('¿Celda actualizada?:', docActualizadoXml.includes('Producción de textos creativos'));
  console.log('¿Título de semanas actualizado?:', docActualizadoXml.includes('4 SEMANAS'));
  console.log('¿Fila agregada al cronograma?:', docActualizadoXml.includes('Semana 2'));
  console.log('¿Encabezado modificado?:', docActualizadoXml.includes('1er Grado A'));

  console.log('\n--- TEST 3: Revisión automática de cobertura ---');
  const docOrig = new DOMParser().parseFromString(xml, 'application/xml');
  const revision = revisarDocumentoVivo(docOrig as any, doc as any, plantilla);
  console.log('Aprobado:', revision.aprobado);
  console.log('Resumen:', revision.resumen);
  console.log('Celdas reemplazadas:', revision.celdasReemplazadas, '| Celdas sin cambio:', revision.celdasSinCambio);
}

testCamilaFormato().catch(console.error);
