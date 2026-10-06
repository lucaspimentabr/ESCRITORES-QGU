import { jsPDF } from 'jspdf';
import { Candidate, CandidateStatus } from '../types';

export interface GenerateReportPdfOptions {
  reportData: Candidate[];
  statusFilter: CandidateStatus | 'ALL';
  filterLabel: string;
  emissionDate: string;
  emissionTime: string;
}

export function createReportPdfDocument(options: GenerateReportPdfOptions): jsPDF {
  const { reportData, statusFilter, filterLabel, emissionDate, emissionTime } = options;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  let y = 14;

  const checkPageBreak = (neededHeight: number, callbackBeforeNew?: () => void) => {
    if (y + neededHeight > pageHeight - 16) {
      doc.addPage();
      y = 16;
      drawRunningHeader();
      if (callbackBeforeNew) {
        callbackBeforeNew();
      }
    }
  };

  const drawRunningHeader = () => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 96, 41); // #646029
    doc.text('ESCRITORES QGU — RELATÓRIO OFICIAL DE CANDIDATOS', margin, y - 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(115, 121, 108);
    doc.text(`Emissão: ${emissionDate} às ${emissionTime}`, pageWidth - margin, y - 5, {
      align: 'right',
    });

    doc.setDrawColor(225, 227, 221);
    doc.setLineWidth(0.3);
    doc.line(margin, y - 3, pageWidth - margin, y - 3);
  };

  // 1. Institutional Top Header Banner
  doc.setFillColor(18, 61, 0); // #123d00
  doc.roundedRect(margin, y, contentWidth, 24, 2.5, 2.5, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  doc.text('ESCRITORES QGU', margin + 6, y + 8.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(185, 212, 134); // #b9d486 tint
  doc.text('RELATÓRIO OFICIAL DE CANDIDATOS', margin + 6, y + 14.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(220, 230, 210);
  doc.text(
    'Coordenação Teológica QGU • Convenção COMIEADEPA • Processo Seletivo 2026',
    margin + 6,
    y + 19.5
  );

  y += 28;

  // 2. Metadata Info Box
  doc.setFillColor(248, 250, 244); // #f8faf4
  doc.setDrawColor(194, 201, 185); // #c2c9b9
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, y, contentWidth, 14, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(18, 61, 0);
  doc.text('FILTRO APLICADO:', margin + 4, y + 5.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(25, 28, 25);
  doc.text(filterLabel, margin + 35, y + 5.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(18, 61, 0);
  doc.text('TOTAL:', margin + 4, y + 10.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(25, 28, 25);
  doc.text(
    `${reportData.length} ${reportData.length === 1 ? 'candidato' : 'candidatos'}`,
    margin + 35,
    y + 10.5
  );

  // Right side of info box
  const rightMetaX = margin + contentWidth - 4;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 96, 41);
  doc.text('DATA E HORÁRIO DE EMISSÃO:', rightMetaX, y + 5.5, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(18, 61, 0);
  doc.text(`${emissionDate} às ${emissionTime}`, rightMetaX, y + 10.5, { align: 'right' });

  y += 18;

  // Column geometry
  const colWNum = 10;
  const colWName = 78;
  const colWPolo = 56;
  const colWPhone = 38;

  const colXNum = margin;
  const colXName = colXNum + colWNum;
  const colXPolo = colXName + colWName;
  const colXPhone = colXPolo + colWPolo;

  const renderTableHeader = () => {
    doc.setFillColor(18, 61, 0);
    doc.rect(margin, y, contentWidth, 6.5, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(255, 255, 255);

    doc.text('#', colXNum + colWNum / 2, y + 4.5, { align: 'center' });
    doc.text('NOME DO CANDIDATO', colXName + 2, y + 4.5);
    doc.text('CAMPO', colXPolo + 2, y + 4.5);
    doc.text('WHATSAPP', colXPhone + colWPhone - 2, y + 4.5, { align: 'right' });

    y += 6.5;
  };

  const renderCandidateRow = (c: Candidate, index: number) => {
    checkPageBreak(7.5, () => {
      renderTableHeader();
    });

    const isEven = index % 2 === 0;
    if (isEven) {
      doc.setFillColor(255, 255, 255);
    } else {
      doc.setFillColor(249, 250, 246);
    }
    doc.rect(margin, y, contentWidth, 7, 'F');

    // Bottom border
    doc.setDrawColor(235, 237, 231);
    doc.setLineWidth(0.2);
    doc.line(margin, y + 7, margin + contentWidth, y + 7);

    // Col 1: Number
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(115, 121, 108);
    doc.text(String(index + 1), colXNum + colWNum / 2, y + 4.8, { align: 'center' });

    // Col 2: Name
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(25, 28, 25);
    let nameText = c.fullName;
    if (doc.getTextWidth(nameText) > colWName - 4) {
      while (doc.getTextWidth(nameText + '...') > colWName - 4 && nameText.length > 0) {
        nameText = nameText.slice(0, -1);
      }
      nameText += '...';
    }
    doc.text(nameText, colXName + 2, y + 4.8);

    // Col 3: Polo
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(66, 73, 61);
    let poloText = c.polo || '—';
    if (doc.getTextWidth(poloText) > colWPolo - 4) {
      while (doc.getTextWidth(poloText + '...') > colWPolo - 4 && poloText.length > 0) {
        poloText = poloText.slice(0, -1);
      }
      poloText += '...';
    }
    doc.text(poloText, colXPolo + 2, y + 4.8);

    // Col 4: Phone
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(18, 61, 0);
    const phoneText = c.phone || '—';
    doc.text(phoneText, colXPhone + colWPhone - 2, y + 4.8, { align: 'right' });

    y += 7;
  };

  // Section rendering logic
  if (statusFilter === 'ALL') {
    const aprovados = reportData.filter((c) => c.status === 'APROVADO');
    const emAnalise = reportData.filter((c) => c.status === 'EM_ANALISE');
    const reprovados = reportData.filter((c) => c.status === 'REPROVADO');

    const sections = [
      {
        title: 'CANDIDATOS APROVADOS',
        list: aprovados,
        headerBg: [220, 252, 231], // #dcfce7
        textColor: [21, 128, 61], // #15803d
      },
      {
        title: 'CANDIDATOS EM ANÁLISE',
        list: emAnalise,
        headerBg: [241, 245, 249], // #f1f5f9
        textColor: [71, 85, 105], // #475569
      },
      {
        title: 'CANDIDATOS REPROVADOS',
        list: reprovados,
        headerBg: [254, 226, 226], // #fee2e2
        textColor: [185, 28, 28], // #b91c1c
      },
    ].filter((s) => s.list.length > 0);

    sections.forEach((sec, sIdx) => {
      checkPageBreak(18);

      // Section Badge/Title
      doc.setFillColor(sec.headerBg[0], sec.headerBg[1], sec.headerBg[2]);
      doc.roundedRect(margin, y, contentWidth, 7.5, 1.5, 1.5, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(sec.textColor[0], sec.textColor[1], sec.textColor[2]);
      doc.text(
        `${sec.title} (${sec.list.length} ${sec.list.length === 1 ? 'candidato' : 'candidatos'})`,
        margin + 4,
        y + 5.2
      );

      y += 9;

      renderTableHeader();
      sec.list.forEach((c, cIdx) => {
        renderCandidateRow(c, cIdx);
      });

      y += 4;
    });
  } else {
    // Single status filter list
    renderTableHeader();
    reportData.forEach((c, idx) => {
      renderCandidateRow(c, idx);
    });
  }

  // 3. Footers on all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    // Footer divider line
    doc.setDrawColor(210, 215, 205);
    doc.setLineWidth(0.3);
    doc.line(margin, pageHeight - 11, pageWidth - margin, pageHeight - 11);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(115, 121, 108);
    doc.text(
      'Documento oficial emitido pelo Sistema de Gestão do Processo Seletivo • Escritores QGU',
      margin,
      pageHeight - 7
    );

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 96, 41);
    doc.text(`Página ${i} de ${totalPages}`, pageWidth - margin, pageHeight - 7, {
      align: 'right',
    });
  }

  return doc;
}

export function printReportPdf(options: GenerateReportPdfOptions): void {
  const doc = createReportPdfDocument(options);

  // Configure autoPrint action so PDF viewers prompt the print dialog
  doc.autoPrint();

  const pdfBlob = doc.output('blob');
  const blobUrl = URL.createObjectURL(pdfBlob);

  // Open the PDF in a new tab for printing
  const newTab = window.open(blobUrl, '_blank');

  // Fallback if browser blocked popups or in restricted sandbox
  if (!newTab || newTab.closed || typeof newTab.closed === 'undefined') {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.src = blobUrl;
    document.body.appendChild(iframe);

    iframe.onload = () => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (err) {
        console.warn('Iframe print error, falling back to direct save', err);
        const filterSlug = options.statusFilter.toLowerCase().replace('_', '-');
        doc.save(`Relatorio_Candidatos_${filterSlug}_${new Date().toISOString().slice(0, 10)}.pdf`);
      }
    };
  } else {
    newTab.focus();
  }
}
