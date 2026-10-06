import React, { useState } from 'react';
import {
  ClipboardList,
  Calendar,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { ProcessoSeletivoEtapa } from '../types';

interface EtapasProcessoSeletivoProps {
  etapas: ProcessoSeletivoEtapa[];
  onUpdateEtapas?: (etapas: ProcessoSeletivoEtapa[]) => void;
  processoNome?: string;
}

export const EtapasProcessoSeletivo: React.FC<EtapasProcessoSeletivoProps> = ({
  etapas,
  processoNome = 'Processo Seletivo 2026 • Formação de Escritores QGU',
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  // Calculate progress
  const concluidasCount = etapas.filter((e) => e.status === 'Concluída').length;
  const progressPercent = etapas.length > 0 ? Math.round((concluidasCount / etapas.length) * 100) : 0;

  return (
    <div className="bg-white border border-[#c2c9b9]/80 rounded-3xl p-5 shadow-xs space-y-4">
      {/* Header do Módulo de Etapas (Somente Leitura / Informativo) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#e1e3dd]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#123d00] text-white flex items-center justify-center">
            <ClipboardList className="w-4 h-4 text-[#a2d486]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display font-bold text-base text-[#082500]">
                Cronograma Oficial do Processo Seletivo
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#15803d]/10 text-[#15803d]">
                {concluidasCount}/{etapas.length} concluídas ({progressPercent}%)
              </span>
            </div>
            <p className="text-[11px] text-[#646029]">{processoNome}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-xl border border-[#c2c9b9] hover:bg-[#f4f6f0] text-[#73796c] cursor-pointer"
            title={isExpanded ? 'Recolher Etapas' : 'Expandir Etapas'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Barra de Progresso Geral */}
      <div className="w-full bg-[#f0f2eb] h-2 rounded-full overflow-hidden">
        <div
          className="bg-[#123d00] h-full transition-all duration-500 rounded-full"
          style={{ width: `${progressPercent}%` }}
        ></div>
      </div>

      {/* Lista de Etapas (Quando Expandido) */}
      {isExpanded && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
          {etapas.map((etapa, idx) => (
            <div
              key={etapa.id}
              className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between space-y-3 ${
                etapa.status === 'Concluída'
                  ? 'bg-[#fbfdfa] border-[#15803d]/40'
                  : etapa.status === 'Em Andamento'
                  ? 'bg-white border-[#123d00] ring-2 ring-[#123d00]/10 shadow-xs'
                  : 'bg-[#fafbf8] border-[#c2c9b9]/60'
              }`}
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-mono font-bold text-[#73796c]">
                    Etapa #{idx + 1}
                  </span>

                  <span
                    className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                      etapa.status === 'Concluída'
                        ? 'bg-[#15803d]/15 text-[#15803d]'
                        : etapa.status === 'Em Andamento'
                        ? 'bg-[#123d00] text-white'
                        : 'bg-[#73796c]/15 text-[#73796c]'
                    }`}
                  >
                    {etapa.status}
                  </span>
                </div>

                <h4 className="font-bold text-xs text-[#082500] leading-snug">
                  {etapa.nome}
                </h4>

                {etapa.descricao && (
                  <p className="text-[11px] text-[#52594d] line-clamp-2 leading-relaxed">
                    {etapa.descricao}
                  </p>
                )}

                <div className="flex items-center gap-1.5 text-[10px] text-[#646029] pt-1">
                  <Calendar className="w-3 h-3 text-[#123d00]" />
                  <span>
                    {etapa.dataInicio} até {etapa.dataFim}
                  </span>
                </div>
              </div>

              {/* Informações da Etapa */}
              <div className="flex items-center justify-between pt-2 border-t border-[#f0f2eb]">
                <span className="text-[9px] text-[#73796c] truncate max-w-[200px]">
                  Resp: {etapa.responsavel || 'Banca Examinadora'}
                </span>
                <span className="text-[9px] font-semibold text-[#123d00]">
                  Etapa Fixada
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
