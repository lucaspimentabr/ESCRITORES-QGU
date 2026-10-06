import React, { useState } from 'react';
import { Candidate } from '../../types';
import { printComprovantePdf } from '../../utils/generateComprovantePdf';
import {
  CheckCircle2,
  Phone,
  Printer,
  ExternalLink,
  FileText,
} from 'lucide-react';

interface CandidateSuccessProps {
  candidate: Candidate;
  processoId?: string | null;
  onViewReceipt?: () => void;
  onNewRegistration: () => void;
}

export const CandidateSuccess: React.FC<CandidateSuccessProps> = ({
  candidate,
  processoId,
  onViewReceipt,
  onNewRegistration,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const displayProcId = candidate.processoId || (processoId ? (processoId.startsWith('#') ? processoId : `#${processoId}`) : '#PS-2026-1');
  const cleanProc = displayProcId.replace(/^#/, '');
  const cleanCand = candidate.id.replace(/^#/, '');

  const handlePrint = () => {
    setIsGenerating(true);
    try {
      printComprovantePdf(candidate);
    } finally {
      setTimeout(() => setIsGenerating(false), 1200);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in pb-16">
      {/* Success Card */}
      <div className="bg-white border border-[#c2c9b9]/60 rounded-3xl p-8 sm:p-12 shadow-xs text-center space-y-6">
        {/* Animated Success Emblem */}
        <div className="w-20 h-20 rounded-3xl bg-[#e8f5e9] text-[#15803d] mx-auto flex items-center justify-center shadow-xs border-2 border-[#a5d6a7]">
          <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
        </div>

        {/* Title & Institutional Subtitle */}
        <div className="space-y-2">
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-[#15803d] tracking-widest uppercase">
              INSCRIÇÃO HOMOLOGADA COM SUCESSO
            </span>
            <span className="text-[11px] font-mono font-bold bg-[#123d00] text-white px-2.5 py-0.5 rounded-full">
              {displayProcId}
            </span>
            <span className="text-[11px] font-mono text-[#52594d] bg-[#f4f6f0] border border-[#c2c9b9] px-2.5 py-0.5 rounded-full">
              /inscricao/{cleanProc}/{cleanCand}
            </span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-[#082500] uppercase tracking-wide">
            Inscrição Recebida
          </h1>
          <p className="text-xs sm:text-sm text-[#42493d] max-w-lg mx-auto leading-relaxed">
            Parabéns, <strong>{candidate.fullName}</strong>! Sua submissão para o <strong>Processo Seletivo {displayProcId}</strong> do <strong>Escritores QGU</strong> foi registrada e encaminhada para a Coordenação Teológica QGU.
          </p>
        </div>

        {/* Protocol & Auto-Scoring Badge */}
        <div className="bg-[#f8faf4] border border-[#c2c9b9] rounded-2xl p-5 max-w-md mx-auto flex items-center justify-between gap-4 text-left">
          <div>
            <span className="text-[10px] font-bold text-[#73796c] uppercase tracking-wider block">
              PROTOCOLO DE INSCRIÇÃO
            </span>
            <span className="font-mono text-base font-bold text-[#123d00]">
              {candidate.id}
            </span>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-bold text-[#73796c] uppercase tracking-wider block">
              DESEMPENHO OBJETIVO
            </span>
            <div className="flex items-baseline gap-1 justify-end">
              <span className="font-display text-xl font-bold text-[#082500]">
                {candidate.objectiveScore.correct} / {candidate.objectiveScore.total}
              </span>
              <span className="text-xs font-semibold text-[#15803d]">
                ({candidate.objectiveScore.percentage}%)
              </span>
            </div>
          </div>
        </div>

        {/* Mandatory Contact & Next Steps Banner */}
        <div className="bg-[#f2f4ee] border border-[#c2c9b9] rounded-2xl p-5 text-left text-xs text-[#42493d] space-y-3">
          <div className="flex items-center gap-2 font-bold text-[#082500] uppercase tracking-wider text-xs">
            <FileText className="w-4 h-4 text-[#123d00]" />
            <span>Próximos Passos</span>
          </div>

          <p className="leading-relaxed">
            Sua inscrição foi registrada com sucesso. Guarde o seu número de protocolo (<strong>{candidate.id}</strong>) e imprima o seu comprovante oficial abaixo. Para eventuais dúvidas sobre o processo seletivo ou envio de pendências, o contato deve ser feito através do WhatsApp do coordenador teológico QGU Lucas Pimenta: <strong>(91) 98257-7589</strong>.
          </p>

          <div className="pt-2 border-t border-[#c2c9b9]/60 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 text-[#15803d] font-bold">
              <Phone className="w-3.5 h-3.5" />
              <span>WhatsApp Coordenação: (91) 98257-7589</span>
            </div>

            <a
              href="https://wa.me/5591982577589"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] font-bold text-[#123d00] hover:underline flex items-center gap-1"
            >
              <span>Abrir WhatsApp do Coordenador</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4 border-t border-[#e7e9e3]">
          <button
            id="btn-print-comprovante"
            onClick={handlePrint}
            disabled={isGenerating}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-[#123d00] hover:bg-[#0c2800] text-white text-xs font-bold transition-all shadow-md cursor-pointer hover:scale-[1.02] disabled:opacity-80"
          >
            <Printer className="w-4 h-4" />
            <span>{isGenerating ? 'Gerando PDF...' : 'Imprimir Comprovante'}</span>
          </button>

          <button
            onClick={onNewRegistration}
            className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-5 py-3 rounded-2xl bg-[#f4f6f0] hover:bg-[#e7e9e3] text-[#191c19] border border-[#c2c9b9] text-xs font-semibold transition-colors cursor-pointer"
          >
            <span>Nova Inscrição</span>
          </button>
        </div>
      </div>
    </div>
  );
};

