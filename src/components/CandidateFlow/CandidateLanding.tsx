import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  Video,
  CheckCircle2,
  Phone,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Sparkles,
  Layers,
  Zap,
} from 'lucide-react';
import { getProcessoConfig, normalizeProcessoId } from '../../data/processoSeletivoService';

interface CandidateLandingProps {
  isInscriptionOpen: boolean;
  onStart: () => void;
  processoId?: string | null;
}

export const CandidateLanding: React.FC<CandidateLandingProps> = ({
  isInscriptionOpen,
  onStart,
  processoId,
}) => {
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(false);
  const [showError, setShowError] = useState(false);

  const cleanProc = processoId ? normalizeProcessoId(processoId) : '';
  const procConfig = cleanProc ? getProcessoConfig(cleanProc) : null;
  const effectiveIsOpen = procConfig ? procConfig.status === 'Aberto' && isInscriptionOpen : isInscriptionOpen;

  const handleProceed = () => {
    if (!effectiveIsOpen) return;
    if (!hasAcceptedTerms) {
      setShowError(true);
      return;
    }
    setShowError(false);
    onStart();
  };

  const defaultModules = [
    {
      number: '1',
      title: 'Leitura de Textos',
      desc: 'Aprenda técnicas para absorver e reter o máximo de suas leituras.',
    },
    {
      number: '2',
      title: 'Abrangência Teológica',
      desc: 'Conheça as principais áreas de estudo e os grandes debates teológicos.',
    },
    {
      number: '3',
      title: 'Método Teológico',
      desc: 'Aprenda a produzir teologia de maneira sólida e profunda.',
    },
    {
      number: '4',
      title: 'Processo de Escrita',
      desc: 'Estruturação, clareza e elegância na hora de redigir o seu texto.',
    },
    {
      number: '5',
      title: 'Laboratório de Teologia',
      desc: 'Oficina de redação final, banca de avaliação e preparação prática para publicação.',
    },
  ];

  const modules = procConfig?.modulos || defaultModules;
  const displayTitle = procConfig?.titulo || 'Inscrição Escritores QGU';
  const displaySubtitle = procConfig?.subtitulo || 'Escritores QGU é um programa de formação destinado a capacitar novos escritores, visando desenvolver a vocação literária para servir à igreja local.';
  const displayPeriod = procConfig?.periodoInscricao || '18 à 22 de Setembro';
  const displayHorario = procConfig?.horarioAulas || 'Quintas–feiras às 20h';
  const displayDatas = procConfig?.datasCurso || '24 de Setembro a 10 de dezembro';
  const displayTolerance = procConfig?.toleranciaMinutos ?? 10;
  const displayPill = procConfig ? procConfig.nome.toUpperCase() : 'PROCESSO SELETIVO 2026';

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in pb-16">
      {/* Closed Banner if admin disabled inscriptions */}
      {!isInscriptionOpen && (
        <div className="bg-[#fee2e2] border-2 border-[#b91c1c] text-[#7f1d1d] p-5 rounded-2xl flex items-center gap-4 shadow-xs">
          <AlertCircle className="w-6 h-6 text-[#b91c1c] shrink-0" />
          <div>
            <h3 className="font-bold text-sm uppercase tracking-wider">
              Inscrições Temporariamente Encerradas
            </h3>
            <p className="text-xs mt-0.5">
              O período de recebimento de novos dossiês foi suspenso pela coordenação da banca examinadora. Para mais informações, consulte a coordenação.
            </p>
          </div>
        </div>
      )}

      {/* Main Hero Card */}
      <div className="bg-white border border-[#c2c9b9]/60 rounded-3xl p-5 sm:px-8 sm:pb-8 sm:pt-6 shadow-xs space-y-4">
        {/* Institutional Pill */}
        <div className="flex items-center gap-2 text-xs font-bold text-[#646029] tracking-widest uppercase">
          <span className="w-2 h-2 rounded-full bg-[#123d00]"></span>
          {displayPill}
        </div>

        {/* Title */}
        <div className="space-y-3">
          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-[#082500] uppercase tracking-wide leading-tight">
            {displayTitle}
          </h1>
          <p className="text-sm sm:text-base text-[#42493d] leading-relaxed">
            {displaySubtitle}
          </p>
        </div>

        {/* Inscrições Status Banner */}
        <div className="bg-[#f8faf4] border border-[#e1e3dd] rounded-2xl p-3.5 px-5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 font-semibold text-[#191c19]">
            <span className={`w-2.5 h-2.5 rounded-full ${effectiveIsOpen ? 'bg-[#15803d]' : 'bg-[#b91c1c]'}`}></span>
            <span>Período de Inscrição: <strong className="text-[#082500]">{displayPeriod}</strong></span>
          </div>
          <span className="text-[11px] font-bold text-[#73796c] uppercase tracking-wider">
            {procConfig ? `${procConfig.vagas} Vagas • ${procConfig.editalNumero}` : 'Vagas Limitadas'}
          </span>
        </div>

        {/* Horário & Frequência + Matriz Curricular Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-1">
          {/* Card Esquerda: Horário & Frequência */}
          <div className="lg:col-span-5 bg-[#eff3eb] border border-[#dce3d5] rounded-3xl p-6 sm:p-7 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3.5 sm:gap-4 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-[#082500] text-white flex items-center justify-center shadow-xs shrink-0">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-[#626859] uppercase tracking-wider block mb-0.5">
                    SOBRE ÀS AULAS
                  </span>
                  <h3 className="text-xl sm:text-2xl font-bold text-[#191c19] tracking-tight leading-tight">
                    {displayHorario}
                  </h3>
                </div>
              </div>
              <p className="text-sm text-[#42493d] leading-relaxed mb-6">
                {procConfig?.detalhesAulas ? (
                  procConfig.detalhesAulas
                ) : (
                  <>
                    Aulas semanais transmitidas via <strong className="text-[#191c19] font-bold">Google Meet</strong>, com calendário compreendido pontualmente de <strong className="text-[#191c19] font-bold">{displayDatas}</strong>.
                  </>
                )}
              </p>
            </div>

            {/* Pontualidade Box */}
            <div className="bg-white/85 border border-[#d8e0d1] rounded-2xl p-4 space-y-1 shadow-2xs">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#191c19] tracking-wider uppercase">
                <Zap className="w-3.5 h-3.5 text-[#535928] fill-[#535928]/20" />
                <span>PONTUALIDADE</span>
              </div>
              <p className="text-xs text-[#52594d] leading-relaxed">
                Tolerância de acesso de {displayTolerance} minutos. Gravações disponíveis somente sob justificativa.
              </p>
            </div>
          </div>

          {/* Card Direita: Matriz Curricular 5 Módulos */}
          <div className="lg:col-span-7 bg-[#eff3eb] border border-[#dce3d5] rounded-3xl p-6 sm:p-7 flex flex-col justify-between">
            <div>
              <span className="text-[11px] font-bold text-[#626859] uppercase tracking-wider block mb-1">
                MATRIZ CURRICULAR
              </span>
              <h3 className="text-xl sm:text-2xl font-bold text-[#191c19] tracking-tight mb-5">
                5 MÓDULOS ESTRUTURADOS
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Módulo 1 */}
                <div className="bg-white rounded-2xl p-4 border border-[#dce3d5] shadow-2xs flex items-start gap-3">
                  <span className="w-7 h-7 rounded-lg bg-[#082500] text-white font-bold text-sm flex items-center justify-center shrink-0">
                    1
                  </span>
                  <div>
                    <h4 className="text-sm font-bold text-[#191c19] mb-0.5">
                      Leitura de Textos
                    </h4>
                    <p className="text-xs text-[#52594d] leading-relaxed">
                      Aprenda técnicas para absorver e reter o máximo de suas leituras.
                    </p>
                  </div>
                </div>

                {/* Módulo 2 */}
                <div className="bg-white rounded-2xl p-4 border border-[#dce3d5] shadow-2xs flex items-start gap-3">
                  <span className="w-7 h-7 rounded-lg bg-[#082500] text-white font-bold text-sm flex items-center justify-center shrink-0">
                    2
                  </span>
                  <div>
                    <h4 className="text-sm font-bold text-[#191c19] mb-0.5">
                      Abrangência Teológica
                    </h4>
                    <p className="text-xs text-[#52594d] leading-relaxed">
                      Conheça as principais áreas de estudo e os grandes debates teológicos.
                    </p>
                  </div>
                </div>

                {/* Módulo 3 */}
                <div className="bg-white rounded-2xl p-4 border border-[#dce3d5] shadow-2xs flex items-start gap-3">
                  <span className="w-7 h-7 rounded-lg bg-[#082500] text-white font-bold text-sm flex items-center justify-center shrink-0">
                    3
                  </span>
                  <div>
                    <h4 className="text-sm font-bold text-[#191c19] mb-0.5">
                      Método Teológico
                    </h4>
                    <p className="text-xs text-[#52594d] leading-relaxed">
                      Aprenda a produzir teologia de maneira sólida e profunda.
                    </p>
                  </div>
                </div>

                {/* Módulo 4 */}
                <div className="bg-white rounded-2xl p-4 border border-[#dce3d5] shadow-2xs flex items-start gap-3">
                  <span className="w-7 h-7 rounded-lg bg-[#082500] text-white font-bold text-sm flex items-center justify-center shrink-0">
                    4
                  </span>
                  <div>
                    <h4 className="text-sm font-bold text-[#191c19] mb-0.5">
                      Processo de Escrita
                    </h4>
                    <p className="text-xs text-[#52594d] leading-relaxed">
                      Estruturação, clareza e elegância na hora de redigir o seu texto.
                    </p>
                  </div>
                </div>

                {/* Módulo 5 */}
                <div className="bg-white rounded-2xl p-4 border border-[#dce3d5] shadow-2xs flex items-start gap-3 sm:col-span-2">
                  <span className="w-7 h-7 rounded-lg bg-[#535928] text-white font-bold text-sm flex items-center justify-center shrink-0">
                    5
                  </span>
                  <div>
                    <h4 className="text-sm font-bold text-[#191c19] mb-0.5">
                      Laboratório de Teologia
                    </h4>
                    <p className="text-xs text-[#52594d] leading-relaxed">
                      Oficina de redação final, banca de avaliação e preparação prática para publicação.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Regras e Compromisso */}
        <div className="bg-[#f2f4ee] border border-[#c2c9b9] rounded-2xl p-5 space-y-2">
          <div className="flex items-center gap-2 font-bold text-xs text-[#082500] uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-[#123d00]" />
            <span>Regras e Compromisso do Aluno</span>
          </div>
          <p className="text-xs text-[#42493d] leading-relaxed">
            Ao longo do projeto, os participantes selecionados serão avaliados pelo envolvimento nas aulas, nas reuniões e nas atividades práticas propostas em cada módulo, comprometendo-se a produzir os materiais requeridos de escrita.
          </p>
        </div>

        {/* Dúvidas e Contato Oficial */}
        <div className="border border-[#c2c9b9]/70 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#e8f5e9] text-[#1b5e20] flex items-center justify-center shrink-0">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-[#73796c] uppercase tracking-wider block">
                DÚVIDAS SOBRE O PROJETO
              </span>
              <p className="text-xs text-[#191c19]">
                Contato via WhatsApp do coordenador teológico QGU <strong>Lucas Pimenta</strong>:
              </p>
            </div>
          </div>
          <a
            href="https://wa.me/5591982577589"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#15803d]/10 hover:bg-[#15803d]/20 text-[#15803d] font-bold text-xs transition-colors shrink-0 font-mono"
          >
            <span>(91) 98257-7589</span>
          </a>
        </div>

        {/* Agreement Checkbox & Action Button */}
        <div className="pt-4 border-t border-[#e7e9e3] space-y-4">
          <label
            htmlFor="checkbox-terms"
            className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all cursor-pointer ${
              hasAcceptedTerms
                ? 'bg-[#f4f6f0] border-[#123d00]'
                : showError
                ? 'bg-[#fee2e2]/40 border-[#b91c1c]'
                : 'bg-white border-[#c2c9b9] hover:bg-[#f8faf4]'
            }`}
          >
            <input
              id="checkbox-terms"
              type="checkbox"
              checked={hasAcceptedTerms}
              onChange={(e) => {
                setHasAcceptedTerms(e.target.checked);
                if (e.target.checked) setShowError(false);
              }}
              className="w-4 h-4 mt-0.5 accent-[#123d00] rounded-sm cursor-pointer"
            />
            <span className="text-xs font-semibold text-[#191c19]">
              Confirmo que li e aceito as informações, o calendário das aulas e as normas de avaliação do Escritores QGU.
            </span>
          </label>

          {showError && (
            <div className="text-xs text-[#b91c1c] font-bold flex items-center gap-1.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4" />
              <span>Você deve marcar a caixa de confirmação acima para iniciar a sua inscrição.</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <span className="text-xs text-[#73796c]">
              Tempo estimado: <strong>~10 a 15 minutos</strong> para a inscrição.
            </span>

            <button
              id="btn-iniciar-inscricao"
              disabled={!isInscriptionOpen}
              onClick={handleProceed}
              className={`w-full sm:w-auto flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-2xl text-xs sm:text-sm font-bold transition-all shadow-md ${
                isInscriptionOpen
                  ? 'bg-[#123d00] hover:bg-[#0c2800] text-white hover:scale-[1.02] active:scale-100 cursor-pointer'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <span>Iniciar Inscrição</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
