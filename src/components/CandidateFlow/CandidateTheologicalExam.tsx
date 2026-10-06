import React, { useState, useMemo } from 'react';
import { CandidateFormData } from '../../types';
import {
  EXAM_QUESTIONS,
  DISCURSIVE_PROMPT,
  getStoredExamQuestions,
  getStoredDiscursivePrompts,
} from '../../data/examQuestions';
import {
  GraduationCap,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Send,
  BookOpen,
} from 'lucide-react';

interface CandidateTheologicalExamProps {
  formData: CandidateFormData;
  onUpdateFormData: (updates: Partial<CandidateFormData>) => void;
  onSubmit: () => void;
  onBack: () => void;
}

export const CandidateTheologicalExam: React.FC<CandidateTheologicalExamProps> = ({
  formData,
  onUpdateFormData,
  onSubmit,
  onBack,
}) => {
  const [errors, setErrors] = useState<Record<number | string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [examQuestions, setExamQuestions] = useState(() =>
    getStoredExamQuestions().filter((q) => q.active !== false)
  );
  const [discursivePrompt, setDiscursivePrompt] = useState(() => {
    const active = getStoredDiscursivePrompts().find((d) => d.active);
    return active ? active.prompt : DISCURSIVE_PROMPT;
  });

  React.useEffect(() => {
    const handleSync = () => {
      setExamQuestions(getStoredExamQuestions().filter((q) => q.active !== false));
      const active = getStoredDiscursivePrompts().find((d) => d.active);
      setDiscursivePrompt(active ? active.prompt : DISCURSIVE_PROMPT);
    };

    window.addEventListener('storage', handleSync);
    window.addEventListener('exam_questions_updated', handleSync);
    window.addEventListener('exam_discursive_updated', handleSync);

    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('exam_questions_updated', handleSync);
      window.removeEventListener('exam_discursive_updated', handleSync);
    };
  }, []);

  // Count answered questions
  const objectiveAnsweredCount = Object.keys(formData.answers).length;
  const isDiscursiveAnswered = formData.discursiveAnswer.trim().length >= 30;
  const totalAnswered = objectiveAnsweredCount + (isDiscursiveAnswered ? 1 : 0);

  const handleSelectOption = (questionId: number, key: 'A' | 'B' | 'C' | 'D') => {
    const updated = { ...formData.answers, [questionId]: key };
    onUpdateFormData({ answers: updated });
    setErrors((prev) => {
      const copy = { ...prev };
      delete copy[questionId];
      return copy;
    });
  };

  const handleDiscursiveChange = (text: string) => {
    onUpdateFormData({ discursiveAnswer: text });
    if (text.trim().length >= 30) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy['discursive'];
        return copy;
      });
    }
  };

  const handleSubmit = () => {
    const newErrors: Record<number | string, string> = {};

    examQuestions.forEach((q) => {
      if (!formData.answers[q.id]) {
        newErrors[q.id] = 'Selecione uma resposta para esta questão';
      }
    });

    if (!formData.discursiveAnswer.trim() || formData.discursiveAnswer.length < 30) {
      newErrors['discursive'] =
        'Responda à questão discursiva com no mínimo 30 caracteres';
    }

    const errorKeys = Object.keys(newErrors);
    if (errorKeys.length > 0) {
      setErrors(newErrors);
      // scroll to first error
      const firstErrorId = errorKeys[0];
      if (firstErrorId) {
        const element = document.getElementById(`exam-question-${firstErrorId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      onSubmit();
    }, 800);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in pb-20">
      {/* Header Card */}
      <div className="bg-white border border-[#c2c9b9]/60 rounded-3xl p-5 sm:px-8 sm:pb-8 sm:pt-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-[#646029] tracking-widest uppercase block">
              ETAPA 2 DE 2
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#082500] uppercase tracking-wide mt-1">
              Conhecimentos Gerais em Teologia
            </h2>
            <p className="text-xs sm:text-sm text-[#42493d] mt-1">
              Avaliação de 9 questões objetivas e 1 redação discursiva.
            </p>
          </div>

          {/* Progress Pill */}
          <div className="bg-[#f8faf4] border border-[#c2c9b9] rounded-2xl p-4 shrink-0 flex flex-col items-end">
            <span className="text-[10px] font-bold text-[#73796c] uppercase tracking-wider">
              PROGRESSO DA PROVA
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="font-display text-2xl font-bold text-[#082500]">
                {totalAnswered}
              </span>
              <span className="text-xs font-bold text-[#73796c]">/ 10 respondidas</span>
            </div>
            <div className="w-28 bg-[#edefe9] h-2 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-[#123d00] h-full transition-all duration-300 rounded-full"
                style={{ width: `${(totalAnswered / 10) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Canonical Note Banner */}
        <div className="bg-[#f2f4ee] border border-[#c2c9b9] rounded-2xl p-4 text-xs text-[#42493d] flex items-start gap-3">
          <BookOpen className="w-5 h-5 text-[#123d00] shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-[#082500] block">
              Instruções para a Prova:
            </span>
            <p className="mt-0.5 text-[11px] leading-relaxed">
              As questões objetivas possuem apenas 1 (uma) alternativa correta. A questão 10 será avaliada pela Coordenação Teológica QGU.
            </p>
          </div>
        </div>
      </div>

      {/* Objective Questions (Exatamente 3 Opções A, B e C) */}
      <div className="space-y-6">
        {examQuestions.map((q) => {
          const selectedKey = formData.answers[q.id];
          const hasError = !!errors[q.id];

          return (
            <div
              key={q.id}
              id={`exam-question-${q.id}`}
              className={`bg-white border rounded-3xl p-6 sm:p-8 shadow-xs transition-all ${
                hasError
                  ? 'border-[#b91c1c] ring-1 ring-[#b91c1c]'
                  : selectedKey
                  ? 'border-[#123d00]/50'
                  : 'border-[#c2c9b9]/60'
              }`}
            >
              {/* Question Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[#f2f4ee]">
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-lg bg-[#123d00] text-white flex items-center justify-center font-display font-bold text-sm">
                    {q.id}
                  </span>
                  <span className="text-xs font-bold text-[#646029] uppercase tracking-wider">
                    {q.topic}
                  </span>
                </div>

                {selectedKey && (
                  <span className="text-[11px] font-bold text-[#15803d] flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Respondida ({selectedKey})</span>
                  </span>
                )}
              </div>

              {/* Question Text */}
              <h3 className="text-sm sm:text-base font-bold text-[#082500] mt-4 leading-relaxed">
                {q.question}
              </h3>

              {/* Options List */}
              <div className="space-y-3 mt-4">
                {q.options.map((opt) => {
                  const isSelected = selectedKey === opt.key;
                  return (
                    <div
                      key={opt.key}
                      onClick={() => handleSelectOption(q.id, opt.key)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5 ${
                        isSelected
                          ? 'bg-[#f4f6f0] border-[#123d00] shadow-xs'
                          : 'bg-[#fcfdfa] border-[#e1e3dd] hover:bg-[#f8faf4] hover:border-[#c2c9b9]'
                      }`}
                    >
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                          isSelected
                            ? 'bg-[#123d00] text-white'
                            : 'border border-[#c2c9b9] text-[#73796c]'
                        }`}
                      >
                        {opt.key}
                      </div>

                      <span
                        className={`text-xs leading-relaxed ${
                          isSelected ? 'font-semibold text-[#082500]' : 'text-[#42493d]'
                        }`}
                      >
                        {opt.text}
                      </span>
                    </div>
                  );
                })}
              </div>

              {hasError && (
                <div className="mt-3 flex items-center gap-1.5 text-xs text-[#b91c1c] font-semibold">
                  <AlertCircle className="w-4 h-4" />
                  <span>{errors[q.id]}</span>
                </div>
              )}
            </div>
          );
        })}

        {/* Question 10: Discursive Question */}
        <div
          id="exam-question-discursive"
          className={`bg-white border rounded-3xl p-6 sm:p-8 shadow-xs transition-all ${
            errors['discursive']
              ? 'border-[#b91c1c] ring-1 ring-[#b91c1c]'
              : formData.discursiveAnswer.trim().length >= 30
              ? 'border-[#123d00]/50'
              : 'border-[#c2c9b9]/60'
          }`}
        >
          <div className="flex items-center justify-between pb-3 border-b border-[#f2f4ee]">
            <div className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-lg bg-[#646029] text-white flex items-center justify-center font-display font-bold text-sm">
                10
              </span>
              <span className="text-xs font-bold text-[#646029] uppercase tracking-wider">
                Questão Discursiva
              </span>
            </div>

            <span className="text-[10px] font-mono text-[#73796c] bg-[#f8faf4] px-2.5 py-1 rounded-md border border-[#c2c9b9]">
              {formData.discursiveAnswer.length} caracteres
            </span>
          </div>

          <div className="mt-4 bg-[#f8faf4] border-l-4 border-[#123d00] p-4 rounded-r-2xl">
            <span className="text-[10px] font-bold text-[#73796c] uppercase tracking-wider block">
              ENUNCIADO:
            </span>
            <h3 className="text-base sm:text-lg font-serif italic font-bold text-[#082500] mt-1">
              "{discursivePrompt}"
            </h3>
          </div>

          <div className="mt-4 space-y-2">
            <label className="text-xs font-bold text-[#191c19] uppercase tracking-wider block">
              Atenção*:
            </label>
            <p className="text-xs text-[#73796c]">
              Desenvolva sua resposta com clareza gramatical, coerência doutrinária e profundidade bíblica.
            </p>

            <textarea
              id="textarea-discursive-candidate"
              rows={6}
              value={formData.discursiveAnswer}
              onChange={(e) => handleDiscursiveChange(e.target.value)}
              placeholder="Ex: Ser um cristão cheio do Espírito Santo transcende uma mera experiência emocional transitória; é uma realidade contínua de submissão diária ao senhorio de Cristo..."
              className={`w-full bg-[#fcfdfa] border rounded-2xl p-4 text-xs sm:text-sm text-[#191c19] focus:outline-hidden focus:border-[#123d00] focus:ring-1 focus:ring-[#123d00] leading-relaxed ${
                errors['discursive'] ? 'border-[#b91c1c]' : 'border-[#c2c9b9]'
              }`}
            />

            {errors['discursive'] && (
              <div className="flex items-center gap-1.5 text-xs text-[#b91c1c] font-semibold">
                <AlertCircle className="w-4 h-4" />
                <span>{errors['discursive']}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Submission Actions */}
      <div className="bg-white border border-[#c2c9b9]/60 rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <button
          type="button"
          onClick={onBack}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-2xl border border-[#c2c9b9] text-[#42493d] hover:bg-[#f2f4ee] text-xs font-bold transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para Dados Pessoais</span>
        </button>

        <div className="flex items-center gap-4 w-full sm:w-auto">
          <button
            id="btn-submit-exam"
            type="button"
            disabled={isSubmitting}
            onClick={handleSubmit}
            className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-10 py-3.5 rounded-2xl bg-[#123d00] hover:bg-[#0c2800] text-white text-xs sm:text-sm font-bold transition-all shadow-md cursor-pointer hover:scale-[1.02] active:scale-100 disabled:opacity-50"
          >
            {isSubmitting ? (
              <span>Corrigindo e Processando...</span>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Finalizar Inscrição</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
