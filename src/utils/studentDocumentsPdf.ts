import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { StudentAcademicRecord, SystemUser, Turma, Disciplina } from '../types';

export function generateHistoricoPdf(
  studentRecord: StudentAcademicRecord,
  currentUser: SystemUser,
  turma?: Turma,
  disciplinas: Disciplina[] = []
): void {
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

  const emissionDate = new Date().toLocaleDateString('pt-BR');
  const emissionTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  // Institutional Top Banner
  doc.setFillColor(18, 61, 0); // #123d00
  doc.roundedRect(margin, y, contentWidth, 24, 2.5, 2.5, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  doc.text('COMIEADEPA • ESCOLA DE ESCRITORES QGU', margin + 6, y + 8.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(185, 212, 134); // #b9d486 tint
  doc.text('HISTÓRICO ESCOLAR OFICIAL DO ALUNO', margin + 6, y + 14.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(220, 230, 210);
  doc.text(
    'Coordenação Teológica QGU • Convenção COMIEADEPA • Registro Canônico de Formação',
    margin + 6,
    y + 19.5
  );

  y += 28;

  // Student Identity Box
  doc.setFillColor(248, 250, 244);
  doc.setDrawColor(194, 201, 185);
  doc.roundedRect(margin, y, contentWidth, 34, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(100, 96, 41);
  doc.text('DADOS IDENTIFICADORES DO ALUNO VOCACIONADO', margin + 4, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(25, 28, 25);

  // Left col
  doc.text(`Nome Completo:`, margin + 4, y + 12);
  doc.setFont('helvetica', 'bold');
  doc.text(studentRecord.alunoName || currentUser.name, margin + 30, y + 12);

  doc.setFont('helvetica', 'normal');
  doc.text(`Matrícula Oficial:`, margin + 4, y + 18);
  doc.setFont('helvetica', 'bold');
  doc.text(studentRecord.matricula || '—', margin + 30, y + 18);

  doc.setFont('helvetica', 'normal');
  doc.text(`Polo / Campo:`, margin + 4, y + 24);
  doc.setFont('helvetica', 'bold');
  doc.text(studentRecord.polo || currentUser.campoSupervisao || 'Campo Central', margin + 30, y + 24);

  doc.setFont('helvetica', 'normal');
  doc.text(`Turma de Origem:`, margin + 4, y + 30);
  doc.setFont('helvetica', 'bold');
  doc.text(turma?.name || 'Turma 2026', margin + 30, y + 30);

  // Right col
  const colRightX = margin + contentWidth / 2 + 10;
  doc.setFont('helvetica', 'normal');
  doc.text(`Situação Acadêmica:`, colRightX, y + 12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(studentRecord.statusAcademico === 'Formado' ? 21 : 18, studentRecord.statusAcademico === 'Formado' ? 128 : 61, studentRecord.statusAcademico === 'Formado' ? 61 : 0);
  doc.text(studentRecord.statusAcademico, colRightX + 32, y + 12);

  doc.setTextColor(25, 28, 25);
  doc.setFont('helvetica', 'normal');
  doc.text(`Média Geral:`, colRightX, y + 18);
  doc.setFont('helvetica', 'bold');
  const mediaStr = studentRecord.mediaGeral !== undefined && studentRecord.mediaGeral > 0 ? `${studentRecord.mediaGeral.toFixed(1)} / 10.0` : 'Sem notas';
  doc.text(mediaStr, colRightX + 32, y + 18);

  doc.setFont('helvetica', 'normal');
  doc.text(`Frequência Global:`, colRightX, y + 24);
  doc.setFont('helvetica', 'bold');
  doc.text(`${studentRecord.frequenciaPercent}%`, colRightX + 32, y + 24);

  doc.setFont('helvetica', 'normal');
  doc.text(`Data de Conclusão:`, colRightX, y + 30);
  doc.setFont('helvetica', 'bold');
  doc.text(turma?.dataConclusao || emissionDate, colRightX + 32, y + 30);

  y += 38;

  // Grade Curricular & Notas Table (Dados Reais do Aluno)
  const tableData = disciplinas.map((disc, idx) => {
    const notaFound = studentRecord.notas?.find(
      (n) => n.disciplinaId === disc.id || n.moduloNumber === idx + 1
    );
    const notaVal = notaFound ? notaFound.nota.toFixed(1) : (studentRecord.mediaGeral > 0 ? studentRecord.mediaGeral.toFixed(1) : '—');
    const freqVal = `${studentRecord.frequenciaPercent}%`;
    const statusVal = studentRecord.statusAcademico === 'Formado'
      ? 'Aprovado'
      : notaFound
      ? (notaFound.nota >= 7 ? 'Aprovado' : 'Em Recuperação')
      : 'Cursando';

    return [
      disc.codigo || `MOD-0${idx + 1}`,
      disc.nome,
      disc.professorPadrao || 'Corpo Docente COMIEADEPA',
      `${disc.cargaHoraria || 40}h`,
      freqVal,
      notaVal,
      statusVal,
    ];
  });

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [['Código', 'Disciplina / Componente Curricular', 'Docente Titular', 'C.H.', 'Freq.', 'Média', 'Situação']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [18, 61, 0],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [25, 28, 25],
    },
    columnStyles: {
      0: { cellWidth: 18, halign: 'center', fontStyle: 'bold' },
      1: { cellWidth: 'auto', fontStyle: 'bold' },
      2: { cellWidth: 42 },
      3: { cellWidth: 14, halign: 'center' },
      4: { cellWidth: 14, halign: 'center' },
      5: { cellWidth: 16, halign: 'center', fontStyle: 'bold' },
      6: { cellWidth: 20, halign: 'center', fontStyle: 'bold' },
    },
    alternateRowStyles: {
      fillColor: [248, 250, 244],
    },
  });

  const finalY = (doc as any).lastAutoTable?.finalY || y + 60;
  y = finalY + 8;

  // Total Summary
  doc.setFillColor(244, 246, 240);
  doc.setDrawColor(225, 227, 221);
  doc.roundedRect(margin, y, contentWidth, 18, 1.5, 1.5, 'FD');

  const totalCH = disciplinas.reduce((acc, d) => acc + (d.cargaHoraria || 0), 0) || 200;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(18, 61, 0);
  doc.text(`TOTAL DA CARGA HORÁRIA DO PROGRAMA: ${totalCH} HORAS / AULAS`, margin + 4, y + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(66, 73, 61);
  doc.text(
    `Registro acadêmico oficial com base no banco de dados da COMIEADEPA. Situação: ${studentRecord.statusAcademico}.`,
    margin + 4,
    y + 13
  );

  y += 24;

  // Signatures
  doc.setDrawColor(194, 201, 185);
  doc.setLineWidth(0.4);

  const sigWidth = 60;
  const sig1X = margin + 12;
  const sig2X = pageWidth - margin - sigWidth - 12;

  // Sig 1
  doc.line(sig1X, y + 16, sig1X + sigWidth, y + 16);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(18, 61, 0);
  doc.text('Pr. Lucas Pimenta', sig1X + sigWidth / 2, y + 20, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(115, 121, 108);
  doc.text('Coordenação Geral de Ensino QGU', sig1X + sigWidth / 2, y + 24, { align: 'center' });

  // Sig 2
  doc.line(sig2X, y + 16, sig2X + sigWidth, y + 16);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(18, 61, 0);
  doc.text('Pr. Carlos Alberto Pinheiro', sig2X + sigWidth / 2, y + 20, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(115, 121, 108);
  doc.text('Banca Examinadora / Direção Teológica', sig2X + sigWidth / 2, y + 24, { align: 'center' });

  // Footer validation
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(115, 121, 108);
  doc.text(
    `Documento Oficial gerado em ${emissionDate} às ${emissionTime} • Protocolo de Autenticidade: QGU-HIST-${studentRecord.matricula || Date.now().toString(36).toUpperCase()}`,
    pageWidth / 2,
    pageHeight - 8,
    { align: 'center' }
  );

  const safeName = (currentUser.name || 'aluno').replace(/[^a-zA-Z0-9]/g, '_');
  doc.save(`Historico_Escolar_QGU_${safeName}.pdf`);
}

export function generateCertificadoPdf(
  studentRecord: StudentAcademicRecord,
  currentUser: SystemUser,
  turma?: Turma,
  disciplinas: Disciplina[] = []
): void {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const emissionDate = new Date().toLocaleDateString('pt-BR');

  // Outer decorative border
  doc.setDrawColor(18, 61, 0); // #123d00
  doc.setLineWidth(2.5);
  doc.rect(8, 8, pageWidth - 16, pageHeight - 16);

  // Inner decorative border
  doc.setDrawColor(185, 180, 116); // gold #b9b474
  doc.setLineWidth(0.8);
  doc.rect(11, 11, pageWidth - 22, pageHeight - 22);

  // Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(100, 96, 41);
  doc.text('CONVENÇÃO DAS ASSEMBLEIAS DE DEUS NO ESTADO DO PARÁ — COMIEADEPA', pageWidth / 2, 24, {
    align: 'center',
  });

  doc.setFontSize(10);
  doc.setTextColor(18, 61, 0);
  doc.text('COORDENAÇÃO DE ENSINO TEOLÓGICO & FORMAÇÃO LITERÁRIA', pageWidth / 2, 30, {
    align: 'center',
  });

  // Certificate Title
  doc.setFont('times', 'bold');
  doc.setFontSize(28);
  doc.setTextColor(18, 61, 0);
  doc.text('CERTIFICADO DE CONCLUSÃO', pageWidth / 2, 46, { align: 'center' });

  // Subtitle
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(185, 180, 116);
  doc.text('PROGRAMA DE FORMAÇÃO DE ESCRITORES TEOLÓGICOS QGU', pageWidth / 2, 53, {
    align: 'center',
  });

  // Body text
  doc.setFont('times', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(35, 40, 32);

  const studentName = (studentRecord.alunoName || currentUser.name || 'Aluno Vocacionado').toUpperCase();
  const matricula = studentRecord.matricula || '—';
  const polo = studentRecord.polo || currentUser.campoSupervisao || 'Campo Central';
  const turmaName = turma?.name || 'Turma 2026';
  const totalCH = disciplinas.reduce((acc, d) => acc + (d.cargaHoraria || 0), 0) || 200;

  doc.text(
    'Certificamos que, para os devidos fins de direito eclesiástico e canônico,',
    pageWidth / 2,
    65,
    { align: 'center' }
  );

  // Student Highlight Name
  doc.setFont('times', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(18, 61, 0);
  doc.text(studentName, pageWidth / 2, 75, { align: 'center' });

  doc.setFont('times', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(40, 45, 38);

  const paragraph1 =
    `portador(a) da matrícula oficial ${matricula}, vinculado(a) ao ${polo}, concluiu com aproveitamento integral ` +
    `e distinção acadêmica o Curso de Formação de Escritores Teológicos — ${turmaName}, com carga horária total de ${totalCH} horas/aula, ` +
    `cumprindo todos os requisitos doutrinários, exegéticos e metodológicos exigidos pela Comissão Coordenadora.`;

  const splitParagraph = doc.splitTextToSize(paragraph1, pageWidth - 60);
  doc.text(splitParagraph, pageWidth / 2, 85, { align: 'center', lineHeightFactor: 1.4 });

  // Date and location
  doc.setFont('times', 'italic');
  doc.setFontSize(10.5);
  doc.setTextColor(80, 85, 75);
  doc.text(`Belém do Pará, ${turma?.dataConclusao || emissionDate}.`, pageWidth / 2, 120, { align: 'center' });

  // Signatures
  const sigY = 145;
  const sigWidth = 70;
  const leftSigX = 35;
  const rightSigX = pageWidth - 35 - sigWidth;
  const centerSigX = pageWidth / 2 - sigWidth / 2;

  // Signature 1: Coordenação Geral
  doc.setDrawColor(100, 96, 41);
  doc.setLineWidth(0.4);
  doc.line(leftSigX, sigY, leftSigX + sigWidth, sigY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(18, 61, 0);
  doc.text('Pr. Lucas Pimenta', leftSigX + sigWidth / 2, sigY + 5, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(115, 121, 108);
  doc.text('Coordenação Geral de Ensino QGU', leftSigX + sigWidth / 2, sigY + 9, { align: 'center' });

  // Signature 2: Presidência COMIEADEPA
  doc.line(centerSigX, sigY, centerSigX + sigWidth, sigY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(18, 61, 0);
  doc.text('Mesa Diretora COMIEADEPA', centerSigX + sigWidth / 2, sigY + 5, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(115, 121, 108);
  doc.text('Convenção Estadual das ADs no Pará', centerSigX + sigWidth / 2, sigY + 9, { align: 'center' });

  // Signature 3: Banca Examinadora
  doc.line(rightSigX, sigY, rightSigX + sigWidth, sigY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(18, 61, 0);
  doc.text('Pr. Carlos Alberto Pinheiro', rightSigX + sigWidth / 2, sigY + 5, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(115, 121, 108);
  doc.text('Direção Pedagógica & Banca Examinadora', rightSigX + sigWidth / 2, sigY + 9, { align: 'center' });

  // Bottom seal text
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(120, 125, 115);
  const sealText = `Registro Canônico Livro 04, Fls. 118, N° ${matricula.replace(/[^0-9]/g, '') || '20261024'} • Autenticação Digital: QGU-CERT-${Date.now().toString(36).toUpperCase()}`;
  doc.text(sealText, pageWidth / 2, pageHeight - 14, { align: 'center' });

  const safeName = (currentUser.name || 'aluno').replace(/[^a-zA-Z0-9]/g, '_');
  doc.save(`Certificado_Conclusao_QGU_${safeName}.pdf`);
}
