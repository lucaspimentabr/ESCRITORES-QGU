import React, { useState, useEffect } from 'react';
import { Candidate, CandidateFormData, CandidateStep, SystemUser } from '../../types';
import { CandidateLanding } from './CandidateLanding';
import { CandidatePersonalData } from './CandidatePersonalData';
import { CandidateTheologicalExam } from './CandidateTheologicalExam';
import { CandidateSuccess } from './CandidateSuccess';
import {
  EXAM_QUESTIONS,
  DISCURSIVE_PROMPT,
  getStoredExamQuestions,
  getStoredDiscursivePrompts,
} from '../../data/examQuestions';
import {
  checkCandidateAlreadyRegistered,
  normalizeProcessoId,
  formatProcessoId,
} from '../../data/processoSeletivoService';
import {
  AlertCircle,
  FileCheck,
  ArrowRight,
  Lock,
  ShieldAlert,
  LogIn,
  Home,
  MessageCircle,
  SlidersHorizontal,
  GraduationCap,
} from 'lucide-react';

interface CandidateFlowWrapperProps {
  activeTab?: 'inscricao' | 'candidato' | 'prova';
  submissionId?: string | null;
  processoId?: string | null;
  candidates?: Candidate[];
  isInscriptionOpen: boolean;
  isAuthenticated?: boolean;
  currentUser?: SystemUser | null;
  onCandidateSubmitted: (newCandidate: Candidate) => void;
  onNavigateToCandidato?: () => void;
  onNavigateToInscricao?: () => void;
  onNavigateToProva?: () => void;
  onNavigateToSuccess?: (candidateId: string, processoId?: string | null) => void;
  onGoToLogin?: () => void;
  onGoToHome?: () => void;
}

export const CandidateFlowWrapper: React.FC<CandidateFlowWrapperProps> = ({
  activeTab = 'inscricao',
  submissionId = null,
  processoId = null,
  candidates = [],
  isInscriptionOpen,
  isAuthenticated = false,
  currentUser = null,
  onCandidateSubmitted,
  onNavigateToCandidato,
  onNavigateToInscricao,
  onNavigateToProva,
  onNavigateToSuccess,
  onGoToLogin,
  onGoToHome,
}) => {
  const getInitialStep = (): CandidateStep => {
    if (submissionId) return 'sucesso';
    if (activeTab === 'prova') return 'prova';
    if (activeTab === 'candidato') return 'dados';
    return 'landing';
  };

  const [currentStep, setCurrentStep] = useState<CandidateStep>(getInitialStep);
  const [lastSubmittedCandidate, setLastSubmittedCandidate] = useState<Candidate | null>(null);
  const [duplicateError, setDuplicateError] = useState<{
    message: string;
    existingCandidate: Candidate;
  } | null>(null);

  // Sync step if activeTab or submissionId changes externally (e.g. direct URL or browser back/forward)
  useEffect(() => {
    if (submissionId) {
      setCurrentStep('sucesso');
    } else if (activeTab === 'prova') {
      setCurrentStep('prova');
    } else if (activeTab === 'candidato') {
      setCurrentStep('dados');
    } else if (activeTab === 'inscricao') {
      setCurrentStep('landing');
    }
  }, [activeTab, submissionId]);

  const [formData, setFormData] = useState<CandidateFormData>(() => {
    try {
      const saved = sessionStorage.getItem('qgu_candidate_draft');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      fullName: '',
      email: '',
      phone: '',
      polo: '',
      church: '',
      pastor: '',
      birthDate: '',
      meetsRequirements: null,
      recommendationFile: null,
      motivation: '',
      answers: {},
      discursiveAnswer: '',
    };
  });

  const handleUpdateFormData = (updates: Partial<CandidateFormData>) => {
    setFormData((prev) => {
      const next = { ...prev, ...updates };
      try {
        sessionStorage.setItem('qgu_candidate_draft', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  // Find candidate to display if viewing a confirmed registration
  const matchedCandidate = submissionId
    ? candidates.find(
        (c) =>
          c.id.toLowerCase() === submissionId.toLowerCase() ||
          c.id.toLowerCase() === `#${submissionId.toLowerCase()}` ||
          c.id.replace('#', '').toLowerCase() === submissionId.replace('#', '').toLowerCase()
      ) || lastSubmittedCandidate
    : lastSubmittedCandidate;

  const displayCandidate: Candidate = matchedCandidate || lastSubmittedCandidate || {
    id: submissionId ? (submissionId.startsWith('#') ? submissionId : `#${submissionId}`) : '#QGU-2026-CONFIRMADO',
    fullName: formData.fullName || 'Candidato Homologado',
    initials: 'CH',
    birthDate: formData.birthDate || 'Conforme Edital',
    age: 28,
    email: formData.email || 'inscricao@qgu.comieadepa.org.br',
    phone: formData.phone || '(91) 98257-7589',
    polo: formData.polo || 'Belém Central',
    church: formData.church || 'COMIEADEPA Local',
    jurisdiction: 'COMIEADEPA – Pará',
    pastor: formData.pastor || 'Pastor Presidente',
    communionStatus: 'Membro em plena comunhão e formado em Teologia Básica.',
    registrationDate: new Date().toLocaleDateString('pt-BR') + ' às ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    objectiveScore: {
      correct: 10,
      total: 10,
      percentage: 100,
    },
    status: 'EM_ANALISE',
    statusLabel: 'STATUS: EM ANÁLISE (AGUARDANDO PARECER)',
    memorial: formData.motivation || 'Inscrição submetida para o Treinamento de Escritores QGU.',
    characterCount: (formData.motivation || '').length,
    objectiveQuestions: [],
    discursive: {
      prompt: getStoredDiscursivePrompts().find((d) => d.active)?.prompt || DISCURSIVE_PROMPT,
      candidateAnswer: formData.discursiveAnswer || 'Avaliação teológica submetida com êxito.',
      evaluatorScore: 9.0,
      maxScore: 10.0,
      preliminaryVerdict: 'Aguardando parecer final da banca examinadora.',
      theologicalNotes: 'Dossiê registrado no sistema.',
    },
    parecerId: `#${submissionId ? submissionId.replace(/[^0-9]/g, '').slice(0, 4) || '2026' : '2026'}`,
  };

  const handleFinalSubmit = () => {
    // Validação de unicidade: Um mesmo candidato poderá possuir apenas uma inscrição em cada processo seletivo.
    const alreadyRegistered = checkCandidateAlreadyRegistered(
      candidates,
      processoId,
      formData.email,
      (formData as any).cpf
    );

    if (alreadyRegistered) {
      setDuplicateError({
        message: `Você já possui uma inscrição realizada neste processo seletivo (${
          processoId ? formatProcessoId(processoId) : 'Edital Padrão'
        }) sob o protocolo ${alreadyRegistered.id}. Não é permitido o cadastro de uma segunda inscrição.`,
        existingCandidate: alreadyRegistered,
      });
      return;
    }

    // 1. Calculate objective questions and score
    const activeQuestions = getStoredExamQuestions();
    let correctCount = 0;
    const objectiveQuestions = activeQuestions.map((q) => {
      const candidateKey = formData.answers[q.id];
      const isCorrect = candidateKey === q.correctKey;
      if (isCorrect) correctCount++;

      const selectedOptionText =
        q.options.find((opt) => opt.key === candidateKey)?.text || 'Não assinalada';
      const officialOptionText =
        q.options.find((opt) => opt.key === q.correctKey)?.text || '';

      return {
        id: q.id,
        topic: q.topic,
        isCorrect,
        candidateAnswer: `Opção ${candidateKey} – ${selectedOptionText}`,
        officialAnswer: isCorrect
          ? undefined
          : `Opção ${q.correctKey} (${officialOptionText})`,
        note: isCorrect ? undefined : q.theologicalNote,
      };
    });

    const totalQuestions = activeQuestions.length || 10;
    const percentage = parseFloat(((correctCount / totalQuestions) * 100).toFixed(1));

    // 2. Generate random or sequential protocol
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const candidateId = `#QGU-2026-${randomNum}`;

    // 3. Name initials and avatar color
    const initials = formData.fullName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((n) => n[0].toUpperCase())
      .join('');

    const colors = ['#123d00', '#2563eb', '#7c3aed', '#d97706', '#059669', '#dc2626'];
    const avatarColor = colors[Math.floor(Math.random() * colors.length)];

    // 4. Calculate approximate age
    let age = 0;
    if (formData.birthDate) {
      const birthYear = new Date(formData.birthDate).getFullYear();
      if (!isNaN(birthYear)) {
        age = new Date().getFullYear() - birthYear;
      }
    }

    const cleanProc = processoId ? normalizeProcessoId(processoId) : '';

    const newCandidate: Candidate = {
      id: candidateId,
      editalId: cleanProc ? cleanProc.toLowerCase() : 'edital-2026-1',
      processoId: cleanProc ? formatProcessoId(cleanProc) : '#PS-2026-1',
      fullName: formData.fullName,
      initials: initials || 'CD',
      avatarColor,
      birthDate: formData.birthDate
        ? new Date(formData.birthDate + 'T00:00:00').toLocaleDateString('pt-BR')
        : 'Não informada',
      age,
      email: formData.email,
      phone: formData.phone,
      polo: formData.polo || 'Belém Central',
      church: formData.church || 'Igreja Local COMIEADEPA',
      jurisdiction: `COMIEADEPA – ${formData.polo || 'Campo Central'}`,
      pastor: formData.pastor,
      communionStatus: 'Membro em plena comunhão e formado em Teologia Básica.',
      registrationDate: new Date().toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }) + ` às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
      objectiveScore: {
        correct: correctCount,
        total: totalQuestions,
        percentage,
      },
      status: 'EM_ANALISE',
      statusLabel: 'STATUS: EM ANÁLISE (AGUARDANDO PARECER)',
      memorial: formData.motivation,
      characterCount: formData.motivation.length,
      objectiveQuestions,
      discursive: {
        prompt:
          getStoredDiscursivePrompts().find((d) => d.active)?.prompt || DISCURSIVE_PROMPT,
        candidateAnswer: formData.discursiveAnswer,
        evaluatorScore: 9.0, // default preliminary
        maxScore: 10.0,
        preliminaryVerdict: 'Aguardando parecer final da banca examinadora.',
        theologicalNotes: 'Dossiê recém-submetido pelo candidato.',
      },
      parecerId: `#${randomNum}`,
    };

    onCandidateSubmitted(newCandidate);
    setLastSubmittedCandidate(newCandidate);
    setCurrentStep('sucesso');
    try {
      sessionStorage.removeItem('qgu_candidate_draft');
    } catch {}
    onNavigateToSuccess?.(newCandidate.id, cleanProc || null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Regra de Acesso (Opção 1):
  // As páginas-modelo canônicas (/inscricao, /candidato, /prova sem processoId e sem submissionId)
  // são matrizes-base do sistema e têm acesso restrito e exclusivo à Coordenação Teológica (admin).
  // Candidatos reais apenas acessam através de links com processo seletivo específico (ex: /inscricao/2026.2).
  const isCanonicalModelPage = !processoId && !submissionId;
  const isCoordenacao = Boolean(isAuthenticated && (!currentUser || currentUser.role === 'admin'));
  const isRestrictedAccess = isCanonicalModelPage && !isCoordenacao;

  // Tela de Acesso Restrito para visitantes não autenticados nas páginas-modelo canônicas
  if (isRestrictedAccess) {
    return (
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        <div className="max-w-2xl mx-auto bg-white border border-[#c2c9b9] rounded-3xl p-6 sm:p-10 shadow-sm space-y-8 animate-in fade-in">
          {/* Top header badge */}
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-[#eff3eb] border border-[#dce3d5] text-[#123d00] flex items-center justify-center shadow-2xs">
              <Lock className="w-7 h-7 text-[#123d00]" />
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f4f6f0] border border-[#dce3d5] text-[11px] font-bold text-[#535928] uppercase tracking-wider">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Acesso Restrito à Coordenação</span>
            </div>

            <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-[#082500]">
              Página-Modelo do Sistema
            </h2>

            <p className="text-sm text-[#42493d] max-w-lg leading-relaxed">
              A rota <code className="px-2 py-0.5 rounded bg-[#f4f6f0] border border-[#e1e3dd] text-[#123d00] font-mono text-xs font-semibold">/{activeTab}</code> é uma <strong>página-modelo canônica</strong> da Escola de Escritores QGU / COMIEADEPA e seu acesso direto é reservado exclusivamente à <strong>Coordenação Teológica</strong>.
            </p>
          </div>

          {/* Card informativo institucional */}
          <div className="bg-[#f8faf4] border border-[#dce3d5] rounded-2xl p-6 text-center space-y-4">
            <p className="text-xs sm:text-sm text-[#52594d] leading-relaxed max-w-md mx-auto">
              As inscrições e avaliações de candidatos ocorrem exclusivamente através do link oficial de cada processo seletivo ativo (exemplo: <code className="text-[11px] font-mono font-bold text-[#191c19]">/inscricao/2026.2</code>).
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                id="btn-login-coordenacao-restrito"
                onClick={onGoToLogin}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#123d00] hover:bg-[#082500] text-white text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogIn className="w-4 h-4 text-[#a2d486]" />
                <span>Entrar como Coordenação</span>
              </button>
              <button
                type="button"
                id="btn-voltar-home-restrito"
                onClick={onGoToHome}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl border border-[#c2c9b9] bg-white hover:bg-[#f4f6f0] text-[#191c19] text-xs font-bold shadow-2xs transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Home className="w-4 h-4 text-[#52594d]" />
                <span>Ir para a Página Inicial</span>
              </button>
            </div>
          </div>

          {/* WhatsApp suporte */}
          <div className="pt-2 border-t border-[#f0f2eb] flex items-center justify-center text-center">
            <a
              id="link-whatsapp-duvidas-restrito"
              href="https://wa.me/5591982577589?text=Ol%C3%A1%2C%20gostaria%20de%20informa%C3%A7%C3%B5es%20sobre%20o%20link%20oficial%20de%20inscri%C3%A7%C3%A3o%20do%20processo%20seletivo%20Escritores%20QGU."
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[#52594d] hover:text-[#123d00] transition-colors inline-flex items-center gap-1.5 font-medium"
            >
              <MessageCircle className="w-3.5 h-3.5 text-[#25D366]" />
              <span>Dúvidas sobre o processo seletivo? Fale com a Coordenação no WhatsApp</span>
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pt-2 sm:pt-4 pb-12 space-y-6">
      {/* Banner Informativo: Modo Coordenação em Página-Modelo Canônica */}
      {isCanonicalModelPage && isCoordenacao && (
        <div className="bg-[#123d00] text-white px-4 py-3.5 rounded-2xl shadow-sm flex items-center gap-3 border border-[#23550c] animate-in fade-in">
          <div className="p-2 rounded-xl bg-white/10 text-[#a2d486] shrink-0">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#a2d486]">
                Página-Modelo Canônica ({activeTab === 'inscricao' ? 'Apresentação' : activeTab === 'candidato' ? 'Cadastro do Candidato' : 'Caderno de Prova'})
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/15 text-white font-semibold">
                Matriz Canônica
              </span>
            </div>
            <p className="text-[11px] text-white/80 leading-snug mt-0.5">
              Você está visualizando a matriz-base do sistema. Visitantes sem login estão bloqueados; candidatos acessam via links com processo seletivo (ex: <code className="text-white font-mono font-bold">/inscricao/2026.2</code>).
            </p>
          </div>
        </div>
      )}

      {/* Alerta de Inscrição Duplicada se detectada */}
      {duplicateError && (
        <div className="max-w-3xl mx-auto bg-amber-50 border-2 border-amber-300 rounded-3xl p-6 shadow-sm space-y-4 animate-in fade-in">
          <div className="flex items-start gap-3.5 text-amber-900">
            <AlertCircle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-bold text-sm uppercase tracking-wider">
                Inscrição já cadastrada neste processo
              </h4>
              <p className="text-xs text-amber-800 leading-relaxed">
                {duplicateError.message}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-amber-200">
            <button
              type="button"
              onClick={() => setDuplicateError(null)}
              className="px-4 py-2 rounded-xl border border-amber-300 bg-white hover:bg-amber-100 text-xs font-semibold text-amber-900 cursor-pointer"
            >
              Fechar
            </button>
            <button
              type="button"
              onClick={() => {
                const cand = duplicateError.existingCandidate;
                setDuplicateError(null);
                setLastSubmittedCandidate(cand);
                setCurrentStep('sucesso');
                onNavigateToSuccess?.(cand.id, processoId);
              }}
              className="px-5 py-2 rounded-xl bg-[#123d00] hover:bg-[#082500] text-white text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <span>Ver Meu Comprovante de Inscrição</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Dynamic Step View */}
      {currentStep === 'landing' && (
        <CandidateLanding
          isInscriptionOpen={isInscriptionOpen}
          processoId={processoId}
          onStart={() => {
            setCurrentStep('dados');
            onNavigateToCandidato?.();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      )}

      {currentStep === 'dados' && (
        <CandidatePersonalData
          formData={formData}
          onUpdateFormData={handleUpdateFormData}
          onNext={() => {
            const alreadyRegistered = checkCandidateAlreadyRegistered(
              candidates,
              processoId,
              formData.email,
              (formData as any).cpf
            );
            if (alreadyRegistered) {
              setDuplicateError({
                message: `Você já possui uma inscrição realizada neste processo seletivo (${
                  processoId ? formatProcessoId(processoId) : 'Edital Padrão'
                }) sob o protocolo ${alreadyRegistered.id}. Não é permitido o cadastro de uma segunda inscrição.`,
                existingCandidate: alreadyRegistered,
              });
              return;
            }
            setCurrentStep('prova');
            onNavigateToProva?.();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onBack={() => {
            setCurrentStep('landing');
            onNavigateToInscricao?.();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      )}

      {currentStep === 'prova' && (
        <CandidateTheologicalExam
          formData={formData}
          onUpdateFormData={handleUpdateFormData}
          onSubmit={handleFinalSubmit}
          onBack={() => {
            setCurrentStep('dados');
            onNavigateToCandidato?.();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      )}

      {currentStep === 'sucesso' && (
        <CandidateSuccess
          candidate={displayCandidate}
          processoId={processoId}
          onNewRegistration={() => {
            setFormData({
              fullName: '',
              email: '',
              phone: '',
              polo: '',
              church: '',
              pastor: '',
              birthDate: '',
              meetsRequirements: null,
              recommendationFile: null,
              motivation: '',
              answers: {},
              discursiveAnswer: '',
            });
            try {
              sessionStorage.removeItem('qgu_candidate_draft');
            } catch {}
            setCurrentStep('landing');
            onNavigateToInscricao?.();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      )}
    </div>
  );
};
