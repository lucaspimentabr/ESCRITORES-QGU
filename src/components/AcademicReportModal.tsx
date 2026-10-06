import React from 'react';
import { X, Printer, Download, ShieldCheck, Award } from 'lucide-react';
import { Turma, StudentAcademicRecord, AcademicModule } from '../types';

interface AcademicReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  turma?: Turma;
  students: StudentAcademicRecord[];
  modules: AcademicModule[];
}

export const AcademicReportModal: React.FC<AcademicReportModalProps> = ({
  isOpen,
  onClose,
  turma,
  students,
  modules,
}) => {
  if (!isOpen || !turma) return null;

  const handlePrint = () => {
    window.print();
  };

  const currentDate = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-3xl border border-[#c2c9b9] w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95">
        {/* Top Actions Bar (Not printed) */}
        <div className="print:hidden bg-[#f4f6f0] border-b border-[#e1e3dd] px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#123d00]" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#082500]">
              Emissão de Relatório Oficial Homologado
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-[#123d00] hover:bg-[#0d2a00] text-white text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer shadow-xs"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir / Salvar PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-[#e7e9e3] text-[#42493d] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="p-8 sm:p-12 overflow-y-auto space-y-8 bg-white text-[#191c19] text-xs font-serif leading-relaxed">
          {/* Official Letterhead Header */}
          <div className="border-b-2 border-[#123d00] pb-6 text-center space-y-2">
            <div className="flex items-center justify-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-[#123d00] text-[#a2d486] flex items-center justify-center font-bold text-lg font-sans shadow-xs">
                QGU
              </div>
              <div className="text-left">
                <h1 className="font-sans font-extrabold text-lg text-[#082500] uppercase tracking-wide">
                  COMIEADEPA • CONVENÇÃO DE MINISTROS
                </h1>
                <p className="font-sans text-[11px] font-bold text-[#646029] uppercase tracking-widest">
                  PROGRAMA ESCRITORES QGU • COORDENAÇÃO ACADÊMICA E TEOLÓGICA
                </p>
              </div>
            </div>
            <p className="font-sans text-[10px] text-[#73796c] uppercase tracking-widest pt-1">
              RELATÓRIO INSTITUCIONAL DE RENDIMENTO ACADÊMICO E GESTÃO DE TURMA
            </p>
          </div>

          {/* Turma Information Box */}
          <div className="bg-[#fafbf8] border border-[#e1e3dd] rounded-2xl p-5 space-y-3 font-sans">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#e1e3dd] pb-2">
              <span className="font-bold text-sm text-[#082500]">{turma.name}</span>
              <span className="text-xs font-semibold text-[#123d00] bg-[#123d00]/10 px-2.5 py-0.5 rounded-md">
                Status: {turma.status}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-[10px] text-[#73796c] uppercase font-bold block">
                  Período Letivo
                </span>
                <span className="font-semibold text-[#191c19]">
                  {turma.dataInicioAulas} a {turma.dataConclusao}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-[#73796c] uppercase font-bold block">
                  Capacidade / Vagas
                </span>
                <span className="font-semibold text-[#191c19]">{turma.vagas} vagas</span>
              </div>
              <div>
                <span className="text-[10px] text-[#73796c] uppercase font-bold block">
                  Inscritos no Edital
                </span>
                <span className="font-semibold text-[#123d00]">{turma.inscritosCount} candidatos</span>
              </div>
              <div>
                <span className="text-[10px] text-[#73796c] uppercase font-bold block">
                  Alunos Matriculados
                </span>
                <span className="font-semibold text-[#15803d]">{students.length} alunos</span>
              </div>
            </div>
          </div>

          {/* Academic Modules Overview */}
          <div className="space-y-3 font-sans">
            <h3 className="font-bold text-xs uppercase tracking-wider text-[#082500] border-b border-[#e1e3dd] pb-1">
              Estrutura Curricular e Docentes Responsáveis
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {modules.map((m) => (
                <div key={m.id} className="p-2.5 border border-[#e1e3dd] rounded-xl bg-white">
                  <span className="font-bold text-[#123d00] block">
                    Módulo 0{m.number}: {m.title}
                  </span>
                  <span className="text-[11px] text-[#73796c]">Docente: {m.professorName}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Academic Performance Table */}
          <div className="space-y-3 font-sans">
            <h3 className="font-bold text-xs uppercase tracking-wider text-[#082500] border-b border-[#e1e3dd] pb-1">
              Relação Nominal dos Vocacionados e Boletim Consolidado
            </h3>
            <table className="w-full text-left text-xs border border-[#e1e3dd] border-collapse">
              <thead>
                <tr className="bg-[#f4f6f0] text-[#082500] font-bold border-b border-[#e1e3dd]">
                  <th className="p-2.5">Matrícula</th>
                  <th className="p-2.5">Aluno Vocacionado</th>
                  <th className="p-2.5">Campo</th>
                  <th className="p-2.5 text-center">Frequência</th>
                  <th className="p-2.5 text-center">Média Geral</th>
                  <th className="p-2.5 text-right">Situação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e1e3dd]">
                {students.map((st) => (
                  <tr key={st.alunoId} className="even:bg-[#fafbf8]">
                    <td className="p-2.5 font-mono text-[11px] text-[#646029]">{st.matricula}</td>
                    <td className="p-2.5 font-bold text-[#191c19]">{st.alunoName}</td>
                    <td className="p-2.5 text-[#73796c]">{st.polo}</td>
                    <td className="p-2.5 text-center font-semibold text-[#15803d]">
                      {st.frequenciaPercent}% ({st.presencas}/{st.aulasTotais})
                    </td>
                    <td className="p-2.5 text-center font-bold text-[#123d00]">
                      {st.mediaGeral.toFixed(1)}
                    </td>
                    <td className="p-2.5 text-right font-bold text-[#15803d]">
                      {st.statusAcademico}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Official Signatures */}
          <div className="pt-12 font-sans grid grid-cols-2 gap-8 text-center">
            <div className="space-y-1">
              <div className="border-t border-[#191c19] w-3/4 mx-auto pt-2"></div>
              <span className="font-bold text-xs text-[#082500] block">Lucas Pimenta</span>
              <span className="text-[11px] text-[#646029] block">
                Coordenação Geral • Escritores QGU
              </span>
            </div>

            <div className="space-y-1">
              <div className="border-t border-[#191c19] w-3/4 mx-auto pt-2"></div>
              <span className="font-bold text-xs text-[#082500] block">Banca Examinadora</span>
              <span className="text-[11px] text-[#646029] block">
                COMIEADEPA • Convenção de Ministros
              </span>
            </div>
          </div>

          {/* Document Verification Footer */}
          <div className="pt-6 border-t border-[#e1e3dd] text-center text-[10px] text-[#73796c] font-sans">
            Documento emitido em {currentDate}. Autenticidade verificável através do sistema
            integrado ESCRITORES QGU com chave criptográfica institucional.
          </div>
        </div>
      </div>
    </div>
  );
};
