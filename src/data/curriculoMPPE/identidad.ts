import { ContenidoItem, GradoPrimaria } from './types';

// CURRÍCULO OFICIAL MPPE 2026-2027: IDENTIDAD (Ciencias Sociales, Historia, Geografía y Ciudadanía)
// Páginas 127-141 del documento oficial.
export const IDENTIDAD_DATA: Record<GradoPrimaria, Record<string, ContenidoItem[]>> = {
  '1': {
    'La Humanidad': [
      {
        id: 'id-1-hum-1',
        contenido: 'El viaje por la vida: crecimiento y cambios: Descubriendo las etapas de la vida. El cuerpo cambia. Cuidarse en todas las edades.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Entiende que la vida del ser humano es un proceso de cambios y crecimiento constante; nacemos de nuestras madres como bebés, continuamos hacia la niñez, luego a la adolescencia y a la adultez, hasta que finalmente llegamos a la adultez mayor.', oficial: true }
        ]
      }
    ],
    'Nuestro Mundo': [
      {
        id: 'id-1-nm-1',
        contenido: 'Los lugares que nos rodean: Explorando el salón y su organización. Conociendo las viviendas. El cuidado del planeta Tierra.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Mide varias distancias utilizando sus pies y comprende las nociones espaciales arriba, abajo, adelante, atrás, derecha e izquierda.', oficial: true },
          { texto: 'Identifica elementos de su escuela, como la entrada, el salón de clases, la Bandera Nacional; así como los espacios públicos de su comunidad y en los alrededores de su escuela.', oficial: true },
          { texto: 'Conoce los diferentes tipos de viviendas e identifica la ubicación de su escuela en relación con su vivienda.', oficial: true },
          { texto: 'Realiza actividades de siembra y observación de los cambios que presentan las plantas durante su crecimiento.', oficial: true },
          { texto: 'Identifica los paisajes del campo y de la ciudad.', oficial: true },
          { texto: 'Reconoce las fases de la Luna y su función en relación al tiempo.', oficial: true },
          { texto: 'Identifica el Sol como fuente de luz y calor y su función en relación al tiempo, cómo medirlo y cuáles instrumentos lo hacen; conoce los días de la semana y los meses del año.', oficial: true },
          { texto: 'ambiente y el uso racional de los recursos naturales.', oficial: true }
        ]
      }
    ],
    'Venezuela en el Mundo': [
      {
        id: 'id-1-vm-1',
        contenido: 'Venezuela en el mapa: Paisajes, flora y fauna. La puerta de América del Sur. Nuestros países vecinos.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Identifica los bailes, gastronomía, artesanía, música, fiestas tradicionales y juegos de Venezuela, en contexto con su comunidad, su estado y la Nación.', oficial: true }
        ]
      }
    ],
    'Pueblos Indígenas': [
      {
        id: 'id-1-pi-1',
        contenido: 'Raíces originarias: Las primeras culturas en Venezuela. Costumbres y tradiciones indígenas. Pueblo indígenas hoy.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Conoce cómo son las familias de los pueblos indígenas, sus orígenes, costumbres y regiones donde viven.', oficial: true }
        ]
      }
    ],
    'Pueblos Afrovenezolanos': [
      {
        id: 'id-1-pa-1',
        contenido: 'Raíces de África: Nuestros ancestros. El ritmo en el cuerpo. Cuentos y colores africanus.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Conoce los orígenes de los pueblos afrovenezolanos y el continente africano, e identifica y valora la música y bailes afrovenezolanos.', oficial: true }
        ]
      }
    ],
    'Libertador Simón Bolívar': [
      {
        id: 'id-1-sb-1',
        contenido: 'Conociendo a Simón Bolívar: Libertador y Padre de la Patria. La época de Bolívar. Roles en la sociedad colonial.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Conoce a Simón Bolívar, su fecha y lugar de nacimiento y su contexto social.', oficial: true },
          { texto: 'Reconoce a Simón Bolívar como Padre de la Patria y Libertador de Venezuela, Colombia, Ecuador, Panamá, Perú y Bolivia.', oficial: true }
        ]
      }
    ],
    'Cultura Venezolana': [
      {
        id: 'id-1-cv-1',
        contenido: 'Nuestra Identidad: Los símbolos patrios. Tradiciones de la comunidad. Música, bailes y comidas de Venezuela.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Identifica cuáles son nuestros símbolos patrios y sus elementos principales; los bailes, gastronomía, artesanía, música, fiestas tradicionales y juegos de Venezuela, en contexto con su comunidad, su estado y la Nación.', oficial: true }
        ]
      }
    ],
    'Sociedad y Ciudadanía': [
      {
        id: 'id-1-sc-1',
        contenido: 'Construyendo convivencia: La escuela, un segundo hogar. Amor y respeto en la familia. Derechos y deberes de las niñas y niños.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Reconoce y valora la existencia de diversos tipos de familias, sus miembros, la amistad, la ayuda mutua y la colaboración entre todas y todos.', oficial: true },
          { texto: 'Conoce que la gran mayoría de la sociedad venezolana tiene su origen en la unión de diversas culturas como las indígenas, las africanas y la europea.', oficial: true },
          { texto: 'Comprende la importancia que tiene mantener el orden en su vivienda y en su escuela.', oficial: true },
          { texto: 'Reconoce las señales de seguridad vial y las diversas normas de tránsito.', oficial: true },
          { texto: 'Comprende qué significa la igualdad de derechos, y reconoce cuáles son los derechos y deberes de las niñas y niños.', oficial: true }
        ]
      }
    ]
  },
  '2': {
    'La Humanidad': [
      {
        id: 'id-2-hum-1',
        contenido: 'Cambios en las familias y comunidades: El paso del tiempo en la vida de las personas. Historias y recuerdos de la familia. Las transformaciones en la comunidad.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Entiende que la vida de las personas, de las familias y la Historia de las comunidades, de las regiones, de las naciones y de la Humanidad, forma parte de un proceso de cambios y permanencias, que tienen lugar a través del tiempo y de distintos espacios geográficos, además conoce los períodos de la Historia de Venezuela: indígena, colonial y republicano.', oficial: true }
        ]
      }
    ],
    'Nuestro Mundo': [
      {
        id: 'id-2-nm-1',
        contenido: 'Descubriendo el entorno: La escuela, el lugar para aprender. Las diversas viviendas en Venezuela. Paisajes venezolanos.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Observa, identifica y describe del entorno de su escuela.', oficial: true },
          { texto: 'Reconoce la importancia de la vivienda y sus diferentes tipos.', oficial: true },
          { texto: 'Identifica la diversidad de paisajes que existen en las regiones de Venezuela, y reflexiona sobre la importancia del cuidado del planeta Tierra y la construcción de un futuro sostenible.', oficial: true }
        ]
      }
    ],
    'Pueblos Indígenas': [
      {
        id: 'id-2-pi-1',
        contenido: 'Modos de vida: Casas de los pueblos indígenas. Las regiones históricas. Raíces de nuestra alimentación.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Identifica las características de las viviendas de los pueblos indígenas, así como sus aportes a la cultura alimentaria de Venezuela y ubica en el mapa de Venezuela, las regiones donde viven los pueblos indígenas.', oficial: true }
        ]
      }
    ],
    'Colonización Europea': [
      {
        id: 'id-2-ce-1',
        contenido: 'Inicios de la conquista: Resistencia indígena. Las primeras ciudades. Colonia y esclavitud.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Conoce los comienzos del proceso de colonización europea, la fundación de ciudades y los términos conquista, colonia y esclavitud, así como la forma en la que se dividía la sociedad colonial.', oficial: true }
        ]
      }
    ],
    'Pueblos Afrovenezolanos': [
      {
        id: 'id-2-pa-1',
        contenido: 'Herencia actual: Regiones socioculturales. El ritmo en las manos. Celebraciones y tradición.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Ubica a las comunidades afrovenezolanas en el mapa de Venezuela y reconoce los diferentes instrumentos de percusión y su origen africano.', oficial: true }
        ]
      }
    ],
    'Liberación de América': [
      {
        id: 'id-2-la-1',
        contenido: 'Insurgencia popular: Movimientos contra la colonia española. Declaración de la Independencia. El Generalísimo Francisco de Miranda.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Conoce los movimientos populares que insurgen contra el dominio colonial español, finales del siglo XVIII y principios del siglo XIX, con énfasis en la participación de las mujeres y las acciones de Francisco de Miranda, Precursor de la liberación americana, creador de la Bandera Nacional, y comprende los hitos, personajes y lugares referentes a los inicios del proceso de Independencia, con énfasis en el 19 de abril de 1810, el 5 de julio de 1811.', oficial: true }
        ]
      }
    ],
    'Libertador Simón Bolívar': [
      {
        id: 'id-2-sb-1',
        contenido: 'La infancia de Bolívar: Su familia y amigos. Los maestros. Las ideas que lo inspiran.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Describe aspectos de la vida de Simón Bolívar, como su familia y sus maestros, en especial Simón Rodríguez.', oficial: true },
          { texto: 'Identifica a la Igualdad, Libertad y Justicia como las principales ideas que influyeron en Bolívar.', oficial: true }
        ]
      }
    ],
    'Sociedad y Ciudadanía': [
      {
        id: 'id-2-sc-1',
        contenido: 'Escuela, familia y comunidad: Aprendizaje y convivencia. Tipos de familias. Trabajo y valores en la sociedad.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Reconoce a su escuela como un espacio de aprendizaje y convivencia, y comprende la importancia de mantener y cuidar a su escuela y vincula a su familia, con su comunidad y su escuela.', oficial: true },
          { texto: 'Reconoce que existen diversas las familias, que tienes características variadas.', oficial: true },
          { texto: 'Entiende cómo es el proceso la reproducción humana, así como el rol de la madre y el padre.', oficial: true },
          { texto: 'Entiende cómo es el proceso del crecimiento humano y la formación de las familias.', oficial: true },
          { texto: 'Comprende los factores que influyen en el crecimiento y disminución de la población.', oficial: true },
          { texto: 'Comprender el valor del trabajo y de las diferentes ocupaciones laborales, y valora la participación de todas y todos, así como el trabajo colaborativo.', oficial: true },
          { texto: 'Reconoce la diversidad humana y la igualdad entre las personas.', oficial: true },
          { texto: 'Desarrolla prácticas de comunicación oral y escrita, a partir de lecturas sobre la historia y la cultura de Venezuela.', oficial: true }
        ]
      }
    ],
    'Cultura Venezolana': [
      {
        id: 'id-2-cv-1',
        contenido: 'Diversidad Cultural: Símbolos de la venezolanidad. Cultoras y cultores. Los idiomas de nuestro país.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Comprende el significado de los tres colores primarios de la bandera nacional y su papel como símbolo para la formación de la identidad nacional y continental.', oficial: true },
          { texto: 'Estudia los referentes patrimoniales, naturales y sitios históricos, en su localidad, su estado y la Nación y conoce la diversidad de idiomas que se hablan en Venezuela.', oficial: true }
        ]
      }
    ]
  },
  '3': {
    'La Humanidad': [
      {
        id: 'id-3-hum-1',
        contenido: 'Pasado y Presente: Períodos de la Historia de Venezuela. Comunicación humana en el tiempo. Las formas del conocimiento.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Conoce los períodos de la Historia de Venezuela: indígena, colonial, republicano agrícola y republicano petrolero.', oficial: true },
          { texto: 'Identifica las distintas formas de comunicación y transmisión de conocimientos, historias y experiencias, desde las primeras culturas humanas, hasta la actualidad.', oficial: true }
        ]
      }
    ],
    'Nuestro Mundo': [
      {
        id: 'id-3-nm-1',
        contenido: 'Entorno cercano y lejano: Caseríos y Comunidades. Recorrido en el Caribe. Cuidado de la Tierra.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Reconoce las características de su vivienda y de un caserío campesino e identifica los elementos que conforman una comunidad, y elabora pequeños planos de su entorno.', oficial: true },
          { texto: 'Conoce el mar Caribe, la navegación y pesca en sus espacios, así como el fenómeno de los ciclones y aprende a utilizar responsablemente el agua potable, conociendo la importancia de cuidad el planeta Tierra.', oficial: true }
        ]
      }
    ],
    'Venezuela en el Mundo': [
      {
        id: 'id-3-vm-1',
        contenido: 'Nuestro Territorio: Superficie y fronteras. Organización político-territorial. La capital.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Conoce superficie, estados y capitales; y la ciudad capital, Caracas.', oficial: true }
        ]
      }
    ],
    'Pueblos Indígenas': [
      {
        id: 'id-3-pi-1',
        contenido: 'Resistencia Indígena: Lucha ancestral. Organización política. Liderazgos insurgents.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Comprende el significado y la importancia de la resistencia indígena y conoce cómo es el cacicazgo y quienes fueron las principales lideresas y líderes que enfrentaron a la colonización europea.', oficial: true }
        ]
      }
    ],
    'Pueblos Afrovenezolanos': [
      {
        id: 'id-3-pa-1',
        contenido: 'Trabajo y alimentación: Crianza y labores en el hogar. Pilar de la producción colonial. Comidas y sabores africanos.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Conoce que los pueblos afrovenezolanos son los trabajadores que sostienen a la sociedad colonial e Identifica alimentos de origen africano que formen parte de la gastronomía venezolana.', oficial: true }
        ]
      }
    ],
    'Libertador Simón Bolívar': [
      {
        id: 'id-3-sb-1',
        contenido: 'Juventud y compromiso revolucionario: Viajes y educación en Europa. Encuentro y perdida del amor. Juramento por la Libertad.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Reconoce cómo es la juventud de Bolívar, sus viajes a Europa, matrimonio y viudez.', oficial: true },
          { texto: 'Conoce el Juramento en el Monte Sacro como el compromiso que hace Bolívar con la Libertad de América y vida hasta 1810.', oficial: true }
        ]
      }
    ],
    'Nación Agrícola': [
      {
        id: 'id-3-na-1',
        contenido: 'Lucha social y política: Insurgencias campesinas. Defensa de la soberanía. Acontecimientos de los siglos XIX y XX.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Conoce al general Ezequiel Zamora, líder de las luchas campesinas y al general Cipriano Castro, defensor de la soberanía nacional ante el bloqueo extranjero.', oficial: true }
        ]
      }
    ],
    'Nación Petrolera': [
      {
        id: 'id-3-np-1',
        contenido: 'Venezuela Moderna: Claves económicas y políticas del siglo XX.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Reconoce los diferentes presidentes de Venezuela y momentos de la Historia del siglo XX y XXI.', oficial: true }
        ]
      }
    ],
    'Cultura Venezolana': [
      {
        id: 'id-3-cv-1',
        contenido: 'La venezolanidad: Educación liberadora y humanista. El mestizaje. Bandera, escudo e himno nacional.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Conoce a los grandes maestros venezolanos Simón Rodríguez y Luis Beltrán Pietro Figueroa y valora el día del Maestro.', oficial: true },
          { texto: 'Reconoce la diversidad cultural de la población venezolana y comprende el proceso de mestizaje en nuestra Historia.', oficial: true },
          { texto: 'Describe los símbolos patrios y conoce su significado.', oficial: true },
          { texto: 'Conoce el origen de nuestra moneda nacional, el Bolívar.', oficial: true }
        ]
      }
    ],
    'Territorio Productivo': [
      {
        id: 'id-3-tp-1',
        contenido: 'Trabajo y Naturaleza: La naturaleza nos sustenta. Conjuntos regionales. Recorrido histórico.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Reconoce los paisajes naturales y conjuntos regionales: Costa montaña, Llanos y Guayana, así como sus características productivas y conoce momentos de las actividades productivas en la Historia de Venezuela.', oficial: true }
        ]
      }
    ],
    'Sociedad y Ciudadanía': [
      {
        id: 'id-3-sc-1',
        contenido: 'Vivir Juntos y Aprender: Mi comunidad. Normas, respeto y trabajo en equipo. Derechos, deberes y bienestar familiar.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Reconoce la diversidad familiar, comprende la importancia de la planificación familiar, e identifica las necesidades básicas para el bienestar de las familias.', oficial: true },
          { texto: 'Conoce qué es la comunidad, tipos y organizaciones comunitarias; identifica a la escuela como parte de una comunidad más amplia, y valora los diferentes roles de las personas en la comunidad escolar (maestros, estudiantes, personal obrero, etc.).', oficial: true },
          { texto: 'Reconoce la importancia de las normas y reglas para la convivencia en la escuela y desarrolla habilidades para el trabajo en equipo, incluyendo la colaboración y la distribución de tareas.', oficial: true },
          { texto: 'Conoce las señales de tránsito para conductores y peatones.', oficial: true }
        ]
      }
    ]
  },
  '4': {
    'La Humanidad': [
      {
        id: 'id-4-hum-1',
        contenido: 'Tiempo y Escalas: Cronologías. Proceso histórico.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Conoce las unidades del tiempo cronológico mayores al día: años, lustro o quinquenio, década, siglo, milenio, y las escalas del tiempo histórico: corta, mediana y larga duración.', oficial: true }
        ]
      }
    ],
    'Nuestro Mundo': [
      {
        id: 'id-4-nm-1',
        contenido: 'Geografía y Ambiente: Puntos cardinales y unidades espaciales. Escalas espaciales. Impacto del cambio climático.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Identifica los puntos cardinales y conoce las unidades espaciales geográficas: local, regional, nacional, continental y mundial, además de su vivienda y su comunidad dentro de las escalas espaciales en los diversos mapas y cartogramas.', oficial: true },
          { texto: 'Conoce los impactos del cambio climático en la producción mundial de alimentos y su distribución para toda la humanidad, partiendo del reconocimiento y la valoración de los saberes ecológicos ancestrales, la vida en armonía con la naturaleza, para la conservación ambiental y el desarrollo sostenible.', oficial: true }
        ]
      }
    ],
    'Venezuela en el Mundo': [
      {
        id: 'id-4-vm-1',
        contenido: 'Regional, nacional, continental: La comunidad en el mapa. De provincias a estados. América Latina.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Conoce las provincias de la antigua capitanía general de Venezuela e identifica las fronteras actuales e identifica a Venezuela como un país latinoamericano: caribeño, amazónico y andino.', oficial: true },
          { texto: 'Identifica su comunidad en su estado y su estado en Venezuela.', oficial: true }
        ]
      }
    ],
    'Pueblos Indígenas': [
      {
        id: 'id-4-pi-1',
        contenido: 'Poblamiento y producción: Vida en los territorios. Gastronomía regional. Llegada a América.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Conoce la diversidad de nuestra población: su origen y distribución en el territorio nacional y valora la convivencia de los indígenas en armonía con la naturaleza e identifica las diferencias en la economía y en la gastronomía de los pueblos indígenas según su ubicación geográfica.', oficial: true },
          { texto: 'Conoce los diferentes mitos, leyendas, teorías científicas y posiciones actuales sobre el proceso de poblamiento del continente que hoy es América.', oficial: true }
        ]
      }
    ],
    'Colonización Europea': [
      {
        id: 'id-4-ce-1',
        contenido: 'Ocupación y conquista: Navegación y expansión europea. Resistencia indígena en Venezuela y América. Estructura del poder colonial.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Conoce la historia de la colonización europea y la resistencia indígena en las diferentes regiones de Venezuela, así como la resistencia de las grandes civilizaciones: Mayas, Incas, Aztecas, Chibchas y otras.', oficial: true },
          { texto: 'Identifica los cambios económicos y las relaciones producidas tras la colonización europea y conoce la organización del poder colonial español en América, la estructura de la sociedad colonial, el comercio de esclavizados y la creación de la Compañía Guipuzcoana.', oficial: true }
        ]
      }
    ],
    'Pueblos Afrovenezolanos': [
      {
        id: 'id-4-pa-1',
        contenido: 'Resistencia histórica: Vida en libertad. Rebeliones contra el sistema colonial Heroínas y héroes.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Conoce a los cumbes y al cimarronaje, como formas de lucha por la libertad e identifica momentos y personajes de la insurgencia afrovenezolana.', oficial: true }
        ]
      }
    ],
    'Liberación de América': [
      {
        id: 'id-4-la-1',
        contenido: 'Comienza la Independencia: Levantamientos y rebeliones populares. La Revolución patriota.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Describe las insurgencias contra el dominio español en diferentes regiones de Venezuela a finales del siglo XVIII y principios del siglo XIX y estudia la revolución patriota de 1810 y la creación de la junta de gobierno.', oficial: true }
        ]
      }
    ],
    'Libertador Simón Bolívar': [
      {
        id: 'id-4-sb-1',
        contenido: 'Líder de la Independencia: Misión diplomática en Londres. Revolucionario patriota. Exilio en la Nueva Granada.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Describe cómo Simón Bolívar se convierte en el líder de la lucha por la Independencia en Venezuela y América del Sur, y reconoce la significativa participación de las heroínas y los héroes de la contienda.', oficial: true },
          { texto: 'Conoce las ideas principales del Discurso ante la Sociedad Patriótica y el Manifiesto de Cartagena', oficial: true }
        ]
      }
    ],
    'Territorio Productivo': [
      {
        id: 'id-4-tp-1',
        contenido: 'Organización económica del territorio: Uso de los espacios geográficos. Conformación de los centros urbanos.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Conoce la historia del uso de los espacios geográficos, su transformación a lo largo del tiempo y estudia la consolidación de la Venezuela petrolera, el desarrollo histórico de los espacios urbanos y la construcción de las ciudades nacen.', oficial: true }
        ]
      }
    ],
    'Cultura Venezolana': [
      {
        id: 'id-4-cv-1',
        contenido: 'Nuestro patrimonio: Las festividades. Símbolos patrios y naturales. Gastronomía regional y cultura del maíz. Espacios con Historia colectiva.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Conoce las tradiciones vinculadas al sincretismo religioso y el calendario festivo en cada región y valora los cuentos, mitos, leyendas y sus variedades en cada región.', oficial: true },
          { texto: 'Conoce los símbolos patrios: la bandera, el escudo y el himno nacional, y nuestros símbolos naturales nacionales: la orquídea, el turpial y el araguaney, y describe el significado de los símbolos utilizados en la bandera y de sus colores, según la teoría del color.', oficial: true },
          { texto: 'Conoce y valora nuestro patrimonio gastronómico y nuestro patrimonio histórico-cultural expresado en plazas, edificios públicos, estatuaria, lugares de memoria, monumentos culturales, etc', oficial: true }
        ]
      }
    ],
    'Sociedad y Ciudadanía': [
      {
        id: 'id-4-sc-1',
        contenido: 'Convivencia y Derechos: Valores para la vida en común. Conocimiento de las leyes. Comportamiento en espacios públicos.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Conoce la Constitución y un conjunto de leyes vinculadas con derechos de las niñas, niños y adolescentes; los derechos de protección a la familia venezolana y los derechos de la humanidad.', oficial: true },
          { texto: 'Identifica las necesidades básicas de la humanidad: la alimentación, la vivienda, el vestido y calzado, los servicios como la salud, la recreación y el transporte y reconoce los derechos a los servicios públicos, es especial, el acceso al agua que es un recurso de vital importancia para la vida, la salud y la higiene.', oficial: true },
          { texto: 'Aprende sobre normas de comportamiento y convivencia en espacios públicos que nos son comunes como: las plazas, los parques urbanos y naturales, y edificios públicos, entre otros.', oficial: true }
        ]
      }
    ]
  },
  '5': {
    'Nuestro Mundo': [
      {
        id: 'id-5-nm-1',
        contenido: 'Retos del mundo actual: Efectos del cambio climático. Cuidado ambiental.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Reflexiona sobre el cambio climático y el calentamiento global, y conoce los acuerdos suscritos por los países del mundo para comprometerse a reducir los embates de sus consecuencias y conoce el reciclaje como forma de contribuir al cuidado del ambiente.', oficial: true }
        ]
      }
    ],
    'Venezuela en el Mundo': [
      {
        id: 'id-5-vm-1',
        contenido: 'Variedad natural: Clima y vegetación. Ciclo del agua. La biodiversidad.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Conoce el clima de Venezuela y sus variaciones, así como la distribución de la vegetación según la altura y los pisos térmicos e identifica el ciclo del agua y su influencia en las actividades económicas.', oficial: true },
          { texto: 'Descubre la extensa biodiversidad venezolana y valora los manglares, montañas, sabanas y mesetas, como un elemento esencial de la diversidad de especies de flora y fauna que resguardan y valora el relieve y la riqueza mineral de su subsuelo y la población en las Cordilleras de los Andes y Central. Las sierras de Perijá y Falcón, y las colinas y mesetas del estado Bolívar.', oficial: true }
        ]
      }
    ],
    'Pueblos Afrovenezolanos': [
      {
        id: 'id-5-pa-1',
        contenido: 'Patrimonio afrovenezolano: Legado lingüístico. Deidades y creencias. Creación artística. El trabajo.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Reconoce la herencia africana en aspectos de la identidad venezolana como el lenguaje, las prácticas religiosas, la gastronomía y las formas de trabajo productivo.', oficial: true }
        ]
      }
    ],
    'Liberación de América': [
      {
        id: 'id-5-la-1',
        contenido: 'Unidad y Patria: Movimientos revolucionarios. Liderazgo continental. El proyecto bolivariano.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Reconoce las acciones patriotas simultáneas que ocurrían en América, así como el liderazgo de la lucha continental, con énfasis en la vida y obra de Manuela Sáenz y conoce el proyecto bolivariano de unión y paz entre las naciones americanas, sus fortalezas y desafíos.', oficial: true }
        ]
      }
    ],
    'Libertador Simón Bolívar': [
      {
        id: 'id-5-sb-1',
        contenido: 'El Libertador: Desde la Campaña Admirable a la de Carabobo. Liberación del Sur. Congreso Anfictiónico de Panamá.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Conoce las ideas principales de la Carta de Jamaica sobre la identidad y el proyecto de la unión de la lucha en América.', oficial: true },
          { texto: 'Identifica las campañas militares y acciones políticas del Libertador en Venezuela, la Nueva Granada, el Caribe, Ecuador y Perú.', oficial: true }
        ]
      }
    ],
    'Nación Agrícola': [
      {
        id: 'id-5-na-1',
        contenido: 'República de terratenientes: Dependencia y exclusión social. Caudillismo y la oligarquía. Guerra Federal.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Describe las características de la economía, la política y sociedad de Venezuela a partir de 1830, y conoce y vincula los términos: caudillismo, oligarquía, y el proceso de la Guerra Federal.', oficial: true }
        ]
      }
    ],
    'Territorio Productivo': [
      {
        id: 'id-5-tp-1',
        contenido: 'Regiones y la economía productiva: Espacios rurales y urbanos. Importancia de la siembra. Cacao, café y petróleo. Recursos minerales y energéticos.',
        oficial: true,
        // Corrección editorial: Grado 5°, Pág. 138. En el PDF aparece duplicado un segundo bloque "Organización económica del territorio" idéntico al de 4° grado. Se consolida en este bloque de 5° que comprende la economía productiva integral.
        notaEditorial: 'Grado 5°, Pág. 138: Se consolidó la entrada repetida de Territorio Productivo para evitar redundancia en la selección del docente.',
        aprendizajesEsperados: [
          { texto: 'Comprende la diferencia entre los espacios rurales y urbanos, y el uso y organización de estos espacios según las necesidades de cada época y valora la importancia de la siembra de alimentos para el consumo de la sociedad a nivel nacional.', oficial: true },
          { texto: 'Conoce los problemas históricos y geográficos sobre la distribución y propiedad de las tierras, la agricultura campesina, el conuco como práctica productiva familiar y comunal, y el sistema de latifundio en la producción agrícola.', oficial: true },
          { texto: 'Reconoce la diferencia de la vida urbana o rural según el rubro económico predominante de cada región de Venezuela e identifica la actividad económica derivada de los principales productos económicos de Venezuela a lo largo de su historia: cacao, café y petróleo.', oficial: true },
          { texto: 'Identifica el soporte natural de los espacios agrarios: el suelo y tipos de suelo, el agua, el clima, el relieve, la flora y la fauna.', oficial: true },
          { texto: 'Estudia la ubicación geográfica de las refinerías y cuencas petroleras, reconoce la importancia económica de los recursos minerales (petróleo, gas, hierro, oro, coltán, aluminio, bauxita, entre otros) para la nación y valora su resguardo y preservación.', oficial: true }
        ]
      }
    ],
    'Cultura Venezolana': [
      {
        id: 'id-5-cv-1',
        contenido: 'Identidad y tradiciones venezolanas: Cultura popular. Recorrido del tricolor nacional.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Valora las diversas expresiones, así como los patrimonios culturales materiales e inmateriales que nos identifican como pueblo, este contexto vincula la Historia de nuestra bandera y sus transformaciones a lo largo del tiempo.', oficial: true }
        ]
      }
    ],
    'Sociedad y Ciudadanía': [
      {
        id: 'id-5-sc-1',
        contenido: 'Ciudadanía activa: Pensamiento bolivariano. Economía familiar. Derechos y deberes para la vida democrática.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Estudia qué es ser ciudadano a partir del pensamiento bolivariano, así como las características de la ciudadanía que debería ejercer una República independiente.', oficial: true },
          { texto: 'Conoce los tipos de familia venezolanas y sus dinámicas económicas, así mismo valora la mujer como eje en el sostenimiento de las dinámicas familiares.', oficial: true },
          { texto: 'Conoce nuestros derechos sociales y la participación en la vida política y civil del país, defendiendo los derechos humanos para que sea posible la convivencia democrática y la paz social.', oficial: true },
          { texto: 'Conoce la estructura de la división de los poderes políticos a nivel local, regional y nacional en nuestro país.', oficial: true },
          { texto: 'Aprende sobre hábitos de higiene y salud pública, así como sobre la gestión de los desechos propios en espacios comunes.', oficial: true }
        ]
      }
    ]
  },
  '6': {
    'Nuestro Mundo': [
      {
        id: 'id-6-nm-1',
        contenido: 'Espacio, ambiente y sustentabilidad: Nuestro patrimonio natural. Gestión de desechos y reciclaje.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Estudia los signos o características del espacio físico-natural en su comunidad y reconoce y valora nuestro patrimonio natural.', oficial: true },
          { texto: 'Conoce nuestros deberes ambientales y aprende sobre la gestión del reciclaje y la gestión de nuestros propios desechos domésticos.', oficial: true }
        ]
      }
    ],
    'Venezuela en el Mundo': [
      {
        id: 'id-6-vm-1',
        contenido: 'Geopolítica: Caracas como metrópoli. Petróleo, fronteras y soberanía. Organismos multilaterals.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Valora la ciudad de Caracas por su geografía, aprende sobre su proceso de transformación paisajística, conoce la región central norte del país y entiende el establecimiento de Caracas como la ciudad capital.', oficial: true },
          { texto: 'Estudia el espacio geográfico de la Venezuela petrolera y sus dinámicas fronterizas, profundizando en los conceptos de seguridad y soberanía.', oficial: true },
          { texto: 'Reconoce los hechos que dan inicio al siglo XX, con un gobierno nacionalista que enfrenta el bloqueo de potencias europeas en nuestras costas.', oficial: true },
          { texto: 'Entiende el sentido de la frase “La Patria grande es nuestra América” a partir del proyecto de unión de los países de América y el Caribe, impulsado por el Precursor Francisco de Miranda y concretado por el Libertador Simón Bolívar.', oficial: true }
        ]
      }
    ],
    'Pueblos Indígenas': [
      {
        id: 'id-6-pi-1',
        contenido: 'Derechos ancestrales: Constitución de la República Bolivariana. Vida en el territorio.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Respeta los derechos de los pueblos indígenas sobre la propiedad y el uso de la tierra para la vida.', oficial: true }
        ]
      }
    ],
    'Pueblos Afrovenezolanos': [
      {
        id: 'id-6-pa-1',
        contenido: 'Sociedad intercultural: Diversidad afrovenezolana. Inclusión integral. Igualdad y respeto.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Conoce los aportes de las comunidades afrodescendientes para la construcción de una sociedad más justa e inclusiva.', oficial: true }
        ]
      }
    ],
    'Libertador Simón Bolívar': [
      {
        id: 'id-6-sb-1',
        contenido: 'Pensamiento bolivariano: Igualdad y Justicia Social. Práctica de la Independencia. Unidad de los pueblos americanos.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Conoce las ideas principales del Discurso de Angostura sobre la Igualdad, la Independencia y la Unidad de los pueblos americanos.', oficial: true },
          { texto: 'Identifica las características e importancia de la gran República de Colombia.', oficial: true }
        ]
      }
    ],
    'Nación Petrolera': [
      {
        id: 'id-6-np-1',
        contenido: 'Economía petrolera: Recorrido económico venezolano. El surgimiento del petróleo. La industria de los hidrocarburos.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Conoce los inicios del gomecismo, el proceso de tránsito de la economía agrícola a la petrolera (y el surgimiento comercial del petróleo como producto de exportación), y en el contexto geohistórico de la Venezuela rural a urbana estudia el crecimiento demográfico de Venezuela entre 1940 y 1960.', oficial: true },
          { texto: 'Conoce el proceso histórico de la industria petrolera a partir de 1950: Mercados y precios petroleros, fundación de la OPEP, la llamada nacionalización del petróleo y su Historia, creación de PDVSA.', oficial: true }
        ]
      }
    ],
    'Territorio Productivo': [
      {
        id: 'id-6-tp-1',
        contenido: 'Actividad Industrial: Historia y distribución de la actividad petrolera. Paisajes urbanos e industriales de Venezuela. Sistema de distribución de electricidad.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Conoce el impacto de la economía petrolera en el ambiente, así como en la población, y las transformaciones y contrastes entre los paisajes urbanos e industriales del país, también conoce los tipos de industrias que existen en Venezuela: livianas, intermedias y básicas, además aprende sobre el sistema de distribución de electricidad a nivel nacional.', oficial: true }
        ]
      }
    ],
    'Sociedad y Ciudadanía': [
      {
        id: 'id-6-sc-1',
        contenido: 'Participación Ciudadana: Democracia participativa. Derechos y deberes ciudadanos. Normas de convivencia y seguridad vial.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Conoce la sociedad que surge a partir de la dinámica económica petrolera, entiende la diferencia entre democracia representativa y democracia participativa; y valora la Mujer como factor fundamental en el desarrollo políticos, sociales y económicos en la construcción de la Venezuela y latinoamérica actual.', oficial: true },
          { texto: 'Aprende sobre convivencia ciudadana, las leyes de tránsito y circulación, la vida organizada en espacios comunes y conoce nuestros deberes y derechos sociales, a fin de lograr la convivencia democrática y la paz social.', oficial: true }
        ]
      }
    ],
    'Democracia Venezolana': [
      {
        id: 'id-6-dv-1',
        contenido: 'Política del siglo XX: Gomecismo y apertura democrática. Perejimenismo y Puntofijismo. Revolución Bolivariana.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Estudia el movimiento de la Generación del 28 contra Juan Vicente Gómez; la apertura a la democracia entre 1936 y 1945 bajo los gobiernos de Eleazar López Contreras e Isaías Medina Angarita, y la legalización de los partidos políticos, así como los sucesos del golpe de Estado del 18 de octubre de 1945 y el poder de la Junta Revolucionaria de Gobierno.', oficial: true },
          { texto: 'Estudia el gobierno de Rómulo Gallegos, su política petrolera y su declive tras el golpe de Estado del 24 de noviembre de 1948, cuando asume el poder la Junta Militar de Gobierno.', oficial: true },
          { texto: 'Conoce la Historia de la dictadura de Marcos Pérez Jiménez y las luchas contra ese gobierno, valora el 23 de enero de 1958, como la fecha histórica en la que cae la dictadura perezjimenista y conoce sobre el pacto de Punto Fijo y la Historia de la lucha armada que insurgió contra el poder político de los partidos AD y COPEI.', oficial: true },
          { texto: 'Estudia el ocaso del puntofijismo; el Viernes Negro en 1983, el Caracazo en 1989 y las rebeliones militares de 1992 y estudia la presidencia de Hugo Chávez como un nuevo modelo de gobierno popular.', oficial: true }
        ]
      }
    ],
    'Cultura Venezolana': [
      {
        id: 'id-6-cv-1',
        contenido: 'Identidad venezolana: Herencia diversa. Expresiones vivas. Nuestros saberes.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Conoce e identifica a las manifestaciones más representativas de nuestra cultura popular, cultura urbana y cultura académica, considerándolas como formas constitutivas de nuestra Identidad Nacional.', oficial: true }
        ]
      }
    ]
  }
};
