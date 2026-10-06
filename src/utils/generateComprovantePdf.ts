import { jsPDF } from 'jspdf';
import { Candidate } from '../types';

export function createComprovantePdfDocument(candidate: Candidate): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;
  let y = 14;

  const checkPageBreak = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - 16) {
      doc.addPage();
      y = 16;
      drawHeaderSmall();
    }
  };

  const drawHeaderSmall = () => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(100, 96, 41); // #646029
    doc.text('ESCRITORES QGU — COMPROVANTE OFICIAL DE INSCRIÇÃO', margin, 10);
    doc.setDrawColor(225, 227, 221);
    doc.setLineWidth(0.3);
    doc.line(margin, 12, pageWidth - margin, 12);
  };

  // 1. Institutional Top Banner
  doc.setFillColor(18, 61, 0); // #123d00
  doc.roundedRect(margin, y, contentWidth, 26, 3, 3, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text('ESCRITORES QGU', margin + 6, y + 10);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(194, 201, 185); // Light sage
  doc.text('COMPROVANTE OFICIAL DE INSCRIÇÃO NO PROCESSO SELETIVO', margin + 6, y + 16);

  doc.setFontSize(8);
  doc.setTextColor(185, 212, 134); // Tint
  doc.text('Coordenação Teológica QGU • Convenção COMIEADEPA', margin + 6, y + 21);

  y += 32;

  // 2. Protocol & Registration Status Box
  doc.setFillColor(248, 250, 244); // #f8faf4
  doc.setDrawColor(194, 201, 185); // #c2c9b9
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, y, contentWidth, 22, 2.5, 2.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(115, 121, 108); // #73796c
  doc.text('NÚMERO DE PROTOCOLO', margin + 6, y + 7);
  doc.setFontSize(13);
  doc.setTextColor(18, 61, 0); // #123d00
  doc.text(candidate.id, margin + 6, y + 15);

  const rightColX = margin + contentWidth / 2 + 4;
  doc.setFontSize(8);
  doc.setTextColor(115, 121, 108);
  doc.text('SITUAÇÃO DA INSCRIÇÃO', rightColX, y + 7);
  doc.setFontSize(10);
  doc.setTextColor(21, 128, 61); // #15803d
  doc.text('RECEBIDA / EM ANÁLISE PELA COORDENAÇÃO', rightColX, y + 14);

  y += 28;

  // Helper Section Renderer
  const renderSectionHeader = (title: string) => {
    checkPageBreak(12);
    doc.setFillColor(242, 244, 238); // #f2f4ee
    doc.roundedRect(margin, y, contentWidth, 7, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(18, 61, 0);
    doc.text(title, margin + 4, y + 5);
    y += 10;
  };

  // 3. Candidate Personal Data Section
  renderSectionHeader('1. DADOS CADASTRAIS DO CANDIDATO');

  const renderFieldRow = (label1: string, val1: string, label2?: string, val2?: string) => {
    checkPageBreak(10);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(115, 121, 108);
    doc.text(label1, margin + 2, y);

    if (label2) {
      doc.text(label2, margin + contentWidth / 2 + 2, y);
    }
    y += 4.5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(25, 28, 25);
    doc.text(val1 || 'Não informado', margin + 2, y);

    if (val2 && label2) {
      doc.text(val2, margin + contentWidth / 2 + 2, y);
    }
    y += 6.5;
  };

  renderFieldRow(
    'NOME COMPLETO:',
    candidate.fullName,
    'DATA DE NASCIMENTO:',
    candidate.birthDate && candidate.birthDate !== 'Não informada'
      ? `${candidate.birthDate} (${candidate.age || '--'} anos)`
      : 'Não informada'
  );

  renderFieldRow('CORREIO ELETRÔNICO (E-MAIL):', candidate.email, 'WHATSAPP / CONTATO:', candidate.phone);

  renderFieldRow(
    'CAMPO / SUPERVISÃO:',
    candidate.polo,
    'PASTOR PRESIDENTE:',
    candidate.pastor
  );

  renderFieldRow(
    'CONGREGAÇÃO / IGREJA:',
    candidate.church || 'Igreja Sede / Campo Local',
    'DATA E HORA DO REGISTRO:',
    candidate.registrationDate
  );

  y += 3;

  // 4. Theological Evaluation Summary
  renderSectionHeader('2. DESEMPENHO NA AVALIAÇÃO DE CONHECIMENTOS GERAIS');

  doc.setFillColor(252, 253, 250);
  doc.setDrawColor(225, 227, 221);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, y, contentWidth, 18, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(18, 61, 0);
  doc.text('ETAPA OBJETIVA (TEOLOGIA BÍBLICA E DOUTRINA)', margin + 4, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(66, 73, 61);
  doc.text(
    `Acertos: ${candidate.objectiveScore.correct} de ${candidate.objectiveScore.total} questões (${candidate.objectiveScore.percentage}%)`,
    margin + 4,
    y + 12
  );

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(18, 61, 0);
  doc.text('QUESTÃO DISCURSIVA', margin + contentWidth / 2 + 4, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(66, 73, 61);
  doc.text('Redação submetida para parecer da Coordenação', margin + contentWidth / 2 + 4, y + 12);

  y += 24;

  // 5. Submitted Motivation Preview
  if (candidate.memorial) {
    renderSectionHeader('3. DECLARAÇÃO DE MOTIVAÇÃO REGISTRADA');
    checkPageBreak(25);

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8.5);
    doc.setTextColor(66, 73, 61);

    const splitMotivation = doc.splitTextToSize(candidate.memorial, contentWidth - 8);
    const boxHeight = Math.min(splitMotivation.length * 4.5 + 8, 45);

    doc.setFillColor(248, 250, 244);
    doc.roundedRect(margin, y, contentWidth, boxHeight, 2, 2, 'F');

    doc.text(splitMotivation.slice(0, 8), margin + 4, y + 5.5);
    y += boxHeight + 6;
  }

  // 6. Institutional Guidelines & Contact
  renderSectionHeader('4. PRÓXIMOS PASSOS E INFORMAÇÕES GERAIS');

  const instructions = [
    '• A confirmação oficial e o resultado serão enviados para o e-mail cadastrado.',
    '• Para esclarecimento de dúvidas sobre a inscrição, entre em contato via WhatsApp com o coordenador teológico QGU Lucas Pimenta: (91) 98257-7589.',
    '• Mantenha este comprovante arquivado para comprovação de inscrição.',
  ];

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(66, 73, 61);
  instructions.forEach((item) => {
    checkPageBreak(6);
    doc.text(item, margin + 2, y);
    y += 4.8;
  });

  y += 4;

  // 7. Footer / Digital Chancery
  checkPageBreak(20);
  doc.setDrawColor(225, 227, 221);
  doc.setLineWidth(0.4);
  doc.line(margin, y, pageWidth - margin, y);
  y += 5;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(18, 61, 0);
  doc.text('PROJETO ESCRITORES QGU — COORDENAÇÃO TEOLÓGICA', margin, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(115, 121, 108);
  const emitDate = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  doc.text(`Documento gerado eletronicamente em ${emitDate} • Autenticação: ${candidate.id}`, margin, y + 4);

  return doc;
}

export function downloadComprovantePdf(candidate: Candidate): void {
  const doc = createComprovantePdfDocument(candidate);
  const cleanId = candidate.id.replace('#', '').replace(/\//g, '-');
  doc.save(`Comprovante_Inscricao_${cleanId}.pdf`);
}

export function printComprovantePdf(candidate: Candidate): void {
  const doc = createComprovantePdfDocument(candidate);
  const cleanId = candidate.id.replace('#', '').replace(/\//g, '-');
  const filename = `Comprovante_Inscricao_${cleanId}.pdf`;

  // Always save / download the PDF so the user has the file
  doc.save(filename);

  // Also open print preview via Blob URL / browser window or hidden iframe
  try {
    const pdfBlob = doc.output('blob');
    const blobUrl = URL.createObjectURL(pdfBlob);

    // Try opening in new tab for native PDF viewer & print controls
    const newWindow = window.open(blobUrl, '_blank');
    if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
      // If popup blocker intervened, try hidden iframe print
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
        } catch {
          // Silent fallback - file is already downloaded
        }
      };
    }
  } catch {
    // If blob URL or iframe is restricted, fallback is already handled by doc.save()
  }
}
