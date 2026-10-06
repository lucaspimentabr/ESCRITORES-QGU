import React from 'react';
import { AlertTriangle, X, Phone } from 'lucide-react';

interface RequirementsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReset: () => void;
}

export const RequirementsModal: React.FC<RequirementsModalProps> = ({
  isOpen,
  onClose,
  onReset,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white border border-[#c2c9b9] rounded-3xl max-w-lg w-full shadow-2xl p-6 space-y-5 text-center">
        <div className="w-14 h-14 rounded-2xl bg-[#fee2e2] text-[#b91c1c] mx-auto flex items-center justify-center shadow-xs">
          <AlertTriangle className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h3 className="font-display text-xl font-bold text-[#082500] uppercase tracking-wide">
            Requisitos Obrigatórios do Edital
          </h3>
          <p className="text-xs text-[#42493d] leading-relaxed">
            Conforme o item 3.1 do <strong>Edital Escritores 2026</strong>, a participação é restrita a membros da <strong>COMIEADEPA</strong> em perfeita comunhão, com Ensino Médio completo e curso básico em teologia completo (ou matriculados na EMIL).
          </p>
        </div>

        <div className="bg-[#f8faf4] border border-[#c2c9b9] rounded-2xl p-4 text-left text-xs text-[#42493d] space-y-2">
          <p className="font-semibold text-[#191c19]">Deseja tirar dúvidas sobre a sua situação?</p>
          <div className="flex items-center gap-2 text-[#123d00] font-bold flex-wrap">
            <Phone className="w-3.5 h-3.5 text-[#15803d]" />
            <span>Lucas Pimenta (Coordenação Teológica QGU):</span>
            <a
              href="https://wa.me/5591982577589"
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-[#15803d] hover:text-[#082500] underline underline-offset-2 transition-colors cursor-pointer"
              title="Falar via WhatsApp com Lucas Pimenta"
            >
              (91) 98257-7589
            </a>
          </div>
        </div>

        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            id="btn-close-requirements-modal"
            onClick={onReset}
            className="px-5 py-2.5 rounded-xl bg-[#123d00] text-white text-xs font-bold hover:bg-[#082500] transition-colors shadow-xs"
          >
            Revisar Resposta
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-[#c2c9b9] text-[#42493d] text-xs font-semibold hover:bg-[#f2f4ee] transition-colors"
          >
            Fechar Janela
          </button>
        </div>
      </div>
    </div>
  );
};
