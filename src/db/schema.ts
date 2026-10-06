import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  doublePrecision,
} from 'drizzle-orm/pg-core';

// 1. Tabela de Usuários do Sistema (integrada com Firebase Auth UID)
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  name: text('name').notNull(),
  whatsapp: text('whatsapp'),
  role: text('role').notNull().default('aluno'), // 'admin' | 'professor' | 'aluno'
  roleLabel: text('role_label'),
  routeSlug: text('route_slug'),
  matricula: text('matricula'),
  polo: text('polo'),
  campoSupervisao: text('campo_supervisao'),
  disciplina: text('disciplina'),
  status: text('status').default('Ativo'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 2. Tabela de Candidatos e Inscrições
export const candidates = pgTable('candidates', {
  id: text('id').primaryKey(), // ex: "#QGU-2026-0842"
  editalId: text('edital_id'),
  processoId: text('processo_id'),
  fullName: text('full_name').notNull(),
  initials: text('initials'),
  birthDate: text('birth_date'),
  age: integer('age'),
  email: text('email').notNull(),
  phone: text('phone').notNull(),
  polo: text('polo').notNull(),
  church: text('church').notNull(),
  jurisdiction: text('jurisdiction'),
  pastor: text('pastor').notNull(),
  communionStatus: text('communion_status'),
  registrationDate: text('registration_date').notNull(),
  status: text('status').notNull().default('EM_ANALISE'), // 'EM_ANALISE' | 'APROVADO' | 'REPROVADO'
  statusLabel: text('status_label').default('Em Análise'),
  objectiveScore: jsonb('objective_score'), // { correct, total, percentage }
  memorial: text('memorial'),
  characterCount: integer('character_count'),
  objectiveQuestions: jsonb('objective_questions'), // ObjectiveQuestion[]
  discursive: jsonb('discursive'), // DiscursiveEvaluation
  parecerId: text('parecer_id'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 3. Tabela de Turmas
export const turmas = pgTable('turmas', {
  id: text('id').primaryKey(), // ex: "turma-2026"
  name: text('name').notNull(),
  urlSlug: text('url_slug').notNull(),
  status: text('status').notNull().default('Em Andamento'), // 'Aberto' | 'Em Andamento' | 'Concluído'
  resumo: text('resumo'),
  editalResumo: text('edital_resumo'),
  dataInicioInscricoes: text('data_inicio_inscricoes'),
  dataFimInscricoes: text('data_fim_inscricoes'),
  dataInicioAulas: text('data_inicio_aulas'),
  dataConclusao: text('data_conclusao'),
  vagas: integer('vagas').default(30),
  inscritosCount: integer('inscritos_count').default(0),
  matriculadosCount: integer('matriculados_count').default(0),
  gradeHoraria: jsonb('grade_horaria'), // TurmaGradeHoraria
  disciplinasIds: jsonb('disciplinas_ids'), // string[]
  disciplinasLiberadasIds: jsonb('disciplinas_liberadas_ids'), // string[]
  professorIds: jsonb('professor_ids'), // string[]
  materiaisExtras: jsonb('materiais_extras'), // TurmaMaterialExtra[]
  aulas: jsonb('aulas'), // TurmaAula[]
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 4. Tabela de Disciplinas
export const disciplinas = pgTable('disciplinas', {
  id: text('id').primaryKey(), // ex: "disc-1"
  nome: text('nome').notNull(),
  codigo: text('codigo'),
  area: text('area').notNull(),
  descricao: text('descricao'),
  cargaHoraria: integer('carga_horaria').default(60),
  professorPadrao: text('professor_padrao'),
  modulos: jsonb('modulos'), // DisciplinaModulo[]
  turmasIds: jsonb('turmas_ids'), // string[]
  avaliadores: jsonb('avaliadores'), // ProfessorAvaliadorVinculo[]
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 5. Tabela de Alunos Matriculados (Registro Acadêmico)
export const students = pgTable('students', {
  id: serial('id').primaryKey(),
  alunoId: text('aluno_id').notNull().unique(), // ID do usuário aluno
  matricula: text('matricula').notNull(),
  turmaId: text('turma_id').notNull(),
  alunoName: text('aluno_name').notNull(),
  polo: text('polo').notNull(),
  frequenciaPercent: integer('frequencia_percent').default(0),
  presencas: integer('presencas').default(0),
  aulasTotais: integer('aulas_totais').default(0),
  submissions: jsonb('submissions').default([]), // StudentSubmission[]
  notas: jsonb('notas').default([]), // StudentGrade[]
  mediaGeral: doublePrecision('media_geral').default(0),
  statusAcademico: text('status_academico').notNull().default('Cursando'), // 'Cursando' | 'Aprovado' | 'Em Recuperação' | 'Formado'
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 6. Tabela do Mural de Avisos
export const muralAvisos = pgTable('mural_avisos', {
  id: text('id').primaryKey(),
  turmaId: text('turma_id').notNull(),
  autorNome: text('autor_nome').notNull(),
  autorRole: text('autor_role').notNull(),
  autorId: text('autor_id'),
  titulo: text('titulo').notNull(),
  conteudo: text('conteudo').notNull(),
  data: text('data').notNull(),
  importante: boolean('importante').default(false),
  categoria: text('categoria').default('Geral'),
  link: text('link'),
  linkTitulo: text('link_titulo'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 7. Tabela de Editais e Processos Seletivos
export const editaisProcessos = pgTable('editais_processos', {
  id: text('id').primaryKey(),
  code: text('code').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  turmaId: text('turma_id'),
  registrationUrl: text('registration_url'),
  startDate: text('start_date'),
  endDate: text('end_date'),
  status: text('status').notNull().default('Aberto'),
  vagas: integer('vagas').default(30),
  pdfUrl: text('pdf_url'),
  etapas: jsonb('etapas').default([]),
  createdAt: timestamp('created_at').defaultNow(),
});
