import React, { useState, useMemo } from 'react';
import {
  Candidate,
  CandidateStatus,
  Turma,
  SystemUser,
  AcademicModule,
  StudentAcademicRecord,
  MuralAviso,
  ProcessoSeletivoEtapa,
} from '../types';
import {
  Users,
  CheckCircle2,
  FileSpreadsheet,
  Clock,
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileEdit,
  ShieldCheck,
  Download,
  Check,
  UserPlus,
  Pencil,
  Trash2,
  RotateCcw,
  AlertCircle,
  GraduationCap,
  Calendar,
  ClipboardList,
  Home,
} from 'lucide-react';
import { CandidateFormModal } from './CandidateFormModal';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { ReportModal } from './ReportModal';
import { AcademicReportModal } from './AcademicReportModal';
import { UserManagementView } from './UserManagementView';
import { TurmasManagementView } from './TurmasManagementView';
import { VisaoGeralView } from './VisaoGeralView';
import { ProcessoSeletivoView } from './ProcessoSeletivoView';
import { Disciplina } from '../types';

interface DashboardViewProps {
  candidates: Candidate[];
  onSelectCandidate: (candidateId: string) => void;
  isInscriptionOpen: boolean;
  onToggleInscription: () => void;
  onCreateCandidate?: (candidate: Candidate) => void;
  onUpdateCandidate?: (candidate: Candidate) => void;
  onDeleteCandidate?: (candidateId: string) => void;
  onResetCandidates?: () => void;
  turmas?: Turma[];
  users?: SystemUser[];
  modules?: AcademicModule[];
  students?: StudentAcademicRecord[];
  avisos?: MuralAviso[];
  disciplinas?: Disciplina[];
  onUpdateTurmas?: (turmas: Turma[]) => void;
  onUpdateUsers?: (users: SystemUser[]) => void;
  onUpdateStudents?: (students: StudentAcademicRecord[]) => void;
  onUpdateAvisos?: (avisos: MuralAviso[]) => void;
  onUpdateDisciplinas?: (disciplinas: Disciplina[]) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  candidates,
  onSelectCandidate,
  isInscriptionOpen,
  onToggleInscription,
  onCreateCandidate,
  onUpdateCandidate,
  onDeleteCandidate,
  onResetCandidates,
  turmas = [],
  users = [],
  modules = [],
  students = [],
  avisos = [],
  disciplinas = [],
  onUpdateTurmas,
  onUpdateUsers,
  onUpdateStudents,
  onUpdateAvisos,
  onUpdateDisciplinas,
}) => {
  const [panelTab, setPanelTab] = useState<
    'visao_geral' | 'processos_seletivos' | 'gestao_turmas' | 'gestao_usuarios'
  >('visao_geral');
  const [turmasInitialSubTab, setTurmasInitialSubTab] = useState<'monitoramento' | 'materiais'>('monitoramento');
  const [etapas, setEtapas] = useState<ProcessoSeletivoEtapa[]>([
    {
      id: 'etapa-1',
      nome: 'Inscrições Abertas & Submissão do Memorial',
      descricao: 'Período oficial de submissão do formulário de inscrição e memorial descritivo.',
      dataInicio: '01/01/2026',
      dataFim: '15/02/2026',
      status: 'Concluída',
      ordem: 1,
      responsavel: 'Coordenação Geral',
    },
    {
      id: 'etapa-2',
      nome: 'Análise Documental & Homologação Preliminar',
      descricao: 'Verificação dos dados cadastrais e conformidade eclesiástica dos vocacionados.',
      dataInicio: '16/02/2026',
      dataFim: '28/02/2026',
      status: 'Em Andamento',
      ordem: 2,
      responsavel: 'Banca Examinadora',
    },
    {
      id: 'etapa-3',
      nome: 'Prova Teológica Objetiva',
      descricao: 'Aplicação da prova teológica de 10 questões com foco bíblico e doutrinário.',
      dataInicio: '01/03/2026',
      dataFim: '10/03/2026',
      status: 'Pendente',
      ordem: 3,
      responsavel: 'Banca Avaliadora',
    },
    {
      id: 'etapa-4',
      nome: 'Avaliação da Redação Dissertativa',
      descricao: 'Correção cega dos textos dissertativos e parecer crítico dos docentes avaliadores.',
      dataInicio: '11/03/2026',
      dataFim: '20/03/2026',
      status: 'Pendente',
      ordem: 4,
      responsavel: 'Docentes da Banca',
    },
    {
      id: 'etapa-5',
      nome: 'Homologação Final & Publicação dos Aprovados',
      descricao: 'Publicação oficial da lista de aprovados no diário da convenção e início das matrículas.',
      dataInicio: '21/03/2026',
      dataFim: '31/03/2026',
      status: 'Pendente',
      ordem: 5,
      responsavel: 'Presidência da COMIEADEPA',
    },
  ]);
  const [isAcademicReportOpen, setIsAcademicReportOpen] = useState(false);
  const [selectedReportTurmaId, setSelectedReportTurmaId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | CandidateStatus>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [showExportSuccess, setShowExportSuccess] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Modal & Notification state for CRUD
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [candidateBeingEdited, setCandidateBeingEdited] = useState<Candidate | null>(null);
  const [candidateToDelete, setCandidateToDelete] = useState<Candidate | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'danger' } | null>(null);

  // Metrics calculation based on real candidate data
  const totalCount = candidates.length;
  const approvedCount = candidates.filter((c) => c.status === 'APROVADO').length;
  const pendingCount = candidates.filter((c) => c.status === 'EM_ANALISE').length;
  const rejectedCount = candidates.filter((c) => c.status === 'REPROVADO').length;
  const evaluatedCount = approvedCount + rejectedCount;
  const approvalRate = totalCount > 0 ? ((approvedCount / totalCount) * 100).toFixed(1) : '0.0';

  // Filtered list
  const filteredCandidates = useMemo(() => {
    return candidates.filter((candidate) => {
      const matchesSearch =
        candidate.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        candidate.polo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        candidate.church.toLowerCase().includes(searchQuery.toLowerCase()) ||
        candidate.id.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === 'ALL' ? true : candidate.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [candidates, searchQuery, statusFilter]);

  const handleExport = () => {
    setIsReportModalOpen(true);
    setShowExportSuccess(true);
    setTimeout(() => setShowExportSuccess(false), 3500);
  };

  const handleOpenCreateModal = (manualCandidate?: Candidate) => {
    if (manualCandidate && manualCandidate.id) {
      handleSaveCandidate(manualCandidate);
      return;
    }
    setCandidateBeingEdited(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (candidate: Candidate) => {
    setCandidateBeingEdited(candidate);
    setIsFormModalOpen(true);
  };

  const handleOpenDeleteModal = (candidate: Candidate) => {
    setCandidateToDelete(candidate);
  };

  const handleSaveCandidate = (saved: Candidate) => {
    if (candidateBeingEdited) {
      onUpdateCandidate?.(saved);
      setToastMessage({ text: `Candidato ${saved.fullName} atualizado com sucesso!`, type: 'success' });
    } else {
      onCreateCandidate?.(saved);
      setToastMessage({ text: `Novo candidato ${saved.fullName} cadastrado com sucesso!`, type: 'success' });
    }
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleConfirmDelete = () => {
    if (candidateToDelete) {
      onDeleteCandidate?.(candidateToDelete.id);
      setToastMessage({ text: `Candidato ${candidateToDelete.fullName} removido com sucesso!`, type: 'danger' });
      setCandidateToDelete(null);
      setTimeout(() => setToastMessage(null), 3500);
    }
  };

  return (
    <div className="max-w-[1440px] mx-auto px-2 sm:px-6 lg:px-8 py-4 sm:py-8 pb-20 sm:pb-32 space-y-6 sm:space-y-8 relative overflow-x-hidden">
      {/* Toast Alert */}
      {toastMessage && (
        <div
          className={`fixed top-20 right-6 z-50 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 text-white text-xs font-semibold transition-all animate-in fade-in slide-in-from-top-4 ${
            toastMessage.type === 'success' ? 'bg-[#123d00]' : 'bg-[#b91c1c]'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-[#a2d486]" />
          ) : (
            <AlertCircle className="w-4 h-4 text-white" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* ABA: VISÃO GERAL (Ícone Home: tela inicial com métricas mais importantes e dashboards consolidados) */}
      {panelTab === 'visao_geral' && (
        <VisaoGeralView
          candidates={candidates}
          turmas={turmas}
          users={users}
          students={students}
          modules={modules}
          disciplinas={disciplinas}
          etapas={etapas}
          isInscriptionOpen={isInscriptionOpen}
          onToggleInscription={onToggleInscription}
          onNavigateTab={(tab) => {
            if ((tab as string) === 'materiais_didaticos') {
              setTurmasInitialSubTab('materiais');
              setPanelTab('gestao_turmas');
            } else {
              if (tab === 'gestao_turmas') setTurmasInitialSubTab('monitoramento');
              setPanelTab(tab as any);
            }
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      )}

      {/* TAB 1: PROCESSOS SELETIVOS (Cria, Controla, deleta e edita as etapas do processo seletivo ativo) */}
      {panelTab === 'processos_seletivos' && (
        <ProcessoSeletivoView
          candidates={candidates}
          onSelectCandidate={onSelectCandidate}
          isInscriptionOpen={isInscriptionOpen}
          onToggleInscription={onToggleInscription}
          onCreateCandidate={handleOpenCreateModal}
          onUpdateCandidate={handleOpenEditModal}
          onDeleteCandidate={(id) => {
            const cand = candidates.find((c) => c.id === id);
            if (cand) handleOpenDeleteModal(cand);
          }}
          etapas={etapas}
          onUpdateEtapas={setEtapas}
        />
      )}

      {/* TAB 2: GESTÃO DE TURMAS (Cria, Controla, deleta e edita as turmas administrando quais professores e alunos para cada turma) */}
      {panelTab === 'gestao_turmas' && (
        <TurmasManagementView
          turmas={turmas}
          users={users}
          students={students}
          modules={modules}
          disciplinas={disciplinas}
          avisos={avisos}
          initialSubTab={turmasInitialSubTab}
          onUpdateTurmas={onUpdateTurmas || (() => {})}
          onUpdateUsers={onUpdateUsers || (() => {})}
          onUpdateStudents={onUpdateStudents}
          onUpdateAvisos={onUpdateAvisos}
          onUpdateDisciplinas={onUpdateDisciplinas}
          onOpenReportModal={(turmaId) => {
            if (turmaId) setSelectedReportTurmaId(turmaId);
            setIsAcademicReportOpen(true);
          }}
          onNavigateToMateriais={() => {
            setTurmasInitialSubTab('materiais');
            setPanelTab('gestao_turmas');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      )}

      {/* TAB 3: GESTÃO DE USUÁRIOS (Cria, Controla, deleta e edita os usuários tudo isso em forma de uma tabela com filtro (Coordenador, Professor, Aluno, Turma). Essa tabela deve ter uma exportação de relatório) */}
      {panelTab === 'gestao_usuarios' && (
        <UserManagementView
          users={users}
          turmas={turmas}
          onUpdateUsers={onUpdateUsers || (() => {})}
        />
      )}

      {/* BARRA DE CONTROLE PRINCIPAL DO PAINEL ADMINISTRATIVO (RODAPÉ ESTILO APP NO MOBILE / BOTÕES ORIGINAIS NO DESKTOP) */}
      <nav
        aria-label="Barra de Controle Principal do Painel Administrativo"
        className="fixed bottom-0 inset-x-0 z-40 sm:bottom-6 sm:left-1/2 sm:-translate-x-1/2 sm:inset-x-auto sm:w-auto overflow-hidden no-scrollbar"
      >
        <div className="bg-[#082500]/95 backdrop-blur-md border-t border-[#a2d486]/30 sm:border sm:border-[#a2d486]/40 shadow-none rounded-none sm:rounded-full px-2 pt-2 pb-[max(0.65rem,env(safe-area-inset-bottom))] sm:p-2 flex items-center justify-around sm:justify-center sm:gap-2.5 ring-0 w-full sm:w-auto overflow-hidden no-scrollbar">
          {/* 1. Aba: Visão Geral */}
          <button
            type="button"
            id="btn-nav-visao-geral"
            onClick={() => {
              setPanelTab('visao_geral');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`flex-1 sm:flex-initial flex flex-col sm:flex-row items-center justify-center py-1.5 px-1 sm:p-3 rounded-xl sm:rounded-full transition-all cursor-pointer relative group ${
              panelTab === 'visao_geral'
                ? 'text-[#a2d486] font-bold sm:bg-[#a2d486] sm:text-[#082500] sm:shadow-none sm:scale-105'
                : 'text-white/60 hover:text-white sm:text-white/70 sm:hover:bg-white/10'
            }`}
            title="Visão Geral"
            aria-label="Visão Geral"
          >
            <Home className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" />
            <span className="text-[10px] tracking-tight mt-1 sm:hidden leading-none select-none">
              Visão Geral
            </span>
            <span className="pointer-events-none absolute -top-11 left-1/2 -translate-x-1/2 px-2.5 py-1 bg-[#082500] text-white text-[10px] font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-none border border-[#a2d486]/30 hidden sm:block">
              Visão Geral
            </span>
          </button>

          {/* 2. Aba: Processos seletivos */}
          <button
            type="button"
            id="btn-nav-processos-seletivos"
            onClick={() => {
              setPanelTab('processos_seletivos');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`flex-1 sm:flex-initial flex flex-col sm:flex-row items-center justify-center py-1.5 px-1 sm:p-3 rounded-xl sm:rounded-full transition-all cursor-pointer relative group ${
              panelTab === 'processos_seletivos'
                ? 'text-[#a2d486] font-bold sm:bg-[#a2d486] sm:text-[#082500] sm:shadow-none sm:scale-105'
                : 'text-white/60 hover:text-white sm:text-white/70 sm:hover:bg-white/10'
            }`}
            title="Processos seletivos"
            aria-label="Processos seletivos"
          >
            <ClipboardList className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" />
            <span className="text-[10px] tracking-tight mt-1 sm:hidden leading-none select-none">
              Processos
            </span>
            <span className="pointer-events-none absolute -top-11 left-1/2 -translate-x-1/2 px-2.5 py-1 bg-[#082500] text-white text-[10px] font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-none border border-[#a2d486]/30 hidden sm:block">
              Processos seletivos
            </span>
          </button>

          {/* 3. Aba: Gestão de Turmas */}
          <button
            type="button"
            id="btn-nav-gestao-turmas"
            onClick={() => {
              setPanelTab('gestao_turmas');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`flex-1 sm:flex-initial flex flex-col sm:flex-row items-center justify-center py-1.5 px-1 sm:p-3 rounded-xl sm:rounded-full transition-all cursor-pointer relative group ${
              panelTab === 'gestao_turmas'
                ? 'text-[#a2d486] font-bold sm:bg-[#a2d486] sm:text-[#082500] sm:shadow-none sm:scale-105'
                : 'text-white/60 hover:text-white sm:text-white/70 sm:hover:bg-white/10'
            }`}
            title="Gestão de Turmas"
            aria-label="Gestão de Turmas"
          >
            <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" />
            <span className="text-[10px] tracking-tight mt-1 sm:hidden leading-none select-none">
              Turmas
            </span>
            <span className="pointer-events-none absolute -top-11 left-1/2 -translate-x-1/2 px-2.5 py-1 bg-[#082500] text-white text-[10px] font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-none border border-[#a2d486]/30 hidden sm:block">
              Gestão de Turmas
            </span>
          </button>

          {/* 4. Aba: Gestão de Usuários */}
          <button
            type="button"
            id="btn-nav-gestao-usuarios"
            onClick={() => {
              setPanelTab('gestao_usuarios');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`flex-1 sm:flex-initial flex flex-col sm:flex-row items-center justify-center py-1.5 px-1 sm:p-3 rounded-xl sm:rounded-full transition-all cursor-pointer relative group ${
              panelTab === 'gestao_usuarios'
                ? 'text-[#a2d486] font-bold sm:bg-[#a2d486] sm:text-[#082500] sm:shadow-none sm:scale-105'
                : 'text-white/60 hover:text-white sm:text-white/70 sm:hover:bg-white/10'
            }`}
            title="Gestão de Usuários"
            aria-label="Gestão de Usuários"
          >
            <Users className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" />
            <span className="text-[10px] tracking-tight mt-1 sm:hidden leading-none select-none">
              Usuários
            </span>
            <span className="pointer-events-none absolute -top-11 left-1/2 -translate-x-1/2 px-2.5 py-1 bg-[#082500] text-white text-[10px] font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-none border border-[#a2d486]/30 hidden sm:block">
              Gestão de Usuários
            </span>
          </button>
        </div>
      </nav>

      {/* Add / Edit Candidate Form Modal */}
      <CandidateFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        candidateToEdit={candidateBeingEdited}
        onSave={handleSaveCandidate}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!candidateToDelete}
        onClose={() => setCandidateToDelete(null)}
        candidate={candidateToDelete}
        onConfirm={handleConfirmDelete}
      />

      {/* Report Modal */}
      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        candidates={candidates}
        statusFilter={statusFilter}
      />

      {/* Academic Official Report Modal */}
      {turmas.length > 0 && (
        <AcademicReportModal
          isOpen={isAcademicReportOpen}
          onClose={() => setIsAcademicReportOpen(false)}
          turma={turmas.find((t) => t.id === selectedReportTurmaId) || turmas[0]}
          students={students}
          modules={modules}
        />
      )}
    </div>
  );
};
