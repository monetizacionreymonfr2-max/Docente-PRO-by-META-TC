import { ContenidoItem, GradoPrimaria } from './types';

// CURRÍCULO OFICIAL MPPE 2025-2026: MATEMÁTICAS (Págs. 87-93)
// Componentes: Geometría, Magnitudes y Medidas, Números y Operaciones, Estadística y Probabilidad
export const MATEMATICAS_DATA: Record<GradoPrimaria, Record<string, ContenidoItem[]>> = {
  '1': {
    'Geometría': [
      {
        id: 'mat-1-geo-1',
        contenido: 'Noción de espacio.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Se orienta espacialmente.', oficial: true },
          { texto: 'Se orienta temporalmente.', oficial: true }
        ]
      },
      {
        id: 'mat-1-geo-2',
        contenido: 'Figuras geométricas.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Identifica las semejanzas y diferencias entre formas y cuerpos geométricos.', oficial: true },
          { texto: 'Diferencia los polígonos de acuerdo al número de lados.', oficial: true },
          { texto: 'Diferencia círculo de una circunferencia.', oficial: true }
        ]
      },
      {
        id: 'mat-1-geo-3',
        contenido: 'Cuerpos geométricos.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Identifica los elementos de los cuerpos geométricos.', oficial: true }
        ]
      },
      {
        id: 'mat-1-geo-4',
        contenido: 'Utilización de referentes para ubicarse en el espacio noción de espacio.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Es capaz de trazar un croquis partiendo de un punto de referencia.', oficial: true },
          { texto: 'Diferencia recta y punto, y la traza en un plano.', oficial: true },
          { texto: 'Diferencia rectas paralelas y perpendiculares.', oficial: true }
        ]
      }
    ],
    'Magnitudes y Medidas': [
      {
        id: 'mat-1-mag-1',
        contenido: 'Medidas no convencionales.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Diferencia medidas convencionales y no convencionales.', oficial: true },
          { texto: 'Utiliza su cuerpo para medir distintas superficies.', oficial: true }
        ]
      },
      {
        id: 'mat-1-mag-2',
        contenido: 'Medidas de: Longitud, masa, capacidad y tiempo.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Utiliza las medidas de longitud, masa, capacidad y tiempo para medir diferentes objetos.', oficial: true }
        ]
      },
      {
        id: 'mat-1-mag-3',
        contenido: 'Sistema monetario.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Realiza cálculos con cambios de la moneda nacional.', oficial: true }
        ]
      }
    ],
    'Números y Operaciones': [
      {
        id: 'mat-1-num-1',
        contenido: 'Nociones de números y colecciones: comparar, ordenar, clasificar, leer y contar.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Cuenta y lee cantidades hasta el diez mil.', oficial: true }
        ]
      },
      {
        id: 'mat-1-num-2',
        contenido: 'Series numéricas (100).',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Cuenta y lee cantidades hasta el diez mil.', oficial: true }
        ]
      },
      {
        id: 'mat-1-num-3',
        contenido: 'Números ordinales.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Utilizan el cartel de valores para ubicar números o cantidades, hasta el diez mil.', oficial: true }
        ]
      },
      {
        id: 'mat-1-num-4',
        contenido: 'Cartel de valores: valor de posición (hasta la centena).',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Utilizan el cartel de valores para ubicar números o cantidades, hasta el diez mil.', oficial: true }
        ]
      },
      {
        id: 'mat-1-num-5',
        contenido: 'Adición.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Realiza adiciones, sus propiedades y sustracciones con números hasta diez mil.', oficial: true }
        ]
      },
      {
        id: 'mat-1-num-6',
        contenido: 'Sustracción.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Realiza cálculos de multiplicaciones con dos dígitos y por la unidad seguida de cero', oficial: true }
        ]
      }
    ],
    'Estadística y Probabilidad': [
      {
        id: 'mat-1-est-1',
        contenido: 'Generación y organización de datos: pictogramas.',
        oficial: true,
        // Corrección editorial: Pág. 87 tenía texto repetido por errata de imprenta ("Recopila, organiza, clasifica y representa gráficamente datos Recopila, organiza, clasifica...")
        notaEditorial: 'Pág. 87: Se normalizó la duplicación de frase en el aprendizaje esperado de pictogramas.',
        aprendizajesEsperados: [
          { texto: 'Recopila, organiza, clasifica y representa gráficamente datos.', oficial: true }
        ]
      }
    ]
  },
  '2': {
    'Geometría': [
      {
        id: 'mat-2-geo-1',
        contenido: 'Figuras geométricas',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Se orienta espacialmente y temporalmente.', oficial: true },
          { texto: 'Identifica las semejanzas y diferencias entre formas y cuerpos geométricos.', oficial: true },
          { texto: 'Diferencia los polígonos de acuerdo al número de lados.', oficial: true },
          { texto: 'Diferencia círculo de una circunferencia.', oficial: true }
        ]
      },
      {
        id: 'mat-2-geo-2',
        contenido: 'Cuerpos geométricos',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Identifica los elementos de los cuerpos geométricos.', oficial: true },
          { texto: 'Es capaz de trazar un croquis partiendo de un punto de referencia.', oficial: true },
          { texto: 'Diferencia recta y punto, y la traza en un plano.', oficial: true },
          { texto: 'Diferencia rectas paralelas y perpendiculares.', oficial: true }
        ]
      }
    ],
    'Magnitudes y Medidas': [
      {
        id: 'mat-2-mag-1',
        contenido: 'Posición y desplazamiento de un objeto',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Diferencia medidas convencionales y no convencionales.', oficial: true },
          { texto: 'Utiliza su cuerpo para medir distintas superficies.', oficial: true }
        ]
      },
      {
        id: 'mat-2-mag-2',
        contenido: 'Medidas no convencionales.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Diferencia medidas convencionales y no convencionales.', oficial: true }
        ]
      },
      {
        id: 'mat-2-mag-3',
        contenido: 'Medidas de longitud, masa, capacidad y tiempo.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Utiliza las medidas de longitud, masa, capacidad y tiempo para medir diferentes objetos', oficial: true }
        ]
      },
      {
        id: 'mat-2-mag-4',
        contenido: 'Sistema monetario.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Realiza cálculos con cambios de la moneda nacional.', oficial: true }
        ]
      }
    ],
    'Números y Operaciones': [
      {
        id: 'mat-2-num-1',
        contenido: 'Números naturales (1000).',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Cuenta y lee cantidades hasta el diez mil.', oficial: true }
        ]
      },
      {
        id: 'mat-2-num-2',
        contenido: 'Sucesiones progresivas y regresivas.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Utilizan el cartel de valores para ubicar números o cantidades, hasta el diez mil.', oficial: true }
        ]
      },
      {
        id: 'mat-2-num-3',
        contenido: 'Cartel de valores: valor de posición (hasta las unidades de mil).',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Utilizan el cartel de valores para ubicar números o cantidades, hasta el diez mil.', oficial: true }
        ]
      },
      {
        id: 'mat-2-num-4',
        contenido: 'Números ordinales.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Cuenta y lee cantidades hasta el diez mil.', oficial: true }
        ]
      },
      {
        id: 'mat-2-num-5',
        contenido: 'Adición y propiedades.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Realiza adiciones, sus propiedades y sustracciones con números hasta diez mil.', oficial: true }
        ]
      },
      {
        id: 'mat-2-num-6',
        contenido: 'Sustracción.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Realiza adiciones, sus propiedades y sustracciones con números hasta diez mil.', oficial: true }
        ]
      },
      {
        id: 'mat-2-num-7',
        contenido: 'Nociones de la multiplicación.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Realiza cálculos de multiplicaciones con dos dígitos y por la unidad seguida de cero', oficial: true }
        ]
      }
    ],
    'Estadística y Probabilidad': [
      {
        id: 'mat-2-est-1',
        contenido: 'Generación, recolección y organización de datos: pictogramas y diagrama de barras.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Recopila, organiza, clasifica y representa gráficamente datos.', oficial: true }
        ]
      }
    ]
  },
  '3': {
    'Geometría': [
      {
        id: 'mat-3-geo-1',
        contenido: 'Polígono.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Diferencia los polígonos de acuerdo al número de lados.', oficial: true },
          { texto: 'Identifica las semejanzas y diferencias entre formas y cuerpos geométricos.', oficial: true }
        ]
      },
      {
        id: 'mat-3-geo-2',
        contenido: 'Noción de ángulo.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Se orienta espacialmente y temporalmente.', oficial: true },
          { texto: 'Diferencia recta y punto, y la traza en un plano.', oficial: true }
        ]
      },
      {
        id: 'mat-3-geo-3',
        contenido: 'Cuerpos geométricos.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Identifica los elementos de los cuerpos geométricos.', oficial: true }
        ]
      },
      {
        id: 'mat-3-geo-4',
        contenido: 'Círculo y circunferencia.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Diferencia círculo de una circunferencia.', oficial: true }
        ]
      },
      {
        id: 'mat-3-geo-5',
        contenido: 'La recta, el punto, el plano.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Es capaz de trazar un croquis partiendo de un punto de referencia.', oficial: true },
          { texto: 'Diferencia recta y punto, y la traza en un plano.', oficial: true },
          { texto: 'Diferencia rectas paralelas y perpendiculares.', oficial: true }
        ]
      }
    ],
    'Magnitudes y Medidas': [
      {
        id: 'mat-3-mag-1',
        contenido: 'Posición y desplazamiento de un objeto.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Diferencia medidas convencionales y no convencionales.', oficial: true },
          { texto: 'Utiliza su cuerpo para medir distintas superficies.', oficial: true }
        ]
      },
      {
        id: 'mat-3-mag-2',
        contenido: 'Medidas convencionales y no convencionales.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Diferencia medidas convencionales y no convencionales.', oficial: true }
        ]
      },
      {
        id: 'mat-3-mag-3',
        contenido: 'Medidas de longitud, masa, capacidad, tiempo y sus submúltiplos.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Utiliza las medidas de longitud, masa, capacidad y tiempo para medir diferentes objetos.', oficial: true }
        ]
      },
      {
        id: 'mat-3-mag-4',
        contenido: 'Sistema monetario.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Realiza cálculos con cambios de la moneda nacional.', oficial: true }
        ]
      }
    ],
    'Números y Operaciones': [
      {
        id: 'mat-3-num-1',
        contenido: 'Números naturales (10000).',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Cuenta y lee cantidades hasta el diez mil.', oficial: true }
        ]
      },
      {
        id: 'mat-3-num-2',
        contenido: 'Números ordinales.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Utilizan el cartel de valores para ubicar números o cantidades, hasta el diez mil.', oficial: true }
        ]
      },
      {
        id: 'mat-3-num-3',
        contenido: 'Cartel de valores: valor de posición (hasta las centenas de mil).',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Utilizan el cartel de valores para ubicar números o cantidades, hasta el diez mil.', oficial: true }
        ]
      },
      {
        id: 'mat-3-num-4',
        contenido: 'La adición y propiedades.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Realiza adiciones, sus propiedades y sustracciones con números hasta diez mil.', oficial: true }
        ]
      },
      {
        id: 'mat-3-num-5',
        contenido: 'La sustracción.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Realiza adiciones, sus propiedades y sustracciones con números hasta diez mil.', oficial: true }
        ]
      },
      {
        id: 'mat-3-num-6',
        contenido: 'La multiplicación de la unidad seguida de cero.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Realiza cálculos de multiplicaciones con dos dígitos y por la unidad seguida de cero.', oficial: true }
        ]
      }
    ],
    'Estadística y Probabilidad': [
      {
        id: 'mat-3-est-1',
        contenido: 'Recolección, organización y representación de datos estadísticos: pictogramas, diagramas de barras y tablas.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Recopila, organiza, clasifica y representa gráficamente datos.', oficial: true }
        ]
      }
    ]
  },
  '4': {
    'Geometría': [
      {
        id: 'mat-4-geo-1',
        contenido: 'Orientación especial.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Afianza su orientación espacial.', oficial: true },
          { texto: 'Afianza su orientación temporal.', oficial: true }
        ]
      },
      {
        id: 'mat-4-geo-2',
        contenido: 'La recta, semirrecta, mediatriz de un segmento.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Domina los instrumentos de geometrías en el trazo de figuras geométricas: rectas, segmentos, ángulos, círculos, circunferencias, polígonos (triángulos, cuadriláteros).', oficial: true }
        ]
      },
      {
        id: 'mat-4-geo-3',
        contenido: 'Ángulo, su clasificación, bisectriz.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Domina los instrumentos de geometrías en el trazo de figuras geométricas: rectas, segmentos, ángulos, círculos, circunferencias, polígonos (triángulos, cuadriláteros).', oficial: true }
        ]
      },
      {
        id: 'mat-4-geo-4',
        contenido: 'Recta según su relación.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Domina los instrumentos de geometrías en el trazo de figuras geométricas: rectas, segmentos, ángulos, círculos, circunferencias, polígonos (triángulos, cuadriláteros).', oficial: true }
        ]
      },
      {
        id: 'mat-4-geo-5',
        contenido: 'Polígonos regulares e irregulars.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Domina los instrumentos de geometrías en el trazo de figuras geométricas: rectas, segmentos, ángulos, círculos, circunferencias, polígonos (triángulos, cuadriláteros).', oficial: true }
        ]
      },
      {
        id: 'mat-4-geo-6',
        contenido: 'Triángulo y su clasificación.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Domina los instrumentos de geometrías en el trazo de figuras geométricas: rectas, segmentos, ángulos, círculos, circunferencias, polígonos (triángulos, cuadriláteros).', oficial: true }
        ]
      },
      {
        id: 'mat-4-geo-7',
        contenido: 'Cuadriláteros.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Domina los instrumentos de geometrías en el trazo de figuras geométricas: rectas, segmentos, ángulos, círculos, circunferencias, polígonos (triángulos, cuadriláteros).', oficial: true }
        ]
      }
    ],
    'Magnitudes y Medidas': [
      {
        id: 'mat-4-mag-1',
        contenido: 'Conversión de unidades de medida de masa, longitud y capacidad.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Realiza conversión de unidades de medida de: masa, longitud, área, volumen y capacidad.', oficial: true }
        ]
      },
      {
        id: 'mat-4-mag-2',
        contenido: 'Conversión de medidas de tiempo.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Realiza conversión de unidades de tiempo.', oficial: true }
        ]
      },
      {
        id: 'mat-4-mag-3',
        contenido: 'Sistema monetario.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Determina el área y el perímetro de figuras planas.', oficial: true }
        ]
      }
    ],
    'Números y Operaciones': [
      {
        id: 'mat-4-num-1',
        contenido: 'Números naturales (1000000).',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Opera con números naturales hasta el millardo: adición, sustracción, multiplicación y división.', oficial: true }
        ]
      },
      {
        id: 'mat-4-num-2',
        contenido: 'Cartel de valores: valor de posición (hasta las unidades de millón).',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Ubica en el cartel de valores hasta el millardo, así como hasta la milésima de mil.', oficial: true }
        ]
      },
      {
        id: 'mat-4-num-3',
        contenido: 'Números decimales.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Opera con números decimales: adición, sustracción, multiplicación y división.', oficial: true }
        ]
      },
      {
        id: 'mat-4-num-4',
        contenido: 'Fracciones.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Realiza operaciones con fracciones de igual y diferente denominado: adicción, sustracción, multiplicación y división.', oficial: true }
        ]
      },
      {
        id: 'mat-4-num-5',
        contenido: 'Adición, sustracción, multiplicación y división con números naturales, decimales y fracciones.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Reconoce números primos, compuestos.', oficial: true },
          { texto: 'Descompone un número en sus factores primos.', oficial: true },
          { texto: 'Conoce la potencia de un número y su desarrollo.', oficial: true },
          { texto: 'Resuelve problemas utilizando las operaciones con números naturales, fracciones y decimales.', oficial: true },
          { texto: 'Conoce y opera con sistemas de numeración posicional y no posicional.', oficial: true }
        ]
      }
    ],
    'Estadística y Probabilidad': [
      {
        id: 'mat-4-est-1',
        contenido: 'Recolección, organización, representación y análisis de datos estadísticos.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Recopila, organiza, clasifica y representa datos agrupados y no agrupados.', oficial: true }
        ]
      },
      {
        id: 'mat-4-est-2',
        contenido: 'Tablas de frecuencia simple.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Recopila, organiza, clasifica y representa datos agrupados y no agrupados.', oficial: true }
        ]
      }
    ]
  },
  '5': {
    'Geometría': [
      {
        id: 'mat-5-geo-1',
        contenido: 'Círculo y circunferencia.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Afianza su orientación espacial.', oficial: true },
          { texto: 'Afianza su orientación temporal.', oficial: true }
        ]
      },
      {
        id: 'mat-5-geo-2',
        contenido: 'Rectas a una circunferencia.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Domina los instrumentos de geometrías en el trazo de figuras geométricas: rectas, segmentos, ángulos, círculos, circunferencias, polígonos (triángulos, cuadriláteros).', oficial: true }
        ]
      },
      {
        id: 'mat-5-geo-3',
        contenido: 'Polígonos y clasificación.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Domina los instrumentos de geometrías en el trazo de figuras geométricas: rectas, segmentos, ángulos, círculos, circunferencias, polígonos (triángulos, cuadriláteros).', oficial: true }
        ]
      },
      {
        id: 'mat-5-geo-4',
        contenido: 'Triángulos.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Domina los instrumentos de geometrías en el trazo de figuras geométricas: rectas, segmentos, ángulos, círculos, circunferencias, polígonos (triángulos, cuadriláteros).', oficial: true }
        ]
      }
    ],
    'Magnitudes y Medidas': [
      {
        id: 'mat-5-mag-1',
        contenido: 'Medidas de longitud: sistema métrico decimal, el metro, múltiplos y submúltiplos.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Realiza conversión de unidades de medida de: masa, longitud, área, volumen y capacidad.', oficial: true }
        ]
      },
      {
        id: 'mat-5-mag-2',
        contenido: 'Medidas de masa: el gramo, el kilogramo, múltiplos y submúltiplos.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Realiza conversión de unidades de medida de: masa, longitud, área, volumen y capacidad.', oficial: true }
        ]
      },
      {
        id: 'mat-5-mag-3',
        contenido: 'Medidas de capacidad: el litro, múltiplos y submúltiplos.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Realiza conversión de unidades de medida de: masa, longitud, área, volumen y capacidad.', oficial: true }
        ]
      },
      {
        id: 'mat-5-mag-4',
        contenido: 'Medidas de tiempo.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Realiza conversión de unidades de tiempo.', oficial: true }
        ]
      },
      {
        id: 'mat-5-mag-5',
        contenido: 'Medidas de superficie y áreas de figuras planas: noción de área, noción de superficie, cálculo de áreas de distintas superficies.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Determina el área y el perímetro de figuras planas.', oficial: true }
        ]
      },
      {
        id: 'mat-5-mag-6',
        contenido: 'Sistema monetario.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Realiza conversión de unidades de medida de: masa, longitud, área, volumen y capacidad.', oficial: true }
        ]
      }
    ],
    'Números y Operaciones': [
      {
        id: 'mat-5-num-1',
        contenido: 'Números naturales (100000000).',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Opera con números naturales hasta el millardo: adición, sustracción, multiplicación y división.', oficial: true }
        ]
      },
      {
        id: 'mat-5-num-2',
        contenido: 'Cartel de valores: valor de posición (hasta las decenas de millón).',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Ubica en el cartel de valores hasta el millardo, así como hasta la milésima de mil.', oficial: true }
        ]
      },
      {
        id: 'mat-5-num-3',
        contenido: 'Números decimales y sus operaciones.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Opera con números decimales: adición, sustracción, multiplicación y división.', oficial: true }
        ]
      },
      {
        id: 'mat-5-num-4',
        contenido: 'Fracciones y sus operaciones.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Realiza operaciones con fracciones de igual y diferente denominado: adicción, sustracción, multiplicación y división.', oficial: true }
        ]
      },
      {
        id: 'mat-5-num-5',
        contenido: 'División con números naturales y decimales.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Reconoce números primos, compuestos.', oficial: true },
          { texto: 'Descompone un número en sus factores primos.', oficial: true },
          { texto: 'Conoce la potencia de un número y su desarrollo.', oficial: true },
          { texto: 'Resuelve problemas utilizando las operaciones con números naturales, fracciones y decimales.', oficial: true },
          { texto: 'Conoce y opera con sistemas de numeración posicional y no posicional.', oficial: true }
        ]
      }
    ],
    'Estadística y Probabilidad': [
      {
        id: 'mat-5-est-1',
        contenido: 'Recolección, organización, representación y análisis de datos estadísticos.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Recopila, organiza, clasifica y representa datos agrupados y no agrupados.', oficial: true }
        ]
      },
      {
        id: 'mat-5-est-2',
        contenido: 'Tablas de frecuencia simple y relativa.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Recopila, organiza, clasifica y representa datos agrupados y no agrupados.', oficial: true }
        ]
      }
    ]
  },
  '6': {
    'Geometría': [
      {
        id: 'mat-6-geo-1',
        contenido: 'Polígonos.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Afianza su orientación espacial.', oficial: true },
          { texto: 'Afianza su orientación temporal.', oficial: true }
        ]
      },
      {
        id: 'mat-6-geo-2',
        contenido: 'Cuadriláteros y triángulos.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Domina los instrumentos de geometrías en el trazo de figuras geométricas: rectas, segmentos, ángulos, círculos, circunferencias, polígonos (triángulos, cuadriláteros).', oficial: true }
        ]
      },
      {
        id: 'mat-6-geo-3',
        contenido: 'Líneas notables del triángulo.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Domina los instrumentos de geometrías en el trazo de figuras geométricas: rectas, segmentos, ángulos, círculos, circunferencias, polígonos (triángulos, cuadriláteros).', oficial: true }
        ]
      },
      {
        id: 'mat-6-geo-4',
        contenido: 'Polígonos inscritos en una circunferencia.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Domina los instrumentos de geometrías en el trazo de figuras geométricas: rectas, segmentos, ángulos, círculos, circunferencias, polígonos (triángulos, cuadriláteros).', oficial: true }
        ]
      },
      {
        id: 'mat-6-geo-5',
        contenido: 'Cuerpos geométricos.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Domina los instrumentos de geometrías en el trazo de figuras geométricas: rectas, segmentos, ángulos, círculos, circunferencias, polígonos (triángulos, cuadriláteros).', oficial: true }
        ]
      }
    ],
    'Magnitudes y Medidas': [
      {
        id: 'mat-6-mag-1',
        contenido: 'Área y perímetro de figuras planas.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Determina el área y el perímetro de figuras planas.', oficial: true },
          { texto: 'Realiza conversión de unidades de medida de: masa, longitud, área, volumen y capacidad.', oficial: true },
          { texto: 'Realiza conversión de unidades de tiempo.', oficial: true }
        ]
      }
    ],
    'Números y Operaciones': [
      {
        id: 'mat-6-num-1',
        contenido: 'Números primos y compuestos.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Reconoce números primos, compuestos.', oficial: true },
          { texto: 'Descompone un número en sus factores primos.', oficial: true }
        ]
      },
      {
        id: 'mat-6-num-2',
        contenido: 'Criterios de divisibilidad, mínimo común múltiplo (m.c.m) y máximo común divisor (M.C.D.).',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Opera con números naturales hasta el millardo: adición, sustracción, multiplicación y división.', oficial: true }
        ]
      },
      {
        id: 'mat-6-num-3',
        contenido: 'Introducción a las Ecuaciones.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Resuelve problemas utilizando las operaciones con números naturales, fracciones y decimales.', oficial: true }
        ]
      },
      {
        id: 'mat-6-num-4',
        contenido: 'Potenciación.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Conoce la potencia de un número y su desarrollo.', oficial: true }
        ]
      },
      {
        id: 'mat-6-num-5',
        contenido: 'Números decimales.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Opera con números decimales: adición, sustracción, multiplicación y división.', oficial: true }
        ]
      },
      {
        id: 'mat-6-num-6',
        contenido: 'Operaciones con Fracciones.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Realiza operaciones con fracciones de igual y diferente denominado: adicción, sustracción, multiplicación y división.', oficial: true }
        ]
      },
      {
        id: 'mat-6-num-7',
        contenido: 'Sistemas de numeración, posicional y no posicional.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Conoce y opera con sistemas de numeración posicional y no posicional.', oficial: true },
          { texto: 'Ubica en el cartel de valores hasta el millardo, así como hasta la milésima de mil.', oficial: true }
        ]
      }
    ],
    'Estadística y Probabilidad': [
      {
        id: 'mat-6-est-1',
        contenido: 'Recolección, organización, representación y análisis de datos estadísticos.',
        oficial: true,
        aprendizajesEsperados: [
          { texto: 'Recopila, organiza, clasifica y representa datos agrupados y no agrupados.', oficial: true }
        ]
      }
    ]
  }
};
