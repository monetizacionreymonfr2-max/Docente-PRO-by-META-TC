import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FormatoDocente, SeccionGenerada } from '../types/formato';

/**
 * Convierte color hex a tupla RGB [r, g, b].
 */
function hexToRgb(hex?: string): [number, number, number] {
  if (!hex) return [30, 58, 138];
  let clean = hex.replace('#', '');
  if (clean.length === 3) {
    clean = clean.split('').map((c) => c + c).join('');
  }
  const num = parseInt(clean, 16);
  if (isNaN(num)) return [30, 58, 138];
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

/**
 * Genera un PDF estructurado de alta fidelidad con jspdf y jspdf-autotable,
 * respetando encabezados repetidos en cada página y tablas auto-ajustables.
 */
export function exportarFormatoPdf(
  formato: FormatoDocente,
  secciones: SeccionGenerada[],
  datosGenerales: Record<string, string>,
  tituloDocumento = 'Planificación Educativa'
): jsPDF {
  const esHorizontal = formato.estructura.orientacion === 'horizontal';
  const doc = new jsPDF({
    orientation: esHorizontal ? 'landscape' : 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  let currentY = margin;

  const rgbPrimario = hexToRgb(formato.estructura.estilo?.colorPrincipal);
  const rgbSecundario = hexToRgb(formato.estructura.estilo?.colorSecundario || '#f1f5f9');

  // 1. Membrete de la institución
  const encabezado = formato.estructura.encabezado || {};
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(50, 50, 50);
  const instLines = doc.splitTextToSize(
    (encabezado.institucion || 'REPÚBLICA BOLIVARIANA DE VENEZUELA - MPPE').toUpperCase(),
    pageWidth - margin * 2
  );
  doc.text(instLines, pageWidth / 2, currentY, { align: 'center' });
  currentY += instLines.length * 4.5;

  if (encabezado.subtitulo) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(encabezado.subtitulo, pageWidth / 2, currentY, { align: 'center' });
    currentY += 5;
  }

  // Título del documento
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(rgbPrimario[0], rgbPrimario[1], rgbPrimario[2]);
  const docTitle = (formato.nombre || encabezado.tituloDocumento || tituloDocumento).toUpperCase();
  doc.text(docTitle, pageWidth / 2, currentY + 2, { align: 'center' });
  currentY += 8;

  // Cuadro de Datos Generales
  const datosEntries = Object.entries(datosGenerales).filter(([_, v]) => Boolean(v));
  if (datosEntries.length > 0) {
    const tableBody: any[] = [];
    for (let i = 0; i < datosEntries.length; i += 2) {
      const col1 = datosEntries[i];
      const col2 = datosEntries[i + 1];
      if (col2) {
        tableBody.push([
          { content: col1[0] + ':', styles: { fontStyle: 'bold', fillColor: [243, 244, 246] } },
          col1[1],
          { content: col2[0] + ':', styles: { fontStyle: 'bold', fillColor: [243, 244, 246] } },
          col2[1],
        ]);
      } else {
        tableBody.push([
          { content: col1[0] + ':', styles: { fontStyle: 'bold', fillColor: [243, 244, 246] } },
          { content: col1[1], colSpan: 3 },
        ]);
      }
    }

    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      body: tableBody,
      theme: 'grid',
      styles: {
        fontSize: 8.5,
        cellPadding: 2,
        textColor: [30, 30, 30],
        lineColor: [200, 200, 200],
        lineWidth: 0.2,
      },
    });

    currentY = (doc as any).lastAutoTable.finalY + 6;
  }

  // 2. Secciones del Formato
  for (const seccion of secciones) {
    // Verificar si queda suficiente espacio para el título y comienzo de sección
    if (currentY > pageHeight - 30) {
      doc.addPage();
      currentY = margin;
    }

    // Título de la sección
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(rgbPrimario[0], rgbPrimario[1], rgbPrimario[2]);
    doc.text(seccion.titulo.toUpperCase(), margin, currentY);
    currentY += 4.5;

    // Barra de color debajo del título
    doc.setDrawColor(rgbPrimario[0], rgbPrimario[1], rgbPrimario[2]);
    doc.setLineWidth(0.4);
    doc.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 3;

    if (seccion.tipo === 'tabla' && seccion.contenidoTabla && seccion.contenidoTabla.length > 0) {
      const formatoSecOrig = formato.estructura.secciones.find((s) => s.id === seccion.seccionId);
      const columnas = formatoSecOrig?.columnas || [];

      autoTable(doc, {
        startY: currentY,
        margin: { left: margin, right: margin },
        head: columnas.length > 0 ? [columnas] : undefined,
        body: seccion.contenidoTabla,
        showHead: 'everyPage', // Repite el encabezado en cada salto de página
        theme: 'grid',
        headStyles: {
          fillColor: rgbPrimario,
          textColor: [255, 255, 255],
          fontSize: 8,
          fontStyle: 'bold',
          halign: 'center',
          valign: 'middle',
        },
        styles: {
          fontSize: 8,
          cellPadding: 2.5,
          overflow: 'linebreak',
          lineColor: [210, 210, 210],
          lineWidth: 0.2,
        },
        alternateRowStyles: {
          fillColor: [rgbSecundario[0], rgbSecundario[1], rgbSecundario[2]],
        },
      });

      currentY = (doc as any).lastAutoTable.finalY + 6;
    } else if (seccion.tipo === 'lista' && seccion.contenidoLista && seccion.contenidoLista.length > 0) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(40, 40, 40);

      for (const item of seccion.contenidoLista) {
        if (currentY > pageHeight - 20) {
          doc.addPage();
          currentY = margin;
        }
        const bulletLines = doc.splitTextToSize(`•  ${item}`, pageWidth - margin * 2 - 4);
        doc.text(bulletLines, margin + 2, currentY);
        currentY += bulletLines.length * 4.2;
      }
      currentY += 4;
    } else {
      // Parrafo o campo
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(40, 40, 40);

      const texto = seccion.contenidoTexto || 'Información pedagógica completada.';
      const parrafos = texto.split('\n').filter((p) => p.trim() !== '');

      for (const p of parrafos) {
        if (currentY > pageHeight - 20) {
          doc.addPage();
          currentY = margin;
        }
        const lines = doc.splitTextToSize(p, pageWidth - margin * 2);
        doc.text(lines, margin, currentY);
        currentY += lines.length * 4.2 + 2;
      }
      currentY += 4;
    }
  }

  // Pie de página con numeración y marca de agua
  const totalPages = (doc.internal as any).getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(140, 140, 140);
    const footerText = formato.estructura.estilo?.piePagina || 'Docenty PRO • Planificación Escolar MPPE 2026-2027';
    doc.text(footerText, margin, pageHeight - 6);
    doc.text(`Página ${i} de ${totalPages}`, pageWidth - margin, pageHeight - 6, { align: 'right' });
  }

  return doc;
}
