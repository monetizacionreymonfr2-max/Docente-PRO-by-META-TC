import {
  cargarDocx,
  guardarDocx,
  setTextoParrafo,
  setTextoCelda,
  setValorSegmentoMultiples,
  clonarFila,
  insertarFilaDespues,
  eliminarFila,
  validarDocxClonado,
  getTextoCompleto,
  buscarParrafoPorId,
  buscarTablaPorId,
  buscarFilaPorId,
  buscarCeldaPorId,
  construirMapa,
  calcularCoberturaTablas,
  CampoEncabezadoParrafo,
  getElementChildren,
  findFirstDescendant,
} from './docxEditor';
import { DocxMapa, PlantillaDocx, CoberturaTabla } from './types';
import {
  DatosDocenteProyecto,
  ContextoProyectoBloque,
  generarTextosLibres,
  generarTablaArea,
  generarCronograma,
  generarPlanEvaluacion,
} from './blockGenerator';
import { extraerDuracionSemanas } from '../camilaFormato/contextoProyectoPpa';

export interface ClonacionResultado {
  exito: boolean;
  blobDocx?: Blob;
  mensaje: string;
  fallbackRequerido: boolean;
  detallesValidacion?: string[];
  coberturaTablas?: CoberturaTabla[];
  tiempoSegundos?: number;
}

const W_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';

/**
 * Detecta áreas excluidas solicitadas por el docente en las instrucciones
 * Funciona para cualquier área mencionada (matemática, inglés, educación física, artes, ciencias, etc.)
 */
export function detectarAreasExcluidas(instrucciones?: string): string[] {
  if (!instrucciones) return [];
  const low = instrucciones.toLowerCase();
  const excluidas = new Set<string>();

  // Reglas léxicas para materias escolares
  if (/sin\s+(matem[aá]ticas?|mate\b)/i.test(low)) excluidas.add('Matemática');
  if (/sin\s+(ingl[eé]s|idioma\s+extranjero)/i.test(low)) excluidas.add('Inglés');
  if (/sin\s+(ciencias?\s+naturales?|naturaleza)/i.test(low)) excluidas.add('Ciencias Naturales');
  if (/sin\s+(ciencias?\s+sociales?|sociales|identidad)/i.test(low)) excluidas.add('Ciencias Sociales');
  if (/sin\s+(educaci[oó]n\s+f[ií]sica|ed(?:uc)?\.?\s*f[ií]sica|deporte)/i.test(low)) excluidas.add('Educación Física');
  if (/sin\s+(artes?|cultura|m[uú]sica|pl[aá]stica|est[eé]tica)/i.test(low)) excluidas.add('Arte y Patrimonio');
  if (/sin\s+(computaci[oó]n|inform[aá]tica|rob[oó]tica)/i.test(low)) excluidas.add('Computación');
  if (/sin\s+(religi[oó]n)/i.test(low)) excluidas.add('Religión');

  // Patrón genérico: "sin <palabra>", "excluir <palabra>", "no incluir <palabra>", "quitar <palabra>"
  const genericRegex = /(?:sin|excluir|omitir|no\s+incluir|quitar|eliminar)\s+([a-záéíóúñ]+(?:\s+[a-záéíóúñ]+)?)/gi;
  let match;
  while ((match = genericRegex.exec(low)) !== null) {
    let rawSubject = match[1].trim().replace(/\s+(y|e|o|u|ni|con|de)\s*$/i, '').trim();
    const stopWords = ['embargo', 'duda', 'copiar', 'errores', 'cambios', 'limites', 'límite', 'retraso', 'problema', 'problemas'];
    if (rawSubject.length > 2 && !stopWords.includes(rawSubject)) {
      excluidas.add(rawSubject);
    }
  }

  return Array.from(excluidas);
}

/**
 * Determina con alta tolerancia si un texto (título de tabla, celda o fila) corresponde a un área
 */
export function coincideConArea(texto: string, area: string): boolean {
  const t = texto.toLowerCase();
  const a = area.toLowerCase().trim();
  if (!a || !t) return false;

  if (t.includes(a)) return true;

  if (a.includes('matem') || a === 'mate') {
    return /\b(matem[aá]ticas?|c[aá]lculo|geometr[ií]a|aritm[eé]tica)\b/i.test(t);
  }
  if (a.includes('ingl') || a === 'english') {
    return /\b(ingl[eé]s|english|idioma\s+extranjero)\b/i.test(t);
  }
  if (a.includes('f[ií]sica') || a.includes('deport') || a.includes('recreaci')) {
    return /\b(educaci[oó]n\s+f[ií]sica|ed(?:uc)?\.?\s*f[ií]sica|deporte|recreaci[oó]n|actividad\s+f[ií]sica)\b/i.test(t);
  }
  if (a.includes('arte') || a.includes('cultur') || a.includes('patrimonio') || a.includes('m[uú]sic')) {
    return /\b(artes?|art[ií]stica|educaci[oó]n\s+est[eé]tica|pl[aá]stica|m[uú]sica|danza|teatro|patrimonio\s+cultural)\b/i.test(t);
  }
  if (a.includes('social') || a.includes('identidad') || a.includes('soberan')) {
    return /\b(ciencias\s+sociales|sociedad|identidad|soberan[ií]a|geograf[ií]a|historia)\b/i.test(t);
  }
  if (a.includes('natural') || a.includes('ambiente') || a.includes('salud') || a.includes('ciencia')) {
    return /\b(ciencias\s+naturales|naturaleza|ambiente|salud\s+integral)\b/i.test(t);
  }
  if (a.includes('comput') || a.includes('inform[aá]t') || a.includes('rob[oó]t')) {
    return /\b(computaci[oó]n|inform[aá]tica|rob[oó]tica|tecnolog[ií]a)\b/i.test(t);
  }

  const raiz = a.slice(0, Math.max(4, a.length - 2));
  return t.includes(raiz);
}

/**
 * Deriva términos prohibidos genéricamente del documento Word original:
 * - Grado y sección original (si el docente solicitó un grado distinto)
 * - Nombre del PA original (y sus frases/personajes distintivos)
 * - Docente original (si el docente ingresó un nombre distinto)
 * - Nombres propios o frases distintivas de celdas de contenido y diagnóstico
 * Regla: NUNCA prohibir ningún término escrito por el docente en el formulario.
 */
export function derivarTerminosProhibidosDelOriginal(
  mapaOrig: DocxMapa,
  plantilla: PlantillaDocx,
  datos: DatosDocenteProyecto
): string[] {
  const prohibidos = new Set<string>();

  const textoDocente = [
    datos.tema,
    datos.nombrePa,
    datos.gradoSeccion,
    datos.docente,
    datos.institucion,
    datos.peic,
    datos.lapsoEjecucion,
    datos.instruccionesExtra,
    datos.matricula,
    datos.turno,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  const esPermitidoPorDocente = (termino: string) => {
    const t = termino.trim().toLowerCase();
    if (!t || t.length < 3) return true;
    return textoDocente.includes(t);
  };

  // 1. Grado y sección del original
  let gradoOriginal = '';
  const encGrado = plantilla.encabezados.find(
    (e) => e.id === 'grado' || e.id === 'grado_seccion' || /grado|secci[oó]n|año/i.test(e.etiqueta)
  );
  if (encGrado?.valorOriginal) {
    gradoOriginal = encGrado.valorOriginal.trim();
  }
  if (!gradoOriginal) {
    for (const p of mapaOrig.parrafos.slice(0, 15)) {
      const m = p.rawText.match(/\b([1-6]°|[1-6]to|[1-6]ero|[1-6]er|primer|segundo|tercer|cuarto|quinto|sexto)\s*(?:grado|año)?(?:\s*["'][A-Za-z]["'])?\b/i);
      if (m) {
        gradoOriginal = m[0].trim();
        break;
      }
    }
  }

  if (gradoOriginal) {
    const origLow = gradoOriginal.toLowerCase();
    const solicitadoLow = (datos.gradoSeccion || '').toLowerCase();
    const sonGradosDistintos =
      (origLow.includes('1') && !solicitadoLow.includes('1') && !solicitadoLow.includes('primer')) ||
      (origLow.includes('2') && !solicitadoLow.includes('2') && !solicitadoLow.includes('segund')) ||
      (origLow.includes('3') && !solicitadoLow.includes('3') && !solicitadoLow.includes('tercer')) ||
      (origLow.includes('4') && !solicitadoLow.includes('4') && !solicitadoLow.includes('cuart')) ||
      (origLow.includes('5') && !solicitadoLow.includes('5') && !solicitadoLow.includes('quint')) ||
      (origLow.includes('6') && !solicitadoLow.includes('6') && !solicitadoLow.includes('sext'));

    if (sonGradosDistintos) {
      if (!esPermitidoPorDocente(gradoOriginal)) prohibidos.add(gradoOriginal);
      const numMatch = gradoOriginal.match(/([1-6])/);
      if (numMatch) {
        const n = numMatch[1];
        const variantes =
          n === '1' ? ['1er', '1ero', '1er grado', '1er Grado', 'primer grado', 'primer Grado'] :
          n === '2' ? ['2do', '2do grado', '2do Grado', 'segundo grado', 'segundo Grado'] :
          n === '3' ? ['3er', '3ero', '3er grado', '3er Grado', 'tercer grado', 'tercer Grado', '3er. Grado'] :
          n === '4' ? ['4to', '4to grado', '4to Grado', 'cuarto grado', 'cuarto Grado'] :
          n === '5' ? ['5to', '5to grado', '5to Grado', 'quinto grado', 'quinto Grado'] :
          ['6to', '6to grado', '6to Grado', 'sexto grado', 'sexto Grado'];
        variantes.forEach((v) => {
          if (!esPermitidoPorDocente(v)) prohibidos.add(v);
        });
      }
    }
  }

  // 2. Nombre del PA original
  let nombrePaOriginal = '';
  const encPa = plantilla.encabezados.find(
    (e) => e.id === 'nombre_pa' || /proyecto|p\.?a\.?|t[ií]tulo/i.test(e.etiqueta)
  );
  if (encPa?.valorOriginal) {
    nombrePaOriginal = encPa.valorOriginal.trim();
  }
  if (!nombrePaOriginal) {
    for (const p of mapaOrig.parrafos.slice(0, 15)) {
      const match = p.rawText.match(/(?:P\.?A\.?|PROYECTO(?:\s+DE\s+APRENDIZAJE)?):?\s*["'«]?([^"'\n\r«»]+)["'»]?/i);
      if (match && match[1].trim().length > 5) {
        nombrePaOriginal = match[1].trim();
        break;
      }
    }
  }

  if (nombrePaOriginal && nombrePaOriginal.toLowerCase() !== (datos.tema || '').toLowerCase()) {
    if (!esPermitidoPorDocente(nombrePaOriginal)) {
      prohibidos.add(nombrePaOriginal);
    }
    const palabrasTitulo = nombrePaOriginal
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2);

    for (let i = 0; i <= palabrasTitulo.length - 2; i++) {
      const sub = palabrasTitulo.slice(i, i + 2).join(' ');
      if (!esPermitidoPorDocente(sub) && sub.length > 7) {
        prohibidos.add(sub);
      }
    }

    const matchesNombres: string[] = (nombrePaOriginal.match(/\b[A-ZÁÉÍÓÚÑ][a-záéíóúñA-ZÁÉÍÓÚÑ]{3,}\b/g) || []) as string[];
    const stopWordsComunes = new Set([
      'PROYECTO', 'APRENDIZAJE', 'CONOCIENDO', 'CUIDANDO', 'SEMBRANDO',
      'FORTALECIENDO', 'DESARROLLANDO', 'CONSTRUYENDO', 'ESCUELA', 'UNIDAD',
      'EDUCATIVA', 'NACIONAL', 'BOLIVARIANA', 'EDUCACION', 'PRIMARIA'
    ]);
    matchesNombres.forEach((w) => {
      if (!stopWordsComunes.has(w.toUpperCase()) && !esPermitidoPorDocente(w) && w.length >= 4) {
        prohibidos.add(w);
      }
    });
  }

  // 3. Docente original
  const encDocente = plantilla.encabezados.find(
    (e) => e.id === 'docente' || /docente|profesor|maestr[oa]/i.test(e.etiqueta)
  );
  if (encDocente?.valorOriginal) {
    const docOrig = encDocente.valorOriginal.trim();
    if (docOrig.length > 3 && docOrig.toLowerCase() !== (datos.docente || '').toLowerCase()) {
      if (!esPermitidoPorDocente(docOrig)) prohibidos.add(docOrig);
      docOrig.split(/\s+/).forEach((part) => {
        if (part.length >= 5 && !esPermitidoPorDocente(part) && !/^(prof|lic|msc|dr|dra)/i.test(part)) {
          prohibidos.add(part);
        }
      });
    }
  }

  // 4. Nombres propios del diagnóstico original
  const idxDiag = mapaOrig.parrafos.findIndex((p) => /DIAGN[OÓ]STICO/i.test(p.rawText));
  const idxFin = mapaOrig.parrafos.findIndex((p) => /FINALIDAD/i.test(p.rawText));
  if (idxDiag !== -1 && idxFin !== -1 && idxDiag < idxFin) {
    for (let i = idxDiag + 1; i < idxFin; i++) {
      const p = mapaOrig.parrafos[i];
      if (!p || p.rawText.trim().length < 20) continue;
      const nombresPropios: string[] = (p.rawText.match(/\b[A-ZÁÉÍÓÚÑ][a-záéíóúñ]{3,}(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]{3,})+\b/g) || []) as string[];
      nombresPropios.forEach((np) => {
        const npLow = np.toLowerCase();
        if (
          !npLow.includes('república') &&
          !npLow.includes('ministerio') &&
          !npLow.includes('educación') &&
          !npLow.includes('bolivariana') &&
          !esPermitidoPorDocente(np)
        ) {
          prohibidos.add(np);
        }
      });
    }
  }

  return Array.from(prohibidos).filter((t) => t.trim().length >= 3 && !esPermitidoPorDocente(t));
}

/**
 * Pipeline principal de clonación de Word con cobertura al 100%
 */
export async function ejecutarClonacionDocx(
  fileData: File | Blob | ArrayBuffer,
  plantilla: PlantillaDocx,
  datos: DatosDocenteProyecto,
  onProgress?: (paso: string) => void
): Promise<ClonacionResultado> {
  const tStart = Date.now();

  const areasExcluidas = detectarAreasExcluidas(datos.instruccionesExtra);
  const areasBase = [
    'Lengua, Comunicación y Cultura',
    'Matemática, Ciencias Naturales y Sociedad',
    'Ciencias Sociales, Ciudadanía e Identidad',
    'Educación Física, Deporte y Recreación',
  ];
  const areasActivas = areasBase.filter(
    (a) => !areasExcluidas.some((ex) => coincideConArea(a, ex))
  );

  const numSemanas = extraerDuracionSemanas(datos.duracion);
  if (numSemanas === null) throw new Error('Indique la duración del proyecto en semanas (entre 1 y 12).');

  for (let intento = 1; intento <= 2; intento++) {
    try {
      onProgress?.('Cargando archivo original y parseando estructura XML...');
      const { zip: origZip, doc: docOrig } = await cargarDocx(fileData);
      const mapaOrig = construirMapa(docOrig);

      // Usar copia de trabajo
      const { zip, doc } = await cargarDocx(fileData);
      const body = doc.getElementsByTagNameNS(W_NS, 'body')[0] || doc.querySelector('body');
      if (!body) throw new Error('No se encontró el elemento w:body en el archivo Word.');

      // 1. ENCABEZADO POR RANGOS DE CARACTERES
      onProgress?.('Actualizando datos de identificación y membrete...');
      const mapaEncabezados = datos.encabezadosPersonalizados || {};
      const camposPorParrafo = new Map<string, CampoEncabezadoParrafo[]>();

      plantilla.encabezados.forEach((enc) => {
        const valNuevo =
          mapaEncabezados[enc.id] ||
          (enc.id === 'docente' ? datos.docente : undefined) ||
          (enc.id === 'grado_seccion' ? datos.gradoSeccion : undefined) ||
          (enc.id === 'nombre_pa' ? datos.nombrePa || datos.tema : undefined) ||
          (enc.id === 'nombre_peic' ? datos.peic : undefined) ||
          (enc.id === 'lapso' ? datos.lapsoEjecucion : undefined) ||
          (enc.id === 'matricula' ? datos.matricula : undefined) ||
          (enc.id === 'turno' ? datos.turno : undefined) ||
          enc.valorOriginal;

        if (valNuevo) {
          const list = camposPorParrafo.get(enc.parrafoId) || [];
          list.push({ etiqueta: enc.etiqueta, valor: valNuevo });
          camposPorParrafo.set(enc.parrafoId, list);
        }
      });

      camposPorParrafo.forEach((campos, pId) => {
        const targetP = buscarParrafoPorId(doc, pId);
        if (targetP) {
          setValorSegmentoMultiples(targetP, campos);
        }
      });

      // 2. DIAGNÓSTICO Y FINALIDAD POR POSICIÓN
      onProgress?.('Redactando diagnóstico pedagógico y finalidad institucional...');
      const ctxInicial: ContextoProyectoBloque = {
        tema: datos.nombrePa || datos.tema,
        gradoSeccion: datos.gradoSeccion,
        docente: datos.docente,
        institucion: datos.institucion,
        duracion: datos.duracion,
        instruccionesExtra: datos.instruccionesExtra,
        areasActivas,
        areasExcluidas,
      };

      const textosLibresGen = await generarTextosLibres(plantilla, datos, ctxInicial);

      let lineasDiag: string[] = [];
      let lineasFin: string[] = [];

      Object.entries(textosLibresGen).forEach(([k, lines]) => {
        const kLow = k.toLowerCase();
        if (kLow.includes('diag') || kLow.includes('p8') || kLow.includes('p7')) {
          if (lines.length > 0) lineasDiag = lines;
        } else if (kLow.includes('fin') || kLow.includes('p9') || kLow.includes('p10')) {
          if (lines.length > 0) lineasFin = lines;
        }
      });

      if (lineasDiag.length === 0) {
        lineasDiag = [
          `El grupo de ${datos.gradoSeccion} presenta curiosidad activa y disposición positiva hacia el aprendizaje cooperativo. A través de la observación pedagógica inicial, se evidencia la necesidad de fortalecer los procesos de comprensión lectora, producción de textos escritos creativos y la consolidación de valores de respeto, empatía y convivencia escolar.`,
          `Asimismo, las y los estudiantes manifiestan gran entusiasmo por participar en dinámicas grupales y actividades contextualizadas en el aula, mostrando interés en proyectos socio-pedagógicos que fomenten la ayuda mutua, la escucha activa y la resolución dialogada de situaciones cotidianas.`,
        ];
      }

      if (lineasFin.length === 0) {
        lineasFin = [
          `Desarrollar en las y los estudiantes de ${datos.gradoSeccion} habilidades integrales de comunicación oral y escrita, promoviendo el pensamiento crítico, la solidaridad y el trabajo en equipo, orientados a la formación ciudadana participativa según las intencionalidades pedagógicas del MPPE 2026-2027.`,
        ];
      }

      // Reemplazo posicional estricto en el cuerpo
      const bodyChildren = getElementChildren(body);
      let idxDiagTitle = -1;
      let idxFinTitle = -1;

      bodyChildren.forEach((child, idx) => {
        const name = child.localName || child.nodeName.replace(/^.*:/, '');
        if (name === 'p') {
          const txt = getTextoCompleto(child).trim().toUpperCase();
          if (idxDiagTitle === -1 && (txt === 'DIAGNÓSTICO' || txt.includes('DIAGNÓSTICO') || txt.includes('DIAGNOSTICO'))) {
            idxDiagTitle = idx;
          } else if (idxFinTitle === -1 && (txt === 'FINALIDAD' || txt.includes('FINALIDAD'))) {
            idxFinTitle = idx;
          }
        }
      });

      let idxFinEnd = bodyChildren.length;
      if (idxFinTitle !== -1) {
        for (let i = idxFinTitle + 1; i < bodyChildren.length; i++) {
          const name = bodyChildren[i].localName || bodyChildren[i].nodeName.replace(/^.*:/, '');
          if (name === 'tbl') {
            idxFinEnd = i;
            break;
          }
        }
      }

      // DIAGNÓSTICO: reemplazar párrafos y eliminar viejos sobrantes
      if (idxDiagTitle !== -1 && idxFinTitle !== -1 && idxDiagTitle < idxFinTitle) {
        const diagPs: Element[] = [];
        for (let i = idxDiagTitle + 1; i < idxFinTitle; i++) {
          const child = bodyChildren[i];
          const name = child.localName || child.nodeName.replace(/^.*:/, '');
          if (name === 'p') {
            const txt = getTextoCompleto(child).trim();
            if (txt.length > 0) diagPs.push(child);
          }
        }

        for (let k = 0; k < lineasDiag.length; k++) {
          if (k < diagPs.length) {
            setTextoParrafo(diagPs[k], lineasDiag[k]);
          } else if (diagPs.length > 0) {
            const nuevoP = diagPs[0].cloneNode(true) as Element;
            setTextoParrafo(nuevoP, lineasDiag[k]);
            diagPs[diagPs.length - 1].parentNode?.insertBefore(nuevoP, diagPs[diagPs.length - 1].nextSibling);
          }
        }
        for (let k = lineasDiag.length; k < diagPs.length; k++) {
          diagPs[k].parentNode?.removeChild(diagPs[k]);
        }
      }

      // FINALIDAD: reemplazar párrafos y eliminar viejos sobrantes
      if (idxFinTitle !== -1 && idxFinTitle < idxFinEnd) {
        const finPs: Element[] = [];
        for (let i = idxFinTitle + 1; i < idxFinEnd; i++) {
          const child = bodyChildren[i];
          const name = child.localName || child.nodeName.replace(/^.*:/, '');
          if (name === 'p') {
            const txt = getTextoCompleto(child).trim();
            if (txt.length > 0) finPs.push(child);
          }
        }

        for (let k = 0; k < lineasFin.length; k++) {
          if (k < finPs.length) {
            setTextoParrafo(finPs[k], lineasFin[k]);
          } else if (finPs.length > 0) {
            const nuevoP = finPs[0].cloneNode(true) as Element;
            setTextoParrafo(nuevoP, lineasFin[k]);
            finPs[finPs.length - 1].parentNode?.insertBefore(nuevoP, finPs[finPs.length - 1].nextSibling);
          }
        }
        for (let k = lineasFin.length; k < finPs.length; k++) {
          finPs[k].parentNode?.removeChild(finPs[k]);
        }
      }

      // Contexto completo para todos los siguientes bloques
      const ctxCompleto: ContextoProyectoBloque = {
        tema: datos.nombrePa || datos.tema,
        gradoSeccion: datos.gradoSeccion,
        docente: datos.docente,
        institucion: datos.institucion,
        duracion: datos.duracion,
        diagnosticoGenerado: lineasDiag.join('\n\n'),
        finalidadGenerada: lineasFin.join('\n\n'),
        instruccionesExtra: datos.instruccionesExtra,
        areasActivas,
        areasExcluidas,
      };

      // Mapear constantes (Ejes Integradores, Intencionalidades) que se repiten en 3+ tablas
      const frecuenciasTextos = new Map<string, number>();
      mapaOrig.tablas.forEach((t) => {
        t.filas.forEach((f) => {
          f.celdas.forEach((c) => {
            const txt = c.rawText.trim();
            if (txt.length > 15) {
              frecuenciasTextos.set(txt, (frecuenciasTextos.get(txt) || 0) + 1);
            }
          });
        });
      });

      const esConstante = (txt: string) => {
        const t = txt.trim().toLowerCase();
        if (
          t.includes('ejes integradores') ||
          t.includes('intencionalidades curriculares') ||
          t.includes('pilares de la educaci') ||
          t.includes('perfil del egresado')
        ) {
          return true;
        }
        return (frecuenciasTextos.get(txt.trim()) || 0) >= 3;
      };

      const esEtiqueta = (txt: string) => {
        const t = txt.trim().toUpperCase();
        if (t.endsWith(':') && t.length < 35) return true;
        const conocidas = [
          'ÁREA DE FORMACIÓN',
          'AREA DE FORMACION',
          'COMPONENTE',
          'APRENDIZAJE A SER ALCANZADO',
          'CONTENIDOS',
          'REFERENTES TEÓRICOS',
          'ACTIVIDADES',
          'ESTRATEGIAS',
          'INDICADORES',
          'TÉCNICA',
          'INSTRUMENTO',
          'FECHA',
          'RECURSOS',
          'SEMANA',
          'DÍA',
          'MOMENTO',
          'PROPÓSITO',
        ];
        return conocidas.some((c) => t === c || t.startsWith(c + ':'));
      };

      // 3. PROCESAR TABLAS Y FILAS EXCLUIDAS (cualquier área solicitada: inglés, matemáticas, educación física, artes, etc.)
      const tablasEliminadasIds = new Set<string>();
      if (areasExcluidas.length > 0) {
        mapaOrig.tablas.forEach((t) => {
          const tblElem = buscarTablaPorId(doc, t.id);
          if (!tblElem) return;
          const fullTxt = t.filas
            .map((f) => f.celdas.map((c) => c.rawText).join(' '))
            .join(' ');
          const tblTitulo = plantilla.tablas.find((pt) => pt.id === t.id)?.titulo || '';
          const prevElem = tblElem.previousElementSibling;
          const prevTxt = prevElem && (prevElem.localName || prevElem.nodeName.replace(/^.*:/, '')) === 'p'
            ? getTextoCompleto(prevElem)
            : '';
          const fila0Txt = t.filas[0] ? t.filas[0].celdas.map((c) => c.rawText).join(' ') : '';

          for (const ex of areasExcluidas) {
            const esFichaExcluida =
              (coincideConArea(tblTitulo, ex) ||
               coincideConArea(prevTxt, ex) ||
               coincideConArea(fila0Txt, ex) ||
               (coincideConArea(fullTxt, ex) && (fullTxt.toLowerCase().includes('ficha') || t.filas.length <= 12))) &&
              !areasActivas.some((act) => coincideConArea(tblTitulo || fila0Txt, act));

            if (esFichaExcluida) {
              // Eliminar párrafo de título previo si existía
              if (prevElem && (coincideConArea(prevTxt, ex) || /ficha|área|area/i.test(prevTxt))) {
                prevElem.parentNode?.removeChild(prevElem);
              }
              tblElem.parentNode?.removeChild(tblElem);
              tablasEliminadasIds.add(t.id);
              break;
            }

            // Eliminar filas de la tabla general o plan que correspondan al área excluida
            const trNodes = getElementChildren(tblElem).filter(
              (c) => (c.localName || c.nodeName.replace(/^.*:/, '')) === 'tr'
            );
            trNodes.forEach((tr, rIdx) => {
              if (rIdx === 0) return; // Conservar cabecera de la tabla
              const trTxt = getTextoCompleto(tr);
              if (coincideConArea(trTxt, ex)) {
                eliminarFila(tr);
              }
            });
          }
        });
      }

      // 4. CRONOGRAMA SEMANAL
      const tablaCronograma = plantilla.tablas.find((t) => t.tipo === 'cronograma') ||
        plantilla.tablas.find((t) => {
          const tbl = buscarTablaPorId(doc, t.id);
          return tbl && getTextoCompleto(tbl).toLowerCase().includes('cronograma');
        });

      let conteoCronoEsperado = 0;
      if (tablaCronograma) {
        onProgress?.('Elaborando cronograma semanal secuencial...');
        const tblElem = buscarTablaPorId(doc, tablaCronograma.id);
        const ejemploTexto = tblElem ? getTextoCompleto(tblElem) : '';

        const cronoRes = await generarCronograma(tablaCronograma, datos, ejemploTexto, ctxCompleto);

        if (tblElem && cronoRes.filas.length > 0) {
          const allTr = getElementChildren(tblElem).filter(
            (c) => (c.localName || c.nodeName.replace(/^.*:/, '')) === 'tr'
          );

          const protoTr = (tablaCronograma.filaPrototipoId ? buscarFilaPorId(doc, tablaCronograma.filaPrototipoId) : null) ||
            (allTr.length > 1 ? allTr[allTr.length - 1] : allTr[0]);

          const protoClean = clonarFila(protoTr);

          const headerRows = allTr.filter((tr, idx) => {
            const rId = `${tablaCronograma.id}.r${idx}`;
            return (
              tablaCronograma.filasEncabezadoIds.includes(rId) ||
              findFirstDescendant(tr, 'tblHeader') !== null ||
              idx === 0
            );
          });

          const anchorRow = headerRows.length > 0 ? headerRows[headerRows.length - 1] : allTr[0];

          // Eliminar TODAS las filas de datos de ejemplo
          const dataRows = allTr.filter((tr) => !headerRows.includes(tr));
          dataRows.forEach((tr) => eliminarFila(tr));

          // Clonar prototipo N veces
          let lastInserted = anchorRow;
          for (let f = 0; f < cronoRes.filas.length; f++) {
            const filaGen = cronoRes.filas[f];
            const nuevaFila = clonarFila(protoClean);
            const celdasNuevas = getElementChildren(nuevaFila).filter(
              (c) => (c.localName || c.nodeName.replace(/^.*:/, '')) === 'tc'
            );
            filaGen.celdas.forEach((texto, cIdx) => {
              if (celdasNuevas[cIdx]) {
                setTextoCelda(celdasNuevas[cIdx], [texto]);
              }
            });
            insertarFilaDespues(lastInserted, nuevaFila);
            lastInserted = nuevaFila;
          }

          conteoCronoEsperado = headerRows.length + cronoRes.filas.length;
        }
      }

      // 5. TÍTULO DEL CRONOGRAMA: Actualizar (N SEMANAS)
      const allPs = Array.from(doc.getElementsByTagNameNS(W_NS, 'p'));
      allPs.forEach((p) => {
        const txt = getTextoCompleto(p);
        if (/SEMANAS?/i.test(txt) && (/CRONOGRAMA/i.test(txt) || /\d+\s*SEMANAS?/i.test(txt))) {
          const reemplazado = txt.replace(/\(?\b\d+\s*SEMANAS?\b\)?/gi, `(${numSemanas} SEMANAS)`);
          if (reemplazado !== txt) {
            setTextoParrafo(p, reemplazado);
          }
        }
      });

      // 6. PLAN DE EVALUACIÓN
      const tablaEvaluacion = plantilla.tablas.find((t) => t.tipo === 'plan_evaluacion') ||
        plantilla.tablas.find((t) => {
          const tbl = buscarTablaPorId(doc, t.id);
          return tbl && getTextoCompleto(tbl).toLowerCase().includes('evaluación');
        });

      let conteoEvalEsperado = 0;
      if (tablaEvaluacion) {
        onProgress?.('Generando indicadores e instrumentos de evaluación...');
        const tblElem = buscarTablaPorId(doc, tablaEvaluacion.id);
        const ejemploTexto = tblElem ? getTextoCompleto(tblElem) : '';

        const evalRes = await generarPlanEvaluacion(tablaEvaluacion, datos, ejemploTexto, ctxCompleto);

        if (tblElem && evalRes.filas.length > 0) {
          const allTr = getElementChildren(tblElem).filter(
            (c) => (c.localName || c.nodeName.replace(/^.*:/, '')) === 'tr'
          );

          const protoTr = (tablaEvaluacion.filaPrototipoId ? buscarFilaPorId(doc, tablaEvaluacion.filaPrototipoId) : null) ||
            (allTr.length > 1 ? allTr[allTr.length - 1] : allTr[0]);

          const protoClean = clonarFila(protoTr);

          const headerRows = allTr.filter((tr, idx) => {
            const rId = `${tablaEvaluacion.id}.r${idx}`;
            return (
              tablaEvaluacion.filasEncabezadoIds.includes(rId) ||
              findFirstDescendant(tr, 'tblHeader') !== null ||
              idx === 0
            );
          });

          const anchorRow = headerRows.length > 0 ? headerRows[headerRows.length - 1] : allTr[0];

          // Eliminar TODAS las filas de datos de ejemplo
          const dataRows = allTr.filter((tr) => !headerRows.includes(tr));
          dataRows.forEach((tr) => eliminarFila(tr));

          // Clonar prototipo N veces
          let lastInserted = anchorRow;
          for (let f = 0; f < evalRes.filas.length; f++) {
            const filaGen = evalRes.filas[f];
            const nuevaFila = clonarFila(protoClean);
            const celdasNuevas = getElementChildren(nuevaFila).filter(
              (c) => (c.localName || c.nodeName.replace(/^.*:/, '')) === 'tc'
            );
            filaGen.celdas.forEach((texto, cIdx) => {
              if (celdasNuevas[cIdx]) {
                setTextoCelda(celdasNuevas[cIdx], [texto]);
              }
            });
            insertarFilaDespues(lastInserted, nuevaFila);
            lastInserted = nuevaFila;
          }

          conteoEvalEsperado = headerRows.length + evalRes.filas.length;
        }
      }

      // 7. TODAS LAS DEMÁS TABLAS CUBIERTAS (Fichas por área, Construcción de Estrategias, Diaria, General)
      const tablasRestantes = mapaOrig.tablas.filter((t) => {
        if (tablasEliminadasIds.has(t.id)) return false;
        if (tablaCronograma && t.id === tablaCronograma.id) return false;
        if (tablaEvaluacion && t.id === tablaEvaluacion.id) return false;
        return true;
      });

      for (let i = 0; i < tablasRestantes.length; i++) {
        const tOrig = tablasRestantes[i];
        const tblElem = buscarTablaPorId(doc, tOrig.id);
        if (!tblElem) continue;

        const tblInfo = plantilla.tablas.find((t) => t.id === tOrig.id) || {
          id: tOrig.id,
          tipo: 'general' as const,
          titulo: `Tabla ${tOrig.id}`,
          columnas: [],
          celdasContenidoIds: [],
          celdasEtiquetaIds: [],
          filasEncabezadoIds: [],
        };

        const areaName = tblInfo.titulo || `Área Curricular ${i + 1}`;
        onProgress?.(`Generando contenido curricular para ${areaName}...`);

        // Recolectar TODAS las celdas de contenido de la tabla que no sean etiquetas ni constantes
        const celdasContenidoDetectadas: string[] = [];
        tOrig.filas.forEach((f, rIdx) => {
          if (f.isHeader || rIdx === 0) return;
          f.celdas.forEach((c) => {
            const txt = c.rawText.trim();
            if (txt.length === 0) return;
            if (!esConstante(txt) && !esEtiqueta(txt)) {
              celdasContenidoDetectadas.push(c.id);
            }
          });
        });

        const celdasAProcesar = Array.from(
          new Set([...(tblInfo.celdasContenidoIds || []), ...celdasContenidoDetectadas])
        );

        const ejemploTexto = getTextoCompleto(tblElem);
        let areaRes = await generarTablaArea(
          { ...tblInfo, celdasContenidoIds: celdasAProcesar },
          areaName,
          datos,
          ejemploTexto,
          ctxCompleto
        );

        // Si la tabla tiene prototipo de fila (ej: Estrategias o Diaria), ajustar filas
        if (
          (tblInfo.tipo === 'planificacion_diaria' ||
            tblInfo.tipo === 'construccion_estrategias' ||
            tOrig.filas.length > 5) &&
          areaRes.filasNuevas &&
          areaRes.filasNuevas.length > 0
        ) {
          const allTr = getElementChildren(tblElem).filter(
            (c) => (c.localName || c.nodeName.replace(/^.*:/, '')) === 'tr'
          );
          const protoTr = allTr[allTr.length - 1];
          if (protoTr) {
            const protoClean = clonarFila(protoTr);
            const headerRows = allTr.filter((tr, idx) => idx === 0 || findFirstDescendant(tr, 'tblHeader') !== null);
            const anchor = headerRows.length > 0 ? headerRows[headerRows.length - 1] : allTr[0];

            const dataRows = allTr.filter((tr) => !headerRows.includes(tr));
            dataRows.forEach((r) => eliminarFila(r));

            let lastIns = anchor;
            areaRes.filasNuevas.forEach((filaGen) => {
              const nuevaTr = clonarFila(protoClean);
              const celdasNuevas = getElementChildren(nuevaTr).filter(
                (c) => (c.localName || c.nodeName.replace(/^.*:/, '')) === 'tc'
              );
              filaGen.celdas.forEach((txt, cIdx) => {
                if (celdasNuevas[cIdx]) setTextoCelda(celdasNuevas[cIdx], [txt]);
              });
              insertarFilaDespues(lastIns, nuevaTr);
              lastIns = nuevaTr;
            });
          }
        }

        // Aplicar textos a celdas
        Object.entries(areaRes.celdasActualizadas).forEach(([cId, lineas]) => {
          const tc = buscarCeldaPorId(doc, cId);
          if (tc) setTextoCelda(tc, lineas);
        });

        // REINTENTO DE CELDAS FALTANTES: Toda celda de contenido debe recibir texto
        const celdasFaltantes = celdasAProcesar.filter((cId) => {
          const res = areaRes.celdasActualizadas[cId];
          return !res || res.length === 0 || !res.some((t) => t.trim().length > 0);
        });

        if (celdasFaltantes.length > 0) {
          try {
            const reintento = await generarTablaArea(
              { ...tblInfo, celdasContenidoIds: celdasFaltantes },
              areaName,
              datos,
              ejemploTexto,
              ctxCompleto
            );
            Object.entries(reintento.celdasActualizadas).forEach(([cId, lineas]) => {
              if (lineas && lineas.some((t) => t.trim().length > 0)) {
                areaRes.celdasActualizadas[cId] = lineas;
                const tc = buscarCeldaPorId(doc, cId);
                if (tc) setTextoCelda(tc, lineas);
              }
            });
          } catch (retryErr) {
            console.warn('[DocxClone] Reintento de celdas:', retryErr);
          }

          // Si tras reintento aún sigue vacía: vaciarla con setTextoCelda(tc, ['']) para no dejar texto residual
          celdasAProcesar.forEach((cId) => {
            const res = areaRes.celdasActualizadas[cId];
            if (!res || res.length === 0 || !res.some((t) => t.trim().length > 0)) {
              const tc = buscarCeldaPorId(doc, cId);
              if (tc) setTextoCelda(tc, ['']);
            }
          });
        }
      }

      // 8. SERIALIZAR Y VALIDAR
      onProgress?.('Empaquetando archivo Word final y validando integridad...');
      const finalBlob = await guardarDocx(zip, doc);

      const conteoEsperadoFilas: Record<string, number> = {};
      if (tablaCronograma && conteoCronoEsperado > 0) {
        conteoEsperadoFilas[tablaCronograma.id] = conteoCronoEsperado;
      }
      if (tablaEvaluacion && conteoEvalEsperado > 0) {
        conteoEsperadoFilas[tablaEvaluacion.id] = conteoEvalEsperado;
      }

      // Celdas de contenido originales para validar que NINGUNA quede idéntica
      const celdasContenidoOriginales: Record<string, string> = {};
      mapaOrig.tablas.forEach((t) => {
        if (tablasEliminadasIds.has(t.id)) return;
        t.filas.forEach((f, rIdx) => {
          if (f.isHeader || rIdx === 0) return;
          f.celdas.forEach((c) => {
            const txt = c.rawText.trim();
            if (txt.length > 8 && !esConstante(txt) && !esEtiqueta(txt)) {
              celdasContenidoOriginales[c.id] = txt;
            }
          });
        });
      });

      const constantesPermitidas = new Set<string>();
      frecuenciasTextos.forEach((count, txt) => {
        if (count >= 3 || esConstante(txt)) constantesPermitidas.add(txt);
      });

      const terminosProhibidos = derivarTerminosProhibidosDelOriginal(mapaOrig, plantilla, datos);

      const validacion = await validarDocxClonado(origZip, finalBlob, {
        plantilla,
        conteoEsperadoFilas,
        celdasContenidoOriginales,
        constantesPermitidas,
        terminosProhibidos,
      });

      const coberturaTablas = calcularCoberturaTablas(docOrig, doc, plantilla);

      if (!validacion.valido) {
        console.warn(`[DocxClone] Intento ${intento} falló validación:`, validacion.errores);
        if (intento === 1) {
          onProgress?.('Ajustando formato y reintentando...');
          continue;
        }
        return {
          exito: false,
          fallbackRequerido: true,
          mensaje: 'No pude copiar tu Word exacto, aquí está en el formato estándar.',
          detallesValidacion: validacion.errores,
          coberturaTablas,
        };
      }

      const tiempoSegundos = Math.round((Date.now() - tStart) / 1000);
      return {
        exito: true,
        blobDocx: finalBlob,
        mensaje: `Copia exacta de Word generada en ${tiempoSegundos} segundos. Mismos logos, orientación y márgenes.`,
        fallbackRequerido: false,
        coberturaTablas,
        tiempoSegundos,
      };
    } catch (err: any) {
      console.error(`[DocxClone] Error durante clonación (intento ${intento}):`, err);
      if (intento === 2) {
        return {
          exito: false,
          fallbackRequerido: true,
          mensaje: 'No pude copiar tu Word exacto, aquí está en el formato estándar.',
          detallesValidacion: [err?.message || String(err)],
        };
      }
    }
  }

  return {
    exito: false,
    fallbackRequerido: true,
    mensaje: 'No pude copiar tu Word exacto, aquí está en el formato estándar.',
  };
}
