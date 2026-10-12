import { GradoPrimaria, AreaCurricular, ContenidoItem, AreaData } from './curriculoMPPE/types';
import { LENGUAJE_DATA } from './curriculoMPPE/lenguaje';
import { MATEMATICAS_DATA } from './curriculoMPPE/matematicas';
import { CIENCIAS_NATURALES_DATA } from './curriculoMPPE/cienciasNaturales';
import { IDENTIDAD_DATA } from './curriculoMPPE/identidad';
import { PERFIL_EGRESADO_MPPE } from './curriculoMPPE/egresado';

export * from './curriculoMPPE/types';
export { PERFIL_EGRESADO_MPPE };

export const CURRICULO_MPPE_2026_2027: Record<AreaCurricular, AreaData> = {
  'Prácticas del Lenguaje': {
    nombre: 'Prácticas del Lenguaje',
    grados: LENGUAJE_DATA,
    perfilEgresado: PERFIL_EGRESADO_MPPE['Prácticas del Lenguaje']
  },
  'Matemáticas': {
    nombre: 'Matemáticas',
    grados: MATEMATICAS_DATA,
    perfilEgresado: PERFIL_EGRESADO_MPPE['Matemáticas']
  },
  'Ciencias Naturales': {
    nombre: 'Ciencias Naturales',
    grados: CIENCIAS_NATURALES_DATA,
    perfilEgresado: PERFIL_EGRESADO_MPPE['Ciencias Naturales']
  },
  'Identidad': {
    nombre: 'Identidad',
    grados: IDENTIDAD_DATA,
    perfilEgresado: PERFIL_EGRESADO_MPPE['Identidad']
  }
};

// Alias de retrocompatibilidad
export const CURRICULO_MPPE_2025_2026 = CURRICULO_MPPE_2026_2027;

export const AREAS_CURRICULARES: AreaCurricular[] = [
  'Prácticas del Lenguaje',
  'Matemáticas',
  'Ciencias Naturales',
  'Identidad'
];

export function getComponentesPorAreaYGrado(area: AreaCurricular, grado: GradoPrimaria): string[] {
  const areaData = CURRICULO_MPPE_2026_2027[area];
  if (!areaData || !areaData.grados[grado]) return [];
  return Object.keys(areaData.grados[grado]);
}

export function getContenidosPorComponente(
  area: AreaCurricular, 
  grado: GradoPrimaria, 
  componente: string
): ContenidoItem[] {
  const areaData = CURRICULO_MPPE_2026_2027[area];
  if (!areaData || !areaData.grados[grado] || !areaData.grados[grado][componente]) return [];
  return areaData.grados[grado][componente];
}

// Búsqueda inteligente para remapear proyectos existentes al currículo MPPE 2026-2027
export function buscarContenidoMasCercano(
  grado: GradoPrimaria,
  textoBusqueda: string,
  areaSugerida?: AreaCurricular
): {
  area: AreaCurricular;
  componente: string;
  contenido: ContenidoItem;
  similitud: number;
} | null {
  const normalizedSearch = textoBusqueda.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const searchWords = normalizedSearch.split(/\W+/).filter(w => w.length > 3);

  let mejorCoincidencia: {
    area: AreaCurricular;
    componente: string;
    contenido: ContenidoItem;
    similitud: number;
  } | null = null;

  const areasABuscar = areaSugerida ? [areaSugerida] : AREAS_CURRICULARES;

  for (const area of areasABuscar) {
    const areaData = CURRICULO_MPPE_2026_2027[area];
    if (!areaData || !areaData.grados[grado]) continue;

    for (const [componente, listaContenidos] of Object.entries(areaData.grados[grado])) {
      for (const item of listaContenidos) {
        const itemText = (item.contenido + ' ' + item.aprendizajesEsperados.map(a => a.texto).join(' '))
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '');

        let score = 0;
        for (const word of searchWords) {
          if (itemText.includes(word)) score += 1;
        }

        if (!mejorCoincidencia || score > mejorCoincidencia.similitud) {
          mejorCoincidencia = {
            area,
            componente,
            contenido: item,
            similitud: score
          };
        }
      }
    }
  }

  return mejorCoincidencia;
}
