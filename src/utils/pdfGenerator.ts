import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { SurveillanceRecord } from '../types';

export interface GeneratePdfOptions {
  records: SurveillanceRecord[];
  filterType: 'all' | 'optimal' | 'danger';
  systemNameFilter?: string;
  operatorName?: string;
}

export function generateSurveillanceReportPdf({
  records,
  filterType,
  systemNameFilter,
  operatorName = 'Personal de Vigilancia Sanitaria',
}: GeneratePdfOptions): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  // Colors
  const primaryColor: [number, number, number] = [0, 103, 125]; // #00677d
  const secondaryColor: [number, number, number] = [0, 180, 216]; // #00b4d8
  const successColor: [number, number, number] = [0, 108, 81]; // #006c51
  const dangerColor: [number, number, number] = [186, 26, 26]; // #ba1a1a
  const darkTextColor: [number, number, number] = [21, 29, 34]; // #151d22
  const mutedTextColor: [number, number, number] = [61, 73, 77]; // #3d494d
  const bgLight: [number, number, number] = [245, 250, 255]; // #f5faff

  // Metrics calculation
  const totalCount = records.length;
  const optimalRecords = records.filter((r) => r.status === 'optimal');
  const alertRecords = records.filter((r) => r.status !== 'optimal');
  const complianceRate = totalCount > 0 ? (optimalRecords.length / totalCount) * 100 : 0;

  const avgPostChlorine =
    totalCount > 0
      ? records.reduce((acc, r) => acc + (r.postChlorinePpm ?? r.targetChlorinePpm), 0) / totalCount
      : 0;

  const minPostChlorine =
    totalCount > 0
      ? Math.min(...records.map((r) => r.postChlorinePpm ?? r.targetChlorinePpm))
      : 0;

  const maxPostChlorine =
    totalCount > 0
      ? Math.max(...records.map((r) => r.postChlorinePpm ?? r.targetChlorinePpm))
      : 0;

  const recordsWithPh = records.filter((r) => r.ph !== undefined && r.ph > 0);
  const avgPh =
    recordsWithPh.length > 0
      ? recordsWithPh.reduce((acc, r) => acc + (r.ph || 0), 0) / recordsWithPh.length
      : 7.2;

  const recordsWithTurb = records.filter((r) => r.turbidityNtu !== undefined);
  const avgTurbidity =
    recordsWithTurb.length > 0
      ? recordsWithTurb.reduce((acc, r) => acc + (r.turbidityNtu || 0), 0) / recordsWithTurb.length
      : 0.5;

  const totalVolumeLiters = records.reduce((acc, r) => acc + r.volumeLiters, 0);

  let currentY = margin;

  // 1. TOP HEADER BANNER
  doc.setFillColor(...primaryColor);
  doc.roundedRect(margin, currentY, contentWidth, 24, 3, 3, 'F');

  // Decorative cyan accent stripe
  doc.setFillColor(...secondaryColor);
  doc.roundedRect(margin, currentY, 4, 24, 2, 2, 'F');

  // Header texts
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('CLORAGUA • REPORTE OFICIAL DE VIGILANCIA SANITARIA', margin + 8, currentY + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(
    'D.S. N.° 031-2010-SA • REGLAMENTO DE LA CALIDAD DEL AGUA PARA CONSUMO HUMANO (MINSA / DIGESA)',
    margin + 8,
    currentY + 13
  );

  doc.setFontSize(7.5);
  doc.setTextColor(179, 235, 255);
  doc.text(
    `Emitido: ${new Date().toLocaleDateString('es-PE', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })} a las ${new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}`,
    margin + 8,
    currentY + 19
  );

  currentY += 28;

  // 2. METADATA SUMMARY BAR
  doc.setFillColor(...bgLight);
  doc.setDrawColor(188, 201, 206);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, currentY, contentWidth, 14, 2, 2, 'FD');

  doc.setFontSize(8);
  doc.setTextColor(...darkTextColor);
  doc.setFont('helvetica', 'bold');
  doc.text('ÁMBITO DE VIGILANCIA:', margin + 4, currentY + 5.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...mutedTextColor);
  doc.text(
    systemNameFilter ? `Sistema específico: ${systemNameFilter}` : 'Red Integral de Sistemas Monitoreados',
    margin + 45,
    currentY + 5.5
  );

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...darkTextColor);
  doc.text('CRITERIO DE FILTRO:', margin + 4, currentY + 10.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...mutedTextColor);
  const filterLabel =
    filterType === 'all'
      ? 'Todos los Registros Históricos'
      : filterType === 'optimal'
      ? 'Solo Eventos en Conformidad Óptima (0.5 - 2.0 ppm)'
      : 'Solo Alertas y No Conformidades Sanitarias';
  doc.text(filterLabel, margin + 45, currentY + 10.5);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...darkTextColor);
  doc.text('AUDITOR / OPERADOR:', margin + 115, currentY + 5.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...mutedTextColor);
  doc.text(operatorName, margin + 152, currentY + 5.5);

  currentY += 18;

  // 3. EXECUTIVE KPI CARDS GRID (6 metrics)
  const cardGap = 3;
  const cardWidth = (contentWidth - cardGap * 2) / 3;
  const cardHeight = 16;

  interface KpiCard {
    label: string;
    value: string;
    sublabel: string;
    alert?: boolean;
    success?: boolean;
  }

  const kpis: KpiCard[] = [
    {
      label: 'CUMPLIMIENTO NORMATIVO',
      value: `${complianceRate.toFixed(1)}%`,
      sublabel: `${optimalRecords.length} de ${totalCount} muestras ≥0.5 ppm`,
      success: complianceRate >= 80,
      alert: complianceRate < 80,
    },
    {
      label: 'CLORO RESIDUAL PROMEDIO',
      value: `${avgPostChlorine.toFixed(2)} ppm`,
      sublabel: `Rango: ${minPostChlorine.toFixed(2)} - ${maxPostChlorine.toFixed(2)} ppm`,
      success: avgPostChlorine >= 0.5 && avgPostChlorine <= 2.0,
      alert: avgPostChlorine < 0.5 || avgPostChlorine > 2.0,
    },
    {
      label: 'VOLUMEN TRATADO TOTAL',
      value: `${Math.round(totalVolumeLiters / 1000).toLocaleString('es-PE')} m³`,
      sublabel: `${totalVolumeLiters.toLocaleString('es-PE')} Litros desinfectados`,
    },
    {
      label: 'pH MEDIO REGISTRADO',
      value: avgPh.toFixed(2),
      sublabel: 'Rango Óptimo Normativo: 6.5 – 8.5',
      success: avgPh >= 6.5 && avgPh <= 8.5,
      alert: avgPh < 6.5 || avgPh > 8.5,
    },
    {
      label: 'TURBIEDAD MEDIA',
      value: `${avgTurbidity.toFixed(2)} NTU`,
      sublabel: 'Límite Máximo: < 5.0 NTU (Óptimo <1)',
      success: avgTurbidity < 5.0,
      alert: avgTurbidity >= 5.0,
    },
    {
      label: 'INCIDENCIAS / ALERTAS',
      value: `${alertRecords.length} Eventos`,
      sublabel: alertRecords.length === 0 ? 'Sin alertas registradas' : 'Requieren seguimiento técnico',
      alert: alertRecords.length > 0,
      success: alertRecords.length === 0,
    },
  ];

  kpis.forEach((kpi, idx) => {
    const row = Math.floor(idx / 3);
    const col = idx % 3;
    const x = margin + col * (cardWidth + cardGap);
    const y = currentY + row * (cardHeight + cardGap);

    doc.setFillColor(...bgLight);
    doc.setDrawColor(200, 215, 225);
    doc.setLineWidth(0.2);
    doc.roundedRect(x, y, cardWidth, cardHeight, 1.5, 1.5, 'FD');

    // Left colored accent border
    const borderCol: [number, number, number] = kpi.alert
      ? dangerColor
      : kpi.success
      ? successColor
      : secondaryColor;
    doc.setFillColor(...borderCol);
    doc.roundedRect(x, y, 1.8, cardHeight, 1, 1, 'F');

    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...mutedTextColor);
    doc.text(kpi.label, x + 4, y + 4.5);

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    if (kpi.alert) doc.setTextColor(...dangerColor);
    else if (kpi.success) doc.setTextColor(...successColor);
    else doc.setTextColor(...primaryColor);
    doc.text(kpi.value, x + 4, y + 10);

    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...mutedTextColor);
    doc.text(kpi.sublabel, x + 4, y + 14);
  });

  currentY += (cardHeight + cardGap) * 2 + 4;

  // 4. TREND & BEHAVIOR ANALYSIS SECTION
  doc.setFillColor(237, 245, 252);
  doc.roundedRect(margin, currentY, contentWidth, 18, 2, 2, 'F');

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryColor);
  doc.text('TENDENCIAS Y COMPORTAMIENTO SANITARIO OBSERVADO', margin + 4, currentY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...darkTextColor);

  // Sampling points breakdown
  const pointsMap = new Map<string, number>();
  records.forEach((r) => {
    const pt = r.measurementPoint || 'Punto no especificado';
    pointsMap.set(pt, (pointsMap.get(pt) || 0) + 1);
  });
  const pointsSummary = Array.from(pointsMap.entries())
    .map(([pt, count]) => `${pt} (${count})`)
    .join(' • ');

  const trendText1 = `• Monitoreo de Puntos de Muestreo: ${pointsSummary || 'Red General'}.`;
  const trendText2 = `• Evaluación de Cloración: Se constata un Cloro Residual Libre promedio de ${avgPostChlorine.toFixed(2)} ppm. ${
    complianceRate >= 90
      ? 'La red mantiene una barrera microbiológica consistente conforme al D.S. 031-2010-SA.'
      : complianceRate >= 70
      ? 'Se observa adecuada desinfección general con desvíos puntuales que demandan calibración de dosificador.'
      : 'ADVERTENCIA: Bajo cumplimiento normativo. Se recomienda verificar la demanda de cloro y purgar sedimentos.'
  }`;

  doc.text(trendText1, margin + 4, currentY + 10);
  doc.text(trendText2, margin + 4, currentY + 14.5);

  currentY += 22;

  // 5. DETAILED MEASUREMENT TABLE (jspdf-autotable)
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...darkTextColor);
  doc.text('DETALLE CRONOLÓGICO DE MEDICIONES Y DOSIFICACIONES IN SITU', margin, currentY + 3);
  currentY += 5;

  const tableHeaders = [
    'Fecha/Hora',
    'Sistema / Sector',
    'Punto Muestreo',
    'Cloro Ini.',
    'Dosis Aplicada',
    'Cloro Post',
    'pH',
    'Turb.',
    'Estado Normativo',
    'Responsable',
  ];

  const tableRows = records.map((r) => {
    const postCl = r.postChlorinePpm ?? r.targetChlorinePpm;
    const isOptimal = r.status === 'optimal';
    const statusText = isOptimal
      ? 'CUMPLE (0.5-2.0)'
      : postCl < 0.5
      ? 'ALERTA: < 0.5'
      : 'EXCESO: > 2.0';

    return [
      `${r.dateStr}\n${r.timeStr}`,
      r.systemName,
      r.measurementPoint || r.centerPoblado,
      `${r.initialChlorinePpm.toFixed(2)} ppm`,
      `${r.calculatedDoseValue} ${r.calculatedDoseUnit}`,
      `${postCl.toFixed(2)} ppm`,
      r.ph ? r.ph.toFixed(1) : '7.2',
      r.turbidityNtu ? `${r.turbidityNtu.toFixed(1)} NTU` : '0.5 NTU',
      statusText,
      r.responsible || 'Operador',
    ];
  });

  autoTable(doc, {
    startY: currentY,
    head: [tableHeaders],
    body: tableRows,
    margin: { left: margin, right: margin },
    theme: 'grid',
    styles: {
      fontSize: 7,
      cellPadding: 2,
      textColor: [21, 29, 34],
      lineColor: [220, 230, 235],
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.2,
      halign: 'center',
    },
    columnStyles: {
      0: { cellWidth: 20, halign: 'center' },
      1: { cellWidth: 28 },
      2: { cellWidth: 26 },
      3: { cellWidth: 15, halign: 'right' },
      4: { cellWidth: 18, halign: 'center' },
      5: { cellWidth: 16, halign: 'right', fontStyle: 'bold' },
      6: { cellWidth: 10, halign: 'center' },
      7: { cellWidth: 14, halign: 'center' },
      8: { cellWidth: 22, halign: 'center', fontStyle: 'bold' },
      9: { cellWidth: 'auto' },
    },
    didParseCell: (data) => {
      // Colorize the post-chlorine and status columns
      if (data.section === 'body') {
        const rawRow = records[data.row.index];
        if (rawRow) {
          const isOptimal = rawRow.status === 'optimal';
          if (data.column.index === 5) {
            data.cell.styles.textColor = isOptimal ? successColor : dangerColor;
          }
          if (data.column.index === 8) {
            data.cell.styles.textColor = isOptimal ? successColor : dangerColor;
          }
        }
      }
    },
  });

  // 6. TECHNICAL NOTE & SIGNATURE STAMPS
  // Get last autoTable Y position
  const finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 8 : currentY + 30;

  // If near bottom of page, add a new page
  let signY = finalY;
  if (signY > pageHeight - 45) {
    doc.addPage();
    signY = margin + 10;
  }

  // Legal reference box
  doc.setFillColor(...bgLight);
  doc.setDrawColor(200, 215, 225);
  doc.roundedRect(margin, signY, contentWidth, 12, 1.5, 1.5, 'FD');
  doc.setFontSize(6.8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryColor);
  doc.text('MARCO LEGAL Y CRITERIO TÉCNICO VIGENTE:', margin + 3, signY + 4.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...mutedTextColor);
  doc.text(
    'D.S. N.° 031-2010-SA (Art. 66°): El agua de consumo humano en cualquier punto de la red de distribución debe contener una concentración de cloro residual libre no menor a 0.5 mg/L, medido in situ mediante reactivo DPD.',
    margin + 3,
    signY + 8.5
  );

  signY += 18;

  // Signature lines
  const sigWidth = 70;
  const sigGap = contentWidth - sigWidth * 2;

  // Signature 1: Health Authority / ATM
  doc.setDrawColor(120, 140, 150);
  doc.setLineWidth(0.4);
  doc.line(margin + 5, signY + 12, margin + 5 + sigWidth, signY + 12);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...darkTextColor);
  doc.text('RESPONSABLE DE VIGILANCIA SANITARIA', margin + 5 + sigWidth / 2, signY + 16, {
    align: 'center',
  });
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...mutedTextColor);
  doc.text('Área Técnica Municipal (ATM) / DIGESA / DIRESA', margin + 5 + sigWidth / 2, signY + 19.5, {
    align: 'center',
  });

  // Signature 2: System Operator / JASS
  const sig2X = margin + 5 + sigWidth + sigGap - 10;
  doc.line(sig2X, signY + 12, sig2X + sigWidth, signY + 12);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...darkTextColor);
  doc.text('OPERADOR DEL SISTEMA DE AGUA / JASS', sig2X + sigWidth / 2, signY + 16, {
    align: 'center',
  });
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...mutedTextColor);
  doc.text(operatorName || 'Junta Administradora de Servicios de Saneamiento', sig2X + sigWidth / 2, signY + 19.5, {
    align: 'center',
  });

  // 7. FOOTER ON ALL PAGES
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...mutedTextColor);
    doc.text(
      'CLORAGUA • Plataforma Técnica de Vigilancia y Control de Cloración • Perú',
      margin,
      pageHeight - 6
    );
    doc.text(`Página ${i} de ${totalPages}`, pageWidth - margin, pageHeight - 6, { align: 'right' });
  }

  // Save the PDF file
  const dateSlug = new Date().toISOString().slice(0, 10);
  doc.save(`CLORAGUA_Reporte_Vigilancia_${dateSlug}.pdf`);
}
