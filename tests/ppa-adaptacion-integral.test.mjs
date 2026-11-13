import test from 'node:test';
import assert from 'node:assert/strict';
import JSZip from 'jszip';
import { instalarDom } from './helpers/dom.mjs';
import { crearPpaTercerGradoSieteTablas, crearPpaParrafosTercerGrado, textoPlanoDocx } from './helpers/fixturesAdaptacion.mjs';
import { crearProveedorFicticio } from './helpers/proveedorFicticio.mjs';
import { adaptarProyectoAulaIntegral, AdaptacionNoSeguraError } from '../src/lib/camilaFormato/adaptacionIntegral/adaptadorGenerico.ts';

const fuentes = [['siete tablas', crearPpaTercerGradoSieteTablas], ['párrafos', crearPpaParrafosTercerGrado]];
for (const [tipo, crear] of fuentes) {
  test(`adaptación integral — ${tipo}: audita Word y conserva logos`, async () => {
    const restaurar = instalarDom();
    try {
      const original = await crear();
      const resultado = await adaptarProyectoAulaIntegral(original, {
        gradoDestino: 5, docenteDestino: 'Reymon Castillo', proveedor: crearProveedorFicticio(),
      });
      assert.equal(resultado.informe.auditoria.aprobado, true);
      assert.ok(resultado.informe.bloquesModificados > 0);
      assert.ok(resultado.informe.datosPendientes.length > 0, 'No inventar diagnóstico ni matrícula');
      const zOriginal = await JSZip.loadAsync(original);
      const zFinal = await JSZip.loadAsync(await resultado.blob.arrayBuffer());
      for (const nombre of Object.keys(zOriginal.files).filter(n => n.startsWith('word/media/') && !zOriginal.files[n].dir)) {
        assert.deepEqual(await zOriginal.file(nombre).async('uint8array'), await zFinal.file(nombre).async('uint8array'));
      }
      const texto = Object.values(await textoPlanoDocx(await resultado.blob.arrayBuffer())).join(' ');
      assert.match(texto, /Reymon Castillo/);
      assert.match(texto, /quinto grado|5to grado/i);
      assert.doesNotMatch(texto, /\b3er grado\b|\btercer grado\b/iu);
    } finally { restaurar(); }
  });
}

for (const modo of ['omite_siempre', 'grado_viejo', 'fecha_inventada', 'xml', 'id_extra']) {
  test(`rechaza propuesta simulada insegura: ${modo}`, async () => {
    const restaurar = instalarDom();
    try {
      const original = await crearPpaTercerGradoSieteTablas();
      const originalBytes = Uint8Array.from(original);
      await assert.rejects(
        adaptarProyectoAulaIntegral(original, {
          gradoDestino: 5, docenteDestino: 'Reymon Castillo', proveedor: crearProveedorFicticio({ modo }),
        }), (e) => e instanceof AdaptacionNoSeguraError,
      );
      assert.deepEqual(Uint8Array.from(original), originalBytes, 'El original no se debe mutar');
    } finally { restaurar(); }
  });
}
