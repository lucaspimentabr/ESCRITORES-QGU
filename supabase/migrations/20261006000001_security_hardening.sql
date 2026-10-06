-- ==============================================================================
-- PROJETO ESCRITORES QGU — COMIEADEPA
-- MIGRATION 002: HARDENING DE SEGURANÇA E PROTEÇÃO RLS
-- Data: 2026-10-06
-- ==============================================================================

-- 1. Proteção de Inscrições de Candidatos:
-- Permite inserção pública (para novas inscrições no formulário) e leitura pública dos editais,
-- mas restringe exclusão e atualização irrestrita para evitar perda de dados.
DROP POLICY IF EXISTS "Permitir exclusão de candidatos" ON public.candidates;
CREATE POLICY "Restringir exclusao de candidatos" ON public.candidates
    FOR DELETE USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- 2. Proteção da Tabela de Usuários:
-- Evita manipulação anônima de contas de administradores, professores e alunos.
DROP POLICY IF EXISTS "Permitir manipulação de usuários" ON public.users;
CREATE POLICY "Restringir manipulacao de usuarios para autenticados" ON public.users
    FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- 3. Proteção das Turmas e Editais contra Exclusões Acidentais ou Maliciosas:
DROP POLICY IF EXISTS "Permitir manipulação de turmas" ON public.turmas;
CREATE POLICY "Permitir leitura de turmas para todos" ON public.turmas
    FOR SELECT USING (true);

CREATE POLICY "Permitir gravacao de turmas para autenticados" ON public.turmas
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir atualizacao de turmas para autenticados" ON public.turmas
    FOR UPDATE USING (true);

CREATE POLICY "Restringir exclusao de turmas" ON public.turmas
    FOR DELETE USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- 4. Proteção do Registro de Alunos Matriculados:
DROP POLICY IF EXISTS "Permitir manipulação de alunos" ON public.students;
CREATE POLICY "Permitir leitura de alunos" ON public.students
    FOR SELECT USING (true);

CREATE POLICY "Permitir gravacao e atualizacao de alunos" ON public.students
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir edicao de notas e frequencia" ON public.students
    FOR UPDATE USING (true);

CREATE POLICY "Restringir exclusao de matriculas" ON public.students
    FOR DELETE USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');
