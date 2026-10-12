import { ContenidoItem, GradoPrimaria } from './types';

// CURRÍCULO OFICIAL MPPE 2026-2027: PRÁCTICAS DEL LENGUAJE (Págs. 24-75)
// Componentes: Lectura, Escritura, Oralidad
export const LENGUAJE_DATA: Record<GradoPrimaria, Record<string, ContenidoItem[]>> = {
  '1': {
    'Lectura': [
      {
        id: 'len-1-lec-1',
        contenido: 'Leer a través de la o el docente',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Muestra interés por escuchar cuentos y otros textos leídos por el docente.', oficial: true },
          { texto: 'Demuestra necesidad de leer para informarse.', oficial: true },
          { texto: 'Interpreta el contenido de textos utilizando los conocimientos previos: título y algunos datos aportados por la/el docente antes de la lectura.', oficial: true },
          { texto: 'Infiere el significado de ciertas palabras en textos leídos por la/el docente, a partir del contexto.', oficial: true }
        ]
      },
      {
        id: 'len-1-lec-2',
        contenido: 'Seleccionar, entre un conjunto de textos, el que desea leer, a partir de los elementos contextuales.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Muestra criterios de selección de lecturas de acuerdo con preferencias e intereses.', oficial: true }
        ]
      },
      {
        id: 'len-1-lec-3',
        contenido: 'Anticipar el contenido de textos a partir del contexto.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: '“Lee por sí mismo” aplicando la estrategia de anticipar el contenido a partir de las imágenes, identificando títulos y algunas palabras mediante el reconocimiento de ciertas letras, entre otras estrategias de lectura para “leer” antes de poder hacerlo convencionalmente.', oficial: true }
        ]
      },
      {
        id: 'len-1-lec-4',
        contenido: 'Conocer los nombres de un repertorio de letras del alfabeto y sus correspondientes sonidos.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Conoce los nombres de un amplio repertorio de letras del alfabeto y las usa en la lectura.', oficial: true }
        ]
      },
      {
        id: 'len-1-lec-5',
        contenido: 'Localizar información (palabras y fragmentos) en textos conocidos, leídos por otros, a partir de elementos contextuales.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Localiza información en textos conocidos (previamente leídos por otros), a partir de elementos contextuales: información aportada por la o el docente, imágenes, conocimiento de ciertas letras, extensión.', oficial: true }
        ]
      },
      {
        id: 'len-1-lec-6',
        contenido: 'Identificar el nombre propio en una lista corta de nombres, a partir de la longitud de las palabras y del reconocimiento de letras (inicial, final y otras).',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Identifica su propio nombre y los de personas conocidas, aplicando estrategias de diferenciación de palabras a partir de indicios.', oficial: true }
        ]
      },
      {
        id: 'len-1-lec-7',
        contenido: 'Identificar, entre varias, la palabra que corresponde a una determinada imagen.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Establece correspondencias entre imágenes y palabras.', oficial: true }
        ]
      },
      {
        id: 'len-1-lec-8',
        contenido: 'Diferenciar entre diversos tipos de textos.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Tiene idea de las diferencias y denomina por sus nombres diversos tipos de textos: cuentos, poemas, coplas, adivinanzas, noticias. (Esto no significa que pueda conceptualizar y expresar las diferencias verbalmente).', oficial: true }
        ]
      },
      {
        id: 'len-1-lec-9',
        contenido: 'Caracterizar personajes y escenarios de textos narrativos.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Identifica y describe componentes de textos narrativos: personajes y escenarios.', oficial: true }
        ]
      },
      {
        id: 'len-1-lec-10',
        contenido: 'Identificar palabras en el mapa.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Localiza en el mapa y lee el nombre del estado donde reside, los de estados limítrofes, y otros.', oficial: true }
        ]
      },
      {
        id: 'len-1-lec-11',
        contenido: 'Descifrar símbolos y material visual.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Interpreta informaciones contenidas en materiales gráficos, como figuras simples, mapas y gráficos.', oficial: true },
          { texto: 'Conoce el significado de algunas señales básicas: no pase, peligro, alta tensión, baño de damas, de caballeros, etc.', oficial: true }
        ]
      },
      {
        id: 'len-1-lec-12',
        contenido: 'Conocer títulos y nombres de autores o autoras de obras literarias preferidas.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Menciona títulos y nombres de autores o autoras de un repertorio de cuentos y poemas, y comenta con otras sobre sus obras preferidas.', oficial: true }
        ]
      },
      {
        id: 'len-1-lec-13',
        contenido: 'Establecer correspondencias entre partes de la emisión oral y segmentos de la escritura en textos previamente memorizados.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: '“Lee” textos memorizados previamente, estableciendo correspondencia entre partes de la emisión oral y segmentos del texto escrito (canciones, coplas, poemas).', oficial: true }
        ]
      },
      {
        id: 'len-1-lec-14',
        contenido: 'Resolver instrumentos de evaluación.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Resuelve situaciones de lectura y escritura, ciencias y matemáticas en instrumentos de evaluación dirigidos a estimar los efectos de la enseñanza y los avances en el aprendizaje.', oficial: true }
        ]
      },
      {
        id: 'len-1-lec-15',
        contenido: 'Explorar algunos “datos curiosos” del español.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Conoce algunas palabras que se leen igual en ambos sentidos (palíndromos), como: ojo, oro, oso, ala, ama, asa, ese, eme, ele.', oficial: true },
          { texto: 'Conoce palabras que repiten una misma vocal en todas las sílabas, como: catarata, campana / jojoto, coroto / repelente, detergente / imprimir, difícil.', oficial: true }
        ]
      },
      {
        id: 'len-1-lec-16',
        contenido: 'Actuar como espectador en diversidad de espectáculos artísticos.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Se interesa por participar en presentaciones artísticas, festivales, tradiciones y costumbres.', oficial: true }
        ]
      },
      {
        id: 'len-1-lec-17',
        contenido: 'Conocer personajes destacados de la historia venezolana.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Conoce nombres y datos fundamentales de tres o cuatro venezolanos(as) ilustres: Simón Bolívar, Simón Rodríguez, Francisco de Miranda. Si es el caso, los epónimos de la escuela y del estado o municipio donde reside.', oficial: true }
        ]
      },
      {
        id: 'len-1-lec-18',
        contenido: 'Poseer conocimientos elementales acerca de temas de especial importancia.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Posee conocimientos básicos acerca de ciertos temas de especial interés: petróleo, agua, cuidado del ambiente y de la salud.', oficial: true }
        ]
      }
    ],
    'Escritura': [
      {
        id: 'len-1-esc-1',
        contenido: 'Escribir convencionalmente el nombre propio.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Escribe convencionalmente su nombre y un repertorio de palabras familiares (nombres propios y otras de uso común).', oficial: true },
          { texto: 'Usa las letras de su nombre y de palabras conocidas como referencia para escribir otras palabras.', oficial: true },
          { texto: 'Usa la mayúscula inicial en la escritura de nombres propios de personas conocidas.', oficial: true }
        ]
      },
      {
        id: 'len-1-esc-2',
        contenido: 'Participar en la construcción de las normas de convivencia.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Participa en la construcción y revisión permanente de las normas de convivencia en el aula y en otros espacios de la escuela.', oficial: true }
        ]
      },
      {
        id: 'len-1-esc-3',
        contenido: 'Usar en la escritura un repertorio de letras relativamente amplio.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Usa adecuadamente en la escritura un amplio repertorio de letras.', oficial: true }
        ]
      },
      {
        id: 'len-1-esc-4',
        contenido: 'Usar la tilde en la escritura del nombre propio.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Usa la tilde en la escritura del nombre propio (papá, mamá) y en palabras muy familiares (Ángel, Martín).', oficial: true }
        ]
      },
      {
        id: 'len-1-esc-5',
        contenido: 'Resolver diversos juegos con sílabas y letras.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Manifiesta gusto por resolver juegos de escritura trabajando en equipo con un compañero o compañera.', oficial: true },
          { texto: 'Forma palabras ordenando sílabas o letras escritas en desorden.', oficial: true },
          { texto: 'Resuelve crucifiguras, escaleras de palabras y otros juegos, de acuerdo con su nivel de escritura.', oficial: true }
        ]
      },
      {
        id: 'len-1-esc-6',
        contenido: 'Acudir a diversas fuentes de consulta para resolver dudas de escritura: buscar en el abecedario ilustrado del aula y en otros textos escritos disponibles en el salón, preguntar a compañeros y compañeras, y docentes.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Consulta con autonomía diversas fuentes para resolver dudas de escritura (cómo se escribe una letra o palabra, con cuáles se escribe una determinada palabra, en qué orden van).', oficial: true }
        ]
      },
      {
        id: 'len-1-esc-7',
        contenido: 'Conocer y usar en la escritura la diferencia singular/ plural.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Distingue la oposición singular/plural y la usa en la escritura, al menos en los casos en que el plural se forma agregando S al singular.', oficial: true }
        ]
      },
      {
        id: 'len-1-esc-8',
        contenido: 'Escribir textos con diversos propósitos (dictando a la o el docente y “por sí mismo”), de acuerdo con el nivel de escritura.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Escribe por sí mismo un repertorio de palabras familiares y textos, de acuerdo con su nivel de escritura: listas de nombres propios, de animales, lugares, etc., títulos de cuentos leídos o que desea leer y carteles informativos, entre otros.', oficial: true }
        ]
      },
      {
        id: 'len-1-esc-9',
        contenido: 'Escribir a través del docente.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Trabaja en equipo para planificar la escritura de textos que serán dictados, al docente.', oficial: true }
        ]
      },
      {
        id: 'len-1-esc-10',
        contenido: 'Ordenar conjuntos de palabras para formar oraciones cortas (previa información aportada por la o el docente sobre cuál es la oración que debe formarse).',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Construye textos cortos ordenando entre dos y cuatro palabras escritas en otro orden. Por ejemplo: Simón Bolívar / yo vivo en Venezuela / me gusta leer / feliz cumpleaños.', oficial: true }
        ]
      },
      {
        id: 'len-1-esc-11',
        contenido: 'Escribir, al menos de acuerdo al nivel silábico del sistema escritura.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Escribe por sí mismo diferentes textos de extensiones variables (en una o varias sesiones), de acuerdo con su nivel de escritura (silábico o silábico-alfabético).', oficial: true }
        ]
      },
      {
        id: 'len-1-esc-12',
        contenido: 'Copiar y tomar dictados con propósitos definidos: para conservar lo que se desea recordar, para compartir con otros, para llevar registros de informaciones de interés.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Copia textos cortos escritos en el pizarrón, o de otros soportes, conociendo su contenido mediante la lectura previa por parte del docente.', oficial: true },
          { texto: 'Toma dictado de listas de pocas palabras u otros textos cortos con propósitos específicos.', oficial: true }
        ]
      },
      {
        id: 'len-1-esc-13',
        contenido: 'Revisar, corregir textos y cuidar la caligrafía de textos que serán publicados.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Aplica estrategias de revisión y edición de textos que serán publicados, trabajando en equipo y con el apoyo del o la docente.', oficial: true },
          { texto: 'Se esfuerza por escribir en forma más legible cuando sus producciones serán publicadas.', oficial: true }
        ]
      },
      {
        id: 'len-1-esc-14',
        contenido: 'Conocer y usar en la escritura la diferencia de género femenino/ masculino.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Usa en la escritura la diferencia femenino/ masculino, en casos en que el femenino se forma agregando A al final de palabra o sustituyendo O por A: pintor/pintora; doctor/doctora; gato/gata; rojo/roja; conejo/coneja.', oficial: true }
        ]
      },
      {
        id: 'len-1-esc-15',
        contenido: 'Crear nuevas versiones de cuentos.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Escribe nuevas versiones de cuentos leídos, y produce relatos a partir de títulos e imágenes.', oficial: true }
        ]
      },
      {
        id: 'len-1-esc-16',
        contenido: 'Desarrollar textos a partir de diferentes inicios.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Crea textos a partir de frases iniciales: cuando sea grande…; si yo fuera presidente…; sueño con…; soy una zanahoria azul…; si me consigo con Simón Bolívar…; mi país, Venezuela, es…', oficial: true }
        ]
      },
      {
        id: 'len-1-esc-17',
        contenido: 'Escribir preguntas para entrevistas.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Planifica y escribe preguntas para entrevistas, en equipo con un compañero o compañera.', oficial: true }
        ]
      }
    ],
    'Oralidad': [
      {
        id: 'len-1-ora-1',
        contenido: 'Tomar la palabra para satisfacer diversas necesidades e intenciones.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Actúa como hablante-oyente en diversas situaciones comunicativas: manifestar sentimientos, solicitar, reclamar, narrar, opinar, describir, explicar.', oficial: true },
          { texto: 'Usa diversas fórmulas sociales para interactuar con los demás en situaciones de la vida cotidiana: gracias, de nada, con permiso, por favor, buenos días, etc.', oficial: true }
        ]
      },
      {
        id: 'len-1-ora-2',
        contenido: 'Participar en intercambios grupales para confrontar interpretaciones y puntos de vista acerca de diversidad de textos leídos por la o el docente.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Participa activamente en intercambios grupales sobre textos leídos por la o el docente, para expresar sus interpretaciones y puntos de vista.', oficial: true },
          { texto: 'Escucha y considera los puntos de vista del otro u otra, y defiende los propios con explicaciones y argumentos.', oficial: true }
        ]
      },
      {
        id: 'len-1-ora-3',
        contenido: 'Participar en cine foros.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Participa como espectador de películas y en comentarios grupales posteriores acerca de los contenidos.', oficial: true }
        ]
      },
      {
        id: 'len-1-ora-4',
        contenido: 'Dialogar con diferentes intenciones: resolver diferencias, decidir las reglas de un juego, manifestar y resolver desacuerdos.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Dialoga con diferentes propósitos, en variados contextos comunicativos, considerando los puntos de vista de otros u otras.', oficial: true }
        ]
      },
      {
        id: 'len-1-ora-5',
        contenido: 'Formular preguntas y emitir respuestas acerca de diversos temas y situaciones cotidianas.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Pregunta y responde sobre diversos contenidos de estudio tratados en el aula.', oficial: true },
          { texto: 'Pregunta para solicitar información y satisfacer necesidades de distinta índole.', oficial: true }
        ]
      },
      {
        id: 'len-1-ora-6',
        contenido: 'Utilizar un repertorio de palabras cada vez más amplio para expresarse.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Se expresa con un vocabulario más amplio para satisfacer diversas necesidades de comunicación.', oficial: true }
        ]
      },
      {
        id: 'len-1-ora-7',
        contenido: 'Cantar y declamar para diversas audiencias.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Canta/declama un repertorio de canciones, poemas y coplas, previamente memorizadas, ajustando en lo posible los rasgos de la voz a distintas audiencias.', oficial: true }
        ]
      },
      {
        id: 'len-1-ora-8',
        contenido: 'Entonar el Himno Nacional y el de su estado.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Entona el Himno Nacional y el de su estado, al menos el coro y algunas estrofas.', oficial: true }
        ]
      },
      {
        id: 'len-1-ora-9',
        contenido: 'Narrar cuentos conocidos para diversas audiencias.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Narra cuentos conocidos siguiendo la secuencia de los hechos y utilizando descriptores para caracterizar personajes y escenas del relato.', oficial: true },
          { texto: 'Utiliza algunas fórmulas de inicio propias de la narración, al relatar sus propios cuentos: había una vez… / en un lugar llamado… / hace mucho tiempo…', oficial: true }
        ]
      },
      {
        id: 'len-1-ora-10',
        contenido: 'Jugar, divertirse y entretener a otros u otras con diversas expresiones lúdicas del lenguaje.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Comparte con otras personas un repertorio de expresiones lúdicas: trabalenguas, adivinanzas, cuentos de nunca acabar, retahílas.', oficial: true }
        ]
      },
      {
        id: 'len-1-ora-11',
        contenido: 'Participar en intercambios de grupo sobre respuestas a instrumentos de evaluación.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Participa en la comparación de respuestas a instrumentos de evaluación mediante intercambios con compañeras, compañeros y docente.', oficial: true }
        ]
      },
      {
        id: 'len-1-ora-12',
        contenido: 'Conocer el significado y usar expresiones de la cultura popular venezolana.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Incorpora a su repertorio algunas expresiones de la lengua popular de Venezuela. Ejemplos: radio loco, darse un mamonazo, estar pintado en la pared, gozar un puyero.', oficial: true }
        ]
      },
      {
        id: 'len-1-ora-13',
        contenido: 'Memorizar parlamentos para desempeñar roles.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Reproduce parlamentos en situaciones de simulación de roles y dramatización de obras.', oficial: true }
        ]
      },
      {
        id: 'len-1-ora-14',
        contenido: 'Enriquecer el vocabulario para nombrar y calificar personas, objetos, sucesos y hechos del entorno.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Utiliza un repertorio de nuevas palabras que trascienden el léxico utilizado cotidianamente.', oficial: true }
        ]
      },
      {
        id: 'len-1-ora-15',
        contenido: 'Inventar historietas y cuentos a partir de imágenes.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Crea historietas y cuentos a partir de imágenes.', oficial: true }
        ]
      },
      {
        id: 'len-1-ora-16',
        contenido: 'Comentar con otras personas acerca de textos leídos.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Comenta con otras personas acerca de textos y temas de su interés.', oficial: true }
        ]
      },
      {
        id: 'len-1-ora-17',
        contenido: 'Relacionar contenidos de cuentos con experiencias de la vida diaria.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Evoca y expresa hechos de la vida diaria relacionadas con contenidos de los cuentos leídos.', oficial: true }
        ]
      },
      {
        id: 'len-1-ora-18',
        contenido: 'Comprender instrucciones orales.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Ejecuta acciones a partir de instrucciones y consignas.', oficial: true }
        ]
      },
      {
        id: 'len-1-ora-19',
        contenido: 'Escuchar con respeto las intervenciones de los demás en contextos de intercambios verbales.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Respeta el turno de habla de sus interlocutores.', oficial: true }
        ]
      },
      {
        id: 'len-1-ora-20',
        contenido: 'Informar sobre sí mismo/a y su entorno.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Responde preguntas sobre sí mismo y sobre su entorno: nombres y apellidos, edad, fecha de nacimiento, lugar donde vive, nombres de familiares cercanos.', oficial: true },
          { texto: 'Relata historias sobre experiencias personales y sucesos de su entorno cercano.', oficial: true }
        ]
      },
      {
        id: 'len-1-ora-21',
        contenido: 'Interpretar y usar algunos refranes, expresiones y dichos del repertorio popular venezolano.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Conoce el sentido y usa algunos dichos y refranes de fácil comprensión. Ejemplos: “le entra por un oído y le sale por el otro”, “a palabras necias, oídos sordos”, “de tal palo tal astilla”, “hijo de gato, caza ratón”.', oficial: true }
        ]
      },
      {
        id: 'len-1-ora-22',
        contenido: 'Conocer los nombres de sonidos que emiten animales del entorno.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Conoce e imita los sonidos que emiten animales conocidos: el gato maúlla y ronronea, el perro ladra y aúlla, el turpial canta y silba, el cerdo gruñe y chilla, la vaca muge.', oficial: true }
        ]
      },
      {
        id: 'len-1-ora-23',
        contenido: 'Distinguir entre situaciones formales e informales de comunicación verbal.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Adecúa su comportamiento al nivel de formalidad de la situación comunicativa.', oficial: true }
        ]
      },
      {
        id: 'len-1-ora-24',
        contenido: 'Presenciar y disfrutar de eventos artísticos.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Mantiene el comportamiento adecuado en espectáculos artísticos y presentaciones literarias: recitales, obras de teatro, lectura de poemas y cuentos.', oficial: true }
        ]
      }
    ]
  },
  '2': {
    'Lectura': [
      {
        id: 'len-2-lec-1',
        contenido: 'Leer a través de la voz de otros.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Interpreta textos leídos por la/el docente.', oficial: true }]
      },
      {
        id: 'len-2-lec-2',
        contenido: 'Seleccionar lo que desea leer a partir del reconocimiento de títulos e imágenes.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Usa criterios de selección de textos de acuerdo con preferencias e intereses.', oficial: true }]
      },
      {
        id: 'len-2-lec-3',
        contenido: 'Leer diferentes tipos de textos, con diversos propósitos: apreciar el sentido estético de la literatura; emocionarse y conmoverse; seguir instrucciones; informarse.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Manifiesta interés y satisfacción por la lectura de textos literarios de su preferencia.', oficial: true },
          { texto: 'Muestra necesidad y gusto por leer para aprender contenidos sobre diversos temas.', oficial: true }
        ]
      },
      {
        id: 'len-2-lec-4',
        contenido: 'Establecer correspondencias entre imágenes y palabras.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Selecciona, entre varias, la palabra que corresponde a determinada imágen.', oficial: true }]
      },
      {
        id: 'len-2-lec-5',
        contenido: 'Anticipar el contenido de textos a partir de los elementos contextuales: lectura de títulos, imágenes, información proporcionada por la o el docente, conocimiento de letras y palabras.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Lee por sí mismo usando la estrategia de anticipar el contenido a partir de títulos y algunas palabras, entre otras estrategias para “leer”, antes de poder hacerlo convencionalmente.', oficial: true }]
      },
      {
        id: 'len-2-lec-6',
        contenido: 'Conocer los nombres de las letras del alfabeto y el valor sonoro de un amplio repertorio.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Usa el conocimiento de las letras del alfabeto para leer y escribir por sí mismo.', oficial: true }]
      },
      {
        id: 'len-2-lec-7',
        contenido: 'Localizar información (palabras y fragmentos) en textos conocidos, a partir de elementos contextuales.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Ubica información en textos –leídos previamente por la o el docente– a partir de elementos contextuales (información aportada por la/el docente, imágenes, conocimiento de letras y palabras).', oficial: true }]
      },
      {
        id: 'len-2-lec-8',
        contenido: 'Localizar nombres propios de personas y otras palabras familiares, en listas cortas, a partir de indicios.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Identifica palabras contenidas en listas de cuatro a cinco palabras, a partir de la longitud y del reconocimiento de las letras (inicial, final y otras).', oficial: true }]
      },
      {
        id: 'len-2-lec-9',
        contenido: 'Diferenciar entre diversos tipos de textos: cuentos, poemas, adivinanzas, informativos.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Denomina por sus nombres diversos tipos de textos y conoce sus diferencias, aunque no las conceptualice verbalmente.', oficial: true }]
      },
      {
        id: 'len-2-lec-10',
        contenido: 'Caracterizar personajes y escenarios de textos narrativos.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Identifica y describe componentes de textos narrativos: personajes y escenarios.', oficial: true }]
      },
      {
        id: 'len-2-lec-11',
        contenido: 'Identificar ideas esenciales en textos leídos.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Infiere ideas clave para la comprensión de textos.', oficial: true }]
      },
      {
        id: 'len-2-lec-12',
        contenido: 'Conocer títulos y nombres de autores/ autoras de obras literarias preferidas.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Menciona títulos y nombres de autores/ autoras de un repertorio de cuentos y recomienda sus favoritos.', oficial: true }]
      },
      {
        id: 'len-2-lec-13',
        contenido: 'Establecer correspondencias entre partes de la emisión oral y segmentos de la escritura, en textos previamente memorizados.',
        oficial: true,
        aprendizajesEsperados: [{ texto: '“Lee” textos memorizados previamente, estableciendo correspondencias entre partes de la emisión oral y segmentos del texto escrito (canciones, coplas, poemas).', oficial: true }]
      },
      {
        id: 'len-2-lec-14',
        contenido: 'Identificar nombres de estados, ríos y lagos fundamentales en el mapa de Venezuela.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Ubica varios estados, lugares importantes de su estado y localidad de residencia. El río Orinoco y el Lago de Maracaibo en el mapa de República Bolivariana de Venezuela y lee sus nombres.', oficial: true }]
      },
      {
        id: 'len-2-lec-15',
        contenido: 'Resolver instrumentos de evaluación.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Resuelve actividades de lectura y escritura en instrumentos para estimar efectos de la enseñanza y avances en el aprendizaje.', oficial: true }]
      },
      {
        id: 'len-2-lec-16',
        contenido: 'Conocer el significado de algunos elementos de la señalética.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Identifica algunas señales básicas: no pase, peligro, alta tensión, baño de damas / de caballeros.', oficial: true }]
      },
      {
        id: 'len-2-lec-17',
        contenido: 'Relacionar contenidos de cuentos con experiencias de la vida diaria.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Evoca experiencias de la vida diaria relacionadas con el contenido durante la lectura de cuentos.', oficial: true }]
      },
      {
        id: 'len-2-lec-18',
        contenido: 'Asumir una posición crítica frente a contenidos de textos.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Manifiesta dudas y pregunta sobre contenidos que les generan interrogantes.', oficial: true }]
      },
      {
        id: 'len-2-lec-19',
        contenido: 'Conocer personajes destacados de la historia venezolana.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Conoce nombres y datos fundamentales de tres o cuatro venezolanos(as) ilustres: Simón Bolívar, Simón Rodríguez, Francisco de Miranda. Si es el caso, epónimos de la escuela y del estado, municipio o parroquia donde reside.', oficial: true }]
      },
      {
        id: 'len-2-lec-20',
        contenido: 'Conocer algunos “datos curiosos” del español.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Conoce un repertorio de palabras que se leen igual en ambos sentidos. Ejemplos: oro, oso, ele, eme, ere, ana, ama, ala, ese.', oficial: true },
          { texto: 'Conoce palabras que repiten una misma vocal en todas las sílabas: sábana, cántara / monólogo, fósforo / detenerse, gerente / dimitir, picnic.', oficial: true }
        ]
      },
      {
        id: 'len-2-lec-21',
        contenido: 'Actuar como espectador en diversidad de espectáculos artísticos.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Actúa como espectador responsable en presentaciones artísticas, festivales, tradiciones y costumbres.', oficial: true }]
      }
    ],
    'Escritura': [
      {
        id: 'len-2-esc-1',
        contenido: 'Escribir acuerdos sobre normas de convivencia en la escuela.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Participa en la discusión y escritura de normas de convivencia en el aula y otros espacios de la escuela.', oficial: true }]
      },
      {
        id: 'len-2-esc-2',
        contenido: 'Usar la tilde en la escritura de palabras familiares.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Usa la tilde en la escritura de sus nombres y apellidos, y en palabras muy familiares.', oficial: true }]
      },
      {
        id: 'len-2-esc-3',
        contenido: 'Escribir convencionalmente su propio nombre y los de personas de su entorno cercano.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Escribe correctamente su nombre y un repertorio de palabras familiares (nombres propios y otras de uso común).', oficial: true },
          { texto: 'Usa las letras de su nombre y de palabras conocidas como referencia para escribir otras.', oficial: true },
          { texto: 'Conoce y usa la mayúscula inicial en la escritura de nombres propios de persona y lugares conocidos.', oficial: true }
        ]
      },
      {
        id: 'len-2-esc-4',
        contenido: 'Entretenerse con la resolución de diversos juegos con sílabas y letras.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Manifiesta interés por resolver juegos de escritura trabajando en equipo con un compañero/compañera: ordenar sílabas o letras disponibles en tarjetas separadas para formar palabras; crucifiguras, escaleras de palabras, dameros y otros.', oficial: true }]
      },
      {
        id: 'len-2-esc-5',
        contenido: 'Acudir a diversas fuentes de consulta para resolver dudas de escritura: buscar en el abecedario ilustrado del aula y en otros textos escritos disponibles en el salón, preguntar a compañeros o docentes.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Consulta espontáneamente diversas fuentes para resolver dudas de escritura: cómo se escribe una letra o palabra, con cuáles se escribe una determinada palabra, en qué orden van, ¿va con la B alta o con la V pequeña?, ¿es con una sola R o con dos?, entre otras dudas.', oficial: true }]
      },
      {
        id: 'len-2-esc-6',
        contenido: 'Usar convencionalmente las letras del alfabeto.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Usa convencionalmente en la escritura un amplio repertorio de letras.', oficial: true }]
      },
      {
        id: 'len-2-esc-7',
        contenido: 'Planificar con un compañero/ compañera la escritura de cuentos y otros textos.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Trabaja en equipo para planificar la escritura de textos que serán dictados a la/ el docente.', oficial: true }]
      },
      {
        id: 'len-2-esc-8',
        contenido: 'Ordenar conjuntos de palabras para formar oraciones cortas, previa información aportada por la o el docente sobre cuál es la oración que debe formarse.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Construye textos cortos ordenando entre tres y cinco palabras disponibles en tarjetas separadas o escritas sin orden definido. Por ejemplo: Simón Bolívar es nuestro Libertador / Venezuela es mi país / Me gusta mucho leer / Feliz cumpleaños.', oficial: true }]
      },
      {
        id: 'len-2-esc-9',
        contenido: 'Escribir según el nivel silábico-alfabético o alfabético del sistema de escritura.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Escribe por sí mismo diferentes textos de extensiones variables (en una o varias sesiones), de acuerdo con su nivel de escritura: cuentos, listas de nombres propios, de animales, etc.; títulos de cuentos leídos, entre otros.', oficial: true }]
      },
      {
        id: 'len-2-esc-10',
        contenido: 'Copiar con diversos propósitos reales: para conservar lo que se desea recordar; llevar registros de informaciones de interés.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Copia textos cortos escritos en el pizarrón u otro soporte, cuyo contenido conoce mediante la lectura previa de la o el docente.', oficial: true }]
      },
      {
        id: 'len-2-esc-11',
        contenido: 'Tomar dictados con propósitos definidos: comparar y corregir su escrito con el de un compañero/ra; para registrar información de interés.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Toma dictado de textos cortos con propósitos específicos.', oficial: true }]
      },
      {
        id: 'len-2-esc-12',
        contenido: 'Cuidar la caligrafía y ciertos aspectos formales de la escritura en textos que serán publicados.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Escribe en forma relativamente legible cuando produce textos para publicar.', oficial: true },
          { texto: 'Aplica estrategias de revisión y edición de textos que serán publicados, trabajando en equipo con otros, y con el apoyo de la o el docente.', oficial: true }
        ]
      },
      {
        id: 'len-2-esc-13',
        contenido: 'Conocer y usar en la escritura la diferencia singular/ plural.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Distingue la oposición singular/plural y la usa en la escritura, en los casos en que el plural se forma agregando S al singular y en casos conocidos en que se agrega un sufijo (lápiz/ lápices; cartel/ carteles; ají/ ajíes).', oficial: true }]
      },
      {
        id: 'len-2-esc-14',
        contenido: 'Crear nuevas versiones de cuentos conocidos.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Escribe nuevas versiones de cuentos conocidos.', oficial: true }]
      },
      {
        id: 'len-2-esc-15',
        contenido: 'Producir textos a partir de diferentes inicios.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Crea textos a partir de diferentes inicios: El día que llegué a…; si yo fuera pintor…; cuando viaje a la luna…; soy una hormiga gigante.', oficial: true }]
      },
      {
        id: 'len-2-esc-16',
        contenido: 'Conocer y usar en la escritura la diferencia de género femenino/ masculino.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'El femenino se forma agregando A al final de palabra o sustituyendo O por A: pintor/pintora; doctor/doctora; gato/gata; rojo/ roja; conejo/ coneja.', oficial: true },
          { texto: 'El género se diferencia usando palabras distintas: hombre/ mujer, caballo/ yegua, vaca/ toro, varón/ hembra.', oficial: true }
        ]
      },
      {
        id: 'len-2-esc-17',
        contenido: 'Utilizar en la escritura los recursos ortográficos fundamentales y conectores.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Usa en la escritura conectores básicos ortográficos fundamentales y conectores.', oficial: true }]
      },
      {
        id: 'len-2-esc-18',
        contenido: 'Escribir reseñas de obras literarias.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Recomienda obras literarias mediante breves reseñas escritas.', oficial: true }]
      },
      {
        id: 'len-2-esc-19',
        contenido: 'Usar en la escritura ciertas restricciones del sistema de escritura alfabético.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Aplica a la escritura algunas restricciones del sistema de escritura alfabético: dígrafo GU en gue-gui; QU en que-qui.', oficial: true }]
      },
      {
        id: 'len-2-esc-20',
        contenido: 'Utilizar en la escritura recursos ortográficos fundamentales.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Escribe utilizando algunos recursos ortográficos básicos: mayúsculas en nombres propios y de lugares, al inicio de un texto; el punto al final de un texto.', oficial: true }]
      },
      {
        id: 'len-2-esc-21',
        contenido: 'Conocer nociones ortográficas del sistema de escritura.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Al principio y al final de palabras siempre va una sola R (rama, reto, risa, ruta, rosa / cantar, trepar, nacer, radar, hangar).', oficial: true },
          { texto: 'Identifica cambios de significado según el uso de r/rr al interior de palabras: carro/ caro; perra/pera; cerro/cero.', oficial: true }
        ]
      },
      {
        id: 'len-2-esc-22',
        contenido: 'Escribir convencionalmente palabras con sílabas complejas.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Comienza a escribir convencionalmente las palabras que contienen sílabas del grupo consonante-consonante-vocal (ccv), tales como: clase, copla, tropa, fruta, flor, cobre, grama, drama, grillo.', oficial: true }]
      },
      {
        id: 'len-2-esc-23',
        contenido: 'Escribir ideas relevantes sobre temas leídos.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Registra por escrito contenidos fundamentales sobre diversos temas, a partir de la lectura de textos.', oficial: true }]
      },
      {
        id: 'len-2-esc-24',
        contenido: 'Escribir convencionalmente palabras que contienen sílabas indirectas (vc) y del grupo silábico cvc.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Escribe, en forma convencional, palabras con sílabas indirectas (vc), por ejemplo: antonio, asterisco, olmo, elsa, intriga, alto, usted.', oficial: true },
          { texto: 'Escribe palabras que contienen el grupo silábico cvc: mango, pasta, colmo, carta, manzana, salto, percha, santo, pasto.', oficial: true }
        ]
      }
    ],
    'Oralidad': [
      {
        id: 'len-2-ora-1',
        contenido: 'Formular preguntas y emitir respuestas acerca de diversos temas.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Solicita información requerida y pregunta acerca de diversos contenidos de estudio tratados en el aula.', oficial: true }]
      },
      {
        id: 'len-2-ora-2',
        contenido: 'Tomar la palabra para satisfacer diversas necesidades e intenciones: manifestar sentimientos, solicitar, reclamar, narrar, opinar, informar, describir, explicar, preguntar.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Actúa como hablante-oyente reflexivo y crítico en diversas situaciones comunicativas.', oficial: true }]
      },
      {
        id: 'len-2-ora-3',
        contenido: 'Utilizar ciertas expresiones de la lengua formal en diferentes contextos de comunicación.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Usa diversas fórmulas sociales para interactuar con otros: gracias, de nada, por favor, buenos días, etc.', oficial: true }]
      },
      {
        id: 'len-2-ora-4',
        contenido: 'Hacer escuchar la voz propia y considerar la de otros u otras en la toma de decisiones que atañen al grupo.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Aporta ideas para la toma de decisiones durante la revisión permanente de las normas de convivencia en el salón y en otros espacios de la escuela.', oficial: true }]
      },
      {
        id: 'len-2-ora-5',
        contenido: 'Participar en intercambios grupales para confrontar interpretaciones y puntos de vista acerca de textos leídos por la o el docente (cuentos, noticias, textos informativos sobre diversos temas).',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Expresar sus interpretaciones y puntos de vista en comentarios grupales sobre textos leídos por la o el docente.', oficial: true },
          { texto: 'Escucha con respeto los puntos de vista del otro/otra y defiende los propios con explicaciones y argumentos.', oficial: true }
        ]
      },
      {
        id: 'len-2-ora-6',
        contenido: 'Dialogar con diferentes propósitos: intercambiar experiencias, resolver diferencias, decidir las reglas de un juego.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Dialoga con distintas intenciones, en variadas situaciones, considerando los puntos de vista de otros u otras.', oficial: true }]
      },
      {
        id: 'len-2-ora-7',
        contenido: 'Participar en intercambios de grupo sobre respuestas a instrumentos de evaluación.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Participa en la comparación de respuestas a instrumentos de evaluación con el grupo de compañeras, compañeros y docente.', oficial: true }]
      },
      {
        id: 'len-2-ora-8',
        contenido: 'Participar en cine foros.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Participa en comentarios grupales acerca de los contenidos de películas y algunos recursos del lenguaje cinematográfico.', oficial: true }]
      },
      {
        id: 'len-2-ora-9',
        contenido: 'Narrar cuentos conocidos para distintas audiencias.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Narra cuentos conocidos siguiendo la secuencia de los hechos y utilizando descriptores para caracterizar personajes y escenarios.', oficial: true },
          { texto: 'Utiliza algunas fórmulas de inicio propias de los cuentos: había una vez… / hace mucho tiempo…', oficial: true }
        ]
      },
      {
        id: 'len-2-ora-10',
        contenido: 'Divertirse y entretener a otros con diversas expresiones lúdicas del lenguaje.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Conoce y comparte con otras personas un repertorio de expresiones lúdicas: chistes, trabalenguas, adivinanzas, cuentos de nunca acabar, retahílas.', oficial: true }]
      },
      {
        id: 'len-2-ora-11',
        contenido: 'Cantar y declamar para diversas audiencias.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Canta/declama un repertorio de canciones, poemas y coplas, previamente memorizadas, ajustando en lo posible los rasgos de la voz de acuerdo con distintas audiencias y contextos.', oficial: true }]
      },
      {
        id: 'len-2-ora-12',
        contenido: 'Conocer los sonidos que emiten algunos animales.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Conoce un repertorio más amplio de sonidos que emiten los animales. Por ejemplo, los siguientes: caballo, canario, loro, lobo.', oficial: true }]
      },
      {
        id: 'len-2-ora-13',
        contenido: 'Inventar historietas y cuentos a partir de imágenes.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Crea historietas y cuentos a partir de imágenes.', oficial: true }]
      },
      {
        id: 'len-2-ora-14',
        contenido: 'Compartir con otras personas acerca de textos y temas de interés.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Comenta con otras personas acerca de textos y temas de su interés.', oficial: true }]
      },
      {
        id: 'len-2-ora-15',
        contenido: 'Actuar como oyente en diferentes situaciones comunicativas.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Mantiene una actitud de respeto y comportamiento adecuado en situaciones comunicativas de intercambios orales.', oficial: true }]
      },
      {
        id: 'len-2-ora-16',
        contenido: 'Interpretar y usar algunos refranes, expresiones y dichos del repertorio popular venezolano.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Conoce el sentido y usa algunos dichos y refranes de fácil comprensión. Ejemplos: “el que tenga ojos que vea”, “cachicamo diciéndole a morrocoy conchú´o”, “en casa de herrero, cuchillo de palo”.', oficial: true }]
      },
      {
        id: 'len-2-ora-17',
        contenido: 'Presenciar con interés espectáculos y presentaciones.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Mantiene el comportamiento de espectador en espectáculos artísticos y presentaciones literarias: recitales, obras de teatro, lectura de poemas y cuentos.', oficial: true }]
      },
      {
        id: 'len-2-ora-18',
        contenido: 'Dramatizar cuentos atendiendo a los recursos de la expresión oral.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Actúa en dramatizaciones adecuando la expresión verbal y gestual al contenido del parlamento y a diferentes audiencias.', oficial: true }]
      },
      {
        id: 'len-2-ora-19',
        contenido: 'Reflexionar sobre los avances en el aprendizaje del lenguaje.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Participa en reflexiones grupales acerca de sus avances en el aprendizaje de la lengua.', oficial: true }]
      },
      {
        id: 'len-2-ora-20',
        contenido: 'Expresar ideas, sentimientos, opiniones, experiencias y hechos.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Expresarse de manera cada vez más clara y estructurada, utilizando un vocabulario progresivamente más amplio.', oficial: true }]
      },
      {
        id: 'len-2-ora-21',
        contenido: 'Participar en diálogos y discusiones.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Participa activamente en diálogos y discusiones, respetando turnos de palabra y mostrando interés por las opiniones de los demás.', oficial: true }]
      }
    ]
  },
  '3': {
    'Lectura': [
      {
        id: 'len-3-lec-1',
        contenido: 'Leer para apreciar la dimensión estética del lenguaje y experimentar las sensaciones que producen los textos literarios: cuentos, fábulas, leyendas, poemas.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Conoce un amplio repertorio de obras literarias, tanto escuchadas mediante la lectura de la o el docente como leídas por sí mismo.', oficial: true }]
      },
      {
        id: 'len-3-lec-2',
        contenido: 'Leer para hacer (interpretar textos instruccionales).',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Ejecuta secuencias de acciones interpretando textos instruccionales.', oficial: true }]
      },
      {
        id: 'len-3-lec-3',
        contenido: 'Leer para conocer sobre la vida y obra de personajes destacados en diferentes áreas (biografías).',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Conoce datos y hechos fundamentales de la biografía de varios personajes destacados: Simón Bolívar, Simón Rodríguez; los epónimos de su estado, municipio e institución escolar (si es el caso); nombres y motivo de la fama de personajes destacados de su localidad.', oficial: true }]
      },
      {
        id: 'len-3-lec-4',
        contenido: 'Seleccionar lo que desea leer aplicando criterios de preferencia.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Usa criterios de preferencia para elegir lo que desea leer.', oficial: true }]
      },
      {
        id: 'len-3-lec-5',
        contenido: 'Leer para informarse y aprender sobre diversas áreas del conocimiento (textos informativos: científicos, noticias).',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Acude a distintas fuentes para buscar información sobre diversos temas: petróleo, agua, salud, conservación del ambiente.', oficial: true },
          { texto: 'Se interesa por saber acerca del acontecer diario (lectura de noticias).', oficial: true }
        ]
      },
      {
        id: 'len-3-lec-6',
        contenido: 'Utilizar el índice de libros para ubicar el contenido que necesita o desea leer.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Explora índices de libros para ubicar temas que desea o necesita leer.', oficial: true }]
      },
      {
        id: 'len-3-lec-7',
        contenido: 'Participar en actividades lúdicas y significativas para conocer los nombres de todas las letras del alfabeto.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Menciona las letras del alfabeto por sus nombres y las usa en la escritura con su valor sonoro.', oficial: true }]
      },
      {
        id: 'len-3-lec-8',
        contenido: 'Utilizar la modalidad de lectura adecuada al propósito.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Lee aplicando la modalidad exploratoria del texto para localizar determinados datos.', oficial: true },
          { texto: 'Lee en forma acuciosa con la finalidad de aprender e informar a otros.', oficial: true },
          { texto: 'Lee para buscar información que requiere para redactar un texto.', oficial: true }
        ]
      },
      {
        id: 'len-3-lec-9',
        contenido: 'Ordenar palabras para formar textos, previa información del escrito que debe resultar.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Ordena palabras escritas sin orden predeterminado para formar oraciones. Por ejemplo: Simón Bolívar nació en Caracas; Caracas es la capital de Venezuela; Simón Rodríguez fue un gran maestro.', oficial: true }]
      },
      {
        id: 'len-3-lec-10',
        contenido: 'Diferenciar entre diversos tipos de textos: cuentos, poemas, coplas, adivinanzas, noticias, biografías, informativos.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Diferencia entre diversos tipos de textos: cuentos, poemas, coplas, adivinanzas, noticias, biografías, informativos, y expresa algunos rasgos que los distinguen.', oficial: true }]
      },
      {
        id: 'len-3-lec-11',
        contenido: 'Recomendar obras literarias.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Recomienda obras literarias informando títulos y autoreso autoras de un repertorio de cuentos y poemas que conoce.', oficial: true }]
      },
      {
        id: 'len-3-lec-12',
        contenido: 'Comprender la estructura de textos narrativos.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Conoce la estructura de la trama y demás rasgos de los textos narrativos: personajes, escenarios, diálogos.', oficial: true }]
      },
      {
        id: 'len-3-lec-13',
        contenido: 'Interpretar metáforas.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Comprende metáforas sencillas en textos literarios.', oficial: true }]
      },
      {
        id: 'len-3-lec-14',
        contenido: 'Interpretar la función de ciertos signos ortográficos.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Interpreta las funciones de los signos de interrogación y exclamación en la lectura de textos.', oficial: true }]
      },
      {
        id: 'len-3-lec-15',
        contenido: 'Resolver instrumentos de evaluación.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Resuelve problemas de lectura y escritura planteados en instrumentos de evaluación dirigidos a estimar los avances en el aprendizaje y los efectos de la enseñanza.', oficial: true }]
      },
      {
        id: 'len-3-lec-16',
        contenido: 'Diferenciar clases de palabras fundamentales.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Conoce las funciones de sustantivos y adjetivos.', oficial: true }]
      },
      {
        id: 'len-3-lec-17',
        contenido: 'Localizar datos en mapas y gráficos.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Ubica y lee en el mapa de la República Bolivariana de Venezuela los nombres de un amplio repertorio de estados, ríos, lagos principales y el Mar Caribe.', oficial: true },
          { texto: 'Interpreta informaciones contenidas en diferentes representaciones gráficas.', oficial: true },
          { texto: 'Explora el mapamundi en busca de algunos países específicos y otros datos geográficos.', oficial: true }
        ]
      },
      {
        id: 'len-3-lec-18',
        contenido: 'Conocer algunas particularidades de la lengua.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Analiza algunas “curiosidades” de nuestra lengua: Palíndromos, palabras que repiten una misma vocal en todas las sílabas, palabras pentavocálicas.', oficial: true }]
      },
      {
        id: 'len-3-lec-19',
        contenido: 'Interpretar palabras compuestas.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Comprende la composición de palabras en un repertorio de términos comunes (cumpleaños, guardabosques, paraguas, lavaplatos, telaraña, saltamontes).', oficial: true }]
      },
      {
        id: 'len-3-lec-20',
        contenido: 'Entender el significado de algunos elementos de la señalética.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Identifica algunas señales básicas: no pase, peligro, alta tensión, baño de damas / caballeros, algunas señales de tránsito.', oficial: true }]
      },
      {
        id: 'len-3-lec-21',
        contenido: 'Conocer personajes destacados de la historia venezolana.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Conoce nombres y datos fundamentals de tres o cuatro venezolanos(as) ilustres: Simón Bolívar, Simón Rodríguez, Francisco de Miranda. Si es el caso, epónimos de la escuela, el estado, municipio o parroquia donde reside.', oficial: true }]
      },
      {
        id: 'len-3-lec-22',
        contenido: 'Conocer derechos fundamentales establecidos en la Constitución de la República Bolivariana de Venezuela.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Conoce algunos derechos fundamentales establecidos en la Constitución de la República Bolivariana de Venezuela.', oficial: true }]
      },
      {
        id: 'len-3-lec-23',
        contenido: 'Conocer sobre la existencia de la lengua de señas venezolana.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Comprende el significado e imita algunos gestos básicos de la lengua de señas venezolana.', oficial: true }]
      },
      {
        id: 'len-3-lec-24',
        contenido: 'Conocer la función de ciertos documentos legales.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Conoce el sentido de la partida de nacimiento y la cédula de identidad.', oficial: true }]
      }
    ],
    'Escritura': [
      {
        id: 'len-3-esc-1',
        contenido: 'Producir cuentos a partir de títulos o imágenes.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Escribe cuentos a partir de títulos e imágenes.', oficial: true }]
      },
      {
        id: 'len-3-esc-2',
        contenido: 'Escribir sus nombres y apellidos, y los de otras personas de su entorno cercano.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Escribe convencionalmente su nombre y un repertorio de palabras familiares (nombres propios y otras de uso común).', oficial: true },
          { texto: 'Conoce y usa la mayúscula inicial en la escritura de nombres propios de personas y lugares.', oficial: true },
          { texto: 'Usa la tilde en la escritura de sus nombres y apellidos, y en un repertorio de palabras familiares.', oficial: true }
        ]
      },
      {
        id: 'len-3-esc-3',
        contenido: 'Participar en la escritura de normas de convivencia y deberes.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Participa en la revisión permanente y rescritura de las normas de convivencia en la escuela, los deberes con respecto a las demás personas, el cuido del ambiente y el respeto a la Patria.', oficial: true }]
      },
      {
        id: 'len-3-esc-4',
        contenido: 'Derivar palabras a partir de sustantivos.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Escribe (por derivación) pares y tríos de palabras de un mismo campo lexical: casa/ casas/ casita; niña/ niñas/ niñita; zapato/ zapatero/ zapatazo.', oficial: true }]
      },
      {
        id: 'len-3-esc-5',
        contenido: 'Entretenerse con la resolución de juegos con palabras.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Manifiesta interés por resolver juegos de escritura: crucifiguras, crucigramas, dameros, escaleras de palabras y otros.', oficial: true }]
      },
      {
        id: 'len-3-esc-6',
        contenido: 'Tomar conciencia de la duda ortográfica.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Tiene conciencia de nociones ortográficas básicas y resuelve sus dudas recurriendo a diversas fuentes (preguntar a otros, consultar materiales escritos a disposición).', oficial: true }]
      },
      {
        id: 'len-3-esc-7',
        contenido: 'Usar en la escritura la noción de concordancia sustantivo-adjetivo.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Escribe pares de palabras, y usa en la escritura de textos, la noción de concordancia sustantivo-adjetivo: niña talentosa/ camisa marrón /blusa pequeña/ niño alto.', oficial: true }]
      },
      {
        id: 'len-3-esc-8',
        contenido: 'Planificar la escritura de cuentos y otros textos.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Trabaja en equipo para planificar la escritura de textos que serán dictados a la o el docente, o escritos por sí mismo.', oficial: true },
          { texto: 'Dicta textos intentando ajustar la voz y el ritmo a los requerimientos del destinatario.', oficial: true }
        ]
      },
      {
        id: 'len-3-esc-9',
        contenido: 'Ordenar conjuntos de palabras para formar oraciones (previa información acerca de cuál es la oración que debe formarse).',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Construye textos ordenando entre tres y cinco palabras escritas sin orden lógico. Por ejemplo: Francisco de Miranda nació en Caracas / Venezuela es mi patria / Me gusta mucho leer cuentos / el araguaney es el árbol nacional / La vaca es un animal mamífero.', oficial: true }]
      },
      {
        id: 'len-3-esc-10',
        contenido: 'Escribir de manera relativamente legible de acuerdo con las convenciones básicas del sistema de escritura.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Escribe por sí mismo diferentes tipos de textos de extensiones variables (en una o varias sesiones), de acuerdo con su nivel de escritura: listas de nombres propios, de animales, lugares, etc., cuentos, carteles, entre otros.', oficial: true }]
      },
      {
        id: 'len-3-esc-11',
        contenido: 'Copiar con diversos propósitos reales.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Copia textos con diversos propósitos: para conservar lo que desea recordar, para compartir con otros, para llevar registros de informaciones de interés.', oficial: true }]
      },
      {
        id: 'len-3-esc-12',
        contenido: 'Tomar dictados con propósitos definidos.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Toma dictado de textos cortos con propósitos específicos; por ejemplo, para comparar y corregir el escrito con un compañero o compañera; para registrar información de interés.', oficial: true }]
      },
      {
        id: 'len-3-esc-13',
        contenido: 'Revisar y corregir textos destinados a la publicación.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Aplica estrategias de revisión y edición de textos que serán publicados, trabajando en equipo con otros y con el apoyo de la o el docente.', oficial: true }]
      },
      {
        id: 'len-3-esc-14',
        contenido: 'Cuidar la estética y legibilidad de la escritura con propósitos específicos.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'practica el trazo artístico de las letras con fines funcionales y de diseño. utiliza la caligrafía como forma de expresión artística que vincula la escritura con otras artes como el dibujo y la pintura.', oficial: true }]
      },
      {
        id: 'len-3-esc-15',
        contenido: 'Conocer y usar en la escritura la diferencia singular/ plural.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Distingue la oposición singular/ plural y la usa en la escritura, en los casos en que el plural se forma agregando S al singular y en casos conocidos en que se agrega un sufijo (lápiz/lápices; cartel/carteles; letra/ letras).', oficial: true }]
      },
      {
        id: 'len-3-esc-16',
        contenido: 'Conocer y usar en la escritura la diferencia de género femenino/ masculino.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Comprende y usa en la escritura la diferencia femenino /masculino: a) agregando A o cambiando O por A; b) usando palabras distintas (hombre/mujer, caballo/yegua, vaca/toro).', oficial: true }]
      },
      {
        id: 'len-3-esc-17',
        contenido: 'Crear nuevas versiones de cuentos conocidos.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Escribe nuevas versiones de cuentos conocidos.', oficial: true }]
      },
      {
        id: 'len-3-esc-18',
        contenido: 'Escribir reseñas de obras literarias.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Recomienda obras literarias mediante breves reseñas escritas.', oficial: true }]
      },
      {
        id: 'len-3-esc-19',
        contenido: 'Usar en la escritura ciertas restricciones del sistema de escritura alfabético.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Aplica a la escritura algunas restricciones del sistema de escritura alfabético: dígrafo GU en gue-gui; QU en que-qui.', oficial: true }]
      },
      {
        id: 'len-3-esc-20',
        contenido: 'Producir textos a partir de diferentes inicios.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Crea textos a partir de diferentes inicios: sueño con…; si yo fuera escritor/a…; cuando sea grande…; si yo fuera un caballo…; Simón Bolívar fue…', oficial: true }]
      },
      {
        id: 'len-3-esc-21',
        contenido: 'Utilizar en la escritura recursos ortográficos fundamentales.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Escribe utilizando algunos recursos ortográficos básicos: mayúsculas en nombres propios y de lugares, al inicio de un texto; el punto al final de un texto.', oficial: true }]
      },
      {
        id: 'len-3-esc-22',
        contenido: 'Conocer nociones ortográficas del sistema de escritura.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Al principio y al final de palabras siempre va una sola R (rama, reto, risa, ruta, rosa / cantar, trepar, nacer, radar, hangar).', oficial: true },
          { texto: 'Identifica cambios de significado según el uso de r/rr al interior de palabras: carro/ caro; perra/pera; cerro/cero.', oficial: true }
        ]
      },
      {
        id: 'len-3-esc-23',
        contenido: 'Escribir convencionalmente palabras con sílabas complejas.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Comienza a escribir convencionalmente las palabras que contienen sílabas del grupo consonante-consonante-vocal (ccv), tales como: clase, copla, tropa, fruta, flor, cobre, grama, drama, grillo.', oficial: true }]
      },
      {
        id: 'len-3-esc-24',
        contenido: 'Escribir ideas relevantes sobre temas leídos.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Registra por escrito contenidos fundamentales sobre diversos temas, a partir de la lectura de textos.', oficial: true }]
      },
      {
        id: 'len-3-esc-25',
        contenido: 'Escribir convencionalmente palabras que contienen sílabas indirectas (vc) y del grupo silábico cvc.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Escribe, en forma convencional, palabras con sílabas indirectas (vc), por ejemplo: antonio, asterisco, olmo, elsa, intriga, alto, usted.', oficial: true },
          { texto: 'Escribe palabras que contienen el grupo silábico cvc: mango, pasta, colmo, carta, manzana, salto, percha, santo, pasto.', oficial: true }
        ]
      }
    ],
    'Oralidad': [
      {
        id: 'len-3-ora-1',
        contenido: 'Participar en cine foros.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Actúa como espectador de películas y, posteriormente, en comentarios grupales acerca de los contenidos.', oficial: true }]
      },
      {
        id: 'len-3-ora-2',
        contenido: 'Expresarse con diversas intenciones: manifestar sentimientos, solicitar, reclamar, narrar, opinar, describir, explicar, argumentar.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Actúa como hablante-oyente reflexivo y crítico en diversas situaciones comunicativas.', oficial: true }]
      },
      {
        id: 'len-3-ora-3',
        contenido: 'Utilizar ciertas expresiones de la lengua formal en diferentes contextos de comunicación.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Usa diversas fórmulas sociales para interactuar con otros en situaciones de la vida cotidiana, tales como: gracias, de nada, por favor, con permiso, buenos días, etc.', oficial: true }]
      },
      {
        id: 'len-3-ora-4',
        contenido: 'Hacer escuchar la voz propia y considerar la de otros en la toma de decisiones colectivas.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Aporta ideas para la toma de decisiones durante la construcción y revisión permanente de las normas de convivencia en el salón y en otros espacios de la institución escolar.', oficial: true }]
      },
      {
        id: 'len-3-ora-5',
        contenido: 'Actuar en intercambios grupales para confrontar interpretaciones y puntos de vista acerca de textos leídos por la o el docente (cuentos, biografías, noticias, historietas, textos informativos sobre diversos temas).',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Manifiesta sus interpretaciones y puntos de vista sobre textos leídos por la o el docente.', oficial: true },
          { texto: 'Escucha con respeto los puntos de vista del otro u otra y defiende los propios con explicaciones y argumentos.', oficial: true }
        ]
      },
      {
        id: 'len-3-ora-6',
        contenido: 'Dialogar con diferentes intenciones y propósitos.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'participa en diálogos en variados contextos comunicativos, considerando los puntos de vista de otros u otras: para resolver diferencias, acordar reglas de un juego, manifestar y resolver desacuerdos.', oficial: true }]
      },
      {
        id: 'len-3-ora-7',
        contenido: 'Formular preguntas y emitir respuestas acerca de diversos temas.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Pregunta y responde sobre contenidos de estudio tratados en el aula.', oficial: true },
          { texto: 'Pregunta para solicitar la información requerida en diversas situaciones.', oficial: true }
        ]
      },
      {
        id: 'len-3-ora-8',
        contenido: 'Participar en intercambios de grupo sobre respuestas a instrumentos de evaluación.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Participa en la comparación de respuestas a instrumentos de evaluación mediante intercambios con el grupo de compañeras, compañeros y docente.', oficial: true }]
      },
      {
        id: 'len-3-ora-9',
        contenido: 'Utilizar en la expresión un repertorio léxico cada vez más amplio.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Utiliza un repertorio de nuevas palabras que trascienden el léxico utilizado cotidianamente para interactuar en diversidad de situaciones comunicativas y satisfacer distintas necesidades.', oficial: true }]
      },
      {
        id: 'len-3-ora-10',
        contenido: 'Narrar cuentos conocidos para distintas audiencias.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Narra cuentos conocidos siguiendo la secuencia de los hechos y utilizando descriptores para caracterizar personajes y otros recursos de la narración.', oficial: true },
          { texto: 'Utiliza algunas fórmulas de inicio propias de la narración, al relatar sus propios cuentos: había una vez… / en un lugar llamado… / hace mucho tiempo…', oficial: true }
        ]
      },
      {
        id: 'len-3-ora-11',
        contenido: 'Exponer informaciones sobre distintas áreas del conocimiento.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Comunica al grupo del salón información sobre temas de interés.', oficial: true }]
      },
      {
        id: 'len-3-ora-12',
        contenido: 'Divertirse y entretener a otros con diversas expresiones lúdicas del lenguaje.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Conoce y comparte con otras personas un repertorio de expresiones lúdicas de la lengua: chistes, trabalenguas, adivinanzas, cuentos de nunca acabar, retahílas.', oficial: true }]
      },
      {
        id: 'len-3-ora-13',
        contenido: 'Participar en intercambios sobre la utilidad de la tecnología.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Participa en discusiones sobre la utilidad de la tecnología.', oficial: true }]
      },
      {
        id: 'len-3-ora-14',
        contenido: 'Cantar y declamar para diversas audiencias.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Canta/declama un repertorio de canciones, poemas y coplas, previamente memorizadas, ajustando en lo posible los rasgos de la voz para distintos escenarios.', oficial: true }]
      },
      {
        id: 'len-3-ora-15',
        contenido: 'Denominar sonidos que emiten animales conocidos.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Conoce palabras para denominar sonidos de animales comunes. además de los vistos en grados anteriores, incluye, por ejemplo: abeja, oveja, elefante, búho.', oficial: true }]
      },
      {
        id: 'len-3-ora-16',
        contenido: 'Inventar historietas y cuentos a partir de imágenes.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Expresa verbalmente historietas y cuentos creados a partir de imágenes.', oficial: true }]
      },
      {
        id: 'len-3-ora-17',
        contenido: 'Comentar acerca de textos y temas de interés.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Comenta con otras personas acerca de textos y temas de su interés.', oficial: true }]
      },
      {
        id: 'len-3-ora-18',
        contenido: 'Utilizar un repertorio de adjetivos para describir objetos y situaciones del entorno.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Utiliza un repertorio amplio de adjetivos para describir objetos y situaciones del entorno.', oficial: true }]
      },
      {
        id: 'len-3-ora-19',
        contenido: 'Comentar con docentes y compañeros noticias de actualidad (locales, nacionales e internacionales).',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Participa en comentarios de grupo sobre noticias de especial interés.', oficial: true }]
      },
      {
        id: 'len-3-ora-20',
        contenido: 'Interpretar y usar refranes, expresiones y dichos del repertorio popular venezolano.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Conoce el sentido y usa un repertorio de expresiones, dichos y refranes. Ejemplos: “el papá de los helados”, “hijo de gato, caza ratón”, “no dejes para mañana lo que puedes hacer hoy”, “el que madruga, recoge agua clara”, “en el camino se enderezan las cargas”.', oficial: true }]
      },
      {
        id: 'len-3-ora-21',
        contenido: 'Actuar como espectador en diversidad de espectáculos artísticos.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Actúa como espectador responsable en presentaciones artísticas, festivales, tradiciones y costumbres.', oficial: true },
          { texto: 'Mantiene el interés frente a espectáculos y emite opiniones sobre el contenido de las obras.', oficial: true }
        ]
      }
    ]
  },
  '4': {
    'Lectura': [
      {
        id: 'len-4-lec-1',
        contenido: 'Leer con relativa autonomía diferentes tipos de textos: literarios (leyendas, mitos, cuentos, poemas), cartas, biografías, noticias, artículos de opinión, instrucciones, ensayos.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Interpreta contenidos de textos de diversos géneros y diferencia sus rasgos fundamentales.', oficial: true }]
      },
      {
        id: 'len-4-lec-2',
        contenido: 'Leer diversidad de textos con diferentes propósitos.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Lee con el fin de buscar informaciones específicas en un texto y para aprender sobre diferentes temas.', oficial: true },
          { texto: 'Lee para entretenerse y para incursionar en el mundo de la ficción.', oficial: true },
          { texto: 'Interpreta instrucciones escritas y ejecuta acciones en consecuencia.', oficial: true }
        ]
      },
      {
        id: 'len-4-lec-3',
        contenido: 'Inferir contenidos no explícitos en los textos',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Construye inferencias de contenidos implícitos en el texto y sobre las intenciones del autor o autora.', oficial: true }]
      },
      {
        id: 'len-4-lec-4',
        contenido: 'Ajustar las estrategias al propósito que orienta la lectura.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Lee utilizando la modalidad que corresponde al propósito: lectura en voz alta para una audiencia determinada; lectura silenciosa para estudiar, informarse, recrearse.', oficial: true },
          { texto: 'Utiliza estrategias de lectura adecuadas al propósito: lectura exploratoria para ubicar datos específicos; lectura rigurosa para profundizar en ciertos temas y para seguir instrucciones.', oficial: true }
        ]
      },
      {
        id: 'len-4-lec-5',
        contenido: 'Incursionar en la cultura venezolana a través del lenguaje.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Interpreta el sentido de diversos textos literarios y juegos del lenguaje (canciones, coplas, poemas, estribillos, retahílas, adivinanzas, dichos, refranes, expresiones populares del habla venezolana).', oficial: true }]
      },
      {
        id: 'len-4-lec-6',
        contenido: 'Interpretar metáforas.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Comprende metáforas sencillas en textos literarios.', oficial: true }]
      },
      {
        id: 'len-4-lec-7',
        contenido: 'Resolver instrumentos de evaluación.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Está familiarizado con la resolución de pruebas de evaluación dirigidas a estimar los avances en el aprendizaje y los efectos de la enseñanza.', oficial: true }]
      },
      {
        id: 'len-4-lec-8',
        contenido: 'Confirmar la veracidad de una información consultando diversas fuentes.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Consulta diversas fuentes para verificar la confiabilidad de noticias y otras informaciones.', oficial: true }]
      },
      {
        id: 'len-4-lec-9',
        contenido: 'Usar la tecnología con ética y responsabilidad.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Es consciente de la necesidad de usar la tecnología con ética y responsabilidad.', oficial: true }]
      },
      {
        id: 'len-4-lec-10',
        contenido: 'Incursionar en internet con distintos propósitos.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Utiliza criterios de búsqueda para navegar en Internet con el fin de satisfacer necesidades de distinta índole: estudiar, investigar sobre determinados temas, entretenerse leyendo literatura.', oficial: true },
          { texto: 'Lee para profundizar los conocimientos sobre determinados temas de las ciencias: petróleo, agua, plantas, conservación del ambiente, alimentación y salud.', oficial: true }
        ]
      },
      {
        id: 'len-4-lec-11',
        contenido: 'Seguir a un autor o autora de obras literarias.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Manifiesta preferencias por determinados géneros literarios y lee varias obras de un mismo autor o a.', oficial: true }]
      },
      {
        id: 'len-4-lec-12',
        contenido: 'Usar el índice de libros y otros portadores de textos.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Localiza contenidos mediante el uso del índice en diversos portadores de textos.', oficial: true }]
      },
      {
        id: 'len-4-lec-13',
        contenido: 'Memorizar el orden de las letras en el alfabeto.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Utiliza el conocimiento del orden alfabético para ubicar y organizar datos según ese criterio.', oficial: true }]
      },
      {
        id: 'len-4-lec-14',
        contenido: 'Conocer datos biográficos de personajes destacados de nuestra historia.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Posee conocimientos sobre el epónimo de su escuela y datos biográficos de al menos cinco personajes destacados de nuestra historia y algunos de su comunidad.', oficial: true }]
      },
      {
        id: 'len-4-lec-15',
        contenido: 'Analizar componentes de textos narrativos, recursos y figuras literarias.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Identifica e interpreta algunos elementos de los textos literarios: estructura, personajes, descripciones, diálogos, metáforas, onomatopeyas.', oficial: true }]
      },
      {
        id: 'len-4-lec-16',
        contenido: 'Diferenciar una variedad de clases de palabras.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Distingue y conoce las funciones de varias clases de palabras: sustantivos, adjetivos, verbos, pronombres, artículos y preposiciones.', oficial: true },
          { texto: 'Conoce y analiza un repertorio de palabras compuestas: anteojos, cortapapeles, bienhechuría, hojalata, trabalenguas.', oficial: true }
        ]
      },
      {
        id: 'len-4-lec-17',
        contenido: 'Conocer la forma de conjugación de una serie de verbos.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Conjuga un repertorio de verbos de uso común, por ejemplo: ser, haber, hacer, sentir, ir.', oficial: true }]
      },
      {
        id: 'len-4-lec-18',
        contenido: 'Incursionar en el análisis de algunas particularidades de la lengua.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Muestra interés por descubrir y analizar ciertas particularidades del español: Palíndromos, Bifrontes y Palabras pentavocálicas.', oficial: true }]
      },
      {
        id: 'len-4-lec-19',
        contenido: 'Analizar la estructura de oraciones simples.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Reconoce los elementos esenciales en oraciones sencillas (sujeto, sujeto tácito, predicado y verbo).', oficial: true }]
      },
      {
        id: 'len-4-lec-20',
        contenido: 'Poseer nociones de sinonimia, antonimia, derivación de palabras, campos lexicales.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Incrementa su capacidad de comprensión y expresión –oral y escrita– mediante el enriquecimiento del léxico y el conocimiento de las relaciones entre palabras.', oficial: true }]
      },
      {
        id: 'len-4-lec-21',
        contenido: 'Utilizar el diccionario y otras referencias como fuentes de consulta.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Usa diversas fuentes para resolver dudas ortográficas y consultar significados de palabras.', oficial: true }]
      },
      {
        id: 'len-4-lec-22',
        contenido: 'Resolver dificultades de comprensión mediante estrategias efectivas.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Gestiona dificultades de comprensión usando diversas estrategias: releer, acudir a fuentes de consulta, preguntar.', oficial: true }]
      },
      {
        id: 'len-4-lec-23',
        contenido: 'Localizar datos en mapas y gráficos.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Ubica y lee en el mapa de Venezuela los estados y sus capitales, ríos y lagos principales, el Mar Caribe, Los Andes, el Waraira Repano.', oficial: true },
          { texto: 'Localiza en el mapamundi las tres partes del continente americano.', oficial: true },
          { texto: 'Ubica varios países y la posición relativa de Venezuela con respecto a países limítrofes.', oficial: true },
          { texto: 'Interpreta informaciones contenidas en diferentes representaciones gráficas.', oficial: true },
          { texto: 'Identifica un repertorio de elementos de la señalética: señales de orientación, precaución y tránsito.', oficial: true }
        ]
      },
      {
        id: 'len-4-lec-24',
        contenido: 'Reconocer la lectura como medio para el desarrollo personal y el desempeño académico.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Tiene conciencia acerca de la importancia de la lectura como vía para el crecimiento personal e intelectual.', oficial: true }]
      },
      {
        id: 'len-4-lec-25',
        contenido: 'Conocer sobre la existencia de la lengua de señas venezolana.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Comprende el significado y expresa un repertorio básico de gestos de la lengua de señas venezolana.', oficial: true }]
      },
      {
        id: 'len-4-lec-26',
        contenido: 'Conocer acerca de la cosmovisión de nuestros pueblos originarios mediante los mitos.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Interpreta el significado de una selección de mitos indígenas.', oficial: true }]
      },
      {
        id: 'len-4-lec-27',
        // Corrección editorial autorizada: Grado 4°, Pág. 48. El PDF tenía invertido/errado el encabezado ("Interpreta el significado de una selección de mitos indígenas" -> "lee textos largos en varias sesiones, usando el marca páginas").
        contenido: 'Lectura de textos extensos y uso del marcapáginas.',
        oficial: true,
        notaEditorial: 'Grado 4°, Pág. 48: El PDF oficial tenía una errata de imprenta colocando un texto de mitos en la celda del marcapáginas. Se normalizó la formulación del contenido.',
        aprendizajesEsperados: [{ texto: 'Lee textos largos en varias sesiones, usando el marcapáginas.', oficial: true }]
      },
      {
        id: 'len-4-lec-28',
        contenido: 'Conocer la función de ciertos documentos legales.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Conoce el sentido de la partida de nacimiento y la cédula de identidad.', oficial: true }]
      },
      {
        id: 'len-4-lec-29',
        contenido: 'Conocer derechos fundamentales establecidos en la Constitución de la República Bolivariana de Venezuela.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Conoce algunos derechos fundamentales establecidos en la Constitución de la República Bolivariana de Venezuela.', oficial: true }]
      }
    ],
    'Escritura': [
      {
        id: 'len-4-esc-1',
        contenido: 'Escribir diversos tipos de textos para satisfacer diferentes intereses y necesidades.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Redacta textos de los géneros más usados, de acuerdo con la estructura propia de cada uno (cuentos, ensayos sencillos, biografías y autobiografías).', oficial: true }]
      },
      {
        id: 'len-4-esc-2',
        contenido: 'Participar en la escritura de normas de convivencia y deberes.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Participa en la revisión permanente y rescritura de las normas de convivencia en la escuela, los deberes con respecto a las demás personas, el cuido del ambiente y el respeto a la Patria.', oficial: true }]
      },
      {
        id: 'len-4-esc-3',
        contenido: 'Escribir de acuerdo con las convencionalidades ortográficas fundamentales.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Redacta textos de uso frecuente empleando los recursos ortográficos básicos del sistema de escritura: separación entre palabras, mayúsculas en nombres de personas y mascotas, personajes de cuentos, lugares; tilde en palabras comunes, signos de puntuación y expresión, comillas, raya de diálogo.', oficial: true }]
      },
      {
        id: 'len-4-esc-4',
        contenido: 'Reflexionar sobre nociones lingüísticas.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Reconoce la utilidad de aprender sobre gramática y ortografía.', oficial: true }]
      },
      {
        id: 'len-4-esc-5',
        contenido: 'Transformar y resumir textos.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Es capaz de modificar textos para construir uno propio, conservando el sentido del contenido.', oficial: true },
          { texto: 'Sintetiza un texto aplicando las operaciones básicas del resumen: identificación de ideas esenciales, supresión de contenidos no esenciales, uso de sinónimos y paráfrasis.', oficial: true }
        ]
      },
      {
        id: 'len-4-esc-6',
        contenido: 'Escribir textos destinados a la publicación siguiendo los pasos de la producción escrita.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Produce textos para ser publicados de acuerdo con los pasos de la escritura con ese propósito: planificación del texto, textualización, revisión y edición.', oficial: true }]
      },
      {
        id: 'len-4-esc-7',
        contenido: 'Desarrollar la capacidad para la escritura mediante el conocimiento de la gramática.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Emplea en la escritura los conocimientos acerca del léxico y sus propiedades: sinonimia, derivación, campos léxicos, ortografía de palabras.', oficial: true },
          { texto: 'Redacta textos en forma coherente empleando las nociones de cohesión para expresar relaciones entre ideas: conectores, signos de puntuación, organización de ideas en párrafos.', oficial: true }
        ]
      },
      {
        id: 'len-4-esc-8',
        contenido: 'Aplicar a la escritura los rasgos ortográficos distintivos de palabras homófonas.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Expresa en la escritura distinciones ortográficas comunes relacionadas con la homofonía de palabras. Por ejemplo: ahí / ¡ay! / hay; a/ ha/ ah; e/ he; has/ haz/ as; seno/ ceno; hecho/ echo; rayar/ rallar; coser/cocer; botar/ votar; tubo/ tuvo; haya/ halla, aya.', oficial: true }]
      },
      {
        id: 'len-4-esc-9',
        contenido: 'Utilizar la estética en la escritura con fines de diseño.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Produce textos para publicar utilizando recursos básicos del diseño: organización gráfica del texto, legibilidad, tipos de letras, ilustraciones y otros elementos gráficos.', oficial: true },
          { texto: 'Utiliza la caligrafía como forma de expresión artística que vincula la escritura con otras artes como el dibujo y la pintura.', oficial: true }
        ]
      },
      {
        id: 'len-4-esc-10',
        contenido: 'Tomar conciencia de la duda ortográfica.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Es consciente de la duda ortográfica y acude a diversas fuentes de consulta para resolver problemas ortográficos y de otra naturaleza.', oficial: true }]
      },
      {
        id: 'len-4-esc-11',
        contenido: 'Escribir convencionalmente grupos silábicos complejos y palabras que contienen consonantes finales.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Escribe en forma convencional palabras que contienen sílabas complejas (transporte, constitución, abstracto, obstrucción) y consonantes al final de palabras (bondad, maldad, capacidad, césped, vid, álbum, tablet, club, zinc).', oficial: true }]
      },
      {
        id: 'len-4-esc-12',
        contenido: 'Usar la tilde en la escritura de palabras familiares.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Usa la tilde en un repertorio relativamente amplio de palabras de uso frecuente.', oficial: true },
          { texto: 'Comienza a entender la clasificación de las palabras según su acentuación: agudas, graves y esdrújulas.', oficial: true }
        ]
      },
      {
        id: 'len-4-esc-13',
        contenido: 'Reflexionar sobre los aspectos ortográficos y gramaticales de la escritura.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Toma conciencia del significado e importancia de ciertos aspectos lingüísticos: conectores entre palabras, signos de puntuación, acentuación de palabras.', oficial: true }]
      },
      {
        id: 'len-4-esc-14',
        contenido: 'Conocer y utilizar el orden de las letras del abecedario.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Escribe listas de nombres en orden alfabético y ubica rápidamente palabras en listas ordenadas alfabéticamente.', oficial: true }]
      },
      {
        id: 'len-4-esc-15',
        contenido: 'Ampliar el acervo de palabras con ortografía convencional.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Entiende y usa en la escritura las diferencias gráficas de sonidos iguales: diferenciaciones b/v; c/s/z; y/ll; i/y; cambio Z por C en el plural de palabras, tales como: perdiz/ perdices; capaz/capaces; veloz/ veloces; matiz/ matices…', oficial: true },
          { texto: 'Aplica a la escritura normas básicas de uso de la H; palabras con H intercalada, por ejemplo: enhebrar, zanahoria, alcohol, vehículo, bienhechurías, ahumado, ahuecar, ahínco, ahijado, prohibir, búho.', oficial: true }
        ]
      },
      {
        id: 'len-4-esc-16',
        contenido: 'Comprender el sentido y uso de nociones lingüísticas fundamentales.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Posee conocimientos sobre nociones gramaticales básicas, y las usa en la escritura: masculino/ femenino; singular/ plural; sustantivos propios/ sustantivos comunes/ sustantivos colectivos; parentescos lexicales (familias de palabras) y su relación con la ortografía literal (vender-venta-vendedor).', oficial: true }]
      },
      {
        id: 'len-4-esc-17',
        contenido: 'Escribir reseñas para recomendar obras literarias.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Recomienda obras literarias mediante reseñas escritas.', oficial: true }]
      },
      {
        id: 'len-4-esc-18',
        contenido: 'Copiar y tomar dictado con propósitos que justifican estas prácticas.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Copia (conservando la forma y contenido del texto fuente) y toma dictados, para diversos propósitos reales.', oficial: true }]
      }
    ],
    'Oralidad': [
      {
        id: 'len-4-ora-1',
        contenido: 'Hablar y escuchar con diversos propósitos.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Actúa en intercambios verbales con distintos propósitos, en variedad de situaciones comunicativas, expresando sus opiniones y argumentos en forma coherente, con un vocabulario cada vez más amplio.', oficial: true },
          { texto: 'Escucha activamente a sus compañeros y al docente, formulando preguntas y comentarios que enriquecen la discusión.', oficial: true },
          { texto: 'Atiende a las intervenciones de sus interlocutores, y expresa sus desacuerdos con respeto.', oficial: true }
        ]
      },
      {
        id: 'len-4-ora-2',
        contenido: 'Leer en voz alta para diferentes audiencias.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Narra cuentos para diversas audiencias, apegándose a la secuencia de los hechos, conservando detalles y utilizando marcadores lingüísticos que expresan relaciones de espacio y tiempo.', oficial: true },
          { texto: 'Lee poemas en voz alta ajustando los rasgos de la voz a la situación comunicativa.', oficial: true }
        ]
      },
      {
        id: 'len-4-ora-3',
        contenido: 'Reflexionar sobre los avances en el aprendizaje del lenguaje.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Participa en comentarios de grupo acerca de los avances y expectativas con respecto al aprendizaje de la lengua.', oficial: true }]
      },
      {
        id: 'len-4-ora-4',
        contenido: 'Discutir el contenido y el significado de un texto.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Intercambia ideas con el resto del grupo acerca del contenido de textos leídos.', oficial: true }]
      },
      {
        id: 'len-4-ora-5',
        contenido: 'Participar en exposiciones con apoyo de recursos visuales o tecnológicos.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Se expresa con claridad y organización de las ideas en presentaciones a sus compañeros de clases.', oficial: true }]
      },
      {
        id: 'len-4-ora-6',
        contenido: 'Cantar un repertorio de himnos y canciones emblemáticas de Venezuela.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Canta el Himno Nacional de la República Bolivariana de Venezuela y el de su estado; entiende las metáforas y significados históricos fundamentales implícitos en el texto de esos himnos.', oficial: true },
          { texto: 'Canta una selección de canciones del repertorio cultural venezolano y latinoamericano.', oficial: true }
        ]
      },
      {
        id: 'len-4-ora-7',
        contenido: 'Ampliar el vocabulario relacionado con temas relativamente complejos de la ciencia, la sociedad y la cultura.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Utiliza en su expresión oral el registro propio de las ciencias al exponer sobre diversos temas científicos y sociales.', oficial: true }]
      },
      {
        id: 'len-4-ora-8',
        contenido: 'Participar en intercambios sobre la utilidad de la tecnología.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Participa en discusiones de análisis sobre la utilidad de la tecnología.', oficial: true }]
      },
      {
        id: 'len-4-ora-9',
        contenido: 'Participar en intercambios de grupo sobre respuestas a instrumentos de evaluación.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Participa en la comparación de respuestas a instrumentos de evaluación mediante intercambios con el docente y el grupo de compañeros.', oficial: true }]
      },
      {
        id: 'len-4-ora-10',
        contenido: 'Conocer palabras que nombran sonidos de animales conocidos.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Conoce palabras para denominar sonidos de animales. Además de los conocidos en grados anteriores, puede agregar, por ejemplo: ballena, cigarra, delfín.', oficial: true }]
      },
      {
        id: 'len-4-ora-11',
        contenido: 'Interpretar instrucciones de cierta complejidad.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Ejecuta acciones a partir de instrucciones y consignas relativamente complejas.', oficial: true }]
      },
      {
        id: 'len-4-ora-12',
        contenido: 'Participar en actividades culturales en contextos reales o simulados.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Actúa como espectador responsable en presentaciones artísticas, festivales, tradiciones y costumbres.', oficial: true }]
      },
      {
        id: 'len-4-ora-13',
        contenido: 'Divertirse mediante la memorización y expresión de una variedad de manifestaciones de la lengua.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Disfruta compartiendo expresiones lúdicas del lenguaje: adivinanzas, chistes, retahílas, dichos y refranes.', oficial: true }]
      },
      {
        id: 'len-4-ora-14',
        contenido: 'Interpretar y usar refranes, expresiones y dichos del repertorio popular venezolano.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Conoce el sentido y usa un amplio repertorio de expresiones, dichos y refranes. Ejemplos: “tarde piaste, pajarito”, “dime con quién andas y te diré quién eres”, “por la maleta se saca el pasajero”, “no te vistas, que no vas”, “más vale llegar a tiempo que ser convidado”, “a ponerse alpargatas, que lo que viene es joropo”.', oficial: true }]
      },
      {
        id: 'len-4-ora-15',
        contenido: 'Dramatizar escenas de obras leídas.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Actúa en la dramatización de obras expresando parlamentos con fluidez y apegado al texto original.', oficial: true }]
      },
      {
        id: 'len-4-ora-16',
        contenido: 'Dialogar con diversos propósitos.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Dialoga con adecuación al contexto en variadas situaciones comunicativas: para resolver conflictos, construir acuerdos, planificar proyectos en grupo.', oficial: true }]
      },
      {
        id: 'len-4-ora-17',
        contenido: 'Comentar noticias y otras informaciones de interés.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Comenta con docentes y compañeros noticias de actualidad, locales, nacionales e internacionales.', oficial: true }]
      },
      {
        id: 'len-4-ora-18',
        contenido: 'Adecuar la pronunciación de palabras a las normas de la escritura.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Pronuncia palabras de cierta complejidad de acuerdo con la norma escrita.', oficial: true }]
      }
    ]
  },
  '5': {
    'Lectura': [
      {
        id: 'len-5-lec-1',
        contenido: 'Reconocer la lectura como medio para el desarrollo personal y el desempeño académico.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Reconoce la importancia de la lectura como fuente de conocimientos y como vía para el crecimiento personal e intelectual.', oficial: true }]
      },
      {
        id: 'len-5-lec-2',
        contenido: 'Enriquecer y profundizar conocimientos sobre diversos temas mediante la lectura.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Lee para estudiar y profundizar sus conocimientos sobre diversidad de temas de las ciencias naturales y sociales, utilizando las estrategias propias de la lectura con ese propósito.', oficial: true },
          { texto: 'Posee conocimientos sobre temas fundamentales de nuestra identidad, soberanía y salud: petróleo, agua, conservación del ambiente; alimentación, actividad física y salud.', oficial: true }
        ]
      },
      {
        id: 'len-5-lec-3',
        contenido: 'Leer para experimentar las sensaciones que produce la literatura (posición estética del lector).',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Se interesa por la literatura y, según sus preferencias, acude espontáneamente a la lectura de diversos géneros literarios: poesía y narración (cuentos, mitos, leyendas, fábulas, crónicas).', oficial: true }]
      },
      {
        id: 'len-5-lec-4',
        contenido: 'Leer para entretenerse incursionando en el género humorístico.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Se entretiene con la lectura de textos humorísticos: cuentos de humor, chistes, historietas.', oficial: true }]
      },
      {
        id: 'len-5-lec-5',
        contenido: 'Identificar los rasgos distintivos de textos de diversos géneros.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Identifica las diferencias entre diversos tipos de textos: narración, poesía, instruccionales, ensayos, noticias, epistolares.', oficial: true }]
      },
      {
        id: 'len-5-lec-6',
        contenido: 'Leer para afianzar la ciudadanía.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Conoce algunos derechos fundamentales establecidos en la Constitución de la República Bolivariana de Venezuela.', oficial: true },
          { texto: 'Conoce algunos derechos y deberes fundamentales de las niñas y los niños.', oficial: true },
          { texto: 'Conoce el sentido de ciertos documentos legales: partida de nacimiento, cédula de identidad, fe de vida.', oficial: true }
        ]
      },
      {
        id: 'len-5-lec-7',
        contenido: 'Resolver instrumentos de evaluación.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Está familiarizado con la resolución de pruebas de evaluación dirigidas a estimar los avances en el aprendizaje y los efectos de la enseñanza.', oficial: true }]
      },
      {
        id: 'len-5-lec-8',
        contenido: 'Identificar recursos de la señalética.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Identifica un amplio repertorio de elementos de la señalética: señales de orientación, precaución y tránsito.', oficial: true }]
      },
      {
        id: 'len-5-lec-9',
        contenido: 'Leer para reafirmar la identidad nacional y latinoamericana.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Ubica en el mapa de la República Bolivariana de Venezuela: los estados y sus capitales, los límites del estado, el municipio y la parroquia donde reside; los principales ríos, lagos y montañas.', oficial: true },
          { texto: 'Ubica a Venezuela y países limítrofes en el mapa de américa.', oficial: true },
          { texto: 'Distingue las tres regiones de América en el mapa: norteamérica, centroamérica y sudamérica.', oficial: true },
          { texto: 'Ubica países en el mapa del continente americano, y otros continentes en el mapamundi.', oficial: true },
          { texto: 'Reconoce y ubica océanos y mares que bordean el continente americano.', oficial: true }
        ]
      },
      {
        id: 'len-5-lec-10',
        contenido: 'Construir inferencias en textos de relativa complejidad.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Infiere contenidos implícitos en el texto y las intenciones del autor o autora.', oficial: true }]
      },
      {
        id: 'len-5-lec-11',
        contenido: 'Interpretar metáforas.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Comprende metáforas de cierta complejidad en textos literarios.', oficial: true }]
      },
      {
        id: 'len-5-lec-12',
        contenido: 'Ajustar las estrategias de lectura al propósito que la orienta.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Lee según la modalidad que corresponde al propósito: lectura en voz alta para una audiencia determinada; lectura silenciosa para estudiar, informarse, recrearse.', oficial: true },
          { texto: 'Utiliza estrategias de lectura adecuadas al propósito: lectura exploratoria para localizar datos específicos; lectura rigurosa para profundizar en ciertos temas y para seguir instrucciones.', oficial: true }
        ]
      },
      {
        id: 'len-5-lec-13',
        contenido: 'Comparar noticias en diversas fuentes.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Confirma la veracidad de las noticias consultando diversas fuentes.', oficial: true }]
      },
      {
        id: 'len-5-lec-14',
        contenido: 'Incursionar en la cultura venezolana a través del lenguaje.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Interpreta el sentido de diversos textos literarios y juegos del lenguaje (canciones, coplas, poemas, estribillos, retahílas, adivinanzas, dichos, refranes, expresiones populares del habla venezolana)', oficial: true },
          { texto: 'Conoce el sentido y usa un amplio repertorio de expresiones, dichos y refranes. Ejemplos: “No todo lo que brilla es oro”, “El que vive de ilusiones, muere de desengaños”, “Más difícil que encontrar una aguja en un pajar”, “Barriga llena, corazón contento”, “Camarón que se duerme, se lo lleva la corriente”.', oficial: true }
        ]
      },
      {
        id: 'len-5-lec-15',
        contenido: 'Incursionar en Internet con distintos propósitos.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Usa las herramientas tecnológicas con diferentes intenciones: investigar sobre temas de interés, informarse sobre el acontecer nacional e internacional, entretenerse con textos de humor, constatar la veracidad o falsedad de noticias de dudosa procedencia.', oficial: true }]
      },
      {
        id: 'len-5-lec-16',
        contenido: 'Consultar contenidos de un mismo tema en diferentes fuentes.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Lee varias fuentes para profundizar los conocimientos sobre determinados temas de las ciencias.', oficial: true }]
      },
      {
        id: 'len-5-lec-17',
        contenido: 'Comparar diversas fuentes de consulta mediante métodos críticos.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Utiliza estrategias de análisis para confirmar la veracidad de la información: origen, confiabilidad, aporte, fecha, tipo.', oficial: true }]
      },
      {
        id: 'len-5-lec-18',
        contenido: 'Seguir a un autor o autora de obras literarias.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Manifiesta preferencias por determinados géneros literarios y lee varias obras de un mismo autor o autora.', oficial: true }]
      },
      {
        id: 'len-5-lec-19',
        contenido: 'Usar el índice de libros y otros portadores de textos.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Localiza contenidos mediante el uso del índice en diversos portadores de textos.', oficial: true }]
      },
      {
        id: 'len-5-lec-20',
        contenido: 'Memorizar el orden de las letras del alfabeto.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Utiliza el conocimiento del orden alfabético para ubicar y organizar datos según ese criterio.', oficial: true }]
      },
      {
        id: 'len-5-lec-21',
        contenido: 'Conocer datos biográficos de personajes destacados de nuestra historia.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Posee conocimientos sobre el epónimo de su escuela y datos biográficos de al menos seis personajes destacados de nuestra historia y algunos de su localidad.', oficial: true }]
      },
      {
        id: 'len-5-lec-22',
        contenido: 'Analizar componentes de textos narrativos.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Identifica e interpreta algunos elementos de los textos literarios: estructura, personajes, descripciones, diálogos.', oficial: true },
          { texto: 'Descubre las intenciones de los personajes de las narraciones, analizando los recursos del lenguaje para “decir” contenidos implícitos en los relatos.', oficial: true }
        ]
      },
      {
        id: 'len-5-lec-23',
        contenido: 'Incursionar en el análisis de algunas particularidades de la lengua.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Muestra interés por analizar ciertas particularidades del español: Palíndromos, Bifrontes y Palabras pentavocálicas.', oficial: true }]
      },
      {
        id: 'len-5-lec-24',
        contenido: 'Incorporar al vocabulario palabras desconocidas.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Se interesa por incorporar progresivamente palabras desconocidas a su acervo léxico. Algunos ejemplos: petricor, óbice, agiotista, aniridia, veragua.', oficial: true }]
      },
      {
        id: 'len-5-lec-25',
        contenido: 'Identificar figuras retóricas en textos literarios.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Reconoce algunas figuras retóricas de los textos literarios: metáfora, símil, epíteto, anáfora…', oficial: true }]
      },
      {
        id: 'len-5-lec-26',
        contenido: 'Conocer la forma de conjugación de una serie de verbos.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Conjuga un amplio repertorio de verbos de uso común, tales como: ser, haber, hacer, sentir, ir, rallar, rayar, entre otros.', oficial: true }]
      },
      {
        id: 'len-5-lec-27',
        contenido: 'Diferenciar una variedad de clases de palabras.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Distingue y conoce las funciones de varias clases de palabras: sustantivos, adjetivos, verbos, adverbios, conjunciones, pronombres, artículos y preposiciones.', oficial: true },
          { texto: 'Diferencia entre distintos tipos de sustantivos: propios/ comunes; individuales/ colectivos; simples/ compuestos; numerables; abstractos.', oficial: true }
        ]
      },
      {
        id: 'len-5-lec-28',
        contenido: 'Distinguir las principales clases de oraciones.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Distingue una variedad de clases de oraciones: afirmativas, negativas, interrogativas, exclamativas.', oficial: true }]
      },
      {
        id: 'len-5-lec-29',
        contenido: 'Analizar la estructura de oraciones simples.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Reconoce los elementos esenciales en oraciones sencillas (sujeto, predicado y verbo).', oficial: true },
          { texto: 'Identifica el sujeto tácito en una diversidad de oraciones.', oficial: true }
        ]
      },
      {
        id: 'len-5-lec-30',
        contenido: 'Conocer las nociones de sinonimia, antonimia, derivación de palabras, campos lexicales.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Incrementa la capacidad de comprensión y expresión mediante el enriquecimiento del léxico y el conocimiento de las relaciones entre palabras.', oficial: true }]
      },
      {
        id: 'len-5-lec-31',
        contenido: 'Comprender la composición de palabras.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Analiza y escribe convencionalmente un amplio repertorio de palabras compuestas, como las siguientes: extraordinario, marcapasos, menospreciar, contraproducente, medianoche, coliflor, cascarrabias, maleducado.', oficial: true }]
      },
      {
        id: 'len-5-lec-32',
        contenido: 'Interpretar datos estadísticos elementales.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Comprende datos estadísticos esenciales expresados en forma escrita y gráfica: frecuencias, promedios, porcentajes.', oficial: true }]
      },
      {
        id: 'len-5-lec-33',
        contenido: 'Utilizar diversas fuentes de consulta y verificación.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Usa el diccionario para resolver dudas ortográficas y consultar significados de palabras.', oficial: true },
          { texto: 'Acude a diversas fuentes para comparar y verificar informaciones.', oficial: true }
        ]
      },
      {
        id: 'len-5-lec-34',
        contenido: 'Resolver dificultades de comprensión mediante estrategias efectivas.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Gestiona dificultades de comprensión usando diversas estrategias: relectura, consulta en otras fuentes, preguntas.', oficial: true }]
      },
      {
        id: 'len-5-lec-35',
        contenido: 'Conocer la cosmovisión de nuestros pueblos originarios mediante los mitos.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Interpreta el significado de una selección de mitos indígenas.', oficial: true }]
      },
      {
        id: 'len-5-lec-36',
        contenido: 'Interpretar siglas.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Conoce la noción de sigla y entiende significado de algunas de uso común (OMS, OPEP, OIT, IVIC, UCV, ONU, OEA).', oficial: true }]
      },
      {
        id: 'len-5-lec-37',
        contenido: 'Conocer sobre la existencia de la lengua de señas venezolana.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Comprende el significado y expresa un repertorio básico de gestos de la lengua de señas venezolana.', oficial: true }]
      },
      {
        id: 'len-5-lec-38',
        contenido: 'Conocer derechos fundamentales establecidos en la Constitución de la República Bolivariana de Venezuela.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Conoce algunos derechos fundamentales establecidos en la Constitución de la República Bolivariana de Venezuela.', oficial: true }]
      },
      {
        id: 'len-5-lec-39',
        contenido: 'Interpretar el sentido del Himno Nacional de la República Bolivariana de Venezuela y el del estado de origen.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Conoce el significado y el contexto histórico del Himno Nacional y el de su estado de origen.', oficial: true }]
      },
      {
        id: 'len-5-lec-40',
        contenido: 'Conocer la función de ciertos documentos legales.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Conoce el sentido de la partida de nacimiento, la cédula de identidad y la fe vida.', oficial: true }]
      }
    ],
    'Escritura': [
      {
        id: 'len-5-esc-1',
        contenido: 'Redactar normas de convivencia y acuerdos.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Participa en la escritura de las normas de convivencia, los deberes con respecto a las demás personas y la conservación del ambiente.', oficial: true }]
      },
      {
        id: 'len-5-esc-2',
        contenido: 'Escribir diferentes tipos de textos para satisfacer intereses y necesidades de diversa índole.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Redacta textos de los géneros más usados de acuerdo con la estructura propia de cada uno (cuentos, ensayos, biografías, reseñas literarias).', oficial: true }]
      },
      {
        id: 'len-5-esc-3',
        contenido: 'Tomar conciencia de la relación entre el sentido del texto y la ortografía.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Reconoce la ortografía como un recurso vinculado con el sentido del texto y acude a diversas fuentes para resolver dudas durante la escritura.', oficial: true }]
      },
      {
        id: 'len-5-esc-4',
        contenido: 'Conocer las normas y escribir de acuerdo con las convencionalidades gramaticales y ortográficas fundamentales.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Reconoce la utilidad de aprender sobre gramática y ortografía.', oficial: true },
          { texto: 'Redacta textos de uso frecuente empleando los recursos ortográficos básicos del sistema de escritura: separación entre palabras, mayúsculas en nombres de personas y lugares, nombres de instituciones y otros casos.', oficial: true },
          { texto: 'Conoce las normas de uso de los signos ortográficos y las emplea en la escritura: puntuación, interrogación y exclamación, comillas y paréntesis.', oficial: true }
        ]
      },
      {
        id: 'len-5-esc-5',
        contenido: 'Entender las reglas de acentuación de palabras.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Comprende la diferencia sílabas átonas / sílabas tónicas.', oficial: true },
          { texto: 'Comprende las diferencias entre palabras según su acentuación: agudas, graves, esdrújulas y sobresdrújulas.', oficial: true },
          { texto: 'Usa en la escritura el conocimiento de las reglas de acentuación.', oficial: true }
        ]
      },
      {
        id: 'len-5-esc-6',
        contenido: 'Transformar y resumir textos.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Modifica textos para construir uno propio, conservando el sentido del texto fuente.', oficial: true },
          { texto: 'Sintetiza un texto aplicando las operaciones básicas del resumen: identificación de ideas esenciales, supresión de contenidos accesorios, uso de sinónimos y paráfrasis.', oficial: true }
        ]
      },
      {
        id: 'len-5-esc-7',
        contenido: 'Producir textos destinados a la publicación.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Redacta textos para ser publicados siguiendo los pasos de este proceso: planificación del escrito, textualización, revisión y edición.', oficial: true }]
      },
      {
        id: 'len-5-esc-8',
        contenido: 'Escribir cartas y correos electrónicos.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Redacta cartas y correos electrónicos en estilos formales e informales según la situación comunicativa.', oficial: true }]
      },
      {
        id: 'len-5-esc-9',
        contenido: 'Desarrollar la capacidad para la escritura mediante el conocimiento de la gramática.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Emplea en la escritura los conocimientos acerca del léxico y sus propiedades: sinonimia, derivación, campos léxicos, ortografía de palabras.', oficial: true },
          { texto: 'Redacta textos en forma coherente empleando los recursos de cohesión para expresar relaciones entre ideas: conectores, signos de puntuación, organización de ideas en párrafos.', oficial: true }
        ]
      },
      {
        id: 'len-5-esc-10',
        contenido: 'Aplicar a la escritura los rasgos ortográficos distintivos de palabras homófonas.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Expresa en la escritura distinciones ortográficas relacionadas con la homofonía de palabras. Ejemplos: ahí/ ay/ hay; a/ ha/ ah; e/ he; seno/ ceno; hecho/ echo; rayar/ rallar; coser/ cocer; botar/ votar; tubo/ tuvo; cima/ sima; haya/ halla/ aya; / ollar/ hollar/ hoyar.', oficial: true }]
      },
      {
        id: 'len-5-esc-11',
        contenido: 'Utilizar recursos estéticos en la escritura.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Escribe textos para publicar utilizando recursos básicos del diseño: diagramación, legibilidad, tipos de letras, ilustraciones y otros elementos gráficos.', oficial: true },
          { texto: 'Practica el trazo artístico de las letras con fines funcionales y de diseño, siguiendo diferentes estilos.', oficial: true }
        ]
      },
      {
        id: 'len-5-esc-12',
        contenido: 'Utilizar la caligrafía como forma de expresión artística que vincula la escritura con otras artes como el dibujo y la pintura.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Utiliza la caligrafía como forma de expresión artística.', oficial: true }]
      },
      {
        id: 'len-5-esc-13',
        contenido: 'Crear juegos de palabras.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Crea juegos de palabras: acrósticos, anagramas, crucifiguras, sopas de letras.', oficial: true }]
      },
      {
        id: 'len-5-esc-14',
        contenido: 'Conocer la diferencia entre palabras simples y compuestas.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Analiza la composición y escribe convencionalmente un conjunto de palabras compuestas, como las siguientes: sacapuntas, cortapapel, abrelatas, tirabuzón, malhumorado, buenaventura, girasol, espantapájaros, portaequipaje, paraguas.', oficial: true }]
      },
      {
        id: 'len-5-esc-15',
        contenido: 'Ampliar el repertorio de palabras con ortografía convencional.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Entiende y usa en la escritura las diferencias gráficas de sonidos iguales: distinciones b/v; c/s/z; y/ll; i/y; cambio Z por C en el plural de palabras: perdiz/ perdices; capaz/capaces; veloz/veloces; matiz/ matices.', oficial: true },
          { texto: 'Aplica a la escritura las reglas fundamentales de uso de la H, incluyendo palabras con H intercalada: ahumado, alcohol, ahogar, albahaca, almohada, alcahueta, zanahoria.', oficial: true }
        ]
      },
      {
        id: 'len-5-esc-16',
        contenido: 'Reflexionar sobre los avances en el aprendizaje de la lengua.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Participa en comentarios de grupo acerca de los avances y expectativas con respecto al aprendizaje de la lengua.', oficial: true }]
      },
      {
        id: 'len-5-esc-17',
        contenido: 'Escribir convencionalmente grupos silábicos complejos y palabras con consonantes finales.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Conoce el sentido y escribe en forma convencional palabras que contienen sílabas complejas: abstracto, obstrucción, transporte, constitución, abstinencia, obsesión, abdicar.', oficial: true },
          { texto: 'Escribe en forma convencional palabras finalizadas en consonantes: bondad, maldad, capacidad, césped, vid, álbum, tablet, club, frac, zinc.', oficial: true }
        ]
      },
      {
        id: 'len-5-esc-18',
        contenido: 'Emplear en la escritura signos ortográficos de uso menos frecuente.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Conocer las normas fundamentales de uso del punto y coma, puntos suspensivos, diéresis, apóstrofo y barra.', oficial: true }]
      },
      {
        id: 'len-5-esc-19',
        contenido: 'Entender la formación de nuevas palabras mediante prefijos y sufijos.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Forma nuevas palabras usando la noción de prefijo: apolítico, prexistente, autocrítica, automóvil, bicicleta, bisabuela, discordia, despeinar, desafinar, etc.', oficial: true },
          { texto: 'Forma nuevas palabras usando la noción de sufijo: codazo, cabezazo, golazo, mazazo, portazo, aristocracia, demócrata, burócrata, insecticida, herbicida, ecocidio.', oficial: true }
        ]
      },
      {
        id: 'len-5-esc-20',
        contenido: 'Usar elementos gráficos para sistematizar información.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Organiza y sistematiza información mediante el uso de recursos gráficos: tablas, gráficos de barras, esquemas, árbol genealógico.', oficial: true }]
      },
      {
        id: 'len-5-esc-21',
        contenido: 'Conocer y utilizar el orden de las letras del abecedario.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Escribe listas de palabras en orden alfabético y ubica rápidamente palabras ordenadas según este criterio.', oficial: true },
          { texto: 'Escribe los estados de Venezuela en orden alfabético.', oficial: true }
        ]
      },
      {
        id: 'len-5-esc-22',
        contenido: 'Comprender el sentido y uso de nociones lingüísticas fundamentales.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Posee conocimientos sobre nociones gramaticales básicas, y las usa en la escritura: masculino/ femenino; singular/ plural; sustantivos propios/ comunes; parentescos lexicales (zapato-zapatero-zapatazo).', oficial: true }]
      },
      {
        id: 'len-5-esc-23',
        contenido: 'Copiar y tomar dictado con propósitos que justifican estas prácticas.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Copia (conservando la forma y contenido del texto fuente) y toma dictados, para diversos propósitos reales.', oficial: true }]
      }
    ],
    'Oralidad': [
      {
        id: 'len-5-ora-1',
        contenido: 'Hablar y escuchar con diversos propósitos.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Actúa en intercambios verbales con distintos propósitos, en variedad de situaciones comunicativas, expresando sus opiniones y argumentos en forma coherente, con un vocabulario cada vez más amplio.', oficial: true },
          { texto: 'Escucha activamente a sus compañeros y al docente, formulando preguntas y comentarios que enriquecen la discusión.', oficial: true },
          { texto: 'Atiende a las intervenciones de sus interlocutores, y expresa sus desacuerdos con respeto.', oficial: true }
        ]
      },
      {
        id: 'len-5-ora-2',
        contenido: 'Participar en la construcción de acuerdos grupales.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Participa en la discusión y revisión permanente de las normas de convivencia y los deberes con respecto a las demás personas y conservación del ambiente.', oficial: true }]
      },
      {
        id: 'len-5-ora-3',
        contenido: 'Leer en voz alta para diferentes audiencias.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Narra cuentos para diversas audiencias, apegándose a la secuencia de los hechos, conservando detalles y utilizando marcadores lingüísticos que expresan relaciones de espacio y tiempo.', oficial: true },
          { texto: 'Lee poemas para distintas audiencias, ajustando los rasgos de la voz a la situación comunicativa.', oficial: true }
        ]
      },
      {
        id: 'len-5-ora-4',
        contenido: 'Cantar un repertorio de himnos y canciones emblemáticas de venezuela.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Entona el Himno Nacional de la República Bolivariana de Venezuela y el de su estado, apegado a la letra de estos cantos.', oficial: true },
          { texto: 'Explica los significados históricos implícitos en las letras de esos himnos.', oficial: true },
          { texto: 'Canta una selección de canciones del repertorio cultural venezolano y latinoamericano.', oficial: true }
        ]
      },
      {
        id: 'len-5-ora-5',
        contenido: 'Discutir el contenido y el significado de textos leídos.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Intercambia ideas con el resto del grupo acerca del contenido de textos leídos (narrativos e informativos).', oficial: true }]
      },
      {
        id: 'len-5-ora-6',
        contenido: 'Dramatizar escenas de obras leídas.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Actúa en la dramatización de obras expresando parlamentos y gestos apegados al texto teatral.', oficial: true }]
      },
      {
        id: 'len-5-ora-7',
        contenido: 'Participar en intercambios de grupo sobre respuestas a instrumentos de evaluación.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Participa en la comparación de respuestas a instrumentos de evaluación mediante intercambios con el grupo de compañeras, compañeros y docente.', oficial: true }]
      },
      {
        id: 'len-5-ora-8',
        contenido: 'Participar en exposiciones con apoyo de recursos visuales o tecnológicos.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Se expresa con claridad y organización de las ideas en presentaciones a sus compañeros de clases.', oficial: true }]
      },
      {
        id: 'len-5-ora-9',
        contenido: 'Participar en intercambios de análisis sobre la utilidad de la tecnología.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Participa en discusiones acerca de la utilidad de la tecnología', oficial: true }]
      },
      {
        id: 'len-5-ora-10',
        contenido: 'Conocer recursos del lenguaje cinematográfico.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Participa como espectador de películas y, posteriormente, en comentarios grupales acerca de los contenidos y recursos básicos del lenguaje cinematográfico: espacio, tiempo, iluminación, sonido y movimiento.', oficial: true }]
      },
      {
        id: 'len-5-ora-11',
        contenido: 'Ampliar el vocabulario relacionado con temas relativamente complejos de la ciencia, la sociedad y la cultura.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Utiliza en la expresión oral el registro propio del discurso científico al exponer sobre diversos temas de las ciencias.', oficial: true }]
      },
      {
        id: 'len-5-ora-12',
        contenido: 'Interpretar instrucciones de cierta complejidad.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Ejecuta acciones a partir de instrucciones y consignas relativamente complejas.', oficial: true }]
      },
      {
        id: 'len-5-ora-13',
        contenido: 'Participar en actividades culturales en contextos reales o simulados.',
        oficial: true,
        // Corrección editorial: Grado 5°, Pág. 61. Aparecía duplicada dos veces seguidas en la tabla del PDF con el mismo aprendizaje. Se eliminó la fila repetida.
        notaEditorial: 'Grado 5°, Pág. 61: Fila duplicada en el PDF ministerial. Se conservó una sola entrada.',
        aprendizajesEsperados: [{ texto: 'Actúa como espectador activo y responsable en presentaciones artísticas, festivales, tradiciones y costumbres.', oficial: true }]
      },
      {
        id: 'len-5-ora-14',
        contenido: 'Comentar noticias y otras informaciones de interés.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Comenta con docentes y compañeros noticias de actualidad, locales, nacionales e internacionales.', oficial: true }]
      },
      {
        id: 'len-5-ora-15',
        contenido: 'Divertirse mediante la memorización y expresión de una variedad de expresiones de la lengua.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Disfruta compartiendo manifestaciones lúdicas del lenguaje: adivinanzas, chistes, retahílas, dichos y refranes.', oficial: true }]
      },
      {
        id: 'len-5-ora-16',
        contenido: 'Conocer los estados de la República Bolivariana de Venezuela y sus capitales.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Conoce y evoca los nombres de los estados la República Bolivariana de Venezuela y sus capitales.', oficial: true }]
      },
      {
        id: 'len-5-ora-17',
        contenido: 'Dialogar con diversos propósitos.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Dialoga con adecuación al contexto en variadas situaciones comunicativas: resolver conflictos, construir acuerdos, discutir sobre diversos temas, planificar proyectos en grupo.', oficial: true }]
      },
      {
        id: 'len-5-ora-18',
        contenido: 'Adecuar la pronunciación de palabras a la norma estándar.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Pronuncia palabras de cierta complejidad de acuerdo con la norma escrita.', oficial: true }]
      }
    ]
  },
  '6': {
    'Lectura': [
      {
        id: 'len-6-lec-1',
        contenido: 'Reconocer la lectura como vía para el desarrollo personal y el desempeño académico.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Tiene conciencia sobre la importancia de la lectura como herramienta para el crecimiento personal e intelectual.', oficial: true }]
      },
      {
        id: 'len-6-lec-2',
        contenido: 'Estudiar para profundizar conocimientos mediante la lectura rigurosa.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Lee con el propósito de ampliar, profundizar y organizar el conocimiento.', oficial: true },
          { texto: 'Posee conocimientos sobre temas fundamentales de nuestra identidad, soberanía y salud: petróleo, agua, conservación del ambiente; alimentación, actividad física y salud.', oficial: true }
        ]
      },
      {
        id: 'len-6-lec-3',
        contenido: 'Adoptar la posición estética del lector para experimentar las sensaciones que produce la literatura.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Se interesa por la literatura y, de acuerdo con sus preferencias e intereses, acude espontáneamente a la lectura de diversos géneros literarios: poesía y narración (cuentos, mitos, leyendas, fábulas, crónicas).', oficial: true }]
      },
      {
        id: 'len-6-lec-4',
        contenido: 'Incursionar en el género teatral.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Lee y participa en el análisis de textos teatrales.', oficial: true },
          { texto: 'Posee conocimientos elementales sobre el origen del teatro y las diferencias entre los subgéneros fundamentales: comedia, musical, monólogo.', oficial: true }
        ]
      },
      {
        id: 'len-6-lec-5',
        contenido: 'Incursionar en el género epistolar literario.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Ha leído y comentado en grupo, un repertorio de cartas literarias: cartas de Bolívar a Simón Rodríguez; cartas de Bolívar a Manuela Sáenz; cartas de José Martí a María Mantilla.', oficial: true }]
      },
      {
        id: 'len-6-lec-6',
        contenido: 'Identificar los rasgos distintivos de textos de diversos géneros.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Identifica las diferencias entre diversos tipos de textos: relato, poesía, instruccionales, informativos, epistolares.', oficial: true }]
      },
      {
        id: 'len-6-lec-7',
        contenido: 'Resolver instrumentos de evaluación.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Está familiarizado con la resolución de pruebas de evaluación dirigidas a estimar los avances en el aprendizaje y los efectos de la enseñanza.', oficial: true }]
      },
      {
        id: 'len-6-lec-8',
        contenido: 'Identificar recursos de la señalética.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Identifica un amplio repertorio de elementos de la señalética: señales de orientación, precaución y tránsito.', oficial: true }]
      },
      {
        id: 'len-6-lec-9',
        contenido: 'Leer para afianzar la ciudadanía.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Conoce algunos derechos fundamentales establecidos en la Constitución de la República Bolivariana de Venezuela.', oficial: true },
          { texto: 'Conoce algunos derechos y deberes fundamentales de la niñez establecidos en la Convención sobre los Derechos del Niño y la LOPNNA.', oficial: true },
          { texto: 'Conoce y toma conciencia sobre sus deberes en relación con sus semejantes, el ambiente y la Patria.', oficial: true },
          { texto: 'Conoce el sentido de ciertos documentos legales: partida de nacimiento, cédula de identidad, fe de vida.', oficial: true }
        ]
      },
      {
        id: 'len-6-lec-10',
        contenido: 'Leer para reafirmar la identidad nacional y latinoamericana.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Ubica en el mapa de Venezuela estados, capitales, límites, ríos, montañas; ubica a Venezuela en América; distingue norteamérica, centroamérica y sudamérica; y ubica países en el mapamundi.', oficial: true }]
      },
      {
        id: 'len-6-lec-11',
        contenido: 'Consultar diferentes fuentes para ampliar y profundizar conocimientos sobre diversos temas.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Lee varias fuentes para adentrarse en contenidos sobre determinados temas de las ciencias.', oficial: true }]
      },
      {
        id: 'len-6-lec-12',
        contenido: 'Fortalecer la capacidad para analizar y crear textos que combinan diferentes modalidades.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Lee y crea textos que combinan elementos escritos, imágenes, gráficos.', oficial: true },
          { texto: 'Infiere contenidos implícitos e intenciones del autor o autora.', oficial: true }
        ]
      },
      {
        id: 'len-6-lec-13',
        contenido: 'Interpretar metáforas.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Comprende metáforas de cierta complejidad en textos literarios.', oficial: true }]
      },
      {
        id: 'len-6-lec-14',
        contenido: 'Ajustar las estrategias al propósito que orienta la lectura.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Lee utilizando la modalidad que corresponde al propósito: lectura en voz alta para una audiencia determinada; lectura silenciosa para estudiar, informarse, recrearse.', oficial: true },
          { texto: 'Utiliza estrategias de lectura adecuadas al propósito: lectura exploratoria para localizar determinados datos; lectura rigurosa para profundizar en ciertos temas y para seguir instrucciones.', oficial: true }
        ]
      },
      {
        id: 'len-6-lec-15',
        contenido: 'Incursionar en la cultura venezolana a través del lenguaje.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Interpreta el sentido de diversos textos literarios y juegos del lenguaje pertenecientes al acervo cultural venezolano (canciones, coplas, poemas, retahílas, adivinanzas, dichos, refranes, expresiones populares del habla venezolana).', oficial: true },
          { texto: 'Entiende y usa adecuadamente un amplio repertorio de expresiones populares de Venezuela: “Una golondrina no hace verano”, “Lo que no mata, engorda”, “Al mal tiempo, buena cara”, “Caras vemos, corazones no sabemos”.', oficial: true }
        ]
      },
      {
        id: 'len-6-lec-16',
        contenido: 'Comparar noticias en diversas fuentes.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Confirma la veracidad de una noticia consultando diversas fuentes.', oficial: true }]
      },
      {
        id: 'len-6-lec-17',
        contenido: 'Incursionar en internet con distintos propósitos.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Usa los medios tecnológicos con diferentes intenciones: investigar sobre temas de interés, informarse sobre el acontecer nacional e internacional, entretenerse leyendo literatura, constatar la veracidad o falsedad de noticias de dudosa procedencia.', oficial: true }]
      },
      {
        id: 'len-6-lec-18',
        contenido: 'Seguir a un autor o autora de obras literarias.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Manifiesta preferencias por determinados géneros literarios y autores y lee varias obras de un mismo autor o autora de su preferencia.', oficial: true }]
      },
      {
        id: 'len-6-lec-19',
        contenido: 'Usar el índice de libros y otros portadores de textos.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Localiza contenidos utilizando el índice en diversos portadores de textos.', oficial: true }]
      },
      {
        id: 'len-6-lec-20',
        contenido: 'Memorizar el orden de las letras en el alfabeto.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Utiliza el conocimiento del orden alfabético para ubicar y organizar datos según ese criterio.', oficial: true }]
      },
      {
        id: 'len-6-lec-21',
        contenido: 'Conocer el origen de un repertorio de palabras e incorporar progresivamente nuevos significados al acervo léxico.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Manifiesta interés por investigar sobre el origen y significado de nuevas palabras y expresiones venezolanas.', oficial: true }]
      },
      {
        id: 'len-6-lec-22',
        contenido: 'Conocer datos biográficos de personajes destacados de nuestra historia.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Posee conocimientos sobre el epónimo de su escuela y datos biográficos de, al menos, seis personajes destacados de la historia regional, local y nacional.', oficial: true }]
      },
      {
        id: 'len-6-lec-23',
        contenido: 'Analizar componentes y recursos de textos narrativos.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Identifica e interpreta algunos elementos de los textos literarios: estructura, personajes, descripciones, diálogos, onomatopeyas.', oficial: true },
          { texto: 'Reconoce algunas figuras retóricas usadas en la poesía: metáfora, símil, epíteto, repetición.', oficial: true },
          { texto: 'Analiza los recursos del lenguaje para revelar estados de ánimo de los personajes, sin manifestarlo de manera explícita.', oficial: true }
        ]
      },
      {
        id: 'len-6-lec-24',
        contenido: 'Diferenciar una variedad de clases de palabras.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Distingue y conoce las funciones de varias clases de palabras: sustantivos, adjetivos, verbos, adverbios, conjunciones, pronombres, artículos y preposiciones.', oficial: true },
          { texto: 'Diferencia entre distintos tipos de sustantivos: propios/ comunes; individuales/ colectivos; simples/ compuestos; numerables; abstractos.', oficial: true }
        ]
      },
      {
        id: 'len-6-lec-25',
        contenido: 'Conocer la diferencia entre verbos regulares e irregulares y la forma de conjugación de una amplia serie de esta clase de palabras.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Conjuga un repertorio de verbos regulares e irregulares: ser, haber, hacer, sentir, ir, caer, poner, rallar, rayar.', oficial: true }]
      },
      {
        id: 'len-6-lec-26',
        contenido: 'Analizar la estructura de oraciones simples y compuestas.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Reconoce los elementos esenciales en oraciones simples y compuestas (sujeto, predicado y verbo).', oficial: true },
          { texto: 'Identifica el sujeto tácito en una diversidad de oraciones.', oficial: true },
          { texto: 'Identifica el complemento directo en una variedad de oraciones.', oficial: true },
          { texto: 'Identifica las oraciones en un texto.', oficial: true }
        ]
      },
      {
        id: 'len-6-lec-27',
        contenido: 'Incursionar en el análisis de algunas particularidades de la lengua.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Muestra interés por descubrir y analizar datos curiosos del español: Palíndromos, Bifrontes, palabras pentavocálicas, firuletes del sistema alfabético (tildes, diéresis, virgulilla) y dígrafos.', oficial: true }]
      },
      {
        id: 'len-6-lec-28',
        contenido: 'Conocer las nociones de sinonimia, antonimia, derivación de palabras, campos lexicales.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Incrementa la capacidad de comprensión y expresión mediante el enriquecimiento del léxico y el conocimiento de los vínculos entre palabras.', oficial: true }]
      },
      {
        id: 'len-6-lec-29',
        contenido: 'Analizar la composición de palabras.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Analiza la composición y escribe convencionalmente un conjunto amplio de palabras compuestas: agridulce, aguafiestas, electroencefalograma, tentempié.', oficial: true }]
      },
      {
        id: 'len-6-lec-30',
        contenido: 'Interpreta datos estadísticos elementales.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Comprende datos estadísticos esenciales expresados en forma escrita y gráfica: frecuencias, promedios, porcentajes.', oficial: true }]
      },
      {
        id: 'len-6-lec-31',
        contenido: 'Resolver dificultades de comprensión mediante estrategias efectivas.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Gestiona dificultades de comprensión usando diversas estrategias: relectura, consulta en distintas fuentes, preguntas.', oficial: true }]
      },
      {
        id: 'len-6-lec-32',
        contenido: 'Distinguir las principales clases de oraciones.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Distingue una variedad de clases de oraciones: afirmativas, negativas, interrogativas, exclamativas, simples, compuestas.', oficial: true }]
      },
      {
        id: 'len-6-lec-33',
        contenido: 'Utilizar el diccionario como fuente de consulta.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Usa el diccionario para resolver dudas ortográficas y consultar significados de palabras.', oficial: true },
          { texto: 'Utiliza el diccionario de la Real Academia de la Lengua Española (DRAE) como recurso para resolver dudas relacionadas con el idioma.', oficial: true },
          { texto: 'Posee conocimientos elementales acerca de la RAE y sobre los procedimientos que utiliza para incorporar nuevas palabras a su diccionario.', oficial: true }
        ]
      },
      {
        id: 'len-6-lec-34',
        contenido: 'Poseer información básica sobre la existencia, ubicación geográfica y valor de lenguas propias de comunidades que habitan en nuestro territorio.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Conoce la existencia y regiones de uso de diferentes lenguas que se hablan en Venezuela, además del español.', oficial: true },
          { texto: 'Conoce ciertas palabras y expresiones de algunas de esas lenguas.', oficial: true }
        ]
      },
      {
        id: 'len-6-lec-35',
        contenido: 'Conocer la noción de variedades dialectales.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Posee conocimientos básicos sobre diferencias dialectales regionales en el español de Venezuela.', oficial: true }]
      },
      {
        id: 'len-6-lec-36',
        contenido: 'Leer textos largos en varias sesiones.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Usa el marca páginas en la lectura de textos de relativa extensión.', oficial: true }]
      },
      {
        id: 'len-6-lec-37',
        contenido: 'Conocer la cosmovisión de nuestros pueblos originarios mediante los mitos.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Conoce el significado de una selección de mitos indígenas.', oficial: true }]
      },
      {
        id: 'len-6-lec-38',
        contenido: 'Conocer la noción de siglas.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Entiende el significado de siglas de uso común: OMS, OIT, RAE, IVIC, UCV, ONU, OEA.', oficial: true }]
      },
      {
        id: 'len-6-lec-39',
        contenido: 'Interpretar información que combina textos y recursos gráficos.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Comprende datos expresados gráficamente: mapas, gráficos de barras, árbol genealógico, croquis, infografías.', oficial: true }]
      },
      {
        id: 'len-6-lec-40',
        contenido: 'Usar la tecnología con ética y con actitud responsable.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Es consciente de la necesidad de usar la tecnología con ética y responsabilidad.', oficial: true }]
      },
      {
        id: 'len-6-lec-41',
        contenido: 'Conocer sobre la existencia de la lengua de señas venezolana.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Comprende el significado y expresa un repertorio básico de gestos de la lengua de señas venezolana.', oficial: true }]
      },
      {
        id: 'len-6-lec-42',
        contenido: 'Conocer derechos fundamentales establecidos en la Constitución de la República Bolivariana de Venezuela.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Conoce algunos derechos fundamentales establecidos en la constitución de la República Bolivariana de Venezuela.', oficial: true }]
      },
      {
        id: 'len-6-lec-43',
        contenido: 'Conocer la función de ciertos documentos legales.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Conoce el sentido de la partida de nacimiento, la cédula de identidad, fe de vida.', oficial: true }]
      }
    ],
    'Escritura': [
      {
        id: 'len-6-esc-1',
        contenido: 'Reconocer la utilidad de aprender gramática.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Reconoce la utilidad de aprender sobre gramática y ortografía al servicio de la escritura.', oficial: true }]
      },
      {
        id: 'len-6-esc-2',
        contenido: 'Redactar normas de convivencia y acuerdos.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Participa en la escritura de las normas de convivencia, los deberes con respecto a las demás personas, la conservación del ambiente y respeto a la Patria.', oficial: true }]
      },
      {
        id: 'len-6-esc-3',
        contenido: 'Escribir diferentes tipos de textos para satisfacer intereses y necesidades de diversa índole.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Redacta textos de los géneros más usados de acuerdo con la estructura propia de cada uno (cuentos, ensayos, biografías, cartas, mensajes de texto, instrucciones).', oficial: true }]
      },
      {
        id: 'len-6-esc-4',
        contenido: 'Adquirir competencias para la búsqueda, evaluación y utilización de recursos en línea.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Incorpora a la escritura información relevante de varias fuentes, parafraseando el contenido para no copiar textualmente.', oficial: true },
          { texto: 'Usa recursos para citar fragmentos copiados de otros autores (comillas y datos de referencia).', oficial: true },
          { texto: 'Utiliza fuentes digitales y convencionales para producir textos originales.', oficial: true }
        ]
      },
      {
        id: 'len-6-esc-5',
        contenido: 'Relacionar la ortografía con el sentido del texto.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Reconoce la ortografía como un recurso vinculado con el sentido del texto.', oficial: true },
          { texto: 'Tiene conciencia de la función de la ortografía para hacer más comprensible el texto por parte de los potenciales lectores.', oficial: true },
          { texto: 'Acude a diversas fuentes para resolver dudas durante la escritura.', oficial: true }
        ]
      },
      {
        id: 'len-6-esc-6',
        contenido: 'Producir guiones teatrales.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Produce textos, en equipo, para simular y dramatizar situaciones reales e imaginarias.', oficial: true }]
      },
      {
        id: 'len-6-esc-7',
        contenido: 'Conocer las normas y escribir de acuerdo con las convencionalidades ortográficas fundamentales.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Redacta textos de uso frecuente empleando los recursos ortográficos básicos del sistema de escritura.', oficial: true },
          { texto: 'Conoce las normas de uso de los signos ortográficos y las emplea en la escritura: puntuación, interrogación y exclamación, comillas, diéresis y paréntesis.', oficial: true },
          { texto: 'Comprende y usa en la escritura las normas de acentuación de palabras.', oficial: true }
        ]
      },
      {
        id: 'len-6-esc-8',
        contenido: 'Emplear en la escritura signos ortográficos de uso menos frecuente.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Conoce las normas fundamentales de uso del punto y coma, puntos suspensivos, apóstrofo y barra.', oficial: true },
          { texto: 'Analiza el uso del guion en la formación de palabras compuestas de uso común como las siguientes: teórico-práctico, artístico-musical, físico-químico.', oficial: true }
        ]
      },
      {
        id: 'len-6-esc-9',
        contenido: 'Transformar y resumir textos.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Transforma escritos para construir uno propio, conservando el sentido del texto fuente.', oficial: true },
          { texto: 'Sintetiza un texto aplicando las operaciones básicas del resumen: identificación de ideas esenciales, supresión de contenidos accesorios, uso de sinónimos y paráfrasis.', oficial: true }
        ]
      },
      {
        id: 'len-6-esc-10',
        contenido: 'Desarrollar la capacidad para la escritura mediante el conocimiento de la gramática.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Emplea en la escritura los conocimientos acerca del léxico y sus propiedades: sinonimia, derivación, campos léxicos, ortografía de palabras.', oficial: true },
          { texto: 'Redacta textos en forma coherente empleando las nociones de cohesión para expresar relaciones entre ideas: conectores, signos de puntuación, organización de ideas en párrafos.', oficial: true }
        ]
      },
      {
        id: 'len-6-esc-11',
        contenido: 'Aplicar a la escritura los rasgos ortográficos distintivos de palabras homófonas.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Expresa en la escritura las distinciones ortográficas más comunes relacionadas con la homofonía de palabras. Ejemplos: ¡ay!/ ahí/ hay; a/ ha/ ah; e/ he; seno/ ceno; hecho/ echo; rayar/ rallar; coser/ cocer; botar/ votar; tubo/ tuvo; cima/ sima; haya/ halla/ aya; hollar/ ollar/ hoyar.', oficial: true }]
      },
      {
        id: 'len-6-esc-12',
        contenido: 'Entender y usar las reglas de acentuación de palabras.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Comprende la diferencia sílabas átonas / sílabas tónicas.', oficial: true },
          { texto: 'Comprende las diferencias entre palabras según su acentuación: agudas, graves, esdrújulas y sobresdrújulas.', oficial: true },
          { texto: 'Usa en la escritura el conocimiento de las reglas de acentuación.', oficial: true }
        ]
      },
      {
        id: 'len-6-esc-13',
        contenido: 'Conocer las normas y usar en la escritura la noción de acento diacrítico.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Diferencia y usa en la escritura el acento diacrítico para diferenciar significados: sí/ si, tú/ tu, él/ el, mí/ mi, sé/ se; canto/ cantó, vacío/ vació, cántara/ cantará, sábana/ sabana, etc.', oficial: true }]
      },
      {
        id: 'len-6-esc-14',
        contenido: 'Entender las nociones de hiato y diptongo.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Distingue hiato de diptongo en relación con la acentuación de palabras.', oficial: true }]
      },
      {
        id: 'len-6-esc-15',
        contenido: 'Producir textos destinados a la publicación.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Redacta textos para ser publicados siguiendo los pasos de este proceso: planificación del escrito, textualización, revisión y edición.', oficial: true }]
      },
      {
        id: 'len-6-esc-16',
        contenido: 'Cuidar la estética y legibilidad de la escritura con propósitos específicos.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Escribe textos para publicar utilizando recursos básicos del diseño: organización gráfica, legibilidad, tipos de letras, ilustraciones y otros elementos gráficos.', oficial: true },
          { texto: 'Practica el trazo artístico de las letras con fines funcionales y de diseño, siguiendo diferentes estilos.', oficial: true }
        ]
      },
      {
        id: 'len-6-esc-17',
        contenido: 'Utilizar la caligrafía como forma de expresión artística.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Utiliza la caligrafía como forma de expresión artística que vincula la escritura con otras artes como el dibujo y la pintura.', oficial: true }]
      },
      {
        id: 'len-6-esc-18',
        contenido: 'Escribir cartas y correos electrónicos.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Redacta cartas y correos electrónicos en estilos formales e informales según la situación comunicativa.', oficial: true }]
      },
      {
        id: 'len-6-esc-19',
        contenido: 'Escribir reseñas literarias.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Recomienda obras literarias mediante reseñas escritas.', oficial: true }]
      },
      {
        id: 'len-6-esc-20',
        contenido: 'Producir juegos de palabras.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Crea juegos de palabras: acrósticos, anagramas, crucifiguras, sopas de letras.', oficial: true }]
      },
      {
        id: 'len-6-esc-21',
        contenido: 'Conocer la diferencia entre palabras simples y compuestas.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Analiza la composición y escribe convencionalmente un conjunto de palabras compuestas: paraguas, cortapapel, abrelatas, sacapuntas, tirabuzón, malhumorado, buenaventura, espantapájaros, portaequipaje, bienhechurías, contraportada, girasol, enhorabuena, contrahecho.', oficial: true }]
      },
      {
        id: 'len-6-esc-22',
        contenido: 'Ampliar el repertorio de palabras con ortografía convencional.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Entiende y usa en la escritura las diferencias gráficas de sonidos iguales: diferenciaciones b/v; c/s/z; y/ll; i/y; cambio Z por C en el plural de palabras: perdiz/ perdices; capaz/ capaces; veloz/veloces; matiz/matices.', oficial: true },
          { texto: 'Aplica a la escritura las reglas de uso de la H.', oficial: true }
        ]
      },
      {
        id: 'len-6-esc-23',
        contenido: 'Escribir convencionalmente grupos silábicos complejos y palabras con consonantes finales.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Conoce el sentido y escribe en forma convencional palabras que contienen sílabas complejas: absceso, abstracto, obstrucción, transporte, constitución, abstinencia, obsesión, abdicar.', oficial: true },
          { texto: 'Escribe en forma convencional palabras que terminan en consonante: bondad, maldad, capacidad, césped, vid, álbum, ídem, zoom, complot, tablet, chalet, club, web, comic, frac, zinc.', oficial: true }
        ]
      },
      {
        id: 'len-6-esc-24',
        contenido: 'Usar elementos gráficos para sistematizar y recordar información.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Organiza y sistematiza información mediante el uso de recursos gráficos: tablas, gráficos de barras, mapas conceptuales, árbol genealógico.', oficial: true }]
      },
      {
        id: 'len-6-esc-25',
        contenido: 'Conocer y utilizar el orden de las letras del abecedario.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Escribe listas de nombres en orden alfabético y ubica rápidamente palabras ordenadas según este criterio.', oficial: true },
          { texto: 'Escribe los nombres de los 23 estados de la República Bolivariana de Venezuela y el Distrito Capital, en orden alfabético.', oficial: true }
        ]
      },
      {
        id: 'len-6-esc-26',
        contenido: 'Entender la formación de nuevas palabras mediante prefijos y sufijos.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Forma nuevas palabras usando la noción de prefijo: impostor, inmoral, ingenuo, ilegible, ilegal, insoportable, imposible, kilogramo, kilómetro, metáfora, metamorfosis, multicolor, multilingüe, multicultural.', oficial: true },
          { texto: 'Forma nuevas palabras usando la noción de sufijo: escandaloso, perezosa, goloso, estrepitosa, estudioso, laboratorio, acusatorio, consultorio, escritor, emperatriz, actriz, directriz, matriz, casucha, feúcho, aguilucho, debilucho.', oficial: true }
        ]
      },
      {
        id: 'len-6-esc-27',
        contenido: 'Comprender el sentido y uso de nociones lingüísticas fundamentales.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Posee conocimientos sobre nociones gramaticales básicas, y las usa en la escritura: masculino/ femenino; singular/ plural; sustantivos propios/ comunes; parentescos lexicales (familias de palabras) y su relación con la ortografía literal (vender-venta-vendedor).', oficial: true }]
      },
      {
        id: 'len-6-esc-28',
        contenido: 'Copiar y tomar dictado con propósitos que justifican estas prácticas.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Copia (conservando la forma y contenido del texto fuente) y toma dictados, para diversos propósitos reales.', oficial: true }]
      }
    ],
    'Oralidad': [
      {
        id: 'len-6-ora-1',
        contenido: 'Adecuar el discurso al contexto.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Diferencia entre estilos formales e informales del habla y adecúa el discurso a la situación comunicativa.', oficial: true }]
      },
      {
        id: 'len-6-ora-2',
        contenido: 'Participar en la construcción de acuerdos grupales.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Participa en la discusión y revisión permanente de las normas de convivencia y los deberes con respecto a las demás personas, conservación del ambiente y respeto a la Patria.', oficial: true }]
      },
      {
        id: 'len-6-ora-3',
        contenido: 'Hablar y escuchar con diversos propósitos.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Actúa en intercambios verbales con distintos propósitos, en variedad de situaciones comunicativas, expresando sus opiniones y argumentos en forma coherente, con un vocabulario cada vez más amplio.', oficial: true },
          { texto: 'Escucha activamente a sus compañeros y a otras personas, formula preguntas y comentarios que enriquecen la discusión.', oficial: true },
          { texto: 'Atiende a las intervenciones de sus interlocutores, y expresa sus desacuerdos con respeto.', oficial: true }
        ]
      },
      {
        id: 'len-6-ora-4',
        contenido: 'Reflexionar sobre los avances en el aprendizaje de la lengua.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Participa en comentarios de grupo acerca de los avances y expectativas con respecto al aprendizaje de la lengua.', oficial: true }]
      },
      {
        id: 'len-6-ora-5',
        contenido: 'Participar en intercambios de análisis sobre la utilidad de la tecnología.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Participa en discusiones de análisis sobre la utilidad de la tecnología.', oficial: true }]
      },
      {
        id: 'len-6-ora-6',
        contenido: 'Discutir el contenido y el significado de un texto.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Intercambia ideas con el resto del grupo acerca del contenido de textos leídos (narrativos e informativos).', oficial: true }]
      },
      {
        id: 'len-6-ora-7',
        contenido: 'Analizar críticamente las ventajas de la tecnología.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Participa en intercambios de análisis sobre el uso responsable de la tecnología.', oficial: true }]
      },
      {
        id: 'len-6-ora-8',
        contenido: 'Leer en voz alta para diferentes audiencias.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Narra cuentos para diversas audiencias, apegándose a la secuencia de los hechos, conservando detalles y utilizando marcadores lingüísticos que expresan relaciones de espacio y tiempo.', oficial: true },
          { texto: 'Lee en voz alta poemas y otros tipos de textos ajustando los rasgos de la voz y gestualidad a la situación comunicativa.', oficial: true }
        ]
      },
      {
        id: 'len-6-ora-9',
        contenido: 'Cantar un repertorio de himnos y canciones emblemáticas de venezuela.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Entona el Himno Nacional de la República Bolivariana de Venezuela y el de su estado.', oficial: true },
          { texto: 'Comprende y explica las metáforas y significados históricos fundamentales implícitos en las letras de esos himnos.', oficial: true },
          { texto: 'Canta una selección de canciones del repertorio cultural venezolano y latinoamericano.', oficial: true }
        ]
      },
      {
        id: 'len-6-ora-10',
        contenido: 'Conocer recursos del lenguaje cinematográfico.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Participa como espectador de películas y, posteriormente, en comentarios grupales acerca de los contenidos y recursos básicos del lenguaje cinematográfico: espacio, tiempo, iluminación, sonido y movimiento.', oficial: true }]
      },
      {
        id: 'len-6-ora-11',
        contenido: 'Participar en exposiciones con apoyo de recursos visuales o tecnológicos.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Participa en la discusión y revisión permanente de las normas de convivencia y los deberes con respecto a las demás personas, conservación del ambiente y respeto a la Patria.', oficial: true }]
      },
      {
        id: 'len-6-ora-12',
        contenido: 'Ampliar el vocabulario relacionado con temas relativamente complejos de la ciencia, la sociedad y la cultura.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Utiliza en la expresión oral el registro propio de las ciencias al exponer sobre diversos temas científicos y sociales.', oficial: true }]
      },
      {
        id: 'len-6-ora-13',
        contenido: 'Emplear con propiedad expresiones idiomáticas y modismos en la conversación.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Utiliza adecuadamente expresiones idiomáticas y modismos en la comunicación diaria.', oficial: true }]
      },
      {
        id: 'len-6-ora-14',
        contenido: 'Interpretar instrucciones de cierta complejidad.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Ejecuta acciones a partir de instrucciones y consignas relativamente complejas.', oficial: true }]
      },
      {
        id: 'len-6-ora-15',
        contenido: 'Participar en actividades culturales en contextos reales o simulados.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Actúa como espectador activo en presentaciones artísticas, festivales, tradiciones y costumbres.', oficial: true }]
      },
      {
        id: 'len-6-ora-16',
        contenido: 'Comentar noticias y otras informaciones de interés.',
        oficial: true,
        // Corrección editorial: Grado 6°, Pág. 74. Aparecía duplicada dos veces en la tabla. Se desduplicó.
        notaEditorial: 'Grado 6°, Pág. 74: Fila duplicada en el PDF ministerial. Se conservó una sola entrada.',
        aprendizajesEsperados: [{ texto: 'Comenta con docentes y compañeros noticias de actualidad, locales, nacionales e internacionales.', oficial: true }]
      },
      {
        id: 'len-6-ora-17',
        contenido: 'Divertirse mediante la memorización y expresión de una variedad de expresiones de la lengua.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Disfruta compartiendo manifestaciones lúdicas del lenguaje: adivinanzas, chistes, retahílas, dichos y refranes.', oficial: true }]
      },
      {
        id: 'len-6-ora-18',
        contenido: 'Conocer un repertorio de nombres de sonidos que emiten los animales.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Denomina los nombres de un nuevo repertorio de sonidos que emiten algunos animales: el sapo croa, la serpiente silba y sisea, los pájaros trinan, el mosquito zumba.', oficial: true }]
      },
      {
        id: 'len-6-ora-19',
        contenido: 'Dramatizar escenas de obras leídas.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Actúa en la dramatización de obras expresando parlamentos y gestos apegados al texto teatral.', oficial: true }]
      },
      {
        id: 'len-6-ora-20',
        contenido: 'Conocer y evocar los nombres de los estados de la República Bolivariana de Venezuela y sus capitales.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Evoca los nombres de los estados de la República Bolivariana de Venezuela y sus capitales.', oficial: true }]
      },
      {
        id: 'len-6-ora-21',
        contenido: 'Dialogar con diversos propósitos.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Dialoga con adecuación al contexto en variadas situaciones comunicativas: resolver conflictos, construir acuerdos, discutir sobre diversos temas, planificar proyectos en grupo.', oficial: true }]
      },
      {
        id: 'len-6-ora-22',
        contenido: 'Adecuar la pronunciación de palabras a la norma estándar.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Pronuncia palabras de cierta complejidad de acuerdo con la norma escrita.', oficial: true }]
      },
      {
        id: 'len-6-ora-23',
        contenido: 'Disponer de información elemental sobre la existencia y lugares de uso de los idiomas más hablados en el mundo (español, inglés, francés, chino, italiano, ruso, árabe, alemán).',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Conoce los nombres de los idiomas más hablados en el mundo y de los países en que se usan esas lenguas.', oficial: true }]
      },
      {
        id: 'len-6-ora-24',
        contenido: 'Analizar el uso ciertas expresiones del habla del español en Venezuela.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Conoce algunas expresiones usadas en el español de Venezuela y se expresa de acuerdo con su uso estándar: íbanos -> íbamos; hacen años -> hace años; fuera sabido -> hubiera sabido; vinistes -> viniste; no los dijeron -> nos lo dijeron.', oficial: true }]
      },
      {
        id: 'len-6-ora-25',
        contenido: 'Analizar críticamente las ventajas y los riesgos de las redes sociales.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Participa en intercambios de análisis sobre las ventajas y los riesgos de las redes sociales.', oficial: true }]
      },
      {
        id: 'len-6-ora-26',
        contenido: 'Identificar variedades lexicales de uso común en su comunidad.',
        oficial: true,
        aprendizajesEsperados: [{ texto: 'Identifica, en su comunidad, diferencias entre el uso oral y la forma escrita, es decir, palabras que se dicen de manera diferente a la norma estándar.', oficial: true }]
      }
    ]
  }
};
