import React from 'react';
import { Candidate } from '../types';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  candidate: Candidate | null;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  candidate,
}) => {
  if (!isOpen || !candidate) return null;

  return (
    <div
      id="delete-candidate-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
      onClick={onClose}
    >
      <div
        id="delete-candidate-modal"
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-[#c2c9b9]/60 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-[#b91c1c] text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-[#fecaca]" />
            <h3 className="font-display font-bold text-base uppercase tracking-wider">
              Excluir Candidato
            </h3>
          </div>
          <button
            id="btn-close-delete-modal"
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-sm text-[#42493d] leading-relaxed">
            Você está prestes a remover o seguinte candidato do processo seletivo:
          </p>

          <div className="bg-[#fef2f2] border border-[#fecaca] rounded-xl p-3.5 space-y-1">
            <div className="font-bold text-sm text-[#991b1b]">
              {candidate.fullName}
            </div>
            <div className="text-xs text-[#b91c1c] font-mono font-medium">
              Protocolo: {candidate.id}
            </div>
            <div className="text-xs text-[#7f1d1d]">
              {candidate.church} • {candidate.polo}
            </div>
          </div>

          <p className="text-xs text-[#73796c] leading-relaxed">
            Esta ação excluirá a ficha de inscrição, memorial vocacional e avaliações do registro local da banca.
          </p>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              id="btn-cancel-delete"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold rounded-xl border border-[#c2c9b9] text-[#42493d] hover:bg-[#f2f4ee] transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              id="btn-confirm-delete"
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-[#b91c1c] hover:bg-[#991b1b] text-white flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Confirmar Exclusão</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
