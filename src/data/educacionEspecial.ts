// DATOS OFICIALES PARA EDUCACIÓN ESPECIAL - LINEAMIENTOS MPPE 2026-2027
// TALLER DE EDUCACIÓN LABORAL (TEL), INSTITUTOS DE EDUCACIÓN ESPECIAL (IEE), AULAS INTEGRADAS, CAIPA

export interface CondicionNEE {
  id: string;
  nombre: string;
  descripcion: string;
  ajustesClave: string[];
}

export interface EspecialidadSocioproductiva {
  id: string;
  nombre: string;
  menciones: string[];
  motorProductivo: string;
  productosTipicos: string[];
}

export interface AreaEspecialData {
  nombre: string;
  temaIndispensable: string;
  temaGenerador: string;
  enfasisCurricular: string;
  tejidoTematico: string;
  referentesTeoricos: string[];
  estrategiasRecomendadas: string[];
  tecnicasRecomendadas: string[];
  duaSugerido: {
    representacion: string[];
    accionExpresion: string[];
    implicacion: string[];
  };
  ajustesRazonablesSugeridos: string[];
}

export const CONDICIONES_EDUCACION_ESPECIAL: CondicionNEE[] = [
  {
    id: 'autismo',
    nombre: 'Trastorno del Espectro Autista (TEA)',
    descripcion: 'Condición del neurodesarrollo caracterizada por variaciones en la comunicación, interacción social y patrones de conducta o procesamiento sensorial.',
    ajustesClave: [
      'Agendas visuales y pictogramas anticipatorios estructurados',
      'Minimizar sobrecargas sensoriales (ruido excesivo, luces parpadeantes)',
      'Instrucciones directas, concretas y paso a paso (evitar metáforas ambiguas)',
      'Espacio de autorregulación sensorial (zona de calma o descompresión)',
      'Rutinas predecibles y anticipación verbal/visual antes de transiciones'
    ]
  },
  {
    id: 'intelectual',
    nombre: 'Discapacidad Intelectual / Síndrome de Down',
    descripcion: 'Limitaciones en el funcionamiento intelectual y la conducta adaptativa, con excelente respuesta al modelado práctico y repetición funcional.',
    ajustesClave: [
      'Modelado práctico "aprender haciendo" (yo lo hago, lo hacemos juntos, tú lo haces)',
      'Material concreto, palpable y visual en lugar de abstracciones teóricas',
      'Segmentación de tareas complejas en micro-pasos sucesivos',
      'Refuerzo positivo inmediato y celebración de avances funcionales',
      'Dosificación del tiempo con descansos programados'
    ]
  },
  {
    id: 'tdah',
    nombre: 'Trastorno por Déficit de Atención e Hiperactividad (TDAH)',
    descripcion: 'Dificultades en la atención sostenida, autorregulación del movimiento e impulsividad, con alta creatividad y energía.',
    ajustesClave: [
      'Pausas activas y dinamismo motor guiado en el taller',
      'Ubicación estratégica lejos de ventanas o estímulos distractores',
      'Listas de cotejo visuales para marcar tareas completadas',
      'Variar actividades entre teoría muy corta (3-5 min) y práctica manual activa',
      'Fomentar roles de liderazgo y responsabilidades activas en el aula/taller'
    ]
  },
  {
    id: 'motora',
    nombre: 'Compromiso Motor / Parálisis Cerebral / Movilidad Reducida',
    descripcion: 'Afectaciones neuromotoras que requieren adaptaciones posturales, de agarre y accesibilidad en el espacio físico.',
    ajustesClave: [
      'Herramientas adaptadas (mangos engrosados, tijeras de rebote, antideslizantes)',
      'Mesas y planos de trabajo a altura adecuada con espacio para sillas de ruedas',
      'Tiempo extendido para actividades de motricidad fina',
      'Uso de tecnología de asistencia o tableros de respuesta con pulsadores',
      'Asistencia física graduada (mano sobre mano con desvanecimiento)'
    ]
  },
  {
    id: 'auditiva',
    nombre: 'Discapacidad Sensorial Auditiva (Hipoacusia / Sordera)',
    descripcion: 'Pérdida auditiva que requiere mediación mediante Lengua de Señas Venezolana (LSV) y estímulos predominantemente visuales.',
    ajustesClave: [
      'Uso de Lengua de Señas Venezolanas (LSV) y expresión facial/corporal clara',
      'Claves luminosas y visuales para cambios de actividad o avisos',
      'Ubicación frente al docente para facilitar la lectura labiofacial y contacto visual',
      'Rotulado con imágenes y texto escrito de herramientas y materiales',
      'Demostración visual continua antes de cada procedimiento'
    ]
  },
  {
    id: 'visual',
    nombre: 'Discapacidad Sensorial Visual (Baja Visión / Ceguera)',
    descripcion: 'Disminución visual significativa que requiere apoyo táctil, auditivo, sistema Braille y contrastes lumínicos.',
    ajustesClave: [
      'Materiales con texturas diferenciadas, relieve y sistema Braille',
      'Instrucciones auditivas descriptivas detalladas paso a paso',
      'Alto contraste visual (letras negras sobre fondo amarillo o blanco) para baja visión',
      'Organización fija del taller para evitar obstáculos y propiciar autonomía espacial',
      'Uso de macro-tipos e iluminación adecuada no deslumbrante'
    ]
  },
  {
    id: 'aprendizaje',
    nombre: 'Dificultades Específicas de Aprendizaje (Aula Integrada / UPE)',
    descripcion: 'Desafíos en lectura, escritura o cálculo en estudiantes que asisten a educación regular con apoyo psicopedagógico especializado.',
    ajustesClave: [
      'Métodos multisensoriales para lectoescritura (táctil, visual, fonológico)',
      'Flexibilidad en la evaluación (permitir respuestas orales o gráficas)',
      'Uso de calculadoras, tablas de multiplicar de apoyo y material manipulativo',
      'Adecuación de textos con tipografía legible y espaciado amplio',
      'Refuerzo de la autoestima y motivación intrínseca'
    ]
  },
  {
    id: 'multiple',
    nombre: 'Multidiscapacidad / Sordoceguera / Retos Múltiples',
    descripcion: 'Concurrencia de dos o más condiciones que requieren un abordaje transdisciplinario altamente personalizado y sensorial.',
    ajustesClave: [
      'Estímulos multisensoriales (aromaterapia, texturas, música suave, vibración)',
      'Planificación individualizada paso a paso con mediador constante',
      'Comunicación táctil y objetos de referencia para anticipar rutinas',
      'Respeto absoluto al ritmo biopsicosocial y tiempos de respuesta extendidos',
      'Coordinación estrecha con la familia y especialistas de salud'
    ]
  }
];

export const SERVICIOS_MODALIDAD_ESPECIAL = [
  { id: 'TEL', nombre: 'Taller de Educación Laboral (TEL)', descripcion: 'Capacitación socioproductiva e inserción sociolaboral para adolescentes y adultos jóvenes con discapacidad.' },
  { id: 'IEE', nombre: 'Instituto de Educación Especial (IEE)', descripcion: 'Atención pedagógica integral especializada para niños y niñas en edad escolar básica.' },
  { id: 'Aula Integrada', nombre: 'Aula Integrada / Unidad Psicoeducativa (UPE)', descripcion: 'Servicio de apoyo y adaptaciones curriculares dentro de la escuela regular (inclusión educativa).' },
  { id: 'CAIPA', nombre: 'Centro de Atención Integral para Personas con Autismo (CAIPA)', descripcion: 'Atención integral especializada, evaluación diagnóstica y acompañamiento para la condición del espectro autista.' },
  { id: 'CDIT', nombre: 'Centro de Desarrollo Infantil (CDI/CDIT)', descripcion: 'Atención y estimulación temprana integral para infantes de 0 a 6 años con necesidades especiales.' }
];

export const ESPECIALIDADES_SOCIOPRODUCTIVAS: EspecialidadSocioproductiva[] = [
  {
    id: 'panaderia',
    nombre: 'Panadería y Pastelería Básica',
    menciones: ['Auxiliar de Panadería', 'Elaboración de Pasapalos', 'Repostería Criolla y Casera', 'Envasado y Empaque de Galletas'],
    motorProductivo: 'Motor Agroalimentario',
    productosTipicos: ['Pan dulce campesino', 'Galletas de avena y coco', 'Polvorosas y suspiros', 'Ponqués nutritivos', 'Pan de jamón artesanal']
  },
  {
    id: 'textil',
    nombre: 'Confección Textil y Costura Adaptada',
    menciones: ['Costura a Mano y Máquina', 'Elaboración de Lencería para el Hogar', 'Confección de Uniformes y Bolsos', 'Bordado y Estampado'],
    motorProductivo: 'Motor Industrial y Comunal',
    productosTipicos: ['Delantales y gorros de cocina', 'Bolsas ecológicas de tela', 'Agarraderas y manteles', 'Cojines decorativos', 'Cartucheras escolares']
  },
  {
    id: 'agricultura',
    nombre: 'Horticultura, Huerto Escolar y Jardinería',
    menciones: ['Viverismo y Plantas Ornamentales', 'Cultivo de Hortalizas y Conuco Escolar', 'Elaboración de Compost y Abono Orgánico', 'Cuidado de Áreas Verdes'],
    motorProductivo: 'Motor Agroalimentario y Ecosocialista',
    productosTipicos: ['Plantas aromáticas y medicinales en macetas', 'Cilantro, ají dulce y pimentón', 'Compost orgánico embolsado', 'Macetas ecológicas con reciclaje']
  },
  {
    id: 'limpieza',
    nombre: 'Elaboración de Productos de Higiene y Limpieza',
    menciones: ['Fabricación de Desinfectantes', 'Elaboración de Jabones Artesanales', 'Dosificación de Cloro y Ceras', 'Etiquetado y Control de Calidad'],
    motorProductivo: 'Motor Farmacéutico y Químico Comunal',
    productosTipicos: ['Desinfectante aromatizado con lavanda y pino', 'Jabón líquido multiuso', 'Jabones corporales de avena y miel', 'Cloro al 5% institucional']
  },
  {
    id: 'manualidades',
    nombre: 'Manualidades, Artesanía y Reciclaje Creativo',
    menciones: ['Papelería y Encuadernación Artesanal', 'Modelado en Foami y Arcilla', 'Elaboración de Piñatas y Cotillones', 'Bisutería y Tejido'],
    motorProductivo: 'Motor Comunal y Emprendimiento',
    productosTipicos: ['Libretas encuadernadas con hojas recicladas', 'Portarretratos artesanales', 'Piñatas tradicionales de cartón', 'Llaveros y recuerdos institucionales']
  },
  {
    id: 'carpinteria',
    nombre: 'Carpintería Básica y Restauración de Mobiliario',
    menciones: ['Lijado y Preparación de Superficies', 'Ensamblaje Sencillo de Madera', 'Pintura y Barnizado Ecológico', 'Reparación de Pupitres y Mesas'],
    motorProductivo: 'Motor Construcción y Comunal',
    productosTipicos: ['Tablas para picar cocina', 'Percheros de madera', 'Juguetes didácticos en madera', 'Pupitres y sillas escolares reacondicionados']
  },
  {
    id: 'informatica',
    nombre: 'Computación e Informática Adaptada',
    menciones: ['Transcripción Digital de Documentos', 'Diseño de Identificadores y Carnets', 'Digitalización y Fotocopiado', 'Operación Básica de Oficina'],
    motorProductivo: 'Motor Telecomunicaciones e Informática',
    productosTipicos: ['Carnets escolares plastificados', 'Fichas pedagógicas impresas', 'Etiquetas adhesivas para productos del taller', 'Catálogos digitales sencillos']
  }
];

export const AREAS_CONOCIMIENTO_ESPECIAL: Record<string, AreaEspecialData> = {
  'lenguaje': {
    nombre: 'Prácticas del Lenguaje',
    temaIndispensable: 'Comunicación y el Debate / La Comunicación en la Sociedad Actual',
    temaGenerador: 'Identidad y Comunicación para la Vida Diaria',
    enfasisCurricular: 'Oralidad, escritura y lectura adaptada a la vida cotidiana',
    tejidoTematico: 'Identidad Personal. La Comunicación en el Convivir Cotidiano de los Jóvenes y su Socialización en el Taller.',
    referentesTeoricos: [
      'Identificación Personal (nombre, datos personales, dirección de emergencia).',
      'Comunicación Oral, gestual, apoyada en pictogramas o Lengua de Señas Venezolanas (LSV).',
      'Lectura funcional con pictogramas: recetas, órdenes de trabajo, etiquetas de productos.',
      'Alfabetización Tecnológica básica: programa Infoedutel y uso de dispositivos.',
      'Exponer o narrar con apoyos visuales los pasos de elaboración de un producto en la línea de producción.',
      'Vocabulario técnico y de seguridad del taller.'
    ],
    estrategiasRecomendadas: [
      'Aprendizaje Colaborativo con mediación docente constante.',
      'Aprendizaje Basado en Proyectos y Problemas Cotidianos (ABP).',
      'Gamificación pedagógica con tarjetas de emparejamiento visual.',
      'Modelado paso a paso con mediación "mano sobre mano" desvanecida.'
    ],
    tecnicasRecomendadas: [
      'Lluvia de ideas mediante tablero de pictogramas.',
      'Juego de roles de atención al cliente y presentación personal.',
      'Seguimiento visual de secuencias y recetas ilustradas.',
      'Conversación socializada en asamblea matutina.'
    ],
    duaSugerido: {
      representacion: [
        'Múltiples formas de representación: videos demostrativos, pictogramas ARASAAC, muestras físicas reales de ingredientes o herramientas.',
        'Textos en lectura fácil con letra grande y contraste visual elevado.'
      ],
      accionExpresion: [
        'Múltiples formas de acción y expresión: selección de pictogramas, trabajo manual directo, demostración gestual o dramatizada del procedimiento.',
        'Elaboración de recetarios ilustrados o fichas de pasos.'
      ],
      implicacion: [
        'Múltiples formas de implicación y motivación: elección libre de tareas dentro del equipo, refuerzo social constante, exposición y muestra con orgullo del trabajo final.'
      ]
    },
    ajustesRazonablesSugeridos: [
      'Claves visuales codificadas por colores para cada paso.',
      'Apoyo audiovisual con repetición de instrucciones breves.',
      'Dosificación del tiempo y pausas activas ante signos de fatiga o frustración.'
    ]
  },
  'matematica': {
    nombre: 'Matemática (Matemática para la Vida)',
    temaIndispensable: 'Proceso Social del Trabajo / Ciencia e Innovación para el Buen Vivir',
    temaGenerador: 'Medidas, Peso y Manejo del Dinero en el Taller',
    enfasisCurricular: 'Matemática para la vida y funcionalidad económica',
    tejidoTematico: 'Los instrumentos de medición y su utilización práctica en la línea de producción y comercialización.',
    referentesTeoricos: [
      'Matemática Básica adaptada a la especialidad ocupacional y mención.',
      'Clasificación, agrupamiento y conteo de materia prima y productos terminados.',
      'Unidades de masa: peso en kilogramos y gramos con balanza digital/mecánica.',
      'Unidades de capacidad o volumen: litros, mililitros, tazas y cucharas dosificadoras.',
      'Sistema métrico: uso de cinta métrica, reglas y plantillas pre-cortadas.',
      'Administración básica: costos de materia prima, precios de venta y cálculo de vuelto.'
    ],
    estrategiasRecomendadas: [
      'Práctica simulada con billetes y monedas didácticas en feria escolar.',
      'Medición directa con balanzas e instrumentos reales del taller.',
      'Resolución de problemas de empaque y distribución por lotes.'
    ],
    tecnicasRecomendadas: [
      'Rutina diaria de registro de cantidades producidas.',
      'Tablas de doble entrada ilustradas con dibujos para llevar inventario.',
      'Juego de roles: vendedor y comprador en la expo-venta.'
    ],
    duaSugerido: {
      representacion: [
        'Material manipulativo concreto (fichas, bloques, recipientes medidores etiquetados).',
        'Tablas con colores para diferenciar decenas, unidades o pesos.'
      ],
      accionExpresion: [
        'Registro con palotes, sellos o números adhesivos en formato grande.',
        'Pesaje asistido con indicadores luminosos en la balanza.'
      ],
      implicacion: [
        'Conexión directa con la utilidad del dinero para compras personales reales.',
        'Metas de producción accesibles que generan sentido de logro.'
      ]
    },
    ajustesRazonablesSugeridos: [
      'Uso de plantillas pre-medidas para cortar o dosificar sin necesidad de cálculo abstracto.',
      'Calculadoras de teclas grandes con colores diferenciados.',
      'Acompañamiento cercano durante transacciones monetarias.'
    ]
  },
  'ciencias': {
    nombre: 'Ciencias Naturales y Salud Integral',
    temaIndispensable: 'La Salud Integral y el Vivir Bien / Preservación de la Vida en el Planeta',
    temaGenerador: 'El Ambiente, Bioseguridad y Transformación de la Materia',
    enfasisCurricular: 'Salud, ambiente y agroecología aplicada',
    tejidoTematico: 'Ambiente, biodiversidad, soberanía alimentaria y normas de bioseguridad en el taller socioproductivo.',
    referentesTeoricos: [
      'Ambiente y protección: ahorro de agua y energía en el espacio laboral.',
      'Manejo de desechos y recursos aprovechables (reciclaje, compostaje, reducción de mermas).',
      'Equipos de Protección Personal (EPP): uso correcto de gorros, guantes, delantales y calzado de seguridad.',
      'Higiene personal y manipulación higiénica de alimentos o sustancias químicas.',
      'Transformaciones de la materia: mezcla homogénea y heterogénea, calor y cocción, fermentación.'
    ],
    estrategiasRecomendadas: [
      'Demostración sensorial directa de sustancias, texturas y olores.',
      'Práctica vivencial de lavado clínico de manos con luz ultravioleta o tinte vegetal.',
      'Jornadas de siembra en el conuco escolar y clasificación de residuos.'
    ],
    tecnicasRecomendadas: [
      'Lista de verificación visual de bioseguridad antes de ingresar al taller.',
      'Cuadro de normas de seguridad con pictogramas de prohibición y precaución.',
      'Simulacros de primeros auxilios y evacuación segura.'
    ],
    duaSugerido: {
      representacion: [
        'Carteleras con fotos reales de los estudiantes usando el equipo de protección correcto.',
        'Videos cortos demostrativos de hábitos de aseo y cuidado de la salud.'
      ],
      accionExpresion: [
        'Clasificación física de desechos en contenedores de colores asignados.',
        'Demostración práctica del protocolo de desinfección de mesas de trabajo.'
      ],
      implicacion: [
        'Reconocimiento del autocuidado y cuidado de sus compañeros como valor esencial.'
      ]
    },
    ajustesRazonablesSugeridos: [
      'Guantes hipoalergénicos sin talco para estudiantes con hipersensibilidad táctil.',
      'Protectores auditivos para momentos con ruido de licuadoras o maquinarias.',
      'Etiquetas con pictogramas de advertencia de "peligro/caliente/tóxico".'
    ]
  },
  'gcrp': {
    nombre: 'G.C.R.P. (Grupos de Creación, Recreación y Producción)',
    temaIndispensable: 'Proceso Social del Trabajo / Soberanía Cultural y Productiva',
    temaGenerador: 'Acciones Diarias en el Desarrollo de Procesos Productivos',
    enfasisCurricular: 'Innovación para la Productividad y Trabajo Liberador',
    tejidoTematico: 'Valoración de los riesgos, beneficios y fases a seguir en el desarrollo de la línea de producción del taller.',
    referentesTeoricos: [
      'Línea de producción: selección de materia prima, pesado, mezclado, moldeado, empaque y presentación.',
      'Control de calidad artesanal del producto terminado.',
      'Cultura productiva comunitaria y valor social del trabajo liberador.',
      'Manejo seguro de herramientas manuales y mecánicas adaptadas.',
      'Exhibición, etiquetado y expo-venta en la comunidad y circuito educativo.'
    ],
    estrategiasRecomendadas: [
      'Organización del taller por estaciones de trabajo secuenciadas.',
      'Rotación guiada de roles según potencialidades individuales.',
      'Organización de la expo-venta institucional comunitaria.'
    ],
    tecnicasRecomendadas: [
      'Planilla de registro de producción diaria simplificada.',
      'Técnica de cadena de montaje colaborativa (cada uno aporta un paso clave).',
      'Fotodocumentación del progreso de los participantes.'
    ],
    duaSugerido: {
      representacion: [
        'Diagrama de flujo visual en la pared del taller con el paso 1 al paso 6.',
        'Muestras del "producto patrón" como referencia de calidad visible.'
      ],
      accionExpresion: [
        'Ejecución del paso asignado con apoyos ergonómicos y herramientas personalizadas.',
        'Firma o estampado de la marca personal del estudiante en el empaque.'
      ],
      implicacion: [
        'Orgullo de ver un producto terminado listo para comercializar.',
        'Celebración colectiva al alcanzar la meta de producción semanal.'
      ]
    },
    ajustesRazonablesSugeridos: [
      'Guías físicas en las mesas (topes de madera, marcas con cinta adhesiva de colores).',
      'Herramientas con adaptadores ergonómicos para prensión palmar débil.',
      'Monitoreo continuo de fatiga postural con sillas ergonómicas.'
    ]
  },
  'orientacion': {
    nombre: 'Orientación y Convivencia',
    temaIndispensable: 'Identidad, Autoestima y Proyecto de Vida',
    temaGenerador: 'Identidad Personal y Habilidades para la Vida Independiente',
    enfasisCurricular: 'Valores, convivencia pacífica y proyecto ético de vida',
    tejidoTematico: 'Valoración de la autonomía personal, respeto recíproco y resolución pacífica de situaciones en el entorno social.',
    referentesTeoricos: [
      'Proyecto Ético de Vida: ¿Quién soy? ¿Cuáles son mis talentos y metas?',
      'Desarrollo humano y habilidades blandas: puntualidad, aseo personal, trabajo en equipo, cortesía.',
      'Control y autorregulación de emociones: reconocer alegría, frustración, enojo y pedir ayuda a tiempo.',
      'Convivencia laboral: respeto a los espacios ajenos y escucha sin interrumpir.',
      'Vida independiente en la comunidad: manejo de transporte público, seguridad en la calle y derechos de la persona con discapacidad.'
    ],
    estrategiasRecomendadas: [
      'Círculo de la palabra o asamblea de convivencia.',
      'Sociodramas de situaciones cotidianas de resolución pacífica de conflictos.',
      'Técnicas de respiración y relajación en la zona de calma.'
    ],
    tecnicasRecomendadas: [
      'Termómetro de emociones visual para marcar cómo nos sentimos hoy.',
      'Refuerzo mutuo y agradecimiento entre compañeros de taller.',
      'Contratos de convivencia con acuerdos sencillos ilustrados.'
    ],
    duaSugerido: {
      representacion: [
        'Tarjetas de emociones con fotos reales y pictogramas ARASAAC.',
        'Historias sociales visuales sobre cómo actuar ante imprevistos.'
      ],
      accionExpresion: [
        'Uso del "semáforo de ayuda" (tarjeta roja para pedir pausa, verde para continuar).',
        'Dramatizaciones cortas y expresión libre de sentimientos.'
      ],
      implicacion: [
        'Sentimiento de pertenencia a un grupo que acoge, valora y respeta la diversidad.'
      ]
    },
    ajustesRazonablesSugeridos: [
      'Espacio tranquilo de aislamiento voluntario cuando el estudiante experimente sobrecarga.',
      'Mediación verbal anticipatoria ante cualquier cambio en el cronograma habitual.'
    ]
  },
  'identidad': {
    nombre: 'Identidad, Geografía e Historia Local',
    temaIndispensable: 'Reconocimiento de la Historia Local y Diversidad Cultural',
    temaGenerador: 'Cultura, Patrimonio Venezolano e Inclusión Ciudadana',
    enfasisCurricular: 'Ciudadanía, sentido patrio y valores comunitarios',
    tejidoTematico: 'Identidad individual y colectiva, raíces venezolanas y reconocimiento del derecho al trabajo de todos.',
    referentesTeoricos: [
      'Reconocimiento del espacio geográfico local: mi parroquia, mi municipio y mi estado.',
      'Orientación espacial en el trayecto casa - taller laboral / institución.',
      'Manifestaciones culturales, gastronómicas y artesanales de la región.',
      'Derechos constitucionales de las personas con discapacidad en Venezuela (CRBV Art. 81, Ley de Personas con Discapacidad).',
      'Símbolos patrios y efemérides nacionales con enfoque vivencial y de amor a la Patria.'
    ],
    estrategiasRecomendadas: [
      'Visitas guiadas pedagógicas a plazas, mercados populares y sitios históricos locales.',
      'Elaboración de croquis del camino seguro a la escuela con hitos visuales.',
      'Celebración de efemérides mediante expresiones artísticas y culinarias típicas.'
    ],
    tecnicasRecomendadas: [
      'Líneas de tiempo ilustradas con fotos de la historia del plantel y de la comunidad.',
      'Exposición comunitaria de saberes ancestrales y populares.',
      'Collages y murales colectivos sobre la identidad venezolana.'
    ],
    duaSugerido: {
      representacion: [
        'Mapas táctiles y cartogramas locales con fotos de lugares de referencia conocidos.',
        'Audios y música tradicional venezolana (joropo, gaita, tamunangue).'
      ],
      accionExpresion: [
        'Danza y percusión tradicional con instrumentos sencillos (maracas, tambor).',
        'Narración de relatos familiares con apoyo fotográfico.'
      ],
      implicacion: [
        'Vínculo afectivo con su comunidad y orgullo de su identidad venezolana.'
      ]
    },
    ajustesRazonablesSugeridos: [
      'Acompañamiento en desplazamientos fuera del aula para orientación y seguridad vial.',
      'Uso de señalización fotográfica del entorno institucional.'
    ]
  },
  'fisica': {
    nombre: 'Educación Física para la Vida y Desarrollo Motor',
    temaIndispensable: 'Actividad Física, Deporte y Recreación',
    temaGenerador: 'La Educación Física como Base de la Salud y la Psicomotricidad',
    enfasisCurricular: 'Desarrollo psicomotor, salud integral y disfrute lúdico',
    tejidoTematico: 'La actividad física adaptada para el fortalecimiento de la postura, equilibrio, destreza manual y bienestar.',
    referentesTeoricos: [
      'Medidas antropométricas básicas adaptadas y hábitos de postura corporal ergonómica en el trabajo.',
      'Coordinación óculo-manual y motricidad fina necesarias para la especialidad socioproductiva.',
      'Ejercicios de estiramiento y relajación muscular antes y después de la jornada en el taller.',
      'Juegos tradicionales motores y cooperativos venezolanos adaptados (la perinola, el trompo, carreras en equipos inclusivas).',
      'Control de la respiración y conciencia del pulso cardíaco.'
    ],
    estrategiasRecomendadas: [
      'Circuitos psicomotores con estaciones variadas y niveles de dificultad graduados.',
      'Bailoterapia adaptada con ritmos venezolanos y percusión rítmica.',
      'Juegos de precisión y coordinación viso-motora con materiales suaves.'
    ],
    tecnicasRecomendadas: [
      'Rutina diaria de pausas activas musculares (5 minutos de estiramiento en el taller).',
      'Juegos cooperativos donde el éxito depende de la ayuda mutua y no de la competencia veloz.'
    ],
    duaSugerido: {
      representacion: [
        'Demostración visual por espejo y modelado físico suave de cada movimiento.',
        'Música con ritmo marcado para sincronizar secuencias corporales.'
      ],
      accionExpresion: [
        'Adaptación de movimientos según la capacidad física de cada participante (de pie o sentado).',
        'Uso de balones texturizados, aros de colores y cuerdas flexibles.'
      ],
      implicacion: [
        'Ambiente lúdico de diversión sin presiones de rendimiento atlético competitivo.'
      ]
    },
    ajustesRazonablesSugeridos: [
      'Pisos antideslizantes y apoyo físico durante ejercicios de equilibrio.',
      'Hidratación frecuente y dosificación individual del esfuerzo físico.'
    ]
  }
};
