import React from 'react';
import {
  ShieldCheck,
  Check,
  MessageCircle,
} from 'lucide-react';
import { Turma } from '../types';

interface VitrineHomeViewProps {
  turma?: Turma;
  turmaVigente?: Turma;
  isInscriptionOpen?: boolean;
  onGoToInscricao: () => void;
}

export const VitrineHomeView: React.FC<VitrineHomeViewProps> = ({
  turma,
  turmaVigente,
  isInscriptionOpen = true,
  onGoToInscricao,
}) => {
  const currentTurma = turma || turmaVigente;
  const turmaNome = currentTurma?.name || 'Turma 2026 • Formação de Escritores Teológicos';
  const vagasCount = currentTurma?.vagas ?? 40;
  const periodoInscricao = currentTurma?.dataInicioInscricoes && currentTurma?.dataFimInscricoes
    ? `${currentTurma.dataInicioInscricoes} a ${currentTurma.dataFimInscricoes}`
    : '18 a 22 de Setembro';

  return (
    <div className="space-y-16 sm:space-y-20 pb-20 animate-in fade-in">
      {/* 1. HERO SECTION INSTITUCIONAL */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#f4f6f0] via-[#ffffff] to-white border-b border-[#e1e3dd] pt-14 pb-16 sm:pt-20 sm:pb-24">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            {/* Headline de Alto Impacto */}
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#082500] uppercase tracking-tight leading-[1.1]">
              Você já estudou Teologia.{' '}
              <span className="text-[#123d00] block mt-1">
                Chegou a hora de escrevê-la.
              </span>
            </h1>

            {/* Subtítulo Claro */}
            <p className="text-base sm:text-lg text-[#42493d] leading-relaxed max-w-2xl mx-auto">
              O <strong>Treinamento Escritores QGU</strong> capacita vocacionados e teólogos na arte da escrita bíblica, teológica e devocional para servir à igreja local e abastecer a convenção com literatura sólida e edificante.
            </p>

            {/* BOTÃO PARA MANDAR MENSAGEM PARA A COORDENAÇÃO NO WHATSAPP */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                id="btn-whatsapp-coordenacao-hero"
                href="https://wa.me/5591982577589?text=Ol%C3%A1%2C%20gostaria%20de%20falar%20com%20a%20coordena%C3%A7%C3%A3o%20da%20Escola%20de%20Escritores%20QGU."
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-[#25D366] hover:bg-[#20ba59] text-white font-extrabold text-sm sm:text-base tracking-wide shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-3 cursor-pointer group"
              >
                <MessageCircle className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
                <span>Saiba mais</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 2. MATRIZ CURRICULAR */}
      <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto bg-[#eff3eb] border border-[#dce3d5] rounded-3xl p-6 sm:p-8 flex flex-col justify-between">
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
      </section>

      {/* 5. PÚBLICO-ALVO & REQUISITOS */}
      <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white border border-[#c2c9b9] rounded-3xl p-6 sm:p-10 max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            {/* Lado Esquerdo: Público Alvo */}
            <div className="space-y-4">
              <span className="text-xs font-bold text-[#646029] uppercase tracking-widest">
                Para quem é o treinamento?
              </span>
              <h3 className="font-display text-2xl font-bold text-[#082500]">
                Público-Alvo
              </h3>
              <ul className="space-y-3 text-xs sm:text-sm text-[#42493d]">
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-[#123d00] shrink-0 mt-0.5" />
                  <span>Jovens com vocação para o ensino e a escrita.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-[#123d00] shrink-0 mt-0.5" />
                  <span>Jovens que desejam produzir artigos, devocionais e obras teológicas.</span>
                </li>
              </ul>
            </div>

            {/* Lado Direito: Requisitos Básicos */}
            <div className="bg-[#f4f6f0] border border-[#e1e3dd] rounded-2xl p-6 space-y-3">
              <h4 className="font-bold text-sm text-[#082500] uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#123d00]" />
                Requisitos de Participação:
              </h4>
              <ul className="space-y-2 text-xs text-[#52594d]">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#123d00]"></span>
                  <span>Estar em plena comunhão com a igreja local.</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#123d00]"></span>
                  <span>Possuir no mínimo curso básico em Teologia.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 6. BLOCO FINAL: CONTATO COM A COORDENAÇÃO NO WHATSAPP */}
      <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#082500] text-white rounded-3xl p-6 sm:p-10 text-center max-w-3xl mx-auto space-y-5 shadow-xl relative overflow-hidden">
          {/* Luz de fundo decorativa sutil */}
          <div className="absolute -top-24 -left-24 w-60 h-60 bg-[#25D366]/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-24 -right-24 w-60 h-60 bg-[#123d00]/30 rounded-full blur-3xl pointer-events-none"></div>

          <div className="space-y-2 relative z-10">
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-white">
              Fale com a Coordenação
            </h2>
            <p className="text-xs sm:text-sm text-white/80 max-w-xl mx-auto leading-relaxed">
              Deseja mais informações sobre o treinamento, turmas ou esclarecer dúvidas diretamente com a comissão? Envie uma mensagem no WhatsApp.
            </p>
          </div>

          {/* Botão de WhatsApp */}
          <div className="flex justify-center pt-2 relative z-10">
            <a
              id="btn-whatsapp-coordenacao-rodape"
              href="https://wa.me/5591982577589?text=Ol%C3%A1%2C%20gostaria%20de%20falar%20com%20a%20coordena%C3%A7%C3%A3o%20da%20Escola%20de%20Escritores%20QGU."
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-[#25D366] hover:bg-[#20ba59] text-white font-extrabold text-sm sm:text-base tracking-wide shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-3 cursor-pointer group"
            >
              <MessageCircle className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
              <span>Fale Conosco</span>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};
