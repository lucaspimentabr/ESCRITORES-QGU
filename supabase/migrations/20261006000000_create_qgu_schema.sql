-- ==============================================================================
-- PROJETO ESCRITORES QGU — COMIEADEPA
-- MIGRATION OFICIAL SUPABASE (IDEMPOTENTE E LIVRE DE ERROS DE EXECUÇÃO REPETIDA)
-- Data: 2026-10-06
-- ==============================================================================

-- 1. Extensões úteis
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Função utilitária para atualizar 'updated_at'
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==============================================================================
-- 3. TABELA: users (Usuários e Perfis do Sistema)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.users (
    id SERIAL PRIMARY KEY,
    uid TEXT UNIQUE NOT NULL, -- UID do Supabase Auth ou do Firebase
    email TEXT NOT NULL,
    name TEXT NOT NULL,
    whatsapp TEXT,
    role TEXT NOT NULL DEFAULT 'aluno', -- 'admin' | 'professor' | 'aluno'
    role_label TEXT,
    route_slug TEXT,
    matricula TEXT,
    polo TEXT,
    campo_supervisao TEXT,
    disciplina TEXT,
    status TEXT DEFAULT 'Ativo',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON public.users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==============================================================================
-- 4. TABELA: candidates (Candidatos e Inscrições no Processo Seletivo)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.candidates (
    id TEXT PRIMARY KEY, -- ex: "#QGU-2026-0842"
    edital_id TEXT,
    processo_id TEXT,
    full_name TEXT NOT NULL,
    initials TEXT,
    birth_date TEXT,
    age INTEGER,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    polo TEXT NOT NULL,
    church TEXT NOT NULL,
    jurisdiction TEXT,
    pastor TEXT NOT NULL,
    communion_status TEXT,
    registration_date TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'EM_ANALISE', -- 'EM_ANALISE' | 'APROVADO' | 'REPROVADO'
    status_label TEXT DEFAULT 'Em Análise',
    objective_score JSONB DEFAULT '{"correct": 0, "total": 10, "percentage": 0}'::JSONB,
    memorial TEXT,
    character_count INTEGER DEFAULT 0,
    objective_questions JSONB DEFAULT '[]'::JSONB,
    discursive JSONB DEFAULT '{}'::JSONB,
    parecer_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

DROP TRIGGER IF EXISTS update_candidates_updated_at ON public.candidates;
CREATE TRIGGER update_candidates_updated_at
BEFORE UPDATE ON public.candidates
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==============================================================================
-- 5. TABELA: turmas (Turmas do Projeto)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.turmas (
    id TEXT PRIMARY KEY, -- ex: "turma-2026"
    name TEXT NOT NULL,
    url_slug TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Em Andamento', -- 'Aberto' | 'Em Andamento' | 'Concluído'
    resumo TEXT,
    edital_resumo TEXT,
    data_inicio_inscricoes TEXT,
    data_fim_inscricoes TEXT,
    data_inicio_aulas TEXT,
    data_conclusao TEXT,
    vagas INTEGER DEFAULT 30,
    inscritos_count INTEGER DEFAULT 0,
    matriculados_count INTEGER DEFAULT 0,
    grade_horaria JSONB DEFAULT '{}'::JSONB,
    disciplinas_ids JSONB DEFAULT '[]'::JSONB,
    disciplinas_liberadas_ids JSONB DEFAULT '[]'::JSONB,
    professor_ids JSONB DEFAULT '[]'::JSONB,
    materiais_extras JSONB DEFAULT '[]'::JSONB,
    aulas JSONB DEFAULT '[]'::JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

DROP TRIGGER IF EXISTS update_turmas_updated_at ON public.turmas;
CREATE TRIGGER update_turmas_updated_at
BEFORE UPDATE ON public.turmas
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==============================================================================
-- 6. TABELA: disciplinas (Grade Curricular e Módulos)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.disciplinas (
    id TEXT PRIMARY KEY, -- ex: "disc-1"
    nome TEXT NOT NULL,
    codigo TEXT,
    area TEXT NOT NULL,
    descricao TEXT,
    carga_horaria INTEGER DEFAULT 60,
    professor_padrao TEXT,
    modulos JSONB DEFAULT '[]'::JSONB,
    turmas_ids JSONB DEFAULT '[]'::JSONB,
    avaliadores JSONB DEFAULT '[]'::JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

DROP TRIGGER IF EXISTS update_disciplinas_updated_at ON public.disciplinas;
CREATE TRIGGER update_disciplinas_updated_at
BEFORE UPDATE ON public.disciplinas
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==============================================================================
-- 7. TABELA: students (Tabela Oficial de Alunos Matriculados)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.students (
    id SERIAL PRIMARY KEY,
    aluno_id TEXT UNIQUE NOT NULL,
    matricula TEXT NOT NULL,
    turma_id TEXT NOT NULL,
    aluno_name TEXT NOT NULL,
    polo TEXT NOT NULL,
    frequencia_percent INTEGER DEFAULT 0,
    presencas INTEGER DEFAULT 0,
    aulas_totais INTEGER DEFAULT 0,
    submissions JSONB DEFAULT '[]'::JSONB,
    notas JSONB DEFAULT '[]'::JSONB,
    media_geral DOUBLE PRECISION DEFAULT 0,
    status_academico TEXT NOT NULL DEFAULT 'Cursando', -- 'Cursando' | 'Aprovado' | 'Em Recuperação' | 'Formado'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

DROP TRIGGER IF EXISTS update_students_updated_at ON public.students;
CREATE TRIGGER update_students_updated_at
BEFORE UPDATE ON public.students
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==============================================================================
-- 8. TABELA: mural_avisos (Mural de Comunicados das Turmas)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.mural_avisos (
    id TEXT PRIMARY KEY,
    turma_id TEXT NOT NULL,
    autor_nome TEXT NOT NULL,
    autor_role TEXT NOT NULL,
    autor_id TEXT,
    titulo TEXT NOT NULL,
    conteudo TEXT NOT NULL,
    data TEXT NOT NULL,
    importante BOOLEAN DEFAULT FALSE,
    categoria TEXT DEFAULT 'Geral',
    link TEXT,
    link_titulo TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================================================
-- 9. TABELA: editais_processos (Editais e Cronograma do Processo Seletivo)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.editais_processos (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    turma_id TEXT,
    registration_url TEXT,
    start_date TEXT,
    end_date TEXT,
    status TEXT NOT NULL DEFAULT 'Aberto',
    vagas INTEGER DEFAULT 30,
    pdf_url TEXT,
    etapas JSONB DEFAULT '[]'::JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================================================
-- 10. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Habilita RLS em todas as tabelas públicas
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.turmas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disciplinas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mural_avisos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.editais_processos ENABLE ROW LEVEL SECURITY;

-- Candidates: leitura e criação pública permitida (inscrições abertas)
DROP POLICY IF EXISTS "Permitir leitura pública de candidatos" ON public.candidates;
CREATE POLICY "Permitir leitura pública de candidatos" ON public.candidates FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir criação pública de inscrição" ON public.candidates;
CREATE POLICY "Permitir criação pública de inscrição" ON public.candidates FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir atualização de candidatos" ON public.candidates;
CREATE POLICY "Permitir atualização de candidatos" ON public.candidates FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Permitir exclusão de candidatos" ON public.candidates;
CREATE POLICY "Permitir exclusão de candidatos" ON public.candidates FOR DELETE USING (true);

-- Turmas: leitura pública, edição irrestrita via aplicação
DROP POLICY IF EXISTS "Permitir leitura de turmas" ON public.turmas;
CREATE POLICY "Permitir leitura de turmas" ON public.turmas FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir manipulação de turmas" ON public.turmas;
CREATE POLICY "Permitir manipulação de turmas" ON public.turmas FOR ALL USING (true);

-- Disciplinas: leitura pública, manipulação pela aplicação
DROP POLICY IF EXISTS "Permitir leitura de disciplinas" ON public.disciplinas;
CREATE POLICY "Permitir leitura de disciplinas" ON public.disciplinas FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir manipulação de disciplinas" ON public.disciplinas;
CREATE POLICY "Permitir manipulação de disciplinas" ON public.disciplinas FOR ALL USING (true);

-- Alunos Matriculados: leitura e manipulação
DROP POLICY IF EXISTS "Permitir leitura de alunos" ON public.students;
CREATE POLICY "Permitir leitura de alunos" ON public.students FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir manipulação de alunos" ON public.students;
CREATE POLICY "Permitir manipulação de alunos" ON public.students FOR ALL USING (true);

-- Mural de Avisos: leitura e criação de comunicados
DROP POLICY IF EXISTS "Permitir leitura de avisos" ON public.mural_avisos;
CREATE POLICY "Permitir leitura de avisos" ON public.mural_avisos FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir manipulação de avisos" ON public.mural_avisos;
CREATE POLICY "Permitir manipulação de avisos" ON public.mural_avisos FOR ALL USING (true);

-- Editais e Processos
DROP POLICY IF EXISTS "Permitir leitura de editais" ON public.editais_processos;
CREATE POLICY "Permitir leitura de editais" ON public.editais_processos FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir manipulação de editais" ON public.editais_processos;
CREATE POLICY "Permitir manipulação de editais" ON public.editais_processos FOR ALL USING (true);

-- Usuários
DROP POLICY IF EXISTS "Permitir leitura de usuários" ON public.users;
CREATE POLICY "Permitir leitura de usuários" ON public.users FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir manipulação de usuários" ON public.users;
CREATE POLICY "Permitir manipulação de usuários" ON public.users FOR ALL USING (true);

-- ==============================================================================
-- 11. ÍNDICES DE PERFORMANCE
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_candidates_status ON public.candidates(status);
CREATE INDEX IF NOT EXISTS idx_candidates_polo ON public.candidates(polo);
CREATE INDEX IF NOT EXISTS idx_students_turma_id ON public.students(turma_id);
CREATE INDEX IF NOT EXISTS idx_students_aluno_id ON public.students(aluno_id);
CREATE INDEX IF NOT EXISTS idx_mural_avisos_turma_id ON public.mural_avisos(turma_id);
CREATE INDEX IF NOT EXISTS idx_users_uid ON public.users(uid);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
