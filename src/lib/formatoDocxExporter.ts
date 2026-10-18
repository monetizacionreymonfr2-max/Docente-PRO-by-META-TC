import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  HeadingLevel,
  ShadingType,
  PageOrientation,
} from 'docx';
import { FormatoDocente, SeccionGenerada } from '../types/formato';

/**
 * Convierte color hex (#1e3a8a) a formato docx (1E3A8A sin almohadilla).
 */
function cleanHex(colorHex?: string, fallback = '1E3A8A'): string {
  if (!colorHex) return fallback;
  const clean = colorHex.replace('#', '').toUpperCase();
  return clean.length === 6 ? clean : fallback;
}

/**
 * Genera un archivo binario Word (.docx) reconstruyendo la estructura del formato
 * escolar, tablas con altura automática, encabezados y estilos.
 */
export async function exportarFormatoDocx(
  formato: FormatoDocente,
  secciones: SeccionGenerada[],
  datosGenerales: Record<string, string>,
  tituloDocumento = 'Planificación Educativa'
): Promise<Blob> {
  const colorPrimario = cleanHex(formato.estructura.estilo?.colorPrincipal, '1E3A8A');
  const colorSecundario = cleanHex(formato.estructura.estilo?.colorSecundario, 'F1F5F9');
  const esHorizontal = formato.estructura.orientacion === 'horizontal';

  const childrenElements: (Paragraph | Table)[] = [];

  // 1. Membrete institucional
  const encabezado = formato.estructura.encabezado || {};
  childrenElements.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 60 },
      children: [
        new TextRun({
          text: encabezado.institucion || 'REPÚBLICA BOLIVARIANA DE VENEZUELA - MPPE',
          bold: true,
          size: 20, // 10pt
          color: '333333',
        }),
      ],
    })
  );

  if (encabezado.subtitulo) {
    childrenElements.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 100 },
        children: [
          new TextRun({
            text: encabezado.subtitulo,
            italics: true,
            size: 18,
            color: '666666',
          }),
        ],
      })
    );
  }

  // Título del documento
  childrenElements.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      spacing: { before: 120, after: 160 },
      children: [
        new TextRun({
          text: (formato.nombre || encabezado.tituloDocumento || tituloDocumento).toUpperCase(),
          bold: true,
          size: 26, // 13pt
          color: colorPrimario,
        }),
      ],
    })
  );

  // Cuadro resumen de Datos Generales (Docente, Grado, Sección, Año Escolar, Tema)
  const datosFilas: TableRow[] = [];
  const entries = Object.entries(datosGenerales).filter(([_, v]) => Boolean(v));
  if (entries.length > 0) {
    for (let i = 0; i < entries.length; i += 2) {
      const item1 = entries[i];
      const item2 = entries[i + 1];

      datosFilas.push(
        new TableRow({
          children: [
            new TableCell({
              width: { size: 25, type: WidthType.PERCENTAGE },
              shading: { type: ShadingType.CLEAR, fill: colorSecundario },
              children: [
                new Paragraph({
                  children: [new TextRun({ text: `${item1[0]}:`, bold: true, size: 18 })],
                }),
              ],
            }),
            new TableCell({
              width: { size: item2 ? 25 : 75, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({
                  children: [new TextRun({ text: item1[1], size: 18 })],
                }),
              ],
            }),
            ...(item2
              ? [
                  new TableCell({
                    width: { size: 25, type: WidthType.PERCENTAGE },
                    shading: { type: ShadingType.CLEAR, fill: colorSecundario },
                    children: [
                      new Paragraph({
                        children: [new TextRun({ text: `${item2[0]}:`, bold: true, size: 18 })],
                      }),
                    ],
                  }),
                  new TableCell({
                    width: { size: 25, type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({
                        children: [new TextRun({ text: item2[1], size: 18 })],
                      }),
                    ],
                  }),
                ]
              : []),
          ],
        })
      );
    }

    childrenElements.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: datosFilas,
      })
    );

    childrenElements.push(new Paragraph({ spacing: { after: 180 } }));
  }

  // 2. Secciones del Formato
  for (const seccion of secciones) {
    // Título de la sección con estilo del formato
    childrenElements.push(
      new Paragraph({
        spacing: { before: 200, after: 100 },
        children: [
          new TextRun({
            text: seccion.titulo.toUpperCase(),
            bold: true,
            size: 22,
            color: colorPrimario,
          }),
        ],
      })
    );

    if (seccion.tipo === 'tabla' && seccion.contenidoTabla && seccion.contenidoTabla.length > 0) {
      const formatoSecOrig = formato.estructura.secciones.find((s) => s.id === seccion.seccionId);
      const columnas = formatoSecOrig?.columnas || [];
      const colCount = columnas.length > 0 ? columnas.length : (seccion.contenidoTabla[0]?.length || 1);
      const colWidthPercent = Math.floor(100 / colCount);

      const tableRows: TableRow[] = [];

      // Fila de encabezado de tabla
      if (columnas.length > 0) {
        tableRows.push(
          new TableRow({
            tableHeader: true,
            cantSplit: true,
            children: columnas.map(
              (col) =>
                new TableCell({
                  width: { size: colWidthPercent, type: WidthType.PERCENTAGE },
                  shading: { type: ShadingType.CLEAR, fill: colorPrimario },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      spacing: { before: 80, after: 80 },
                      children: [
                        new TextRun({
                          text: col,
                          bold: true,
                          size: 18,
                          color: 'FFFFFF',
                        }),
                      ],
                    }),
                  ],
                })
            ),
          })
        );
      }

      // Filas de datos
      seccion.contenidoTabla.forEach((fila, rowIdx) => {
        const isEven = rowIdx % 2 === 0;
        tableRows.push(
          new TableRow({
            cantSplit: true,
            children: fila.map(
              (celda) =>
                new TableCell({
                  width: { size: colWidthPercent, type: WidthType.PERCENTAGE },
                  shading: isEven ? undefined : { type: ShadingType.CLEAR, fill: colorSecundario },
                  children: [
                    new Paragraph({
                      spacing: { before: 60, after: 60 },
                      children: [
                        new TextRun({
                          text: celda || '-',
                          size: 18,
                        }),
                      ],
                    }),
                  ],
                })
            ),
          })
        );
      });

      childrenElements.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: tableRows,
        })
      );
    } else if (seccion.tipo === 'lista' && seccion.contenidoLista && seccion.contenidoLista.length > 0) {
      seccion.contenidoLista.forEach((item) => {
        childrenElements.push(
          new Paragraph({
            bullet: { level: 0 },
            spacing: { after: 60 },
            children: [
              new TextRun({
                text: item,
                size: 20,
              }),
            ],
          })
        );
      });
    } else {
      // Parrafo o campo de texto narrativo
      const parrafos = (seccion.contenidoTexto || '').split('\n').filter((p) => p.trim() !== '');
      if (parrafos.length === 0) {
        childrenElements.push(
          new Paragraph({
            children: [new TextRun({ text: seccion.contenidoTexto || 'Contenido pedagógico generado.', size: 20 })],
          })
        );
      } else {
        parrafos.forEach((parr) => {
          childrenElements.push(
            new Paragraph({
              spacing: { after: 100 },
              alignment: AlignmentType.JUSTIFIED,
              children: [
                new TextRun({
                  text: parr,
                  size: 20,
                }),
              ],
            })
          );
        });
      }
    }
  }

  // 3. Pie de página y documento
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: {
              orientation: esHorizontal ? PageOrientation.LANDSCAPE : PageOrientation.PORTRAIT,
            },
            margin: {
              top: 720, // 0.5 in
              right: 720,
              bottom: 720,
              left: 720,
            },
          },
        },
        children: childrenElements,
      },
    ],
  });

  return await Packer.toBlob(doc);
}
