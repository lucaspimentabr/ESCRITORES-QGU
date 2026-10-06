import React, { useState } from 'react';
import {
  Save,
  X,
  AlertTriangle,
  Calendar,
  Clock,
  Sparkles,
  Zap,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  Layers,
  FileText,
  Lock,
  Eye,
  Sliders,
} from 'lucide-react';
import { ProcessoJourneyConfig } from '../data/processoSeletivoService';

interface ProcessoInscricaoEditorProps {
  config: ProcessoJourneyConfig;
  onChangeConfig: (newConfig: ProcessoJourneyConfig) => void;
  onSave: () => void;
  onCancel: () => void;
  isSaving?: boolean;
}

export const ProcessoInscricaoEditor: React.FC<ProcessoInscricaoEditorProps> = ({
  config,
  onChangeConfig,
  onSave,
  onCancel,
  isSaving = false,
}) => {
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');

  const updateField = <K extends keyof ProcessoJourneyConfig>(
    field: K,
    value: ProcessoJourneyConfig[K]
  ) => {
    onChangeConfig({
      ...config,
      [field]: value,
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Barra Superior de Ações do Editor */}
      <div className="bg-white border border-[#c2c9b9]/80 rounded-3xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-4 z-30 backdrop-blur-md bg-white/95">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#123d00] text-white flex items-center justify-center shrink-0 shadow-2xs">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-display text-base sm:text-lg font-bold text-[#082500]">
                Editor da Página de Inscrição
              </h2>
              <span className="font-mono font-bold text-[11px] bg-[#f4f6f0] text-[#123d00] border border-[#c2c9b9] px-2.5 py-0.5 rounded-full">
                /inscricao/{config.cleanId}
              </span>
              <span className="text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full">
                Rascunho em Edição
              </span>
            </div>
            <p className="text-xs text-[#52594d] mt-0.5">
              Personalize a página pública deste processo seletivo antes de homologar e publicar no Monitoramento.
            </p>
          </div>
        </div>

        {/* Botões de Ação: Cancelar e Salvar */}
        <div className="flex items-center gap-2.5 shrink-0 self-end md:self-auto">
          <button
            type="button"
            id="btn-cancelar-edicao-processo"
            onClick={() => setShowCancelModal(true)}
            className="px-4 py-2.5 rounded-xl border border-[#c2c9b9] bg-white hover:bg-red-50 hover:text-red-700 hover:border-red-200 text-[#52594d] text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
            title="Cancelar criação do processo seletivo"
          >
            <X className="w-4 h-4" />
            <span>Cancelar</span>
          </button>

          <button
            type="button"
            id="btn-salvar-processo-seletivo"
            onClick={onSave}
            disabled={isSaving}
            className="px-5 py-2.5 rounded-xl bg-[#123d00] hover:bg-[#082500] text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shadow-xs disabled:opacity-50"
            title="Salvar alterações e homologar processo no Monitoramento"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Salvando...' : 'Salvar'}</span>
          </button>
        </div>
      </div>

      {/* Grid Principal: Coluna Esquerda (Formulário) e Coluna Direita (Live Preview) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ================================================================= */}
        {/* COLUNA ESQUERDA (5 colunas no LG): Painel de Campos Editáveis     */}
        {/* ================================================================= */}
        <div className="lg:col-span-5 bg-white border border-[#c2c9b9]/80 rounded-3xl p-5 sm:p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-[#f0f2eb]">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#123d00]" />
              <h3 className="font-bold text-xs uppercase tracking-wider text-[#191c19]">
                Definições da Página Pública
              </h3>
            </div>
            <span className="text-[10px] font-bold text-[#73796c] uppercase">
              ID: {config.processoId}
            </span>
          </div>

          <div className="space-y-4 text-xs">
            {/* ID do Processo (Read-only) */}
            <div>
              <label className="block text-[11px] font-bold text-[#52594d] uppercase tracking-wider mb-1 flex items-center gap-1">
                <Lock className="w-3 h-3 text-[#73796c]" />
                ID do Processo Seletivo (Validado)
              </label>
              <input
                type="text"
                readOnly
                value={config.processoId}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#f4f6f0] border border-[#c2c9b9] text-[#191c19] font-mono font-bold cursor-not-allowed select-none"
              />
              <span className="text-[10px] text-[#73796c] mt-0.5 block">
                O ID foi validado e é exclusivo para este processo e suas rotas.
              </span>
            </div>

            {/* Nome do Processo */}
            <div>
              <label className="block text-[11px] font-bold text-[#191c19] uppercase tracking-wider mb-1">
                Nome do Processo Seletivo *
              </label>
              <input
                type="text"
                value={config.nome}
                onChange={(e) => updateField('nome', e.target.value)}
                placeholder="Ex: Processo Seletivo 2026.2"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#f8faf4] border border-[#c2c9b9] text-[#191c19] focus:outline-hidden focus:border-[#123d00] focus:ring-1 focus:ring-[#123d00] transition-all"
              />
            </div>

            {/* Título Principal */}
            <div>
              <label className="block text-[11px] font-bold text-[#191c19] uppercase tracking-wider mb-1">
                Título da Página de Inscrição *
              </label>
              <input
                type="text"
                value={config.titulo}
                onChange={(e) => updateField('titulo', e.target.value)}
                placeholder="Ex: Inscrição Escritores QGU"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#f8faf4] border border-[#c2c9b9] text-[#191c19] focus:outline-hidden focus:border-[#123d00] focus:ring-1 focus:ring-[#123d00] transition-all"
              />
            </div>

            {/* Subtítulo / Descrição */}
            <div>
              <label className="block text-[11px] font-bold text-[#191c19] uppercase tracking-wider mb-1">
                Apresentação / Descrição do Programa
              </label>
              <textarea
                rows={3}
                value={config.subtitulo}
                onChange={(e) => updateField('subtitulo', e.target.value)}
                placeholder="Breve descrição da vocação literária e proposta do curso..."
                className="w-full px-3.5 py-2 rounded-xl bg-[#f8faf4] border border-[#c2c9b9] text-[#191c19] focus:outline-hidden focus:border-[#123d00] focus:ring-1 focus:ring-[#123d00] transition-all resize-y"
              />
            </div>

            {/* Período de Inscrição & Vagas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-[#191c19] uppercase tracking-wider mb-1">
                  Período de Inscrição *
                </label>
                <input
                  type="text"
                  value={config.periodoInscricao}
                  onChange={(e) => updateField('periodoInscricao', e.target.value)}
                  placeholder="Ex: 18 à 22 de Setembro"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#f8faf4] border border-[#c2c9b9] text-[#191c19] focus:outline-hidden focus:border-[#123d00] focus:ring-1 focus:ring-[#123d00] transition-all"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#191c19] uppercase tracking-wider mb-1">
                  Vagas Disponíveis
                </label>
                <input
                  type="number"
                  min={1}
                  max={500}
                  value={config.vagas}
                  onChange={(e) => updateField('vagas', parseInt(e.target.value) || 0)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#f8faf4] border border-[#c2c9b9] text-[#191c19] focus:outline-hidden focus:border-[#123d00] focus:ring-1 focus:ring-[#123d00] transition-all"
                />
              </div>
            </div>

            {/* Horário e Frequência das Aulas */}
            <div>
              <label className="block text-[11px] font-bold text-[#191c19] uppercase tracking-wider mb-1">
                Horário e Frequência das Aulas *
              </label>
              <input
                type="text"
                value={config.horarioAulas}
                onChange={(e) => updateField('horarioAulas', e.target.value)}
                placeholder="Ex: Quintas–feiras às 20h"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#f8faf4] border border-[#c2c9b9] text-[#191c19] focus:outline-hidden focus:border-[#123d00] focus:ring-1 focus:ring-[#123d00] transition-all"
              />
            </div>

            {/* Texto Descritivo das Aulas e Transmissão */}
            <div>
              <label className="block text-[11px] font-bold text-[#191c19] uppercase tracking-wider mb-1 flex items-center justify-between">
                <span>Texto das Aulas e Transmissão *</span>
                <span className="text-[10px] text-[#73796c] font-normal lowercase">card "sobre as aulas"</span>
              </label>
              <textarea
                id="input-detalhes-aulas"
                rows={2}
                value={config.detalhesAulas ?? ''}
                onChange={(e) => updateField('detalhesAulas', e.target.value)}
                placeholder="Ex: Aulas semanais transmitidas via Google Meet, de 24 de Setembro a 10 de Dezembro."
                className="w-full px-3.5 py-2 rounded-xl bg-[#f8faf4] border border-[#c2c9b9] text-[#191c19] focus:outline-hidden focus:border-[#123d00] focus:ring-1 focus:ring-[#123d00] transition-all resize-y"
              />
              <span className="text-[10px] text-[#73796c] mt-0.5 block">
                Edite aqui o texto descritivo das aulas exibido no Live Preview e na página pública.
              </span>
            </div>

            {/* Datas do Curso & Tolerância */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-[#191c19] uppercase tracking-wider mb-1">
                  Calendário do Curso
                </label>
                <input
                  type="text"
                  value={config.datasCurso}
                  onChange={(e) => updateField('datasCurso', e.target.value)}
                  placeholder="Ex: 24 de Setembro a 10 de Dezembro"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#f8faf4] border border-[#c2c9b9] text-[#191c19] focus:outline-hidden focus:border-[#123d00] focus:ring-1 focus:ring-[#123d00] transition-all"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#191c19] uppercase tracking-wider mb-1">
                  Tolerância (min)
                </label>
                <input
                  type="number"
                  min={0}
                  max={60}
                  value={config.toleranciaMinutos}
                  onChange={(e) => updateField('toleranciaMinutos', parseInt(e.target.value) || 0)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#f8faf4] border border-[#c2c9b9] text-[#191c19] focus:outline-hidden focus:border-[#123d00] focus:ring-1 focus:ring-[#123d00] transition-all"
                />
              </div>
            </div>

            {/* Número do Edital & Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-[#191c19] uppercase tracking-wider mb-1">
                  Identificador do Edital
                </label>
                <input
                  type="text"
                  value={config.editalNumero}
                  onChange={(e) => updateField('editalNumero', e.target.value)}
                  placeholder="Ex: Edital 02/2026"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#f8faf4] border border-[#c2c9b9] text-[#191c19] focus:outline-hidden focus:border-[#123d00] focus:ring-1 focus:ring-[#123d00] transition-all"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#191c19] uppercase tracking-wider mb-1">
                  Status Inicial
                </label>
                <select
                  value={config.status}
                  onChange={(e) => updateField('status', e.target.value as 'Aberto' | 'Encerrado')}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#f8faf4] border border-[#c2c9b9] text-[#191c19] font-medium focus:outline-hidden focus:border-[#123d00] focus:ring-1 focus:ring-[#123d00] transition-all cursor-pointer"
                >
                  <option value="Aberto">Aberto (Inscrições Ativas)</option>
                  <option value="Encerrado">Encerrado (Inscrições Suspensas)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* ================================================================= */}
        {/* COLUNA DIREITA (7 colunas no LG): Live Preview em Tempo Real      */}
        {/* ================================================================= */}
        <div className="lg:col-span-7 bg-[#f8faf4] border border-[#c2c9b9] rounded-3xl p-4 sm:p-6 shadow-xs space-y-4">
          {/* Barra de Navegação do Simulador da Rota */}
          <div className="bg-white border border-[#c2c9b9]/80 rounded-2xl p-2.5 px-4 shadow-2xs flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#15803d] animate-pulse"></span>
              <span className="font-bold text-[#191c19]">Prévia em Tempo Real</span>
            </div>
            <div className="flex items-center gap-1.5 font-mono text-[11px] text-[#52594d] bg-[#f4f6f0] px-3 py-1 rounded-lg border border-[#c2c9b9]/60">
              <ExternalLink className="w-3 h-3 text-[#123d00]" />
              <span>/inscricao/{config.cleanId}</span>
            </div>
          </div>

          {/* O Conteúdo Espelhado Fiel da Página Pública */}
          <div className="bg-white border border-[#c2c9b9]/60 rounded-3xl p-5 sm:p-7 shadow-xs space-y-5">
            {/* Institutional Pill */}
            <div className="flex items-center gap-2 text-xs font-bold text-[#646029] tracking-widest uppercase">
              <span className="w-2 h-2 rounded-full bg-[#123d00]"></span>
              {config.nome.toUpperCase()}
            </div>

            {/* Title & Desc */}
            <div className="space-y-2">
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#082500] uppercase tracking-wide leading-tight">
                {config.titulo || 'Inscrição Escritores QGU'}
              </h1>
              <p className="text-xs sm:text-sm text-[#42493d] leading-relaxed">
                {config.subtitulo}
              </p>
            </div>

            {/* Inscrições Status Banner */}
            <div className="bg-[#f8faf4] border border-[#e1e3dd] rounded-2xl p-3 px-4 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 font-semibold text-[#191c19]">
                <span className={`w-2.5 h-2.5 rounded-full ${config.status === 'Aberto' ? 'bg-[#15803d]' : 'bg-[#b91c1c]'}`}></span>
                <span>
                  Período de Inscrição: <strong className="text-[#082500]">{config.periodoInscricao}</strong>
                </span>
              </div>
              <span className="text-[11px] font-bold text-[#73796c] uppercase tracking-wider">
                {config.vagas} Vagas • {config.editalNumero}
              </span>
            </div>

            {/* Grid Horário & Matriz */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1 text-xs">
              {/* Card Horário */}
              <div className="bg-[#eff3eb] border border-[#dce3d5] rounded-2xl p-4 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-xl bg-[#082500] text-white flex items-center justify-center shrink-0">
                      <Calendar className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-[#626859] uppercase block">
                        SOBRE AS AULAS
                      </span>
                      <h4 className="text-sm font-bold text-[#191c19]">
                        {config.horarioAulas}
                      </h4>
                    </div>
                  </div>
                  <p
                    id="preview-detalhes-aulas"
                    onClick={() => {
                      const el = document.getElementById('input-detalhes-aulas');
                      el?.focus();
                      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }}
                    title="Clique para editar este texto nas definições"
                    className="text-[11px] text-[#42493d] leading-relaxed cursor-pointer hover:text-[#082500] transition-colors"
                  >
                    {config.detalhesAulas || `Aulas semanais transmitidas via Google Meet, de ${config.datasCurso}.`}
                  </p>
                </div>

                <div className="bg-white/80 border border-[#d8e0d1] rounded-xl p-2.5 space-y-0.5">
                  <div className="flex items-center gap-1 font-bold text-[10px] text-[#191c19] uppercase">
                    <Zap className="w-3 h-3 text-[#535928]" />
                    <span>PONTUALIDADE</span>
                  </div>
                  <p className="text-[10px] text-[#52594d]">
                    Tolerância de acesso de {config.toleranciaMinutos} minutos.
                  </p>
                </div>
              </div>

              {/* Matriz Curricular Resumida */}
              <div className="bg-[#eff3eb] border border-[#dce3d5] rounded-2xl p-4 space-y-2">
                <span className="text-[10px] font-bold text-[#626859] uppercase block">
                  MATRIZ CURRICULAR
                </span>
                <h4 className="text-sm font-bold text-[#191c19] mb-2">
                  5 Módulos Estruturados
                </h4>
                <div className="space-y-1.5 text-[11px]">
                  {config.modulos.map((m) => (
                    <div key={m.number} className="bg-white rounded-lg p-2 border border-[#dce3d5] flex items-center gap-2">
                      <span className="w-5 h-5 rounded-md bg-[#082500] text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                        {m.number}
                      </span>
                      <span className="font-semibold text-[#191c19] truncate">{m.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Simulação do Botão de Iniciar Inscrição */}
            <div className="pt-2 border-t border-[#f0f2eb] flex flex-col items-center gap-2">
              <button
                type="button"
                disabled
                className="w-full py-3.5 px-6 rounded-2xl bg-[#082500] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 opacity-90 shadow-xs cursor-default"
              >
                <span>Iniciar Inscrição neste Processo</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <span className="text-[10px] text-[#73796c] italic">
                Ao clicar em Salvar, este fluxo redirecionará os candidatos para a rota /candidato/{config.cleanId}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Confirmar Cancelamento da Criação */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#c2c9b9] rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-amber-700">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-[#191c19]">
                  Cancelar criação do processo seletivo?
                </h4>
                <p className="text-xs text-[#73796c] mt-0.5">
                  Esta ação excluirá tudo o que foi gerado durante esta tentativa (rotas, páginas e dados provisórios). O processo não será adicionado ao Monitoramento.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#f0f2eb]">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-2 rounded-xl border border-[#c2c9b9] text-xs font-semibold text-[#52594d] hover:bg-[#f4f6f0] cursor-pointer"
              >
                Continuar Editando
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCancelModal(false);
                  onCancel();
                }}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                Descartar Criação
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
