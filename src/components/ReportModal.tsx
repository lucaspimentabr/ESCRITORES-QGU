import React, { useState, useMemo, useEffect } from 'react';
import { Candidate, CandidateStatus } from '../types';
import { printReportPdf } from '../utils/generateReportPdf';
import {
  X,
  Download,
  Printer,
  Copy,
  Check,
  FileText,
  Calendar,
  Clock,
  MessageSquare,
  FileDown,
} from 'lucide-react';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidates: Candidate[];
  statusFilter: 'ALL' | CandidateStatus;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  candidates,
  statusFilter,
}) => {
  const [copied, setCopied] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  // Emission date and time recorded when the modal opens
  const [emissionDate, setEmissionDate] = useState<string>('');
  const [emissionTime, setEmissionTime] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      const now = new Date();
      setEmissionDate(
        now.toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        })
      );
      setEmissionTime(
        now.toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    }
  }, [isOpen]);

  // Status Title & Label mapping
  const filterLabel = useMemo(() => {
    switch (statusFilter) {
      case 'EM_ANALISE':
        return 'Candidatos em Análise';
      case 'APROVADO':
        return 'Candidatos Aprovados';
      case 'REPROVADO':
        return 'Candidatos Reprovados';
      case 'ALL':
      default:
        return 'Todos os Candidatos';
    }
  }, [statusFilter]);

  // Prepared data according to user specification:
  // - Em análise: Todos os candidatos em análise
  // - Aprovados: Todos os candidatos aprovados
  // - Reprovados: Todos os candidatos reprovados
  // - Todos: Organizar candidatos por ordem alfabética e por status
  // - Colunas necessárias: Nome do candidato, campo/supervisão e whatsapp
  const reportData = useMemo(() => {
    if (statusFilter === 'ALL') {
      const statusOrder: Record<CandidateStatus, number> = {
        APROVADO: 1,
        EM_ANALISE: 2,
        REPROVADO: 3,
      };

      const sorted = [...candidates].sort((a, b) => {
        const orderA = statusOrder[a.status] ?? 99;
        const orderB = statusOrder[b.status] ?? 99;
        if (orderA !== orderB) {
          return orderA - orderB;
        }
        return a.fullName.localeCompare(b.fullName, 'pt-BR');
      });

      return sorted;
    }

    return candidates
      .filter((c) => c.status === statusFilter)
      .sort((a, b) => a.fullName.localeCompare(b.fullName, 'pt-BR'));
  }, [candidates, statusFilter]);

  // Grouped data when statusFilter === 'ALL' for clean visual sectioning
  const groupedSections = useMemo(() => {
    if (statusFilter !== 'ALL') return null;

    const aprovados = reportData.filter((c) => c.status === 'APROVADO');
    const emAnalise = reportData.filter((c) => c.status === 'EM_ANALISE');
    const reprovados = reportData.filter((c) => c.status === 'REPROVADO');

    return [
      {
        status: 'APROVADO' as CandidateStatus,
        title: 'Candidatos Aprovados',
        list: aprovados,
        color: 'text-[#15803d] bg-[#15803d]/10 border-[#15803d]/30',
        badgeColor: '#dcfce7',
      },
      {
        status: 'EM_ANALISE' as CandidateStatus,
        title: 'Candidatos em Análise',
        list: emAnalise,
        color: 'text-[#475569] bg-[#f4f6f0] border-[#c2c9b9]/60',
        badgeColor: '#f1f5f9',
      },
      {
        status: 'REPROVADO' as CandidateStatus,
        title: 'Candidatos Reprovados',
        list: reprovados,
        color: 'text-[#b91c1c] bg-[#b91c1c]/10 border-[#b91c1c]/30',
        badgeColor: '#fee2e2',
      },
    ].filter((group) => group.list.length > 0);
  }, [reportData, statusFilter]);

  const handleDownloadCsv = () => {
    const headers = ['Nome do Candidato', 'Campo/Supervisão', 'WhatsApp'];
    if (statusFilter === 'ALL') {
      headers.unshift('Status');
    }

    const rows = reportData.map((c) => {
      const row = [
        `"${c.fullName.replace(/"/g, '""')}"`,
        `"${(c.polo || '').replace(/"/g, '""')}"`,
        `"${(c.phone || '').replace(/"/g, '""')}"`,
      ];

      if (statusFilter === 'ALL') {
        const statusStr =
          c.status === 'APROVADO'
            ? 'Aprovado'
            : c.status === 'EM_ANALISE'
            ? 'Em Análise'
            : 'Reprovado';
        row.unshift(`"${statusStr}"`);
      }

      return row.join(';');
    });

    const metaHeader = [
      `# RELATÓRIO OFICIAL DE CANDIDATOS - ESCRITORES QGU`,
      `# Data e Horário de Emissão: ${emissionDate} às ${emissionTime}`,
      `# Filtro Selecionado: ${filterLabel}`,
      `# Total de Registros: ${reportData.length}`,
      ``,
    ].join('\r\n');

    const csvContent = '\uFEFF' + metaHeader + [headers.join(';'), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const filterSlug = statusFilter.toLowerCase().replace('_', '-');
    link.href = url;
    link.setAttribute(
      'download',
      `relatorio_candidatos_${filterSlug}_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 3000);
  };

  const handleCopyText = () => {
    let text = `RELATÓRIO DE CANDIDATOS - ESCRITORES QGU\nData e Horário de Emissão: ${emissionDate} às ${emissionTime}\nFiltro: ${filterLabel}\nTotal: ${reportData.length} candidatos\n\n`;

    if (statusFilter === 'ALL' && groupedSections) {
      groupedSections.forEach((sec) => {
        text += `--- ${sec.title.toUpperCase()} (${sec.list.length}) ---\n`;
        sec.list.forEach((c, idx) => {
          text += `${idx + 1}. ${c.fullName} | ${c.polo} | WhatsApp: ${c.phone}\n`;
        });
        text += '\n';
      });
    } else {
      reportData.forEach((c, idx) => {
        text += `${idx + 1}. ${c.fullName} | ${c.polo} | WhatsApp: ${c.phone}\n`;
      });
    }

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = async () => {
    setIsPrinting(true);
    try {
      // Brief pause to allow React to render "Gerando PDF..." state
      await new Promise((resolve) => setTimeout(resolve, 50));
      printReportPdf({
        reportData,
        statusFilter,
        filterLabel,
        emissionDate,
        emissionTime,
      });
    } catch (e) {
      console.error('Erro ao gerar e imprimir PDF do relatório:', e);
    } finally {
      setIsPrinting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      id="report-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
      onClick={onClose}
    >
      <div
        id="report-modal-container"
        className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-[#c2c9b9]/60 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-[#123d00] text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-[#b9b474]">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-[#b9b474] tracking-widest uppercase">
                ESCRITORES QGU • PROCESSO SELETIVO
              </div>
              <h2 className="font-display font-bold text-base sm:text-lg text-white leading-tight">
                Relatório de Candidatos
              </h2>
            </div>
          </div>
          <button
            id="btn-close-report-modal"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
            aria-label="Fechar relatório"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Sub-header Bar: Filter info + Date/Time + Action Buttons */}
        <div className="p-3.5 sm:p-4 bg-[#f8faf4] border-b border-[#e7e9e3] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-[#191c19]">Filtro:</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-[#123d00]/10 text-[#123d00]">
                {filterLabel}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#73796c] mt-1">
              <span>{reportData.length} {reportData.length === 1 ? 'candidato' : 'candidatos'}</span>
              <span>•</span>
              <span className="flex items-center gap-1 font-medium text-[#123d00]">
                <Calendar className="w-3 h-3 text-[#123d00]" />
                <strong>Emissão:</strong> {emissionDate} às {emissionTime}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              id="btn-print-report"
              onClick={handlePrint}
              disabled={isPrinting}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-[#123d00] hover:bg-[#082500] text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-60"
              title="Imprimir Relatório"
            >
              <Printer className="w-3.5 h-3.5 text-[#a2d486]" />
              <span>{isPrinting ? 'Gerando PDF...' : 'Imprimir'}</span>
            </button>

            <button
              id="btn-download-report-csv"
              onClick={handleDownloadCsv}
              className="flex items-center justify-center gap-1.5 bg-white hover:bg-[#f2f4ee] text-[#191c19] border border-[#c2c9b9] px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
              title="Baixar em formato CSV / Planilha Excel"
            >
              {downloaded ? <Check className="w-3.5 h-3.5 text-[#15803d]" /> : <Download className="w-3.5 h-3.5 text-[#42493d]" />}
              <span className="hidden sm:inline">{downloaded ? 'Baixado!' : 'CSV'}</span>
            </button>

            <button
              id="btn-copy-report-text"
              onClick={handleCopyText}
              className="flex items-center justify-center gap-1.5 bg-white hover:bg-[#f2f4ee] text-[#191c19] border border-[#c2c9b9] px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
              title="Copiar texto para o WhatsApp ou área de transferência"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-[#15803d]" /> : <Copy className="w-3.5 h-3.5 text-[#42493d]" />}
              <span className="hidden sm:inline">{copied ? 'Copiado!' : 'Copiar'}</span>
            </button>
          </div>
        </div>

        {/* Modal Body / Report Document */}
        <div id="report-printable-area" className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {/* Institutional Emission Stamp Card */}
          <div className="bg-[#f8faf4] border border-[#e7e9e3] rounded-xl p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold text-[#646029] tracking-wider uppercase block">
                RELATÓRIO OFICIAL • BANCA EXAMINADORA
              </span>
              <h3 className="font-bold text-[#082500] text-sm">
                Projeto Escritores QGU 2026
              </h3>
              <p className="text-[11px] text-[#42493d]">
                Filtro: <strong className="text-[#123d00]">{filterLabel}</strong> ({reportData.length} {reportData.length === 1 ? 'registro' : 'registros'})
              </p>
            </div>
            <div className="bg-white border border-[#c2c9b9]/60 rounded-lg p-2 sm:text-right shrink-0">
              <span className="text-[10px] text-[#73796c] uppercase font-bold block flex items-center gap-1 sm:justify-end">
                <Clock className="w-3 h-3 text-[#123d00]" />
                Data e Horário de Emissão
              </span>
              <span className="font-mono text-xs font-bold text-[#123d00] block mt-0.5">
                {emissionDate} às {emissionTime}
              </span>
            </div>
          </div>

          {reportData.length === 0 ? (
            <div className="py-12 text-center text-[#73796c] space-y-2">
              <FileText className="w-10 h-10 mx-auto text-[#c2c9b9]" />
              <p className="text-sm font-semibold text-[#191c19]">
                Nenhum candidato encontrado para o filtro "{filterLabel}".
              </p>
              <p className="text-xs">
                Selecione outro filtro no painel ou cadastre novos candidatos.
              </p>
            </div>
          ) : statusFilter === 'ALL' && groupedSections ? (
            /* Grouped View when "Todos" is selected */
            groupedSections.map((section) => (
              <div key={section.status} className="border border-[#e7e9e3] rounded-xl overflow-hidden shadow-2xs">
                <div className="bg-[#f8faf4] px-4 py-2.5 border-b border-[#e7e9e3] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${section.color}`}>
                      {section.title}
                    </span>
                    <span className="text-xs text-[#73796c] font-medium">
                      ({section.list.length} {section.list.length === 1 ? 'candidato' : 'candidatos'})
                    </span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-[#ffffff] border-b border-[#f2f4ee] text-[10px] font-bold text-[#646029] uppercase tracking-wider">
                        <th className="py-2.5 px-4">Nome do Candidato</th>
                        <th className="py-2.5 px-4">Campo</th>
                        <th className="py-2.5 px-4 text-right">WhatsApp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f2f4ee]">
                      {section.list.map((c) => {
                        const cleanDigits = (c.phone || '').replace(/\D/g, '');
                        const waUrl = cleanDigits ? `https://wa.me/55${cleanDigits}` : null;

                        return (
                          <tr key={c.id} className="hover:bg-[#fcfdfa] transition-colors">
                            <td className="py-2.5 px-4 font-semibold text-[#191c19]">
                              {c.fullName}
                            </td>
                            <td className="py-2.5 px-4 text-[#42493d]">
                              {c.polo || '—'}
                            </td>
                            <td className="py-2.5 px-4 text-right">
                              {waUrl ? (
                                <a
                                  href={waUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-[#123d00] hover:text-[#082500] hover:underline font-mono font-medium"
                                  title="Abrir no WhatsApp"
                                >
                                  <MessageSquare className="w-3 h-3 text-[#15803d]" />
                                  <span>{c.phone}</span>
                                </a>
                              ) : (
                                <span className="text-[#73796c] font-mono">{c.phone || '—'}</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          ) : (
            /* Single Table View for Em Análise, Aprovados, or Reprovados */
            <div className="border border-[#e7e9e3] rounded-xl overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#f8faf4] border-b border-[#e7e9e3] text-[10px] font-bold text-[#646029] uppercase tracking-wider">
                      <th className="py-3 px-4">Nome do Candidato</th>
                      <th className="py-3 px-4">Campo</th>
                      <th className="py-3 px-4 text-right">WhatsApp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f2f4ee]">
                    {reportData.map((c) => {
                      const cleanDigits = (c.phone || '').replace(/\D/g, '');
                      const waUrl = cleanDigits ? `https://wa.me/55${cleanDigits}` : null;

                      return (
                        <tr key={c.id} className="hover:bg-[#fcfdfa] transition-colors">
                          <td className="py-2.5 px-4 font-semibold text-[#191c19]">
                            {c.fullName}
                          </td>
                          <td className="py-2.5 px-4 text-[#42493d]">
                            {c.polo || '—'}
                          </td>
                          <td className="py-2.5 px-4 text-right">
                            {waUrl ? (
                              <a
                                href={waUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[#123d00] hover:text-[#082500] hover:underline font-mono font-medium"
                                title="Abrir no WhatsApp"
                              >
                                <MessageSquare className="w-3 h-3 text-[#15803d]" />
                                <span>{c.phone}</span>
                              </a>
                            ) : (
                              <span className="text-[#73796c] font-mono">{c.phone || '—'}</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 sm:p-4 bg-[#f8faf4] border-t border-[#e7e9e3] flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="text-[11px] text-[#73796c] flex items-center gap-2">
            <span>Emitido em: <strong>{emissionDate} às {emissionTime}</strong></span>
            <span>•</span>
            <span>Documento oficial para a Banca</span>
          </div>
          <button
            id="btn-close-report-footer"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-[#42493d] hover:bg-[#e7e9e3] border border-[#c2c9b9] rounded-xl transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
