import { supabase, isSupabaseConfigured } from '../lib/supabase';
export { isSupabaseConfigured };
import {
  Candidate,
  StudentAcademicRecord,
  Turma,
  Disciplina,
  MuralAviso,
  SystemUser,
} from '../types';

/**
 * Serviço de Integração Direta com o Supabase
 * Gerencia a sincronização das tabelas relacionais do sistema.
 */

// ==============================================================================
// CANDIDATOS
// ==============================================================================
export async function fetchCandidatesFromSupabase(): Promise<Candidate[] | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const { data, error } = await supabase
      .from('candidates')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Erro ao carregar candidatos do Supabase:', error.message);
      return null;
    }

    if (!data) return [];

    return data.map((row: any): Candidate => ({
      id: row.id,
      editalId: row.edital_id || undefined,
      processoId: row.processo_id || undefined,
      fullName: row.full_name,
      initials: row.initials || 'C',
      avatarColor: undefined,
      birthDate: row.birth_date || '',
      age: row.age || 0,
      email: row.email,
      phone: row.phone,
      polo: row.polo,
      church: row.church,
      jurisdiction: row.jurisdiction || '',
      pastor: row.pastor,
      communionStatus: row.communion_status || 'Membro em Comunhão',
      registrationDate: row.registration_date,
      objectiveScore: row.objective_score || { correct: 0, total: 10, percentage: 0 },
      status: row.status,
      statusLabel: row.status_label || 'Em Análise',
      memorial: row.memorial || '',
      characterCount: row.character_count || 0,
      objectiveQuestions: row.objective_questions || [],
      discursive: row.discursive || {
        prompt: '',
        candidateAnswer: '',
        evaluatorScore: 0,
        maxScore: 10,
        preliminaryVerdict: '',
        theologicalNotes: '',
      },
      parecerId: row.parecer_id || '',
    }));
  } catch (err) {
    console.warn('Falha na comunicação com Supabase (candidates):', err);
    return null;
  }
}

export async function upsertCandidateToSupabase(candidate: Candidate): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  try {
    const payload = {
      id: candidate.id,
      edital_id: candidate.editalId || null,
      processo_id: candidate.processoId || null,
      full_name: candidate.fullName,
      initials: candidate.initials,
      birth_date: candidate.birthDate,
      age: candidate.age,
      email: candidate.email,
      phone: candidate.phone,
      polo: candidate.polo,
      church: candidate.church,
      jurisdiction: candidate.jurisdiction,
      pastor: candidate.pastor,
      communion_status: candidate.communionStatus,
      registration_date: candidate.registrationDate,
      status: candidate.status,
      status_label: candidate.statusLabel,
      objective_score: candidate.objectiveScore,
      memorial: candidate.memorial,
      character_count: candidate.characterCount,
      objective_questions: candidate.objectiveQuestions,
      discursive: candidate.discursive,
      parecer_id: candidate.parecerId,
    };

    const { error } = await supabase.from('candidates').upsert(payload, { onConflict: 'id' });
    if (error) {
      console.warn('Erro ao salvar candidato no Supabase:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Falha ao sincronizar candidato no Supabase:', err);
    return false;
  }
}

export async function deleteCandidateFromSupabase(candidateId: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  try {
    const { error } = await supabase.from('candidates').delete().eq('id', candidateId);
    if (error) {
      console.warn('Erro ao excluir candidato no Supabase:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Falha ao excluir candidato no Supabase:', err);
    return false;
  }
}

// ==============================================================================
// ALUNOS MATRICULADOS (STUDENTS)
// ==============================================================================
export async function fetchStudentsFromSupabase(): Promise<StudentAcademicRecord[] | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const { data, error } = await supabase.from('students').select('*').order('id', { ascending: true });
    if (error) {
      console.warn('Erro ao carregar alunos do Supabase:', error.message);
      return null;
    }
    if (!data) return [];

    return data.map((row: any): StudentAcademicRecord => ({
      alunoId: row.aluno_id,
      matricula: row.matricula,
      turmaId: row.turma_id,
      alunoName: row.aluno_name,
      polo: row.polo,
      frequenciaPercent: row.frequencia_percent || 0,
      presencas: row.presencas || 0,
      aulasTotais: row.aulas_totais || 0,
      submissions: row.submissions || [],
      notas: row.notas || [],
      mediaGeral: row.media_geral || 0,
      statusAcademico: row.status_academico,
    }));
  } catch (err) {
    console.warn('Falha na comunicação com Supabase (students):', err);
    return null;
  }
}

export async function upsertStudentToSupabase(student: StudentAcademicRecord): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  try {
    const payload = {
      aluno_id: student.alunoId,
      matricula: student.matricula,
      turma_id: student.turmaId,
      aluno_name: student.alunoName,
      polo: student.polo,
      frequencia_percent: student.frequenciaPercent,
      presencas: student.presencas,
      aulas_totais: student.aulasTotais,
      submissions: student.submissions,
      notas: student.notas,
      media_geral: student.mediaGeral,
      status_academico: student.statusAcademico,
    };

    const { error } = await supabase.from('students').upsert(payload, { onConflict: 'aluno_id' });
    if (error) {
      console.warn('Erro ao salvar aluno no Supabase:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Falha ao sincronizar aluno no Supabase:', err);
    return false;
  }
}

export async function deleteStudentFromSupabase(alunoId: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  try {
    const { error } = await supabase.from('students').delete().eq('aluno_id', alunoId);
    if (error) {
      console.warn('Erro ao remover aluno no Supabase:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Falha ao remover aluno no Supabase:', err);
    return false;
  }
}

// ==============================================================================
// TURMAS
// ==============================================================================
export async function fetchTurmasFromSupabase(): Promise<Turma[] | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const { data, error } = await supabase.from('turmas').select('*');
    if (error) {
      console.warn('Erro ao carregar turmas do Supabase:', error.message);
      return null;
    }
    if (!data) return [];

    return data.map((row: any): Turma => ({
      id: row.id,
      name: row.name,
      urlSlug: row.url_slug,
      status: row.status,
      resumo: row.resumo || undefined,
      editalResumo: row.edital_resumo || undefined,
      dataInicioInscricoes: row.data_inicio_inscricoes || '',
      dataFimInscricoes: row.data_fim_inscricoes || '',
      dataInicioAulas: row.data_inicio_aulas || '',
      dataConclusao: row.data_conclusao || '',
      vagas: row.vagas || 30,
      inscritosCount: row.inscritos_count || 0,
      matriculadosCount: row.matriculados_count || 0,
      gradeHoraria: row.grade_horaria || undefined,
      disciplinasIds: row.disciplinas_ids || [],
      disciplinasLiberadasIds: row.disciplinas_liberadas_ids || [],
      professorIds: row.professor_ids || [],
      materiaisExtras: row.materiais_extras || [],
      aulas: row.aulas || [],
    }));
  } catch (err) {
    console.warn('Falha ao carregar turmas do Supabase:', err);
    return null;
  }
}

export async function upsertTurmaToSupabase(turma: Turma): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  try {
    const payload = {
      id: turma.id,
      name: turma.name,
      url_slug: turma.urlSlug,
      status: turma.status,
      resumo: turma.resumo,
      edital_resumo: turma.editalResumo,
      data_inicio_inscricoes: turma.dataInicioInscricoes,
      data_fim_inscricoes: turma.dataFimInscricoes,
      data_inicio_aulas: turma.dataInicioAulas,
      data_conclusao: turma.dataConclusao,
      vagas: turma.vagas,
      inscritos_count: turma.inscritosCount,
      matriculados_count: turma.matriculadosCount,
      grade_horaria: turma.gradeHoraria,
      disciplinas_ids: turma.disciplinasIds,
      disciplinas_liberadas_ids: turma.disciplinasLiberadasIds,
      professor_ids: turma.professorIds,
      materiais_extras: turma.materiaisExtras,
      aulas: turma.aulas,
    };

    const { error } = await supabase.from('turmas').upsert(payload, { onConflict: 'id' });
    if (error) {
      console.warn('Erro ao salvar turma no Supabase:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Falha ao salvar turma no Supabase:', err);
    return false;
  }
}

// ==============================================================================
// DISCIPLINAS
// ==============================================================================
export async function fetchDisciplinasFromSupabase(): Promise<Disciplina[] | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const { data, error } = await supabase.from('disciplinas').select('*');
    if (error) {
      console.warn('Erro ao carregar disciplinas do Supabase:', error.message);
      return null;
    }
    if (!data) return [];

    return data.map((row: any): Disciplina => ({
      id: row.id,
      nome: row.nome,
      codigo: row.codigo || undefined,
      area: row.area,
      descricao: row.descricao || '',
      cargaHoraria: row.carga_horaria || 60,
      professorPadrao: row.professor_padrao || undefined,
      modulos: row.modulos || [],
      turmasIds: row.turmas_ids || [],
      avaliadores: row.avaliadores || [],
    }));
  } catch (err) {
    console.warn('Falha ao buscar disciplinas do Supabase:', err);
    return null;
  }
}

export async function upsertDisciplinaToSupabase(disciplina: Disciplina): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  try {
    const payload = {
      id: disciplina.id,
      nome: disciplina.nome,
      codigo: disciplina.codigo,
      area: disciplina.area,
      descricao: disciplina.descricao,
      carga_horaria: disciplina.cargaHoraria,
      professor_padrao: disciplina.professorPadrao,
      modulos: disciplina.modulos,
      turmas_ids: disciplina.turmasIds,
      avaliadores: disciplina.avaliadores,
    };

    const { error } = await supabase.from('disciplinas').upsert(payload, { onConflict: 'id' });
    if (error) {
      console.warn('Erro ao salvar disciplina no Supabase:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Falha ao salvar disciplina no Supabase:', err);
    return false;
  }
}

// ==============================================================================
// MURAL DE AVISOS
// ==============================================================================
export async function fetchAvisosFromSupabase(): Promise<MuralAviso[] | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const { data, error } = await supabase.from('mural_avisos').select('*').order('created_at', { ascending: false });
    if (error) {
      console.warn('Erro ao carregar avisos do Supabase:', error.message);
      return null;
    }
    if (!data) return [];

    return data.map((row: any): MuralAviso => ({
      id: row.id,
      turmaId: row.turma_id,
      autorNome: row.autor_nome,
      autorRole: row.autor_role,
      autorId: row.autor_id || undefined,
      titulo: row.titulo,
      conteudo: row.conteudo,
      data: row.data,
      importante: Boolean(row.importante),
      categoria: row.categoria || 'Geral',
      link: row.link || undefined,
      linkTitulo: row.link_titulo || undefined,
    }));
  } catch (err) {
    console.warn('Falha ao buscar avisos do Supabase:', err);
    return null;
  }
}

export async function upsertAvisoToSupabase(aviso: MuralAviso): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  try {
    const payload = {
      id: aviso.id,
      turma_id: aviso.turmaId,
      autor_nome: aviso.autorNome,
      autor_role: aviso.autorRole,
      autor_id: aviso.autorId,
      titulo: aviso.titulo,
      conteudo: aviso.conteudo,
      data: aviso.data,
      importante: aviso.importante,
      categoria: aviso.categoria || 'Geral',
      link: aviso.link,
      link_titulo: aviso.linkTitulo,
    };

    const { error } = await supabase.from('mural_avisos').upsert(payload, { onConflict: 'id' });
    if (error) {
      console.warn('Erro ao salvar aviso no Supabase:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Falha ao salvar aviso no Supabase:', err);
    return false;
  }
}

export async function deleteAvisoFromSupabase(avisoId: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  try {
    const { error } = await supabase.from('mural_avisos').delete().eq('id', avisoId);
    if (error) {
      console.warn('Erro ao remover aviso do Supabase:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Falha ao remover aviso do Supabase:', err);
    return false;
  }
}

// ==============================================================================
// USUÁRIOS
// ==============================================================================
export async function fetchUsersFromSupabase(): Promise<SystemUser[] | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const { data, error } = await supabase.from('users').select('*');
    if (error) {
      console.warn('Erro ao carregar usuários do Supabase:', error.message);
      return null;
    }
    if (!data) return [];

    return data.map((row: any): SystemUser => {
      let campo = row.campo_supervisao || '';
      let turmaId: string | undefined = undefined;
      let password = row.password || (row.role === 'admin' ? 'comieadepa2026' : row.role === 'professor' ? 'prof123' : 'aluno123');

      if (campo && (campo.startsWith('{') || campo.includes('"password"') || campo.includes('"pass"'))) {
        try {
          const meta = JSON.parse(campo);
          if (meta.campo !== undefined) campo = meta.campo;
          if (meta.turmaId) turmaId = meta.turmaId;
          if (meta.password) password = meta.password;
          else if (meta.pass) password = meta.pass;
        } catch {}
      }

      if (row.turma_id) turmaId = row.turma_id;

      const parts = (row.name || '').trim().split(' ').filter(Boolean);
      let initials = 'US';
      if (parts.length >= 2 && parts[0] && parts[parts.length - 1]) {
        initials = `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
      } else if (parts[0]) {
        initials = parts[0].slice(0, 2).toUpperCase();
      }

      return {
        id: row.uid,
        name: row.name,
        email: row.email,
        whatsapp: row.whatsapp || '',
        role: row.role,
        password: password,
        initials,
        roleLabel: row.role_label || (row.role === 'admin' ? 'COORDENAÇÃO TEOLÓGICA (ADMIN)' : row.role === 'professor' ? 'PROFESSOR TITULAR' : 'ALUNO VOCACIONADO'),
        routeSlug: row.route_slug || (row.role === 'admin' ? '/Paineladm' : row.role === 'professor' ? '/ProfCarlos' : '/turma2026-1024'),
        disciplina: row.disciplina || undefined,
        matricula: row.matricula || undefined,
        polo: row.polo || undefined,
        campoSupervisao: campo || undefined,
        turmaId: turmaId,
        status: row.status || 'Ativo',
      };
    });
  } catch (err) {
    console.warn('Falha ao carregar usuários do Supabase:', err);
    return null;
  }
}

export async function upsertUserToSupabase(user: SystemUser): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  try {
    // Serializa metadados com senha e turmaId dentro do campo_supervisao de forma transparente
    const campoSupervisaoMetadata = JSON.stringify({
      campo: user.campoSupervisao || user.polo || '',
      turmaId: user.turmaId || '',
      password: user.password || '',
    });

    const payload: Record<string, any> = {
      uid: user.id,
      name: user.name,
      email: user.email.toLowerCase().trim(),
      whatsapp: user.whatsapp,
      role: user.role,
      role_label: user.roleLabel,
      route_slug: user.routeSlug,
      disciplina: user.disciplina,
      matricula: user.matricula,
      polo: user.polo,
      campo_supervisao: campoSupervisaoMetadata,
      status: user.status || 'Ativo',
    };

    const { error } = await supabase.from('users').upsert(payload, { onConflict: 'uid' });
    if (error) {
      console.warn('Erro ao salvar usuário no Supabase:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Falha ao salvar usuário no Supabase:', err);
    return false;
  }
}

export async function deleteUserFromSupabase(uid: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  try {
    const { error } = await supabase.from('users').delete().eq('uid', uid);
    if (error) {
      console.warn('Erro ao deletar usuário do Supabase:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Falha ao deletar usuário do Supabase:', err);
    return false;
  }
}

export async function authenticateUserFromSupabase(emailOrUsername: string, pass: string): Promise<SystemUser | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const cleanEmail = emailOrUsername.trim().toLowerCase();
    const cleanPass = pass.trim();

    const { data, error } = await supabase.from('users').select('*');
    if (error || !data) return null;

    for (const row of data) {
      let campo = row.campo_supervisao || '';
      let turmaId: string | undefined = undefined;
      let password = row.password || (row.role === 'admin' ? 'comieadepa2026' : row.role === 'professor' ? 'prof123' : 'aluno123');

      if (campo && (campo.startsWith('{') || campo.includes('"password"') || campo.includes('"pass"'))) {
        try {
          const meta = JSON.parse(campo);
          if (meta.campo !== undefined) campo = meta.campo;
          if (meta.turmaId) turmaId = meta.turmaId;
          if (meta.password) password = meta.password;
          else if (meta.pass) password = meta.pass;
        } catch {}
      }

      if (row.turma_id) turmaId = row.turma_id;

      const isAdminPass = row.role === 'admin' && (cleanPass === 'comieadepa2026' || cleanPass === 'comieadepa2025');

      const matchesEmail =
        row.email?.toLowerCase().trim() === cleanEmail ||
        (cleanEmail === 'admin' && row.role === 'admin') ||
        (cleanEmail === 'comissao' && row.role === 'admin') ||
        (row.route_slug && row.route_slug.toLowerCase() === `/${cleanEmail}`);

      const matchesPass = password === cleanPass || isAdminPass;

      if (matchesEmail && matchesPass) {
        const parts = (row.name || '').trim().split(' ').filter(Boolean);
        let initials = 'US';
        if (parts.length >= 2 && parts[0] && parts[parts.length - 1]) {
          initials = `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
        } else if (parts[0]) {
          initials = parts[0].slice(0, 2).toUpperCase();
        }

        return {
          id: row.uid,
          name: row.name,
          email: row.email,
          whatsapp: row.whatsapp || '',
          role: row.role,
          password: password,
          initials,
          roleLabel: row.role_label || (row.role === 'admin' ? 'COORDENAÇÃO TEOLÓGICA (ADMIN)' : row.role === 'professor' ? 'PROFESSOR TITULAR' : 'ALUNO VOCACIONADO'),
          routeSlug: row.route_slug || (row.role === 'admin' ? '/Paineladm' : row.role === 'professor' ? '/ProfCarlos' : '/turma2026-1024'),
          disciplina: row.disciplina || undefined,
          matricula: row.matricula || undefined,
          polo: row.polo || undefined,
          campoSupervisao: campo || undefined,
          turmaId: turmaId,
          status: row.status || 'Ativo',
        };
      }
    }
    return null;
  } catch (err) {
    console.warn('Falha na autenticação via Supabase:', err);
    return null;
  }
}
