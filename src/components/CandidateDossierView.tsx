import React, { useState, useEffect } from 'react';
import { Candidate } from '../types';
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  FileText,
  Download,
  Building,
  Phone,
  Mail,
  UserCheck,
  Scale,
  Check,
  X,
  Sparkles,
  Quote,
  Pencil,
  Trash2,
} from 'lucide-react';
import { CandidateFormModal } from './CandidateFormModal';
import { DeleteConfirmModal } from './DeleteConfirmModal';

interface CandidateDossierViewProps {
  candidate: Candidate;
  onBack: () => void;
  onUpdateStatus: (candidateId: string, status: 'APROVADO' | 'REPROVADO') => void;
  onUpdateCandidate?: (candidate: Candidate) => void;
  onDeleteCandidate?: (candidateId: string) => void;
}

export const CandidateDossierView: React.FC<CandidateDossierViewProps> = ({
  candidate,
  onBack,
  onUpdateStatus,
  onUpdateCandidate,
  onDeleteCandidate,
}) => {
  const [score, setScore] = useState<number>(candidate?.discursive?.evaluatorScore ?? 8.0);
  const [notes, setNotes] = useState<string>(candidate?.discursive?.theologicalNotes ?? '');
  const [downloadNotice, setDownloadNotice] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'danger' } | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  useEffect(() => {
    if (candidate?.discursive) {
      setScore(candidate.discursive.evaluatorScore);
      setNotes(candidate.discursive.theologicalNotes);
    }
  }, [candidate]);

  if (!candidate) {
    return (
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <p className="text-sm font-semibold text-[#73796c] mb-4">Nenhum candidato selecionado.</p>
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#123d00] text-white text-xs font-bold rounded-xl"
        >
          Voltar para Lista
        </button>
      </div>
    );
  }

  const handleApprove = () => {
    onUpdateStatus(candidate.id, 'APROVADO');
    setNotification({
      message: `Candidato ${candidate.fullName} homologado e APROVADO com sucesso! Notificação enviada.`,
      type: 'success',
    });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleReject = () => {
    onUpdateStatus(candidate.id, 'REPROVADO');
    setNotification({
      message: `Candidato ${candidate.fullName} marcado como REPROVADO pela banca.`,
      type: 'danger',
    });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleDownloadPdf = () => {
    setDownloadNotice(true);
    setTimeout(() => setDownloadNotice(false), 3000);
  };

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 pb-32">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed top-24 right-8 z-50 px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 text-white text-sm font-semibold transition-all animate-in fade-in slide-in-from-top-4 ${
            notification.type === 'success' ? 'bg-[#123d00]' : 'bg-[#b91c1c]'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-[#a2d486]" />
          ) : (
            <AlertCircle className="w-5 h-5 text-white" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Top Navigation & Status Bar */}
      <div>
        <div className="flex items-center justify-between gap-4 mb-3">
          <button
            id="btn-voltar-candidatos"
            onClick={onBack}
            className="inline-flex items-center gap-2 text-xs font-bold text-[#42493d] hover:text-[#123d00] transition-colors group cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span>Voltar para Lista de Candidatos</span>
          </button>

          <div className="flex items-center gap-2">
            {onUpdateCandidate && (
              <button
                id="btn-editar-dossie-topo"
                onClick={() => setIsEditModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-[#191c19] bg-[#f4f6f0] hover:bg-[#e7e9e3] border border-[#c2c9b9] rounded-xl transition-all shadow-xs cursor-pointer"
              >
                <Pencil className="w-3.5 h-3.5 text-[#123d00]" />
                <span>Editar Ficha de Inscrição</span>
              </button>
            )}

            {onDeleteCandidate && (
              <button
                id="btn-excluir-dossie-topo"
                onClick={() => setIsDeleteModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-[#b91c1c] bg-[#fef2f2] hover:bg-[#fee2e2] border border-[#fecaca] rounded-xl transition-all shadow-xs cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Excluir</span>
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center flex-wrap gap-3">
            <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-[#082500] uppercase tracking-wide">
              {candidate.fullName}
            </h1>
            <span className="font-mono text-xs font-bold text-[#646029] bg-[#f2f4ee] px-3 py-1 rounded-md border border-[#c2c9b9]">
              ID {candidate.id}
            </span>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#e8f5e9] text-[#1b5e20] border border-[#a5d6a7]">
              <span>MEMBRO COMIEADEPA</span>
              <Check className="w-3.5 h-3.5 stroke-[3]" />
            </div>

            {candidate.status === 'EM_ANALISE' && (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-[#fef3c7] text-[#92400e] border border-[#fde68a]">
                <span className="w-2 h-2 rounded-full bg-[#b45309] animate-pulse"></span>
                <span>STATUS: EM ANÁLISE (AGUARDANDO PARECER)</span>
              </div>
            )}
            {candidate.status === 'APROVADO' && (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-[#15803d]/15 text-[#15803d] border border-[#15803d]/40">
                <span className="w-2 h-2 rounded-full bg-[#15803d]"></span>
                <span>STATUS: APROVADO PELA COMISSÃO</span>
              </div>
            )}
            {candidate.status === 'REPROVADO' && (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-[#b91c1c]/15 text-[#b91c1c] border border-[#b91c1c]/40">
                <span className="w-2 h-2 rounded-full bg-[#b91c1c]"></span>
                <span>STATUS: REPROVADO (PARECER FINAL)</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Ficha de Inscrição, Memorial (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Card 1: Ficha de Inscrição / Identificação do Aspirante */}
          <div className="bg-white border border-[#c2c9b9]/60 rounded-2xl p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#f2f4ee]">
              <div className="flex items-center gap-2 text-xs font-bold text-[#646029] uppercase tracking-wider">
                <UserCheck className="w-4 h-4 text-[#123d00]" />
                <span>FICHA DE INSCRIÇÃO</span>
              </div>
              <span className="text-[11px] font-mono text-[#73796c]">REGISTRO 2026</span>
            </div>

            <div>
              <h2 className="font-display text-xl font-bold text-[#082500] uppercase tracking-wide">
                IDENTIFICAÇÃO DO ASPIRANTE
              </h2>
              <p className="text-xs text-[#73796c] mt-0.5">
                Dados submetidos conforme o edital de convocação teológica.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <span className="text-[10px] font-bold text-[#73796c] uppercase tracking-wider block">
                  NOME COMPLETO
                </span>
                <span className="text-sm font-bold text-[#191c19]">
                  {candidate.fullName}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-[#73796c] uppercase tracking-wider block">
                  NASCIMENTO
                </span>
                <span className="text-sm font-medium text-[#191c19]">
                  {candidate.birthDate && candidate.birthDate !== 'Não informada'
                    ? `${candidate.birthDate}${candidate.age ? ` (${candidate.age} anos)` : ''}`
                    : 'Não informada'}
                </span>
              </div>
            </div>

            <div className="space-y-3 pt-1">
              <div>
                <span className="text-[10px] font-bold text-[#73796c] uppercase tracking-wider block">
                  CORREIO ELETRÔNICO
                </span>
                <div className="flex items-center gap-1.5 text-sm text-[#191c19] mt-0.5">
                  <Mail className="w-3.5 h-3.5 text-[#73796c]" />
                  <span>{candidate.email}</span>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold text-[#73796c] uppercase tracking-wider block">
                  CONTATO DIRETO
                </span>
                <div className="flex items-center gap-1.5 text-sm font-semibold text-[#191c19] mt-0.5">
                  <Phone className="w-3.5 h-3.5 text-[#15803d]" />
                  <span>{candidate.phone}</span>
                  <span className="text-xs font-normal text-[#73796c]">(WhatsApp)</span>
                </div>
              </div>
            </div>

            {/* Jurisdição Institucional */}
            <div className="pt-3 border-t border-[#f2f4ee] space-y-2">
              <span className="text-[10px] font-bold text-[#73796c] uppercase tracking-wider block">
                JURISDIÇÃO INSTITUCIONAL
              </span>

              <div className="bg-[#f8faf4] border border-[#e1e3dd] rounded-xl p-3.5 space-y-2">
                <div className="flex items-start gap-2.5">
                  <Building className="w-4 h-4 text-[#123d00] shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-[#082500]">
                      {candidate.jurisdiction}
                    </h4>
                    <p className="text-xs text-[#42493d] mt-0.5">
                      Pastor Presidente: {candidate.pastor}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2 text-xs text-[#42493d] pt-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#15803d] shrink-0 mt-0.5" />
                  <span>{candidate.communionStatus}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card: Memorial de Motivação */}
          <div className="bg-white border border-[#c2c9b9]/60 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#f2f4ee]">
              <div className="flex items-center gap-2 text-xs font-bold text-[#646029] uppercase tracking-wider">
                <Quote className="w-4 h-4 text-[#123d00]" />
                <span>MEMORIAL DE MOTIVAÇÃO</span>
              </div>
              <span className="text-[11px] font-mono text-[#73796c]">
                {candidate.characterCount} CARACTERES
              </span>
            </div>

            <div className="relative bg-[#f8faf4] border border-[#e7e9e3] rounded-xl p-5 text-[#191c19] text-xs leading-relaxed italic space-y-3 font-serif">
              {candidate.memorial.split('\n\n').map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
              <div className="text-right text-[#c2c9b9] font-serif font-black text-3xl select-none leading-none -mt-4">
                ”
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Theological Performance, Canonical Questions, Discursive (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Card 1: Avaliação Propedêutica - Desempenho Objetivo */}
          <div className="bg-white border border-[#c2c9b9]/60 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-[#646029] uppercase tracking-wider block">
                  AVALIAÇÃO PROPEDÊUTICA
                </span>
                <h2 className="font-display text-2xl font-bold text-[#082500] uppercase tracking-wide mt-0.5">
                  DESEMPENHO TEOLÓGICO OBJETIVO
                </h2>
              </div>

              <div className="text-right">
                <div className="font-display text-3xl font-black text-[#082500]">
                  {candidate.objectiveScore.correct} <span className="text-base text-[#73796c] font-sans font-bold">/ {candidate.objectiveScore.total}</span>
                </div>
                <div className="text-xs font-bold text-[#15803d]">
                  ({candidate.objectiveScore.percentage}%)
                </div>
              </div>
            </div>

            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-xs text-[#42493d]">
                <span>Conformidade Canônica com o Gabarito Oficial</span>
                <span className="font-bold text-[#082500]">{candidate.objectiveScore.percentage}% de Aprovação Objetiva</span>
              </div>

              {/* Multi-segment progress bar */}
              <div className="w-full bg-[#edefe9] h-3 rounded-full overflow-hidden flex">
                <div
                  className="bg-[#123d00] h-full"
                  style={{ width: `${(candidate.objectiveScore.correct / candidate.objectiveScore.total) * 100}%` }}
                ></div>
                {candidate.objectiveScore.total - candidate.objectiveScore.correct > 0 && (
                  <div
                    className="bg-[#b91c1c] h-full"
                    style={{ width: `${((candidate.objectiveScore.total - candidate.objectiveScore.correct) / candidate.objectiveScore.total) * 100}%` }}
                  ></div>
                )}
              </div>

              <div className="flex items-center justify-between text-[11px] pt-1">
                <span className="text-[#123d00] font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#123d00]"></span>
                  {candidate.objectiveScore.correct} Questões Corretas
                </span>
                {candidate.objectiveScore.total - candidate.objectiveScore.correct > 0 ? (
                  <span className="text-[#b91c1c] font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#b91c1c]"></span>
                    {candidate.objectiveScore.total - candidate.objectiveScore.correct} Incorreção Doutrinária
                  </span>
                ) : (
                  <span className="text-[#15803d] font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#15803d]"></span>
                    Gabarito Integral (Sem Incorreções)
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Card 2: Gabarito Comparativo - 9 Questões Canônicas */}
          <div className="bg-white border border-[#c2c9b9]/60 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#f2f4ee]">
              <div>
                <span className="text-xs font-bold text-[#646029] uppercase tracking-wider block">
                  GABARITO COMPARATIVO
                </span>
                <h3 className="font-display text-lg font-bold text-[#082500] uppercase tracking-wide">
                  ESCOPO DAS 9 QUESTÕES CANÔNICAS
                </h3>
              </div>
              <span className="text-[10px] font-bold tracking-widest text-[#73796c] uppercase bg-[#f4f6f0] px-2.5 py-1 rounded-md border border-[#c2c9b9]">
                BANCA EXAMINADORA
              </span>
            </div>

            <div className="space-y-2.5">
              {candidate.objectiveQuestions.map((q) => {
                if (q.isCorrect) {
                  return (
                    <div
                      key={q.id}
                      className="bg-[#f8faf4] border border-[#e1e3dd] rounded-xl p-3 flex items-center justify-between text-xs hover:border-[#123d00]/30 transition-colors"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#191c19]">
                            Questão {q.id}: {q.topic}
                          </span>
                          <span className="text-[11px] font-bold text-[#15803d]">
                            ACERTO ✓
                          </span>
                        </div>
                        <p className="text-[11px] text-[#636c62]">
                          Resposta: {q.candidateAnswer}
                        </p>
                      </div>
                      <CheckCircle2 className="w-4 h-4 text-[#15803d] shrink-0 ml-2" />
                    </div>
                  );
                } else {
                  return (
                    <div
                      key={q.id}
                      className="bg-[#fff5f5] border border-[#fca5a5] rounded-xl p-4 text-xs space-y-2.5 animate-in fade-in"
                    >
                      <div className="flex items-center justify-between border-b border-[#fecaca] pb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#991b1b]">
                            Questão {q.id}: {q.topic}
                          </span>
                          <span className="text-[10px] font-bold bg-[#fee2e2] text-[#b91c1c] px-2 py-0.5 rounded-md">
                            DIVERGÊNCIA DOUTRINÁRIA
                          </span>
                        </div>
                        <AlertCircle className="w-4 h-4 text-[#b91c1c] shrink-0" />
                      </div>

                      <div className="space-y-1 text-[11px]">
                        <div>
                          <strong className="text-[#991b1b]">Assinalado pelo Candidato:</strong>{' '}
                          <span className="text-[#7f1d1d]">{q.candidateAnswer}</span>
                        </div>
                        <div>
                          <strong className="text-[#123d00]">Gabarito Oficial COMIEADEPA:</strong>{' '}
                          <span className="text-[#14532d] font-semibold">{q.officialAnswer}</span>
                        </div>
                        {q.note && (
                          <div className="bg-white/80 p-2.5 rounded-lg text-[#42493d] mt-2 border border-[#fca5a5]/40 leading-relaxed">
                            {q.note}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }
              })}
            </div>
          </div>

          {/* Card 3: Produção Textual e Teológica - Questão 10 Discursiva */}
          <div className="bg-white border border-[#c2c9b9]/60 rounded-2xl p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-2 border-b border-[#f2f4ee]">
              <div>
                <span className="text-xs font-bold text-[#646029] uppercase tracking-wider block">
                  PRODUÇÃO TEXTUAL E TEOLÓGICA
                </span>
                <h3 className="font-display text-lg font-bold text-[#082500] uppercase tracking-wide">
                  QUESTÃO 10: AVALIAÇÃO DISCURSIVA
                </h3>
              </div>
              <span className="text-[10px] font-bold tracking-widest text-[#123d00] uppercase bg-[#123d00]/10 px-2.5 py-1 rounded-md border border-[#123d00]/20">
                SUBJETIVA
              </span>
            </div>

            {/* Prompt */}
            <div className="bg-[#f8faf4] border-l-4 border-[#123d00] p-4 rounded-r-xl">
              <span className="text-[10px] font-bold text-[#73796c] uppercase tracking-wider block">
                ENUNCIADO DA QUESTÃO:
              </span>
              <p className="text-sm font-serif italic text-[#082500] font-semibold mt-1">
                {candidate.discursive.prompt}
              </p>
            </div>

            {/* Candidate Essay */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-[#73796c] uppercase tracking-wider block">
                REDAÇÃO APRESENTADA PELO CANDIDATO:
              </span>
              <div className="bg-[#fcfdfa] border border-[#c2c9b9]/60 rounded-xl p-5 text-xs text-[#191c19] leading-relaxed space-y-3 font-sans">
                {candidate.discursive.candidateAnswer.split('\n\n').map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            </div>

            {/* Grading Box */}
            <div className="bg-[#f2f4ee] border border-[#c2c9b9] rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#082500] uppercase tracking-wider">
                  NOTA DA BANCA EXAMINADORA
                </span>
                <span className="text-[10px] font-mono text-[#73796c]">ESCALA: 0.0 A 10.0</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                <div className="sm:col-span-4 bg-white p-3 rounded-xl border border-[#c2c9b9]">
                  <span className="text-[10px] font-bold text-[#73796c] uppercase tracking-wider block">
                    PONTUAÇÃO DISCURSIVA:
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      id="input-nota-discursiva"
                      type="number"
                      step="0.1"
                      min="0"
                      max="10"
                      value={score}
                      onChange={(e) => setScore(parseFloat(e.target.value) || 0)}
                      className="w-16 text-2xl font-display font-black text-[#082500] border-b-2 border-[#123d00] focus:outline-hidden bg-transparent"
                    />
                    <span className="text-sm font-bold text-[#73796c]">/ 10</span>
                  </div>
                </div>

                <div className="sm:col-span-8 bg-white p-3 rounded-xl border border-[#c2c9b9] flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-[#646029] shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] font-bold text-[#73796c] uppercase tracking-wider block">
                      JUÍZO PRELIMINAR DA BANCA:
                    </span>
                    <p className="text-xs font-medium text-[#191c19] mt-0.5">
                      {candidate.discursive.preliminaryVerdict}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-[#73796c] uppercase tracking-wider block mb-1.5">
                  OBSERVAÇÕES TEOLÓGICAS E RECOMENDAÇÕES:
                </label>
                <textarea
                  id="textarea-observacoes-teologicas"
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-white border border-[#c2c9b9] rounded-xl p-3 text-xs text-[#191c19] focus:outline-hidden focus:border-[#123d00] leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end pt-1">
                <button
                  id="btn-salvar-parecer-nota"
                  type="button"
                  onClick={() => {
                    if (onUpdateCandidate) {
                      onUpdateCandidate({
                        ...candidate,
                        discursive: {
                          ...candidate.discursive,
                          evaluatorScore: score,
                          theologicalNotes: notes,
                        },
                      });
                      setNotification({
                        message: 'Nota dissertativa e observações teológicas salvas na ficha de inscrição!',
                        type: 'success',
                      });
                      setTimeout(() => setNotification(null), 3500);
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#123d00] hover:bg-[#082500] rounded-xl transition-all shadow-xs cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Salvar Nota & Parecer</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Bottom Deliberation Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-[#c2c9b9] shadow-2xl py-3 px-4 sm:px-8">
        <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Left: Candidate deliberation badge */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="w-10 h-10 rounded-full bg-[#123d00] flex items-center justify-center text-[#b9b474] shrink-0">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#646029]">
                  VEREDITO DA COMISSÃO
                </span>
                <span className="text-[10px] text-[#73796c]">• Parecer {candidate.parecerId}</span>
              </div>
              <h4 className="text-sm font-bold text-[#191c19] truncate max-w-[280px] sm:max-w-md">
                Deliberação para {candidate.fullName}
              </h4>
            </div>
          </div>

          {/* Center Info on desktop */}
          <div className="hidden xl:block text-[11px] text-[#636c62] max-w-md text-center">
            Ao homologar a aprovação, o status é atualizado imediatamente na tabela geral e o candidato recebe a notificação canônica.
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            <button
              id="btn-reprovar-candidato"
              onClick={handleReject}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl border border-[#b91c1c] text-[#b91c1c] hover:bg-[#b91c1c]/10 text-xs font-bold transition-all"
            >
              <X className="w-4 h-4" />
              <span>Reprovar Candidato</span>
            </button>

            <button
              id="btn-aprovar-candidato"
              onClick={handleApprove}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[#123d00] hover:bg-[#082500] text-white text-xs font-bold transition-all shadow-md"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Aprovar Candidato para a Turma</span>
            </button>
          </div>
        </div>
      </div>

      {/* Edit Candidate Modal */}
      <CandidateFormModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        candidateToEdit={candidate}
        onSave={(updated) => {
          onUpdateCandidate?.(updated);
          setNotification({
            message: 'Ficha de inscrição do candidato atualizada com sucesso!',
            type: 'success',
          });
          setTimeout(() => setNotification(null), 3500);
        }}
      />

      {/* Delete Candidate Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        candidate={candidate}
        onConfirm={() => {
          onDeleteCandidate?.(candidate.id);
          onBack();
        }}
      />
    </div>
  );
};
