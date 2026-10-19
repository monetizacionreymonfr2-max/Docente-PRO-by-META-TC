import mammoth from 'mammoth';
import { supabase } from './supabase';
import { generateContentWithRetry } from './gemini';
import {
  FormatoDocente,
  FormatoEstructura,
  SeccionGenerada,
  TipoDocumentoFormato,
} from '../types/formato';
import {
  GEMINI_FORMATO_MODEL,
  FORMATO_ANALISIS_SYSTEM_INSTRUCTION,
  FORMATO_ANALISIS_RESPONSE_SCHEMA,
  FORMATO_GENERACION_SYSTEM_INSTRUCTION,
  FORMATO_GENERACION_RESPONSE_SCHEMA,
} from './formatoPrompts';
import { FEATURE_FLAGS } from '../config/features';
import { cargarDocx, construirMapa } from './docxClone/docxEditor';
import { analizarPlantillaDocx } from './docxClone/plantillaAnalyzer';
import { PlantillaDocx } from './docxClone/types';
import { guardarArchivoEnCache, obtenerArchivoDeCache } from './docxClone/storageCache';

const STORAGE_PREFIX = 'docenty_formatos_';
const MEMORY_BACKUP_PREFIX = 'docenty_formatos_backup_';

/**
 * Extrae texto y estructura HTML de un archivo Word .docx en el navegador con mammoth
 */
export async function extraerEstructuraWord(file: File): Promise<{ texto: string; html: string }> {
  const arrayBuffer = await file.arrayBuffer();
  const rawTextResult = await mammoth.extractRawText({ arrayBuffer });
  const htmlResult = await mammoth.convertToHtml({ arrayBuffer });
  return {
    texto: rawTextResult.value || '',
    html: htmlResult.value || '',
  };
}

/**
 * Convierte un File a string base64 puro (sin el prefijo data:...;base64,)
 */
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.includes(',') ? result.split(',')[1] : result;
      resolve(base64);
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

function isValidUUID(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

export const FormatoService = {
  /**
   * Obtiene todos los formatos guardados del docente desde Supabase.
   */
  async getFormatosByTeacher(teacherId: string): Promise<FormatoDocente[]> {
    if (!teacherId) return [];

    // Migración suave desde localStorage
    try {
      const localKey = `${STORAGE_PREFIX}${teacherId}`;
      const savedLocal = localStorage.getItem(localKey);
      if (savedLocal) {
        const localItems: FormatoDocente[] = JSON.parse(savedLocal);
        if (Array.isArray(localItems) && localItems.length > 0) {
          for (const item of localItems) {
            await this.saveFormato(teacherId, item).catch((e) =>
              console.warn('Error al migrar formato local a Supabase:', e)
            );
          }
        }
        localStorage.removeItem(localKey);
      }
    } catch (migErr) {
      console.warn('Error durante la verificación de migración de localStorage:', migErr);
    }

    try {
      const { data, error } = await supabase
        .from('formatos_docente')
        .select('*')
        .eq('teacher_id', teacherId)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Aviso de Supabase al consultar formatos_docente:', error.message);
        const backup = localStorage.getItem(`${MEMORY_BACKUP_PREFIX}${teacherId}`);
        return backup ? JSON.parse(backup) : [];
      }

      const mappedFormatos: FormatoDocente[] = (data || []).map((row: any) => ({
        id: row.id,
        teacherId: row.teacher_id,
        nombre: row.nombre,
        tipoDocumento: row.tipo_documento,
        archivoOriginalNombre: row.archivo_original_nombre || '',
        archivoMimeType: row.archivo_mime_type || '',
        tamanoBytes: Number(row.tamano_bytes) || 0,
        estructura: row.estructura,
        archivoPath: row.archivo_path,
        plantilla: row.plantilla,
        modo: row.modo || 'reconstruir',
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));

      try {
        localStorage.setItem(`${MEMORY_BACKUP_PREFIX}${teacherId}`, JSON.stringify(mappedFormatos));
      } catch {}

      return mappedFormatos;
    } catch (err: any) {
      console.error('Error al obtener formatos de Supabase:', err);
      const backup = localStorage.getItem(`${MEMORY_BACKUP_PREFIX}${teacherId}`);
      return backup ? JSON.parse(backup) : [];
    }
  },

  /**
   * Guarda o actualiza un formato en Supabase, incluyendo plantilla y modo de clonación
   */
  async saveFormato(teacherId: string, formato: FormatoDocente): Promise<FormatoDocente> {
    if (!teacherId) throw new Error('ID de docente no válido.');

    const now = new Date().toISOString();
    const payload: any = {
      teacher_id: teacherId,
      nombre: formato.nombre.trim(),
      tipo_documento: formato.tipoDocumento,
      archivo_original_nombre: formato.archivoOriginalNombre || '',
      archivo_mime_type: formato.archivoMimeType || '',
      tamano_bytes: formato.tamanoBytes || 0,
      estructura: formato.estructura,
      modo: formato.modo || 'reconstruir',
      updated_at: now,
    };

    if (formato.archivoPath) payload.archivo_path = formato.archivoPath;
    if (formato.plantilla) payload.plantilla = formato.plantilla;

    if (formato.id && isValidUUID(formato.id)) {
      payload.id = formato.id;
    }

    try {
      const { data, error } = await supabase
        .from('formatos_docente')
        .upsert(payload)
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        teacherId: data.teacher_id,
        nombre: data.nombre,
        tipoDocumento: data.tipo_documento,
        archivoOriginalNombre: data.archivo_original_nombre,
        archivoMimeType: data.archivo_mime_type,
        tamanoBytes: Number(data.tamano_bytes) || 0,
        estructura: data.estructura,
        archivoPath: data.archivo_path,
        plantilla: data.plantilla,
        modo: data.modo || 'reconstruir',
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    } catch (dbErr: any) {
      console.error('Error al guardar formato en Supabase:', dbErr);
      const backupKey = `${MEMORY_BACKUP_PREFIX}${teacherId}`;
      const currentBackup: FormatoDocente[] = JSON.parse(localStorage.getItem(backupKey) || '[]');
      const savedFormat: FormatoDocente = {
        ...formato,
        id: formato.id || 'temp_' + Date.now(),
        updatedAt: now,
      };
      currentBackup.unshift(savedFormat);
      try {
        localStorage.setItem(backupKey, JSON.stringify(currentBackup));
      } catch {}

      throw new Error(
        `No se pudo sincronizar en la base de datos (${dbErr?.message || 'Error de conexión'}). Se guardó una copia temporal.`
      );
    }
  },

  /**
   * Sube el archivo .docx original al bucket privado de Supabase Storage
   * y guarda copia en cache local IndexedDB para acceso inmediato
   */
  async uploadArchivoOriginal(teacherId: string, formatoId: string, file: File | Blob): Promise<string> {
    const cleanId = formatoId || 'temp_' + Date.now();
    const path = `${teacherId}/${cleanId}.docx`;

    // 1. Guardar en cache local inmediato
    try {
      await guardarArchivoEnCache(path, file);
    } catch {}

    // 2. Intentar subir al bucket de Supabase Storage
    try {
      const { error } = await supabase.storage
        .from('formatos-originales')
        .upload(path, file, { upsert: true });

      if (error) {
        console.warn('Aviso de Supabase Storage al subir original (se usará cache local):', error.message);
      }
    } catch (err) {
      console.warn('Excepción de Supabase Storage:', err);
    }

    return path;
  },

  /**
   * Descarga o recupera el archivo .docx original desde cache local o Supabase Storage
   */
  async downloadArchivoOriginal(path: string): Promise<ArrayBuffer | null> {
    // 1. Intentar desde cache local (instantáneo)
    const local = await obtenerArchivoDeCache(path);
    if (local) return local;

    // 2. Intentar descargar de Supabase Storage
    try {
      const { data, error } = await supabase.storage
        .from('formatos-originales')
        .download(path);

      if (error || !data) throw error;
      const buf = await data.arrayBuffer();
      await guardarArchivoEnCache(path, buf);
      return buf;
    } catch (e) {
      console.warn('No se pudo descargar de Supabase Storage:', e);
      return null;
    }
  },

  async renombrarFormato(teacherId: string, formatoId: string, nuevoNombre: string): Promise<void> {
    if (!teacherId || !formatoId || !nuevoNombre.trim()) return;

    try {
      if (isValidUUID(formatoId)) {
        const { error } = await supabase
          .from('formatos_docente')
          .update({
            nombre: nuevoNombre.trim(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', formatoId)
          .eq('teacher_id', teacherId);

        if (error) throw error;
      }
    } catch (err: any) {
      console.warn('Error al renombrar formato en Supabase:', err);
    }

    try {
      const backupKey = `${MEMORY_BACKUP_PREFIX}${teacherId}`;
      const currentBackup: FormatoDocente[] = JSON.parse(localStorage.getItem(backupKey) || '[]');
      const found = currentBackup.find((f) => f.id === formatoId);
      if (found) {
        found.nombre = nuevoNombre.trim();
        found.updatedAt = new Date().toISOString();
        localStorage.setItem(backupKey, JSON.stringify(currentBackup));
      }
    } catch {}
  },

  async eliminarFormato(teacherId: string, formatoId: string): Promise<void> {
    if (!teacherId || !formatoId) return;

    try {
      if (isValidUUID(formatoId)) {
        const { error } = await supabase
          .from('formatos_docente')
          .delete()
          .eq('id', formatoId)
          .eq('teacher_id', teacherId);

        if (error) throw error;
      }
    } catch (err: any) {
      console.warn('Error al eliminar formato en Supabase:', err);
    }

    try {
      const backupKey = `${MEMORY_BACKUP_PREFIX}${teacherId}`;
      const currentBackup: FormatoDocente[] = JSON.parse(localStorage.getItem(backupKey) || '[]');
      const filtered = currentBackup.filter((f) => f.id !== formatoId);
      localStorage.setItem(backupKey, JSON.stringify(filtered));
    } catch {}
  },

  /**
   * Analiza un archivo de formato. Para Word (.docx), si el clonado está activo,
   * extrae también la plantilla estructural precisa para edición byte a byte.
   */
  async analizarFormato(
    file: File,
    nombrePersonalizado?: string,
    tipoSeleccionado: TipoDocumentoFormato = 'PPA'
  ): Promise<{ estructura: FormatoEstructura; plantilla?: PlantillaDocx; modo?: 'reconstruir' | 'clonar_docx' }> {
    const isDocx = file.name.endsWith('.docx') || file.type.includes('wordprocessingml');
    const isPdf = file.type === 'application/pdf' || file.name.endsWith('.pdf');
    const isImage = file.type.startsWith('image/');

    let contentsPayload: any;
    let plantillaExtraida: PlantillaDocx | undefined = undefined;

    if (isDocx && FEATURE_FLAGS.MI_FORMATO_CLONAR_ENABLED) {
      try {
        const { doc } = await cargarDocx(file);
        const mapa = construirMapa(doc);
        plantillaExtraida = await analizarPlantillaDocx(mapa);
      } catch (cloneErr) {
        console.warn('[DocxClone] Análisis de plantilla precisa advierte fallo, manteniendo modo reconstrucción:', cloneErr);
      }
    }

    if (isPdf || isImage) {
      const base64Data = await fileToBase64(file);
      contentsPayload = [
        {
          inlineData: {
            mimeType: isPdf ? 'application/pdf' : file.type,
            data: base64Data,
          },
        },
        {
          text: `Analiza minuciosamente este archivo de formato escolar docente venezolano ("${
            nombrePersonalizado || file.name
          }").
Tipo de documento seleccionado por el docente: ${tipoSeleccionado}.
Extrae la estructura exacta del documento:
1. Membrete institucional, institución educativa, docente, grado, sección y año escolar.
2. Títulos EXACTOS de cada sección o cuadro. NO los renombres, no los sintetices ni cambies ninguna palabra.
3. Tipo de sección: campo, parrafo, tabla o lista.
4. Si es tabla, los encabezados EXACTOS de cada una de sus columnas de izquierda a derecha.
5. El estilo predominante (color de títulos o tablas, fuente, orientación).
6. Un breve resumen pedagógico amable de lo que comprendiste para que el docente lo revise y confirme.`,
        },
      ];
    } else if (isDocx) {
      const { texto, html } = await extraerEstructuraWord(file);
      contentsPayload = [
        {
          text: `Analiza la siguiente estructura y texto extraídos de un documento Word (.docx) de un formato escolar venezolano:
Tipo de documento: ${tipoSeleccionado}.
Nombre del archivo: ${file.name}.

--- TEXTO EXTRAÍDO ---
${texto || ''}

--- ESTRUCTURA HTML DE TABLAS Y PÁRRAFOS ---
${html || ''}

Extrae la estructura exacta en formato JSON respetando rigurosamente cada título de sección y las columnas de cada tabla.`,
        },
      ];
    } else {
      throw new Error('Tipo de archivo no compatible. Sube un PDF, Word .docx o foto (JPG, PNG, WEBP).');
    }

    try {
      const response = await generateContentWithRetry({
        model: GEMINI_FORMATO_MODEL,
        contents: contentsPayload,
        config: {
          systemInstruction: FORMATO_ANALISIS_SYSTEM_INSTRUCTION,
          responseMimeType: 'application/json',
          responseSchema: FORMATO_ANALISIS_RESPONSE_SCHEMA,
        },
      });

      const responseText = response.text || '{}';
      const parsed = JSON.parse(responseText.trim());
      if (!parsed.secciones || !Array.isArray(parsed.secciones)) {
        throw new Error('No se detectaron secciones válidas en el formato.');
      }

      return {
        estructura: parsed as FormatoEstructura,
        plantilla: plantillaExtraida,
        modo: isDocx && plantillaExtraida ? 'clonar_docx' : 'reconstruir',
      };
    } catch (err: any) {
      console.error('Error al analizar formato con Gemini:', err);
      const msg = err?.message || String(err);
      if (
        msg.includes('429') ||
        msg.includes('503') ||
        msg.includes('demanda') ||
        msg.includes('saturados') ||
        msg.includes('ResourceExhausted')
      ) {
        throw new Error('Camila está ocupada, intenta en un minuto.');
      }
      throw err;
    }
  },

  /**
   * Genera el contenido pedagógico completo vaciado sección por sección en el formato
   * (Modo estándar de reconstrucción)
   */
  async generarContenidoConFormato(
    formato: FormatoDocente,
    datosDocente: {
      institucion?: string;
      docente?: string;
      gradoSeccion: string;
      nivel: string;
      tema: string;
      duracion: string;
      diagnostico?: string;
      instruccionesExtra?: string;
    }
  ): Promise<{ secciones: SeccionGenerada[]; observacionesPedagogicas?: string }> {
    const promptGeneracion = `Vacia la planificación escolar o PPA dentro del siguiente formato oficial de la escuela.

INFORMACIÓN DEL DOCENTE Y AULA:
- Institución: ${datosDocente.institucion || formato.estructura.encabezado?.institucion || 'Institución Educativa'}
- Docente: ${datosDocente.docente || 'Docente'}
- Grado y Sección: ${datosDocente.gradoSeccion || '3er Grado A'}
- Nivel Educativo: ${datosDocente.nivel || 'Primaria'}
- Tema del Proyecto o Plan: ${datosDocente.tema || 'Aprendemos y Creamos Juntos'}
- Duración: ${datosDocente.duracion || '4 semanas'}
- Diagnóstico Pedagógico: ${datosDocente.diagnostico || 'Grupo participativo y motivado hacia el aprendizaje constructivo.'}
${datosDocente.instruccionesExtra ? `- INSTRUCCIONES ESPECIALES DEL DOCENTE: ${datosDocente.instruccionesExtra}` : ''}

ESTRUCTURA DEL FORMATO A RESPETAR (SECCIÓN POR SECCIÓN):
${JSON.stringify(formato.estructura.secciones, null, 2)}

LINEAMIENTOS CURRICULARES:
Aplica el currículo oficial MPPE 2026-2027 de Venezuela. Para cada sección del formato, genera contenido completo, pertinente y con vocabulario pedagógico profesional.
Si una sección es de tipo 'tabla', genera un arreglo de filas donde cada fila tenga exactamente tantas celdas como columnas posee la tabla.
Si el docente especificó instrucciones como "${datosDocente.instruccionesExtra || ''}", respétalas estrictamente en todo el contenido.`;

    try {
      const response = await generateContentWithRetry({
        model: GEMINI_FORMATO_MODEL,
        contents: promptGeneracion,
        config: {
          systemInstruction: FORMATO_GENERACION_SYSTEM_INSTRUCTION,
          responseMimeType: 'application/json',
          responseSchema: FORMATO_GENERACION_RESPONSE_SCHEMA,
        },
      });

      const responseText = response.text || '{}';
      const parsed = JSON.parse(responseText.trim());
      let seccionesGeneradas: SeccionGenerada[] = parsed.secciones || [];

      const seccionesFaltantes = formato.estructura.secciones.filter(
        (secOrig) => !seccionesGeneradas.some((s) => s.seccionId === secOrig.id)
      );

      if (seccionesFaltantes.length > 0) {
        console.warn(`[Docenty Formato] Faltan ${seccionesFaltantes.length} secciones. Reintentando solo esas...`);
        try {
          const promptFaltantes = `Genera EXCLUSIVAMENTE el contenido para las siguientes secciones pedagógicas faltantes, alineado al currículo MPPE 2026-2027:
Tema: ${datosDocente.tema || 'Planificación'}
Grado: ${datosDocente.gradoSeccion || 'Primaria'}
Secciones a generar:
${JSON.stringify(seccionesFaltantes, null, 2)}`;

          const respFaltantes = await generateContentWithRetry({
            model: GEMINI_FORMATO_MODEL,
            contents: promptFaltantes,
            config: {
              systemInstruction: FORMATO_GENERACION_SYSTEM_INSTRUCTION,
              responseMimeType: 'application/json',
              responseSchema: FORMATO_GENERACION_RESPONSE_SCHEMA,
            },
          });

          const parsedFaltantes = JSON.parse(respFaltantes.text?.trim() || '{}');
          if (Array.isArray(parsedFaltantes.secciones)) {
            seccionesGeneradas = [...seccionesGeneradas, ...parsedFaltantes.secciones];
          }
        } catch (faltantesErr) {
          console.warn('Reintento de secciones específicas falló, conservando resultado previo:', faltantesErr);
        }
      }

      return {
        secciones: seccionesGeneradas,
        observacionesPedagogicas: parsed.observacionesPedagogicas || '',
      };
    } catch (err: any) {
      console.error('Error al generar contenido con formato:', err);
      const msg = err?.message || String(err);
      if (
        msg.includes('429') ||
        msg.includes('503') ||
        msg.includes('demanda') ||
        msg.includes('saturados') ||
        msg.includes('ResourceExhausted')
      ) {
        throw new Error('Camila está ocupada, intenta en un minuto.');
      }
      throw err;
    }
  },
};
