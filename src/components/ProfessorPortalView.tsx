import React, { useState } from 'react';
import {
  BookOpen,
  GraduationCap,
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  UploadCloud,
  FileText,
  Plus,
  Save,
  MessageSquare,
  Search,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Percent,
  Bell,
  Pin,
  Trash2,
  Edit3,
  X,
  Award,
  ShieldCheck,
  Building2,
  Send,
  Calendar,
} from 'lucide-react';
import {
  Candidate,
  SystemUser,
  AcademicModule,
  StudentAcademicRecord,
  ComplementaryMaterial,
  MuralAviso,
  Turma,
  StudentSubmission,
  Disciplina,
} from '../types';
import { TurmasManagementView, isUserAvisoAuthor } from './TurmasManagementView';

interface ProfessorPortalViewProps {
  currentUser: SystemUser;
  candidates?: Candidate[];
  modules: AcademicModule[];
  students: StudentAcademicRecord[];
  turmas?: Turma[];
  users?: SystemUser[];
  disciplinas?: Disciplina[];
  avisos?: MuralAviso[];
  onUpdateCandidate?: (c: Candidate) => void;
  onUpdateStudents: (s: StudentAcademicRecord[]) => void;
  onAddComplementaryMaterial: (m: ComplementaryMaterial) => void;
  onUpdateAvisos?: (avisos: MuralAviso[]) => void;
  onUpdateTurmas?: (turmas: Turma[]) => void;
  onUpdateUsers?: (users: SystemUser[]) => void;
  onUpdateDisciplinas?: (disciplinas: Disciplina[]) => void;
  onOpenReportModal?: (turmaId?: string) => void;
}

export const ProfessorPortalView: React.FC<ProfessorPortalViewProps> = ({
  currentUser,
  candidates = [],
  modules,
  students,
  turmas = [],
  users = [],
  disciplinas = [],
  avisos = [],
  onUpdateCandidate,
  onUpdateStudents,
  onAddComplementaryMaterial,
  onUpdateAvisos,
  onUpdateTurmas = () => {},
  onUpdateUsers = () => {},
  onUpdateDisciplinas = () => {},
  onOpenReportModal = () => {},
}) => {
  const [portalSection, setPortalSection] = useState<'turmas' | 'banca'>('turmas');
  const [activeTab, setActiveTab] = useState<
    'banca' | 'mural' | 'notas' | 'materiais' | 'frequencia' | 'feedback'
  >('banca');

  // Linked Turma logic: Professor Titular has exclusive link to turma
  const linkedTurmaId = currentUser.turmaId || 'turma-2026';
  const linkedTurma = turmas.find((t) => t.id === linkedTurmaId) || {
    id: linkedTurmaId,
    name: 'Turma 2026 • COMIEADEPA',
    status: 'Em Andamento',
    ano: 2026,
    semestre: '1º Semestre',
  };

  // Feedback notifications
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // =========================================================================
  // TAB 1: BANCA EXAMINADORA (ENSAIOS E ARTIGOS FINAIS DOS ALUNOS DA TURMA)
  // =========================================================================
  // Flatten submissions from all students in the turma
  const allSubmissions = students.flatMap((st) =>
    (st.submissions || []).map((sub) => ({
      ...sub,
      student: st,
    }))
  );

  const [bancaSearch, setBancaSearch] = useState('');
  const [bancaStatusFilter, setBancaStatusFilter] = useState<'ALL' | 'Pendente' | 'Avaliado'>('ALL');
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string>(
    allSubmissions[0]?.id || ''
  );

  const filteredSubmissions = allSubmissions.filter((sub) => {
    const matchesSearch =
      sub.tituloTrabalho.toLowerCase().includes(bancaSearch.toLowerCase()) ||
      sub.student.alunoName.toLowerCase().includes(bancaSearch.toLowerCase()) ||
      sub.student.matricula.toLowerCase().includes(bancaSearch.toLowerCase()) ||
      (sub.student.polo && sub.student.polo.toLowerCase().includes(bancaSearch.toLowerCase()));

    const matchesStatus =
      bancaStatusFilter === 'ALL'
        ? true
        : bancaStatusFilter === 'Pendente'
        ? sub.status !== 'Avaliado'
        : sub.status === 'Avaliado';

    return matchesSearch && matchesStatus;
  });

  const selectedSub =
    allSubmissions.find((s) => s.id === selectedSubmissionId) ||
    filteredSubmissions[0] ||
    null;

  // Evaluation fields for the selected submission
  const [evalNota, setEvalNota] = useState<number>(selectedSub?.nota ?? 9.0);
  const [evalVerdict, setEvalVerdict] = useState<string>('Aprovado com Louvor e Distinção');
  const [evalFeedback, setEvalFeedback] = useState<string>(selectedSub?.feedback ?? '');

  // When selecting another submission, populate fields
  const handleSelectSubmission = (sub: typeof allSubmissions[0]) => {
    setSelectedSubmissionId(sub.id);
    setEvalNota(sub.nota ?? 9.0);
    setEvalVerdict(
      sub.nota && sub.nota >= 9.5
        ? 'Aprovado com Louvor e Distinção'
        : sub.nota && sub.nota >= 7.0
        ? 'Aprovado'
        : 'Ajustes Teológicos Recomendados'
    );
    setEvalFeedback(sub.feedback || '');
  };

  const handleSaveBancaEvaluation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSub) return;

    const fullFeedback = evalFeedback.trim()
      ? `[Parecer da Banca: ${evalVerdict}] ${evalFeedback.trim()}`
      : `[Parecer da Banca: ${evalVerdict}] Trabalho avaliado e homologado pelo Professor Titular.`;

    const updatedStudents = students.map((st) => {
      if (st.alunoId === selectedSub.student.alunoId) {
        const updatedSubs = st.submissions.map((sub) => {
          if (sub.id === selectedSub.id) {
            return {
              ...sub,
              status: 'Avaliado' as const,
              nota: Number(evalNota),
              feedback: fullFeedback,
              professorName: currentUser.name,
            };
          }
          return sub;
        });

        // Recalculate average
        const evaluatedSubs = updatedSubs.filter((s) => s.nota !== undefined);
        const mediaGeral =
          evaluatedSubs.length > 0
            ? Number(
                (
                  evaluatedSubs.reduce((acc, curr) => acc + (curr.nota || 0), 0) /
                  evaluatedSubs.length
                ).toFixed(1)
              )
            : st.mediaGeral;

        // Also record in notas array
        const updatedNotas = [
          ...st.notas.filter((n) => n.moduloNumber !== selectedSub.moduloNumber),
          {
            moduloNumber: selectedSub.moduloNumber,
            moduloTitle: selectedSub.moduloTitle,
            nota: Number(evalNota),
            feedback: fullFeedback,
            dataLancamento: new Date().toLocaleDateString('pt-BR'),
            professorName: currentUser.name,
          },
        ];

        return {
          ...st,
          submissions: updatedSubs,
          notas: updatedNotas,
          mediaGeral,
        };
      }
      return st;
    });

    onUpdateStudents(updatedStudents);
    showToast(`Parecer da Banca registrado com sucesso para ${selectedSub.student.alunoName}! Nota: ${evalNota}`);
  };

  // =========================================================================
  // TAB 2: MURAL DE AVISOS DA TURMA (FERRAMENTA DO PROFESSOR TITULAR)
  // =========================================================================
  const turmaAvisos = avisos.filter(
    (a) => !a.turmaId || a.turmaId === linkedTurmaId || a.turmaId === 'ALL'
  );

  const [showCreateAvisoModal, setShowCreateAvisoModal] = useState(false);
  const [editingAviso, setEditingAviso] = useState<MuralAviso | null>(null);

  // Form states for Aviso
  const [avisoTitulo, setAvisoTitulo] = useState('');
  const [avisoConteudo, setAvisoConteudo] = useState('');
  const [avisoCategoria, setAvisoCategoria] = useState<
    'Geral' | 'Acadêmico' | 'Encontro Síncrono' | 'Urgente' | 'Avaliação'
  >('Acadêmico');
  const [avisoImportante, setAvisoImportante] = useState(false);

  const handleOpenCreateAviso = () => {
    setEditingAviso(null);
    setAvisoTitulo('');
    setAvisoConteudo('');
    setAvisoCategoria('Acadêmico');
    setAvisoImportante(false);
    setShowCreateAvisoModal(true);
  };

  const handleOpenEditAviso = (aviso: MuralAviso) => {
    if (!isUserAvisoAuthor(aviso, currentUser)) {
      showToast('Você só pode editar comunicados criados por você.');
      return;
    }
    setEditingAviso(aviso);
    setAvisoTitulo(aviso.titulo);
    setAvisoConteudo(aviso.conteudo);
    setAvisoCategoria(aviso.categoria || 'Acadêmico');
    setAvisoImportante(aviso.importante);
    setShowCreateAvisoModal(true);
  };

  const handleSaveAviso = (e: React.FormEvent) => {
    e.preventDefault();
    if (!avisoTitulo.trim() || !avisoConteudo.trim()) return;

    if (editingAviso) {
      if (!isUserAvisoAuthor(editingAviso, currentUser)) {
        showToast('Você só pode editar comunicados criados por você.');
        return;
      }
      // Edit existing
      const updatedList = avisos.map((a) =>
        a.id === editingAviso.id
          ? {
              ...a,
              titulo: avisoTitulo.trim(),
              conteudo: avisoConteudo.trim(),
              categoria: avisoCategoria,
              importante: avisoImportante,
            }
          : a
      );
      if (onUpdateAvisos) onUpdateAvisos(updatedList);
      showToast('Aviso do mural atualizado com sucesso!');
    } else {
      // Create new
      const now = new Date();
      const formattedDate = `${now.toLocaleDateString('pt-BR')} às ${now
        .getHours()
        .toString()
        .padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

      const newAviso: MuralAviso = {
        id: `aviso-${Date.now()}`,
        turmaId: linkedTurmaId,
        autorNome: currentUser.name,
        autorRole: 'Professor Titular',
        autorId: currentUser.id,
        titulo: avisoTitulo.trim(),
        conteudo: avisoConteudo.trim(),
        data: formattedDate,
        categoria: avisoCategoria,
        importante: avisoImportante,
      };

      if (onUpdateAvisos) {
        onUpdateAvisos([newAviso, ...avisos]);
      }
      showToast('Novo comunicado publicado no Mural da Turma com sucesso!');
    }

    setShowCreateAvisoModal(false);
    setEditingAviso(null);
  };

  const handleDeleteAviso = (avisoId: string) => {
    const targetAviso = avisos.find((a) => a.id === avisoId);
    if (targetAviso && !isUserAvisoAuthor(targetAviso, currentUser)) {
      showToast('Você só pode excluir avisos criados por você.');
      return;
    }
    if (!window.confirm('Tem certeza de que deseja remover este aviso do mural?')) return;
    if (onUpdateAvisos) {
      const updated = avisos.filter((a) => a.id !== avisoId);
      onUpdateAvisos(updated);
      showToast('Aviso removido do mural.');
    }
  };

  const handleTogglePinAviso = (avisoId: string) => {
    const targetAviso = avisos.find((a) => a.id === avisoId);
    if (targetAviso && !isUserAvisoAuthor(targetAviso, currentUser)) {
      showToast('Você só pode alterar comunicados criados por você.');
      return;
    }
    if (!onUpdateAvisos) return;
    const updated = avisos.map((a) =>
      a.id === avisoId ? { ...a, importante: !a.importante } : a
    );
    onUpdateAvisos(updated);
    showToast('Status de destaque do aviso atualizado.');
  };

  // =========================================================================
  // TAB 3: MATERIAIS DIDÁTICOS COMPLEMENTARES
  // =========================================================================
  const [showMaterialForm, setShowMaterialForm] = useState(false);
  const [matTitle, setMatTitle] = useState('');
  const [matType, setMatType] = useState<'pdf' | 'link' | 'text'>('pdf');
  const [matUrl, setMatUrl] = useState('');
  const [matModule, setMatModule] = useState(1);

  const handleCreateMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!matTitle.trim()) return;

    const newMat: ComplementaryMaterial = {
      id: `mat-${Date.now()}`,
      professorName: currentUser.name,
      title: matTitle.trim(),
      type: matType,
      date: new Date().toLocaleDateString('pt-BR'),
      url: matUrl.trim() || undefined,
      moduloNumber: matModule,
    };

    onAddComplementaryMaterial(newMat);
    setMatTitle('');
    setMatUrl('');
    setShowMaterialForm(false);
    showToast('Material complementar adicionado com sucesso!');
  };

  // =========================================================================
  // TAB 4: CONTROLE DE FREQUÊNCIA
  // =========================================================================
  const handleToggleAttendance = (alunoId: string) => {
    const updated = students.map((st) => {
      if (st.alunoId === alunoId) {
        const novaPresenca = st.presencas >= st.aulasTotais ? st.presencas - 1 : st.presencas + 1;
        const frequenciaPercent = Math.round((novaPresenca / st.aulasTotais) * 100);
        return {
          ...st,
          presencas: novaPresenca,
          frequenciaPercent,
        };
      }
      return st;
    });
    onUpdateStudents(updated);
  };

  // =========================================================================
  // TAB 5: FEEDBACK INDIVIDUAL
  // =========================================================================
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    students[0]?.alunoId || ''
  );
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackSuccess, setFeedbackSuccess] = useState('');

  // If portalSection is 'turmas' (default), render Painel do Professor with TurmasManagementView
  if (portalSection === 'turmas') {
    return (
      <div className="max-w-[1440px] mx-auto px-2 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-6">
        {/* Toggle to Banca Examinadora if there are submissions */}
        {allSubmissions.length > 0 && (
          <div className="flex items-center justify-between gap-3 bg-white border border-[#c2c9b9]/80 rounded-2xl p-2.5 sm:px-4 shadow-none">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-[#123d00]" />
              <span className="text-xs font-bold text-[#082500]">Painel do Professor</span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setPortalSection('turmas')}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#123d00] text-white shadow-2xs cursor-pointer"
              >
                Minhas Turmas
              </button>
              <button
                type="button"
                onClick={() => setPortalSection('banca')}
                className="px-3 py-1.5 rounded-xl text-xs font-bold text-[#52594d] hover:bg-[#f4f6f0] transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <span>Banca Examinadora</span>
                {allSubmissions.filter((s) => s.status !== 'Avaliado').length > 0 && (
                  <span className="bg-[#b91c1c] text-white text-[10px] font-black px-1.5 py-0.2 rounded-full">
                    {allSubmissions.filter((s) => s.status !== 'Avaliado').length}
                  </span>
                )}
              </button>
            </div>
          </div>
        )}

        <TurmasManagementView
          turmas={turmas}
          users={users}
          students={students}
          modules={modules}
          disciplinas={disciplinas}
          avisos={avisos}
          currentUser={currentUser}
          isProfessorView={true}
          onUpdateTurmas={onUpdateTurmas}
          onUpdateUsers={onUpdateUsers}
          onUpdateStudents={onUpdateStudents}
          onUpdateAvisos={onUpdateAvisos}
          onUpdateDisciplinas={onUpdateDisciplinas}
          onOpenReportModal={onOpenReportModal}
        />
      </div>
    );
  }

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-[#123d00] text-white text-xs font-bold px-4 py-3 rounded-2xl flex items-center gap-2 shadow-xl animate-in slide-in-from-top-3">
          <CheckCircle2 className="w-4 h-4 text-[#a2d486] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Banner: Professor Titular Identity & Exclusive Turma Linkage */}
      <div className="bg-white border border-[#c2c9b9]/80 rounded-3xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#123d00] text-white flex items-center justify-center font-bold text-xl border-2 border-[#b9b474] shadow-xs">
            {currentUser.initials || 'CP'}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-[#123d00]/10 text-[#123d00] border border-[#123d00]/20">
                PROFESSOR TITULAR
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#646029]/10 text-[#646029]">
                Banca Examinadora Oficial
              </span>
              <span className="text-xs text-[#73796c] font-semibold">
                Rota: {currentUser.routeSlug || '/ProfCarlos'}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold font-display text-[#082500] mt-1">
              {currentUser.name}
            </h1>
            <p className="text-xs text-[#646029] font-medium">
              Cadeira Docente: {currentUser.disciplina || 'Hermenêutica e Metodologia Teológica'}
            </p>
          </div>
        </div>

        {/* Vínculo Exclusivo com a Turma */}
        <div className="flex items-center gap-3">
          <div className="bg-[#f4f6f0] border border-[#e1e3dd] px-4 py-2.5 rounded-2xl text-right">
            <span className="text-[10px] text-[#646029] block uppercase font-extrabold tracking-wider flex items-center justify-end gap-1">
              <Users className="w-3 h-3 text-[#123d00]" />
              Vínculo Docente Exclusivo
            </span>
            <span className="text-xs font-bold text-[#082500] block mt-0.5">
              {linkedTurma.name}
            </span>
            <span className="text-[10px] text-[#73796c] block">
              Sem vínculo direto com Campos ou administração
            </span>
          </div>
        </div>
      </div>

      {/* Clarification Callout regarding System Governance */}
      <div className="bg-[#f8faf4] border border-[#c2c9b9]/70 rounded-2xl p-4 text-xs text-[#52594d] flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-[#123d00] shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <strong className="text-[#082500] block font-bold">
            Estrutura Canônica: Atuação Exclusiva como Professor Titular
          </strong>
          <p className="leading-relaxed">
            As bancas examinadoras dos ensaios e artigos científicos finais são conduzidas pelo <strong>Professor Titular</strong>. 
            As atividades de apoio ao acompanhamento de turmas, correções de exercícios intermediários e avaliação de provas dissertativas do Processo Seletivo são de responsabilidade da <strong>Coordenação Teológica</strong>. O Professor Titular vincula-se com exclusividade às turmas acadêmicas.
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-[#e1e3dd] pb-3 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('banca')}
          className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer shadow-none ${
            activeTab === 'banca'
              ? 'bg-[#123d00] text-white shadow-none'
              : 'bg-white hover:bg-[#f4f6f0] text-[#42493d] border border-[#e1e3dd] shadow-none'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Banca Examinadora (Ensaios e Artigos)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('mural')}
          className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer shadow-none ${
            activeTab === 'mural'
              ? 'bg-[#123d00] text-white shadow-none'
              : 'bg-white hover:bg-[#f4f6f0] text-[#42493d] border border-[#e1e3dd] shadow-none'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>Mural de Avisos da Turma</span>
          {turmaAvisos.length > 0 && (
            <span className="px-1.5 py-0.2 bg-[#646029] text-white rounded-full text-[10px]">
              {turmaAvisos.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('notas')}
          className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer shadow-none ${
            activeTab === 'notas'
              ? 'bg-[#123d00] text-white shadow-none'
              : 'bg-white hover:bg-[#f4f6f0] text-[#42493d] border border-[#e1e3dd] shadow-none'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Lançamento de Notas (Turma)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('materiais')}
          className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer shadow-none ${
            activeTab === 'materiais'
              ? 'bg-[#123d00] text-white shadow-none'
              : 'bg-white hover:bg-[#f4f6f0] text-[#42493d] border border-[#e1e3dd] shadow-none'
          }`}
        >
          <UploadCloud className="w-4 h-4" />
          <span>Materiais Didáticos Complementares</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('frequencia')}
          className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer shadow-none ${
            activeTab === 'frequencia'
              ? 'bg-[#123d00] text-white shadow-none'
              : 'bg-white hover:bg-[#f4f6f0] text-[#42493d] border border-[#e1e3dd] shadow-none'
          }`}
        >
          <Percent className="w-4 h-4" />
          <span>Controle de Frequência</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('feedback')}
          className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer shadow-none ${
            activeTab === 'feedback'
              ? 'bg-[#123d00] text-white shadow-none'
              : 'bg-white hover:bg-[#f4f6f0] text-[#42493d] border border-[#e1e3dd] shadow-none'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Orientação e Feedback Individual</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: BANCA EXAMINADORA (ENSAIOS E ARTIGOS FINAIS)                       */}
      {/* ========================================================================= */}
      {activeTab === 'banca' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#e1e3dd]">
            <div>
              <h2 className="text-lg font-bold font-display text-[#082500] flex items-center gap-2">
                <Award className="w-5 h-5 text-[#123d00]" />
                Banca Examinadora dos Ensaios e Artigos Finais
              </h2>
              <p className="text-xs text-[#52594d]">
                Avaliação de ensaios temáticos e artigos científicos finais submetidos pelos alunos da turma.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs bg-[#f4f6f0] text-[#123d00] font-bold px-3 py-1.5 rounded-xl border border-[#e1e3dd]">
                {allSubmissions.length} Trabalhos Submetidos
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* List of Submissions */}
            <div className="lg:col-span-5 bg-white border border-[#c2c9b9]/80 rounded-3xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-bold text-sm text-[#082500]">
                  Trabalhos para Avaliação da Banca
                </h3>
                <span className="text-[11px] text-[#646029] font-bold">
                  {filteredSubmissions.length} itens
                </span>
              </div>

              {/* Filters */}
              <div className="space-y-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-[#73796c] absolute left-3 top-3" />
                  <input
                    type="text"
                    value={bancaSearch}
                    onChange={(e) => setBancaSearch(e.target.value)}
                    placeholder="Buscar por trabalho, aluno, Campo..."
                    className="w-full pl-8 pr-3 py-2 bg-[#f8faf4] border border-[#c2c9b9] rounded-xl text-xs focus:outline-hidden focus:border-[#123d00]"
                  />
                </div>

                <div className="flex gap-1.5 text-xs">
                  {(['ALL', 'Pendente', 'Avaliado'] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setBancaStatusFilter(st)}
                      className={`px-3 py-1 rounded-lg font-bold text-[11px] transition-colors cursor-pointer ${
                        bancaStatusFilter === st
                          ? 'bg-[#123d00] text-white'
                          : 'bg-[#f4f6f0] text-[#42493d] hover:bg-[#e1e3dd]'
                      }`}
                    >
                      {st === 'ALL' ? 'Todos' : st === 'Pendente' ? 'Aguardando' : 'Avaliados'}
                    </button>
                  ))}
                </div>
              </div>

              {/* List */}
              <div className="space-y-2 max-h-[620px] overflow-y-auto pr-1">
                {filteredSubmissions.length === 0 ? (
                  <div className="text-center py-8 text-xs text-[#73796c]">
                    Nenhum trabalho localizado com os filtros atuais.
                  </div>
                ) : (
                  filteredSubmissions.map((sub) => {
                    const isSelected = selectedSub?.id === sub.id;
                    const isDone = sub.status === 'Avaliado';

                    return (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => handleSelectSubmission(sub)}
                        className={`w-full text-left p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                          isSelected
                            ? 'bg-[#123d00] text-white border-[#123d00] shadow-xs'
                            : 'bg-white hover:bg-[#f8faf4] border-[#e1e3dd] text-[#191c19]'
                        }`}
                      >
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`text-[10px] font-bold uppercase tracking-wider ${
                                isSelected ? 'text-[#a2d486]' : 'text-[#646029]'
                              }`}
                            >
                              Módulo {sub.moduloNumber}
                            </span>
                            <span
                              className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                                isDone
                                  ? 'bg-[#15803d]/20 text-[#15803d]'
                                  : 'bg-[#b45309]/20 text-[#b45309]'
                              }`}
                            >
                              {isDone ? `Nota: ${sub.nota?.toFixed(1)}` : 'Em Análise'}
                            </span>
                          </div>

                          <h4
                            className={`text-xs font-bold line-clamp-1 ${
                              isSelected ? 'text-white' : 'text-[#082500]'
                            }`}
                          >
                            {sub.tituloTrabalho}
                          </h4>

                          <p
                            className={`text-[11px] truncate ${
                              isSelected ? 'text-white/80' : 'text-[#73796c]'
                            }`}
                          >
                            {sub.student.alunoName} • {sub.student.polo}
                          </p>
                        </div>
                        <ChevronRight
                          className={`w-4 h-4 shrink-0 ${
                            isSelected ? 'text-[#a2d486]' : 'text-[#c2c9b9]'
                          }`}
                        />
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Evaluation Workspace Column */}
            <div className="lg:col-span-7 space-y-6">
              {selectedSub ? (
                <div className="bg-white border border-[#c2c9b9]/80 rounded-3xl p-6 shadow-xs space-y-6">
                  {/* Submission Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#e1e3dd]">
                    <div>
                      <span className="text-[10px] font-bold text-[#646029] tracking-wider uppercase block">
                        Módulo 0{selectedSub.moduloNumber}: {selectedSub.moduloTitle}
                      </span>
                      <h3 className="text-base sm:text-lg font-bold font-display text-[#082500] mt-0.5">
                        {selectedSub.tituloTrabalho}
                      </h3>
                      <p className="text-xs text-[#52594d] mt-1">
                        Aluno: <strong className="text-[#082500]">{selectedSub.student.alunoName}</strong> (Matrícula:{' '}
                        <span className="font-mono text-[#646029]">{selectedSub.student.matricula}</span>) • Campo:{' '}
                        <span className="font-semibold text-[#191c19]">{selectedSub.student.polo}</span>
                      </p>
                    </div>

                    <div className="text-right sm:shrink-0">
                      <span className="text-[10px] uppercase font-bold text-[#73796c] block">
                        Status Atual
                      </span>
                      <span
                        className={`text-xs font-bold px-2.5 py-1 rounded-full inline-block mt-0.5 ${
                          selectedSub.status === 'Avaliado'
                            ? 'bg-[#15803d]/15 text-[#15803d]'
                            : 'bg-[#b45309]/15 text-[#b45309]'
                        }`}
                      >
                        {selectedSub.status}
                      </span>
                      <span className="text-[10px] text-[#73796c] block mt-1">
                        {selectedSub.submetidoEm}
                      </span>
                    </div>
                  </div>

                  {/* Submission Text Preview */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-[#082500] uppercase tracking-wider">
                      Texto do Ensaio / Artigo Submetido:
                    </h4>
                    <div className="bg-[#f8faf4] border border-[#c2c9b9]/60 rounded-2xl p-4 text-xs sm:text-sm text-[#191c19] leading-relaxed max-h-56 overflow-y-auto font-serif space-y-2">
                      <p>
                        {selectedSub.conteudoPreview ||
                          'O presente trabalho investiga os contornos hermenêuticos e os fundamentos da literatura teológica sob a perspectiva da Declaração de Fé da COMIEADEPA, articulando o rigor metodológico à práxis pastoral eclesial nas igrejas locais.'}
                      </p>
                      <p className="text-[11px] text-[#73796c] italic pt-2 border-t border-[#e1e3dd]">
                        Trabalho registrado sob o protocolo canônico da Formação de Escritores QGU.
                      </p>
                    </div>
                  </div>

                  {/* Evaluation Form */}
                  <form onSubmit={handleSaveBancaEvaluation} className="space-y-4 pt-4 border-t border-[#e1e3dd]">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#123d00]" />
                      <h4 className="text-xs font-bold text-[#082500] uppercase tracking-wider">
                        Formulário de Parecer da Banca Examinadora
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-[#191c19] block mb-1">
                          Nota da Banca (0 a 10) *
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="10"
                          required
                          value={evalNota}
                          onChange={(e) => setEvalNota(parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 bg-[#f8faf4] border border-[#c2c9b9] rounded-xl text-xs font-bold text-[#123d00] text-base focus:outline-hidden focus:border-[#123d00]"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-[#191c19] block mb-1">
                          Parecer Deliberativo da Banca *
                        </label>
                        <select
                          value={evalVerdict}
                          onChange={(e) => setEvalVerdict(e.target.value)}
                          className="w-full px-3 py-2.5 bg-[#f8faf4] border border-[#c2c9b9] rounded-xl text-xs font-bold text-[#191c19] focus:outline-hidden focus:border-[#123d00]"
                        >
                          <option value="Aprovado com Louvor e Distinção">Aprovado com Louvor e Distinção</option>
                          <option value="Aprovado">Aprovado</option>
                          <option value="Ajustes Teológicos Recomendados">Ajustes Teológicos Recomendados</option>
                          <option value="Reformulação da Dissertação">Reformulação da Dissertação</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-[#191c19] block mb-1">
                        Parecer Teológico e Considerações da Banca *
                      </label>
                      <textarea
                        rows={4}
                        required
                        value={evalFeedback}
                        onChange={(e) => setEvalFeedback(e.target.value)}
                        placeholder="Emita a avaliação crítica da banca: coerência bíblica, fidelidade à Declaração de Fé da convenção, clareza literária e fontes bibliográficas consultadas..."
                        className="w-full p-3 bg-[#f8faf4] border border-[#c2c9b9] rounded-xl text-xs text-[#191c19] focus:outline-hidden focus:border-[#123d00]"
                      />
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <span className="text-[11px] text-[#73796c]">
                        Avaliador Titular: <strong>{currentUser.name}</strong>
                      </span>

                      <button
                        type="submit"
                        className="px-5 py-2.5 rounded-xl bg-[#123d00] hover:bg-[#082500] text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
                      >
                        <Save className="w-4 h-4 text-[#a2d486]" />
                        <span>Homologar Parecer da Banca</span>
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="bg-white border border-[#c2c9b9]/80 rounded-3xl p-12 text-center text-[#73796c]">
                  Selecione um trabalho acadêmico ao lado para emitir o parecer da banca examinadora.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: MURAL DE AVISOS DA TURMA (FERRAMENTA DO PROFESSOR TITULAR)          */}
      {/* ========================================================================= */}
      {activeTab === 'mural' && (
        <div className="bg-white border border-[#c2c9b9]/80 rounded-3xl p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#e1e3dd]">
            <div>
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-[#123d00]" />
                <h2 className="text-lg font-bold font-display text-[#082500]">
                  Mural de Avisos da Turma Vinculada
                </h2>
              </div>
            </div>

            <button
              type="button"
              onClick={handleOpenCreateAviso}
              className="px-4 py-2.5 rounded-xl bg-[#123d00] hover:bg-[#082500] text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4 text-[#a2d486]" />
              <span>Novo Comunicado</span>
            </button>
          </div>

          {/* Avisos List */}
          <div className="space-y-3">
            {turmaAvisos.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-[#c2c9b9] rounded-2xl p-6 text-xs text-[#73796c] space-y-2">
                <Bell className="w-8 h-8 text-[#c2c9b9] mx-auto" />
                <p className="font-semibold text-[#191c19]">Nenhum comunicado publicado ainda no mural desta turma.</p>
                <p>Clique no botão acima para criar o primeiro aviso oficial aos alunos.</p>
              </div>
            ) : (
              turmaAvisos.map((aviso) => (
                <div
                  key={aviso.id}
                  className={`p-5 rounded-2xl border transition-all ${
                    aviso.importante
                      ? 'bg-[#f4f6f0] border-[#123d00]/40 shadow-xs'
                      : 'bg-white border-[#e1e3dd]'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      {aviso.importante && (
                        <span className="px-2.5 py-0.5 rounded-md bg-[#123d00] text-white text-[10px] font-extrabold uppercase flex items-center gap-1">
                          <Pin className="w-3 h-3 text-[#a2d486]" />
                          Destaque
                        </span>
                      )}
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-[#646029]/15 text-[#646029]">
                        {aviso.categoria || 'Acadêmico'}
                      </span>
                      <span className="text-[11px] font-bold text-[#123d00]">
                        {aviso.autorRole}: {aviso.autorNome}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-[#73796c] font-medium">{aviso.data}</span>
                      
                      {/* Action buttons: apenas para avisos criados pelo professor */}
                      {isUserAvisoAuthor(aviso, currentUser) && (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleTogglePinAviso(aviso.id)}
                            title={aviso.importante ? 'Remover destaque' : 'Destacar no topo'}
                            className={`p-1.5 rounded-lg border text-xs cursor-pointer ${
                              aviso.importante
                                ? 'bg-[#123d00] text-white border-[#123d00]'
                                : 'bg-white text-[#73796c] border-[#e1e3dd] hover:bg-[#f4f6f0]'
                            }`}
                          >
                            <Pin className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenEditAviso(aviso)}
                            title="Editar comunicado"
                            className="p-1.5 rounded-lg border border-[#e1e3dd] bg-white text-[#73796c] hover:text-[#123d00] hover:bg-[#f4f6f0] cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteAviso(aviso.id)}
                            title="Excluir comunicado"
                            className="p-1.5 rounded-lg border border-[#e1e3dd] bg-white text-[#b91c1c] hover:bg-[#b91c1c]/10 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <h3 className="font-bold text-sm sm:text-base text-[#082500] mt-2.5">
                    {aviso.titulo}
                  </h3>

                  <p className="text-xs sm:text-sm text-[#42493d] mt-1.5 leading-relaxed whitespace-pre-line">
                    {aviso.conteudo}
                  </p>
                </div>
              ))
            )}
          </div>

          {/* Modal for Creating / Editing Aviso */}
          {showCreateAvisoModal && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
              <form
                onSubmit={handleSaveAviso}
                className="bg-white rounded-3xl border border-[#c2c9b9] p-6 max-w-lg w-full space-y-4 shadow-2xl animate-in zoom-in-95"
              >
                <div className="flex items-center justify-between pb-3 border-b border-[#e1e3dd]">
                  <div className="flex items-center gap-2">
                    <Bell className="w-5 h-5 text-[#123d00]" />
                    <h3 className="font-display font-bold text-lg text-[#082500]">
                      {editingAviso ? 'Editar Aviso do Mural' : 'Publicar no Mural da Turma'}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowCreateAvisoModal(false)}
                    className="p-1.5 rounded-full text-[#73796c] hover:bg-[#f4f6f0] cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-[#191c19] block mb-1">
                      Título do Comunicado *
                    </label>
                    <input
                      type="text"
                      required
                      value={avisoTitulo}
                      onChange={(e) => setAvisoTitulo(e.target.value)}
                      placeholder="Ex: Entrega dos Ensaios do Módulo 02 e Encontro Síncrono"
                      className="w-full px-3.5 py-2.5 bg-[#f8faf4] border border-[#c2c9b9] rounded-xl text-xs font-semibold text-[#191c19] focus:outline-hidden focus:border-[#123d00]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-[#191c19] block mb-1">
                        Categoria
                      </label>
                      <select
                        value={avisoCategoria}
                        onChange={(e) => setAvisoCategoria(e.target.value as any)}
                        className="w-full px-3 py-2 bg-[#f8faf4] border border-[#c2c9b9] rounded-xl text-xs font-bold text-[#191c19] focus:outline-hidden focus:border-[#123d00]"
                      >
                        <option value="Acadêmico">Acadêmico</option>
                        <option value="Encontro Síncrono">Encontro Síncrono (Quintas)</option>
                        <option value="Avaliação">Avaliação / Banca</option>
                        <option value="Geral">Geral</option>
                        <option value="Urgente">Urgente</option>
                      </select>
                    </div>

                    <div className="flex items-center pt-5">
                      <label className="flex items-center gap-2 text-xs font-bold text-[#082500] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={avisoImportante}
                          onChange={(e) => setAvisoImportante(e.target.checked)}
                          className="w-4 h-4 rounded text-[#123d00] focus:ring-[#123d00]"
                        />
                        <span>Destacar no Topo (Importante)</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#191c19] block mb-1">
                      Conteúdo da Mensagem *
                    </label>
                    <textarea
                      rows={5}
                      required
                      value={avisoConteudo}
                      onChange={(e) => setAvisoConteudo(e.target.value)}
                      placeholder="Escreva as instruções, lembretes de prazos, links das aulas ao vivo ou orientações da cadeira docente..."
                      className="w-full p-3.5 bg-[#f8faf4] border border-[#c2c9b9] rounded-xl text-xs text-[#191c19] focus:outline-hidden focus:border-[#123d00]"
                    />
                  </div>

                  <div className="p-3 bg-[#fafbf8] border border-[#e1e3dd] rounded-xl text-xs text-[#52594d]">
                    Emitido por: <strong>{currentUser.name}</strong> (Professor Titular) • Visível para todos os vocacionados matriculados na <strong>{linkedTurma.name}</strong>.
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#e1e3dd]">
                  <button
                    type="button"
                    onClick={() => setShowCreateAvisoModal(false)}
                    className="px-4 py-2 rounded-xl border border-[#c2c9b9] text-xs font-bold text-[#73796c] hover:bg-[#f4f6f0] cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-[#123d00] hover:bg-[#082500] text-white text-xs font-bold flex items-center gap-2 shadow-xs cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5 text-[#a2d486]" />
                    <span>{editingAviso ? 'Salvar Alterações' : 'Publicar no Mural'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: LANÇAMENTO DE NOTAS (TURMA)                                        */}
      {/* ========================================================================= */}
      {activeTab === 'notas' && (
        <div className="bg-white border border-[#c2c9b9]/80 rounded-3xl p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-[#e1e3dd]">
            <div>
              <h2 className="text-lg font-bold font-display text-[#082500]">
                Quadro de Desempenho e Avaliações da Turma
              </h2>
              <p className="text-xs text-[#646029]">
                Cadeira: {currentUser.disciplina || 'Metodologia Teológica'} • {linkedTurma.name}
              </p>
            </div>
            <span className="text-xs bg-[#f4f6f0] text-[#123d00] font-bold px-3 py-1.5 rounded-xl border border-[#e1e3dd]">
              {students.length} Alunos Matriculados
            </span>
          </div>

          <div className="space-y-4">
            {students.map((st) => (
              <div
                key={st.alunoId}
                className="border border-[#e1e3dd] rounded-2xl p-5 hover:border-[#123d00]/40 transition-all space-y-4 bg-[#fafbf8]"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-[#646029] uppercase tracking-wider">
                        Matrícula: {st.matricula}
                      </span>
                      <span className="text-xs text-[#73796c] font-medium">• Campo: {st.polo}</span>
                    </div>
                    <h3 className="font-bold text-base text-[#082500]">{st.alunoName}</h3>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-[#73796c] block">
                        Média Geral
                      </span>
                      <span className="text-sm font-bold text-[#123d00]">
                        {st.mediaGeral.toFixed(1)}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-[#73796c] block">
                        Frequência
                      </span>
                      <span className="text-sm font-bold text-[#15803d]">
                        {st.frequenciaPercent}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Submissions by this student */}
                <div className="space-y-2 pt-2 border-t border-[#e1e3dd]/60">
                  <h4 className="text-xs font-bold text-[#42493d] uppercase tracking-wider">
                    Trabalhos Entregues:
                  </h4>
                  {st.submissions.map((sub) => (
                    <div
                      key={sub.id}
                      className="bg-white border border-[#c2c9b9]/60 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#123d00]">
                            Módulo {sub.moduloNumber}:
                          </span>
                          <span className="font-semibold text-[#191c19] truncate">
                            {sub.tituloTrabalho}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#73796c]">
                          Submetido em: {sub.submetidoEm} • Status:{' '}
                          <span
                            className={
                              sub.status === 'Avaliado' ? 'text-[#15803d] font-bold' : 'text-[#b45309] font-bold'
                            }
                          >
                            {sub.status}
                          </span>
                        </p>
                        {sub.feedback && (
                          <p className="text-[11px] text-[#42493d] italic bg-[#f8faf4] p-2 rounded-lg mt-1 border border-[#e1e3dd]">
                            "{sub.feedback}"
                          </p>
                        )}
                      </div>

                      <div className="shrink-0 text-right">
                        <span className="text-[10px] uppercase font-bold text-[#73796c] block">
                          Nota Atribuída
                        </span>
                        <span className="text-sm font-bold text-[#123d00]">
                          {sub.nota !== undefined ? sub.nota.toFixed(1) : '—'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: MATERIAIS DIDÁTICOS COMPLEMENTARES                                 */}
      {/* ========================================================================= */}
      {activeTab === 'materiais' && (
        <div className="bg-white border border-[#c2c9b9]/80 rounded-3xl p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#e1e3dd]">
            <div>
              <h2 className="text-lg font-bold font-display text-[#082500]">
                Materiais Didáticos e Complementares
              </h2>
              <p className="text-xs text-[#646029]">
                Disponibilize PDFs, artigos, fontes primárias e links externos para enriquecer o currículo da turma.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowMaterialForm(!showMaterialForm)}
              className="px-4 py-2 rounded-xl bg-[#123d00] hover:bg-[#082500] text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4 text-[#a2d486]" />
              <span>{showMaterialForm ? 'Fechar Formulário' : 'Novo Material'}</span>
            </button>
          </div>

          {/* Form */}
          {showMaterialForm && (
            <form
              onSubmit={handleCreateMaterial}
              className="bg-[#f8faf4] border border-[#c2c9b9] rounded-2xl p-5 space-y-4 animate-in fade-in"
            >
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#082500]">
                Cadastrar Material Didático Complementar
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-[#191c19] block mb-1">
                    Título do Material *
                  </label>
                  <input
                    type="text"
                    required
                    value={matTitle}
                    onChange={(e) => setMatTitle(e.target.value)}
                    placeholder="Ex: Artigo: O Método Histórico-Gramatical e a Tradição Reformada"
                    className="w-full px-3 py-2 bg-white border border-[#c2c9b9] rounded-xl text-xs focus:outline-hidden focus:border-[#123d00]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#191c19] block mb-1">
                    Módulo Vinculado *
                  </label>
                  <select
                    value={matModule}
                    onChange={(e) => setMatModule(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-[#c2c9b9] rounded-xl text-xs font-semibold focus:outline-hidden focus:border-[#123d00]"
                  >
                    {modules.map((m) => (
                      <option key={m.id} value={m.number}>
                        Módulo 0{m.number}: {m.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-[#191c19] block mb-1">
                    Tipo de Recurso
                  </label>
                  <select
                    value={matType}
                    onChange={(e) => setMatType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-white border border-[#c2c9b9] rounded-xl text-xs font-semibold focus:outline-hidden focus:border-[#123d00]"
                  >
                    <option value="pdf">Documento PDF (Artigo/E-book)</option>
                    <option value="link">Link Externo / Portal</option>
                    <option value="text">Texto / Fichamento Canônico</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-[#191c19] block mb-1">
                    URL ou Referência Bibliográfica
                  </label>
                  <input
                    type="text"
                    value={matUrl}
                    onChange={(e) => setMatUrl(e.target.value)}
                    placeholder="https://exemplo.org/artigo.pdf"
                    className="w-full px-3 py-2 bg-white border border-[#c2c9b9] rounded-xl text-xs focus:outline-hidden focus:border-[#123d00]"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#123d00] hover:bg-[#082500] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  Salvar e Disponibilizar
                </button>
              </div>
            </form>
          )}

          {/* List of Existing Materials by Module */}
          <div className="space-y-4">
            {modules.map((mod) => (
              <div key={mod.id} className="border border-[#e1e3dd] rounded-2xl p-4 bg-[#fafbf8] space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-xs sm:text-sm text-[#082500]">
                    Módulo 0{mod.number}: {mod.title}
                  </h3>
                  <span className="text-[11px] font-bold text-[#646029]">
                    {mod.complementaryMaterials?.length || 0} materiais adicionais
                  </span>
                </div>

                {mod.complementaryMaterials && mod.complementaryMaterials.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {mod.complementaryMaterials.map((mat) => (
                      <div
                        key={mat.id}
                        className="bg-white border border-[#c2c9b9]/60 rounded-xl p-3 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <FileText className="w-4 h-4 text-[#123d00] shrink-0" />
                          <div className="truncate">
                            <span className="font-bold text-[#191c19] block truncate">{mat.title}</span>
                            <span className="text-[10px] text-[#73796c]">
                              {mat.type.toUpperCase()} • Postado em {mat.date} por {mat.professorName}
                            </span>
                          </div>
                        </div>
                        {mat.url && (
                          <a
                            href={mat.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg text-[#123d00] hover:bg-[#f4f6f0] shrink-0"
                            title="Acessar material"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[#73796c] italic">
                    Nenhum material complementar cadastrado para este módulo.
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: CONTROLE DE FREQUÊNCIA                                             */}
      {/* ========================================================================= */}
      {activeTab === 'frequencia' && (
        <div className="bg-white border border-[#c2c9b9]/80 rounded-3xl p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-[#e1e3dd]">
            <div>
              <h2 className="text-lg font-bold font-display text-[#082500]">
                Controle de Frequência nos Encontros Síncronos
              </h2>
              <p className="text-xs text-[#646029]">
                Aulas semanais às quintas-feiras • Mínimo de 75% exigido para certificação.
              </p>
            </div>
            <span className="text-xs bg-[#f4f6f0] text-[#123d00] font-bold px-3 py-1.5 rounded-xl border border-[#e1e3dd]">
              {students.length} Vocacionados
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#e1e3dd] bg-[#f8faf4] text-[#646029] uppercase tracking-wider font-bold">
                  <th className="p-3">Matrícula</th>
                  <th className="p-3">Aluno Vocacionado</th>
                  <th className="p-3">Campo</th>
                  <th className="p-3 text-center">Presenças / Total</th>
                  <th className="p-3 text-center">Percentual</th>
                  <th className="p-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e1e3dd]">
                {students.map((st) => (
                  <tr key={st.alunoId} className="hover:bg-[#fafbf8]">
                    <td className="p-3 font-bold text-[#646029]">{st.matricula}</td>
                    <td className="p-3 font-bold text-[#082500]">{st.alunoName}</td>
                    <td className="p-3 text-[#73796c]">{st.polo}</td>
                    <td className="p-3 text-center font-bold text-[#191c19]">
                      {st.presencas} de {st.aulasTotais}
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={`px-2.5 py-1 rounded-full font-bold text-[11px] ${
                          st.frequenciaPercent >= 75
                            ? 'bg-[#15803d]/10 text-[#15803d]'
                            : 'bg-[#b91c1c]/10 text-[#b91c1c]'
                        }`}
                      >
                        {st.frequenciaPercent}%
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleToggleAttendance(st.alunoId)}
                        className="px-3 py-1.5 rounded-xl bg-[#f4f6f0] hover:bg-[#123d00] text-[#123d00] hover:text-white border border-[#c2c9b9] text-[11px] font-bold transition-all cursor-pointer"
                      >
                        Ajustar Presença (±)
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: ÁREA DE FEEDBACK INDIVIDUAL                                        */}
      {/* ========================================================================= */}
      {activeTab === 'feedback' && (
        <div className="bg-white border border-[#c2c9b9]/80 rounded-3xl p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-[#e1e3dd]">
            <div>
              <h2 className="text-lg font-bold font-display text-[#082500]">
                Orientação Pastoral e Feedback Literário Individual
              </h2>
              <p className="text-xs text-[#646029]">
                Emissão de avaliações formativas sobre o progresso de escrita e maturidade teológica de cada aluno.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#191c19] block">
                Selecione o Aluno:
              </label>
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                {students.map((st) => (
                  <button
                    key={st.alunoId}
                    type="button"
                    onClick={() => {
                      setSelectedStudentId(st.alunoId);
                      setFeedbackText('');
                    }}
                    className={`w-full text-left p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      selectedStudentId === st.alunoId
                        ? 'bg-[#123d00] text-white border-[#123d00]'
                        : 'bg-white hover:bg-[#f8faf4] border-[#e1e3dd] text-[#191c19]'
                    }`}
                  >
                    <div>{st.alunoName}</div>
                    <div
                      className={`text-[10px] font-normal ${
                        selectedStudentId === st.alunoId ? 'text-white/80' : 'text-[#73796c]'
                      }`}
                    >
                      {st.matricula} • Campo: {st.polo}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="md:col-span-2 space-y-4 bg-[#f8faf4] border border-[#c2c9b9]/60 rounded-2xl p-5">
              <h3 className="text-xs font-bold text-[#123d00] uppercase tracking-wider">
                Emitir Parecer Descritivo de Mentoria
              </h3>

              <textarea
                rows={5}
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="Descreva a evolução do vocacionado: clareza na escrita, capacidade de síntese teológica, pontualidade e engajamento eclesial..."
                className="w-full p-3 bg-white border border-[#c2c9b9] rounded-xl text-xs text-[#191c19] focus:outline-hidden focus:border-[#123d00]"
              />

              <div className="flex items-center justify-between">
                {feedbackSuccess ? (
                  <span className="text-xs font-bold text-[#15803d]">
                    {feedbackSuccess}
                  </span>
                ) : (
                  <span className="text-[11px] text-[#73796c]">
                    O parecer ficará visível no boletim acadêmico do aluno.
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => {
                    if (!feedbackText.trim()) return;
                    setFeedbackSuccess('Parecer de mentoria registrado com sucesso!');
                    setTimeout(() => setFeedbackSuccess(''), 3000);
                  }}
                  className="px-5 py-2 rounded-xl bg-[#123d00] hover:bg-[#082500] text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  Salvar Feedback
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
