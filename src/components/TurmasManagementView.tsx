import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
  Plus,
  Search,
  Calendar,
  Clock,
  Link as LinkIcon,
  Users,
  UserCheck,
  UserPlus,
  UserMinus,
  BookOpen,
  FileSpreadsheet,
  FileText,
  Printer,
  ArrowLeft,
  LogIn,
  Pin,
  Trash2,
  Edit,
  CheckCircle2,
  AlertCircle,
  X,
  GraduationCap,
  Copy,
  Check,
  Award,
  MessageSquare,
  Send,
  ShieldCheck,
  Layers,
  Sparkles,
  Lock,
  Unlock,
  FilePlus,
  FileUp,
  UploadCloud,
  Presentation,
  ExternalLink,
  Edit3,
  CalendarCheck,
  ClipboardCheck,
  FileDown,
  Download,
  Pencil,
  Ban,
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Turma,
  SystemUser,
  StudentAcademicRecord,
  AcademicModule,
  TurmaStatus,
  Disciplina,
  MuralAviso,
  TurmaMaterialExtra,
  TurmaAula,
  AulaPresencaRecord,
} from '../types';
import { MateriaisDidaticosView } from './MateriaisDidaticosView';

interface TurmasManagementViewProps {
  turmas: Turma[];
  users: SystemUser[];
  students: StudentAcademicRecord[];
  modules: AcademicModule[];
  disciplinas?: Disciplina[];
  avisos?: MuralAviso[];
  initialSubTab?: 'monitoramento' | 'materiais';
  currentUser?: SystemUser | null;
  isProfessorView?: boolean;
  onUpdateTurmas: (turmas: Turma[]) => void;
  onUpdateUsers: (users: SystemUser[]) => void;
  onUpdateStudents?: (students: StudentAcademicRecord[]) => void;
  onUpdateAvisos?: (avisos: MuralAviso[]) => void;
  onUpdateDisciplinas?: (disciplinas: Disciplina[]) => void;
  onOpenReportModal: (turmaId?: string) => void;
  onNavigateToMateriais?: () => void;
}

interface TurmaFormData {
  id: string;
  name: string;
  urlSlug: string;
  vagas: number;
  status: TurmaStatus;
  editalResumo: string;
  dataInicioInscricoes: string;
  dataFimInscricoes: string;
  dataInicioAulas: string;
  dataConclusao: string;
  diaSemana: string;
  horario: string;
  dataInicioGrade: string;
  dataFimGrade: string;
  modalidade: string;
  linkEncontro: string;
  selectedDisciplinasIds: string[];
}

// Helper function to format the identity of the aviso author according to institutional rules
function getAvisoAuthorIdentity(aviso: MuralAviso): string {
  const role = (aviso.autorRole || '').toLowerCase();
  const name = (aviso.autorNome || '').trim();

  // If Coordenação / Admin / Gestão
  if (
    role.includes('coord') ||
    role.includes('admin') ||
    role.includes('gest') ||
    name.toLowerCase().includes('coordena') ||
    name.toLowerCase().includes('escritores') ||
    name.toLowerCase().includes('lucas pimenta')
  ) {
    return 'Coordenação Teológica - Escritores QGU';
  }

  // If Professor Titular / Docente
  if (role.includes('prof') || name.toLowerCase().startsWith('prof') || name.toLowerCase().startsWith('pr.')) {
    const cleanName = name
      .replace(/^(Pr\.|Pastor|Prof\.|Profa\.|Professor|Professora)\s+/i, '')
      .trim();
    return `Professor ${cleanName}`;
  }

  return name ? `Professor ${name}` : 'Coordenação Teológica - Escritores QGU';
}

// Helper function to check if the user is the author of the aviso
export function isUserAvisoAuthor(aviso: MuralAviso, user?: SystemUser | null): boolean {
  if (!user) return false;

  // 1. Direct match by autorId
  if (aviso.autorId && user.id && aviso.autorId === user.id) {
    return true;
  }

  // 2. Direct match by autorNome
  const userName = (user.name || '').trim().toLowerCase();
  const autorName = (aviso.autorNome || '').trim().toLowerCase();

  if (userName && autorName) {
    if (userName === autorName) return true;

    // Normalize name by removing religious / academic titles
    const normalize = (s: string) =>
      s
        .replace(/^(pr\.|pastor|prof\.|profa\.|professor|professora)\s+/i, '')
        .trim();

    const cleanUser = normalize(userName);
    const cleanAutor = normalize(autorName);

    if (cleanUser && cleanAutor) {
      if (cleanUser === cleanAutor) return true;
      if (cleanUser.includes(cleanAutor) || cleanAutor.includes(cleanUser)) return true;
    }
  }

  return false;
}

export const TurmasManagementView: React.FC<TurmasManagementViewProps> = ({
  turmas,
  users,
  students,
  modules,
  disciplinas = [],
  avisos = [],
  initialSubTab = 'monitoramento',
  currentUser = null,
  isProfessorView = false,
  onUpdateTurmas,
  onUpdateUsers,
  onUpdateStudents,
  onUpdateAvisos,
  onUpdateDisciplinas,
  onOpenReportModal,
  onNavigateToMateriais,
}) => {
  // Control Bar Sub-Tab: Monitoramento de turma vs Materiais didáticos
  const [turmasSubTab, setTurmasSubTab] = useState<'monitoramento' | 'materiais'>(initialSubTab);

  useEffect(() => {
    if (initialSubTab) {
      setTurmasSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  // Navigation & View Mode
  const [viewMode, setViewMode] = useState<'listagem' | 'gestao_interna'>('listagem');
  const [activeTurmaId, setActiveTurmaId] = useState<string>(turmas[0]?.id || 'turma-2026');
  const [internalTab, setInternalTab] = useState<'mural' | 'alunos' | 'frequencia' | 'notas' | 'disciplinas' | 'relatorios'>('mural');
  const [alunoSearchTerm, setAlunoSearchTerm] = useState('');

  // Batch Modals State
  const [showBatchChamadaModal, setShowBatchChamadaModal] = useState(false);
  const [chamadaPresentesMap, setChamadaPresentesMap] = useState<Record<string, boolean>>({});
  const [showBatchGradesModal, setShowBatchGradesModal] = useState(false);
  const [batchGradesMap, setBatchGradesMap] = useState<Record<string, number>>({});
  const [editingFrequenciaStudent, setEditingFrequenciaStudent] = useState<StudentAcademicRecord | null>(null);

  // Search and Filter for Listagem
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | TurmaStatus>('ALL');

  // Modals state
  const [showTurmaModal, setShowTurmaModal] = useState(false);
  const [turmaToEdit, setTurmaToEdit] = useState<Turma | null>(null);
  const [turmaToDelete, setTurmaToDelete] = useState<Turma | null>(null);
  const [idError, setIdError] = useState<string | null>(null);

  // Mural Modal
  const [showAvisoModal, setShowAvisoModal] = useState(false);
  const [avisoToEdit, setAvisoToEdit] = useState<MuralAviso | null>(null);
  const [newAvisoTitulo, setNewAvisoTitulo] = useState('');
  const [newAvisoConteudo, setNewAvisoConteudo] = useState('');
  const [newAvisoCategoria, setNewAvisoCategoria] = useState<'Geral' | 'Aula' | 'Trabalho' | 'Alerta'>('Geral');
  const [newAvisoLink, setNewAvisoLink] = useState('');
  const [newAvisoLinkTitulo, setNewAvisoLinkTitulo] = useState('');
  const [newAvisoImportante, setNewAvisoImportante] = useState(false);

  // Grade/Student Modal
  const [editingStudent, setEditingStudent] = useState<StudentAcademicRecord | null>(null);
  const [studentNotaInput, setStudentNotaInput] = useState<number>(10);
  const [studentPresencasInput, setStudentPresencasInput] = useState<number>(20);
  const [studentStatusInput, setStudentStatusInput] = useState<'Cursando' | 'Formado' | 'Aprovado' | 'Em Recuperação'>('Cursando');

  // Enroll Student Modal
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentEmail, setNewStudentEmail] = useState('');
  const [newStudentPhone, setNewStudentPhone] = useState('');
  const [newStudentPolo, setNewStudentPolo] = useState('Campo Central - Belém/PA');

  // Manage Professors Modal
  const [showProfessorsModal, setShowProfessorsModal] = useState(false);
  const [turmaForProfessors, setTurmaForProfessors] = useState<Turma | null>(null);

  // Material Extra Modal State (Documentos extras específicos da turma)
  const [selectedDisciplinaForExtra, setSelectedDisciplinaForExtra] = useState<Disciplina | null>(null);
  const [showMaterialExtraModal, setShowMaterialExtraModal] = useState(false);
  const [editingExtraId, setEditingExtraId] = useState<string | null>(null);
  const [newExtraCategoria, setNewExtraCategoria] = useState<'documento' | 'link'>('documento');
  const [newExtraTitulo, setNewExtraTitulo] = useState('');
  const [newExtraTipo, setNewExtraTipo] = useState<'pdf' | 'doc' | 'ppt' | 'link'>('pdf');
  const [newExtraUrl, setNewExtraUrl] = useState('');
  const [newExtraDescricao, setNewExtraDescricao] = useState('');
  const [newExtraFile, setNewExtraFile] = useState<File | null>(null);
  const [newExtraFileName, setNewExtraFileName] = useState('');
  const [newExtraFileSize, setNewExtraFileSize] = useState('');
  const [isDraggingExtraFile, setIsDraggingExtraFile] = useState(false);
  const extraFileInputRef = useRef<HTMLInputElement>(null);
  const extraTituloInputRef = useRef<HTMLInputElement>(null);
  const extraFormRef = useRef<HTMLFormElement>(null);
  const [inlineEditingId, setInlineEditingId] = useState<string | null>(null);
  const [inlineEditingTitle, setInlineEditingTitle] = useState('');

  // Aulas & Chamada State
  const [aulasByTurma, setAulasByTurma] = useState<Record<string, TurmaAula[]>>(() => {
    const map: Record<string, TurmaAula[]> = {};
    turmas.forEach((t) => {
      if (t.aulas && t.aulas.length > 0) {
        map[t.id] = t.aulas;
      } else if (t.id === 'turma-2026') {
        map[t.id] = [
          {
            id: 'aula-1',
            turmaId: t.id,
            data: '2026-10-10',
            moduloId: 'disc-1',
            moduloTitulo: 'Módulo 1: Leitura de Textos',
            assunto: 'Introdução e Técnicas de Leitura Bíblica',
            link: 'https://meet.google.com/qgu-2026-comieadepa',
            presencas: {},
          },
          {
            id: 'aula-2',
            turmaId: t.id,
            data: '2026-10-17',
            moduloId: 'disc-2',
            moduloTitulo: 'Módulo 2: Abrangência Teológica',
            assunto: 'Debates Teológicos Contemporâneos',
            link: '',
            presencas: {},
          },
          {
            id: 'aula-3',
            turmaId: t.id,
            data: '2026-10-24',
            moduloId: 'disc-3',
            moduloTitulo: 'Módulo 3: Método Teológico',
            assunto: 'Estruturação de Textos Doutrinários',
            link: 'https://meet.google.com/qgu-metodo-teologico',
            presencas: {},
          },
        ];
      } else {
        map[t.id] = [];
      }
    });
    return map;
  });

  const [showAulaModal, setShowAulaModal] = useState(false);
  const [editingAula, setEditingAula] = useState<TurmaAula | null>(null);
  const [aulaFormData, setAulaFormData] = useState({
    data: '2026-10-31',
    moduloId: '',
    moduloTitulo: '',
    assunto: '',
    link: '',
  });

  // Chamada Modal State
  const [showChamadaModal, setShowChamadaModal] = useState(false);
  const [activeChamadaAula, setActiveChamadaAula] = useState<TurmaAula | null>(null);
  const [chamadaRecord, setChamadaRecord] = useState<Record<string, 'presente' | 'ausente'>>({});

  // Disciplinas Sem Notas & Lançamento de Notas Modal State
  const [disciplinasSemNotas, setDisciplinasSemNotas] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem('escritores_qgu_disciplinas_sem_notas');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return {};
  });
  const [selectedDisciplinaForNotas, setSelectedDisciplinaForNotas] = useState<Disciplina | null>(null);
  const [showNotasModal, setShowNotasModal] = useState(false);
  const [notasInputs, setNotasInputs] = useState<Record<string, string>>({});

  // Feedback State
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Available catalog of disciplinas
  const availableDisciplinas = useMemo(() => {
    if (disciplinas && disciplinas.length > 0) return disciplinas;
    return [
      {
        id: 'disc-1',
        codigo: 'MOD-01',
        nome: 'Leitura de Textos',
        cargaHoraria: 40,
        area: 'Grade Curricular',
        descricao: 'Aprenda técnicas para absorver e reter o máximo de suas leituras.',
        modulos: [],
        turmasIds: ['turma-2026'],
      },
      {
        id: 'disc-2',
        codigo: 'MOD-02',
        nome: 'Abrangência Teológica',
        cargaHoraria: 40,
        area: 'Grade Curricular',
        descricao: 'Conheça as principais áreas de estudo e os grandes debates teológicos.',
        modulos: [],
        turmasIds: ['turma-2026'],
      },
      {
        id: 'disc-3',
        codigo: 'MOD-03',
        nome: 'Método Teológico',
        cargaHoraria: 40,
        area: 'Grade Curricular',
        descricao: 'Aprenda a produzir teologia de maneira sólida e profunda.',
        modulos: [],
        turmasIds: ['turma-2026'],
      },
      {
        id: 'disc-4',
        codigo: 'MOD-04',
        nome: 'Processo de Escrita',
        cargaHoraria: 40,
        area: 'Grade Curricular',
        descricao: 'Estruturação, clareza e elegância na hora de redigir o seu texto.',
        modulos: [],
        turmasIds: ['turma-2026'],
      },
      {
        id: 'disc-5',
        codigo: 'MOD-05',
        nome: 'Laboratório de Teologia',
        cargaHoraria: 40,
        area: 'Grade Curricular',
        descricao: 'Oficina de redação final, banca de avaliação e preparação prática para publicação.',
        modulos: [],
        turmasIds: ['turma-2026'],
      },
    ] as Disciplina[];
  }, [disciplinas]);

  // Check if a turma is linked to the professor
  const isTurmaLinkedToProfessor = useCallback(
    (turma: Turma, profUser?: SystemUser | null): boolean => {
      if (!profUser) return false;
      // 1. Explicit professor ID in turma.professorIds or turma.professoresIds
      const pIds = turma.professorIds || (turma as any).professoresIds;
      if (pIds && pIds.includes(profUser.id)) {
        return true;
      }
      // 2. User has turmaId pointing to this turma
      if (profUser.turmaId && profUser.turmaId === turma.id) {
        return true;
      }
      // 3. User is linked in users array with this turmaId
      if (users.some((u) => u.id === profUser.id && u.turmaId === turma.id)) {
        return true;
      }
      // 4. Default mock fallbacks for Carlos Alberto Pinheiro (user-prof-1 / prof-carlos)
      if (
        (profUser.id === 'user-prof-1' ||
          profUser.id === 'prof-carlos' ||
          (profUser.name && profUser.name.toLowerCase().includes('carlos'))) &&
        (turma.id === 'turma-2026' || (turma.name && turma.name.includes('2026')))
      ) {
        return true;
      }
      // 5. Disciplina in turma has this professor
      const turmaDiscs = availableDisciplinas.filter(
        (d) =>
          (turma.disciplinasIds && turma.disciplinasIds.includes(d.id)) ||
          (d.turmasIds && d.turmasIds.includes(turma.id))
      );
      if (
        turmaDiscs.some(
          (d) =>
            (d.professorPadrao &&
              profUser.name &&
              d.professorPadrao.toLowerCase().includes(profUser.name.toLowerCase())) ||
            (d.avaliadores &&
              d.avaliadores.some(
                (av) =>
                  av.professorId === profUser.id ||
                  (av.professorName &&
                    profUser.name &&
                    av.professorName.toLowerCase().includes(profUser.name.toLowerCase()))
              ))
        )
      ) {
        return true;
      }
      return false;
    },
    [users, availableDisciplinas]
  );

  // Fallback for professor user if currentUser is null in professor view
  const effectiveCurrentUser = useMemo(() => {
    if (currentUser) return currentUser;
    if (isProfessorView) {
      return users.find((u) => u.role === 'professor') || null;
    }
    return null;
  }, [currentUser, isProfessorView, users]);

  // Base list of turmas: for professor, only linked turmas
  const baseTurmas = useMemo(() => {
    if (!isProfessorView) return turmas;
    return turmas.filter((t) => isTurmaLinkedToProfessor(t, effectiveCurrentUser));
  }, [turmas, isProfessorView, effectiveCurrentUser, isTurmaLinkedToProfessor]);

  // Active Turma Object
  const currentTurma = useMemo(() => {
    if (isProfessorView) {
      return baseTurmas.find((t) => t.id === activeTurmaId) || baseTurmas[0] || null;
    }
    return turmas.find((t) => t.id === activeTurmaId) || turmas[0] || null;
  }, [turmas, baseTurmas, activeTurmaId, isProfessorView]);

  // Synchronize activeTurmaId for professor
  useEffect(() => {
    if (isProfessorView && baseTurmas.length > 0 && !baseTurmas.some((t) => t.id === activeTurmaId)) {
      setActiveTurmaId(baseTurmas[0].id);
    }
  }, [isProfessorView, baseTurmas, activeTurmaId]);

  // Restrict Alunos matriculados tab for professor
  useEffect(() => {
    if (isProfessorView && internalTab === 'alunos') {
      setInternalTab('mural');
    }
  }, [isProfessorView, internalTab]);

  // Form State for Create / Edit Turma
  const defaultFormData: TurmaFormData = {
    id: 'turma-2026',
    name: 'Turma 2026 • Formação de Escritores Teológicos',
    urlSlug: 'turma2026',
    vagas: 40,
    status: 'Em Andamento',
    editalResumo: 'Edital N° 01/2026 - COMIEADEPA. Seleção e capacitação canônica de novos autores teológicos da convenção.',
    dataInicioInscricoes: '10/01/2026',
    dataFimInscricoes: '31/03/2026',
    dataInicioAulas: '01/10/2026',
    dataConclusao: '10/12/2026',
    diaSemana: 'Quintas-feiras',
    horario: '20h00',
    dataInicioGrade: '01/10/2026',
    dataFimGrade: '10/12/2026',
    modalidade: 'Encontros Síncronos Semanais',
    linkEncontro: 'https://meet.google.com/qgu-2026-comieadepa',
    selectedDisciplinasIds: ['disc-1', 'disc-2', 'disc-3', 'disc-4', 'disc-5'],
  };

  const [turmaForm, setTurmaForm] = useState<TurmaFormData>(defaultFormData);

  // Filtered Turmas for Table (searches by ID, name, slug, or editalResumo)
  const filteredTurmas = useMemo(() => {
    if (isProfessorView) {
      return baseTurmas;
    }
    const q = searchQuery.toLowerCase().trim();
    return baseTurmas.filter((t) => {
      const matchesSearch =
        !q ||
        t.id.toLowerCase().includes(q) ||
        t.name.toLowerCase().includes(q) ||
        t.urlSlug.toLowerCase().includes(q) ||
        (t.editalResumo && t.editalResumo.toLowerCase().includes(q));
      const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [baseTurmas, searchQuery, statusFilter, isProfessorView]);

  // Students for the active turma
  const turmaStudents = useMemo(() => {
    if (!currentTurma) return [];
    return students.filter((s) => s.turmaId === currentTurma.id || (!s.turmaId && currentTurma.id === 'turma-2026'));
  }, [students, currentTurma]);

  // Filtered students for Alunos matriculados tab
  const filteredTurmaStudents = useMemo(() => {
    const q = alunoSearchTerm.toLowerCase().trim();
    if (!q) return turmaStudents;
    return turmaStudents.filter(
      (s) =>
        s.alunoName.toLowerCase().includes(q) ||
        s.matricula.toLowerCase().includes(q) ||
        s.polo.toLowerCase().includes(q)
    );
  }, [turmaStudents, alunoSearchTerm]);

  // Avisos for the active turma
  const turmaAvisos = useMemo(() => {
    if (!currentTurma) return [];
    return avisos.filter((a) => a.turmaId === currentTurma.id || (!a.turmaId && currentTurma.id === 'turma-2026'));
  }, [avisos, currentTurma]);

  // Sort avisos: pinned first, then by date
  const sortedAvisos = useMemo(() => {
    return [...turmaAvisos].sort((a, b) => {
      if (a.importante === b.importante) return 0;
      return a.importante ? -1 : 1;
    });
  }, [turmaAvisos]);

  // Modules for the active turma
  const turmaModules = useMemo(() => {
    if (!currentTurma) return [];
    const currentTurmaModules = modules.filter((m) => m.turmaId === currentTurma.id);
    if (currentTurmaModules.length > 0) {
      return currentTurmaModules.map((m) => ({
        id: m.id,
        title: `Módulo ${m.number}: ${m.title}`,
      }));
    }
    return availableDisciplinas.map((d, index) => ({
      id: d.id,
      title: `Módulo ${index + 1}: ${d.nome}`,
    }));
  }, [currentTurma, modules, availableDisciplinas]);

  // Disciplinas vinculadas à turma ativa
  const turmaDisciplinasVinculadas = useMemo(() => {
    if (!currentTurma) return [];
    const discIds =
      currentTurma.disciplinasIds && currentTurma.disciplinasIds.length > 0
        ? currentTurma.disciplinasIds
        : ['disc-1', 'disc-2', 'disc-3', 'disc-4', 'disc-5'];
    const list = availableDisciplinas.filter((d) => discIds.includes(d.id));
    return list.length > 0 ? list : availableDisciplinas;
  }, [currentTurma, availableDisciplinas]);

  // Helper para verificar se a disciplina foi marcada como "Não terá notas"
  const isDisciplinaSemNotas = (turmaId: string, disciplinaId: string, disciplinaNome?: string): boolean => {
    if (disciplinasSemNotas[`${turmaId}_${disciplinaId}`]) return true;
    if (disciplinasSemNotas[disciplinaId]) return true;
    if (disciplinaNome && (disciplinasSemNotas[`${turmaId}_${disciplinaNome}`] || disciplinasSemNotas[disciplinaNome])) return true;
    return false;
  };

  // Aulas for the active turma
  const currentTurmaAulas = useMemo(() => {
    if (!currentTurma) return [];
    return aulasByTurma[currentTurma.id] || [];
  }, [aulasByTurma, currentTurma]);

  // Formata data da aula no formato dia/mês (ex: 10/out)
  const formatDiaMes = (dateStr: string): string => {
    if (!dateStr) return '';
    const meses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
    if (dateStr.includes('-')) {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const dia = parseInt(parts[2], 10);
        const mes = parseInt(parts[1], 10) - 1;
        if (mes >= 0 && mes < 12) {
          return `${String(dia).padStart(2, '0')}/${meses[mes]}`;
        }
      }
    }
    if (dateStr.includes('/')) {
      const parts = dateStr.split('/');
      if (parts.length >= 2) {
        const dia = parseInt(parts[0], 10);
        const mes = parseInt(parts[1], 10) - 1;
        if (mes >= 0 && mes < 12) {
          return `${String(dia).padStart(2, '0')}/${meses[mes]}`;
        }
      }
    }
    return dateStr;
  };

  // Handlers para Aulas
  const handleOpenCreateAula = () => {
    setEditingAula(null);
    const defaultMod = turmaModules[0];
    setAulaFormData({
      data: new Date().toISOString().split('T')[0],
      moduloId: defaultMod?.id || '',
      moduloTitulo: defaultMod?.title || '',
      assunto: '',
      link: '',
    });
    setShowAulaModal(true);
  };

  const handleOpenEditAula = (aula: TurmaAula) => {
    setEditingAula(aula);
    setAulaFormData({
      data: aula.data,
      moduloId: aula.moduloId,
      moduloTitulo: aula.moduloTitulo || '',
      assunto: aula.assunto || '',
      link: aula.link || '',
    });
    setShowAulaModal(true);
  };

  const handleSaveAula = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTurma) return;
    if (!aulaFormData.data) {
      showToast('Por favor, informe a data da aula.');
      return;
    }
    if (!aulaFormData.moduloId) {
      showToast('Por favor, selecione o módulo da aula.');
      return;
    }

    const selectedMod = turmaModules.find((m) => m.id === aulaFormData.moduloId);
    const moduloTitulo = selectedMod ? selectedMod.title : aulaFormData.moduloTitulo || 'Módulo Geral';

    const currentAulas = aulasByTurma[currentTurma.id] || [];

    let updatedAulas: TurmaAula[];
    if (editingAula) {
      updatedAulas = currentAulas.map((a) =>
        a.id === editingAula.id
          ? {
              ...a,
              data: aulaFormData.data,
              moduloId: aulaFormData.moduloId,
              moduloTitulo,
              assunto: aulaFormData.assunto.trim() || undefined,
              link: aulaFormData.link.trim(),
            }
          : a
      );
      showToast('Aula atualizada com sucesso!');
    } else {
      const newAula: TurmaAula = {
        id: `aula-${Date.now()}`,
        turmaId: currentTurma.id,
        data: aulaFormData.data,
        moduloId: aulaFormData.moduloId,
        moduloTitulo,
        assunto: aulaFormData.assunto.trim() || undefined,
        link: aulaFormData.link.trim(),
        presencas: {},
      };
      updatedAulas = [...currentAulas, newAula];
      showToast('Nova aula cadastrada com sucesso!');
    }

    updatedAulas.sort((a, b) => a.data.localeCompare(b.data));

    const newMap = { ...aulasByTurma, [currentTurma.id]: updatedAulas };
    setAulasByTurma(newMap);

    const updatedTurmas = turmas.map((t) =>
      t.id === currentTurma.id ? { ...t, aulas: updatedAulas } : t
    );
    onUpdateTurmas(updatedTurmas);

    setShowAulaModal(false);
  };

  const handleDeleteAula = (aulaId: string) => {
    if (!currentTurma) return;
    const currentAulas = aulasByTurma[currentTurma.id] || [];
    const updatedAulas = currentAulas.filter((a) => a.id !== aulaId);

    const newMap = { ...aulasByTurma, [currentTurma.id]: updatedAulas };
    setAulasByTurma(newMap);

    const updatedTurmas = turmas.map((t) =>
      t.id === currentTurma.id ? { ...t, aulas: updatedAulas } : t
    );
    onUpdateTurmas(updatedTurmas);

    showToast('Aula excluída com sucesso.');
  };

  // Handlers para Chamada
  const handleOpenChamada = (aula: TurmaAula) => {
    setActiveChamadaAula(aula);
    const initialMap: Record<string, 'presente' | 'ausente'> = {};
    turmaStudents.forEach((st) => {
      initialMap[st.alunoId] = aula.presencas?.[st.alunoId] || 'presente';
    });
    setChamadaRecord(initialMap);
    setShowChamadaModal(true);
  };

  const handleSaveChamada = () => {
    if (!currentTurma || !activeChamadaAula) return;
    const currentAulas = aulasByTurma[currentTurma.id] || [];

    const updatedAulas = currentAulas.map((a) =>
      a.id === activeChamadaAula.id
        ? {
            ...a,
            presencas: { ...chamadaRecord },
          }
        : a
    );

    const newMap = { ...aulasByTurma, [currentTurma.id]: updatedAulas };
    setAulasByTurma(newMap);

    const updatedTurmas = turmas.map((t) =>
      t.id === currentTurma.id ? { ...t, aulas: updatedAulas } : t
    );
    onUpdateTurmas(updatedTurmas);

    if (onUpdateStudents) {
      const aulasComChamada = updatedAulas.filter(
        (a) => a.presencas && Object.keys(a.presencas).length > 0
      );
      const totalEncontros = Math.max(aulasComChamada.length, 1);

      const updatedStudentsList = students.map((st) => {
        if (st.turmaId === currentTurma.id || (!st.turmaId && currentTurma.id === 'turma-2026')) {
          let presencasCount = 0;
          aulasComChamada.forEach((a) => {
            if (a.presencas?.[st.alunoId] === 'presente') {
              presencasCount++;
            }
          });
          const freqPercent = Math.min(100, Math.round((presencasCount / totalEncontros) * 100));
          return {
            ...st,
            presencas: presencasCount,
            aulasTotais: totalEncontros,
            frequenciaPercent: freqPercent,
          };
        }
        return st;
      });
      onUpdateStudents(updatedStudentsList);
    }

    showToast(`Chamada da aula (${formatDiaMes(activeChamadaAula.data)}) registrada com sucesso!`);
    setShowChamadaModal(false);
  };

  // Handlers for "Nova Turma" and "Editar Turma"
  const handleOpenCreateTurma = () => {
    setTurmaToEdit(null);
    setIdError(null);
    const baseYear = new Date().getFullYear();
    let suggestedId = `turma-${baseYear}`;
    let counter = 2;
    while (turmas.some((t) => t.id.toLowerCase() === suggestedId.toLowerCase())) {
      suggestedId = `turma-${baseYear}-${counter}`;
      counter++;
    }

    setTurmaForm({
      id: suggestedId,
      name: '',
      urlSlug: suggestedId.replace(/[^a-z0-9]/g, ''),
      vagas: 40,
      status: 'Em Andamento',
      editalResumo: 'Edital de Formação Teológica e Literária - COMIEADEPA.',
      dataInicioInscricoes: '10/01/2026',
      dataFimInscricoes: '31/03/2026',
      dataInicioAulas: '01/10/2026',
      dataConclusao: '10/12/2026',
      diaSemana: 'Quintas-feiras',
      horario: '20h00',
      dataInicioGrade: '01/10/2026',
      dataFimGrade: '10/12/2026',
      modalidade: 'Encontros Síncronos Semanais',
      linkEncontro: 'https://meet.google.com/qgu-comieadepa',
      selectedDisciplinasIds: ['disc-1', 'disc-2', 'disc-3', 'disc-4', 'disc-5'],
    });
    setShowTurmaModal(true);
  };

  const handleOpenEditTurma = (turma: Turma, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setTurmaToEdit(turma);
    setIdError(null);
    setTurmaForm({
      id: turma.id,
      name: turma.name,
      urlSlug: turma.urlSlug || '',
      vagas: turma.vagas || 40,
      status: turma.status,
      editalResumo: turma.editalResumo || '',
      dataInicioInscricoes: turma.dataInicioInscricoes || '',
      dataFimInscricoes: turma.dataFimInscricoes || '',
      dataInicioAulas: turma.gradeHoraria?.dataInicio || turma.dataInicioAulas || '01/10/2026',
      dataConclusao: turma.gradeHoraria?.dataFim || turma.dataConclusao || '10/12/2026',
      diaSemana: turma.gradeHoraria?.diaSemana || 'Quintas-feiras',
      horario: turma.gradeHoraria?.horario || '20h00',
      dataInicioGrade: turma.gradeHoraria?.dataInicio || turma.dataInicioAulas || '01/10/2026',
      dataFimGrade: turma.gradeHoraria?.dataFim || turma.dataConclusao || '10/12/2026',
      modalidade: turma.gradeHoraria?.modalidade || 'Encontros Síncronos Semanais',
      linkEncontro: turma.gradeHoraria?.linkEncontro || 'https://meet.google.com/qgu-2026-comieadepa',
      selectedDisciplinasIds: turma.disciplinasIds || ['disc-1', 'disc-2', 'disc-3', 'disc-4', 'disc-5'],
    });
    setShowTurmaModal(true);
  };

  const handleSaveTurma = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = (turmaForm.id || '').trim();
    if (!cleanId) {
      setIdError('O ID da turma é obrigatório.');
      showToast('O ID da turma é obrigatório!');
      return;
    }
    if (!turmaForm.name.trim()) {
      showToast('O nome da turma é obrigatório!');
      return;
    }

    const cleanSlug = (turmaForm.urlSlug || cleanId || turmaForm.name)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]/g, '');

    const gradeData = {
      diaSemana: turmaForm.diaSemana || 'Quintas-feiras',
      horario: turmaForm.horario || '20h00',
      dataInicio: turmaForm.dataInicioGrade || turmaForm.dataInicioAulas || '01/10/2026',
      dataFim: turmaForm.dataFimGrade || turmaForm.dataConclusao || '10/12/2026',
      modalidade: turmaForm.modalidade || 'Encontros Síncronos Semanais',
      linkEncontro: turmaForm.linkEncontro || 'https://meet.google.com/qgu-2026-comieadepa',
    };

    if (turmaToEdit) {
      const oldId = turmaToEdit.id;
      const isIdChanged = oldId !== cleanId;

      if (isIdChanged) {
        const idExists = turmas.some(
          (t) => t.id.toLowerCase() === cleanId.toLowerCase() && t.id !== oldId
        );
        if (idExists) {
          setIdError(`O ID "${cleanId}" já está em uso por outra turma.`);
          showToast(`O ID "${cleanId}" já está sendo utilizado por outra turma.`);
          return;
        }
      }

      const updatedTurmas = turmas.map((t) => {
        if (t.id === oldId) {
          return {
            ...t,
            id: cleanId,
            name: turmaForm.name,
            urlSlug: cleanSlug,
            vagas: Number(turmaForm.vagas),
            status: turmaForm.status,
            editalResumo: turmaForm.editalResumo,
            dataInicioInscricoes: turmaForm.dataInicioInscricoes,
            dataFimInscricoes: turmaForm.dataFimInscricoes,
            dataInicioAulas: turmaForm.dataInicioGrade,
            dataConclusao: turmaForm.dataFimGrade,
            gradeHoraria: gradeData,
            disciplinasIds: turmaForm.selectedDisciplinasIds,
          };
        }
        return t;
      });
      onUpdateTurmas(updatedTurmas);

      if (isIdChanged) {
        if (onUpdateStudents && students) {
          const updatedStudents = students.map((s) =>
            s.turmaId === oldId ? { ...s, turmaId: cleanId } : s
          );
          onUpdateStudents(updatedStudents);
        }
        if (onUpdateUsers && users) {
          const updatedUsers = users.map((u) =>
            u.turmaId === oldId ? { ...u, turmaId: cleanId } : u
          );
          onUpdateUsers(updatedUsers);
        }
        if (onUpdateAvisos && avisos) {
          const updatedAvisos = avisos.map((a) =>
            a.turmaId === oldId ? { ...a, turmaId: cleanId } : a
          );
          onUpdateAvisos(updatedAvisos);
        }
        if (onUpdateDisciplinas && disciplinas) {
          const updatedDisciplinas = disciplinas.map((d) => {
            if (d.turmasIds && d.turmasIds.includes(oldId)) {
              return {
                ...d,
                turmasIds: d.turmasIds.map((tid) => (tid === oldId ? cleanId : tid)),
              };
            }
            return d;
          });
          onUpdateDisciplinas(updatedDisciplinas);
        }
        if (activeTurmaId === oldId) {
          setActiveTurmaId(cleanId);
        }
        showToast(`Turma atualizada com sucesso! Novo ID: "${cleanId}"`);
      } else {
        showToast(`Turma "${turmaForm.name}" atualizada com sucesso!`);
      }
    } else {
      const idExists = turmas.some((t) => t.id.toLowerCase() === cleanId.toLowerCase());
      if (idExists) {
        setIdError(`O ID "${cleanId}" já está em uso por outra turma.`);
        showToast(`O ID "${cleanId}" já está sendo utilizado por outra turma.`);
        return;
      }

      const newTurma: Turma = {
        id: cleanId,
        name: turmaForm.name,
        urlSlug: cleanSlug || cleanId.replace(/[^a-z0-9]/g, '') || `turma${new Date().getFullYear()}`,
        status: turmaForm.status,
        editalResumo: turmaForm.editalResumo,
        dataInicioInscricoes: turmaForm.dataInicioInscricoes,
        dataFimInscricoes: turmaForm.dataFimInscricoes,
        dataInicioAulas: turmaForm.dataInicioGrade,
        dataConclusao: turmaForm.dataFimGrade,
        vagas: Number(turmaForm.vagas),
        inscritosCount: 0,
        matriculadosCount: 0,
        gradeHoraria: gradeData,
        disciplinasIds: turmaForm.selectedDisciplinasIds,
      };
      onUpdateTurmas([newTurma, ...turmas]);
      setActiveTurmaId(cleanId);
      showToast(`Nova turma "${turmaForm.name}" criada com sucesso! (ID: ${cleanId})`);
    }

    setShowTurmaModal(false);
  };

  const handleConfirmDeleteTurma = () => {
    if (!turmaToDelete) return;
    const remaining = turmas.filter((t) => t.id !== turmaToDelete.id);
    onUpdateTurmas(remaining);
    if (activeTurmaId === turmaToDelete.id && remaining.length > 0) {
      setActiveTurmaId(remaining[0].id);
    }
    showToast(`Turma "${turmaToDelete.name}" excluída.`);
    setTurmaToDelete(null);
  };

  const handleToggleStatus = (turma: Turma, e: React.MouseEvent) => {
    e.stopPropagation();
    const nextStatus: TurmaStatus =
      turma.status === 'Em Andamento' ? 'Concluído' : turma.status === 'Concluído' ? 'Aberto' : 'Em Andamento';
    const updated = turmas.map((t) => (t.id === turma.id ? { ...t, status: nextStatus } : t));
    onUpdateTurmas(updated);
    showToast(`Status da ${turma.name} alterado para "${nextStatus}".`);
  };

  const handleEnterTurma = (turmaId: string) => {
    setActiveTurmaId(turmaId);
    setViewMode('gestao_interna');
    setInternalTab('mural');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCopyLink = (slug: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/${slug}`;
    navigator.clipboard.writeText(url);
    setCopiedSlug(slug);
    showToast(`Link da rota copiado: /${slug}`);
    setTimeout(() => setCopiedSlug(null), 2500);
  };

  // Mural Actions
  const handleOpenCreateAviso = () => {
    setAvisoToEdit(null);
    setNewAvisoTitulo('');
    setNewAvisoConteudo('');
    setNewAvisoLink('');
    setNewAvisoLinkTitulo('');
    setNewAvisoCategoria('Geral');
    setNewAvisoImportante(false);
    setShowAvisoModal(true);
  };

  const handleOpenEditAviso = (aviso: MuralAviso) => {
    if (isProfessorView && !isUserAvisoAuthor(aviso, effectiveCurrentUser)) {
      showToast('Você só pode editar avisos criados por você.');
      return;
    }
    setAvisoToEdit(aviso);
    setNewAvisoTitulo(aviso.titulo);
    setNewAvisoConteudo(aviso.conteudo);
    setNewAvisoLink(aviso.link || '');
    setNewAvisoLinkTitulo(aviso.linkTitulo || '');
    setNewAvisoCategoria((aviso.categoria as any) || 'Geral');
    setNewAvisoImportante(aviso.importante || false);
    setShowAvisoModal(true);
  };

  const handleSaveAviso = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAvisoTitulo.trim() || !newAvisoConteudo.trim() || !currentTurma) return;

    const rawLink = newAvisoLink.trim();
    const cleanLink = rawLink
      ? (rawLink.startsWith('http://') || rawLink.startsWith('https://') ? rawLink : `https://${rawLink}`)
      : undefined;
    const cleanLinkTitulo = cleanLink && newAvisoLinkTitulo.trim() ? newAvisoLinkTitulo.trim() : undefined;

    if (avisoToEdit) {
      if (isProfessorView && !isUserAvisoAuthor(avisoToEdit, effectiveCurrentUser)) {
        showToast('Você só pode editar avisos criados por você.');
        return;
      }
      if (!onUpdateAvisos) return;
      const updated = avisos.map((a) =>
        a.id === avisoToEdit.id
          ? {
              ...a,
              titulo: newAvisoTitulo.trim(),
              conteudo: newAvisoConteudo.trim(),
              categoria: newAvisoCategoria,
              link: cleanLink,
              linkTitulo: cleanLinkTitulo,
              importante: newAvisoImportante,
            }
          : a
      );
      onUpdateAvisos(updated);
      showToast('Aviso atualizado com sucesso!');
    } else {
      const now = new Date();
      const dataHora = `${now.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })} às ${now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;

      const authorName = isProfessorView
        ? (effectiveCurrentUser?.name || 'Professor Titular')
        : (effectiveCurrentUser?.name || 'Coordenação Geral • Escritores QGU');
      const authorRole = isProfessorView
        ? (effectiveCurrentUser?.roleLabel || 'Professor Titular')
        : 'Coordenação Teológica';
      const authorId = effectiveCurrentUser?.id || (isProfessorView ? 'user-prof-1' : 'user-admin-1');

      const newAviso: MuralAviso = {
        id: `aviso-${Date.now()}`,
        turmaId: currentTurma.id,
        titulo: newAvisoTitulo.trim(),
        conteudo: newAvisoConteudo.trim(),
        categoria: newAvisoCategoria,
        link: cleanLink,
        linkTitulo: cleanLinkTitulo,
        autorNome: authorName,
        autorRole: authorRole,
        autorId: authorId,
        data: dataHora,
        importante: newAvisoImportante,
      };

      if (onUpdateAvisos) {
        onUpdateAvisos([newAviso, ...avisos]);
      }
      showToast('Aviso publicado com sucesso no mural da turma!');
    }

    setAvisoToEdit(null);
    setNewAvisoTitulo('');
    setNewAvisoConteudo('');
    setNewAvisoLink('');
    setNewAvisoCategoria('Geral');
    setNewAvisoImportante(false);
    setShowAvisoModal(false);
  };

  const handleTogglePinAviso = (avisoId: string) => {
    const targetAviso = avisos.find((a) => a.id === avisoId);
    if (isProfessorView && targetAviso && !isUserAvisoAuthor(targetAviso, effectiveCurrentUser)) {
      showToast('Você só pode alterar avisos criados por você.');
      return;
    }
    if (!onUpdateAvisos) return;
    const updated = avisos.map((a) => (a.id === avisoId ? { ...a, importante: !a.importante } : a));
    onUpdateAvisos(updated);
    showToast('Status de destaque do aviso atualizado.');
  };

  const handleDeleteAviso = (avisoId: string) => {
    const targetAviso = avisos.find((a) => a.id === avisoId);
    if (isProfessorView && targetAviso && !isUserAvisoAuthor(targetAviso, effectiveCurrentUser)) {
      showToast('Você só pode excluir avisos criados por você.');
      return;
    }
    if (!onUpdateAvisos) return;
    const updated = avisos.filter((a) => a.id !== avisoId);
    onUpdateAvisos(updated);
    showToast('Aviso excluído do mural.');
  };

  // Professor Linkage Actions
  const getTurmaProfessorIds = (turma: Turma): string[] => {
    if (Array.isArray(turma.professorIds)) {
      return turma.professorIds;
    }
    const profsWithTurmaId = users
      .filter((u) => u.role === 'professor' && u.turmaId === turma.id)
      .map((u) => u.id);

    if (profsWithTurmaId.length > 0) return profsWithTurmaId;

    if (turma.id === 'turma-2026') {
      const defaultProf = users.find((u) => u.id === 'user-prof-1' || u.role === 'professor');
      return defaultProf ? [defaultProf.id] : [];
    }

    return [];
  };

  const handleOpenManageProfessors = (turma: Turma) => {
    setTurmaForProfessors(turma);
    setShowProfessorsModal(true);
  };

  const handleToggleProfessor = (profId: string, shouldLink: boolean) => {
    if (!turmaForProfessors) return;

    const profObj = users.find((u) => u.id === profId);
    const currentProfIds = getTurmaProfessorIds(turmaForProfessors);

    let newProfIds: string[];
    if (shouldLink) {
      newProfIds = Array.from(new Set([...currentProfIds, profId]));
    } else {
      newProfIds = currentProfIds.filter((id) => id !== profId);
    }

    // 1. Update Turma in turmas state
    const updatedTurmas = turmas.map((t) => {
      if (t.id === turmaForProfessors.id) {
        return {
          ...t,
          professorIds: newProfIds,
        };
      }
      return t;
    });
    onUpdateTurmas(updatedTurmas);

    // 2. Update active modal turma reference so UI reflects instantly
    setTurmaForProfessors((prev) => (prev ? { ...prev, professorIds: newProfIds } : null));

    // 3. Update User in users state
    if (onUpdateUsers) {
      const updatedUsers = users.map((u) => {
        if (u.id === profId) {
          return {
            ...u,
            turmaId: shouldLink ? turmaForProfessors.id : (u.turmaId === turmaForProfessors.id ? '' : u.turmaId),
          };
        }
        return u;
      });
      onUpdateUsers(updatedUsers);
    }

    showToast(
      shouldLink
        ? `Professor ${profObj?.name || ''} vinculado à turma com sucesso!`
        : `Professor ${profObj?.name || ''} desvinculado da turma!`
    );
  };

  // Formatador para exibir apenas Nome e Sobrenome
  const formatNomeSobrenome = (fullName: string) => {
    if (!fullName) return '';
    const parts = fullName.trim().split(/\s+/).filter(Boolean);
    if (parts.length <= 1) return fullName;
    return `${parts[0]} ${parts[parts.length - 1]}`;
  };

  // Média Geral Aritmética das notas das disciplinas (excluindo disciplinas marcadas como "Não terá notas")
  const getMediaAritmetica = (student: StudentAcademicRecord) => {
    if (student.notas && student.notas.length > 0) {
      const validNotas = student.notas.filter((n) => {
        const isSem = currentTurma
          ? isDisciplinaSemNotas(currentTurma.id, n.disciplinaId || '', n.moduloTitle)
          : false;
        return !isSem && n.nota !== undefined && n.nota !== null && !isNaN(Number(n.nota));
      });
      if (validNotas.length > 0) {
        const sum = validNotas.reduce((acc, n) => acc + (Number(n.nota) || 0), 0);
        return (sum / validNotas.length).toFixed(1);
      }
    }
    return '0.0';
  };

  // Frequência real calculada estritamente com base nas chamadas registradas nas aulas da turma
  const getFrequenciaReal = (student: StudentAcademicRecord): number => {
    if (!currentTurmaAulas || currentTurmaAulas.length === 0) {
      return 0;
    }
    const aulasComChamada = currentTurmaAulas.filter(
      (aula) => aula.presencas && Object.keys(aula.presencas).length > 0
    );
    if (aulasComChamada.length === 0) {
      return 0;
    }
    const presencasAluno = aulasComChamada.filter(
      (aula) => aula.presencas && aula.presencas[student.alunoId] === 'presente'
    ).length;
    return Math.round((presencasAluno / aulasComChamada.length) * 100);
  };

  // Atualização direta da situação do aluno ("Cursando" / "Formado")
  const handleSetStudentStatus = (studentId: string, newStatus: 'Cursando' | 'Formado') => {
    if (!onUpdateStudents) return;
    const updated = students.map((s) => {
      if (s.alunoId === studentId) {
        return { ...s, statusAcademico: newStatus };
      }
      return s;
    });
    onUpdateStudents(updated);
    showToast(`Situação do aluno atualizada para "${newStatus}".`);
  };

  // Student Grades & Attendance Actions
  const handleOpenGradeModal = (student: StudentAcademicRecord) => {
    setEditingStudent(student);
    setStudentNotaInput(student.mediaGeral);
    setStudentPresencasInput(student.presencas);
    setStudentStatusInput(student.statusAcademico);
  };

  const handleSaveStudentGrade = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent || !onUpdateStudents) return;

    const totalAulas = editingStudent.aulasTotais || 20;
    const freqCalc = Math.min(100, Math.round((studentPresencasInput / totalAulas) * 100));

    const updated = students.map((st) => {
      if (st.alunoId === editingStudent.alunoId) {
        return {
          ...st,
          mediaGeral: Number(studentNotaInput),
          presencas: Number(studentPresencasInput),
          frequenciaPercent: freqCalc,
          statusAcademico: studentStatusInput,
        };
      }
      return st;
    });

    onUpdateStudents(updated);
    setEditingStudent(null);
    showToast(`Notas e frequência de ${editingStudent.alunoName} atualizadas!`);
  };

  // Handlers para "Disciplinas, Notas e Relatórios"
  const handleOpenNotasDisciplina = (d: Disciplina) => {
    setSelectedDisciplinaForNotas(d);
    const initialInputs: Record<string, string> = {};
    turmaStudents.forEach((st) => {
      const existingGrade = (st.notas || []).find(
        (n) => n.disciplinaId === d.id || n.moduloTitle === d.nome
      );
      if (existingGrade !== undefined && existingGrade.nota !== undefined && existingGrade.nota !== null) {
        initialInputs[st.alunoId] = String(existingGrade.nota);
      } else {
        initialInputs[st.alunoId] = '';
      }
    });
    setNotasInputs(initialInputs);
    setShowNotasModal(true);
  };

  const handleToggleSemNotas = (d: Disciplina) => {
    if (!currentTurma) return;
    const currentIsSemNotas = isDisciplinaSemNotas(currentTurma.id, d.id, d.nome);
    const key = `${currentTurma.id}_${d.id}`;

    if (!currentIsSemNotas) {
      // 1. Marca como "Não terá notas"
      const nextSemNotas = {
        ...disciplinasSemNotas,
        [key]: true,
        [d.id]: true,
        [`${currentTurma.id}_${d.nome}`]: true,
      };
      setDisciplinasSemNotas(nextSemNotas);
      localStorage.setItem('escritores_qgu_disciplinas_sem_notas', JSON.stringify(nextSemNotas));

      // 2. Zera/remove as notas dos alunos nesta disciplina e recalcula a média geral
      if (onUpdateStudents) {
        const updated = students.map((st) => {
          if (st.turmaId === currentTurma.id || (!st.turmaId && currentTurma.id === 'turma-2026')) {
            const cleanNotas = (st.notas || []).filter(
              (n) => n.disciplinaId !== d.id && n.moduloTitle !== d.nome
            );
            const validNotas = cleanNotas.filter((n) => {
              const discSemNotas =
                nextSemNotas[`${currentTurma.id}_${n.disciplinaId}`] ||
                nextSemNotas[n.disciplinaId || ''] ||
                (n.moduloTitle && nextSemNotas[`${currentTurma.id}_${n.moduloTitle}`]);
              return !discSemNotas && n.nota !== undefined && n.nota !== null && !isNaN(Number(n.nota));
            });
            const newMedia =
              validNotas.length > 0
                ? Number((validNotas.reduce((acc, curr) => acc + Number(curr.nota), 0) / validNotas.length).toFixed(1))
                : 0;

            return {
              ...st,
              notas: cleanNotas,
              mediaGeral: newMedia,
            };
          }
          return st;
        });
        onUpdateStudents(updated);
      }

      // Limpa os campos no modal
      const clearedInputs: Record<string, string> = {};
      turmaStudents.forEach((st) => {
        clearedInputs[st.alunoId] = '';
      });
      setNotasInputs(clearedInputs);

      showToast(`Disciplina "${d.nome}" marcada como "Não terá notas". As notas dos alunos foram zeradas e removidas do cálculo da média geral.`);
    } else {
      // Reativa as notas
      const nextSemNotas = {
        ...disciplinasSemNotas,
        [key]: false,
        [d.id]: false,
        [`${currentTurma.id}_${d.nome}`]: false,
      };
      setDisciplinasSemNotas(nextSemNotas);
      localStorage.setItem('escritores_qgu_disciplinas_sem_notas', JSON.stringify(nextSemNotas));
      showToast(`Lançamento de notas reativado para a disciplina "${d.nome}".`);
    }
  };

  const handleSaveNotasForDisciplina = () => {
    if (!currentTurma || !selectedDisciplinaForNotas || !onUpdateStudents) return;
    const d = selectedDisciplinaForNotas;
    const isSemNotas = isDisciplinaSemNotas(currentTurma.id, d.id, d.nome);

    if (isSemNotas) {
      showToast('Esta disciplina está marcada como "Não terá notas". Reative as notas para poder lançá-las.');
      return;
    }

    const updated = students.map((st) => {
      if (st.turmaId === currentTurma.id || (!st.turmaId && currentTurma.id === 'turma-2026')) {
        const inputVal = notasInputs[st.alunoId];
        const existingNotas = (st.notas || []).filter(
          (n) => n.disciplinaId !== d.id && n.moduloTitle !== d.nome
        );

        if (inputVal !== undefined && inputVal.trim() !== '' && !isNaN(Number(inputVal))) {
          const numNota = Math.max(0, Math.min(10, Number(Number(inputVal).toFixed(1))));
          existingNotas.push({
            disciplinaId: d.id,
            moduloTitle: d.nome,
            moduloNumber: 1,
            nota: numNota,
            feedback: 'Nota lançada pelo professor',
            dataLancamento: new Date().toLocaleDateString('pt-BR'),
            professorName: currentTurma?.professorIds?.[0] || 'Professor Responsável',
          });
        }

        const validNotas = existingNotas.filter((n) => {
          const discSemNotas =
            disciplinasSemNotas[`${currentTurma.id}_${n.disciplinaId}`] ||
            disciplinasSemNotas[n.disciplinaId || ''] ||
            (n.moduloTitle && disciplinasSemNotas[`${currentTurma.id}_${n.moduloTitle}`]);
          return !discSemNotas && n.nota !== undefined && n.nota !== null && !isNaN(Number(n.nota));
        });

        const newMedia =
          validNotas.length > 0
            ? Number((validNotas.reduce((acc, curr) => acc + Number(curr.nota), 0) / validNotas.length).toFixed(1))
            : st.mediaGeral;

        return {
          ...st,
          notas: existingNotas,
          mediaGeral: newMedia,
        };
      }
      return st;
    });

    onUpdateStudents(updated);
    setShowNotasModal(false);
    showToast(`Notas da disciplina "${d.nome}" salvas e médias atualizadas com sucesso!`);
  };

  const handleExportDisciplinaCSV = (d: Disciplina) => {
    if (isProfessorView || !currentTurma) return;
    const isSemNotas = isDisciplinaSemNotas(currentTurma.id, d.id, d.nome);
    const headers = [
      'Matrícula',
      'Nome do Aluno',
      'Campo/Supervisão',
      'Frequência (%)',
      'Nota na Disciplina',
      'Situação da Disciplina',
      'Média Geral Atual',
      'Situação do Aluno',
    ];

    const rows = turmaStudents.map((st) => {
      const grade = (st.notas || []).find(
        (n) => n.disciplinaId === d.id || n.moduloTitle === d.nome
      );
      const notaDisplay = isSemNotas
        ? 'Não se aplica'
        : grade && grade.nota !== undefined
        ? Number(grade.nota).toFixed(1)
        : 'Sem nota';

      return [
        `"${st.matricula}"`,
        `"${formatNomeSobrenome(st.alunoName).replace(/"/g, '""')}"`,
        `"${(st.polo || 'Campo Central').replace(/"/g, '""')}"`,
        `"${st.frequenciaPercent}%"`,
        `"${notaDisplay}"`,
        `"${isSemNotas ? 'Não terá notas' : 'Avaliada'}"`,
        st.mediaGeral !== undefined ? Number(st.mediaGeral).toFixed(1) : '0.0',
        `"${st.statusAcademico}"`,
      ];
    });

    const csvContent =
      '\uFEFF' +
      `"RELATÓRIO DE DESEMPENHO POR DISCIPLINA - COMIEADEPA / ESCRITORES QGU"\n` +
      `"Turma: ${currentTurma.name}"\n` +
      `"Disciplina: ${d.nome} (${d.codigo || d.id})"\n` +
      `"Status de Avaliação: ${isSemNotas ? 'Não terá notas (Sem notas atribuídas)' : 'Com notas'}"\n` +
      `"Total de Alunos Matriculados: ${turmaStudents.length}"\n` +
      `"Data de Emissão: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}"\n\n` +
      headers.join(';') +
      '\n' +
      rows.map((r) => r.join(';')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `Relatorio_${(d.codigo || d.id).replace(/\s+/g, '_')}_${currentTurma.urlSlug || 'turma'}_${Date.now()}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Planilha CSV da disciplina "${d.nome}" gerada com sucesso!`);
  };

  const handleDownloadDisciplinaPDF = (d: Disciplina) => {
    if (!currentTurma) return;
    try {
      const isSemNotas = isDisciplinaSemNotas(currentTurma.id, d.id, d.nome);
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      doc.setFillColor(18, 61, 0); // #123d00
      doc.rect(0, 0, 210, 8, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(15);
      doc.setTextColor(8, 37, 0);
      doc.text('COMIEADEPA • CONVENÇÃO DE MINISTROS', 14, 20);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(100, 96, 41); // #646029
      doc.text('PROGRAMA OFICIAL ESCRITORES QGU — RELATÓRIO DA DISCIPLINA', 14, 26);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(82, 89, 77);
      doc.text(`Emissão oficial em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 14, 31);

      doc.setDrawColor(194, 201, 185);
      doc.setLineWidth(0.4);
      doc.line(14, 34, 196, 34);

      doc.setFillColor(244, 246, 240); // #f4f6f0
      doc.roundedRect(14, 38, 182, 24, 2, 2, 'F');
      doc.setDrawColor(194, 201, 185);
      doc.roundedRect(14, 38, 182, 24, 2, 2, 'S');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(8, 37, 0);
      doc.text(`Disciplina: ${d.nome}`, 18, 45);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(82, 89, 77);
      doc.text(`Turma: ${currentTurma.name} (${currentTurma.urlSlug})`, 18, 51);
      doc.text(`Carga Horária: ${d.cargaHoraria || 40}h  •  Alunos Matriculados: ${turmaStudents.length}`, 18, 57);

      doc.setFont('helvetica', 'bold');
      if (isSemNotas) {
        doc.setTextColor(180, 83, 9);
        doc.text('SITUAÇÃO: NÃO TERÁ NOTAS', 125, 45);
      } else {
        doc.setTextColor(21, 128, 61);
        doc.text('SITUAÇÃO: NOTAS AVALIADAS', 125, 45);
      }

      const tableData = turmaStudents.map((st) => {
        const grade = (st.notas || []).find(
          (n) => n.disciplinaId === d.id || n.moduloTitle === d.nome
        );
        const notaStr = isSemNotas
          ? 'Não terá notas'
          : grade && grade.nota !== undefined
          ? Number(grade.nota).toFixed(1)
          : 'Sem nota';

        return [
          st.matricula,
          formatNomeSobrenome(st.alunoName),
          st.polo || 'Campo Central',
          `${st.frequenciaPercent}%`,
          notaStr,
          st.statusAcademico,
        ];
      });

      autoTable(doc, {
        startY: 68,
        head: [['Matrícula', 'Nome do Aluno', 'Campo/Supervisão', 'Frequência', 'Nota na Matéria', 'Situação']],
        body: tableData,
        theme: 'grid',
        headStyles: {
          fillColor: [18, 61, 0],
          textColor: [255, 255, 255],
          fontSize: 8.5,
          fontStyle: 'bold',
          halign: 'left',
        },
        bodyStyles: {
          fontSize: 8,
          textColor: [8, 37, 0],
        },
        alternateRowStyles: {
          fillColor: [248, 250, 244],
        },
        columnStyles: {
          0: { cellWidth: 30, halign: 'left', fontStyle: 'bold' },
          1: { cellWidth: 46, halign: 'left', fontStyle: 'bold' },
          2: { cellWidth: 42, halign: 'left' },
          3: { cellWidth: 20, halign: 'center' },
          4: { cellWidth: 24, halign: 'center', fontStyle: 'bold' },
          5: { cellWidth: 20, halign: 'center' },
        },
        margin: { left: 14, right: 14 },
      });

      const pageHeight = doc.internal.pageSize.getHeight();
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(115, 121, 108);
      doc.text(
        'Documento emitido automaticamente pelo Sistema Acadêmico QGU / COMIEADEPA. Válido para arquivo institucional.',
        14,
        pageHeight - 10
      );

      doc.save(`Relatorio_Disciplina_${(d.codigo || d.id).replace(/\s+/g, '_')}_${currentTurma.urlSlug}.pdf`);
      showToast(`Relatório em PDF da disciplina "${d.nome}" gerado com sucesso!`);
    } catch (err) {
      console.error(err);
      showToast('Erro ao gerar relatório em PDF da disciplina.');
    }
  };

  const handleGoToFrequencia = () => {
    setTurmasSubTab('monitoramento');
    if (viewMode !== 'gestao_interna') {
      setViewMode('gestao_interna');
    }
    setInternalTab('frequencia');
    showToast(`Frequência dos Alunos - ${currentTurma?.name || 'Turma'}`);
  };

  const handleGoToNotas = () => {
    setTurmasSubTab('monitoramento');
    if (viewMode !== 'gestao_interna') {
      setViewMode('gestao_interna');
    }
    setInternalTab('notas');
    showToast(`Lançamento de Notas - ${currentTurma?.name || 'Turma'}`);
  };

  const handleQuickAdjustPresenca = (alunoId: string, delta: number) => {
    if (!onUpdateStudents) return;
    const target = students.find((s) => s.alunoId === alunoId);
    if (!target) return;
    const totalAulas = target.aulasTotais || 20;
    const newPresencas = Math.max(0, Math.min(totalAulas, target.presencas + delta));
    const newFreq = Math.min(100, Math.round((newPresencas / totalAulas) * 100));

    const updated = students.map((s) =>
      s.alunoId === alunoId
        ? {
            ...s,
            presencas: newPresencas,
            frequenciaPercent: newFreq,
          }
        : s
    );
    onUpdateStudents(updated);
    showToast(`Presenças de ${target.alunoName}: ${newPresencas}/${totalAulas} aulas (${newFreq}%)`);
  };

  const handleOpenBatchChamada = () => {
    const initialMap: Record<string, boolean> = {};
    turmaStudents.forEach((st) => {
      initialMap[st.alunoId] = true;
    });
    setChamadaPresentesMap(initialMap);
    setShowBatchChamadaModal(true);
  };

  const handleSaveBatchChamada = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onUpdateStudents || !currentTurma) return;

    const updated = students.map((st) => {
      if (st.turmaId === currentTurma.id || (!st.turmaId && currentTurma.id === 'turma-2026')) {
        const isPresente = chamadaPresentesMap[st.alunoId] ?? true;
        const totalAulas = st.aulasTotais || 20;
        const newPresencas = isPresente
          ? Math.min(totalAulas, st.presencas + 1)
          : st.presencas;
        const newFreq = Math.min(100, Math.round((newPresencas / totalAulas) * 100));
        return {
          ...st,
          presencas: newPresencas,
          frequenciaPercent: newFreq,
        };
      }
      return st;
    });

    onUpdateStudents(updated);
    setShowBatchChamadaModal(false);
    showToast('Chamada registrada e frequências atualizadas com sucesso!');
  };

  const handleSetAll100Frequencia = () => {
    if (!onUpdateStudents || !currentTurma) return;
    const updated = students.map((st) => {
      if (st.turmaId === currentTurma.id || (!st.turmaId && currentTurma.id === 'turma-2026')) {
        const totalAulas = st.aulasTotais || 20;
        return {
          ...st,
          presencas: totalAulas,
          frequenciaPercent: 100,
        };
      }
      return st;
    });
    onUpdateStudents(updated);
    showToast(`100% de frequência atribuído a todos os ${turmaStudents.length} alunos!`);
  };

  const handleOpenBatchGrades = () => {
    const map: Record<string, number> = {};
    turmaStudents.forEach((st) => {
      map[st.alunoId] = st.mediaGeral;
    });
    setBatchGradesMap(map);
    setShowBatchGradesModal(true);
  };

  const handleSaveBatchGrades = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onUpdateStudents || !currentTurma) return;

    const updated = students.map((st) => {
      if ((st.turmaId === currentTurma.id || (!st.turmaId && currentTurma.id === 'turma-2026')) && batchGradesMap[st.alunoId] !== undefined) {
        const grade = batchGradesMap[st.alunoId];
        let status: 'Cursando' | 'Formado' | 'Aprovado' | 'Em Recuperação' = st.statusAcademico;
        if (grade >= 7.0) status = 'Aprovado';
        else if (grade < 7.0 && grade > 0) status = 'Em Recuperação';
        return {
          ...st,
          mediaGeral: grade,
          statusAcademico: status,
        };
      }
      return st;
    });

    onUpdateStudents(updated);
    setShowBatchGradesModal(false);
    showToast('Notas de todos os alunos lançadas com sucesso!');
  };

  const handleEnrollStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName.trim() || !currentTurma || !onUpdateStudents) return;

    const names = newStudentName.trim().split(' ').filter(Boolean);
    const initials =
      names.length > 1
        ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase()
        : names[0]?.slice(0, 2).toUpperCase() || 'AL';

    const cleanSlugPart = names
      .join('.')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9.]/g, '');

    const newStudentId = `user-aluno-${Date.now()}`;
    const nextMatricula = `MAT-${new Date().getFullYear()}-${String(turmaStudents.length + 1).padStart(3, '0')}`;
    const cleanEmail =
      newStudentEmail.trim() ||
      `${cleanSlugPart || 'aluno' + Date.now()}@comieadepa.org.br`;
    const cleanPhone = newStudentPhone.trim() || '';
    const routeSlug = `/aluno-${cleanSlugPart || nextMatricula.toLowerCase()}`;

    // 1. Criação do Usuário no Sistema (SystemUser) para o aluno
    const newSystemUser: SystemUser = {
      id: newStudentId,
      name: newStudentName.trim(),
      email: cleanEmail,
      whatsapp: cleanPhone,
      role: 'aluno',
      roleLabel: 'ALUNO VOCACIONADO',
      password: 'comieadepa2026',
      initials,
      routeSlug,
      turmaId: currentTurma.id,
      campoSupervisao: newStudentPolo.trim() || 'Geral',
      polo: newStudentPolo.trim() || 'Geral',
      matricula: nextMatricula,
      status: 'Ativo',
    };

    if (onUpdateUsers) {
      onUpdateUsers([newSystemUser, ...users]);
    }

    // 2. Registro Acadêmico do Aluno na Turma (inicia limpo sem notas ou faltas fictícias)
    const newStudent: StudentAcademicRecord = {
      alunoId: newStudentId,
      alunoName: newStudentName.trim(),
      matricula: nextMatricula,
      turmaId: currentTurma.id,
      polo: newStudentPolo.trim() || 'Geral',
      frequenciaPercent: 0,
      presencas: 0,
      aulasTotais: 0,
      submissions: [],
      notas: [],
      mediaGeral: 0,
      statusAcademico: 'Cursando',
    };

    onUpdateStudents([...students, newStudent]);

    // 3. Atualiza contagem de matriculados na turma
    const updatedTurmas = turmas.map((t) =>
      t.id === currentTurma.id
        ? { ...t, matriculadosCount: (t.matriculadosCount || 0) + 1 }
        : t
    );
    onUpdateTurmas(updatedTurmas);

    setNewStudentName('');
    setNewStudentEmail('');
    setNewStudentPhone('');
    setNewStudentPolo('Campo Central - Belém/PA');
    setShowEnrollModal(false);
    showToast(`Aluno ${newStudent.alunoName} matriculado e usuário de acesso criado com sucesso!`);
  };

  const handleRemoveStudent = (student: StudentAcademicRecord) => {
    if (!onUpdateStudents) return;
    const studentName = formatNomeSobrenome(student.alunoName);
    if (
      window.confirm(
        `Tem certeza que deseja desmatricular o aluno ${studentName} e remover seu usuário de acesso do sistema?`
      )
    ) {
      // 1. Remove da lista de registros acadêmicos de estudantes
      const updatedStudents = students.filter(
        (s) => s.alunoId !== student.alunoId && (!student.matricula || s.matricula !== student.matricula)
      );
      onUpdateStudents(updatedStudents);

      // 2. Remove o usuário correspondente do sistema (busca por ID, matrícula, rota ou nome)
      if (onUpdateUsers) {
        const studentNormName = (student.alunoName || '').trim().toLowerCase();
        const studentMatricula = (student.matricula || '').trim().toLowerCase();
        const studentCleanMat = studentMatricula.replace(/[^a-z0-9]/gi, '');

        const updatedUsers = users.filter((u) => {
          // Correspondência direta pelo ID do usuário
          if (u.id === student.alunoId) return false;

          // Correspondência pela matrícula
          if (studentMatricula && u.matricula) {
            const uMat = u.matricula.trim().toLowerCase();
            if (uMat === studentMatricula) return false;
            if (studentCleanMat && uMat.replace(/[^a-z0-9]/gi, '') === studentCleanMat) return false;
          }

          // Correspondência por slug da rota (ex: /turma2026-1024)
          if (studentCleanMat && u.routeSlug && u.role === 'aluno') {
            const cleanSlug = u.routeSlug.replace(/[^a-z0-9]/gi, '').toLowerCase();
            if (cleanSlug.includes(studentCleanMat) || studentCleanMat.includes(cleanSlug)) {
              return false;
            }
          }

          // Correspondência pelo nome do usuário caso seja perfil aluno
          if (u.role === 'aluno' && studentNormName && u.name) {
            const uNormName = u.name.trim().toLowerCase();
            if (uNormName === studentNormName) return false;
          }

          return true;
        });

        onUpdateUsers(updatedUsers);

        try {
          localStorage.setItem('escritores_qgu_system_users', JSON.stringify(updatedUsers));
          localStorage.setItem('escritores_qgu_students', JSON.stringify(updatedStudents));
        } catch {}
      }

      // 3. Atualiza contagem de matriculados na turma
      if (currentTurma && onUpdateTurmas) {
        const updatedTurmas = turmas.map((t) =>
          t.id === currentTurma.id
            ? { ...t, matriculadosCount: Math.max(0, (t.matriculadosCount || 1) - 1) }
            : t
        );
        onUpdateTurmas(updatedTurmas);
      }

      showToast(`Aluno ${studentName} e seu usuário foram removidos do sistema com sucesso!`);
    }
  };

  // Export CSV Report
  const handleExportCSV = (turma: Turma) => {
    const headers = [
      'Matrícula',
      'Nome do Aluno Vocacionado',
      'Campo',
      'Frequência (%)',
      'Presenças',
      'Aulas Totais',
      'Média Geral',
      'Situação Acadêmica',
    ];

    const rows = turmaStudents.map((s) => [
      `"${s.matricula}"`,
      `"${s.alunoName.replace(/"/g, '""')}"`,
      `"${s.polo.replace(/"/g, '""')}"`,
      `"${s.frequenciaPercent}%"`,
      s.presencas,
      s.aulasTotais,
      s.mediaGeral.toFixed(1),
      `"${s.statusAcademico}"`,
    ]);

    const gradeDesc = turma.gradeHoraria
      ? `${turma.gradeHoraria.diaSemana}, ${turma.gradeHoraria.horario} (${turma.gradeHoraria.dataInicio} a ${turma.gradeHoraria.dataFim})`
      : 'Quintas-feiras, 20h00 (01/10/2026 a 10/12/2026)';

    const csvContent =
      '\uFEFF' +
      `"RELATÓRIO CONSOLIDADO ACADÊMICO - COMIEADEPA / ESCRITORES QGU"\n` +
      `"Turma: ${turma.name}"\n` +
      `"Rota Oficial: /${turma.urlSlug}"\n` +
      `"Grade Horária: ${gradeDesc}"\n` +
      `"Status da Edição: ${turma.status}"\n` +
      `"Total de Alunos Ativos: ${turmaStudents.length}"\n` +
      `"Data de Emissão: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}"\n\n` +
      headers.join(';') +
      '\n' +
      rows.map((r) => r.join(';')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Relatorio_Consolidado_${turma.urlSlug || 'turma'}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Planilha consolidada (.CSV) gerada e baixada com sucesso!');
  };

  // Download PDF Report
  const handleDownloadPDF = (turma: Turma) => {
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      // Faixa institucional superior
      doc.setFillColor(18, 61, 0); // #123d00
      doc.rect(0, 0, 210, 8, 'F');

      // Título e identificação institucional
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(8, 37, 0);
      doc.text('COMIEADEPA • CONVENÇÃO DE MINISTROS', 14, 20);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(100, 96, 41); // #646029
      doc.text('PROGRAMA OFICIAL ESCRITORES QGU — TREINAMENTO TEOLÓGICO', 14, 26);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(82, 89, 77);
      doc.text('Relatório Oficial de Alunos Matriculados e Desempenho Acadêmico', 14, 31);

      // Linha divisória
      doc.setDrawColor(194, 201, 185);
      doc.setLineWidth(0.4);
      doc.line(14, 34, 196, 34);

      // Bloco com dados da turma
      doc.setFillColor(244, 246, 240);
      doc.roundedRect(14, 37, 182, 20, 2, 2, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(8, 37, 0);
      doc.text(`TURMA: ${turma.name} (ID: ${turma.id})`, 18, 43);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(82, 89, 77);
      const gradeDesc = turma.gradeHoraria
        ? `${turma.gradeHoraria.diaSemana}, ${turma.gradeHoraria.horario} (${turma.gradeHoraria.dataInicio} a ${turma.gradeHoraria.dataFim})`
        : 'Quintas-feiras, 20h00';
      doc.text(`Grade Horária: ${gradeDesc} • Status da Turma: ${turma.status}`, 18, 48);

      const totalMatriculados = turmaStudents.length;
      const totalAprovados = turmaStudents.filter(
        (s) => s.statusAcademico === 'Aprovado' || s.mediaGeral >= 7.0
      ).length;
      const mediaGeralTurma =
        turmaStudents.length > 0
          ? (turmaStudents.reduce((acc, s) => acc + s.mediaGeral, 0) / turmaStudents.length).toFixed(1)
          : '0.0';

      doc.text(
        `Alunos Matriculados: ${totalMatriculados} • Aprovados: ${totalAprovados} • Média Geral: ${mediaGeralTurma}`,
        18,
        53
      );

      // Tabela de Alunos
      const tableHeaders = [
        ['#', 'Matrícula', 'Aluno Vocacionado', 'Campo / Polo', 'Freq. (%)', 'Média', 'Situação'],
      ];

      const tableRows = turmaStudents.map((st, idx) => [
        String(idx + 1),
        st.matricula,
        st.alunoName,
        st.polo || 'Belém Central',
        `${st.frequenciaPercent}% (${st.presencas}/${st.aulasTotais || 20})`,
        st.mediaGeral.toFixed(1),
        st.statusAcademico,
      ]);

      autoTable(doc, {
        head: tableHeaders,
        body: tableRows,
        startY: 61,
        theme: 'grid',
        headStyles: {
          fillColor: [18, 61, 0],
          textColor: [255, 255, 255],
          fontSize: 8,
          fontStyle: 'bold',
          halign: 'left',
        },
        bodyStyles: {
          fontSize: 7.5,
          textColor: [25, 28, 25],
        },
        alternateRowStyles: {
          fillColor: [248, 250, 244],
        },
        columnStyles: {
          0: { cellWidth: 8, halign: 'center' },
          1: { cellWidth: 26, fontStyle: 'bold' },
          2: { cellWidth: 50, fontStyle: 'bold' },
          3: { cellWidth: 40 },
          4: { cellWidth: 24, halign: 'center' },
          5: { cellWidth: 14, halign: 'center', fontStyle: 'bold' },
          6: { cellWidth: 20, halign: 'center' },
        },
        didDrawPage: (data) => {
          const pageSize = doc.internal.pageSize;
          const pageHeight = pageSize.height || pageSize.getHeight();
          doc.setFontSize(7.5);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(115, 121, 108);
          doc.text(
            `Quartel General UMADESPA • Escritores QGU — Página ${data.pageNumber} • Emitido em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`,
            14,
            pageHeight - 8
          );
        },
      });

      // Assinaturas no rodapé
      const finalY = (doc as any).lastAutoTable?.finalY || 160;
      const pageHeight = doc.internal.pageSize.getHeight();
      let signatureY = finalY + 20;

      if (signatureY + 24 > pageHeight - 15) {
        doc.addPage();
        signatureY = 35;
      }

      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.3);
      doc.line(30, signatureY, 85, signatureY);
      doc.line(125, signatureY, 180, signatureY);

      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(8, 37, 0);
      doc.text('Coordenação Geral', 57.5, signatureY + 4, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 100, 100);
      doc.text('LUCAS PIMENTA', 57.5, signatureY + 8, { align: 'center' });

      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(8, 37, 0);
      doc.text('Diretoria QGU • COMIEADEPA', 152.5, signatureY + 4, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 100, 100);
      doc.text('Pr. Jesiel Calderaro', 152.5, signatureY + 8, { align: 'center' });

      // Dispara download do arquivo PDF
      const cleanSlug = (turma.urlSlug || turma.name || 'turma').replace(/[^a-zA-Z0-9_-]/g, '_');
      const dateStr = new Date().toISOString().slice(0, 10);
      const fileName = `Relatorio_Alunos_${cleanSlug}_${dateStr}.pdf`;
      doc.save(fileName);

      showToast('Relatório em PDF gerado e baixado com sucesso!');
    } catch (err) {
      console.error('Erro ao gerar PDF:', err);
      onOpenReportModal(turma.id);
      showToast('Abrindo relatório oficial para impressão / PDF...');
    }
  };

  const handleToggleLiberaDisciplina = (disciplinaId: string, disciplinaNome: string) => {
    if (!currentTurma) return;

    // Se ainda não tiver disciplinasLiberadasIds configurado, assume inicialmente as vinculadas ou padrão
    const currentLiberadas =
      currentTurma.disciplinasLiberadasIds !== undefined
        ? currentTurma.disciplinasLiberadasIds
        : (currentTurma.disciplinasIds || ['disc-1', 'disc-2']);

    const isCurrentlyLiberada = currentLiberadas.includes(disciplinaId);

    const updatedLiberadas = isCurrentlyLiberada
      ? currentLiberadas.filter((id) => id !== disciplinaId)
      : [...currentLiberadas, disciplinaId];

    const updatedTurmas = turmas.map((t) =>
      t.id === currentTurma.id
        ? { ...t, disciplinasLiberadasIds: updatedLiberadas }
        : t
    );

    onUpdateTurmas(updatedTurmas);
    showToast(
      isCurrentlyLiberada
        ? `Disciplina "${disciplinaNome}" foi bloqueada para os alunos.`
        : `Disciplina "${disciplinaNome}" foi liberada para os alunos!`
    );
  };

  const handleOpenMaterialExtra = (disciplina: Disciplina) => {
    setSelectedDisciplinaForExtra(disciplina);
    setEditingExtraId(null);
    setNewExtraCategoria('documento');
    setNewExtraTitulo('');
    setNewExtraTipo('pdf');
    setNewExtraUrl('');
    setNewExtraDescricao('');
    setNewExtraFile(null);
    setNewExtraFileName('');
    setNewExtraFileSize('');
    setShowMaterialExtraModal(true);
  };

  const suggestTitleFromUrl = (url: string): string => {
    const trimmed = url.trim().toLowerCase();
    if (!trimmed) return '';
    if (trimmed.includes('docs.google.com/document')) return 'Documento Google Docs';
    if (trimmed.includes('docs.google.com/presentation')) return 'Apresentação Google Slides';
    if (trimmed.includes('docs.google.com/spreadsheets')) return 'Planilha Google Sheets';
    if (trimmed.includes('docs.google.com/forms')) return 'Formulário de Avaliação';
    if (trimmed.includes('drive.google.com')) return 'Pasta no Google Drive';
    if (trimmed.includes('youtube.com') || trimmed.includes('youtu.be')) return 'Vídeo Aula no YouTube';
    if (trimmed.includes('meet.google.com')) return 'Sala Google Meet';
    if (trimmed.includes('zoom.us')) return 'Sala Virtual Zoom';
    if (trimmed.includes('canva.com')) return 'Material Gráfico Canva';
    if (trimmed.includes('notion.site') || trimmed.includes('notion.so')) return 'Página no Notion';

    try {
      const fullUrl = /^https?:\/\//i.test(url.trim()) ? url.trim() : `https://${url.trim()}`;
      const parsed = new URL(fullUrl);
      const host = parsed.hostname.replace(/^www\./, '');
      return `Link Externo (${host})`;
    } catch {
      return 'Link Complementar de Estudos';
    }
  };

  const handleStartInlineTitle = (item: TurmaMaterialExtra) => {
    setInlineEditingId(item.id);
    setInlineEditingTitle(item.titulo);
  };

  const handleCancelInlineTitle = () => {
    setInlineEditingId(null);
    setInlineEditingTitle('');
  };

  const handleSaveInlineTitle = (itemId: string) => {
    if (!currentTurma) return;
    const trimmed = inlineEditingTitle.trim();
    if (!trimmed) {
      showToast('Por favor, informe um título válido para o link.');
      return;
    }
    const currentExtras = currentTurma.materiaisExtras || [];
    const updatedExtras = currentExtras.map((m) =>
      m.id === itemId ? { ...m, titulo: trimmed } : m
    );
    const updatedTurmas = turmas.map((t) =>
      t.id === currentTurma.id ? { ...t, materiaisExtras: updatedExtras } : t
    );
    onUpdateTurmas(updatedTurmas);
    setInlineEditingId(null);
    setInlineEditingTitle('');
    showToast(`Título do link atualizado para "${trimmed}"!`);
  };

  const handleStartEditMaterialExtra = (item: TurmaMaterialExtra) => {
    setEditingExtraId(item.id);
    setNewExtraTitulo(item.titulo);
    setNewExtraDescricao(item.descricao || '');
    setNewExtraUrl(item.url || '');
    if (item.tipo === 'link') {
      setNewExtraCategoria('link');
      setNewExtraTipo('link');
      setNewExtraFile(null);
      setNewExtraFileName('');
      setNewExtraFileSize('');
    } else {
      setNewExtraCategoria('documento');
      setNewExtraTipo(item.tipo as 'pdf' | 'doc' | 'ppt');
      setNewExtraFileName(item.nomeArquivo || item.titulo);
      setNewExtraFileSize(item.tamanho || '1.8 MB');
      setNewExtraFile(null);
    }
    setTimeout(() => {
      extraTituloInputRef.current?.focus();
      extraTituloInputRef.current?.select();
      extraFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 60);
  };

  const handleCancelEditMaterialExtra = () => {
    setEditingExtraId(null);
    setNewExtraTitulo('');
    setNewExtraUrl('');
    setNewExtraDescricao('');
    setNewExtraFile(null);
    setNewExtraFileName('');
    setNewExtraFileSize('');
  };

  const handleExtraFilePicked = (file: File) => {
    const fileName = file.name;
    const ext = fileName.substring(fileName.lastIndexOf('.')).toLowerCase();
    const allowed = ['.pdf', '.docx', '.doc', '.ppt', '.pptx'];
    if (!allowed.includes(ext)) {
      showToast('Formato não suportado: envie arquivos .pdf, .docx, .doc, PPT ou PPTX.');
      return;
    }

    let detectedTipo: 'pdf' | 'doc' | 'ppt' = 'pdf';
    if (ext === '.docx' || ext === '.doc') detectedTipo = 'doc';
    else if (ext === '.ppt' || ext === '.pptx') detectedTipo = 'ppt';
    else detectedTipo = 'pdf';

    const sizeInMb = (file.size / (1024 * 1024)).toFixed(1);
    const sizeStr = file.size >= 1024 * 1024 ? `${sizeInMb} MB` : `${Math.max(1, Math.round(file.size / 1024))} KB`;

    setNewExtraFile(file);
    setNewExtraFileName(fileName);
    setNewExtraFileSize(sizeStr);
    setNewExtraTipo(detectedTipo);

    if (!newExtraTitulo.trim()) {
      const cleanTitle = fileName.replace(/\.[^/.]+$/, '');
      setNewExtraTitulo(cleanTitle);
    }

    try {
      const blobUrl = URL.createObjectURL(file);
      setNewExtraUrl(blobUrl);
    } catch {
      setNewExtraUrl('');
    }
  };

  const handleSaveMaterialExtra = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTurma || !selectedDisciplinaForExtra) return;

    if (!newExtraTitulo.trim()) {
      showToast('Por favor, informe o título do material.');
      return;
    }

    if (newExtraCategoria === 'documento' && !newExtraFile && !newExtraUrl && !editingExtraId) {
      showToast('Por favor, selecione um arquivo (.pdf, .docx, .doc, PPT ou PPTX).');
      return;
    }

    if (newExtraCategoria === 'link' && !newExtraUrl.trim()) {
      showToast('Por favor, insira o link de acesso.');
      return;
    }

    let finalUrl = newExtraUrl.trim();
    if (newExtraCategoria === 'link' && finalUrl && !/^https?:\/\//i.test(finalUrl)) {
      finalUrl = `https://${finalUrl}`;
    }

    if (editingExtraId) {
      const currentExtras = currentTurma.materiaisExtras || [];
      const updatedExtras = currentExtras.map((m) => {
        if (m.id === editingExtraId) {
          return {
            ...m,
            titulo: newExtraTitulo.trim(),
            tipo: newExtraCategoria === 'link' ? 'link' : newExtraTipo,
            url: finalUrl || m.url,
            descricao: newExtraDescricao.trim() || undefined,
            tamanho: newExtraCategoria === 'documento' ? (newExtraFileSize || m.tamanho || '1.8 MB') : undefined,
            nomeArquivo: newExtraFileName || m.nomeArquivo,
          };
        }
        return m;
      });

      const updatedTurmas = turmas.map((t) =>
        t.id === currentTurma.id ? { ...t, materiaisExtras: updatedExtras } : t
      );

      onUpdateTurmas(updatedTurmas);
      setEditingExtraId(null);
      setNewExtraTitulo('');
      setNewExtraUrl('');
      setNewExtraDescricao('');
      setNewExtraFile(null);
      setNewExtraFileName('');
      setNewExtraFileSize('');
      showToast(`${newExtraCategoria === 'link' ? 'Link' : 'Documento'} "${newExtraTitulo.trim()}" atualizado com sucesso!`);
      return;
    }

    const newMaterial: TurmaMaterialExtra = {
      id: `mat-extra-${Date.now()}`,
      turmaId: currentTurma.id,
      disciplinaId: selectedDisciplinaForExtra.id,
      titulo: newExtraTitulo.trim(),
      tipo: newExtraCategoria === 'link' ? 'link' : newExtraTipo,
      url: finalUrl || undefined,
      descricao: newExtraDescricao.trim() || undefined,
      dataUpload: new Date().toLocaleDateString('pt-BR'),
      tamanho: newExtraCategoria === 'documento' ? (newExtraFileSize || '1.8 MB') : undefined,
      nomeArquivo: newExtraFileName || undefined,
      autorNome: 'Coordenação Teológica',
    };

    const currentExtras = currentTurma.materiaisExtras || [];
    const updatedExtras = [newMaterial, ...currentExtras];

    const updatedTurmas = turmas.map((t) =>
      t.id === currentTurma.id ? { ...t, materiaisExtras: updatedExtras } : t
    );

    onUpdateTurmas(updatedTurmas);
    setNewExtraTitulo('');
    setNewExtraUrl('');
    setNewExtraDescricao('');
    setNewExtraFile(null);
    setNewExtraFileName('');
    setNewExtraFileSize('');
    showToast(`${newExtraCategoria === 'link' ? 'Link' : 'Documento'} "${newMaterial.titulo}" adicionado à turma ${currentTurma.name}!`);
  };

  const handleDeleteMaterialExtra = (materialId: string, titulo: string) => {
    if (!currentTurma) return;
    const currentExtras = currentTurma.materiaisExtras || [];
    const updatedExtras = currentExtras.filter((m) => m.id !== materialId);

    const updatedTurmas = turmas.map((t) =>
      t.id === currentTurma.id ? { ...t, materiaisExtras: updatedExtras } : t
    );

    onUpdateTurmas(updatedTurmas);
    showToast(`Material extra "${titulo}" removido desta turma.`);
  };

  return (
    <div className="space-y-6">
      {/* TOAST ALERT */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#082500] text-[#f4f6f0] border border-[#a2d486]/40 px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-5 h-5 text-[#a2d486] shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* ===================================================================== */}
      {/* BARRA DE CONTROLE / SUB-ABAS DA GESTÃO DE TURMAS (APENAS COORDENAÇÃO) */}
      {/* ===================================================================== */}
      {!isProfessorView && (
        <div className="bg-white border border-[#c2c9b9] rounded-2xl p-3 sm:p-4 shadow-none flex flex-row items-center justify-between gap-3 sm:gap-4">
          <h2 className="font-display text-sm sm:text-lg font-bold text-[#082500] tracking-wide uppercase whitespace-nowrap">
            GESTÃO DE TURMAS
          </h2>

          {/* Botões de navegação da barra de controle (apenas ícones com tooltips) */}
          <div className="flex items-center gap-2 shrink-0">
            {/* 1. Monitoramento de Turmas */}
            <button
              type="button"
              id="btn-subtab-monitoramento"
              onClick={() => setTurmasSubTab('monitoramento')}
              className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-center relative group shadow-none ${
                turmasSubTab === 'monitoramento'
                  ? 'bg-[#123d00] border-[#123d00] text-white shadow-none'
                  : 'bg-[#f8faf4] border-[#c2c9b9]/80 text-[#52594d] hover:text-[#082500] hover:bg-[#f2f5ec] shadow-none'
              }`}
              title="Monitoramento de turma"
              aria-label="Monitoramento de turma"
            >
              <GraduationCap className="w-5 h-5" />
              <span className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 px-2.5 py-1 bg-[#082500] text-white text-[10px] font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg border border-[#a2d486]/30 z-20">
                Monitoramento de turma
              </span>
            </button>

            {/* 2. Materiais Didáticos */}
            <button
              type="button"
              id="btn-subtab-materiais"
              onClick={() => setTurmasSubTab('materiais')}
              className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-center relative group shadow-none ${
                turmasSubTab === 'materiais'
                  ? 'bg-[#123d00] border-[#123d00] text-white shadow-none'
                  : 'bg-[#f8faf4] border-[#c2c9b9]/80 text-[#52594d] hover:text-[#082500] hover:bg-[#f2f5ec] shadow-none'
              }`}
              title="Materiais didáticos"
              aria-label="Materiais didáticos"
            >
              <BookOpen className="w-5 h-5" />
              <span className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 px-2.5 py-1 bg-[#082500] text-white text-[10px] font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg border border-[#a2d486]/30 z-20">
                Materiais didáticos
              </span>
            </button>
          </div>
        </div>
      )}

      {/* SUB-ABA 2: MATERIAIS DIDÁTICOS (REPOSITÓRIO CENTRALIZADO) */}
      {!isProfessorView && turmasSubTab === 'materiais' && (
        <MateriaisDidaticosView
          disciplinas={availableDisciplinas}
          turmas={turmas}
          users={users}
          onUpdateDisciplinas={onUpdateDisciplinas || (() => {})}
          onNavigateToTurmas={(turmaId) => {
            setTurmasSubTab('monitoramento');
            if (turmaId) {
              setActiveTurmaId(turmaId);
              setViewMode('gestao_interna');
            } else {
              setViewMode('listagem');
            }
          }}
        />
      )}

      {/* SUB-ABA 1: MONITORAMENTO DE TURMAS */}
      {(isProfessorView || turmasSubTab === 'monitoramento') && (
        <>
          {/* ========================================================================= */}
          {/* 1. VIEW MODE: TABELA DE LISTAGEM DAS EDIÇÕES                              */}
          {/* ========================================================================= */}
          {viewMode === 'listagem' && (
        <div className="space-y-4">
          {/* 1. Banner de boas-vindas do Professor */}
          {isProfessorView && (
            <div className="bg-[#082500] text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden border border-[#a2d486]/30">
              <div className="absolute right-0 top-0 w-96 h-96 bg-[#123d00]/40 rounded-full blur-3xl pointer-events-none" />
              <div className="relative z-10 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-[#a2d486]/20 text-[#a2d486] border border-[#a2d486]/30">
                    PAINEL DO PROFESSOR
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-display font-black text-white tracking-tight">
                  Seja Bem-vindo, {currentUser?.name || 'Professor'}
                </h1>
              </div>
            </div>
          )}

          {/* Controls Bar (Coordenação) */}
          {!isProfessorView && (
            <div className="flex items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-[#c2c9b9]">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#73796c]" />
                <input
                  type="text"
                  placeholder="Buscar pelo ID da turma..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-[#f8faf4] border border-[#c2c9b9] rounded-xl text-xs focus:outline-hidden focus:border-[#123d00]"
                />
              </div>

              {/* Botão para criar novas turmas com apenas o ícone de + */}
              <button
                type="button"
                id="btn-create-turma-icon"
                onClick={handleOpenCreateTurma}
                className="p-2.5 rounded-xl bg-[#123d00] hover:bg-[#0d2a00] text-white transition-all shadow-xs cursor-pointer flex items-center justify-center relative group shrink-0"
                title="Criar nova turma"
                aria-label="Criar nova turma"
              >
                <Plus className="w-4 h-4 text-[#a2d486]" />
                <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-[#082500] text-white text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow border border-[#a2d486]/30 z-20">
                  Criar turma
                </span>
              </button>
            </div>
          )}

          {/* Tabela de Monitoramento de Turmas */}
          <div className="bg-white border border-[#c2c9b9] rounded-2xl sm:rounded-3xl overflow-hidden shadow-xs w-full max-w-full">
            {isProfessorView && (
              <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-[#e1e3dd] bg-white">
                <h2 className="text-lg sm:text-xl font-display font-black text-[#082500] tracking-tight">
                  Minhas Turmas
                </h2>
              </div>
            )}
            <div className="w-full max-w-full overflow-hidden">
              <table className="w-full text-left text-xs border-collapse table-fixed">
                {isProfessorView ? (
                  <colgroup>
                    <col className="w-[50%] sm:w-[50%]" />
                    <col className="w-[25%] sm:w-[25%]" />
                    <col className="w-[25%] sm:w-[25%]" />
                  </colgroup>
                ) : (
                  <colgroup>
                    <col className="w-[30%] sm:w-[28%]" />
                    <col className="w-[20%] sm:w-[22%]" />
                    <col className="w-[15%] sm:w-[15%]" />
                    <col className="w-[35%] sm:w-[35%]" />
                  </colgroup>
                )}
                <thead>
                  <tr className="bg-[#f4f6f0] text-[#082500] font-bold border-b border-[#e1e3dd]">
                    <th className="py-2.5 px-2 sm:p-4 sm:pl-6 text-left text-[11px] sm:text-xs truncate">ID</th>
                    {!isProfessorView && (
                      <th className="py-2.5 px-1 sm:p-4 text-center text-[11px] sm:text-xs truncate">Professores</th>
                    )}
                    <th className="py-2.5 px-1 sm:p-4 text-center text-[11px] sm:text-xs truncate">Alunos</th>
                    <th className="py-2.5 px-2 sm:p-4 sm:pr-6 text-right sm:text-center text-[11px] sm:text-xs">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e1e3dd]">
                  {filteredTurmas.length === 0 ? (
                    <tr>
                      <td colSpan={isProfessorView ? 3 : 4} className="p-8 text-center text-[#73796c]">
                        {isProfessorView
                          ? 'Nenhuma turma vinculada ao seu perfil de professor.'
                          : 'Nenhuma turma encontrada com o ID pesquisado.'}
                      </td>
                    </tr>
                  ) : (
                    filteredTurmas.map((turma) => {
                      const activeCount =
                        students.filter((s) => s.turmaId === turma.id || (!s.turmaId && turma.id === 'turma-2026'))
                          .length || turma.matriculadosCount || 0;
                      const turmaProfIds = getTurmaProfessorIds(turma);

                      return (
                        <tr
                          key={turma.id}
                          className="hover:bg-[#fafbf8] transition-colors group"
                        >
                          {/* Coluna 1: ID - Apenas o ID da turma */}
                          <td className="py-2.5 px-2.5 sm:p-4 sm:pl-6">
                            <div className="flex items-center gap-1.5 sm:gap-2">
                              <span className="font-mono font-bold text-xs sm:text-sm text-[#082500] truncate max-w-[85px] sm:max-w-none block" title={turma.id}>
                                {turma.id}
                              </span>
                              {!isProfessorView && (
                                <button
                                  type="button"
                                  onClick={(e) => handleOpenEditTurma(turma, e)}
                                  className="opacity-0 group-hover:opacity-100 p-0.5 sm:p-1 hover:bg-[#e1e3dd] rounded-md text-[#73796c] hover:text-[#082500] transition-all cursor-pointer shrink-0 hidden sm:inline-flex"
                                  title="Editar ID da turma"
                                  aria-label="Editar ID"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>

                          {/* Coluna 2: Professores (Apenas Coordenação) */}
                          {!isProfessorView && (
                            <td className="py-2.5 px-1 sm:p-4 text-center">
                              <div className="inline-flex items-center justify-center gap-1 sm:gap-2">
                                <span className="font-display font-black text-xs sm:text-sm text-[#082500]">
                                  {turmaProfIds.length}
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenManageProfessors(turma);
                                  }}
                                  className="p-1 sm:p-2 rounded-lg sm:rounded-xl bg-[#f4f6f0] hover:bg-[#e1e3dd] text-[#123d00] transition-colors cursor-pointer relative group border border-[#c2c9b9]/60 shadow-2xs"
                                  title={`Vincular / desvincular professores (${turmaProfIds.length} vinculado${turmaProfIds.length === 1 ? '' : 's'})`}
                                  aria-label="Vincular e desvincular professores da turma"
                                >
                                  <UserCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#123d00]" />
                                  <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-[#082500] text-white text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow border border-[#a2d486]/30 z-20">
                                    Professores
                                  </span>
                                </button>
                              </div>
                            </td>
                          )}

                          {/* Coluna 3: Alunos - Quantidade de alunos matriculados */}
                          <td className="py-2.5 px-1 sm:p-4 text-center">
                            <span className="font-display font-black text-xs sm:text-sm text-[#082500]">
                              {activeCount}
                            </span>
                          </td>

                          {/* Coluna 4: Ações - Botão para Excluir a turma, editar a turma e abrir aquela turma (todos apenas ícone) */}
                          <td className="py-2.5 px-2.5 sm:p-4 sm:pr-6 text-right">
                            <div className="flex items-center justify-end gap-1 sm:gap-2">
                              {/* Botão Excluir (Apenas Coordenação) */}
                              {!isProfessorView && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setTurmaToDelete(turma);
                                  }}
                                  className="p-1 sm:p-2 text-[#b91c1c] hover:bg-[#fee2e2] rounded-lg sm:rounded-xl transition-colors cursor-pointer relative group shrink-0"
                                  title="Excluir turma"
                                  aria-label="Excluir turma"
                                >
                                  <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                  <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-[#082500] text-white text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow border border-[#a2d486]/30 z-20">
                                    Excluir
                                  </span>
                                </button>
                              )}

                              {/* Botão Editar (Apenas Coordenação) */}
                              {!isProfessorView && (
                                <button
                                  type="button"
                                  onClick={(e) => handleOpenEditTurma(turma, e)}
                                  className="p-1 sm:p-2 text-[#52594d] hover:text-[#082500] hover:bg-[#f4f6f0] rounded-lg sm:rounded-xl transition-colors cursor-pointer relative group shrink-0"
                                  title="Editar turma"
                                  aria-label="Editar turma"
                                >
                                  <Edit className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                  <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-[#082500] text-white text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow border border-[#a2d486]/30 z-20">
                                    Editar
                                  </span>
                                </button>
                              )}

                              {/* Botão Abrir aquela turma (Coordenação e Professor) */}
                              <button
                                type="button"
                                onClick={() => handleEnterTurma(turma.id)}
                                className="p-1 sm:p-2 text-white bg-[#123d00] hover:bg-[#0d2a00] rounded-lg sm:rounded-xl transition-all shadow-xs cursor-pointer relative group shrink-0"
                                title="Abrir turma"
                                aria-label="Abrir turma"
                              >
                                <LogIn className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#a2d486]" />
                                <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-[#082500] text-white text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow border border-[#a2d486]/30 z-20">
                                  Abrir turma
                                </span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. VIEW MODE: GESTÃO INTERNA DA TURMA SELECIONADA                         */}
      {/* ========================================================================= */}
      {viewMode === 'gestao_interna' && currentTurma && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Action: Voltar para a Listagem de Turmas */}
          <div className="flex items-center justify-start gap-3">
            <button
              type="button"
              onClick={() => setViewMode('listagem')}
              className="px-4 py-2.5 rounded-2xl border border-[#c2c9b9] bg-white text-[#2c3427] hover:bg-[#f4f6f0] text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer shadow-none"
            >
              <ArrowLeft className="w-4 h-4 text-[#73796c]" />
              <span>Voltar para Listagem de Turmas</span>
            </button>
          </div>

          {/* Internal Banner with Turma Context */}
          <div
            className={`bg-[#082500] text-white rounded-3xl shadow-xl relative overflow-hidden ${
              isProfessorView ? 'p-8 sm:py-10 sm:px-10' : 'p-6 sm:p-8'
            }`}
          >
            <div className="absolute right-0 top-0 w-96 h-96 bg-[#123d00]/40 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              {isProfessorView ? (
                /* Layout exclusivo do Painel do Professor: Título no topo e botão logo abaixo */
                <div className="space-y-4 max-w-2xl">
                  <h2 className="font-display font-black text-2xl sm:text-3xl lg:text-4xl text-white tracking-tight">
                    {currentTurma.name}
                  </h2>
                  <div>
                    <button
                      type="button"
                      id="btn-download-turma-students-pdf"
                      onClick={() => handleDownloadPDF(currentTurma)}
                      className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 active:bg-white/25 text-white px-3.5 py-2 rounded-xl border border-white/20 transition-all cursor-pointer text-xs font-bold shadow-xs backdrop-blur-xs"
                      title="Baixar lista de alunos matriculados em PDF"
                    >
                      <Download className="w-4 h-4 text-[#a2d486]" />
                      <span>Baixar Lista de Alunos</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Layout da Coordenação: Seletor de turmas acima do título */
                <div className="space-y-2 max-w-2xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-xl border border-white/20">
                      <Layers className="w-3.5 h-3.5 text-[#a2d486] shrink-0" />
                      <span className="text-[11px] font-medium text-[#e1e3dd] whitespace-nowrap">
                        Alternar Turma:
                      </span>
                      <select
                        value={activeTurmaId}
                        onChange={(e) => setActiveTurmaId(e.target.value)}
                        title="Selecione outra turma para alternar a visualização diretamente"
                        className="bg-transparent text-white text-xs font-bold focus:outline-hidden cursor-pointer"
                      >
                        {turmas.map((t) => (
                          <option key={t.id} value={t.id} className="text-[#191c19]">
                            {t.name} (ID: {t.id})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <h2 className="font-display font-black text-2xl text-white tracking-tight">
                    {currentTurma.name}
                  </h2>
                </div>
              )}

              {/* Quick Metrics of this turma */}
              <div className="flex items-center gap-5 bg-white/10 p-4 rounded-2xl border border-white/15">
                <div className="text-center px-2">
                  <span className="text-[10px] font-bold text-white/70 uppercase tracking-wide block">
                    Alunos Matriculados
                  </span>
                  <span className="font-display font-black text-2xl text-[#a2d486]">
                    {turmaStudents.length}
                  </span>
                </div>
                <div className="w-px h-8 bg-white/20" />
                <div className="text-center px-2">
                  <span className="text-[10px] font-bold text-white/70 uppercase tracking-wide block">
                    Alunos Formados
                  </span>
                  <span className="font-display font-black text-2xl text-white">
                    {turmaStudents.filter((s) => s.statusAcademico === 'Formado').length}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* BARRA DE CONTROLE DA TURMA                                                */}
          {/* ========================================================================= */}
          <div className="w-full max-w-full min-w-0">
            {/* Internal Navigation Tabs: 4 botões para professor ou 5 para coordenação */}
            <div className={`grid ${isProfessorView ? 'grid-cols-4' : 'grid-cols-5'} gap-1 sm:flex sm:flex-row sm:items-center sm:gap-2 border-b border-[#c2c9b9] pb-2 sm:pb-3 w-full`}>
              {/* Botão 1: Mural de Avisos */}
              <button
                type="button"
                id="btn-control-mural-avisos"
                onClick={() => setInternalTab('mural')}
                className={`py-2 px-1 sm:px-4 sm:py-2.5 rounded-xl sm:rounded-2xl text-[9.5px] sm:text-xs font-bold flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-2 transition-all cursor-pointer select-none text-center sm:text-left ${
                  internalTab === 'mural'
                    ? 'bg-[#123d00] text-white shadow-xs'
                    : 'bg-white text-[#52594d] border border-[#c2c9b9] hover:bg-[#f4f6f0] hover:text-[#082500]'
                }`}
                title="Mural de Avisos: É o canal de comunicados oficiais da turma."
                aria-label="Mural de Avisos: É o canal de comunicados oficiais da turma."
              >
                <MessageSquare className="w-4 h-4 text-[#a2d486] shrink-0 mb-0.5 sm:mb-0" />
                <span className="truncate max-w-full block leading-tight">
                  <span className="hidden sm:inline">Mural de Avisos</span>
                  <span className="sm:hidden">Mural</span>
                </span>
              </button>

              {/* Botão 2: Alunos matriculados (Apenas Coordenação - Não exibido para o Professor) */}
              {!isProfessorView && (
                <button
                  type="button"
                  id="btn-control-alunos-matriculados"
                  onClick={() => setInternalTab('alunos')}
                  className={`py-2 px-1 sm:px-4 sm:py-2.5 rounded-xl sm:rounded-2xl text-[9.5px] sm:text-xs font-bold flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-2 transition-all cursor-pointer select-none text-center sm:text-left ${
                    internalTab === 'alunos'
                      ? 'bg-[#123d00] text-white shadow-xs'
                      : 'bg-white text-[#52594d] border border-[#c2c9b9] hover:bg-[#f4f6f0] hover:text-[#082500]'
                  }`}
                  title="Alunos matriculados: Tabela de Alunos"
                  aria-label="Alunos matriculados: Tabela de Alunos"
                >
                  <Users className="w-4 h-4 text-[#a2d486] shrink-0 mb-0.5 sm:mb-0" />
                  <span className="truncate max-w-full block leading-tight">
                    <span className="hidden sm:inline">Alunos matriculados</span>
                    <span className="sm:hidden">Alunos</span>
                  </span>
                </button>
              )}

              {/* Botão 3: Frequência dos Alunos */}
              <button
                type="button"
                id="btn-control-frequencia-alunos"
                onClick={() => setInternalTab('frequencia')}
                className={`py-2 px-1 sm:px-4 sm:py-2.5 rounded-xl sm:rounded-2xl text-[9.5px] sm:text-xs font-bold flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-2 transition-all cursor-pointer select-none text-center sm:text-left ${
                  internalTab === 'frequencia'
                    ? 'bg-[#123d00] text-white shadow-xs'
                    : 'bg-white text-[#52594d] border border-[#c2c9b9] hover:bg-[#f4f6f0] hover:text-[#082500]'
                }`}
                title="Frequência dos Alunos: Painel exclusivo para controle de presenças e faltas."
                aria-label="Frequência dos Alunos: Painel exclusivo para controle de presenças e faltas."
              >
                <CalendarCheck className="w-4 h-4 text-[#a2d486] shrink-0 mb-0.5 sm:mb-0" />
                <span className="truncate max-w-full block leading-tight">
                  <span className="hidden sm:inline">Frequência dos Alunos</span>
                  <span className="sm:hidden">Frequência</span>
                </span>
              </button>

              {/* Botão 4: Lançamento de notas */}
              <button
                type="button"
                id="btn-control-lancar-notas"
                onClick={() => setInternalTab('notas')}
                className={`py-2 px-1 sm:px-4 sm:py-2.5 rounded-xl sm:rounded-2xl text-[9.5px] sm:text-xs font-bold flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-2 transition-all cursor-pointer select-none text-center sm:text-left ${
                  internalTab === 'notas'
                    ? 'bg-[#123d00] text-white shadow-xs'
                    : 'bg-white text-[#52594d] border border-[#c2c9b9] hover:bg-[#f4f6f0] hover:text-[#082500]'
                }`}
                title="Lançamento de notas: Grade de disciplinas, lançamento de notas e relatórios."
                aria-label="Lançamento de notas: Grade de disciplinas, lançamento de notas e relatórios."
              >
                <Award className="w-4 h-4 text-[#a2d486] shrink-0 mb-0.5 sm:mb-0" />
                <span className="truncate max-w-full block leading-tight">
                  <span className="hidden sm:inline">Lançamento de notas</span>
                  <span className="sm:hidden">Notas</span>
                </span>
              </button>

              {/* Botão 5: Disciplinas */}
              <button
                type="button"
                id="btn-control-disciplinas"
                onClick={() => setInternalTab('disciplinas')}
                className={`py-2 px-1 sm:px-4 sm:py-2.5 rounded-xl sm:rounded-2xl text-[9.5px] sm:text-xs font-bold flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-2 transition-all cursor-pointer select-none text-center sm:text-left ${
                  internalTab === 'disciplinas'
                    ? 'bg-[#123d00] text-white shadow-xs'
                    : 'bg-white text-[#52594d] border border-[#c2c9b9] hover:bg-[#f4f6f0] hover:text-[#082500]'
                }`}
                title="Disciplinas: Mostra a grade de matérias da turma (Leitura de Textos, Método Teológico, etc.)."
                aria-label="Disciplinas: Mostra a grade de matérias da turma (Leitura de Textos, Método Teológico, etc.)."
              >
                <BookOpen className="w-4 h-4 text-[#a2d486] shrink-0 mb-0.5 sm:mb-0" />
                <span className="truncate max-w-full block leading-tight">
                  <span>Disciplinas</span>
                </span>
              </button>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* TAB 1: MURAL DE AVISOS                                                   */}
          {/* ========================================================================= */}
          {internalTab === 'mural' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-3xl border border-[#c2c9b9]">
                <div>
                  <h3 className="font-display font-bold text-base text-[#082500] flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-[#123d00]" />
                    <span>Mural de Avisos</span>
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={handleOpenCreateAviso}
                  className="px-4 py-2 rounded-2xl bg-[#123d00] hover:bg-[#0d2a00] text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-2"
                  title="Publicar Aviso"
                  aria-label="Publicar Aviso"
                >
                  <Plus className="w-4 h-4 text-[#a2d486]" />
                  <span>Publicar Aviso</span>
                </button>
              </div>

              {/* Feed de Avisos */}
              {sortedAvisos.length === 0 ? (
                <div className="bg-white rounded-3xl border border-[#c2c9b9] p-12 text-center space-y-3">
                  <MessageSquare className="w-8 h-8 text-[#73796c] mx-auto opacity-50" />
                  <h4 className="font-display font-bold text-sm text-[#082500]">
                    Nenhum aviso
                  </h4>
                  <button
                    type="button"
                    onClick={handleOpenCreateAviso}
                    className="px-4 py-2 rounded-xl bg-[#123d00] text-white text-xs font-bold cursor-pointer inline-flex items-center gap-2 mt-2"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#a2d486]" />
                    <span>Publicar Aviso</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {sortedAvisos.map((aviso) => {
                    const isAuthor = isUserAvisoAuthor(aviso, effectiveCurrentUser);
                    const canManageAviso = !isProfessorView || isAuthor;

                    return (
                    <div
                      key={aviso.id}
                      className={`p-6 rounded-3xl border transition-all ${
                        aviso.importante
                          ? 'bg-[#fbfcf8] border-[#a2d486] shadow-sm ring-1 ring-[#a2d486]/50'
                          : 'bg-white border-[#c2c9b9]'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            {aviso.importante && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#123d00] text-[#a2d486] uppercase tracking-wider">
                                <Pin className="w-3 h-3 fill-current" />
                                Fixado no Topo
                              </span>
                            )}
                            <span
                              className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold border ${
                                aviso.categoria === 'Alerta'
                                  ? 'bg-[#fee2e2] text-[#991b1b] border-[#fecaca]'
                                  : aviso.categoria === 'Aula'
                                  ? 'bg-[#dbeafe] text-[#1e40af] border-[#bfdbfe]'
                                  : aviso.categoria === 'Trabalho'
                                  ? 'bg-[#fef3c7] text-[#92400e] border-[#fde68a]'
                                  : 'bg-[#f4f6f0] text-[#123d00] border-[#e1e3dd]'
                              }`}
                            >
                              {aviso.categoria || 'Geral'}
                            </span>
                            {isProfessorView && isAuthor && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#123d00]/10 text-[#123d00] border border-[#123d00]/20">
                                Seu comunicado
                              </span>
                            )}
                          </div>
                          <h4 className="font-display font-bold text-base text-[#082500] pt-1">
                            {aviso.titulo}
                          </h4>
                        </div>

                        {/* Actions: Coordenação gerencia todos; Professor apenas os que ele criou */}
                        {canManageAviso && (
                          <div className="flex items-center gap-1.5 self-end sm:self-auto">
                            <button
                              type="button"
                              onClick={() => handleOpenEditAviso(aviso)}
                              className="p-1.5 rounded-lg text-[#123d00] hover:bg-[#123d00]/10 transition-colors cursor-pointer"
                              title="Editar aviso"
                              aria-label="Editar aviso"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleTogglePinAviso(aviso.id)}
                              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                                aviso.importante
                                  ? 'bg-[#123d00]/10 text-[#123d00]'
                                  : 'text-[#73796c] hover:bg-[#f4f6f0]'
                              }`}
                              title={aviso.importante ? 'Desafixar aviso' : 'Fixar no topo'}
                              aria-label={aviso.importante ? 'Desafixar aviso' : 'Fixar no topo'}
                            >
                              <Pin className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteAviso(aviso.id)}
                              className="p-1.5 rounded-lg text-[#b91c1c] hover:bg-[#fee2e2] transition-colors cursor-pointer"
                              title="Excluir aviso"
                              aria-label="Excluir aviso"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="mt-3 text-xs text-[#2c3427] leading-relaxed whitespace-pre-line border-t border-[#e1e3dd] pt-3">
                        {aviso.conteudo}
                      </div>

                      {aviso.link && (
                        <div className="mt-2.5 pt-2">
                          <a
                            href={aviso.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#123d00]/10 hover:bg-[#123d00]/20 text-[#123d00] text-xs font-bold transition-colors border border-[#123d00]/20 cursor-pointer"
                          >
                            <LinkIcon className="w-3.5 h-3.5" />
                            <span>{aviso.linkTitulo || 'Acessar Link Anexo'}</span>
                          </a>
                        </div>
                      )}

                      <div className="mt-4 pt-3 border-t border-[#f4f6f0] flex items-center justify-between text-[11px] text-[#73796c]">
                        <span className="font-medium">
                          Publicado em <strong className="text-[#2c3427] font-semibold">{aviso.data}</strong> por{' '}
                          <strong className="text-[#082500] font-bold">{getAvisoAuthorIdentity(aviso)}</strong>
                        </span>
                      </div>
                    </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: ALUNOS MATRICULADOS (APENAS COORDENAÇÃO)                           */}
          {/* ========================================================================= */}
          {!isProfessorView && internalTab === 'alunos' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-3xl border border-[#c2c9b9] shadow-none">
                <div>
                  <h3 className="font-display font-bold text-base text-[#082500] flex items-center gap-2">
                    <Users className="w-5 h-5 text-[#123d00]" />
                    <span>Alunos Matriculados</span>
                  </h3>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowEnrollModal(true)}
                    className="px-4 py-2 rounded-2xl bg-[#123d00] hover:bg-[#0d2a00] text-white text-xs font-bold flex items-center gap-2 transition-all shadow-none cursor-pointer"
                    title="Matricular novo aluno nesta turma"
                  >
                    <UserPlus className="w-4 h-4 text-[#a2d486]" />
                    <span>Matricular Novo Aluno</span>
                  </button>
                </div>
              </div>

              {/* Barra de Filtro de Alunos */}
              <div className="flex items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-[#c2c9b9] shadow-none">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#73796c]" />
                  <input
                    type="text"
                    placeholder="Buscar aluno por nome, matrícula ou campo/polo..."
                    value={alunoSearchTerm}
                    onChange={(e) => setAlunoSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-1.5 bg-[#f8faf4] border border-[#c2c9b9] rounded-xl text-xs focus:outline-hidden focus:border-[#123d00]"
                  />
                </div>
                <span className="text-xs text-[#73796c] font-medium hidden sm:inline">
                  Exibindo <strong>{filteredTurmaStudents.length}</strong> de <strong>{turmaStudents.length}</strong> alunos
                </span>
              </div>

              {/* Tabela de Alunos Matriculados */}
              <div className="bg-white border border-[#c2c9b9] rounded-2xl sm:rounded-3xl overflow-hidden shadow-none w-full">
                <div className="w-full overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse table-auto min-w-[720px] sm:min-w-full">
                    <thead>
                      <tr className="bg-[#f4f6f0] text-[#082500] font-bold border-b border-[#e1e3dd]">
                        <th className="py-3 px-3 sm:pl-6 text-left">Matrícula</th>
                        <th className="py-3 px-3 text-left">Nome</th>
                        <th className="py-3 px-3 text-left">Campo/Supervisão</th>
                        <th className="py-3 px-2 text-center">Frequência</th>
                        <th className="py-3 px-2 text-center">Média Geral</th>
                        <th className="py-3 px-3 text-center">Situação</th>
                        <th className="py-3 px-3 sm:pr-6 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e1e3dd]">
                      {filteredTurmaStudents.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-10 text-center">
                            <div className="max-w-md mx-auto space-y-3">
                              <Users className="w-10 h-10 text-[#73796c] mx-auto opacity-40" />
                              <p className="font-bold text-sm text-[#082500]">
                                {alunoSearchTerm ? 'Nenhum aluno encontrado para a busca.' : 'Nenhum aluno matriculado nesta turma ainda.'}
                              </p>
                              <p className="text-xs text-[#52594d]">
                                {alunoSearchTerm
                                  ? 'Tente buscar por outro termo ou limpe o filtro.'
                                  : 'Clique no botão abaixo para matricular o primeiro aluno da turma.'}
                              </p>
                              {!alunoSearchTerm && (
                                <button
                                  type="button"
                                  onClick={() => setShowEnrollModal(true)}
                                  className="px-4 py-2 rounded-xl bg-[#123d00] text-white text-xs font-bold inline-flex items-center gap-2 cursor-pointer shadow-none"
                                >
                                  <UserPlus className="w-4 h-4 text-[#a2d486]" />
                                  <span>Matricular Novo Aluno</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ) : (
                        filteredTurmaStudents.map((st) => (
                          <tr key={st.alunoId} className="hover:bg-[#fafbf8] transition-colors">
                            {/* 1. Matrícula: Código de matrícula do aluno */}
                            <td className="py-3 px-3 sm:pl-6 font-mono font-bold text-[#646029] whitespace-nowrap">
                              {st.matricula}
                            </td>

                            {/* 2. Nome: Mostrar apenas nome e sobrenome */}
                            <td className="py-3 px-3 font-semibold text-[#082500] whitespace-nowrap">
                              {formatNomeSobrenome(st.alunoName)}
                            </td>

                            {/* 3. Campo/Supervisão */}
                            <td className="py-3 px-3 text-[#52594d] whitespace-nowrap">
                              {st.polo || 'Campo Central - Belém/PA'}
                            </td>

                            {/* 4. Frequência: Mostrar apenas as porcentagens */}
                            <td className="py-3 px-2 text-center font-bold text-xs text-[#15803d] whitespace-nowrap">
                              {getFrequenciaReal(st)}%
                            </td>

                            {/* 5. Média Geral: Média aritmética das notas das disciplinas */}
                            <td className="py-3 px-2 text-center font-extrabold text-xs text-[#082500] whitespace-nowrap">
                              {getMediaAritmetica(st)}
                            </td>

                            {/* 6. Situação: "Cursando" e "Formado". Ao clicar em formado deve aparecer na contagem */}
                            <td className="py-3 px-3 text-center whitespace-nowrap">
                              <div className="inline-flex items-center p-0.5 bg-[#f4f6f0] rounded-xl border border-[#c2c9b9]">
                                <button
                                  type="button"
                                  onClick={() => handleSetStudentStatus(st.alunoId, 'Cursando')}
                                  className={`px-2.5 py-1 rounded-lg text-[10px] sm:text-xs font-bold transition-all cursor-pointer ${
                                    st.statusAcademico !== 'Formado'
                                      ? 'bg-[#123d00] text-white shadow-xs'
                                      : 'text-[#52594d] hover:text-[#082500]'
                                  }`}
                                  title="Marcar aluno como Cursando"
                                >
                                  Cursando
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSetStudentStatus(st.alunoId, 'Formado')}
                                  className={`px-2.5 py-1 rounded-lg text-[10px] sm:text-xs font-bold transition-all cursor-pointer ${
                                    st.statusAcademico === 'Formado'
                                      ? 'bg-[#15803d] text-white shadow-xs'
                                      : 'text-[#52594d] hover:text-[#082500]'
                                  }`}
                                  title="Marcar aluno como Formado (aparece na contagem)"
                                >
                                  Formado
                                </button>
                              </div>
                            </td>

                            {/* 7. Ações: Deve ter botão de Editar, deletar. Apenas o ícone. */}
                            <td className="py-3 px-3 sm:pr-6 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1.5 sm:gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleOpenGradeModal(st)}
                                  className="p-1.5 sm:p-2 rounded-xl bg-[#f4f6f0] hover:bg-[#e7e9e3] text-[#123d00] transition-colors cursor-pointer border border-[#c2c9b9]"
                                  title={`Editar ${formatNomeSobrenome(st.alunoName)}`}
                                  aria-label={`Editar ${formatNomeSobrenome(st.alunoName)}`}
                                >
                                  <Pencil className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#123d00]" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveStudent(st)}
                                  className="p-1.5 sm:p-2 text-[#b91c1c] hover:bg-[#fee2e2] rounded-xl transition-colors cursor-pointer border border-[#fee2e2]"
                                  title={`Excluir ${formatNomeSobrenome(st.alunoName)} da turma`}
                                  aria-label={`Excluir ${formatNomeSobrenome(st.alunoName)} da turma`}
                                >
                                  <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: FREQUÊNCIA DOS ALUNOS (TABELA DE AULAS & REGISTRO DE CHAMADA)       */}
          {/* ========================================================================= */}
          {internalTab === 'frequencia' && (
            <div className="space-y-4">
              {/* Barra Superior com Título e Botão "Nova aula" */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-3xl border border-[#c2c9b9] shadow-none">
                <div>
                  <h3 className="font-display font-bold text-base text-[#082500] flex items-center gap-2">
                    <CalendarCheck className="w-5 h-5 text-[#15803d]" />
                    <span>Frequência das Aulas</span>
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    id="btn-nova-aula"
                    onClick={handleOpenCreateAula}
                    className="px-4 py-2 rounded-2xl bg-[#123d00] hover:bg-[#0d2a00] text-white text-xs font-bold flex items-center gap-2 transition-all shadow-none cursor-pointer"
                    title="Cadastrar nova aula"
                    aria-label="Nova aula"
                  >
                    <Plus className="w-4 h-4 text-[#a2d486]" />
                    <span>Nova aula</span>
                  </button>
                </div>
              </div>

              {/* Tabela de Aulas Cadastradas */}
              <div className="bg-white border border-[#c2c9b9] rounded-2xl sm:rounded-3xl overflow-hidden shadow-none w-full">
                <div className="w-full overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse table-auto min-w-[540px] sm:min-w-full">
                    <thead>
                      <tr className="bg-[#f4f6f0] text-[#082500] font-bold border-b border-[#e1e3dd]">
                        <th className="py-3.5 px-4 sm:pl-6 text-left">Data</th>
                        <th className="py-3.5 px-3 text-center">Link</th>
                        <th className="py-3.5 px-3 text-center">Chamada</th>
                        <th className="py-3.5 px-4 sm:pr-6 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e1e3dd]">
                      {currentTurmaAulas.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="p-10 text-center text-[#73796c]">
                            <div className="max-w-md mx-auto space-y-3">
                              <Calendar className="w-10 h-10 text-[#73796c] mx-auto opacity-40" />
                              <p className="font-bold text-sm text-[#082500]">
                                Nenhuma aula cadastrada nesta turma ainda.
                              </p>
                              <p className="text-xs text-[#52594d]">
                                Clique no botão acima para cadastrar a primeira aula e gerenciar a chamada.
                              </p>
                              <button
                                type="button"
                                onClick={handleOpenCreateAula}
                                className="px-4 py-2 rounded-xl bg-[#123d00] text-white text-xs font-bold inline-flex items-center gap-2 cursor-pointer shadow-none"
                              >
                                <Plus className="w-4 h-4 text-[#a2d486]" />
                                <span>Nova aula</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        currentTurmaAulas.map((aula) => {
                          const hasLink = Boolean(aula.link && aula.link.trim() !== '');
                          const presencasRegistradas = Object.keys(aula.presencas || {}).length;

                          return (
                            <tr key={aula.id} className="hover:bg-[#fafbf8] transition-colors">
                              {/* 1. Data: Exibir a data da aula no formato dia/mês (ex: 10/out) */}
                              <td className="py-3.5 px-4 sm:pl-6 font-bold text-[#082500] whitespace-nowrap">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                                  <span className="font-mono text-sm font-extrabold text-[#123d00]">
                                    {formatDiaMes(aula.data)}
                                  </span>
                                  <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#73796c]">
                                    {aula.moduloTitulo && (
                                      <span>• {aula.moduloTitulo}</span>
                                    )}
                                    {aula.assunto && (
                                      <span className="text-[#082500] font-semibold">
                                        — {aula.assunto}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </td>

                              {/* 2. Link: Apenas ícone de link. Verde se cadastrado, Vermelho se não */}
                              <td className="py-3.5 px-3 text-center whitespace-nowrap">
                                {hasLink ? (
                                  <a
                                    href={aula.link!.startsWith('http') ? aula.link! : `https://${aula.link!}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center justify-center p-2 rounded-xl text-[#15803d] hover:bg-[#15803d]/10 transition-colors"
                                    title={`Acessar link da aula: ${aula.link}`}
                                    aria-label="Acessar link da aula"
                                  >
                                    <LinkIcon className="w-4 h-4 text-[#15803d]" />
                                  </a>
                                ) : (
                                  <span
                                    className="inline-flex items-center justify-center p-2 rounded-xl text-[#b91c1c] opacity-80 cursor-not-allowed"
                                    title="Nenhum link cadastrado para esta aula"
                                    aria-label="Sem link cadastrado"
                                  >
                                    <LinkIcon className="w-4 h-4 text-[#b91c1c]" />
                                  </span>
                                )}
                              </td>

                              {/* 3. Chamada: Apenas ícone de chamada */}
                              <td className="py-3.5 px-3 text-center whitespace-nowrap">
                                <button
                                  type="button"
                                  onClick={() => handleOpenChamada(aula)}
                                  className="inline-flex items-center justify-center p-2 rounded-xl text-[#123d00] hover:bg-[#123d00]/10 transition-colors cursor-pointer relative group"
                                  title={presencasRegistradas > 0 ? `Chamada registrada (${presencasRegistradas} alunos)` : 'Registrar chamada desta aula'}
                                  aria-label="Registrar chamada"
                                >
                                  <ClipboardCheck className="w-4 h-4 text-[#123d00]" />
                                  {presencasRegistradas > 0 && (
                                    <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#15803d]" />
                                  )}
                                </button>
                              </td>

                              {/* 4. Ações: Apenas ícones (Editar e Excluir), sem texto */}
                              <td className="py-3.5 px-4 sm:pr-6 text-right whitespace-nowrap">
                                <div className="flex items-center justify-end gap-1.5 sm:gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEditAula(aula)}
                                    className="p-1.5 sm:p-2 rounded-xl bg-[#f4f6f0] hover:bg-[#e7e9e3] text-[#123d00] transition-colors cursor-pointer border border-[#c2c9b9]"
                                    title="Editar aula"
                                    aria-label="Editar aula"
                                  >
                                    <Pencil className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#123d00]" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteAula(aula.id)}
                                    className="p-1.5 sm:p-2 text-[#b91c1c] hover:bg-[#fee2e2] rounded-xl transition-colors cursor-pointer border border-[#fee2e2]"
                                    title="Excluir aula"
                                    aria-label="Excluir aula"
                                  >
                                    <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: LANÇAMENTO DE NOTAS                                                */}
          {/* ========================================================================= */}
          {internalTab === 'notas' && (
            <div className="space-y-4">
              <div className="bg-white p-5 rounded-3xl border border-[#c2c9b9]">
                <h3 className="font-display font-bold text-base text-[#082500] flex items-center gap-2">
                  <Award className="w-5 h-5 text-[#d97706]" />
                  <span>Lançamento de notas</span>
                </h3>
              </div>

              {/* Tabela de Disciplinas Vinculadas à Turma */}
              <div className="bg-white border border-[#c2c9b9] rounded-2xl sm:rounded-3xl overflow-hidden shadow-none w-full">
                <div className="w-full overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse table-auto min-w-[540px] sm:min-w-full">
                    <thead>
                      <tr className="bg-[#f4f6f0] text-[#082500] font-bold border-b border-[#e1e3dd]">
                        <th className="py-3.5 px-4 sm:pl-6 text-left">Nome</th>
                        <th className="py-3.5 px-4 text-center">Notas</th>
                        <th className="py-3.5 px-4 sm:pr-6 text-center">Relatório</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e1e3dd]">
                      {turmaDisciplinasVinculadas.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="p-8 text-center text-[#73796c]">
                            Nenhuma disciplina vinculada a esta turma ainda.
                          </td>
                        </tr>
                      ) : (
                        turmaDisciplinasVinculadas.map((d) => {
                          const isSemNotas = currentTurma
                            ? isDisciplinaSemNotas(currentTurma.id, d.id, d.nome)
                            : false;

                          return (
                            <tr key={d.id} className="hover:bg-[#fafbf8] transition-colors">
                              {/* 1. Nome: Exibir o nome da disciplina */}
                              <td className="py-3.5 px-4 sm:pl-6">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3">
                                  <span className="font-bold text-xs sm:text-sm text-[#082500]">
                                    {d.nome}
                                  </span>
                                  {isSemNotas && (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#fef3c7] text-[#92400e] border border-[#fde68a] w-fit">
                                      <AlertCircle className="w-3 h-3 text-[#b45309]" />
                                      <span>Não terá notas</span>
                                    </span>
                                  )}
                                </div>
                              </td>

                              {/* 2. Notas: Exibir apenas um ícone de notas */}
                              <td className="py-3.5 px-4 text-center whitespace-nowrap">
                                <div className="inline-flex items-center justify-center">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenNotasDisciplina(d)}
                                    className="p-2 sm:p-2.5 rounded-xl bg-[#f4f6f0] hover:bg-[#e7e9e3] text-[#123d00] transition-colors cursor-pointer border border-[#c2c9b9]"
                                    title={`Lançar notas dos alunos para ${d.nome}`}
                                    aria-label={`Lançar notas dos alunos para ${d.nome}`}
                                  >
                                    <GraduationCap className="w-4 h-4 text-[#123d00]" />
                                  </button>
                                </div>
                              </td>

                              {/* 3. Relatório: Exibir os botões para geração e download dos relatórios, utilizando apenas ícones, sem texto */}
                              <td className="py-3.5 px-4 sm:pr-6 text-center whitespace-nowrap">
                                <div className="inline-flex items-center justify-center gap-2">
                                  {/* PDF: ícone para gerar e baixar o relatório em PDF */}
                                  <button
                                    type="button"
                                    onClick={() => handleDownloadDisciplinaPDF(d)}
                                    className="p-2 sm:p-2.5 rounded-xl bg-[#fee2e2]/60 hover:bg-[#fee2e2] text-[#b91c1c] transition-colors cursor-pointer border border-[#fca5a5]"
                                    title={`Baixar relatório da disciplina ${d.nome} em PDF`}
                                    aria-label={`Baixar relatório da disciplina ${d.nome} em PDF`}
                                  >
                                    <FileText className="w-4 h-4" />
                                  </button>

                                  {/* CSV: ícone para gerar e baixar o relatório em formato CSV (Apenas Coordenação) */}
                                  {!isProfessorView && (
                                    <button
                                      type="button"
                                      onClick={() => handleExportDisciplinaCSV(d)}
                                      className="p-2 sm:p-2.5 rounded-xl bg-[#dcfce7]/60 hover:bg-[#dcfce7] text-[#15803d] transition-colors cursor-pointer border border-[#86efac]"
                                      title={`Baixar relatório da disciplina ${d.nome} em CSV`}
                                      aria-label={`Baixar relatório da disciplina ${d.nome} em CSV`}
                                    >
                                      <FileSpreadsheet className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: RELATÓRIOS CONSOLIDADOS (Planilhas & PDFs Timbrados)              */}
          {/* ========================================================================= */}
          {internalTab === 'relatorios' && (
            <div className="space-y-6">
              {/* Emissão Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Planilha Consolidada CSV / Excel */}
                <div className="p-6 rounded-3xl border border-[#c2c9b9] bg-white space-y-4 shadow-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-[#15803d]/10 text-[#15803d] flex items-center justify-center">
                      <FileSpreadsheet className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-display font-bold text-base text-[#082500]">
                        Planilha Consolidada (.CSV / Excel)
                      </h4>
                      <p className="text-xs text-[#52594d]">
                        Exportação de dados tabulares de rendimento e presença.
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-[#52594d] leading-relaxed">
                    Gera planilha com cabeçalho institucional contendo matrículas, nomes dos vocacionados, campos eclesiásticos, frequência nos encontros semanais síncronos, média geral e situação de aprovação. Compatível com Excel e Google Planilhas.
                  </p>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => handleExportCSV(currentTurma)}
                      className="w-full py-2.5 rounded-2xl bg-[#15803d] hover:bg-[#166534] text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer"
                    >
                      <FileSpreadsheet className="w-4 h-4" />
                      <span>Baixar Planilha Consolidada (.CSV)</span>
                    </button>
                  </div>
                </div>

                {/* PDF Formatado em Papel Timbrado */}
                <div className="p-6 rounded-3xl border border-[#c2c9b9] bg-white space-y-4 shadow-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-[#123d00]/10 text-[#123d00] flex items-center justify-center">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-display font-bold text-base text-[#082500]">
                        PDF em Papel Timbrado Oficial
                      </h4>
                      <p className="text-xs text-[#52594d]">
                        Documento oficial com brasão COMIEADEPA e assinaturas.
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-[#52594d] leading-relaxed">
                    Emite o boletim institucional formatado em papel timbrado padrão da Convenção de Ministros (COMIEADEPA), incluindo identificação da edição, grade semanal síncrona, relação nominal de alunos e espaço para homologação.
                  </p>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => onOpenReportModal(currentTurma.id)}
                      className="w-full py-2.5 rounded-2xl bg-[#123d00] hover:bg-[#0d2a00] text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer"
                    >
                      <Printer className="w-4 h-4 text-[#a2d486]" />
                      <span>Emitir Relatório em Papel Timbrado (PDF)</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Preview ao Vivo do Papel Timbrado */}
              <div className="bg-white rounded-3xl border border-[#c2c9b9] p-6 sm:p-10 space-y-6 shadow-xs">
                <div className="flex items-center justify-between border-b border-[#e1e3dd] pb-4">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-[#123d00]" />
                    <h4 className="font-display font-bold text-sm text-[#082500]">
                      Espelho Institucional do Papel Timbrado • {currentTurma.name}
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => onOpenReportModal(currentTurma.id)}
                    className="text-xs font-bold text-[#123d00] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Visualizar Impressão Completa</span>
                  </button>
                </div>

                {/* Papel Timbrado Canvas */}
                <div className="border border-[#e1e3dd] rounded-2xl p-6 sm:p-8 bg-[#fafbf8] font-serif text-xs space-y-6">
                  {/* Cabeçalho Oficial */}
                  <div className="border-b-2 border-[#123d00] pb-4 text-center space-y-1">
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#123d00] text-[#a2d486] flex items-center justify-center font-bold font-sans text-sm">
                        QGU
                      </div>
                      <div className="text-left font-sans">
                        <h5 className="font-extrabold text-sm text-[#082500] uppercase tracking-wide">
                          COMIEADEPA • CONVENÇÃO DE MINISTROS
                        </h5>
                        <p className="text-[10px] font-bold text-[#646029] uppercase tracking-widest">
                          PROGRAMA ESCRITORES QGU • RELATÓRIO OFICIAL CONSOLIDADO
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Informações da Turma e Grade */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-sans bg-white p-4 rounded-xl border border-[#e1e3dd] text-xs">
                    <div>
                      <span className="text-[10px] text-[#73796c] uppercase font-bold block">
                        Edição / Rota
                      </span>
                      <span className="font-bold text-[#082500]">
                        {currentTurma.name} (/{currentTurma.urlSlug})
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#73796c] uppercase font-bold block">
                        Grade Síncrona
                      </span>
                      <span className="font-semibold text-[#123d00]">
                        {currentTurma.gradeHoraria?.diaSemana || 'Quintas-feiras'}, {currentTurma.gradeHoraria?.horario || '20h00'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#73796c] uppercase font-bold block">
                        Período Letivo
                      </span>
                      <span className="font-semibold text-[#191c19]">
                        {currentTurma.gradeHoraria?.dataInicio || currentTurma.dataInicioAulas} a{' '}
                        {currentTurma.gradeHoraria?.dataFim || currentTurma.dataConclusao}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#73796c] uppercase font-bold block">
                        Alunos Ativos
                      </span>
                      <span className="font-bold text-[#15803d]">
                        {turmaStudents.length} matriculados
                      </span>
                    </div>
                  </div>

                  {/* Relação Resumida de Alunos */}
                  <div className="font-sans space-y-2">
                    <span className="text-[11px] font-bold text-[#082500] uppercase tracking-wider block">
                      Relação de Vocacionados Homologados
                    </span>
                    <table className="w-full text-left text-xs border border-[#e1e3dd] border-collapse bg-white">
                      <thead>
                        <tr className="bg-[#f4f6f0] text-[#082500] font-bold border-b border-[#e1e3dd]">
                          <th className="p-2">Matrícula</th>
                          <th className="p-2">Nome Completo</th>
                          <th className="p-2">Campo</th>
                          <th className="p-2 text-center">Frequência</th>
                          <th className="p-2 text-center">Média</th>
                          <th className="p-2 text-right">Situação</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#e1e3dd]">
                        {turmaStudents.slice(0, 5).map((st) => (
                          <tr key={st.alunoId}>
                            <td className="p-2 font-mono text-[11px] text-[#646029]">
                              {st.matricula}
                            </td>
                            <td className="p-2 font-bold text-[#191c19]">{st.alunoName}</td>
                            <td className="p-2 text-[#73796c]">{st.polo}</td>
                            <td className="p-2 text-center text-[#15803d] font-semibold">
                              {st.frequenciaPercent}%
                            </td>
                            <td className="p-2 text-center font-bold text-[#123d00]">
                              {st.mediaGeral.toFixed(1)}
                            </td>
                            <td className="p-2 text-right font-bold text-[#15803d]">
                              {st.statusAcademico}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {turmaStudents.length > 5 && (
                      <p className="text-[11px] text-[#73796c] italic text-right pt-1">
                        Exibindo os primeiros 5 de {turmaStudents.length} vocacionados. O relatório completo contém todos os registros.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 5: TABELA DE DISCIPLINAS & LIBERAÇÃO                                  */}
          {/* ========================================================================= */}
          {internalTab === 'disciplinas' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-3xl border border-[#c2c9b9]">
                <div>
                  <h3 className="font-display font-bold text-base text-[#082500] flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-[#123d00]" />
                    <span>Disciplinas</span>
                  </h3>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-[#123d00] bg-[#123d00]/10 px-3.5 py-2 rounded-2xl">
                  <span>{availableDisciplinas.length} disciplinas na grade</span>
                </div>
              </div>

              {/* Tabela de Disciplinas */}
              <div className="bg-white border border-[#c2c9b9] rounded-3xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-[#f4f6f0] text-[#082500] font-bold border-b border-[#e1e3dd]">
                        <th className="p-4 pl-6 text-left">id</th>
                        <th className="p-4 text-left">Nome</th>
                        <th className="p-4 text-center">Material Extra</th>
                        <th className="p-4 pr-6 text-center">Liberação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e1e3dd]">
                      {availableDisciplinas.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="p-8 text-center text-[#73796c]">
                            Nenhuma disciplina disponível.
                          </td>
                        </tr>
                      ) : (
                        availableDisciplinas.map((d) => {
                          const currentLiberadas =
                            currentTurma.disciplinasLiberadasIds !== undefined
                              ? currentTurma.disciplinasLiberadasIds
                              : (currentTurma.disciplinasIds || ['disc-1', 'disc-2']);
                          const isLiberada = currentLiberadas.includes(d.id);
                          const turmaExtrasForDisc =
                            (currentTurma.materiaisExtras || []).filter((m) => m.disciplinaId === d.id);

                          return (
                            <tr
                              key={d.id}
                              className="hover:bg-[#f8faf4] transition-colors group"
                            >
                              {/* Coluna 1: id */}
                              <td className="p-4 pl-6">
                                <span className="font-mono text-xs font-bold text-[#082500]">
                                  {d.id}
                                </span>
                              </td>

                              {/* Coluna 2: Nome */}
                              <td className="p-4">
                                <span className="font-bold text-xs text-[#082500]">
                                  {d.nome}
                                </span>
                              </td>

                              {/* Coluna 3: Material Extra - Apenas o ícone para adicionar documentos extras para a turma */}
                              <td className="p-4 text-center">
                                <div className="inline-flex items-center justify-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenMaterialExtra(d)}
                                    className="p-2 rounded-xl bg-[#f4f6f0] hover:bg-[#e1e3dd] text-[#123d00] transition-colors cursor-pointer relative group border border-[#c2c9b9]/60 shadow-2xs"
                                    title={`Adicionar documentos extras para a turma ${currentTurma.name} (${turmaExtrasForDisc.length} adicionado${turmaExtrasForDisc.length === 1 ? '' : 's'})`}
                                    aria-label={`Adicionar documentos extras para a turma na disciplina ${d.nome}`}
                                  >
                                    <FilePlus className="w-4 h-4 text-[#123d00]" />
                                    <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-[#082500] text-white text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow border border-[#a2d486]/30 z-20">
                                      Material Extra {turmaExtrasForDisc.length > 0 ? `(${turmaExtrasForDisc.length})` : ''}
                                    </span>
                                  </button>
                                  {turmaExtrasForDisc.length > 0 && (
                                    <span className="font-mono text-[10px] font-bold text-[#123d00] bg-[#123d00]/10 px-1.5 py-0.5 rounded-md">
                                      {turmaExtrasForDisc.length}
                                    </span>
                                  )}
                                </div>
                              </td>

                              {/* Coluna 4: Liberação - Apenas o ícone */}
                              <td className="p-4 pr-6 text-center">
                                <div className="inline-flex items-center justify-center">
                                  <button
                                    type="button"
                                    onClick={() => handleToggleLiberaDisciplina(d.id, d.nome)}
                                    className={`p-2 rounded-xl transition-colors cursor-pointer relative group border ${
                                      isLiberada
                                        ? 'bg-[#15803d]/10 hover:bg-[#15803d]/20 text-[#15803d] border-[#15803d]/30'
                                        : 'bg-[#b91c1c]/10 hover:bg-[#b91c1c]/20 text-[#b91c1c] border-[#b91c1c]/30'
                                    }`}
                                    title={
                                      isLiberada
                                        ? `Disciplina liberada (clique para bloquear ${d.nome})`
                                        : `Disciplina bloqueada (clique para liberar ${d.nome})`
                                    }
                                    aria-label={
                                      isLiberada
                                        ? `Bloquear disciplina ${d.nome}`
                                        : `Liberar disciplina ${d.nome}`
                                    }
                                  >
                                    {isLiberada ? (
                                      <Unlock className="w-4 h-4" />
                                    ) : (
                                      <Lock className="w-4 h-4" />
                                    )}
                                    <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-[#082500] text-white text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow border border-[#a2d486]/30 z-20">
                                      {isLiberada ? 'Liberada' : 'Bloqueada'}
                                    </span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  )}

      {/* ========================================================================= */}
      {/* MODAL: CRIAR OU EDITAR TURMA                                              */}
      {/* Define a rota, seleciona as disciplinas e configura a grade               */}
      {/* ========================================================================= */}
      {showTurmaModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <form
            onSubmit={handleSaveTurma}
            className="bg-white rounded-3xl border border-[#c2c9b9] p-6 sm:p-8 max-w-2xl w-full space-y-5 shadow-2xl animate-in zoom-in-95 my-8 max-h-[92vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#e1e3dd]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#123d00] text-[#a2d486] flex items-center justify-center">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-display font-bold text-lg text-[#082500]">
                      {turmaToEdit ? 'Editar Turma' : 'Criar Nova Turma Acadêmica'}
                    </h3>
                    {turmaToEdit && (
                      <span className="px-2 py-0.5 rounded-md bg-[#f4f6f0] border border-[#c2c9b9] text-[11px] font-mono font-bold text-[#082500]">
                        ID: {turmaToEdit.id}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#73796c]">
                    {turmaToEdit
                      ? 'Edite o ID, rota, disciplinas do currículo e configure a grade semanal.'
                      : 'Defina o ID, rota, disciplinas do currículo e configure a grade semanal.'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowTurmaModal(false)}
                className="p-1.5 rounded-full text-[#73796c] hover:bg-[#f4f6f0] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 1. Identificação da Turma: ID e Nome */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-1">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-[#191c19] block">
                    ID da Turma <span className="text-[#b91c1c]">*</span>
                  </label>
                  {!turmaToEdit && (
                    <button
                      type="button"
                      onClick={() => {
                        const baseYear = new Date().getFullYear();
                        let newId = `turma-${baseYear}`;
                        let counter = 2;
                        while (turmas.some((t) => t.id.toLowerCase() === newId.toLowerCase())) {
                          newId = `turma-${baseYear}-${counter}`;
                          counter++;
                        }
                        setTurmaForm((prev) => ({
                          ...prev,
                          id: newId,
                          urlSlug: prev.urlSlug || newId.replace(/[^a-z0-9]/g, ''),
                        }));
                        setIdError(null);
                      }}
                      className="text-[10px] text-[#123d00] hover:underline font-semibold cursor-pointer"
                      title="Sugerir ID automático"
                    >
                      Sugerir ID
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  required
                  value={turmaForm.id}
                  onChange={(e) => {
                    setTurmaForm({
                      ...turmaForm,
                      id: e.target.value.trim(),
                    });
                    if (idError) setIdError(null);
                  }}
                  placeholder="Ex: turma-2026"
                  className={`w-full px-3.5 py-2.5 bg-[#f8faf4] border rounded-xl text-xs font-mono font-bold text-[#082500] focus:outline-hidden ${
                    idError
                      ? 'border-[#b91c1c] focus:border-[#b91c1c]'
                      : 'border-[#c2c9b9] focus:border-[#123d00]'
                  }`}
                />
                {idError ? (
                  <span className="text-[10px] text-[#b91c1c] font-medium mt-1 block">
                    {idError}
                  </span>
                ) : (
                  <span className="text-[10px] text-[#73796c] mt-1 block">
                    {turmaToEdit
                      ? 'Identificador principal (editável).'
                      : 'Código único para identificação da turma.'}
                  </span>
                )}
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-[#191c19] block mb-1">
                  Nome da Turma <span className="text-[#b91c1c]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={turmaForm.name}
                  onChange={(e) => setTurmaForm({ ...turmaForm, name: e.target.value })}
                  placeholder="Ex: Turma 2026 • Formação de Escritores Teológicos"
                  className="w-full px-3.5 py-2.5 bg-[#f8faf4] border border-[#c2c9b9] rounded-xl text-xs font-medium focus:outline-hidden focus:border-[#123d00]"
                />
                <span className="text-[10px] text-[#73796c] mt-1 block">
                  Nome oficial da edição para exibição pública e aos alunos.
                </span>
              </div>
            </div>

            {/* 2. Definir a Rota */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-[#191c19] block mb-1">
                  Rota Oficial da Turma (URL Slug)
                </label>
                <div className="flex items-center">
                  <span className="px-3 py-2.5 bg-[#e1e3dd] border border-r-0 border-[#c2c9b9] rounded-l-xl text-xs font-mono font-bold text-[#52594d]">
                    /
                  </span>
                  <input
                    type="text"
                    required
                    value={turmaForm.urlSlug}
                    onChange={(e) =>
                      setTurmaForm({
                        ...turmaForm,
                        urlSlug: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''),
                      })
                    }
                    placeholder="turma2026"
                    className="w-full px-3 py-2.5 bg-[#f8faf4] border border-[#c2c9b9] rounded-r-xl text-xs font-mono font-bold focus:outline-hidden focus:border-[#123d00]"
                  />
                </div>
                <span className="text-[10px] text-[#73796c] mt-1 block">
                  Acesso: comieadepa.org/{turmaForm.urlSlug || 'sua-rota'}
                </span>
              </div>

              <div>
                <label className="text-xs font-bold text-[#191c19] block mb-1">
                  Status da Edição
                </label>
                <select
                  value={turmaForm.status}
                  onChange={(e) =>
                    setTurmaForm({ ...turmaForm, status: e.target.value as TurmaStatus })
                  }
                  className="w-full px-3.5 py-2.5 bg-[#f8faf4] border border-[#c2c9b9] rounded-xl text-xs font-bold focus:outline-hidden focus:border-[#123d00]"
                >
                  <option value="Em Andamento">Em Andamento (Aulas Ativas)</option>
                  <option value="Concluído">Concluído (Formados)</option>
                  <option value="Aberto">Aberto (Captações / Inscrições)</option>
                </select>
              </div>
            </div>

            {/* 3. Selecionar Disciplinas */}
            <div className="space-y-2 bg-[#f8faf4] p-4 rounded-2xl border border-[#e1e3dd]">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-xs font-bold text-[#082500] block">
                    Disciplinas do Repositório (Selecione para esta turma)
                  </label>
                  <span className="text-[11px] text-[#73796c]">
                    Marque as disciplinas que compõem a grade pedagógica desta edição.
                  </span>
                </div>
                <span className="text-xs font-bold text-[#123d00]">
                  {turmaForm.selectedDisciplinasIds.length} selecionadas
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                {availableDisciplinas.map((d) => {
                  const isChecked = turmaForm.selectedDisciplinasIds.includes(d.id);
                  return (
                    <label
                      key={d.id}
                      className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-xs transition-colors cursor-pointer ${
                        isChecked
                          ? 'bg-white border-[#123d00] shadow-2xs'
                          : 'bg-[#fafbf8] border-[#e1e3dd] text-[#73796c]'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setTurmaForm({
                              ...turmaForm,
                              selectedDisciplinasIds: [...turmaForm.selectedDisciplinasIds, d.id],
                            });
                          } else {
                            setTurmaForm({
                              ...turmaForm,
                              selectedDisciplinasIds: turmaForm.selectedDisciplinasIds.filter(
                                (id) => id !== d.id
                              ),
                            });
                          }
                        }}
                        className="mt-0.5 rounded text-[#123d00] focus:ring-[#123d00]"
                      />
                      <div>
                        <span className="font-bold text-[#082500] block">{d.nome}</span>
                        <span className="text-[10px] text-[#646029] font-mono">
                          {d.codigo || 'TEO'} • {d.cargaHoraria}h
                        </span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* 4. Configurar a Grade Horária */}
            <div className="space-y-3 bg-[#fafbf8] p-4 rounded-2xl border border-[#c2c9b9]">
              <div className="flex items-center gap-2 text-[#082500]">
                <Clock className="w-4 h-4 text-[#123d00]" />
                <h4 className="font-display font-bold text-xs uppercase tracking-wider">
                  Configuração da Grade de Encontros Síncronos
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#191c19] block mb-1">
                    Dia dos Encontros Semanais
                  </label>
                  <select
                    value={turmaForm.diaSemana}
                    onChange={(e) => setTurmaForm({ ...turmaForm, diaSemana: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-[#c2c9b9] rounded-xl text-xs font-semibold focus:outline-hidden focus:border-[#123d00]"
                  >
                    <option value="Quintas-feiras">Quintas-feiras (Padrão Oficial)</option>
                    <option value="Segundas-feiras">Segundas-feiras</option>
                    <option value="Terças-feiras">Terças-feiras</option>
                    <option value="Quartas-feiras">Quartas-feiras</option>
                    <option value="Sextas-feiras">Sextas-feiras</option>
                    <option value="Sábados">Sábados</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#191c19] block mb-1">
                    Horário do Encontro
                  </label>
                  <input
                    type="text"
                    value={turmaForm.horario}
                    onChange={(e) => setTurmaForm({ ...turmaForm, horario: e.target.value })}
                    placeholder="20h00"
                    className="w-full px-3 py-2 bg-white border border-[#c2c9b9] rounded-xl text-xs font-bold focus:outline-hidden focus:border-[#123d00]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#191c19] block mb-1">
                    Data de Início das Aulas
                  </label>
                  <input
                    type="text"
                    value={turmaForm.dataInicioGrade}
                    onChange={(e) =>
                      setTurmaForm({
                        ...turmaForm,
                        dataInicioGrade: e.target.value,
                        dataInicioAulas: e.target.value,
                      })
                    }
                    placeholder="01/10/2026"
                    className="w-full px-3 py-2 bg-white border border-[#c2c9b9] rounded-xl text-xs focus:outline-hidden focus:border-[#123d00]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#191c19] block mb-1">
                    Data de Conclusão / Formatura
                  </label>
                  <input
                    type="text"
                    value={turmaForm.dataFimGrade}
                    onChange={(e) =>
                      setTurmaForm({
                        ...turmaForm,
                        dataFimGrade: e.target.value,
                        dataConclusao: e.target.value,
                      })
                    }
                    placeholder="10/12/2026"
                    className="w-full px-3 py-2 bg-white border border-[#c2c9b9] rounded-xl text-xs focus:outline-hidden focus:border-[#123d00]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#191c19] block mb-1">
                  Link da Sala Virtual (Google Meet / Encontro Síncrono)
                </label>
                <input
                  type="text"
                  value={turmaForm.linkEncontro}
                  onChange={(e) => setTurmaForm({ ...turmaForm, linkEncontro: e.target.value })}
                  placeholder="https://meet.google.com/qgu-2026-comieadepa"
                  className="w-full px-3 py-2 bg-white border border-[#c2c9b9] rounded-xl text-xs font-mono focus:outline-hidden focus:border-[#123d00]"
                />
              </div>
            </div>

            {/* Vagas & Descrição */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-bold text-[#191c19] block mb-1">
                  Vagas Disponíveis
                </label>
                <input
                  type="number"
                  min="5"
                  max="200"
                  value={turmaForm.vagas}
                  onChange={(e) => setTurmaForm({ ...turmaForm, vagas: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-[#f8faf4] border border-[#c2c9b9] rounded-xl text-xs font-bold focus:outline-hidden focus:border-[#123d00]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-[#191c19] block mb-1">
                  Resumo do Edital / Descrição
                </label>
                <input
                  type="text"
                  value={turmaForm.editalResumo}
                  onChange={(e) => setTurmaForm({ ...turmaForm, editalResumo: e.target.value })}
                  placeholder="Edital N° 01/2026 - COMIEADEPA..."
                  className="w-full px-3 py-2 bg-[#f8faf4] border border-[#c2c9b9] rounded-xl text-xs focus:outline-hidden focus:border-[#123d00]"
                />
              </div>
            </div>

            {/* Botões do Formulário */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#e1e3dd]">
              <button
                type="button"
                onClick={() => setShowTurmaModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#52594d] hover:bg-[#f4f6f0] cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-[#123d00] hover:bg-[#0d2a00] text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                {turmaToEdit ? 'Salvar Alterações' : 'Criar Turma'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: NOVO / EDITAR AVISO NO MURAL                                       */}
      {/* ========================================================================= */}
      {showAvisoModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveAviso}
            className="bg-white rounded-3xl border border-[#c2c9b9] p-6 max-w-lg w-full space-y-4 shadow-2xl animate-in zoom-in-95"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#e1e3dd]">
              <h3 className="font-display font-bold text-lg text-[#082500]">
                {avisoToEdit ? 'Editar Aviso' : 'Publicar Aviso'}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowAvisoModal(false);
                  setAvisoToEdit(null);
                }}
                className="p-1.5 rounded-full text-[#73796c] hover:bg-[#f4f6f0] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="text-xs font-bold text-[#191c19] block mb-1">
                Título
              </label>
              <input
                type="text"
                required
                value={newAvisoTitulo}
                onChange={(e) => setNewAvisoTitulo(e.target.value)}
                placeholder="Ex: Orientações sobre o encontro de quinta-feira"
                className="w-full px-3 py-2 bg-[#f8faf4] border border-[#c2c9b9] rounded-xl text-xs focus:outline-hidden focus:border-[#123d00]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-[#191c19] block mb-1">
                  Categoria
                </label>
                <select
                  value={newAvisoCategoria}
                  onChange={(e) => setNewAvisoCategoria(e.target.value as any)}
                  className="w-full px-3 py-2 bg-[#f8faf4] border border-[#c2c9b9] rounded-xl text-xs font-semibold focus:outline-hidden focus:border-[#123d00]"
                >
                  <option value="Geral">Geral</option>
                  <option value="Aula">Aula</option>
                  <option value="Trabalho">Trabalho</option>
                  <option value="Alerta">Alerta</option>
                </select>
              </div>

              <div className="flex items-center pt-5">
                <label className="flex items-center gap-2 text-xs font-bold text-[#082500] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newAvisoImportante}
                    onChange={(e) => setNewAvisoImportante(e.target.checked)}
                    className="rounded text-[#123d00] focus:ring-[#123d00]"
                  />
                  <span>Fixar no topo do mural</span>
                </label>
              </div>
            </div>

            <div className="space-y-3 p-3 bg-[#f8faf4] border border-[#e1e3dd] rounded-2xl">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#082500]">
                <LinkIcon className="w-3.5 h-3.5 text-[#123d00]" />
                <span>Link Anexo ao Comunicado (opcional)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-[#191c19] block mb-1">
                    Endereço do Link (URL)
                  </label>
                  <div className="relative">
                    <LinkIcon className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#73796c]" />
                    <input
                      type="url"
                      value={newAvisoLink}
                      onChange={(e) => setNewAvisoLink(e.target.value)}
                      placeholder="https://meet.google.com/... ou https://..."
                      className="w-full pl-8 pr-3 py-2 bg-white border border-[#c2c9b9] rounded-xl text-xs focus:outline-hidden focus:border-[#123d00]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-[#191c19] block mb-1">
                    Título do Link (texto do botão)
                  </label>
                  <input
                    type="text"
                    value={newAvisoLinkTitulo}
                    onChange={(e) => setNewAvisoLinkTitulo(e.target.value)}
                    placeholder="Ex: Acessar Sala do Encontro"
                    className="w-full px-3 py-2 bg-white border border-[#c2c9b9] rounded-xl text-xs focus:outline-hidden focus:border-[#123d00]"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-[#191c19] block mb-1">
                Conteúdo
              </label>
              <textarea
                rows={4}
                required
                value={newAvisoConteudo}
                onChange={(e) => setNewAvisoConteudo(e.target.value)}
                placeholder="Escreva a mensagem para os alunos da turma..."
                className="w-full px-3 py-2 bg-[#f8faf4] border border-[#c2c9b9] rounded-xl text-xs focus:outline-hidden focus:border-[#123d00]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#e1e3dd]">
              <button
                type="button"
                onClick={() => {
                  setShowAvisoModal(false);
                  setAvisoToEdit(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#52594d] hover:bg-[#f4f6f0] cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-[#123d00] hover:bg-[#0d2a00] text-white text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5 text-[#a2d486]" />
                <span>{avisoToEdit ? 'Salvar Alterações' : 'Publicar Aviso'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: GERENCIAR / VINCULAR PROFESSORES DA TURMA                          */}
      {/* ========================================================================= */}
      {showProfessorsModal && turmaForProfessors && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#c2c9b9] p-6 max-w-lg w-full space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[#e1e3dd]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#123d00]/10 text-[#123d00]">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-base text-[#082500]">
                    Professores da Turma
                  </h3>
                  <p className="text-xs text-[#52594d]">
                    {turmaForProfessors.name} <span className="font-mono font-bold text-[#123d00]">(ID: {turmaForProfessors.id})</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowProfessorsModal(false);
                  setTurmaForProfessors(null);
                }}
                className="p-1.5 rounded-full text-[#73796c] hover:bg-[#f4f6f0] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[#52594d]">
              Vincule ou desvincule os docentes e professores titulares responsáveis pelas aulas e acompanhamento desta turma.
            </p>

            {/* List of Professors */}
            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
              {users.filter((u) => u.role === 'professor').length === 0 ? (
                <div className="p-6 text-center text-xs text-[#73796c] bg-[#f8faf4] rounded-2xl border border-dashed border-[#c2c9b9]">
                  Nenhum professor cadastrado no sistema. Cadastre novos docentes na aba <strong>Gestão de Usuários</strong>.
                </div>
              ) : (
                users
                  .filter((u) => u.role === 'professor')
                  .map((prof) => {
                    const isLinked = getTurmaProfessorIds(turmaForProfessors).includes(prof.id);
                    const otherTurma = turmas.find((t) => t.id === prof.turmaId && t.id !== turmaForProfessors.id);

                    return (
                      <div
                        key={prof.id}
                        className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                          isLinked
                            ? 'bg-[#f4f8f0] border-[#a2d486] ring-1 ring-[#a2d486]/40'
                            : 'bg-[#fafbf8] border-[#e1e3dd] hover:border-[#c2c9b9]'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-full bg-[#123d00] text-white flex items-center justify-center font-bold text-xs shrink-0 border border-[#b9b474]">
                            {prof.initials || 'PR'}
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold text-[#082500] text-xs block truncate">
                              {prof.name}
                            </span>
                            <span className="text-[11px] text-[#73796c] block truncate">
                              {prof.disciplina || 'Docente / Professor Titular'}
                            </span>
                            <div className="mt-1">
                              {isLinked ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#15803d] bg-[#15803d]/10 px-2 py-0.5 rounded-md">
                                  <Check className="w-3 h-3" />
                                  Vinculado a esta turma
                                </span>
                              ) : otherTurma ? (
                                <span className="inline-flex items-center text-[10px] font-medium text-[#73796c] bg-white px-2 py-0.5 rounded-md border border-[#e1e3dd]">
                                  Vinculado à {otherTurma.name}
                                </span>
                              ) : (
                                <span className="inline-flex items-center text-[10px] font-medium text-[#73796c] bg-white px-2 py-0.5 rounded-md border border-[#e1e3dd]">
                                  Disponível
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Link / Unlink action */}
                        <div>
                          {isLinked ? (
                            <button
                              type="button"
                              onClick={() => handleToggleProfessor(prof.id, false)}
                              className="px-3 py-1.5 rounded-xl border border-[#fee2e2] bg-[#fef2f2] hover:bg-[#fee2e2] text-[#b91c1c] text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 shadow-2xs"
                              title="Desvincular professor desta turma"
                            >
                              <UserMinus className="w-3.5 h-3.5" />
                              <span>Desvincular</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleToggleProfessor(prof.id, true)}
                              className="px-3 py-1.5 rounded-xl bg-[#123d00] hover:bg-[#0d2a00] text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 shadow-xs"
                              title="Vincular professor a esta turma"
                            >
                              <UserPlus className="w-3.5 h-3.5 text-[#a2d486]" />
                              <span>Vincular</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[#e1e3dd]">
              <span className="text-xs font-semibold text-[#52594d]">
                Total:{' '}
                <strong className="text-[#082500]">
                  {getTurmaProfessorIds(turmaForProfessors).length} professor(es) vinculado(s)
                </strong>
              </span>
              <button
                type="button"
                onClick={() => {
                  setShowProfessorsModal(false);
                  setTurmaForProfessors(null);
                }}
                className="px-4 py-2 rounded-xl bg-[#123d00] hover:bg-[#0d2a00] text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                Concluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: LANÇAR / EDITAR NOTAS & FREQUÊNCIA                                  */}
      {/* ========================================================================= */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveStudentGrade}
            className="bg-white rounded-3xl border border-[#c2c9b9] p-6 max-w-md w-full space-y-4 shadow-2xl animate-in zoom-in-95"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#e1e3dd]">
              <div>
                <h3 className="font-display font-bold text-base text-[#082500]">
                  Lançar Nota e Frequência
                </h3>
                <p className="text-xs text-[#52594d]">
                  {editingStudent.alunoName} ({editingStudent.matricula})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingStudent(null)}
                className="p-1.5 rounded-full text-[#73796c] hover:bg-[#f4f6f0] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-[#191c19] block mb-1">
                  Média Geral (0 a 10)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  required
                  value={studentNotaInput}
                  onChange={(e) => setStudentNotaInput(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-[#f8faf4] border border-[#c2c9b9] rounded-xl text-xs font-bold focus:outline-hidden focus:border-[#123d00]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#191c19] block mb-1">
                  Presenças (de 20 aulas)
                </label>
                <input
                  type="number"
                  min="0"
                  max="20"
                  required
                  value={studentPresencasInput}
                  onChange={(e) => setStudentPresencasInput(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-[#f8faf4] border border-[#c2c9b9] rounded-xl text-xs font-bold focus:outline-hidden focus:border-[#123d00]"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-[#191c19] block mb-1">
                Situação Acadêmica
              </label>
              <select
                value={studentStatusInput}
                onChange={(e) => setStudentStatusInput(e.target.value as any)}
                className="w-full px-3 py-2 bg-[#f8faf4] border border-[#c2c9b9] rounded-xl text-xs font-bold focus:outline-hidden focus:border-[#123d00]"
              >
                <option value="Cursando">Cursando</option>
                <option value="Formado">Formado</option>
                <option value="Aprovado">Aprovado</option>
                <option value="Em Recuperação">Em Recuperação</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#e1e3dd]">
              <button
                type="button"
                onClick={() => setEditingStudent(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#52594d] hover:bg-[#f4f6f0] cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-[#123d00] hover:bg-[#0d2a00] text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                Salvar Avaliação
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: FAZER CHAMADA DA TURMA (LANÇAR FREQUÊNCIA EM LOTE)                 */}
      {/* ========================================================================= */}
      {showBatchChamadaModal && currentTurma && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveBatchChamada}
            className="bg-white rounded-3xl border border-[#c2c9b9] p-6 max-w-xl w-full space-y-4 shadow-2xl animate-in zoom-in-95 max-h-[90vh] flex flex-col"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#e1e3dd] shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#15803d]/10 text-[#15803d] flex items-center justify-center">
                  <CalendarCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-base text-[#082500]">
                    Chamada e Frequência da Turma
                  </h3>
                  <p className="text-xs text-[#52594d]">
                    {currentTurma.name} • {turmaStudents.length} vocacionados matriculados
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowBatchChamadaModal(false)}
                className="p-1.5 rounded-full text-[#73796c] hover:bg-[#f4f6f0] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Ações rápidas da chamada */}
            <div className="flex items-center justify-between bg-[#fafbf8] p-3 rounded-2xl border border-[#e1e3dd] shrink-0">
              <span className="text-xs font-bold text-[#082500]">
                Presença no Encontro Atual
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const allTrue: Record<string, boolean> = {};
                    turmaStudents.forEach((s) => (allTrue[s.alunoId] = true));
                    setChamadaPresentesMap(allTrue);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-[#123d00]/10 hover:bg-[#123d00]/20 text-[#123d00] text-xs font-bold transition-colors cursor-pointer"
                >
                  Marcar Todos Presentes
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const allFalse: Record<string, boolean> = {};
                    turmaStudents.forEach((s) => (allFalse[s.alunoId] = false));
                    setChamadaPresentesMap(allFalse);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-[#52594d] text-xs font-bold transition-colors cursor-pointer"
                >
                  Desmarcar Todos
                </button>
              </div>
            </div>

            {/* Lista dos alunos para chamada */}
            <div className="overflow-y-auto space-y-2 pr-1 flex-1">
              {turmaStudents.map((st) => {
                const isPresente = chamadaPresentesMap[st.alunoId] ?? true;
                return (
                  <div
                    key={st.alunoId}
                    onClick={() => {
                      setChamadaPresentesMap((prev) => ({
                        ...prev,
                        [st.alunoId]: !isPresente,
                      }));
                    }}
                    className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 cursor-pointer ${
                      isPresente
                        ? 'bg-[#f4f8f0] border-[#a2d486] ring-1 ring-[#a2d486]/30'
                        : 'bg-white border-[#e1e3dd] hover:border-[#c2c9b9]'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                        isPresente ? 'bg-[#15803d] text-white' : 'bg-gray-200 text-gray-600'
                      }`}>
                        {isPresente ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                      </div>
                      <div className="min-w-0">
                        <span className="font-bold text-xs text-[#082500] block truncate">
                          {st.alunoName}
                        </span>
                        <div className="flex items-center gap-2 text-[10px] text-[#73796c]">
                          <span>Matrícula: {st.matricula}</span>
                          <span>•</span>
                          <span>{st.polo}</span>
                          <span>•</span>
                          <span>Atual: {st.presencas}/{st.aulasTotais || 20} ({st.frequenciaPercent}%)</span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setChamadaPresentesMap((prev) => ({
                          ...prev,
                          [st.alunoId]: !isPresente,
                        }));
                      }}
                      className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors shrink-0 ${
                        isPresente
                          ? 'bg-[#15803d] text-white shadow-2xs'
                          : 'bg-[#fee2e2] text-[#b91c1c]'
                      }`}
                    >
                      {isPresente ? 'Presente' : 'Ausente'}
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#e1e3dd] shrink-0">
              <button
                type="button"
                onClick={() => setShowBatchChamadaModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#52594d] hover:bg-[#f4f6f0] cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-[#123d00] hover:bg-[#0d2a00] text-white text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-4 h-4 text-[#a2d486]" />
                <span>Salvar Chamada (+1 Encontro)</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: LANÇAR NOTAS EM LOTE                                               */}
      {/* ========================================================================= */}
      {showBatchGradesModal && currentTurma && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveBatchGrades}
            className="bg-white rounded-3xl border border-[#c2c9b9] p-6 max-w-2xl w-full space-y-4 shadow-2xl animate-in zoom-in-95 max-h-[90vh] flex flex-col"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#e1e3dd] shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#d97706]/10 text-[#d97706] flex items-center justify-center">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-base text-[#082500]">
                    Lançamento de Notas em Lote
                  </h3>
                  <p className="text-xs text-[#52594d]">
                    {currentTurma.name} • Insira ou atualize as notas gerais dos alunos
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowBatchGradesModal(false)}
                className="p-1.5 rounded-full text-[#73796c] hover:bg-[#f4f6f0] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto space-y-2 pr-1 flex-1">
              <div className="grid grid-cols-12 gap-2 px-3 py-1.5 bg-[#f4f6f0] rounded-xl text-[11px] font-bold text-[#082500]">
                <div className="col-span-6">Aluno Vocacionado</div>
                <div className="col-span-3 text-center">Média Atual</div>
                <div className="col-span-3 text-center">Nova Nota (0 a 10)</div>
              </div>

              {turmaStudents.map((st) => (
                <div
                  key={st.alunoId}
                  className="grid grid-cols-12 gap-2 items-center p-3 bg-[#fafbf8] border border-[#e1e3dd] rounded-2xl hover:border-[#c2c9b9] transition-colors"
                >
                  <div className="col-span-6 min-w-0">
                    <span className="font-bold text-xs text-[#082500] block truncate">
                      {st.alunoName}
                    </span>
                    <span className="text-[10px] text-[#73796c]">
                      {st.matricula} • {st.polo}
                    </span>
                  </div>

                  <div className="col-span-3 text-center">
                    <span className="font-bold text-xs text-[#52594d]">
                      {st.mediaGeral.toFixed(1)}
                    </span>
                  </div>

                  <div className="col-span-3">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="10"
                      value={batchGradesMap[st.alunoId] ?? st.mediaGeral}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setBatchGradesMap((prev) => ({
                          ...prev,
                          [st.alunoId]: Math.max(0, Math.min(10, val)),
                        }));
                      }}
                      className="w-full px-2.5 py-1.5 bg-white border border-[#c2c9b9] rounded-xl text-xs font-bold text-center focus:outline-hidden focus:border-[#123d00]"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#e1e3dd] shrink-0">
              <button
                type="button"
                onClick={() => setShowBatchGradesModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#52594d] hover:bg-[#f4f6f0] cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-[#123d00] hover:bg-[#0d2a00] text-white text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-4 h-4 text-[#a2d486]" />
                <span>Salvar Todas as Notas</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: MATRICULAR NOVO ALUNO                                               */}
      {/* ========================================================================= */}
      {showEnrollModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleEnrollStudent}
            className="bg-white rounded-3xl border border-[#c2c9b9] p-6 max-w-md w-full space-y-4 shadow-2xl animate-in zoom-in-95"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#e1e3dd]">
              <h3 className="font-display font-bold text-base text-[#082500]">
                Matricular Vocacionado na Turma
              </h3>
              <button
                type="button"
                onClick={() => setShowEnrollModal(false)}
                className="p-1.5 rounded-full text-[#73796c] hover:bg-[#f4f6f0] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="text-xs font-bold text-[#191c19] block mb-1">
                Nome Completo do Vocacionado *
              </label>
              <input
                type="text"
                required
                value={newStudentName}
                onChange={(e) => setNewStudentName(e.target.value)}
                placeholder="Ex: Pr. Daniel Alencar"
                className="w-full px-3 py-2 bg-[#f8faf4] border border-[#c2c9b9] rounded-xl text-xs focus:outline-hidden focus:border-[#123d00]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-[#191c19] block mb-1">
                  E-mail de Acesso
                </label>
                <input
                  type="email"
                  value={newStudentEmail}
                  onChange={(e) => setNewStudentEmail(e.target.value)}
                  placeholder="aluno@comieadepa.org.br"
                  className="w-full px-3 py-2 bg-[#f8faf4] border border-[#c2c9b9] rounded-xl text-xs focus:outline-hidden focus:border-[#123d00]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#191c19] block mb-1">
                  WhatsApp / Contato
                </label>
                <input
                  type="text"
                  value={newStudentPhone}
                  onChange={(e) => setNewStudentPhone(e.target.value)}
                  placeholder="(91) 98000-0000"
                  className="w-full px-3 py-2 bg-[#f8faf4] border border-[#c2c9b9] rounded-xl text-xs focus:outline-hidden focus:border-[#123d00]"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-[#191c19] block mb-1">
                Campo *
              </label>
              <input
                type="text"
                required
                value={newStudentPolo}
                onChange={(e) => setNewStudentPolo(e.target.value)}
                placeholder="Campo Belém Central - Belém/PA"
                className="w-full px-3 py-2 bg-[#f8faf4] border border-[#c2c9b9] rounded-xl text-xs focus:outline-hidden focus:border-[#123d00]"
              />
            </div>

            {/* Aviso de criação automática de usuário */}
            <div className="p-3 bg-[#f4f6f0] border border-[#a2d486]/40 rounded-2xl flex items-start gap-2.5 text-[11px] text-[#082500]">
              <UserCheck className="w-4 h-4 text-[#123d00] shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Criação Automática de Usuário</span>
                <span className="text-[#52594d]">
                  Ao confirmar a matrícula, um usuário com perfil <strong>Aluno Vocacionado</strong> será criado automaticamente para esta turma com a senha padrão <code>comieadepa2026</code>.
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#e1e3dd]">
              <button
                type="button"
                onClick={() => setShowEnrollModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#52594d] hover:bg-[#f4f6f0] cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-[#123d00] hover:bg-[#0d2a00] text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                Confirmar Matrícula
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CONFIRMAR EXCLUSÃO DE TURMA                                        */}
      {/* ========================================================================= */}
      {turmaToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#c2c9b9] p-6 max-w-md w-full space-y-4 shadow-2xl animate-in zoom-in-95">
            <h3 className="font-display font-bold text-lg text-[#082500]">
              Confirmar Exclusão de Turma
            </h3>
            <p className="text-xs text-[#52594d] leading-relaxed">
              Tem certeza que deseja excluir a turma <strong>{turmaToDelete.name}</strong>? Os dados acadêmicos e alunos matriculados nesta edição serão desvinculados.
            </p>
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#e1e3dd]">
              <button
                type="button"
                onClick={() => setTurmaToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#52594d] hover:bg-[#f4f6f0] cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteTurma}
                className="px-5 py-2 rounded-xl bg-[#b91c1c] hover:bg-[#991b1b] text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                Confirmar Exclusão
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ========================================================================= */}
      {/* MODAL: DOCUMENTOS EXTRAS DA TURMA                                         */}
      {/* ========================================================================= */}
      {showMaterialExtraModal && selectedDisciplinaForExtra && currentTurma && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#c2c9b9] p-6 max-w-xl w-full space-y-5 shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between gap-3 pb-3 border-b border-[#e1e3dd]">
              <div className="flex items-center gap-2">
                <FilePlus className="w-5 h-5 text-[#123d00]" />
                <h3 className="font-display font-bold text-lg text-[#082500]">
                  Documentos Extras da Turma
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowMaterialExtraModal(false);
                  setSelectedDisciplinaForExtra(null);
                }}
                className="p-1.5 rounded-xl hover:bg-[#f4f6f0] text-[#73796c] hover:text-[#082500] transition-colors cursor-pointer"
                title="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Seletor do Tipo de Material: Documento vs Link */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#191c19] block">
                Tipo de material:
              </label>
              <div className="grid grid-cols-2 gap-2 bg-[#f4f6f0] p-1.5 rounded-2xl border border-[#c2c9b9]/80">
                {/* 1. Documento */}
                <button
                  type="button"
                  onClick={() => {
                    setNewExtraCategoria('documento');
                    if (newExtraTipo === 'link') setNewExtraTipo('pdf');
                  }}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    newExtraCategoria === 'documento'
                      ? 'bg-[#123d00] text-white shadow-xs'
                      : 'bg-white text-[#52594d] hover:text-[#082500] border border-transparent hover:border-[#c2c9b9]/60'
                  }`}
                >
                  <FileUp className="w-4 h-4" />
                  <span>Documento</span>
                </button>

                {/* 2. Link */}
                <button
                  type="button"
                  onClick={() => {
                    setNewExtraCategoria('link');
                    setNewExtraTipo('link');
                  }}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    newExtraCategoria === 'link'
                      ? 'bg-[#123d00] text-white shadow-xs'
                      : 'bg-white text-[#52594d] hover:text-[#082500] border border-transparent hover:border-[#c2c9b9]/60'
                  }`}
                >
                  <LinkIcon className="w-4 h-4" />
                  <span>Link</span>
                </button>
              </div>
            </div>

            {/* ABA DE UPLOAD: Documento (.pdf, .docx, .doc, PPT ou PPTX) */}
            {newExtraCategoria === 'documento' && (
              <form onSubmit={handleSaveMaterialExtra} className="bg-[#fafbf8] border border-[#e1e3dd] rounded-2xl p-4 space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#082500] uppercase tracking-wider flex items-center gap-1.5">
                    <FileUp className="w-3.5 h-3.5 text-[#123d00]" />
                    <span>{editingExtraId ? 'Editar Documento' : 'Upload de Documento'}</span>
                  </span>
                  <span className="text-[10px] text-[#73796c] font-medium">
                    {editingExtraId ? 'Modo de edição' : '.pdf, .docx, .doc, PPT, PPTX'}
                  </span>
                </div>

                {/* Dropzone de Upload Compacto */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDraggingExtraFile(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    setIsDraggingExtraFile(false);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDraggingExtraFile(false);
                    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                      handleExtraFilePicked(e.dataTransfer.files[0]);
                    }
                  }}
                  onClick={() => extraFileInputRef.current?.click()}
                  className={`border border-dashed rounded-xl px-3.5 py-2.5 text-center transition-all cursor-pointer ${
                    isDraggingExtraFile
                      ? 'border-[#123d00] bg-[#123d00]/5 scale-[0.99]'
                      : newExtraFileName
                      ? 'border-[#a2d486] bg-white'
                      : 'border-[#c2c9b9] hover:border-[#123d00] bg-white hover:bg-[#f8faf4]'
                  }`}
                >
                  <input
                    ref={extraFileInputRef}
                    type="file"
                    accept=".pdf,.docx,.doc,.ppt,.pptx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        handleExtraFilePicked(e.target.files[0]);
                      }
                    }}
                    className="hidden"
                  />

                  {newExtraFileName ? (
                    <div className="flex items-center justify-between gap-2.5 text-left py-0.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          newExtraTipo === 'pdf'
                            ? 'bg-[#fee2e2] text-[#b91c1c]'
                            : newExtraTipo === 'doc'
                            ? 'bg-[#dbeafe] text-[#1d4ed8]'
                            : 'bg-[#ffedd5] text-[#c2410c]'
                        }`}>
                          {newExtraTipo === 'ppt' ? (
                            <Presentation className="w-4 h-4" />
                          ) : (
                            <FileText className="w-4 h-4" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-[#082500] block truncate">
                            {newExtraFileName}
                          </span>
                          <div className="flex items-center gap-1.5 text-[10px] text-[#73796c]">
                            <span className="uppercase font-bold text-[#123d00]">{newExtraTipo}</span>
                            <span>•</span>
                            <span>{newExtraFileSize}</span>
                            <span>•</span>
                            <span className="text-[#15803d] font-semibold flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-[#15803d]" />
                              Anexado
                            </span>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setNewExtraFile(null);
                          setNewExtraFileName('');
                          setNewExtraFileSize('');
                          setNewExtraUrl('');
                        }}
                        className="p-1 rounded-lg text-[#73796c] hover:text-[#b91c1c] hover:bg-[#fee2e2] transition-colors cursor-pointer"
                        title="Remover arquivo selecionado"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 py-1">
                      <div className="w-7 h-7 rounded-lg bg-[#123d00]/10 text-[#123d00] flex items-center justify-center shrink-0">
                        <UploadCloud className="w-4 h-4" />
                      </div>
                      <div className="text-center sm:text-left">
                        <span className="text-xs font-bold text-[#082500] block">
                          Clique para selecionar ou arraste o arquivo
                        </span>
                        <span className="text-[10px] text-[#73796c] block">
                          Formatos aceitos: .pdf, .docx, .doc, PPT ou PPTX
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-[11px] font-bold text-[#191c19] block mb-1">
                    Título do Documento *
                  </label>
                  <input
                    type="text"
                    required
                    value={newExtraTitulo}
                    onChange={(e) => setNewExtraTitulo(e.target.value)}
                    placeholder="Ex: Apostila Complementar de Hermenêutica"
                    className="w-full px-3 py-2 bg-white border border-[#c2c9b9] rounded-xl text-xs focus:outline-hidden focus:border-[#123d00]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-[#191c19] block mb-1">
                    Orientações aos Alunos (Opcional)
                  </label>
                  <input
                    type="text"
                    value={newExtraDescricao}
                    onChange={(e) => setNewExtraDescricao(e.target.value)}
                    placeholder="Ex: Leitura complementar para o encontro síncrono de quinta-feira."
                    className="w-full px-3 py-2 bg-white border border-[#c2c9b9] rounded-xl text-xs focus:outline-hidden focus:border-[#123d00]"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  {editingExtraId && (
                    <button
                      type="button"
                      onClick={handleCancelEditMaterialExtra}
                      className="px-3 py-2 rounded-xl border border-[#c2c9b9] bg-white text-[#52594d] hover:bg-[#f4f6f0] text-xs font-bold transition-all cursor-pointer"
                    >
                      Cancelar
                    </button>
                  )}
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-[#123d00] hover:bg-[#0d2a00] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    {editingExtraId ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-[#a2d486]" />
                        <span>Salvar Alterações</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5 text-[#a2d486]" />
                        <span>Adicionar Documento à Turma</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* FORMULÁRIO PARA INSERIR E EDITAR LINK */}
            {newExtraCategoria === 'link' && (
              <form
                ref={extraFormRef}
                onSubmit={handleSaveMaterialExtra}
                className="bg-[#fafbf8] border border-[#e1e3dd] rounded-2xl p-4 space-y-3.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#082500] uppercase tracking-wider flex items-center gap-1.5">
                    <LinkIcon className="w-3.5 h-3.5 text-[#123d00]" />
                    <span>{editingExtraId ? 'Editar Título e Link' : 'Inserir Link Externo'}</span>
                  </span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    editingExtraId
                      ? 'bg-[#123d00] text-[#a2d486]'
                      : 'text-[#73796c] bg-[#e1e3dd]/60'
                  }`}>
                    {editingExtraId ? 'Modo de Edição de Título / Link' : 'Google Drive, Artigo Web, Vídeo'}
                  </span>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-[#191c19]">
                      Endereço do Link (URL) *
                    </label>
                    {newExtraUrl.trim() && (
                      <button
                        type="button"
                        onClick={() => {
                          const suggested = suggestTitleFromUrl(newExtraUrl);
                          setNewExtraTitulo(suggested);
                          showToast('Título sugerido com base na URL inserida!');
                          extraTituloInputRef.current?.focus();
                        }}
                        className="text-[10px] font-bold text-[#123d00] hover:underline flex items-center gap-1 cursor-pointer"
                        title="Gerar sugestão de título a partir da URL"
                      >
                        <Sparkles className="w-3 h-3 text-[#123d00]" />
                        <span>Sugerir título da URL</span>
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <LinkIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#73796c]" />
                    <input
                      type="url"
                      required
                      value={newExtraUrl}
                      onChange={(e) => {
                        const val = e.target.value;
                        setNewExtraUrl(val);
                        if (!newExtraTitulo.trim() && val.length > 10) {
                          const suggested = suggestTitleFromUrl(val);
                          if (suggested) setNewExtraTitulo(suggested);
                        }
                      }}
                      placeholder="https://drive.google.com/... ou https://..."
                      className="w-full pl-9 pr-3 py-2 bg-white border border-[#c2c9b9] rounded-xl text-xs focus:outline-hidden focus:border-[#123d00]"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-[#191c19]">
                      Título do Link / Conteúdo *
                    </label>
                    <span className="text-[10px] text-[#73796c]">
                      Nome exibido para os alunos
                    </span>
                  </div>
                  <input
                    ref={extraTituloInputRef}
                    type="text"
                    required
                    value={newExtraTitulo}
                    onChange={(e) => setNewExtraTitulo(e.target.value)}
                    placeholder="Ex: Artigo de Aprofundamento no Google Drive"
                    className="w-full px-3 py-2 bg-white border border-[#c2c9b9] rounded-xl text-xs focus:outline-hidden focus:border-[#123d00] focus:ring-1 focus:ring-[#123d00]/30"
                  />

                  {/* Sugestões Rápidas de Título (Chips) */}
                  <div className="mt-2 space-y-1">
                    <span className="text-[10px] text-[#73796c] font-medium block">
                      Sugestões de título para aplicar ou editar:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        'Artigo Complementar',
                        'Pasta no Google Drive',
                        'Gravação do Encontro',
                        'Slides da Disciplina',
                        'Formulário de Atividade',
                      ].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => {
                            setNewExtraTitulo(preset);
                            extraTituloInputRef.current?.focus();
                          }}
                          className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-[#f4f6f0] hover:bg-[#123d00]/10 text-[#52594d] hover:text-[#082500] border border-[#c2c9b9]/60 transition-colors cursor-pointer"
                        >
                          + {preset}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-[#191c19] block mb-1">
                    Orientações aos Alunos (Opcional)
                  </label>
                  <input
                    type="text"
                    value={newExtraDescricao}
                    onChange={(e) => setNewExtraDescricao(e.target.value)}
                    placeholder="Ex: Acessar link para leitura do texto complementar."
                    className="w-full px-3 py-2 bg-white border border-[#c2c9b9] rounded-xl text-xs focus:outline-hidden focus:border-[#123d00]"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  {editingExtraId && (
                    <button
                      type="button"
                      onClick={handleCancelEditMaterialExtra}
                      className="px-3 py-2 rounded-xl border border-[#c2c9b9] bg-white text-[#52594d] hover:bg-[#f4f6f0] text-xs font-bold transition-all cursor-pointer"
                    >
                      Cancelar Edição
                    </button>
                  )}
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-[#123d00] hover:bg-[#0d2a00] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    {editingExtraId ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-[#a2d486]" />
                        <span>Salvar Título e Link</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5 text-[#a2d486]" />
                        <span>Adicionar Link à Turma</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* Lista de Documentos Extras da Disciplina nesta Turma */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#082500] uppercase tracking-wider">
                  Documentos Cadastrados Nesta Turma
                </span>
                <span className="text-xs text-[#73796c]">
                  {(currentTurma.materiaisExtras || []).filter((m) => m.disciplinaId === selectedDisciplinaForExtra.id).length} item(ns)
                </span>
              </div>

              {((currentTurma.materiaisExtras || []).filter((m) => m.disciplinaId === selectedDisciplinaForExtra.id).length === 0) ? (
                <div className="p-6 text-center bg-[#fafbf8] border border-[#e1e3dd] rounded-2xl text-xs text-[#73796c]">
                  Nenhum documento ou link extra cadastrado para esta disciplina nesta turma.
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {(currentTurma.materiaisExtras || [])
                    .filter((m) => m.disciplinaId === selectedDisciplinaForExtra.id)
                    .map((item) => (
                      <div
                        key={item.id}
                        className="bg-white border border-[#c2c9b9]/80 rounded-2xl p-3 flex items-center justify-between gap-3 shadow-2xs hover:border-[#123d00]/30 transition-all"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                            item.tipo === 'pdf'
                              ? 'bg-[#fee2e2] text-[#b91c1c]'
                              : item.tipo === 'doc'
                              ? 'bg-[#dbeafe] text-[#1d4ed8]'
                              : item.tipo === 'ppt'
                              ? 'bg-[#ffedd5] text-[#c2410c]'
                              : 'bg-[#f4f6f0] text-[#123d00]'
                          }`}>
                            {item.tipo === 'ppt' ? (
                              <Presentation className="w-4 h-4" />
                            ) : item.tipo === 'link' ? (
                              <LinkIcon className="w-4 h-4" />
                            ) : (
                              <FileText className="w-4 h-4" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            {inlineEditingId === item.id ? (
                              <div className="flex items-center gap-1.5 py-0.5" onClick={(e) => e.stopPropagation()}>
                                <input
                                  type="text"
                                  autoFocus
                                  value={inlineEditingTitle}
                                  onChange={(e) => setInlineEditingTitle(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSaveInlineTitle(item.id);
                                    if (e.key === 'Escape') handleCancelInlineTitle();
                                  }}
                                  placeholder="Digite o título do link..."
                                  className="w-full px-2.5 py-1 text-xs font-bold text-[#082500] bg-white border border-[#123d00] rounded-lg shadow-2xs focus:outline-hidden"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleSaveInlineTitle(item.id)}
                                  className="p-1.5 rounded-lg bg-[#123d00] hover:bg-[#0d2a00] text-white shrink-0 shadow-2xs transition-colors cursor-pointer"
                                  title="Salvar novo título"
                                >
                                  <Check className="w-3.5 h-3.5 text-[#a2d486]" />
                                </button>
                                <button
                                  type="button"
                                  onClick={handleCancelInlineTitle}
                                  className="p-1.5 rounded-lg bg-[#f4f6f0] hover:bg-[#e1e3dd] text-[#52594d] shrink-0 transition-colors cursor-pointer"
                                  title="Cancelar"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 group/linktitle">
                                <span className="text-xs font-bold text-[#082500] block truncate">
                                  {item.titulo}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleStartInlineTitle(item)}
                                  className="opacity-0 group-hover/linktitle:opacity-100 p-0.5 rounded text-[#73796c] hover:text-[#123d00] transition-opacity cursor-pointer shrink-0"
                                  title={item.tipo === 'link' ? "Editar título do link" : "Editar título"}
                                >
                                  <Edit3 className="w-3 h-3" />
                                </button>
                              </div>
                            )}
                            <div className="flex items-center gap-2 text-[10px] text-[#73796c]">
                              <span className={`uppercase font-bold text-[9px] px-1.5 py-0.5 rounded ${
                                item.tipo === 'pdf'
                                  ? 'bg-[#fee2e2] text-[#991b1b]'
                                  : item.tipo === 'doc'
                                  ? 'bg-[#dbeafe] text-[#1e40af]'
                                  : item.tipo === 'ppt'
                                  ? 'bg-[#ffedd5] text-[#9a3412]'
                                  : 'bg-[#123d00]/10 text-[#123d00]'
                              }`}>
                                {item.tipo}
                              </span>
                              <span>•</span>
                              <span>{item.dataUpload}</span>
                              {item.tamanho && (
                                <>
                                  <span>•</span>
                                  <span>{item.tamanho}</span>
                                </>
                              )}
                              {item.descricao && (
                                <>
                                  <span>•</span>
                                  <span className="truncate max-w-[200px]">{item.descricao}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {item.url && item.tipo === 'link' && (
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg text-[#123d00] hover:bg-[#123d00]/10 transition-colors"
                              title="Abrir link externo"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() => handleStartEditMaterialExtra(item)}
                            className="p-1.5 rounded-lg text-[#52594d] hover:text-[#082500] hover:bg-[#f4f6f0] transition-colors cursor-pointer shrink-0"
                            title={item.tipo === 'link' ? "Editar título e link" : "Editar documento"}
                            aria-label={item.tipo === 'link' ? "Editar título e link" : "Editar documento"}
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteMaterialExtra(item.id, item.titulo)}
                            className="p-1.5 rounded-lg text-[#b91c1c] hover:bg-[#fee2e2] transition-colors cursor-pointer shrink-0"
                            title="Remover documento extra desta turma"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end pt-3 border-t border-[#e1e3dd]">
              <button
                type="button"
                onClick={() => {
                  setShowMaterialExtraModal(false);
                  setSelectedDisciplinaForExtra(null);
                }}
                className="px-5 py-2 rounded-xl bg-[#123d00] hover:bg-[#0d2a00] text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                Concluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: FORMULÁRIO - NOVA AULA / EDITAR AULA                             */}
      {/* ========================================================================= */}
      {showAulaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-[#c2c9b9] shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-[#e1e3dd] pb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#123d00]" />
                <h3 className="font-display font-bold text-base text-[#082500]">
                  {editingAula ? 'Editar Aula' : 'Nova Aula'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAulaModal(false)}
                className="p-1.5 rounded-lg text-[#73796c] hover:bg-[#f4f6f0] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAula} className="space-y-4">
              {/* Campo: Data */}
              <div>
                <label className="block text-xs font-bold text-[#082500] uppercase tracking-wider mb-1">
                  Data da Aula *
                </label>
                <input
                  type="date"
                  value={aulaFormData.data}
                  onChange={(e) => setAulaFormData({ ...aulaFormData, data: e.target.value })}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#c2c9b9] bg-[#f8faf4] text-xs font-semibold text-[#082500] focus:outline-hidden focus:border-[#123d00]"
                />
              </div>

              {/* Campo: Vincular módulo */}
              <div>
                <label className="block text-xs font-bold text-[#082500] uppercase tracking-wider mb-1">
                  Vincular Módulo *
                </label>
                <select
                  value={aulaFormData.moduloId}
                  onChange={(e) => {
                    const modId = e.target.value;
                    const mod = turmaModules.find((m) => m.id === modId);
                    setAulaFormData({
                      ...aulaFormData,
                      moduloId: modId,
                      moduloTitulo: mod?.title || '',
                    });
                  }}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#c2c9b9] bg-[#f8faf4] text-xs font-semibold text-[#082500] focus:outline-hidden focus:border-[#123d00] cursor-pointer"
                >
                  <option value="" disabled>Selecione um módulo...</option>
                  {turmaModules.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Campo: Assunto da aula (opcional) */}
              <div>
                <label className="block text-xs font-bold text-[#082500] uppercase tracking-wider mb-1">
                  Assunto da Aula <span className="text-[#73796c] font-normal lowercase">(opcional)</span>
                </label>
                <input
                  type="text"
                  placeholder="Ex: Introdução à Hermenêutica Bíblica (opcional)"
                  value={aulaFormData.assunto}
                  onChange={(e) => setAulaFormData({ ...aulaFormData, assunto: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#c2c9b9] bg-[#f8faf4] text-xs text-[#082500] focus:outline-hidden focus:border-[#123d00]"
                />
              </div>

              {/* Campo: Link da aula (opcional) */}
              <div>
                <label className="block text-xs font-bold text-[#082500] uppercase tracking-wider mb-1">
                  Link da Aula <span className="text-[#73796c] font-normal lowercase">(opcional)</span>
                </label>
                <input
                  type="url"
                  placeholder="https://meet.google.com/... (opcional)"
                  value={aulaFormData.link}
                  onChange={(e) => setAulaFormData({ ...aulaFormData, link: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#c2c9b9] bg-[#f8faf4] text-xs text-[#082500] focus:outline-hidden focus:border-[#123d00]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#e1e3dd]">
                <button
                  type="button"
                  onClick={() => setShowAulaModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-[#c2c9b9] bg-white hover:bg-[#f4f6f0] text-xs font-bold text-[#52594d] cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#123d00] hover:bg-[#0d2a00] text-white text-xs font-bold transition-all cursor-pointer shadow-none"
                >
                  Salvar Aula
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: TABELA DE CHAMADA REFERENTE À AULA SELECIONADA                    */}
      {/* ========================================================================= */}
      {showChamadaModal && activeChamadaAula && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-5 sm:p-8 max-w-2xl w-full border border-[#c2c9b9] shadow-2xl flex flex-col max-h-[90vh]">
            {/* Header do Modal */}
            <div className="flex items-start justify-between border-b border-[#e1e3dd] pb-4 shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <ClipboardCheck className="w-5 h-5 text-[#15803d]" />
                  <h3 className="font-display font-bold text-base text-[#082500]">
                    Chamada da Aula • {formatDiaMes(activeChamadaAula.data)}
                  </h3>
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-[#52594d]">
                  {activeChamadaAula.moduloTitulo && (
                    <span>{activeChamadaAula.moduloTitulo}</span>
                  )}
                  {activeChamadaAula.assunto && (
                    <span className="font-semibold text-[#082500]">
                      • Assunto: {activeChamadaAula.assunto}
                    </span>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowChamadaModal(false)}
                className="p-1.5 rounded-lg text-[#73796c] hover:bg-[#f4f6f0] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Ações rápidas de presença */}
            <div className="flex items-center justify-between gap-2 py-3 border-b border-[#e1e3dd] shrink-0 text-xs">
              <span className="text-[#52594d] font-medium">
                Total de Alunos: <strong>{turmaStudents.length}</strong>
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const allPresent: Record<string, 'presente' | 'ausente'> = {};
                    turmaStudents.forEach((st) => {
                      allPresent[st.alunoId] = 'presente';
                    });
                    setChamadaRecord(allPresent);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-[#15803d]/10 hover:bg-[#15803d]/20 text-[#15803d] font-bold text-[11px] cursor-pointer"
                >
                  Todos Presentes
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const allAbsent: Record<string, 'presente' | 'ausente'> = {};
                    turmaStudents.forEach((st) => {
                      allAbsent[st.alunoId] = 'ausente';
                    });
                    setChamadaRecord(allAbsent);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-[#b91c1c]/10 hover:bg-[#b91c1c]/20 text-[#b91c1c] font-bold text-[11px] cursor-pointer"
                >
                  Todos Ausentes
                </button>
              </div>
            </div>

            {/* Tabela de Chamada */}
            <div className="overflow-y-auto flex-1 my-3 pr-1">
              {turmaStudents.length === 0 ? (
                <div className="p-8 text-center text-[#73796c] text-xs">
                  Nenhum aluno matriculado nesta turma para registrar chamada.
                </div>
              ) : (
                <table className="w-full text-left text-xs border-collapse table-auto">
                  <thead>
                    <tr className="bg-[#f4f6f0] text-[#082500] font-bold border-b border-[#e1e3dd]">
                      <th className="py-2.5 px-3 text-left">Matrícula</th>
                      <th className="py-2.5 px-3 text-left">Nome</th>
                      <th className="py-2.5 px-3 text-center">Presente</th>
                      <th className="py-2.5 px-3 text-center">Ausente</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e1e3dd]">
                    {turmaStudents.map((st) => {
                      const isPresente = chamadaRecord[st.alunoId] !== 'ausente';

                      return (
                        <tr key={st.alunoId} className="hover:bg-[#fafbf8] transition-colors">
                          <td className="py-2.5 px-3 font-mono font-bold text-[#646029] whitespace-nowrap">
                            {st.matricula}
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-[#082500] whitespace-nowrap">
                            {formatNomeSobrenome(st.alunoName)}
                          </td>
                          <td className="py-2.5 px-3 text-center whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() =>
                                setChamadaRecord((prev) => ({ ...prev, [st.alunoId]: 'presente' }))
                              }
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                                isPresente
                                  ? 'bg-[#15803d] text-white shadow-xs'
                                  : 'bg-[#f4f6f0] text-[#73796c] hover:bg-[#e7e9e3]'
                              }`}
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Presente</span>
                            </button>
                          </td>
                          <td className="py-2.5 px-3 text-center whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() =>
                                setChamadaRecord((prev) => ({ ...prev, [st.alunoId]: 'ausente' }))
                              }
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                                !isPresente
                                  ? 'bg-[#b91c1c] text-white shadow-xs'
                                  : 'bg-[#f4f6f0] text-[#73796c] hover:bg-[#e7e9e3]'
                              }`}
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Ausente</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Footer do Modal */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#e1e3dd] shrink-0">
              <button
                type="button"
                onClick={() => setShowChamadaModal(false)}
                className="px-4 py-2.5 rounded-xl border border-[#c2c9b9] bg-white hover:bg-[#f4f6f0] text-xs font-bold text-[#52594d] cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveChamada}
                className="px-5 py-2.5 rounded-xl bg-[#123d00] hover:bg-[#0d2a00] text-white text-xs font-bold transition-all cursor-pointer shadow-none flex items-center gap-2"
              >
                <Check className="w-4 h-4 text-[#a2d486]" />
                <span>Salvar Chamada</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: TABELA DE LANÇAMENTO DE NOTAS POR DISCIPLINA                     */}
      {/* ========================================================================= */}
      {showNotasModal && selectedDisciplinaForNotas && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-5 sm:p-8 max-w-2xl w-full border border-[#c2c9b9] shadow-2xl flex flex-col max-h-[90vh]">
            {/* Header do Modal */}
            <div className="flex items-start justify-between border-b border-[#e1e3dd] pb-4 shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-[#123d00]/10 text-[#123d00]">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-base sm:text-lg text-[#082500]">
                      Lançamento de Notas — {selectedDisciplinaForNotas.nome}
                    </h3>
                    <p className="text-xs text-[#52594d]">
                      Turma: {currentTurma?.name || 'Turma'} • {turmaStudents.length} alunos matriculados
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowNotasModal(false)}
                className="p-2 text-[#73796c] hover:text-[#082500] hover:bg-[#f4f6f0] rounded-xl transition-colors cursor-pointer"
                aria-label="Fechar modal de notas"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Parte superior da tabela de notas: Botão “Não terá notas” e Identificação Clara da Situação */}
            <div className="py-4 border-b border-[#e1e3dd] shrink-0">
              {currentTurma && isDisciplinaSemNotas(currentTurma.id, selectedDisciplinaForNotas.id, selectedDisciplinaForNotas.nome) ? (
                /* Caso a disciplina já esteja marcada como “Não terá notas”, o sistema deixa essa situação claramente identificada ao usuário */
                <div className="p-4 rounded-2xl bg-[#fef3c7] border border-[#fde68a] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <AlertCircle className="w-5 h-5 text-[#b45309] shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-[#92400e]">
                        Esta disciplina está marcada como <strong>“Não terá notas”</strong>.
                      </p>
                      <p className="text-[11px] text-[#b45309] mt-0.5">
                        Todas as notas foram zeradas e ela não é considerada no cálculo da média geral dos alunos.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleSemNotas(selectedDisciplinaForNotas)}
                    className="px-3.5 py-1.5 rounded-xl bg-[#123d00] hover:bg-[#0d2a00] text-white text-xs font-bold shrink-0 transition-colors cursor-pointer shadow-none flex items-center justify-center gap-1.5"
                    title="Reativar lançamento de notas para esta disciplina"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Permitir notas</span>
                  </button>
                </div>
              ) : (
                /* Botão "Não terá notas" na parte superior da tabela */
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#f8faf4] p-3.5 rounded-2xl border border-[#c2c9b9]">
                  <p className="text-xs text-[#52594d]">
                    Insira as notas dos alunos (0.0 a 10.0). As notas compõem a média geral da turma.
                  </p>
                  <button
                    type="button"
                    onClick={() => handleToggleSemNotas(selectedDisciplinaForNotas)}
                    className="px-3.5 py-2 rounded-xl bg-[#fff1f2] hover:bg-[#fee2e2] text-[#be123c] border border-[#fecdd3] text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0 shadow-none"
                    title="Zerar notas, marcar como 'Não terá notas' e desconsiderar da média geral"
                  >
                    <Ban className="w-4 h-4 text-[#be123c]" />
                    <span>Não terá notas</span>
                  </button>
                </div>
              )}
            </div>

            {/* Tabela de lançamento de notas: Matrícula, Nome, Nota */}
            <div className="flex-1 overflow-y-auto py-2">
              {turmaStudents.length === 0 ? (
                <div className="p-8 text-center text-[#73796c]">
                  Nenhum aluno matriculado nesta turma para lançamento de notas.
                </div>
              ) : (
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#f4f6f0] text-[#082500] font-bold border-b border-[#e1e3dd] sticky top-0 z-10">
                      <th className="py-3 px-4 text-left">Matrícula</th>
                      <th className="py-3 px-4 text-left">Nome</th>
                      <th className="py-3 px-4 text-center">Nota</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e1e3dd]">
                    {turmaStudents.map((st) => {
                      const isSemNotas = currentTurma
                        ? isDisciplinaSemNotas(currentTurma.id, selectedDisciplinaForNotas.id, selectedDisciplinaForNotas.nome)
                        : false;

                      return (
                        <tr key={st.alunoId} className="hover:bg-[#fafbf8] transition-colors">
                          {/* 1. Matrícula */}
                          <td className="py-3 px-4 font-mono font-bold text-[#646029] whitespace-nowrap">
                            {st.matricula}
                          </td>

                          {/* 2. Nome: Mostrar apenas nome e sobrenome */}
                          <td className="py-3 px-4 font-semibold text-[#082500] whitespace-nowrap">
                            {formatNomeSobrenome(st.alunoName)}
                          </td>

                          {/* 3. Nota: campo numérico para inserção da nota do aluno */}
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            {isSemNotas ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-[#73796c] bg-[#f4f6f0] border border-[#c2c9b9]">
                                Não terá notas
                              </span>
                            ) : (
                              <input
                                type="number"
                                step="0.1"
                                min="0"
                                max="10"
                                value={notasInputs[st.alunoId] !== undefined ? notasInputs[st.alunoId] : ''}
                                onChange={(e) =>
                                  setNotasInputs((prev) => ({ ...prev, [st.alunoId]: e.target.value }))
                                }
                                placeholder="0.0 - 10.0"
                                className="w-24 text-center px-3 py-1.5 rounded-xl border border-[#c2c9b9] focus:outline-none focus:border-[#123d00] focus:ring-1 focus:ring-[#123d00] font-bold text-xs bg-white text-[#082500]"
                              />
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Footer do Modal */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#e1e3dd] shrink-0">
              <button
                type="button"
                onClick={() => setShowNotasModal(false)}
                className="px-4 py-2.5 rounded-xl border border-[#c2c9b9] bg-white hover:bg-[#f4f6f0] text-xs font-bold text-[#52594d] cursor-pointer"
              >
                Fechar
              </button>
              {currentTurma && !isDisciplinaSemNotas(currentTurma.id, selectedDisciplinaForNotas.id, selectedDisciplinaForNotas.nome) && (
                <button
                  type="button"
                  onClick={handleSaveNotasForDisciplina}
                  className="px-5 py-2.5 rounded-xl bg-[#123d00] hover:bg-[#0d2a00] text-white text-xs font-bold transition-all cursor-pointer shadow-none flex items-center gap-2"
                >
                  <Check className="w-4 h-4 text-[#a2d486]" />
                  <span>Salvar Notas</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
