-- ==============================================================================
-- DADOS INICIAIS (SEED) DO PROJETO ESCRITORES QGU — COMIEADEPA
-- ==============================================================================

-- 1. Inserir Turma Vigente
INSERT INTO public.turmas (
    id, name, url_slug, status, resumo, edital_resumo,
    data_inicio_inscricoes, data_fim_inscricoes, data_inicio_aulas, data_conclusao,
    vagas, inscritos_count, matriculados_count,
    disciplinas_ids, disciplinas_liberadas_ids
) VALUES (
    'turma-2026',
    'Turma 2026 — Edição Ananindeua / Belém Central',
    'turma2026',
    'Em Andamento',
    'Primeira turma oficial de formação de escritores e teólogos da COMIEADEPA.',
    'Processo seletivo eclesiástico conforme Edital 001/2026.',
    '01/01/2026',
    '28/02/2026',
    '15/03/2026',
    '15/12/2026',
    30,
    18,
    18,
    '["disc-1", "disc-2", "disc-3", "disc-4", "disc-5"]'::jsonb,
    '["disc-1", "disc-2"]'::jsonb
) ON CONFLICT (id) DO NOTHING;

-- 2. Inserir Alunos Matriculados Iniciais
INSERT INTO public.students (
    aluno_id, matricula, turma_id, aluno_name, polo,
    frequencia_percent, presencas, aulas_totais, media_geral, status_academico
) VALUES 
('user-aluno-1', '2026-QGU-1024', 'turma-2026', 'Marcos Paulo de Oliveira', 'Campo Belém Central', 0, 0, 0, 0, 'Cursando'),
('user-aluno-2', '2026-QGU-1025', 'turma-2026', 'Débora Vasconcelos', 'Campo Santarém', 0, 0, 0, 0, 'Cursando'),
('user-aluno-3', '2026-QGU-1026', 'turma-2026', 'Tiago Mendonça Silva', 'Campo Marabá', 0, 0, 0, 0, 'Cursando')
ON CONFLICT (aluno_id) DO NOTHING;

-- 3. Inserir Usuários Iniciais
INSERT INTO public.users (
    uid, email, name, whatsapp, role, role_label, route_slug, matricula, polo, status
) VALUES
('user-admin-1', 'lucas.pimenta@comieadepa.org.br', 'Lucas Pimenta', '(91) 98111-2233', 'admin', 'COORDENAÇÃO GERAL', '/Paineladm', NULL, 'Convenção Estadual', 'Ativo'),
('user-prof-1', 'carlos.pinheiro@comieadepa.org.br', 'Pr. Carlos Alberto Pinheiro', '(91) 98222-3344', 'professor', 'PROFESSOR / DOCENTE', '/ProfCarlos', NULL, 'Campo Belém Central', 'Ativo'),
('user-aluno-1', 'marcos.oliveira@gmail.com', 'Marcos Paulo de Oliveira', '(91) 99182-4455', 'aluno', 'ALUNO VOCACIONADO', '/turma2026-1024', '2026-QGU-1024', 'Campo Belém Central', 'Ativo')
ON CONFLICT (uid) DO NOTHING;
