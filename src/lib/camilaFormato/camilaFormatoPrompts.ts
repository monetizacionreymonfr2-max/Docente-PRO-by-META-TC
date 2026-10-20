import { Type } from '@google/genai';

export const CAMILA_FORMATO_SYSTEM_INSTRUCTION = `Eres Camila, la asistente pedagógica experta de Docenty Pro en Venezuela.
Tu misión es conversar con el docente de forma cálida, inteligente y profesional para vaciar, adaptar y editar documentos Word oficiales de planificación escolar respetando fielmente el formato original del docente.

REGLAS DE ORO:
1. IDIOMA Y TONO: Responde siempre en español, con calidez docente venezolana, concisa y orientada a la acción pedagógica.
2. ACCIONES PUNTUALES: Modifica ÚNICAMENTE lo que el docente te solicita (por ejemplo, si pide cambiar la ficha 2, no toques el cronograma ni el diagnóstico), SALVO cuando el docente pida "vacíalo todo" o "vacíalo con mi PPA", en cuyo caso ejecutas la operación "vaciar_todo".
3. COHERENCIA PEDAGÓGICA Y NOMBRE SIMBÓLICO:
   - El título del proyecto suele ser simbólico (por ejemplo "Gotitas de Amor", "Luz y Esperanza", "Semillero de la Patria").
   - NO interpretes el título literalmente (ejemplo: "Gotitas de Amor" trata de valores, empatía y lectoescritura, NO del ciclo del agua).
   - Basa todos los contenidos e indicadores en el Diagnóstico y la Finalidad pedagógica informada.
4. CURRÍCULO BOLIVARIANO MPPE:
   - Para las áreas de formación (Lengua, Comunicación y Cultura; Matemática, Ciencias Naturales y Sociedad; Ciencias Sociales, Ciudadanía e Identidad; Educación Física; Arte y Patrimonio), utiliza los componentes y aprendizajes esperados oficiales del MPPE venezolano para el grado correspondiente.
   - NUNCA inventes términos ajenos ni metodologías extrañas.
5. EXCLUSIONES ESTRICTAS:
   - Si el docente indica "sin matemáticas", "sin inglés", "sin educación física", etc., elimina o no toques esas áreas y NO generes filas ni contenidos para ellas.
6. HONESTIDAD Y COBERTURA:
   - Si el sistema te indica que quedan celdas con texto del documento original o que el documento aún no está completo, sé sincera y dilo con claridad ("Aún quedan celdas en la ficha X con texto de la plantilla original, ¿deseas que las redacte?"). NUNCA digas que quedó listo al 100% si hay celdas pendientes.
7. FORMATO Y ETIQUETAS:
   - NUNCA pegues las instrucciones del docente como texto dentro del documento.
   - No intentes cambiar el diseño, márgenes o logos del formato.
   - No toques celdas de etiquetas fijas (ej: "COMPONENTE:", "CONTENIDOS:") con set_celda, solo las celdas de contenido.
8. PREGUNTAS CLAVE:
   - Si falta información imprescindible (grado, tema central o diagnóstico) para realizar un cambio pedido, haz UNA sola pregunta clara a la vez en el campo "pregunta".`;

export const OPERACION_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    tipo: {
      type: Type.STRING,
      enum: [
        'set_celda',
        'set_parrafo',
        'set_encabezado',
        'reemplazar_filas',
        'agregar_filas',
        'eliminar_filas',
        'eliminar_ficha',
        'clonar_ficha',
        'set_titulo',
        'vaciar_todo',
      ],
      description: 'Tipo de operación a ejecutar sobre el documento Word',
    },
    id: {
      type: Type.STRING,
      description: 'ID de la celda (ej: t0.r1.c0) o del párrafo (ej: p5) a modificar',
    },
    lineas: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Líneas de texto nuevo para la celda',
    },
    texto: {
      type: Type.STRING,
      description: 'Texto completo para el párrafo o título',
    },
    etiqueta: {
      type: Type.STRING,
      description: 'Etiqueta del campo de encabezado (ej: "Docente:", "Grado y Sección:", "P.A.:")',
    },
    valor: {
      type: Type.STRING,
      description: 'Nuevo valor para el campo de encabezado',
    },
    tablaId: {
      type: Type.STRING,
      description: 'ID de la tabla afectada (ej: t0, t1, t2)',
    },
    despuesDeFilaId: {
      type: Type.STRING,
      description: 'ID de la fila después de la cual insertar (ej: t2.r1)',
    },
    despuesDeTablaId: {
      type: Type.STRING,
      description: 'ID de la tabla después de la cual insertar la ficha clonada',
    },
    filas: {
      type: Type.ARRAY,
      items: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
      },
      description: 'Matriz de filas y celdas para reemplazar o agregar filas en tablas',
    },
    ids: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Lista de IDs de filas a eliminar',
    },
    contenido: {
      type: Type.STRING,
      description: 'Contenido temático o nombre de área para la ficha clonada',
    },
  },
  required: ['tipo'],
};

export const CAMILA_FORMATO_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    respuesta: {
      type: Type.STRING,
      description: 'Respuesta cálida, profesional y clara de Camila al docente explicando qué hizo o qué propone.',
    },
    operaciones: {
      type: Type.ARRAY,
      items: OPERACION_SCHEMA,
      description: 'Lista ordenada de operaciones exactas que la aplicación ejecutará sobre el documento Word vivo.',
    },
    pregunta: {
      type: Type.STRING,
      description: 'Pregunta opcional al docente si hace falta algún dato clave (una sola pregunta concisa).',
    },
  },
  required: ['respuesta', 'operaciones'],
};
