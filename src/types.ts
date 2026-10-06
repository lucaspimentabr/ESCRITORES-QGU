export type CandidateStatus = 'EM_ANALISE' | 'APROVADO' | 'REPROVADO';

export type CandidateStep = 'landing' | 'dados' | 'prova' | 'sucesso';

export interface CandidateFormData {
  fullName: string;
  email: string;
  phone: string;
  polo: string; // Campo eclesiástico da COMIEADEPA
  church: string;
  pastor: string;
  birthDate: string;
  meetsRequirements: boolean | null;
  recommendationFile?: {
    name: string;
    size: string;
    dataUrl?: string;
  } | null;
  motivation: string;
  answers: Record<number, 'A' | 'B' | 'C' | 'D'>;
  discursiveAnswer: string;
  [key: string]: any;
}

export interface ObjectiveQuestion {
  id: number;
  topic: string;
  isCorrect: boolean;
  candidateAnswer: string;
  officialAnswer?: string;
  note?: string;
}

export interface DiscursiveEvaluation {
  prompt: string;
  candidateAnswer: string;
  evaluatorScore: number;
  maxScore: number;
  preliminaryVerdict: string;
  theologicalNotes: string;
}

export interface Candidate {
  id: string; // e.g. "#QGU-2026-0842"
  editalId?: string; // e.g. "edital-2026-1" or "edital-2025-1"
  processoId?: string; // e.g. "#PS-2026-1"
  fullName: string;
  initials: string;
  avatarColor?: string;
  birthDate: string;
  age: number;
  email: string;
  phone: string;
  polo: string;
  church: string;
  jurisdiction: string;
  pastor: string;
  communionStatus: string;
  registrationDate: string;
  objectiveScore: {
    correct: number;
    total: number;
    percentage: number;
  };
  status: CandidateStatus;
  statusLabel: string;
  memorial: string;
  characterCount: number;
  objectiveQuestions: ObjectiveQuestion[];
  discursive: DiscursiveEvaluation;
  parecerId: string;
}

export interface UserProfile {
  name: string;
  email: string;
  whatsapp: string;
  role: string;
  initials: string;
}

export type UserRole = 'admin' | 'professor' | 'aluno';

export interface SystemUser {
  id: string;
  name: string;
  email: string;
  whatsapp: string;
  role: UserRole;
  password: string;
  initials: string;
  roleLabel: string;
  routeSlug: string; // e.g. "/Paineladm", "/ProfCarlos", "/turma2026-1024"
  disciplina?: string;
  turmaId?: string;
  matricula?: string;
  polo?: string; // legacy support
  campoSupervisao?: string;
  status?: 'Ativo' | 'Inativo';
}

export type TurmaStatus = 'Aberto' | 'Em Andamento' | 'Concluído';

export interface TurmaGradeHoraria {
  diaSemana: string; // ex: "Quintas-feiras"
  horario: string; // ex: "20h00"
  dataInicio: string; // ex: "01/10/2026"
  dataFim: string; // ex: "10/12/2026"
  modalidade?: string; // ex: "Encontros Síncronos Semanais"
  linkEncontro?: string; // ex: "https://meet.google.com/qgu-2026"
}

export interface Turma {
  id: string;
  name: string;
  urlSlug: string; // e.g. "turma2026"
  status: TurmaStatus;
  resumo?: string;
  editalResumo?: string;
  dataInicioInscricoes: string;
  dataFimInscricoes: string;
  dataInicioAulas: string;
  dataConclusao: string;
  vagas: number;
  inscritosCount: number;
  matriculadosCount: number;
  gradeHoraria?: TurmaGradeHoraria;
  disciplinasIds?: string[];
  disciplinasLiberadasIds?: string[];
  avisosMural?: MuralAviso[];
  professorIds?: string[];
  materiaisExtras?: TurmaMaterialExtra[];
  aulas?: TurmaAula[];
}

export interface AulaPresencaRecord {
  [alunoId: string]: 'presente' | 'ausente';
}

export interface TurmaAula {
  id: string;
  turmaId: string;
  data: string; // ex: "2026-10-10" ou "10/10/2026"
  moduloId: string;
  moduloTitulo?: string;
  assunto?: string; // Assunto da aula (opcional)
  link?: string;
  presencas?: AulaPresencaRecord;
}

export interface TurmaMaterialExtra {
  id: string;
  turmaId: string;
  disciplinaId: string;
  titulo: string;
  tipo: 'pdf' | 'doc' | 'ppt' | 'link';
  dataUpload: string;
  url?: string;
  descricao?: string;
  tamanho?: string;
  autorNome?: string;
  nomeArquivo?: string;
}

export type EtapaStatus = 'Pendente' | 'Em Andamento' | 'Concluída';

export interface ProcessoSeletivoEtapa {
  id: string;
  turmaId?: string;
  nome: string;
  descricao: string;
  dataInicio: string;
  dataFim: string;
  status: EtapaStatus;
  ordem: number;
  responsavel?: string;
}

export interface AcademicMaterial {
  id: string;
  title: string;
  type: 'pdf' | 'link' | 'text';
  pages?: string;
  date: string;
  url?: string;
  descricao?: string;
  tamanho?: string;
}

export interface DisciplinaModulo {
  id: string;
  number: number;
  title: string;
  description: string;
  ementa: string[];
  materials: AcademicMaterial[];
}

export interface ProfessorAvaliadorVinculo {
  professorId: string;
  professorName: string;
  turmaId?: string; // 'ALL' or specific turmaId
  papel?: 'titular';
  dataDesignacao?: string;
  ativo?: boolean;
}

export interface Disciplina {
  id: string;
  nome: string;
  codigo?: string;
  area: string;
  descricao: string;
  cargaHoraria: number; // e.g. 60 horas
  professorPadrao?: string;
  modulos: DisciplinaModulo[];
  turmasIds: string[]; // Turmas às quais esta disciplina está vinculada
  avaliadores?: ProfessorAvaliadorVinculo[];
}

export interface ComplementaryMaterial {
  id: string;
  professorName: string;
  title: string;
  type: 'pdf' | 'link' | 'text';
  date: string;
  url?: string;
  moduloNumber: number;
}

export interface AcademicModule {
  id: string;
  turmaId: string;
  number: number;
  title: string;
  description: string;
  ementa: string[];
  professorName: string;
  professorRole: string;
  baseMaterials: AcademicMaterial[];
  complementaryMaterials: ComplementaryMaterial[];
}

export interface StudentSubmission {
  id: string;
  moduloNumber: number;
  moduloTitle: string;
  tituloTrabalho: string;
  submetidoEm: string;
  status: 'Pendente' | 'Avaliado';
  nota?: number;
  feedback?: string;
  professorName?: string;
  conteudoPreview?: string;
}

export interface StudentGrade {
  moduloNumber?: number;
  moduloTitle?: string;
  disciplinaId?: string;
  nota: number;
  feedback?: string;
  dataLancamento?: string;
  professorName?: string;
}

export interface StudentAcademicRecord {
  alunoId: string;
  matricula: string;
  turmaId: string;
  alunoName: string;
  polo: string;
  frequenciaPercent: number;
  presencas: number;
  aulasTotais: number;
  submissions: StudentSubmission[];
  notas: StudentGrade[];
  mediaGeral: number;
  statusAcademico: 'Cursando' | 'Aprovado' | 'Em Recuperação' | 'Formado';
}

export interface MuralAviso {
  id: string;
  turmaId: string;
  autorNome: string;
  autorRole: string;
  autorId?: string;
  titulo: string;
  conteudo: string;
  data: string;
  importante: boolean;
  categoria?: 'Geral' | 'Aula' | 'Trabalho' | 'Alerta' | string;
  link?: string;
  linkTitulo?: string;
}

export interface FormFieldConfig {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'email' | 'tel' | 'date' | 'select' | 'file' | 'textarea' | 'checkbox';
  required: boolean;
  active: boolean;
  placeholder?: string;
  helpText?: string;
  options?: string[];
  category: 'pessoal' | 'eclesiastico' | 'ministerial' | 'documentacao';
  order: number;
  fileAccept?: string;
  maxFileSizeMb?: number;
  rows?: number;
  minChars?: number;
  maxChars?: number;
  checkboxTerms?: string;
  maskPattern?: string;
}

export interface EditalItem {
  id: string;
  code: string;
  title: string;
  description: string;
  turmaId: string;
  registrationUrl: string;
  startDate: string;
  endDate: string;
  status: 'Aberto' | 'Encerrado' | 'Previsto';
  vagas: number;
  pdfUrl?: string;
  etapas?: ProcessoSeletivoEtapa[];
}

export type ActiveTab =
  | 'vitrine' // "/"
  | 'inscricao' // "/inscricao" ou "/inscricao/[id]"
  | 'candidato' // "/candidato"
  | 'prova' // "/prova"
  | 'login' // "/login"
  | 'paineladm' // "/Paineladm" (Coordenação)
  | 'professor' // "/ProfCarlos" (Professor)
  | 'aluno' // "/turma2026-1024" (Aluno)
  | 'painel'; // legacy alias for admin

export type CuratorialNav = 'dashboard' | 'inscritos' | 'correcao' | 'modulos' | 'config';
