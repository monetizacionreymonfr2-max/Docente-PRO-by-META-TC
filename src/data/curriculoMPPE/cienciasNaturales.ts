import { ContenidoItem, GradoPrimaria } from './types';

// CURRÍCULO OFICIAL MPPE 2026-2027: CIENCIAS NATURALES (Págs. 100-113)
export const CIENCIAS_NATURALES_DATA: Record<GradoPrimaria, Record<string, ContenidoItem[]>> = {
  '1': {
    'Salud Integral': [
      {
        id: 'cn-1-sal-1',
        contenido: 'Cuidado de nuestro cuerpo: Partes del cuerpo. Ejercicio y actividad física. Cuidado y respeto por el propio cuerpo. Identificación de situaciones de riesgo.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Identifica y representa con sus nombres las partes del cuerpo, comprende sus funciones y la importancia de cuidarlas.', oficial: true },
          { texto: 'Reconoce la importancia del ejercicio regular para mantener el cuerpo sano.', oficial: true },
          { texto: 'Participa en actividades físicas y juegos que promuevan el movimiento del cuerpo y de los objetos.', oficial: true },
          { texto: 'Desarrolla una actitud positiva hacia el cuidado del cuerpo.', oficial: true },
          { texto: 'Desarrolla una actitud positiva hacia su propio cuerpo y el de los demás, promoviendo la aceptación de las diferencias físicas.', oficial: true },
          { texto: 'Identificar situaciones de riesgo para la salud y el bienestar personal, reconociendo la necesidad de protegerse y cuidar el cuerpo frente a estas situaciones.', oficial: true },
          { texto: 'Implementa rutinas diarias que incluyan hábitos de higiene, como el lavado de manos, cepillado de dientes y cuidado general del cuerpo.', oficial: true }
        ]
      }
    ],
    'Ciencia, Tecnología y Sociedad': [
      {
        id: 'cn-1-cts-1',
        contenido: 'El movimiento: Movimientos diversos de seres vivos y objetos del entorno. Trayectoria y dirección. Representación gráfica. Efectos del movimiento en el entorno. Medios de transporte (terrestre, acuático, aéreo).',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Observa y describe fenómenos naturales relacionados con el movimiento, como el viento o las corrientes de agua, maneras de moverse los seres vivos del entorno.', oficial: true },
          { texto: 'Conoce y describe cuándo un objeto está en movimiento o en reposo.', oficial: true },
          { texto: 'Identifica diferentes movimientos y da ejemplos.', oficial: true },
          { texto: 'Describe las partes del cuerpo involucradas en diferentes movimientos y comprender su función en actividades físicas.', oficial: true },
          { texto: 'Sobre cómo el movimiento afecta su entorno, incluyendo seres vivos.', oficial: true },
          { texto: 'Identifica y clasifica diferentes medios de transporte (terrestre, acuático, aéreo).', oficial: true }
        ]
      }
    ],
    'El Ambiente y sus Interacciones': [
      {
        id: 'cn-1-amb-1',
        contenido: 'Cambios del ambiente: Cambios físicos de materiales del entorno: deformaciones, movimientos, cambios de estado de la materia: sólido, líquido, gas. Factores que influyen en los cambios de estado.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Identifica y describe el agua en los diferentes estados (sólido, líquido y gaseoso) y los cambios que ocurren al pasar de un estado a otro.', oficial: true },
          { texto: 'Observa y describe experimentos sencillos que muestran el cambio de estado del agua.', oficial: true }
        ]
      },
      {
        id: 'cn-1-amb-2',
        contenido: 'El agua: Propiedades del agua, estados: líquido, sólido (hielo) y gaseoso (vapor). Importancia del agua en la naturaleza. El agua en sus diferentes estados para la vida.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Describe cómo el agua en sus diferentes estados impactan su entorno.', oficial: true },
          { texto: 'Observa fenómenos naturales relacionados con los cambios de estado del agua y registra las observaciones de manera sencilla.', oficial: true }
        ]
      }
    ],
    'Seres Vivos': [
      {
        id: 'cn-1-sv-1',
        contenido: 'El mundo de los animales y las plantas: Clasificación plantas y animales del entorno (árboles, arbustos, hierbas y otros; vertebrados e invertebrados; mamíferos, aves, reptiles, anfibios y peces. Animales domésticos y salvajes. Importancia de los animales y las plantas en el ecosistema. Relación entre humanos y otros seres vivos.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Reconoce animales domésticos y salvajes.', oficial: true },
          { texto: 'Clasifica animales de su entorno según criterios establecidos por los niños.', oficial: true },
          { texto: 'Clasifica plantas de su entorno según criterios establecidos por los niños.', oficial: true },
          { texto: 'Reflexiona sobre la importancia del cuidado y respeto de los seres vivos.', oficial: true }
        ]
      },
      {
        id: 'cn-1-sv-2',
        contenido: 'El cuerpo humano: Los cinco sentidos y los órganos asociados.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Identifica los cinco sentidos y sus respectivos órganos, y describe su función de relación.', oficial: true },
          { texto: 'Reconoce y describe algunas funciones del cuerpo humano: moverse, pensar y sentir.', oficial: true }
        ]
      }
    ],
    'Energía - Materia': [
      {
        id: 'cn-1-en-1',
        contenido: 'La Energía: La energía y su importancia en la vida diaria. Manifestaciones de la energía y fuentes de energía. Transformación y transferencia de energía. Importancia del uso responsable de la energía.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Identifica eventos cotidianos relacionados con la energía, da ejemplos sencillos y concretos.', oficial: true },
          { texto: 'Comprende y da ejemplos de diferentes formas de manifestarse la energía (térmica, química, eléctrica, gravitacional) en la vida diaria.', oficial: true },
          { texto: 'Observa, y explora con eventos cotidianos de transferencia y transformación de la energía.', oficial: true }
        ]
      }
    ],
    'La Tierra en el Universo': [
      {
        id: 'cn-1-tu-1',
        contenido: 'Explorando el universo: Los cuerpos celestes: estrellas, planetas, cometas y satélites. La Tierra, el planeta donde vivimos. Características de la Tierra (agua, tierra, aire, vida). La Luna un satélite natural de la Tierra. Fases de la Luna. Movimientos de la Tierra: rotación (día y noche), traslación (cambio de estaciones). El sol.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Observa, registra e Identifica los cuerpos celestes: estrellas, planetas y la Luna.', oficial: true },
          { texto: 'Describe las características de la Tierra, un planeta especial con condiciones permite la vida.', oficial: true },
          { texto: 'Observa, registra e Identifica las fases de la Luna.', oficial: true },
          { texto: 'Describe los movimientos terrestres: la rotación, causa el día-noche y la traslación las estaciones.', oficial: true },
          { texto: 'Reconoce el Sol como una fuente vital de energía para nuestro planeta.', oficial: true },
          { texto: 'Indaga y explora sobre el universo y los fenómenos celestes.', oficial: true }
        ]
      }
    ]
  },
  '2': {
    'Salud Integral': [
      {
        id: 'cn-2-sal-1',
        contenido: 'Salud e higiene: Salud y su relación con la higiene personal. Hábitos de higiene personal. Cuidado bucal. Higiene en su entorno familiar, escolar y comunitario. Alimentación saludable. Prevención de enfermedades. Partes internas del cuerpo humano.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Reconoce y comprende el concepto de salud y cómo la higiene contribuye a mantenerla.', oficial: true },
          { texto: 'Reconoce la importancia de mantener su entorno limpio y ordenado, participando en actividades para promover la limpieza.', oficial: true },
          { texto: 'Desarrolla habilidades para el autocuidado, la higiene personal e identifica necesidades básicas de salud.', oficial: true },
          { texto: 'Identifica alimentos saludables.', oficial: true },
          { texto: 'Realiza prácticas que ayudan a prevenir enfermedades, como cubrirse al toser o estornudar.', oficial: true },
          { texto: 'Identifica y nombra las partes internas del cuerpo, comprende sus funciones y la importancia de cuidarlas.', oficial: true }
        ]
      }
    ],
    'Ciencia, Tecnología y Sociedad': [
      {
        id: 'cn-2-cts-1',
        contenido: 'Medios de transporte: Los medios de transporte y su función principal en la movilidad de personas y mercancías. Clasificación de los medios de transporte. Características principales. Normas de seguridad vial. Impacto ambiental del transporte.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Describe las características principales y sus usos de varios medios de transporte.', oficial: true },
          { texto: 'Reconoce la importancia de seguir las normas de seguridad vial.', oficial: true },
          { texto: 'Reconoce algunas señales de tránsito.', oficial: true },
          { texto: 'Reflexiona sobre el impacto ambiental que tienen los diferentes medios de transporte y la importancia del uso responsable.', oficial: true },
          { texto: 'Desarrolla habilidades para identificar rutas y ubicaciones, comprende conceptos básicos de dirección y distancia relacionados con el transporte.', oficial: true }
        ]
      }
    ],
    'El Ambiente y sus Interacciones': [
      {
        id: 'cn-2-amb-1',
        contenido: 'El agua: Características del agua potable (incolora, insípida, inodora). Cambios de Estados del agua y su importancia para el ambiente. Fuentes de agua: dulce y salada. Uso responsable y conservación del agua. Contaminación del agua.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Identifica los estados del agua, proporcionando ejemplos observables en su entorno.', oficial: true },
          { texto: 'Observa y describe las transformaciones del agua (cambios de estado) en el ambiente y su relevancia.', oficial: true },
          { texto: 'Identifica las fuentes de agua, así como la importancia del acceso al agua potable.', oficial: true },
          { texto: 'Desarrolla hábitos responsables para el uso y conservación del agua en su vida diaria.', oficial: true },
          { texto: 'Reconoce las causas y efectos de la contaminación del agua, promoviendo actitudes hacia su protección.', oficial: true },
          { texto: 'Reconoce la importancia que tienen las actividades y proyectos que promueven la conservación del ambiente y el uso racional de los recursos naturales como el agua y el suelo.', oficial: true }
        ]
      }
    ],
    'Seres Vivos': [
      {
        id: 'cn-2-sv-1',
        contenido: 'Características de los seres humanos: Características físicas que lo distinguen. Funciones vitales que realizan. Etapas del desarrollo humano: infancia, niñez, adolescencia, adultez y vejez. Cambios físicos y emocionales. Necesidades básicas. El ser humano como un ser social.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Identifica y describe las características físicas que distinguen a los seres humanos de otros seres vivos.', oficial: true },
          { texto: 'Explica las funciones vitales que realizan y su importancia para la vida.', oficial: true },
          { texto: 'Reconoce las etapas del desarrollo y los cambios que ocurren en cada una.', oficial: true },
          { texto: 'Enumera las necesidades básicas del ser humano y explicar por qué son importantes para la salud.', oficial: true },
          { texto: 'Valoración de la importancia de las relaciones sociales y cómo se comunican con los demás.', oficial: true }
        ]
      }
    ],
    'Energía - Materia': [
      {
        id: 'cn-2-en-1',
        // Corrección editorial autorizada: Grado 2°, Pág. 104 del PDF. El documento oficial duplicó por error el texto de la columna de Seres Vivos en Contenidos. Se ajustó el título temático a la realidad de sus aprendizajes evaluables.
        contenido: 'El petróleo y las fuentes de energía: Origen del petróleo, derivados e hidrocarburos, impacto ambiental, fuentes de energía y valoración del recurso.',
        oficial: true,
        notaEditorial: 'Grado 2°, Pág. 104: El PDF duplicó por error los contenidos de Seres Vivos en la columna de Energía-Materia. Se asignó la temática real correspondiente a sus aprendizajes de energía y petróleo.',
        aprendizajesEsperados: [
          { texto: 'Describe el origen del petróleo.', oficial: true },
          { texto: 'Reconoce la importancia del petróleo y sus derivados para el país como fuente de energía.', oficial: true },
          { texto: 'Reflexiona sobre el uso del petróleo y su impacto ambiental.', oficial: true },
          { texto: 'Identifica diferentes fuentes de energía y sus características.', oficial: true },
          { texto: 'Valora la importancia de la energía.', oficial: true }
        ]
      }
    ],
    'La Tierra en el Universo': [
      {
        id: 'cn-2-tu-1',
        contenido: 'Viajando de la tierra al espacio: Las Estrellas, constelaciones, planetas, cometas y galaxias. Características y tipos de estrellas. El sistema solar. Movimientos de los cuerpos celestes. Los eclipses: solar y lunar.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Identifica y nombra diferentes cuerpos celestes, estrellas, planetas y cometas.', oficial: true },
          { texto: 'Explica qué son las estrellas, cómo se forman y reconoce al Sol como una estrella importante para la vida en la Tierra.', oficial: true },
          { texto: 'Identifica algunas constelaciones conocidas.', oficial: true },
          { texto: 'Reconoce que el sistema solar está compuesto por varios planetas que giran alrededor del Sol.', oficial: true },
          { texto: 'Comprende los movimientos de distintos cuerpos celestes.', oficial: true },
          { texto: 'Descubre las maravillas del universo y despierta su curiosidad por los fenómenos astronómicos.', oficial: true }
        ]
      }
    ]
  },
  '3': {
    'Salud Integral': [
      {
        id: 'cn-3-sal-1',
        contenido: 'La alimentación en Venezuela: La alimentación, su rol en la salud y el crecimiento. Clasificación tradicional de los alimentos: El trompo de los alimentos. Influencias culturales en la gastronomía venezolana. Gastronomía autóctona de Venezuela. Importancia de las recetas familiares y su transmisión a través de generaciones.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Comprende qué es una alimentación saludable e identifica los diferentes grupos de alimentos.', oficial: true },
          { texto: 'Reconoce la importancia de la alimentación saludable, para mantener un estado óptimo de salud.', oficial: true },
          { texto: 'Reconoce los platos típicos de Venezuela y sus ingredientes principales.', oficial: true },
          { texto: 'Demuestra gusto por las tradiciones culinarias venezolanas y la diversidad alimentaria.', oficial: true },
          { texto: 'Valora la importancia de una alimentación saludable para el bienestar comunitario.', oficial: true }
        ]
      }
    ],
    'Ciencia, Tecnología y Sociedad': [
      {
        id: 'cn-3-cts-1',
        contenido: 'Las mezclas: Combinación de dos o más sustancias. Tipos de mezclas: homogéneas y heterogéneas. Propiedades de las mezclas. Métodos sencillos de separación de mezclas. Importancia de las mezclas en la vida cotidiana.',
        oficial: true,
        // Corrección editorial autorizada: Grado 3°, Pág. 105 del PDF. El PDF duplicó por error los 5 aprendizajes de La Alimentación.
        notaEditorial: 'Grado 3°, Pág. 105: El PDF oficial copió los aprendizajes esperados de nutrición en Las Mezclas. Se agregan aprendizajes pertinentes señalados como no oficiales.',
        aprendizajesEsperados: [
          {
            texto: 'Identifica y diferencia mezclas homogéneas y heterogéneas presentes en la vida cotidiana y el entorno escolar.',
            oficial: false,
            nota: 'Complemento sugerido (no oficial del MPPE)'
          },
          {
            texto: 'Experimenta y describe métodos sencillos de separación de mezclas (filtración, decantación, tamizado e imantación).',
            oficial: false,
            nota: 'Complemento sugerido (no oficial del MPPE)'
          },
          {
            texto: 'Reconoce la importancia de las mezclas y sus aplicaciones en la preparación de alimentos, higiene y actividades comunitarias.',
            oficial: false,
            nota: 'Complemento sugerido (no oficial del MPPE)'
          }
        ]
      }
    ],
    'El Ambiente y sus Interacciones': [
      {
        id: 'cn-3-amb-1',
        contenido: 'Biodiversidad: Variedad de seres vivos en un ecosistema, su importancia para el equilibrio ecológico, ecosistemas acuáticos y terrestres. Relación agua y biodiversidad. Cambio climático, conservación del agua, importancia de proteger los ecosistemas para mantener la biodiversidad.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Observa y describe la biodiversidad y su importancia en los ecosistemas de su entorno.', oficial: true },
          { texto: 'Reconoce el papel fundamental del agua en la vida de los organismos.', oficial: true },
          { texto: 'Participa en proyectos sobre conservación del agua y biodiversidad local.', oficial: true },
          { texto: 'Reconoce los efectos del cambio climático y sus consecuencias sobre la biodiversidad.', oficial: true },
          { texto: 'Valora y protege la biodiversidad.', oficial: true }
        ]
      }
    ],
    'Seres Vivos': [
      {
        id: 'cn-3-sv-1',
        contenido: 'Las plantas: Clasificación, características, partes principales de una planta, funciones. Fotosíntesis y su importancia para la vida. Métodos de reproducción (sexual y asexual). Importancia de las plantas en el ambiente.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Identifica y clasifica diferentes tipos de plantas de su entorno, y describe sus partes principales y sus funciones.', oficial: true },
          { texto: 'Reconoce las etapas del crecimiento y desarrollo de una planta.', oficial: true },
          { texto: 'Comprende la importancia de la fotosíntesis para las plantas y otros seres vivos.', oficial: true },
          { texto: 'Reflexiona sobre la importancia de las plantas en el ambiente y su rol en la producción de oxígeno.', oficial: true }
        ]
      }
    ],
    'Energía - Materia': [
      {
        id: 'cn-3-en-1',
        contenido: 'La Energía en las comunidades: Calidad de Vida en la comunidad. Uso responsable de la energía y desarrollo sostenible, retos energéticos en las comunidades, conservación y uso sostenible de la energía, estrategias para ahorrar energía en el hogar y la comunidad.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Comprende la presencia de la energía en el ambiente, sus diferentes formas y fuentes.', oficial: true },
          { texto: 'Reconoce la importancia del acceso a la energía en el desarrollo comunitario.', oficial: true },
          { texto: 'Demuestra una actitud responsable hacia el consumo de energía.', oficial: true },
          { texto: 'Valorar la importancia de hacer buen uso de la energía en la comunidad para un uso sostenible de la misma.', oficial: true }
        ]
      }
    ],
    'La Tierra en el Universo': [
      {
        id: 'cn-3-tu-1',
        contenido: 'La fuerza de gravedad: La fuerza que atrae a los objetos hacia el centro de la Tierra. Efectos de la fuerza de gravedad en el ambiente.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Comprende el origen y la importancia de la fuerza de gravedad para mantener a los objetos en su lugar tanto en la Tierra como en el espacio.', oficial: true },
          { texto: 'Realiza actividades prácticas para observar los efectos de la fuerza de gravedad en diferentes objetos (caída libre, peso).', oficial: true },
          { texto: 'Desarrolla habilidades para observar y registrar fenómenos astronómicos.', oficial: true }
        ]
      }
    ]
  },
  '4': {
    // NOTA EDITORIAL AUTORIZADA: En 4° Grado, el PDF del MPPE (págs. 106-108) solo contiene 4 componentes:
    // Salud Integral, Ciencia Tecnología y Sociedad, Energía - Materia, La Tierra en el Universo.
    // Se respetan estrictamente los 4 componentes sin inventar los otros 2.
    'Salud Integral': [
      {
        id: 'cn-4-sal-1',
        contenido: 'Nutrición y salud integral: Alimentación, los nutrientes (carbohidratos, proteínas, grasas, vitaminas y minerales) y su función en el cuerpo humano. Alimentación saludable, segura, sabrosa y soberana (4S) y la prevención de enfermedades.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Identifica los diferentes nutrientes de los alimentos (carbohidratos, proteínas, grasas, vitaminas y minerales) y su función en el organismo, promoviendo una alimentación 4S.', oficial: true },
          { texto: 'Comprende cómo una buena alimentación contribuye a la salud integral, previniendo enfermedades y promoviendo el bienestar físico y mental.', oficial: true }
        ]
      },
      {
        id: 'cn-4-sal-2',
        contenido: 'Nutrición y actividad física: Relación entre nutrición, actividad física y bienestar general. Importancia del aire puro y la actividad física para nuestra salud.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Desarrolla hábitos alimenticios saludables que incluyen la elección de alimentos nutritivos y la planificación de comidas balanceadas a partir del trompo de los alimentos.', oficial: true },
          { texto: 'Reconoce el papel fundamental de la actividad física en el mantenimiento de una buena salud y su relación con la alimentación 4S.', oficial: true },
          { texto: 'Identifica acciones que contribuyen a mejorar la calidad del aire en su entorno.', oficial: true }
        ]
      }
    ],
    'Ciencia, Tecnología y Sociedad': [
      {
        id: 'cn-4-cts-1',
        contenido: 'Instrumentos de medición: Magnitudes: longitud, masa y tiempo. Unidades de medida, instrumentos de medición de longitud, masa y tiempo y técnicas de medición.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Reconoce y utiliza diversos instrumentos de medición (metro, balanza, cronómetro, reloj..) para medir: longitudes, masa y tiempo.', oficial: true },
          { texto: 'Reconoce las diferentes unidades de medida de cada instrumento y cómo convertir entre ellas según sea necesario.', oficial: true },
          { texto: 'Desarrolla la capacidad para estimar y medir la masa, el volumen y la longitud de objetos utilizando instrumentos adecuados (balanzas, cilindros graduados, reglas, metro).', oficial: true },
          { texto: 'Aplica técnicas de medición en situaciones cotidianas y experimentos científicos, reconociendo la importancia de la precisión y la exactitud de las mediciones.', oficial: true }
        ]
      },
      {
        id: 'cn-4-cts-2',
        contenido: 'La tecnología al servicio de la comunidad: Aplicación en la agricultura, salud, educación y ambiente, impacto de la tecnología en la comunidad, uso responsable de la tecnología.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Comprende el funcionamiento básico de las tecnologías empleadas en diversos sistemas productivos que benefician a la comunidad.', oficial: true }
        ]
      }
    ],
    'Energía - Materia': [
      {
        id: 'cn-4-en-1',
        contenido: 'El átomo y la materia: El átomo la unidad más pequeña de la materia, partes del átomo, propiedades de los átomos. Conformación de la materia. Propiedades físicas y químicas.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Reconoce el átomo como la unidad fundamental de la materia. Identifica la estructura del átomo (núcleo: protones y neutrones; y electrones).', oficial: true },
          { texto: 'Distingue entre, substancias simples y compuestos, reconociendo ejemplos en su entorno cotidiano.', oficial: true },
          { texto: 'Desarrolla habilidades para observar, describir y clasificar la materia según sus propiedades físicas y químicas.', oficial: true }
        ]
      }
    ],
    'La Tierra en el Universo': [
      {
        id: 'cn-4-tu-1',
        contenido: 'El universo desde Venezuela: Identificación de constelaciones viibles desde Venezuela. Los fenómenos astronómicos (eclipses) y su relación con la gravedad.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Desarrolla habilidades para observar y registrar fenómenos astronómicos.', oficial: true },
          { texto: 'Reconocer cómo se observa el universo desde Venezuela, incluyendo particularidades culturales relacionadas con la astronomía.', oficial: true },
          { texto: 'Desarrolla un aprecio por las contribuciones locales a la astronomía y cómo estas influyen en la identidad cultural.', oficial: true }
        ]
      }
    ]
  },
  '5': {
    'Salud Integral': [
      {
        id: 'cn-5-sal-1',
        contenido: 'Construcción de la identidad: Autoconocimiento y autoestima. Identidad personal y social, características físicas, emocionales y sociales que definen a cada persona.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Desarrolla el autoconocimiento y una autoestima positiva, para entender sus propias características, habilidades e intereses.', oficial: true },
          { texto: 'Valora las diferencias culturales y sociales que forman parte de su identidad, promoviendo el respeto por los demás.', oficial: true },
          { texto: 'Demuestra habilidades para expresar sus pensamientos, emociones e identidades a través de diferentes medios (arte, escritura, diálogo).', oficial: true }
        ]
      },
      {
        id: 'cn-5-sal-2',
        contenido: 'El cuidado de sí mismo: Valoración por el respeto y el cuidado personal, salud emocional y relaciones interpersonales.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Desarrolla un sentido de responsabilidad hacia su propio bienestar, entendiendo cómo sus decisiones afectan su salud.', oficial: true },
          { texto: 'Demuestra habilidades interpersonales que les permitan establecer relaciones saludables con los demás.', oficial: true }
        ]
      }
    ],
    'Ciencia, Tecnología y Sociedad': [
      {
        id: 'cn-5-cts-1',
        contenido: 'Calor y temperatura: Escalas de temperatura, calor como proceso de transferencia de energía, efectos del cambio de temperatura en los materiales, calor específico. Importancia del calor en la vida diaria. Magnitud física: temperatura. Instrumentos de medición: termómetros.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Reconoce la importancia del calor y la temperatura en procesos cotidianos, como la cocción de alimentos o el clima.', oficial: true },
          { texto: 'Realiza experimentos simples que demuestren cómo el cambio de temperatura afecta a los materiales (expansión, cambios de estado).', oficial: true },
          { texto: 'Desarrolla habilidades para medir y registrar temperaturas, utilizando instrumentos adecuados.', oficial: true },
          { texto: 'Diseña instrumentos para medir temperatura.', oficial: true },
          { texto: 'Promueve acciones que contribuyan a la conservación del ambiente local.', oficial: true }
        ]
      }
    ],
    'El Ambiente y sus Interacciones': [
      {
        id: 'cn-5-amb-1',
        contenido: 'La organización del planeta: Características geográficas. Los sistemas naturales (climas, biomas) y su influencia en la biodiversidad.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Identifica las principales características geográficas del planeta (continentes, océanos, montañas) y su importancia para la vida.', oficial: true },
          { texto: 'Comprende cómo se organizan los sistemas naturales (climas, biomas) y su influencia en la biodiversidad.', oficial: true }
        ]
      },
      {
        id: 'cn-5-amb-2',
        contenido: 'Biodiversidad en Venezuela, patrimonio del planeta: Flora y fauna de Venezuela. La diversidad de ecosistemas de Venezuela. Conservación del ambiente.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Identifica diferentes especies de flora y fauna presentes en Venezuela y su importancia ecológica.', oficial: true },
          { texto: 'Reconoce problemas ambientales locales y globales (contaminación, deforestación, cambio climático) y sus causas.', oficial: true }
        ]
      },
      {
        id: 'cn-5-amb-3',
        contenido: 'Problemas ambientales: Contaminación, deforestación, cambio climático y sus causas.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Desarrolla habilidades para analizar críticamente las consecuencias de estos problemas en el ambiente y en la sociedad.', oficial: true },
          { texto: 'Desarrolla la creatividad al proponer acciones individuales y colectivas que contribuyan a la solución de problemas ambientales.', oficial: true }
        ]
      }
    ],
    'Seres Vivos': [
      {
        id: 'cn-5-sv-1',
        contenido: 'Como están organizadas las células: Estructura básica de una célula. células vegetales y animales. Niveles de organización biológica (células, tejidos, órganos, sistemas) y su interrelación. Importancia en la estructura y función de los organismos.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Reconoce la célula como la unidad básica de la vida y su importancia en la estructura y función de los organismos.', oficial: true },
          { texto: 'Identifica los diferentes niveles de organización biológica (células, tejidos, órganos, sistemas) y su interrelación.', oficial: true },
          { texto: 'Identifica las partes principales de una célula (membrana, citoplasma, núcleo) y comprender sus funciones.', oficial: true },
          { texto: 'Reconoce las diferencias entre células vegetales y animales.', oficial: true }
        ]
      },
      {
        id: 'cn-5-sv-2',
        contenido: 'La reproducción en los seres humanos: Proceso reproductivo humano, aspectos biológicos básicos relacionados con la reproducción sexual.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Comprende el proceso reproductivo humano, incluyendo aspectos biológicos básicos relacionados con la reproducción sexual.', oficial: true },
          { texto: 'Desarrolla actitudes, promoviendo el de respeto por uno mismo y por los demás.', oficial: true }
        ]
      }
    ],
    'Energía - Materia': [
      {
        id: 'cn-5-en-1',
        contenido: 'La ciencia atómica: Tabla periódica: El átomo y la materia, estructura y composición, protones, neutrones y electrones, número y masa atómica.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Comprende la importancia del estudio del átomo en la ciencia moderna y cómo ha influido en el desarrollo de diversas disciplinas científicas.', oficial: true },
          { texto: 'Explora con la tabla periódica las características atómicas de elementos de interés para los estudiantes.', oficial: true },
          { texto: 'Desarrolla una actitud crítica hacia los las científicas y científicos relacionados con el estudio de la estructura atómica y su aplicación en la vida diaria.', oficial: true }
        ]
      }
    ],
    'La Tierra en el Universo': [
      {
        id: 'cn-5-tu-1',
        contenido: 'La tierra es nuestro hogar: La atmosfera, estructura, interrelación con las otras geosferas, importancia para la vida en la Tierra. Importancia de cuidar nuestro planeta.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Identifica la atmósfera terrestre, estructura y su función en la protección del planeta y en el mantenimiento de condiciones adecuadas para la vida.', oficial: true },
          { texto: 'Desarrolla un sentido de responsabilidad hacia el cuidado del planeta, entendiendo que es nuestro hogar compartido.', oficial: true },
          { texto: 'Desarrolla y promueve acciones concretas que contribuyan a la conservación del ambiente desde lo local.', oficial: true }
        ]
      }
    ]
  },
  '6': {
    'Salud Integral': [
      {
        id: 'cn-6-sal-1',
        contenido: 'Sexualidad y vida: Sexualidad como un aspecto integral del ser humano, cambios físicos que ocurren durante la pubertad, etapas del desarrollo humano. Cambios emocionales y psicológicos asociados con la pubertad, relaciones interpersonales. Cuidados para una sexualidad saludable.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Describe las etapas del desarrollo humano y los cambios asociados en cada una.', oficial: true },
          { texto: 'Demuestra habilidades interpersonales que les permitan establecer relaciones saludables con los demás.', oficial: true },
          { texto: 'Demuestra una actitud de respeto hacia sí mismos y hacia los demás en el contexto de las relaciones afectivas.', oficial: true },
          { texto: 'Desarrolla habilidades para tomar decisiones informadas sobre su cuerpo, relaciones personales, promoviendo una visión positiva sobre estos temas.', oficial: true }
        ]
      }
    ],
    'Ciencia, Tecnología y Sociedad': [
      {
        id: 'cn-6-cts-1',
        contenido: 'Sustancias y elementos químicos: Sustancias puras y mezclas, propiedades físicas y químicas de las sustancias. El elemento químico, símbolos químicos, la tabla periódica.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Reconoce diferentes sustancias químicas y sus componentes básicos (elementos) a través de ejemplos cotidianos.', oficial: true },
          { texto: 'Identifica en la tabla periódica los componentes de substancias compuestas, sus propiedades y simbología.', oficial: true },
          { texto: 'Reconoce y explora algunas propiedades físicas y químicas básicas de las sustancias que los rodean.', oficial: true }
        ]
      },
      {
        id: 'cn-6-cts-2',
        contenido: 'Investigar en las ciencias: La investigación científica y su importancia en el avance del conocimiento. Métodos de investigación, formulación de preguntas científicas. Centros de investigación científica en Venezuela relacionados con temas estudiados. Trabajo desarrollado por científicas y científicos.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Comprende los procesos de la ciencia (observación, hipótesis, experimentación, análisis) y los aplica en investigaciones sencillas.', oficial: true },
          { texto: 'Formula preguntas científicas, diseña investigaciones para buscar respuestas a través de procesos de la ciencia.', oficial: true },
          { texto: 'Conoce sobre el desarrollo científico en Venezuela.', oficial: true }
        ]
      }
    ],
    'El Ambiente y sus Interacciones': [
      {
        id: 'cn-6-amb-1',
        contenido: 'Los eventos socio naturales: Fenómenos naturales y la intervención humana, causas de los desastres, factores naturales y factores humanos, estrategias para reducir riesgos y daños.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Identifica eventos naturales (terremotos, inundaciones, huracanes) y su impacto en las comunidades humanas.', oficial: true },
          { texto: 'Desarrolla conocimientos sobre medidas preventivas y planes de acción ante eventos socio-naturales para proteger a las personas y el entorno.', oficial: true },
          { texto: 'Desarrolla trabajo en equipo para abordar situaciones de emergencia relacionadas con eventos socio-naturales.', oficial: true }
        ]
      },
      {
        id: 'cn-6-amb-2',
        contenido: 'Compuestos orgánicos e inorgánicos: Características generales, diferencias entre compuestos orgánicos e inorgánicos, propiedades físicas y químicas, importancia de los compuestos en la vida diaria.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Explora e identifica algunas propiedades físicas y químicas básicas que caracterizan a compuestos orgánicos e inorgánicos relevantes en la vida diaria.', oficial: true }
        ]
      }
    ],
    'Seres Vivos': [
      {
        id: 'cn-6-sv-1',
        contenido: 'Origen de la vida: El agua en el origen de la vida en la tierra.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Comprende el papel del agua como elemento esencial para el desarrollo inicial de la vida.', oficial: true }
        ]
      },
      {
        id: 'cn-6-sv-2',
        contenido: 'Evolución y selección natural: Los cambios en las características hereditarias de las poblaciones, mecanismos de selección natural.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Describe ejemplos que ilustren el concepto de evolución biológica y cómo la selección natural influye en la adaptación de las especies a su entorno.', oficial: true }
        ]
      },
      {
        id: 'cn-6-sv-3',
        contenido: 'Relación de los seres vivos al alimentarnos: Cadena alimentaria y redes tróficas, interacción entre diferentes niveles tróficos en un ecosistema, importancia del equilibrio ecológico.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Reconoce las relaciones tróficas entre diferentes organismos dentro de un ecosistema observado (productores, consumidores, descomponedores).', oficial: true }
        ]
      },
      {
        id: 'cn-6-sv-4',
        contenido: 'El sistema nervioso: El sistema nervioso y su función principal en el cuerpo humano. Importancia del sistema nervioso en la coordinación y control de las funciones corporales. Estructura del sistema nervioso.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Identifica las partes principales del sistema nervioso (cerebro, médula espinal, nervios) y su función en el control del cuerpo.', oficial: true },
          { texto: 'Comprende cómo el sistema nervioso influye en el comportamiento.', oficial: true }
        ]
      }
    ],
    'Energía - Materia': [
      {
        id: 'cn-6-en-1',
        contenido: 'El electromagnetismo: Carga eléctrica, campo eléctrico y magnéticos. El electromagnetismo y su impacto en la tecnología moderna.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Reconoce fenómenos electromagnéticos del ambiente.', oficial: true },
          { texto: 'Identifica ejemplos de aplicaciones del electromagnetismo en la vida cotidiana (como motores eléctricos, electrodomésticos) y su impacto en la tecnología moderna.', oficial: true },
          { texto: 'Realiza experimentos sencillos para indagar sobre fenómenos electromagnéticos.', oficial: true }
        ]
      },
      {
        id: 'cn-6-en-2',
        contenido: 'Energía Eléctrica: La electricidad: generación y distribución. Componentes básicos de un circuito eléctrico. Uso responsable de la energía eléctrica.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Identifica formas se generar energía eléctrica y cómo se distribuye, así como su importancia en el funcionamiento de dispositivos cotidianos.', oficial: true },
          { texto: 'Conoce los componentes básicos de un circuito eléctrico (fuentes de energía, conductores, dispositivos resistivos) y cómo funcionan juntos para permitir el flujo de electricidad.', oficial: true },
          { texto: 'Reflexiona sobre el uso responsable de la energía eléctrica, promoviendo hábitos que contribuyan a su ahorro y eficiencia.', oficial: true }
        ]
      }
    ],
    'La Tierra en el Universo': [
      {
        id: 'cn-6-tu-1',
        contenido: 'El universo que nos rodea: El Sistema Solar, las Galaxias. Observación y fenómenos astronómicos. Importancia del estudio del universo.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Demuestra curiosidad sobre el universo y la ciencia astronómica, formulando preguntas y la búsqueda de respuestas a través de la investigación.', oficial: true },
          { texto: 'Comprende cómo los fenómenos astronómicos (como las estaciones y los eclipses) afectan la vida en la Tierra.', oficial: true }
        ]
      },
      {
        id: 'cn-6-tu-2',
        contenido: 'Venezuela en el universo: Venezuela y su carrera espacial. Agencia Bolivariana para Actividades Espaciales (ABAE) y sus logros en el ámbito espacial. Los satélites y su impacto en la comunicación y observación terrestre. Investigación científica en Venezuela. Impacto ambiental y social de la exploración espacial. Futuro de Venezuela en el espacio.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Reconoce la posición de Venezuela en el contexto del sistema solar y su relación con otros cuerpos celestes.', oficial: true },
          { texto: 'Valora la riqueza cultural y científica de Venezuela en la exploración del universo, incluyendo contribuciones históricas y contemporáneas.', oficial: true },
          { texto: 'Reflexiona sobre cómo las características geográficas y astronómicas de Venezuela influyen en su biodiversidad y ecosistemas.', oficial: true },
          { texto: 'Desarrolla una actitud crítica hacia las acciones humanas que contribuyen al cambio climático, promoviendo la reflexión sobre prácticas sostenibles.', oficial: true },
          { texto: 'Demuestra creatividad al proponer acciones individuales y colectivas para mitigar el cambio climático y promover la conservación del ambiente.', oficial: true }
        ]
      }
    ]
  }
};
