import React, { useState, useMemo, useEffect } from 'react';
import {
  BookOpen,
  GraduationCap,
  Download,
  UploadCloud,
  CheckCircle2,
  Clock,
  MessageCircle,
  FileText,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Send,
  Lock,
  Unlock,
  Bell,
  Award,
  Calendar,
  Video,
  UserCheck,
  X,
  Search,
  ArrowLeft,
  Users,
} from 'lucide-react';
import {
  SystemUser,
  AcademicModule,
  StudentAcademicRecord,
  MuralAviso,
  StudentSubmission,
  Disciplina,
  Turma,
  TurmaAula,
} from '../types';
import { generateHistoricoPdf, generateCertificadoPdf } from '../utils/studentDocumentsPdf';

interface StudentPortalViewProps {
  currentUser: SystemUser;
  studentRecord?: StudentAcademicRecord;
  students?: StudentAcademicRecord[];
  onUpdateStudentRecord?: (updatedRecord: StudentAcademicRecord) => void;
  modules: AcademicModule[];
  avisos: MuralAviso[];
  disciplinas?: Disciplina[];
  turmas?: Turma[];
  onSubmitWork: (alunoId: string, submission: StudentSubmission) => void;
}

export const StudentPortalView: React.FC<StudentPortalViewProps> = ({
  currentUser,
  studentRecord: propStudentRecord,
  students = [],
  onUpdateStudentRecord,
  modules,
  avisos,
  disciplinas = [],
  turmas = [],
  onSubmitWork,
}) => {
  // Estado para seleção de aluno da tabela de matriculados quando o usuário for da coordenação/docência
  const [selectedStudentId, setSelectedStudentId] = useState<string>(() => {
    return propStudentRecord?.alunoId || (students && students[0]?.alunoId) || '';
  });

  useEffect(() => {
    if (propStudentRecord?.alunoId && propStudentRecord.alunoId !== selectedStudentId) {
      setSelectedStudentId(propStudentRecord.alunoId);
    }
  }, [propStudentRecord?.alunoId]);

  // 1. Dados extraídos EXCLUSIVAMENTE da tabela de alunos matriculados
  const studentRecord = useMemo<StudentAcademicRecord>(() => {
    if (students && students.length > 0) {
      if (selectedStudentId) {
        const found = students.find((s) => s.alunoId === selectedStudentId);
        if (found) return found;
      }
      if (currentUser?.role === 'aluno') {
        const found = students.find(
          (s) =>
            s.alunoId === currentUser.id ||
            (s.matricula && currentUser.matricula && s.matricula.trim().toLowerCase() === currentUser.matricula.trim().toLowerCase()) ||
            (s.alunoName && currentUser.name && s.alunoName.trim().toLowerCase() === currentUser.name.trim().toLowerCase())
        );
        if (found) return found;
      }
      if (propStudentRecord && propStudentRecord.alunoId) {
        const found = students.find((s) => s.alunoId === propStudentRecord.alunoId);
        if (found) return found;
      }
      return students[0];
    }
    return (
      propStudentRecord || {
        alunoId: currentUser.id || 'user-aluno-1',
        matricula: currentUser.matricula || '2026-QGU-1024',
        turmaId: currentUser.turmaId || 'turma-2026',
        alunoName: currentUser.name || 'Marcos Paulo de Oliveira',
        polo: currentUser.polo || 'Campo Belém Central',
        frequenciaPercent: 0,
        presencas: 0,
        aulasTotais: 0,
        submissions: [],
        notas: [],
        mediaGeral: 0,
        statusAcademico: 'Cursando',
      }
    );
  }, [students, selectedStudentId, currentUser, propStudentRecord]);

  const isFormado = studentRecord.statusAcademico === 'Formado';

  // Matrícula obtida DIRETAMENTE da tabela de alunos matriculados
  const displayMatricula = studentRecord.matricula || 'Sem matrícula';

  // Campo/Supervisão obtido DIRETAMENTE da tabela de alunos matriculados
  const displayCampo = studentRecord.polo || 'Campo Central';

  // Nome do Aluno obtido DIRETAMENTE da tabela de alunos matriculados
  const displayAlunoName = studentRecord.alunoName || currentUser.name || 'Aluno Vocacionado';

  // 2. Identify the Student's Turma
  const currentTurma = useMemo(() => {
    return (
      turmas.find((t) => t.id === studentRecord.turmaId) ||
      turmas.find((t) => t.id === currentUser.turmaId) ||
      turmas[0] || {
        id: 'turma-2026',
        name: 'Turma 2026',
        urlSlug: 'turma2026',
        status: 'Em Andamento',
        disciplinasIds: ['disc-1', 'disc-2', 'disc-3', 'disc-4', 'disc-5'],
        disciplinasLiberadasIds: ['disc-1', 'disc-2'],
      }
    );
  }, [turmas, studentRecord.turmaId, currentUser.turmaId]);

  // 3. Disciplinas Liberadas vs Bloqueadas (definidas pela Turma real)
  const liberadasIds = useMemo(() => {
    if (currentTurma?.disciplinasLiberadasIds && currentTurma.disciplinasLiberadasIds.length > 0) {
      return currentTurma.disciplinasLiberadasIds;
    }
    if (currentTurma?.disciplinasIds && currentTurma.disciplinasIds.length > 0) {
      return currentTurma.disciplinasIds.slice(0, 2);
    }
    return [];
  }, [currentTurma]);

  // 4. Avisos reais da Turma
  const turmaAvisos = useMemo(() => {
    return avisos.filter(
      (a) => !a.turmaId || a.turmaId === currentTurma.id || a.turmaId === 'ALL'
    );
  }, [avisos, currentTurma.id]);

  // Aviso mais recente real (sem criar avisos fictícios)
  const avisoMaisRecente = turmaAvisos.length > 0 ? turmaAvisos[0] : null;

  // State for selected active disciplina (drill-down into detailed view)
  const [selectedDisciplinaId, setSelectedDisciplinaId] = useState<string | null>(null);

  // Subtab within the selected disciplina
  const [disciplinaSubTab, setDisciplinaSubTab] = useState<'documentos' | 'aulas' | 'frequencia' | 'trabalhos'>('documentos');

  // Modal for all Avisos
  const [isAvisosModalOpen, setIsAvisosModalOpen] = useState(false);
  const [avisoSearch, setAvisoSearch] = useState('');

  // Submission Form State
  const [subDisciplinaId, setSubDisciplinaId] = useState<string>('');
  const [subModuleNumber, setSubModuleNumber] = useState<number>(1);
  const [subTitle, setSubTitle] = useState('');
  const [subText, setSubText] = useState('');
  const [subFile, setSubFile] = useState<File | null>(null);
  const [submitFeedback, setSubmitFeedback] = useState('');
  const [downloadFeedback, setDownloadFeedback] = useState('');
  const [lockFeedback, setLockFeedback] = useState('');

  // 5. Cálculo Real de Progresso do Curso
  // Baseado nas disciplinas que o aluno realmente concluiu (com nota lançada ou formado)
  const totalDisciplinasCount = disciplinas.length;
  const liberadasCount = disciplinas.filter((d) => liberadasIds.includes(d.id)).length;
  const completedDisciplinasCount = studentRecord.notas?.length || 0;

  const courseProgress = useMemo(() => {
    if (isFormado) return 100;
    if (totalDisciplinasCount === 0) return 0;
    return Math.min(100, Math.round((completedDisciplinasCount / totalDisciplinasCount) * 100));
  }, [isFormado, completedDisciplinasCount, totalDisciplinasCount]);

  // Selected Disciplina Object
  const selectedDisciplina = useMemo(() => {
    if (!selectedDisciplinaId) return null;
    return disciplinas.find((d) => d.id === selectedDisciplinaId) || null;
  }, [disciplinas, selectedDisciplinaId]);

  // Handle PDF Download of Materials
  const handleDownloadMaterial = (title: string, fileUrl?: string) => {
    setDownloadFeedback(`Download iniciado: ${title}`);
    setTimeout(() => setDownloadFeedback(''), 3500);

    if (fileUrl) {
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = title;
      link.target = '_blank';
      link.click();
      return;
    }

    const blob = new Blob(
      [
        `COMIEADEPA — PLATAFORMA ESCRITORES QGU\n` +
          `DOCUMENTO ACADÊMICO OFICIAL\n` +
          `--------------------------------------------------\n` +
          `Arquivo: ${title}\n` +
          `Aluno: ${displayAlunoName}\n` +
          `Matrícula: ${displayMatricula}\n` +
          `Turma: ${currentTurma.name}\n` +
          `Polo: ${displayCampo}\n` +
          `Emissão Digital: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}\n` +
          `--------------------------------------------------\n`,
      ],
      { type: 'text/plain;charset=utf-8' }
    );
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = title.replace(/\.pdf$/, '') + '.txt';
    link.click();
    URL.revokeObjectURL(url);
  };

  // Handle Submission Form Submit
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subTitle.trim()) return;

    const disc = disciplinas.find((d) => d.id === subDisciplinaId) || selectedDisciplina || disciplinas[0];
    const newSub: StudentSubmission = {
      id: `sub-${Date.now()}`,
      moduloNumber: subModuleNumber,
      moduloTitle: `${disc?.codigo || 'DISC'}: ${disc?.nome || 'Disciplina'} • Módulo ${subModuleNumber}`,
      tituloTrabalho: subTitle.trim(),
      submetidoEm: `${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
      status: 'Pendente',
      conteudoPreview: subText.trim() || `Arquivo anexado: ${subFile?.name || 'Documento'}.`,
    };

    onSubmitWork(studentRecord.alunoId, newSub);
    setSubTitle('');
    setSubText('');
    setSubFile(null);
    setSubmitFeedback('Trabalho acadêmico enviado com sucesso para a banca docente!');
    setTimeout(() => setSubmitFeedback(''), 4500);
  };

  // WhatsApp Support
  const whatsappNumber = '5591982577589';
  const whatsappMessage = encodeURIComponent(
    `A Paz do Senhor! Sou o aluno ${displayAlunoName}, matrícula ${displayMatricula} da ${currentTurma.name}. Gostaria de tirar uma dúvida sobre a plataforma do aluno.`
  );
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;

  // Filtered Avisos for Modal
  const filteredModalAvisos = useMemo(() => {
    if (!avisoSearch.trim()) return turmaAvisos;
    const term = avisoSearch.toLowerCase();
    return turmaAvisos.filter(
      (a) =>
        a.titulo.toLowerCase().includes(term) ||
        a.conteudo.toLowerCase().includes(term) ||
        a.autorNome.toLowerCase().includes(term)
    );
  }, [turmaAvisos, avisoSearch]);

  // Obter apenas as aulas REAIS cadastradas para a turma e disciplina (sem aulas fictícias)
  const getDisciplinaAulas = (disc: Disciplina): TurmaAula[] => {
    if (!currentTurma?.aulas || currentTurma.aulas.length === 0) {
      return [];
    }
    return currentTurma.aulas.filter(
      (a) =>
        a.moduloId === disc.id ||
        a.moduloTitulo?.toLowerCase().includes(disc.nome.toLowerCase()) ||
        disc.modulos?.some((m) => m.id === a.moduloId || a.moduloTitulo?.includes(m.title))
    );
  };

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Seletor do Aluno da Tabela de Matriculados (acesso Coordenação/Docente para alternar entre qualquer aluno da tabela) */}
      {currentUser.role !== 'aluno' && students && students.length > 0 && (
        <div className="bg-white border border-[#c2c9b9] rounded-2xl p-3.5 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-none">
          <div className="flex items-center gap-2 text-[#082500]">
            <Users className="w-4 h-4 text-[#123d00]" />
            <span className="font-bold">Aluno selecionado na tabela de matriculados:</span>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={studentRecord.alunoId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="w-full sm:w-auto bg-[#f8faf4] border border-[#c2c9b9] rounded-xl px-3 py-2 font-semibold text-[#082500] text-xs focus:outline-hidden focus:border-[#123d00] cursor-pointer"
            >
              {students.map((st) => (
                <option key={st.alunoId} value={st.alunoId}>
                  {st.alunoName} • Matrícula: {st.matricula} • {st.polo || 'Campo Central'} [{st.statusAcademico}]
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. BANNER PRINCIPAL (COR VERDE)                                          */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-br from-[#0a2300] via-[#123d00] to-[#0f3400] text-white rounded-3xl p-6 sm:p-8 shadow-md border border-[#2b5917] relative overflow-hidden">
        {/* Subtle decorative background watermarks */}
        <div className="absolute -right-12 -bottom-12 w-80 h-80 rounded-full bg-white/5 blur-2xl pointer-events-none" />
        <div className="absolute left-1/3 -top-20 w-64 h-64 rounded-full bg-[#a2d486]/10 blur-3xl pointer-events-none" />

        {/* Top Split: 40% Boas-Vindas / 60% Mural de Avisos */}
        <div className="relative z-10 flex flex-col lg:flex-row items-stretch gap-6 lg:gap-8">
          {/* 1.1. Área de Boas-vindas — 40% */}
          <div className="w-full lg:w-[40%] flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-white/15 pb-6 lg:pb-0 lg:pr-8">
            <div className="space-y-3">
              {/* Nome da Turma no Topo Esquerdo */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 backdrop-blur-xs">
                <GraduationCap className="w-3.5 h-3.5 text-[#b9b474]" />
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#e6f4d0] truncate">
                  {currentTurma?.name || 'Turma 2026'}
                </span>
              </div>

              {/* Saudação com Destaque Tipográfico */}
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold font-display tracking-tight text-white leading-tight">
                  Olá, {displayAlunoName}
                </h1>
                <p className="text-xs text-white/80 mt-1 font-medium flex flex-wrap items-center gap-2">
                  <span>Matrícula: <strong className="text-white font-mono">{displayMatricula}</strong></span>
                  <span>•</span>
                  <span>{displayCampo}</span>
                </p>
              </div>
            </div>

            {/* Academic Status Badge & WhatsApp Support */}
            <div className="pt-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold text-white/70">Situação:</span>
                <span
                  className={`px-3 py-0.5 rounded-full text-xs font-extrabold inline-flex items-center gap-1.5 shadow-2xs ${
                    isFormado
                      ? 'bg-[#b9b474] text-[#123d00]'
                      : 'bg-white/15 text-white border border-white/20'
                  }`}
                >
                  {isFormado ? <Award className="w-3 h-3" /> : <Clock className="w-3 h-3 text-[#a2d486]" />}
                  <span>{studentRecord.statusAcademico}</span>
                </span>
              </div>

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white text-[11px] font-bold shadow-xs transition-colors"
                title="Suporte direto com a Coordenação Teológica"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Suporte</span>
              </a>
            </div>
          </div>

          {/* 1.2. Mural de Avisos — 60% */}
          {/* SEM TÍTULO, conforme regra estrita da especificação */}
          <div className="w-full lg:w-[60%] flex flex-col justify-between">
            {avisoMaisRecente ? (
              <div className="bg-white/10 hover:bg-white/12 transition-colors border border-white/20 rounded-2xl p-4 sm:p-5 backdrop-blur-xs flex flex-col justify-between gap-3 h-full">
                {/* Header do card de aviso mais recente */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#a2d486] animate-pulse" />
                    <span className="text-[11px] font-extrabold uppercase tracking-wide text-[#b9b474]">
                      {avisoMaisRecente.autorRole || 'Coordenação'}: {avisoMaisRecente.autorNome}
                    </span>
                    {avisoMaisRecente.importante && (
                      <span className="px-2 py-0.5 rounded-md bg-[#b91c1c] text-white text-[9px] font-black uppercase tracking-wider">
                        Importante
                      </span>
                    )}
                  </div>

                  <span className="text-[11px] text-white/70 font-medium">
                    {avisoMaisRecente.data}
                  </span>
                </div>

                {/* Título e Conteúdo do Aviso Mais Recente */}
                <div className="space-y-1">
                  <h2 className="text-base sm:text-lg font-bold text-white line-clamp-1 font-display">
                    {avisoMaisRecente.titulo}
                  </h2>
                  <p className="text-xs text-white/85 line-clamp-2 leading-relaxed font-sans">
                    {avisoMaisRecente.conteudo}
                  </p>
                </div>

                {/* Botão Ver Todos */}
                <div className="flex items-center justify-between pt-2 border-t border-white/10 mt-auto">
                  <span className="text-[11px] text-white/60">
                    {turmaAvisos.length} comunicado(s) para sua turma
                  </span>

                  <button
                    type="button"
                    onClick={() => setIsAvisosModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white text-[#123d00] hover:bg-[#f4f6f0] text-xs font-extrabold transition-all shadow-xs cursor-pointer"
                  >
                    <Bell className="w-3.5 h-3.5 text-[#123d00]" />
                    <span>Ver todos</span>
                    <ChevronRight className="w-3.5 h-3.5 text-[#123d00]" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white/5 border border-white/15 rounded-2xl p-6 backdrop-blur-xs flex flex-col justify-center items-center text-center gap-2 h-full min-h-[140px]">
                <Bell className="w-6 h-6 text-white/40" />
                <p className="text-xs text-white/70">
                  Nenhum comunicado publicado para esta turma até o momento.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 1.3. Botões de Documentos (Baixar Histórico / Baixar Certificado) */}
        {/* Permanecem ocultos enquanto o aluno NÃO estiver "Formado". */}
        {isFormado && (
          <div className="relative z-10 mt-6 pt-5 border-t border-white/20 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/5 -mx-6 -mb-6 sm:-mx-8 sm:-mb-8 p-4 sm:px-8 rounded-b-3xl">
            <div className="flex items-center gap-2.5 text-center sm:text-left">
              <div className="w-9 h-9 rounded-xl bg-[#b9b474] text-[#123d00] flex items-center justify-center shrink-0 font-bold shadow-xs">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Parabéns pela Conclusão do Curso!
                </h4>
                <p className="text-[11px] text-white/80">
                  Seus documentos acadêmicos e eclesiásticos oficiais já estão homologados para emissão.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={() =>
                  generateHistoricoPdf(
                    studentRecord,
                    { ...currentUser, name: displayAlunoName },
                    currentTurma,
                    disciplinas
                  )
                }
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white border border-white/30 text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
                title="Baixar Histórico Escolar Oficial em PDF"
              >
                <FileText className="w-4 h-4 text-[#a2d486]" />
                <span>Baixar Histórico</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  generateCertificadoPdf(
                    studentRecord,
                    { ...currentUser, name: displayAlunoName },
                    currentTurma,
                    disciplinas
                  )
                }
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-[#b9b474] hover:bg-[#a8a363] text-[#123d00] text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
                title="Baixar Certificado Oficial de Conclusão em PDF"
              >
                <GraduationCap className="w-4 h-4 text-[#123d00]" />
                <span>Baixar Certificado</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 2. BARRA DE PROGRESSO DO CURSO                                           */}
      {/* ========================================================================= */}
      <div className="bg-white border border-[#c2c9b9]/80 rounded-2xl p-5 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#646029] block">
              Evolução e Desempenho Curricular
            </span>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-[#082500]">
                Progresso na Formação de Escritores Teológicos
              </h3>
              <span className="text-xs font-black text-[#123d00] bg-[#123d00]/10 px-2 py-0.5 rounded-md">
                {courseProgress}% Concluído
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-[#42493d]">
            <div className="flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-[#123d00]" />
              <span>
                <strong>{liberadasCount}</strong> de <strong>{totalDisciplinasCount}</strong> disciplinas liberadas
              </span>
            </div>

            <div className="h-4 w-px bg-[#e1e3dd] hidden sm:block" />

            <div className="flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-[#15803d]" />
              <span>
                Freq: <strong>{studentRecord.frequenciaPercent}%</strong>
              </span>
            </div>

            <div className="h-4 w-px bg-[#e1e3dd] hidden sm:block" />

            <div className="flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-[#b9b474]" />
              <span>
                Média:{' '}
                <strong>
                  {studentRecord.mediaGeral !== undefined && studentRecord.mediaGeral > 0
                    ? studentRecord.mediaGeral.toFixed(1)
                    : 'Sem notas'}
                </strong>
              </span>
            </div>
          </div>
        </div>

        {/* Progress Track */}
        <div className="w-full bg-[#edefe9] h-3 rounded-full overflow-hidden p-0.5 border border-[#e1e3dd]">
          <div
            className="bg-gradient-to-r from-[#123d00] via-[#15803d] to-[#22c55e] h-full rounded-full transition-all duration-700 shadow-xs"
            style={{ width: `${courseProgress}%` }}
          />
        </div>
      </div>

      {/* Floating Notifications / Feedbacks */}
      {submitFeedback && (
        <div className="bg-[#123d00] text-white text-xs font-bold px-4 py-3 rounded-2xl flex items-center gap-2 animate-in fade-in shadow-md">
          <CheckCircle2 className="w-4 h-4 text-[#a2d486]" />
          <span>{submitFeedback}</span>
        </div>
      )}

      {downloadFeedback && (
        <div className="bg-[#f4f6f0] border border-[#c2c9b9] text-[#123d00] text-xs font-bold px-4 py-3 rounded-2xl flex items-center gap-2 animate-in fade-in">
          <Download className="w-4 h-4 text-[#15803d]" />
          <span>{downloadFeedback}</span>
        </div>
      )}

      {lockFeedback && (
        <div className="bg-[#fee2e2] border border-[#fecaca] text-[#991b1b] text-xs font-bold px-4 py-3 rounded-2xl flex items-center justify-between gap-2 animate-in fade-in">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 shrink-0 text-[#dc2626]" />
            <span>{lockFeedback}</span>
          </div>
          <button
            type="button"
            onClick={() => setLockFeedback('')}
            className="text-[#991b1b] hover:text-black cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. DISCIPLINAS — PRINCIPAL CONTEÚDO DO PAINEL                            */}
      {/* ========================================================================= */}
      <div className="space-y-6">
        {/* Header of Disciplinas Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#e1e3dd] pb-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold font-display text-[#082500] flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-[#123d00]" />
              <span>Disciplinas da Formação Teológica</span>
            </h2>
          </div>

          {selectedDisciplina && (
            <button
              type="button"
              onClick={() => setSelectedDisciplinaId(null)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#f4f6f0] hover:bg-[#e8ece0] text-[#123d00] border border-[#c2c9b9] text-xs font-bold transition-colors cursor-pointer self-start sm:self-auto"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar para todas as disciplinas</span>
            </button>
          )}
        </div>

        {/* ======================================================================= */}
        {/* CASO 1: VISÃO DE TODAS AS DISCIPLINAS EM CARTÕES ESTRUTURADOS           */}
        {/* ======================================================================= */}
        {!selectedDisciplina ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {disciplinas.map((disc, idx) => {
              const isLiberada = liberadasIds.includes(disc.id);
              const totalMateriais = disc.modulos.reduce((acc, m) => acc + m.materials.length, 0);
              const aulasCount = getDisciplinaAulas(disc).length;
              const submissionsForDisc = (studentRecord.submissions || []).filter(
                (s) => s.moduloTitle.includes(disc.nome) || s.moduloTitle.includes(disc.codigo || '')
              );

              return (
                <div
                  key={disc.id}
                  className={`border rounded-3xl p-6 flex flex-col justify-between transition-all duration-300 relative ${
                    isLiberada
                      ? 'bg-white border-[#c2c9b9]/90 hover:border-[#123d00] hover:shadow-md cursor-pointer'
                      : 'bg-[#f7f8f5] border-[#e1e3dd] opacity-80 cursor-not-allowed select-none'
                  }`}
                  onClick={() => {
                    if (isLiberada) {
                      setSelectedDisciplinaId(disc.id);
                      setDisciplinaSubTab('documentos');
                    } else {
                      setLockFeedback(
                        `A disciplina "${disc.nome}" está bloqueada no momento. O acesso será liberado pela Coordenação / Professor no período curricular correspondente.`
                      );
                      setTimeout(() => setLockFeedback(''), 5000);
                    }
                  }}
                >
                  <div className="space-y-4">
                    {/* Top Row: Code, Area & Status Badge */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            isLiberada
                              ? 'bg-[#123d00]/10 text-[#123d00]'
                              : 'bg-gray-200 text-gray-600'
                          }`}
                        >
                          {disc.codigo || `MOD-0${idx + 1}`}
                        </span>
                        <span className="text-[11px] text-[#646029] font-medium">
                          {disc.area}
                        </span>
                      </div>

                      {/* Status: Liberada vs Bloqueada com Ícone de Cadeado */}
                      <span
                        className={`px-3 py-1 rounded-full text-[11px] font-extrabold flex items-center gap-1.5 shadow-2xs ${
                          isLiberada
                            ? 'bg-[#15803d]/15 text-[#15803d] border border-[#15803d]/25'
                            : 'bg-[#fee2e2] text-[#991b1b] border border-[#fecaca]'
                        }`}
                      >
                        {isLiberada ? (
                          <>
                            <Unlock className="w-3.5 h-3.5" />
                            <span>Liberada</span>
                          </>
                        ) : (
                          <>
                            <Lock className="w-3.5 h-3.5 text-[#dc2626]" />
                            <span>Bloqueada</span>
                          </>
                        )}
                      </span>
                    </div>

                    {/* Discipline Name & Description */}
                    <div>
                      <h3 className="font-bold text-lg text-[#082500] font-display group-hover:text-[#123d00] transition-colors">
                        {disc.nome}
                      </h3>
                      <p className="text-xs text-[#52594d] mt-1.5 line-clamp-2 leading-relaxed">
                        {disc.descricao}
                      </p>
                    </div>

                    {/* Professor & Carga Horária */}
                    <div className="pt-2 border-t border-[#f0f2eb] flex items-center justify-between text-xs text-[#646029]">
                      <span className="truncate max-w-[190px]">
                        Docente: <strong>{disc.professorPadrao || 'Corpo Docente'}</strong>
                      </span>
                      <span className="font-bold shrink-0">{disc.cargaHoraria || 40}h</span>
                    </div>

                    {/* Summary Badges: Documentos, Aulas, Atividades */}
                    <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                      <div className="bg-[#fafbf8] border border-[#e1e3dd] rounded-xl p-2">
                        <span className="text-[9px] uppercase font-bold text-[#73796c] block">PDFs</span>
                        <span className="text-xs font-extrabold text-[#123d00]">{totalMateriais}</span>
                      </div>
                      <div className="bg-[#fafbf8] border border-[#e1e3dd] rounded-xl p-2">
                        <span className="text-[9px] uppercase font-bold text-[#73796c] block">Aulas</span>
                        <span className="text-xs font-extrabold text-[#123d00]">{aulasCount}</span>
                      </div>
                      <div className="bg-[#fafbf8] border border-[#e1e3dd] rounded-xl p-2">
                        <span className="text-[9px] uppercase font-bold text-[#73796c] block">Envios</span>
                        <span className="text-xs font-extrabold text-[#15803d]">
                          {submissionsForDisc.length}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer Action */}
                  <div className="pt-5 mt-4 border-t border-[#f0f2eb]">
                    {isLiberada ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDisciplinaId(disc.id);
                          setDisciplinaSubTab('documentos');
                        }}
                        className="w-full py-2.5 rounded-xl bg-[#123d00] hover:bg-[#0d2a00] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Acessar Conteúdo & Módulos</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled
                        className="w-full py-2.5 rounded-xl bg-[#e1e3dd] text-[#73796c] text-xs font-bold flex items-center justify-center gap-2 cursor-not-allowed opacity-80"
                      >
                        <Lock className="w-3.5 h-3.5 text-[#73796c]" />
                        <span>Conteúdo Bloqueado</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* ======================================================================= */
          /* CASO 2: CONTEÚDO DETALHADO DA DISCIPLINA LIBERADA                       */
          /* Organizado por módulos: PDFs, Aulas, Frequência, Envio de trabalhos     */
          /* ======================================================================= */
          <div className="space-y-6">
            {/* Disciplina Active Header Banner */}
            <div className="bg-white border border-[#c2c9b9]/90 rounded-3xl p-6 sm:p-7 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#123d00]/10 text-[#123d00] text-xs font-black uppercase">
                      {selectedDisciplina.codigo || 'DISCIPLINA'}
                    </span>
                    <span className="text-xs text-[#646029] font-medium">
                      {selectedDisciplina.area}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-[#15803d]/15 text-[#15803d] text-[10px] font-extrabold flex items-center gap-1">
                      <Unlock className="w-3 h-3" />
                      <span>Liberada</span>
                    </span>
                  </div>

                  <h3 className="text-2xl font-bold font-display text-[#082500]">
                    {selectedDisciplina.nome}
                  </h3>

                  <p className="text-xs text-[#52594d] leading-relaxed max-w-3xl">
                    {selectedDisciplina.descricao}
                  </p>
                </div>

                <div className="bg-[#f8faf4] border border-[#e1e3dd] p-4 rounded-2xl flex items-center gap-6 self-start sm:self-auto">
                  <div className="text-center">
                    <span className="text-[10px] font-bold text-[#73796c] uppercase block">Carga Horária</span>
                    <span className="text-base font-extrabold text-[#123d00]">{selectedDisciplina.cargaHoraria || 40}h</span>
                  </div>
                  <div className="h-8 w-px bg-[#e1e3dd]" />
                  <div className="text-center">
                    <span className="text-[10px] font-bold text-[#73796c] uppercase block">Docente Titular</span>
                    <span className="text-xs font-bold text-[#082500] max-w-[120px] truncate block">
                      {selectedDisciplina.professorPadrao || 'Corpo Docente'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Subtabs for the Disciplina: Documentos em PDF, Aulas, Frequência, Envio de Trabalhos */}
              <div className="flex items-center gap-2 border-t border-[#f0f2eb] pt-4 overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setDisciplinaSubTab('documentos')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer shadow-none ${
                    disciplinaSubTab === 'documentos'
                      ? 'bg-[#123d00] text-white'
                      : 'bg-[#f4f6f0] hover:bg-[#e8ece0] text-[#42493d] border border-[#e1e3dd]'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>Documentos em PDF</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDisciplinaSubTab('aulas')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer shadow-none ${
                    disciplinaSubTab === 'aulas'
                      ? 'bg-[#123d00] text-white'
                      : 'bg-[#f4f6f0] hover:bg-[#e8ece0] text-[#42493d] border border-[#e1e3dd]'
                  }`}
                >
                  <Video className="w-4 h-4" />
                  <span>Aulas & Encontros</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDisciplinaSubTab('frequencia')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer shadow-none ${
                    disciplinaSubTab === 'frequencia'
                      ? 'bg-[#123d00] text-white'
                      : 'bg-[#f4f6f0] hover:bg-[#e8ece0] text-[#42493d] border border-[#e1e3dd]'
                  }`}
                >
                  <UserCheck className="w-4 h-4" />
                  <span>Frequência na Disciplina</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setDisciplinaSubTab('trabalhos');
                    setSubDisciplinaId(selectedDisciplina.id);
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer shadow-none ${
                    disciplinaSubTab === 'trabalhos'
                      ? 'bg-[#123d00] text-white'
                      : 'bg-[#f4f6f0] hover:bg-[#e8ece0] text-[#42493d] border border-[#e1e3dd]'
                  }`}
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>Envio de Trabalhos</span>
                </button>
              </div>
            </div>

            {/* ------------------------------------------------------------------- */}
            {/* SUBTAB 1: DOCUMENTOS EM PDF DA DISCIPLINA (POR MÓDULOS)             */}
            {/* ------------------------------------------------------------------- */}
            {disciplinaSubTab === 'documentos' && (
              <div className="space-y-6">
                <div className="bg-[#f4f6f0] border border-[#e1e3dd] rounded-2xl p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-[#123d00] shrink-0" />
                    <div>
                      <h4 className="font-bold text-xs text-[#082500]">
                        Repositório de Apostilas e Documentos Homologados
                      </h4>
                      <p className="text-[11px] text-[#52594d]">
                        Arquivos organizados pelos módulos da disciplina, liberados para estudo e download individual.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  {selectedDisciplina.modulos.map((mod) => (
                    <div
                      key={mod.id}
                      className="bg-white border border-[#c2c9b9]/80 rounded-3xl p-6 shadow-xs space-y-4"
                    >
                      <div className="border-b border-[#f0f2eb] pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="space-y-0.5">
                          <span className="text-[10px] font-black uppercase tracking-wider text-[#646029]">
                            Módulo 0{mod.number}
                          </span>
                          <h4 className="text-base font-bold text-[#082500] font-display">
                            {mod.title}
                          </h4>
                          <p className="text-xs text-[#52594d]">{mod.description}</p>
                        </div>

                        <span className="text-xs bg-[#f4f6f0] px-3 py-1 rounded-full font-bold text-[#123d00] border border-[#e1e3dd] self-start sm:self-auto">
                          {mod.materials.length} documento(s)
                        </span>
                      </div>

                      {/* Ementa do Módulo */}
                      {mod.ementa && mod.ementa.length > 0 && (
                        <div className="space-y-1.5 bg-[#fafbf8] p-3 rounded-2xl border border-[#e1e3dd]">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#646029] block">
                            Tópicos da Ementa:
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {mod.ementa.map((item, eIdx) => (
                              <div key={eIdx} className="flex items-center gap-2 text-xs text-[#2b3128]">
                                <CheckCircle2 className="w-3.5 h-3.5 text-[#15803d] shrink-0" />
                                <span className="truncate">{item}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Lista de PDFs deste Módulo */}
                      <div className="space-y-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#646029] block">
                          Arquivos Disponíveis para Download:
                        </span>

                        {mod.materials.map((mat) => (
                          <div
                            key={mat.id}
                            className="bg-[#fafbf8] border border-[#e1e3dd] hover:border-[#123d00]/30 transition-all rounded-2xl p-3.5 flex items-center justify-between gap-3"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-9 h-9 rounded-xl bg-[#123d00]/10 text-[#123d00] flex items-center justify-center shrink-0">
                                <FileText className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <h5 className="text-xs font-bold text-[#082500] truncate">
                                  {mat.title}
                                </h5>
                                <p className="text-[11px] text-[#73796c] truncate">
                                  {mat.descricao ? `${mat.descricao} • ` : ''}{mat.tamanho ? `${mat.tamanho} • ` : ''}{mat.date}
                                </p>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleDownloadMaterial(mat.title, mat.url)}
                              className="px-3.5 py-2 rounded-xl bg-[#123d00] hover:bg-[#0d2a00] text-white text-xs font-bold flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer shadow-xs"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Baixar PDF</span>
                            </button>
                          </div>
                        ))}

                        {mod.materials.length === 0 && (
                          <p className="text-xs text-[#73796c] italic p-3 bg-[#fafbf8] rounded-xl border border-[#e1e3dd]">
                            Nenhum documento PDF cadastrado ainda para este módulo.
                          </p>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Documentos Extras da Turma para Esta Disciplina */}
                  {currentTurma?.materiaisExtras &&
                    currentTurma.materiaisExtras.filter((me) => me.disciplinaId === selectedDisciplina.id).length > 0 && (
                      <div className="bg-white border border-[#c2c9b9]/80 rounded-3xl p-6 shadow-xs space-y-3">
                        <h4 className="text-sm font-bold text-[#082500] flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-[#15803d]" />
                          <span>Materiais Extras da Turma</span>
                        </h4>

                        <div className="space-y-2">
                          {currentTurma.materiaisExtras
                            .filter((me) => me.disciplinaId === selectedDisciplina.id)
                            .map((extra) => (
                              <div
                                key={extra.id}
                                className="bg-[#f8faf4] border border-[#e1e3dd] rounded-2xl p-3 flex items-center justify-between gap-3"
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <FileText className="w-4 h-4 text-[#123d00] shrink-0" />
                                  <div className="min-w-0">
                                    <span className="text-xs font-bold text-[#082500] block truncate">
                                      {extra.titulo}
                                    </span>
                                    <span className="text-[10px] text-[#73796c]">
                                      {extra.descricao ? `${extra.descricao} • ` : ''}{extra.dataUpload}
                                    </span>
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => handleDownloadMaterial(extra.titulo, extra.url)}
                                  className="px-3 py-1.5 rounded-xl bg-[#123d00] hover:bg-[#0d2a00] text-white text-xs font-bold flex items-center gap-1.5 shrink-0 cursor-pointer shadow-xs"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                  <span>Baixar</span>
                                </button>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------------- */}
            {/* SUBTAB 2: AULAS E ENCONTROS DA DISCIPLINA (DADOS REAIS)             */}
            {/* ------------------------------------------------------------------- */}
            {disciplinaSubTab === 'aulas' && (
              <div className="space-y-4">
                <div className="bg-[#f4f6f0] border border-[#e1e3dd] rounded-2xl p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Video className="w-5 h-5 text-[#123d00] shrink-0" />
                    <div>
                      <h4 className="font-bold text-xs text-[#082500]">
                        Cronograma de Aulas e Encontros Cadastrados
                      </h4>
                      <p className="text-[11px] text-[#52594d]">
                        Aulas registradas pela Coordenação e professores para esta turma e disciplina.
                      </p>
                    </div>
                  </div>
                </div>

                {getDisciplinaAulas(selectedDisciplina).length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {getDisciplinaAulas(selectedDisciplina).map((aula, aIdx) => {
                      const presencaStatus = aula.presencas?.[studentRecord.alunoId];
                      const isPresente = presencaStatus === 'presente';
                      const isAusente = presencaStatus === 'ausente';

                      return (
                        <div
                          key={aula.id || aIdx}
                          className="bg-white border border-[#c2c9b9]/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4"
                        >
                          <div className="space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <span className="px-2.5 py-0.5 rounded-full bg-[#123d00]/10 text-[#123d00] text-[10px] font-black uppercase">
                                Aula 0{aIdx + 1}
                              </span>
                              {isPresente && (
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold flex items-center gap-1 bg-[#15803d]/15 text-[#15803d]">
                                  <UserCheck className="w-3 h-3" />
                                  <span>Presente</span>
                                </span>
                              )}
                              {isAusente && (
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold flex items-center gap-1 bg-[#b91c1c]/10 text-[#b91c1c]">
                                  <span>Falta Registrada</span>
                                </span>
                              )}
                              {!presencaStatus && (
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold flex items-center gap-1 bg-[#73796c]/15 text-[#52594d]">
                                  <Clock className="w-3 h-3" />
                                  <span>Aguardando Chamada</span>
                                </span>
                              )}
                            </div>

                            <h5 className="font-bold text-sm text-[#082500]">
                              {aula.moduloTitulo || `Aula da Disciplina ${selectedDisciplina.nome}`}
                            </h5>

                            {aula.assunto && (
                              <p className="text-xs text-[#52594d] leading-relaxed">
                                {aula.assunto}
                              </p>
                            )}

                            <div className="flex items-center gap-2 text-xs text-[#73796c] pt-1">
                              <Calendar className="w-3.5 h-3.5 text-[#123d00]" />
                              <span>Data da Aula: <strong>{aula.data}</strong></span>
                            </div>
                          </div>

                          <div className="pt-3 border-t border-[#f0f2eb]">
                            {aula.link ? (
                              <a
                                href={aula.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full py-2 rounded-xl bg-[#123d00] hover:bg-[#0d2a00] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors"
                              >
                                <Video className="w-3.5 h-3.5" />
                                <span>Acessar Sala / Gravação</span>
                                <ExternalLink className="w-3 h-3 text-[#a2d486]" />
                              </a>
                            ) : (
                              <span className="text-xs text-[#73796c] italic block text-center py-1">
                                Link a ser disponibilizado no horário da aula.
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="bg-white border border-[#c2c9b9]/80 rounded-3xl p-8 text-center space-y-2">
                    <Video className="w-8 h-8 text-[#73796c] mx-auto opacity-50" />
                    <h5 className="font-bold text-sm text-[#082500]">
                      Nenhuma aula cadastrada para esta disciplina
                    </h5>
                    <p className="text-xs text-[#73796c] max-w-md mx-auto">
                      O cronograma de encontros síncronos e links de gravação serão disponibilizados pela Coordenação e professores conforme o calendário letivo.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* ------------------------------------------------------------------- */}
            {/* SUBTAB 3: FREQUÊNCIA NA DISCIPLINA (DADOS REAIS)                   */}
            {/* ------------------------------------------------------------------- */}
            {disciplinaSubTab === 'frequencia' && (
              <div className="bg-white border border-[#c2c9b9]/80 rounded-3xl p-6 sm:p-7 shadow-xs space-y-6">
                <div className="border-b border-[#f0f2eb] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h4 className="text-lg font-bold font-display text-[#082500]">
                      Controle Oficial de Assiduidade e Presenças
                    </h4>
                    <p className="text-xs text-[#646029]">
                      A frequência mínima exigida pela convenção para aprovação é de 75%.
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="bg-[#f8faf4] border border-[#e1e3dd] px-4 py-2 rounded-2xl text-center">
                      <span className="text-[10px] uppercase font-bold text-[#73796c] block">
                        Presenças Apuradas
                      </span>
                      <span className="text-base font-black text-[#15803d]">
                        {studentRecord.aulasTotais > 0
                          ? `${studentRecord.presencas} / ${studentRecord.aulasTotais}`
                          : `${studentRecord.presencas} presença(s)`}
                      </span>
                    </div>

                    <div className="bg-[#f8faf4] border border-[#e1e3dd] px-4 py-2 rounded-2xl text-center">
                      <span className="text-[10px] uppercase font-bold text-[#73796c] block">
                        Taxa de Assiduidade
                      </span>
                      <span className="text-base font-black text-[#123d00]">
                        {studentRecord.frequenciaPercent}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Detailed Attendance List */}
                {getDisciplinaAulas(selectedDisciplina).length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-[#e1e3dd] bg-[#f8faf4] text-[#646029] uppercase font-bold">
                          <th className="p-3">Aula / Encontro</th>
                          <th className="p-3">Assunto Ministrado</th>
                          <th className="p-3">Data</th>
                          <th className="p-3 text-center">Situação</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#f0f2eb]">
                        {getDisciplinaAulas(selectedDisciplina).map((aula, idx) => {
                          const presencaStatus = aula.presencas?.[studentRecord.alunoId];
                          const isPresente = presencaStatus === 'presente';
                          const isAusente = presencaStatus === 'ausente';

                          return (
                            <tr key={idx} className="hover:bg-[#fafbf8]">
                              <td className="p-3 font-bold text-[#123d00]">
                                Aula 0{idx + 1}
                              </td>
                              <td className="p-3 text-[#191c19] font-medium">
                                {aula.assunto || aula.moduloTitulo || 'Encontro Teológico'}
                              </td>
                              <td className="p-3 text-[#73796c]">{aula.data}</td>
                              <td className="p-3 text-center">
                                {isPresente && (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#15803d]/15 text-[#15803d] font-bold text-[10px]">
                                    <UserCheck className="w-3 h-3" />
                                    <span>Presente</span>
                                  </span>
                                )}
                                {isAusente && (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#b91c1c]/10 text-[#b91c1c] font-bold text-[10px]">
                                    <span>Ausente</span>
                                  </span>
                                )}
                                {!presencaStatus && (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#73796c]/15 text-[#52594d] font-bold text-[10px]">
                                    <Clock className="w-3 h-3" />
                                    <span>Aguardando Chamada</span>
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-8 text-center text-xs text-[#73796c] bg-[#fafbf8] rounded-2xl border border-[#e1e3dd]">
                    Nenhuma aula registrada até o momento para apuração de frequência desta disciplina.
                  </div>
                )}
              </div>
            )}

            {/* ------------------------------------------------------------------- */}
            {/* SUBTAB 4: ENVIO DE TRABALHOS DA DISCIPLINA (DADOS REAIS)           */}
            {/* ------------------------------------------------------------------- */}
            {disciplinaSubTab === 'trabalhos' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Form to submit work for this discipline */}
                <div className="lg:col-span-6 bg-white border border-[#c2c9b9]/80 rounded-3xl p-6 shadow-xs space-y-4">
                  <div className="border-b border-[#e1e3dd] pb-3">
                    <h4 className="text-base font-bold font-display text-[#082500]">
                      Submeter Atividade / Redação Teológica
                    </h4>
                    <p className="text-xs text-[#646029]">
                      Envie sua dissertação, fichamento ou projeto de lição para a disciplina <strong>{selectedDisciplina.nome}</strong>.
                    </p>
                  </div>

                  <form onSubmit={handleFormSubmit} className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-[#191c19] block mb-1">
                        Módulo da Disciplina
                      </label>
                      <select
                        value={subModuleNumber}
                        onChange={(e) => setSubModuleNumber(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-[#f8faf4] border border-[#c2c9b9] rounded-xl text-xs font-bold text-[#082500] focus:outline-hidden focus:border-[#123d00]"
                      >
                        {selectedDisciplina.modulos.map((m) => (
                          <option key={m.id} value={m.number}>
                            Módulo {m.number}: {m.title}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-[#191c19] block mb-1">
                        Título do Ensaio / Redação
                      </label>
                      <input
                        type="text"
                        required
                        value={subTitle}
                        onChange={(e) => setSubTitle(e.target.value)}
                        placeholder="Ex: Análise da Hermenêutica e Cosmovisão Teológica"
                        className="w-full px-3 py-2 bg-[#f8faf4] border border-[#c2c9b9] rounded-xl text-xs focus:outline-hidden focus:border-[#123d00]"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-[#191c19] block mb-1">
                        Texto Dissertativo ou Resumo da Pesquisa
                      </label>
                      <textarea
                        rows={5}
                        value={subText}
                        onChange={(e) => setSubText(e.target.value)}
                        placeholder="Insira aqui o corpo do seu texto ou síntese exegética para apreciação docente..."
                        className="w-full p-3 bg-[#f8faf4] border border-[#c2c9b9] rounded-xl text-xs text-[#191c19] font-serif leading-relaxed focus:outline-hidden focus:border-[#123d00]"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-[#191c19] block mb-1">
                        Anexar Arquivo Completo (PDF ou DOCX - Opcional)
                      </label>
                      <input
                        type="file"
                        accept=".pdf,.docx,.doc,.txt"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setSubFile(e.target.files[0]);
                          }
                        }}
                        className="w-full text-xs text-[#73796c] file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#123d00] file:text-white hover:file:bg-[#0d2a00] cursor-pointer"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 rounded-2xl bg-[#123d00] hover:bg-[#0d2a00] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                    >
                      <Send className="w-4 h-4" />
                      <span>Enviar Atividade para Avaliação</span>
                    </button>
                  </form>
                </div>

                {/* Submissions history for this discipline (DADOS REAIS) */}
                <div className="lg:col-span-6 bg-white border border-[#c2c9b9]/80 rounded-3xl p-6 shadow-xs space-y-4">
                  <div className="border-b border-[#e1e3dd] pb-3 flex items-center justify-between">
                    <div>
                      <h4 className="text-base font-bold font-display text-[#082500]">
                        Histórico de Trabalhos Desta Disciplina
                      </h4>
                      <p className="text-xs text-[#73796c]">
                        Acompanhe o parecer e as notas atribuídas pelos avaliadores.
                      </p>
                    </div>

                    <span className="text-xs bg-[#f4f6f0] text-[#123d00] font-bold px-2.5 py-1 rounded-full border border-[#e1e3dd]">
                      {
                        (studentRecord.submissions || []).filter(
                          (s) =>
                            s.moduloTitle.includes(selectedDisciplina.nome) ||
                            s.moduloTitle.includes(selectedDisciplina.codigo || '')
                        ).length
                      }{' '}
                      enviados
                    </span>
                  </div>

                  <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                    {(studentRecord.submissions || [])
                      .filter(
                        (s) =>
                          s.moduloTitle.includes(selectedDisciplina.nome) ||
                          s.moduloTitle.includes(selectedDisciplina.codigo || '')
                      )
                      .map((sub) => (
                        <div
                          key={sub.id}
                          className="border border-[#e1e3dd] rounded-2xl p-4 bg-[#fafbf8] space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-[#646029] uppercase">
                              {sub.moduloTitle}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                                sub.status === 'Avaliado'
                                  ? 'bg-[#15803d]/15 text-[#15803d]'
                                  : 'bg-[#b45309]/15 text-[#b45309]'
                              }`}
                            >
                              {sub.status}
                            </span>
                          </div>

                          <h5 className="font-bold text-xs text-[#082500]">
                            {sub.tituloTrabalho}
                          </h5>

                          <p className="text-[11px] text-[#73796c]">
                            Enviado em: {sub.submetidoEm}
                          </p>

                          {sub.nota !== undefined && (
                            <div className="pt-2 border-t border-[#e1e3dd] flex items-center justify-between">
                              <span className="text-xs font-bold text-[#123d00]">
                                Nota: {sub.nota.toFixed(1)} / 10.0
                              </span>
                              {sub.professorName && (
                                <span className="text-[10px] text-[#646029]">
                                  Avaliador: {sub.professorName}
                                </span>
                              )}
                            </div>
                          )}

                          {sub.feedback && (
                            <div className="bg-white border border-[#e1e3dd] p-2.5 rounded-xl text-[11px] text-[#42493d] italic mt-1">
                              "{sub.feedback}"
                            </div>
                          )}
                        </div>
                      ))}

                    {(studentRecord.submissions || []).filter(
                      (s) =>
                        s.moduloTitle.includes(selectedDisciplina.nome) ||
                        s.moduloTitle.includes(selectedDisciplina.codigo || '')
                    ).length === 0 && (
                      <div className="text-center py-8 text-[#73796c] space-y-2">
                        <UploadCloud className="w-8 h-8 text-[#c2c9b9] mx-auto" />
                        <p className="text-xs">
                          Nenhum trabalho enviado ainda para esta disciplina. Utilize o formulário ao lado para realizar o primeiro envio.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL: VER TODOS OS AVISOS DA TURMA                                       */}
      {/* ========================================================================= */}
      {isAvisosModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-[#c2c9b9] overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 border-b border-[#e1e3dd] flex items-center justify-between gap-4 bg-[#f8faf4]">
              <div>
                <h3 className="text-lg font-bold font-display text-[#082500] flex items-center gap-2">
                  <Bell className="w-5 h-5 text-[#123d00]" />
                  <span>Mural Completo de Comunicados</span>
                </h3>
                <p className="text-xs text-[#646029] mt-0.5">
                  Avisos e orientações emitidos pela Coordenação Teológica e professores da {currentTurma?.name}.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsAvisosModalOpen(false)}
                className="w-9 h-9 rounded-xl bg-white hover:bg-gray-100 border border-[#e1e3dd] text-gray-500 hover:text-black flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Search Bar */}
            <div className="p-4 border-b border-[#f0f2eb] bg-white">
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={avisoSearch}
                  onChange={(e) => setAvisoSearch(e.target.value)}
                  placeholder="Pesquisar comunicados por palavra-chave ou autor..."
                  className="w-full pl-9 pr-4 py-2 bg-[#f8faf4] border border-[#c2c9b9] rounded-xl text-xs focus:outline-hidden focus:border-[#123d00]"
                />
              </div>
            </div>

            {/* Modal List Body */}
            <div className="p-6 overflow-y-auto space-y-4">
              {filteredModalAvisos.map((aviso) => (
                <div
                  key={aviso.id}
                  className={`p-5 rounded-2xl border transition-all ${
                    aviso.importante
                      ? 'bg-[#f8faf4] border-[#123d00]/30 shadow-2xs'
                      : 'bg-white border-[#e1e3dd]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {aviso.importante && (
                        <span className="px-2 py-0.5 rounded-md bg-[#123d00] text-white text-[10px] font-black uppercase">
                          Importante
                        </span>
                      )}
                      <span className="text-[11px] font-bold text-[#646029]">
                        {aviso.autorRole}: {aviso.autorNome}
                      </span>
                    </div>
                    <span className="text-[11px] text-[#73796c]">{aviso.data}</span>
                  </div>

                  <h4 className="font-bold text-sm text-[#082500] mt-2 font-display">
                    {aviso.titulo}
                  </h4>

                  <p className="text-xs text-[#42493d] mt-1 leading-relaxed">
                    {aviso.conteudo}
                  </p>

                  {aviso.link && (
                    <div className="mt-3 pt-2">
                      <a
                        href={aviso.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#123d00]/10 hover:bg-[#123d00]/20 text-[#123d00] text-xs font-bold transition-colors border border-[#123d00]/20"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Acessar Link Anexo</span>
                      </a>
                    </div>
                  )}
                </div>
              ))}

              {filteredModalAvisos.length === 0 && (
                <div className="text-center py-8 text-[#73796c] text-xs">
                  Nenhum comunicado encontrado para a busca realizada.
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[#e1e3dd] bg-[#f8faf4] flex items-center justify-between">
              <span className="text-xs text-[#73796c]">
                Mostrando {filteredModalAvisos.length} comunicado(s)
              </span>
              <button
                type="button"
                onClick={() => setIsAvisosModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-[#123d00] hover:bg-[#0d2a00] text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
