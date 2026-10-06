import React, { useState, useEffect } from 'react';
import {
  ActiveTab,
  Candidate,
  CandidateStatus,
  UserProfile,
  Turma,
  SystemUser,
  AcademicModule,
  StudentAcademicRecord,
  MuralAviso,
  Disciplina,
} from './types';
import { INITIAL_CANDIDATES } from './data/mockCandidates';
import {
  MOCK_TURMAS,
  MOCK_SYSTEM_USERS,
  MOCK_ACADEMIC_MODULES,
  MOCK_STUDENT_RECORDS,
  MOCK_MURAL_AVISOS,
  MOCK_DISCIPLINAS,
} from './data/mockAcademicData';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { CandidateDossierView } from './components/CandidateDossierView';
import { CandidateFlowWrapper } from './components/CandidateFlow/CandidateFlowWrapper';
import { CommissionLogin } from './components/CommissionLogin';
import { UserProfileModal } from './components/UserProfileModal';
import { VitrineHomeView } from './components/VitrineHomeView';
import { ProfessorPortalView } from './components/ProfessorPortalView';
import { StudentPortalView } from './components/StudentPortalView';
import { Footer } from './components/Footer';
import { normalizeProcessoId } from './data/processoSeletivoService';
import {
  isSupabaseConfigured,
  fetchCandidatesFromSupabase,
  upsertCandidateToSupabase,
  deleteCandidateFromSupabase,
  fetchStudentsFromSupabase,
  upsertStudentToSupabase,
  fetchTurmasFromSupabase,
  upsertTurmaToSupabase,
  fetchDisciplinasFromSupabase,
  upsertDisciplinaToSupabase,
  fetchAvisosFromSupabase,
  upsertAvisoToSupabase,
  fetchUsersFromSupabase,
  upsertUserToSupabase,
  deleteUserFromSupabase,
} from './services/supabaseService';

export default function App() {
  // 1. Candidates state
  const [candidates, setCandidates] = useState<Candidate[]>(() => {
    const saved = localStorage.getItem('escritores_qgu_candidates');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      } catch (e) {
        console.error('Error parsing stored candidates', e);
      }
    }
    return INITIAL_CANDIDATES;
  });

  // 2. Academic data states (Turmas, Users, Modules, Students, Mural)
  const [turmas, setTurmas] = useState<Turma[]>(() => {
    const saved = localStorage.getItem('escritores_qgu_turmas');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return MOCK_TURMAS;
  });

  const [systemUsers, setSystemUsers] = useState<SystemUser[]>(() => {
    const saved = localStorage.getItem('escritores_qgu_system_users');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return MOCK_SYSTEM_USERS;
  });

  const [modules, setModules] = useState<AcademicModule[]>(() => {
    const saved = localStorage.getItem('escritores_qgu_modules');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === 5 && parsed.some((m: AcademicModule) => m.id === 'mod-5')) {
          return parsed;
        }
      } catch {}
    }
    return MOCK_ACADEMIC_MODULES;
  });

  const [students, setStudents] = useState<StudentAcademicRecord[]>(() => {
    const saved = localStorage.getItem('escritores_qgu_students');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Normaliza registros de alunos salvos
          const normalized = parsed.map((s: StudentAcademicRecord) => ({
            ...s,
            matricula: s.matricula || '2026-QGU-1024',
            polo: s.polo || 'Campo Central',
          }));

          // Verifica se ainda tem dados mockados legados com notas fictícias
          const hasLegacyFictionalGrades = normalized.some(
            (s: StudentAcademicRecord) =>
              s.notas?.some(
                (n) =>
                  n.feedback?.includes('Aprovado com distinção') ||
                  n.feedback?.includes('Desempenho exemplar')
              ) || (s.frequenciaPercent === 100 && s.aulasTotais === 20 && s.presencas === 20)
          );
          if (hasLegacyFictionalGrades) {
            const cleaned = normalized.map((s: StudentAcademicRecord) => ({
              ...s,
              frequenciaPercent: 0,
              presencas: 0,
              aulasTotais: 0,
              mediaGeral: 0,
              submissions: [],
              notas: [],
            }));
            localStorage.setItem('escritores_qgu_students', JSON.stringify(cleaned));
            return cleaned;
          }
          return normalized;
        }
      } catch {}
    }
    return MOCK_STUDENT_RECORDS;
  });

  const [muralAvisos, setMuralAvisos] = useState<MuralAviso[]>(() => {
    const saved = localStorage.getItem('escritores_qgu_avisos');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return MOCK_MURAL_AVISOS;
  });

  // Repositório Central de Materiais Didáticos (Disciplinas)
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>(() => {
    const saved = localStorage.getItem('escritores_qgu_disciplinas');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === 5 && parsed.some((d: Disciplina) => d.id === 'disc-5')) {
          return parsed;
        }
      } catch {}
    }
    return MOCK_DISCIPLINAS;
  });

  // Persist academic changes to localStorage
  useEffect(() => {
    localStorage.setItem('escritores_qgu_candidates', JSON.stringify(candidates));
  }, [candidates]);

  useEffect(() => {
    localStorage.setItem('escritores_qgu_turmas', JSON.stringify(turmas));
  }, [turmas]);

  useEffect(() => {
    localStorage.setItem('escritores_qgu_system_users', JSON.stringify(systemUsers));
  }, [systemUsers]);

  useEffect(() => {
    localStorage.setItem('escritores_qgu_modules', JSON.stringify(modules));
  }, [modules]);

  useEffect(() => {
    localStorage.setItem('escritores_qgu_students', JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    localStorage.setItem('escritores_qgu_avisos', JSON.stringify(muralAvisos));
  }, [muralAvisos]);

  useEffect(() => {
    localStorage.setItem('escritores_qgu_disciplinas', JSON.stringify(disciplinas));
  }, [disciplinas]);

  // Carrega e sincroniza dados do Supabase quando as credenciais estiverem ativas
  useEffect(() => {
    let isMounted = true;
    async function syncSupabaseData() {
      if (!isSupabaseConfigured()) return;
      try {
        const [remoteCandidates, remoteStudents, remoteTurmas, remoteDisciplinas, remoteAvisos, remoteUsers] = await Promise.all([
          fetchCandidatesFromSupabase(),
          fetchStudentsFromSupabase(),
          fetchTurmasFromSupabase(),
          fetchDisciplinasFromSupabase(),
          fetchAvisosFromSupabase(),
          fetchUsersFromSupabase(),
        ]);

        if (!isMounted) return;

        if (remoteCandidates && remoteCandidates.length > 0) {
          setCandidates(remoteCandidates);
        }
        if (remoteStudents && remoteStudents.length > 0) {
          setStudents(remoteStudents);
        }
        if (remoteTurmas && remoteTurmas.length > 0) {
          setTurmas(remoteTurmas);
        }
        if (remoteDisciplinas && remoteDisciplinas.length > 0) {
          setDisciplinas(remoteDisciplinas);
        }
        if (remoteAvisos && remoteAvisos.length > 0) {
          setMuralAvisos(remoteAvisos);
        }
        if (remoteUsers && remoteUsers.length > 0) {
          setSystemUsers(remoteUsers);
        }
      } catch (e) {
        console.warn('Erro ao sincronizar com Supabase:', e);
      }
    }
    syncSupabaseData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Determine if direct access to /painel occurred
  const checkIsDirectPainel = (): boolean => {
    if (typeof window === 'undefined') return false;
    const path = window.location.pathname.toLowerCase();
    const hash = window.location.hash.toLowerCase();
    return (
      path === '/painel' ||
      path === '/paineladm' ||
      path.startsWith('/painel') ||
      hash === '#/painel' ||
      hash.includes('painel')
    );
  };

  // Helper to check if Coordenação is authenticated
  const checkIsCoordenacaoLoggedIn = (): boolean => {
    if (typeof window === 'undefined') return false;
    const session = sessionStorage.getItem('escritores_qgu_auth');
    const local = localStorage.getItem('escritores_qgu_auth');
    if (session !== 'true' && local !== 'true') return false;
    const savedUser =
      localStorage.getItem('escritores_qgu_current_user') ||
      sessionStorage.getItem('escritores_qgu_current_user');
    if (savedUser) {
      try {
        const u = JSON.parse(savedUser);
        return u && u.role === 'admin';
      } catch {}
    }
    return false;
  };

  // Helper to check if any user (Admin, Professor or Aluno) is authenticated
  const checkIsAnyUserLoggedIn = (): boolean => {
    if (typeof window === 'undefined') return false;
    const session = sessionStorage.getItem('escritores_qgu_auth');
    const local = localStorage.getItem('escritores_qgu_auth');
    return session === 'true' || local === 'true';
  };

  // Helper to check if a pathname or hash corresponds to a turma route or slug
  const checkIsTurmaRoute = (
    pathname: string,
    hashStr: string
  ): { isTurma: boolean; slug: string } => {
    const cleanPath = pathname.replace(/^\//, '').trim().toLowerCase();
    const cleanHash = hashStr.replace(/^#\/?/, '').trim().toLowerCase();

    if (
      cleanPath.startsWith('turma') ||
      cleanHash.startsWith('turma') ||
      cleanPath.startsWith('aluno') ||
      cleanHash.startsWith('aluno')
    ) {
      return { isTurma: true, slug: cleanPath || cleanHash };
    }

    try {
      const saved = localStorage.getItem('escritores_qgu_turmas');
      const turmasList: Turma[] = saved ? JSON.parse(saved) : MOCK_TURMAS;
      if (Array.isArray(turmasList)) {
        const found = turmasList.find((t) => {
          const s = (t.urlSlug || '').toLowerCase();
          const tid = (t.id || '').toLowerCase();
          return (
            (s && (cleanPath === s || cleanHash === s)) ||
            (tid && (cleanPath === tid || cleanHash === tid))
          );
        });
        if (found) {
          return { isTurma: true, slug: found.urlSlug || found.id };
        }
      }
    } catch {}

    return { isTurma: false, slug: '' };
  };

  const initialWasDirectPainel = checkIsDirectPainel();

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (initialWasDirectPainel) {
      return false;
    }
    const session = sessionStorage.getItem('escritores_qgu_auth');
    const local = localStorage.getItem('escritores_qgu_auth');
    return session === 'true' || local === 'true';
  });

  const [currentUser, setCurrentUser] = useState<SystemUser | null>(() => {
    const saved = localStorage.getItem('escritores_qgu_current_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return null;
  });

  const [wasRedirectedFromPainel, setWasRedirectedFromPainel] =
    useState<boolean>(initialWasDirectPainel);

  const [examinerName, setExaminerName] = useState<string>(() => {
    return (
      currentUser?.name ||
      sessionStorage.getItem('escritores_qgu_examiner') ||
      localStorage.getItem('escritores_qgu_examiner') ||
      'Lucas Pimenta'
    );
  });

  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('escritores_qgu_user_profile');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error parsing stored user profile', e);
      }
    }
    return {
      name: 'Lucas Pimenta',
      email: 'lucaspimenta717@gmail.com',
      whatsapp: '(91) 98257-7589',
      role: 'COORDENAÇÃO TEOLÓGICA (ADMIN)',
      initials: 'LP',
    };
  });

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Determine initial activeTab based on window URL path or hash
  const parseUrlRoute = (): {
    tab: ActiveTab;
    submissionId: string | null;
    processoId: string | null;
    modelPageRedirect?: 'inscricao' | 'candidato' | 'prova' | null;
    turmaRedirect?: string | null;
  } => {
    if (typeof window === 'undefined') return { tab: 'vitrine', submissionId: null, processoId: null };
    let decodedPath = window.location.pathname;
    try {
      decodedPath = decodeURIComponent(window.location.pathname);
    } catch {}
    const path = decodedPath.toLowerCase();
    const hash = window.location.hash.toLowerCase();

    if (
      path === '/painel' ||
      path === '/paineladm' ||
      path.startsWith('/painel') ||
      hash.includes('painel')
    ) {
      window.history.replaceState(null, '', '/login');
      return { tab: 'login', submissionId: null, processoId: null };
    }

    // Bloqueia qualquer rota criada para turma por login
    const turmaRouteMatch = checkIsTurmaRoute(path, hash);
    if (turmaRouteMatch.isTurma) {
      if (!checkIsAnyUserLoggedIn()) {
        window.history.replaceState(null, '', '/login');
        return {
          tab: 'login',
          submissionId: null,
          processoId: null,
          turmaRedirect: turmaRouteMatch.slug,
        };
      }
      return { tab: 'aluno', submissionId: null, processoId: null };
    }

    // Bloqueia rota de professor por login
    if (path.startsWith('/prof') || hash.includes('/prof')) {
      if (!checkIsAnyUserLoggedIn()) {
        window.history.replaceState(null, '', '/login');
        return { tab: 'login', submissionId: null, processoId: null };
      }
      return { tab: 'professor', submissionId: null, processoId: null };
    }

    if (path === '/login' || hash === '#/login' || hash === '#login') {
      return { tab: 'login', submissionId: null, processoId: null };
    }

    // 1. Two segments under /inscricao: /inscricao/:processoId/:inscricaoId
    const inscricaoTwoSegments = path.match(/^\/(?:inscri[cç][aã]o)\/([^\/]+)\/([^\/]+)\/?$/i);
    if (inscricaoTwoSegments && inscricaoTwoSegments[1] && inscricaoTwoSegments[2]) {
      const proc = normalizeProcessoId(inscricaoTwoSegments[1]);
      const cand = inscricaoTwoSegments[2].replace(/^#/, '');
      return { tab: 'inscricao', submissionId: cand, processoId: proc };
    }

    const hashTwoSegments = hash.match(/#(?:inscri[cç][aã]o)\/([^\/]+)\/([^\/]+)\/?$/i);
    if (hashTwoSegments && hashTwoSegments[1] && hashTwoSegments[2]) {
      const proc = normalizeProcessoId(hashTwoSegments[1]);
      const cand = hashTwoSegments[2].replace(/^#/, '');
      return { tab: 'inscricao', submissionId: cand, processoId: proc };
    }

    // 2. Route /candidato or /candidato/:processoId
    const candidatoMatch = path.match(/^\/candidato(?:\/([^\/]+))?\/?$/i);
    if (candidatoMatch) {
      const proc = candidatoMatch[1] ? normalizeProcessoId(candidatoMatch[1]) : null;
      if (!proc && !checkIsCoordenacaoLoggedIn()) {
        window.history.replaceState(null, '', '/login');
        return { tab: 'login', submissionId: null, processoId: null, modelPageRedirect: 'candidato' };
      }
      return { tab: 'candidato', submissionId: null, processoId: proc };
    }
    const hashCandidatoMatch = hash.match(/#\/?candidato(?:\/([^\/]+))?\/?$/i);
    if (hashCandidatoMatch) {
      const proc = hashCandidatoMatch[1] ? normalizeProcessoId(hashCandidatoMatch[1]) : null;
      if (!proc && !checkIsCoordenacaoLoggedIn()) {
        window.history.replaceState(null, '', '/login');
        return { tab: 'login', submissionId: null, processoId: null, modelPageRedirect: 'candidato' };
      }
      return { tab: 'candidato', submissionId: null, processoId: proc };
    }

    // 3. Route /prova or /prova/:processoId
    const provaMatch = path.match(/^\/prova(?:\/([^\/]+))?\/?$/i);
    if (provaMatch) {
      const proc = provaMatch[1] ? normalizeProcessoId(provaMatch[1]) : null;
      if (!proc && !checkIsCoordenacaoLoggedIn()) {
        window.history.replaceState(null, '', '/login');
        return { tab: 'login', submissionId: null, processoId: null, modelPageRedirect: 'prova' };
      }
      return { tab: 'prova', submissionId: null, processoId: proc };
    }
    const hashProvaMatch = hash.match(/#\/?prova(?:\/([^\/]+))?\/?$/i);
    if (hashProvaMatch) {
      const proc = hashProvaMatch[1] ? normalizeProcessoId(hashProvaMatch[1]) : null;
      if (!proc && !checkIsCoordenacaoLoggedIn()) {
        window.history.replaceState(null, '', '/login');
        return { tab: 'login', submissionId: null, processoId: null, modelPageRedirect: 'prova' };
      }
      return { tab: 'prova', submissionId: null, processoId: proc };
    }

    // 4. One segment under /inscricao: /inscricao/:param
    const inscricaoOneSegment = path.match(/^\/(?:inscri[cç][aã]o)\/([^\/]+)\/?$/i);
    if (inscricaoOneSegment && inscricaoOneSegment[1]) {
      const param = inscricaoOneSegment[1].trim();
      const isCandidateProtocol = /^#?qgu-/i.test(param) || /^\d{4,8}$/.test(param);
      if (isCandidateProtocol) {
        return { tab: 'inscricao', submissionId: param.replace(/^#/, ''), processoId: null };
      } else {
        return { tab: 'inscricao', submissionId: null, processoId: normalizeProcessoId(param) };
      }
    }

    const hashOneSegment = hash.match(/#(?:inscri[cç][aã]o)\/([^\/]+)\/?$/i);
    if (hashOneSegment && hashOneSegment[1]) {
      const param = hashOneSegment[1].trim();
      const isCandidateProtocol = /^#?qgu-/i.test(param) || /^\d{4,8}$/.test(param);
      if (isCandidateProtocol) {
        return { tab: 'inscricao', submissionId: param.replace(/^#/, ''), processoId: null };
      } else {
        return { tab: 'inscricao', submissionId: null, processoId: normalizeProcessoId(param) };
      }
    }

    // 5. Canonical /inscricao (no params) - Acesso exclusivo da Coordenação
    if (
      path === '/inscricao' ||
      path === '/inscrição' ||
      hash === '#/inscricao' ||
      hash === '#inscricao'
    ) {
      if (!checkIsCoordenacaoLoggedIn()) {
        window.history.replaceState(null, '', '/login');
        return { tab: 'login', submissionId: null, processoId: null, modelPageRedirect: 'inscricao' };
      }
      return { tab: 'inscricao', submissionId: null, processoId: null };
    }

    return { tab: 'vitrine', submissionId: null, processoId: null };
  };

  const initialRoute = parseUrlRoute();
  const [activeTab, setActiveTab] = useState<ActiveTab>(initialRoute.tab);
  const [submissionId, setSubmissionId] = useState<string | null>(initialRoute.submissionId);
  const [currentProcessoId, setCurrentProcessoId] = useState<string | null>(initialRoute.processoId);
  const [redirectedFromModelPage, setRedirectedFromModelPage] = useState<
    'inscricao' | 'candidato' | 'prova' | null
  >(initialRoute.modelPageRedirect || null);
  const [redirectedFromTurma, setRedirectedFromTurma] = useState<string | boolean | null>(
    initialRoute.turmaRedirect || null
  );
  const [adminView, setAdminView] = useState<'list' | 'dossier'>('list');
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>(
    INITIAL_CANDIDATES[0].id
  );
  const [isInscriptionOpen, setIsInscriptionOpen] = useState<boolean>(true);

  // Sync with browser navigation
  useEffect(() => {
    const handleUrlChange = () => {
      const route = parseUrlRoute();

      if (route.modelPageRedirect) {
        setRedirectedFromModelPage(route.modelPageRedirect);
      }
      if (route.turmaRedirect) {
        setRedirectedFromTurma(route.turmaRedirect);
      }

      if (route.tab === 'painel') {
        if (!isAuthenticated) {
          setWasRedirectedFromPainel(true);
          setActiveTab('login');
          setSubmissionId(null);
          setCurrentProcessoId(null);
          window.history.replaceState(null, '', '/login');
        } else {
          setActiveTab('painel');
          setSubmissionId(null);
          setCurrentProcessoId(null);
          setAdminView('list');
        }
      } else if (route.tab === 'aluno') {
        if (!checkIsAnyUserLoggedIn()) {
          setRedirectedFromTurma(route.turmaRedirect || true);
          setActiveTab('login');
          setSubmissionId(null);
          setCurrentProcessoId(null);
          window.history.replaceState(null, '', '/login');
        } else {
          setActiveTab('aluno');
          setSubmissionId(null);
          setCurrentProcessoId(null);
        }
      } else if (route.tab === 'professor') {
        if (!checkIsAnyUserLoggedIn()) {
          setActiveTab('login');
          setSubmissionId(null);
          setCurrentProcessoId(null);
          window.history.replaceState(null, '', '/login');
        } else {
          setActiveTab('professor');
          setSubmissionId(null);
          setCurrentProcessoId(null);
        }
      } else {
        setActiveTab(route.tab);
        setSubmissionId(route.submissionId);
        setCurrentProcessoId(route.processoId);
      }
    };

    // Intercepta cliques em links de navegação para rotas internas
    const handleDocumentClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement)?.closest('a');
      if (target) {
        const href = target.getAttribute('href');
        if (!href) return;
        const cleanHref = href.replace(/^#/, '');

        if (cleanHref.startsWith('/candidato') || cleanHref.startsWith('candidato')) {
          e.preventDefault();
          const segs = cleanHref.split('/').filter(Boolean);
          const procId = segs[1] ? normalizeProcessoId(segs[1]) : currentProcessoId;
          navigateTo('candidato', true, procId);
        } else if (cleanHref.startsWith('/prova') || cleanHref.startsWith('prova')) {
          e.preventDefault();
          const segs = cleanHref.split('/').filter(Boolean);
          const procId = segs[1] ? normalizeProcessoId(segs[1]) : currentProcessoId;
          navigateTo('prova', true, procId);
        } else if (cleanHref.startsWith('/inscricao') || cleanHref.startsWith('inscricao') || cleanHref.startsWith('/inscrição')) {
          e.preventDefault();
          const segs = cleanHref.split('/').filter(Boolean);
          if (segs.length >= 3) {
            // /inscricao/[procId]/[candId]
            const procId = normalizeProcessoId(segs[1]);
            const candId = segs[2];
            navigateToSuccess(candId, procId);
          } else if (segs.length === 2) {
            const procId = normalizeProcessoId(segs[1]);
            navigateTo('inscricao', true, procId);
          } else {
            navigateTo('inscricao', true, null);
          }
        }
      }
    };

    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);
    document.addEventListener('click', handleDocumentClick);
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
      document.removeEventListener('click', handleDocumentClick);
    };
  }, [isAuthenticated, currentProcessoId]);

  // Navigate and update browser URL
  const navigateTo = (tab: ActiveTab, pushHistory = true, procId?: string | null) => {
    const targetProcId = procId !== undefined ? procId : currentProcessoId;
    setCurrentProcessoId(targetProcId || null);

    if (tab === 'vitrine') {
      setActiveTab('vitrine');
      setSubmissionId(null);
      setCurrentProcessoId(null);
      if (pushHistory) window.history.pushState(null, '', '/');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (tab === 'inscricao') {
      if (!targetProcId && (!isAuthenticated || (currentUser && currentUser.role !== 'admin'))) {
        setRedirectedFromModelPage('inscricao');
        setActiveTab('login');
        if (pushHistory) window.history.pushState(null, '', '/login');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      setActiveTab('inscricao');
      setSubmissionId(null);
      const url = targetProcId ? `/inscricao/${targetProcId.replace(/^#/, '')}` : '/inscricao';
      if (pushHistory) window.history.pushState(null, '', url);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (tab === 'candidato') {
      if (!targetProcId && (!isAuthenticated || (currentUser && currentUser.role !== 'admin'))) {
        setRedirectedFromModelPage('candidato');
        setActiveTab('login');
        if (pushHistory) window.history.pushState(null, '', '/login');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      setActiveTab('candidato');
      setSubmissionId(null);
      const url = targetProcId ? `/candidato/${targetProcId.replace(/^#/, '')}` : '/candidato';
      if (pushHistory) window.history.pushState(null, '', url);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (tab === 'prova') {
      if (!targetProcId && (!isAuthenticated || (currentUser && currentUser.role !== 'admin'))) {
        setRedirectedFromModelPage('prova');
        setActiveTab('login');
        if (pushHistory) window.history.pushState(null, '', '/login');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      setActiveTab('prova');
      setSubmissionId(null);
      const url = targetProcId ? `/prova/${targetProcId.replace(/^#/, '')}` : '/prova';
      if (pushHistory) window.history.pushState(null, '', url);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (tab === 'painel') {
      setCurrentProcessoId(null);
      if (!isAuthenticated) {
        setWasRedirectedFromPainel(true);
        setActiveTab('login');
        if (pushHistory) window.history.pushState(null, '', '/login');
        return;
      }
      setActiveTab('painel');
      setAdminView('list');
      if (pushHistory) window.history.pushState(null, '', '/Paineladm');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (tab === 'professor') {
      setCurrentProcessoId(null);
      if (!isAuthenticated && !checkIsAnyUserLoggedIn()) {
        setActiveTab('login');
        if (pushHistory) window.history.pushState(null, '', '/login');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      setActiveTab('professor');
      if (pushHistory)
        window.history.pushState(null, '', currentUser?.routeSlug || '/ProfCarlos');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (tab === 'aluno') {
      setCurrentProcessoId(null);
      if (!isAuthenticated && !checkIsAnyUserLoggedIn()) {
        setRedirectedFromTurma(true);
        setActiveTab('login');
        if (pushHistory) window.history.pushState(null, '', '/login');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      setActiveTab('aluno');
      if (pushHistory)
        window.history.pushState(null, '', currentUser?.routeSlug || '/turma2026-1024');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (tab === 'login') {
      setCurrentProcessoId(null);
      setActiveTab('login');
      if (pushHistory) window.history.pushState(null, '', '/login');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
  };

  const handleLoginSuccess = (
    user: SystemUser,
    targetRoute?: 'painel' | 'inscricao' | 'candidato' | 'prova'
  ) => {
    setIsAuthenticated(true);
    setCurrentUser(user);
    setExaminerName(user.name);
    setUserProfile((prev) => ({
      ...prev,
      name: user.name,
      email: user.email,
      whatsapp: user.whatsapp,
      role: user.roleLabel,
      initials: user.initials,
    }));
    setWasRedirectedFromPainel(false);
    setRedirectedFromModelPage(null);

    // Route dynamically based on user role as defined in PDF Section 2.1
    if (user.role === 'admin') {
      if (targetRoute === 'inscricao') {
        setActiveTab('inscricao');
        setSubmissionId(null);
        setCurrentProcessoId(null);
        window.history.pushState(null, '', '/inscricao');
      } else if (targetRoute === 'candidato') {
        setActiveTab('candidato');
        setSubmissionId(null);
        setCurrentProcessoId(null);
        window.history.pushState(null, '', '/candidato');
      } else if (targetRoute === 'prova') {
        setActiveTab('prova');
        setSubmissionId(null);
        setCurrentProcessoId(null);
        window.history.pushState(null, '', '/prova');
      } else {
        setActiveTab('painel');
        setAdminView('list');
        window.history.pushState(null, '', '/Paineladm');
      }
      setRedirectedFromTurma(null);
    } else if (user.role === 'professor') {
      setActiveTab('professor');
      window.history.pushState(null, '', user.routeSlug || '/ProfCarlos');
      setRedirectedFromTurma(null);
    } else if (user.role === 'aluno') {
      setActiveTab('aluno');
      const targetSlug =
        typeof redirectedFromTurma === 'string' && redirectedFromTurma
          ? `/${redirectedFromTurma.replace(/^\//, '')}`
          : user.routeSlug || '/turma2026-1024';
      window.history.pushState(null, '', targetSlug);
      setRedirectedFromTurma(null);
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveProfile = (updated: UserProfile) => {
    setUserProfile(updated);
    setExaminerName(updated.name);
    localStorage.setItem('escritores_qgu_user_profile', JSON.stringify(updated));
    localStorage.setItem('escritores_qgu_examiner', updated.name);
    sessionStorage.setItem('escritores_qgu_examiner', updated.name);

    if (currentUser) {
      const updatedUser: SystemUser = {
        ...currentUser,
        name: updated.name,
        email: updated.email,
        whatsapp: updated.whatsapp,
        initials: updated.initials,
      };
      setCurrentUser(updatedUser);
      localStorage.setItem('escritores_qgu_current_user', JSON.stringify(updatedUser));
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('escritores_qgu_auth');
    localStorage.removeItem('escritores_qgu_examiner');
    localStorage.removeItem('escritores_qgu_current_user');
    sessionStorage.removeItem('escritores_qgu_auth');
    sessionStorage.removeItem('escritores_qgu_examiner');
    sessionStorage.removeItem('escritores_qgu_current_user');
    sessionStorage.removeItem('login_failed_attempts');
    setIsAuthenticated(false);
    setCurrentUser(null);
    setWasRedirectedFromPainel(false);
    setRedirectedFromTurma(null);
    setRedirectedFromModelPage(null);
    setActiveTab('login');
    window.history.pushState(null, '', '/login');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Find currently selected candidate
  const selectedCandidate =
    candidates.find((c) => c.id === selectedCandidateId) || candidates[0];

  const handleSelectCandidate = (candidateId: string) => {
    setSelectedCandidateId(candidateId);
    setAdminView('dossier');
    setActiveTab('painel');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCandidateSubmitted = (newCandidate: Candidate) => {
    setCandidates((prev) => [newCandidate, ...prev]);
    setSelectedCandidateId(newCandidate.id);
    upsertCandidateToSupabase(newCandidate);
  };

  const handleCreateCandidate = (newCandidate: Candidate) => {
    setCandidates((prev) => [newCandidate, ...prev]);
    upsertCandidateToSupabase(newCandidate);
  };

  const handleUpdateCandidate = (updatedCandidate: Candidate) => {
    setCandidates((prev) =>
      prev.map((c) => (c.id === updatedCandidate.id ? updatedCandidate : c))
    );
    upsertCandidateToSupabase(updatedCandidate);
  };

  const handleDeleteCandidate = (candidateId: string) => {
    setCandidates((prev) => prev.filter((c) => c.id !== candidateId));
    if (selectedCandidateId === candidateId) {
      setAdminView('list');
    }
    deleteCandidateFromSupabase(candidateId);
  };

  const handleResetCandidates = () => {
    setCandidates(INITIAL_CANDIDATES);
  };

  const handleUpdateStatus = (candidateId: string, newStatus: CandidateStatus) => {
    setCandidates((prev) =>
      prev.map((candidate) => {
        if (candidate.id === candidateId) {
          const statusLabel =
            newStatus === 'APROVADO'
              ? 'APROVADO PELA COMISSÃO'
              : newStatus === 'REPROVADO'
              ? 'REPROVADO (PARECER FINAL)'
              : 'EM ANÁLISE';
          const updated = {
            ...candidate,
            status: newStatus,
            statusLabel,
          };
          upsertCandidateToSupabase(updated);
          return updated;
        }
        return candidate;
      })
    );
  };

  const navigateToSuccess = (candidateId: string, procId?: string | null) => {
    const cleanCandId = candidateId.replace(/^#/, '');
    const cleanProcId = procId ? procId.replace(/^#/, '') : currentProcessoId;
    setActiveTab('inscricao');
    setSubmissionId(cleanCandId);
    if (cleanProcId) {
      setCurrentProcessoId(cleanProcId);
      window.history.pushState(null, '', `/inscricao/${cleanProcId}/${cleanCandId}`);
    } else {
      window.history.pushState(null, '', `/inscricao/${cleanCandId}`);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isLoginPage = activeTab === 'login';

  return (
    <div className="min-h-screen flex flex-col bg-[#ffffff] text-[#191c19] selection:bg-[#123d00] selection:text-[#a2d486]">
      {/* Header with Navigation and Institutional Identity - Hidden on vitrine and login page */}
      {!isLoginPage && activeTab !== 'vitrine' && (
        <Header
          activeTab={activeTab}
          isAuthenticated={isAuthenticated}
          examinerName={examinerName}
          userProfile={userProfile}
          currentUser={currentUser}
          onTabChange={(tab) => navigateTo(tab)}
          onLogout={handleLogout}
          onOpenProfile={() => setIsProfileModalOpen(true)}
        />
      )}

      {/* Main Content Area */}
      <main
        className={`flex-1 overflow-x-hidden ${
          isLoginPage ? 'min-h-screen flex flex-col justify-center items-center p-3 sm:p-4' : ''
        }`}
      >
        {/* VIEW 1: VITRINE INSTITUCIONAL (Landing Home pública) */}
        {activeTab === 'vitrine' && (
          <VitrineHomeView
            turma={turmas.find(t => t.status === 'Aberto') || turmas[0] || MOCK_TURMAS[0]}
            turmaVigente={turmas.find(t => t.status === 'Aberto') || turmas[0] || MOCK_TURMAS[0]}
            isInscriptionOpen={isInscriptionOpen}
            onGoToInscricao={() => navigateTo('inscricao')}
          />
        )}

        {/* VIEW 2: LOGIN UNIFICADO COM REDIRECIONAMENTO DINÂMICO */}
        {activeTab === 'login' && (
          <CommissionLogin
            users={systemUsers}
            onLoginSuccess={handleLoginSuccess}
            onBackToPublic={() => navigateTo('vitrine')}
            redirectedFromPainel={wasRedirectedFromPainel}
            redirectedFromModelPage={redirectedFromModelPage}
            redirectedFromTurma={redirectedFromTurma}
          />
        )}

        {/* VIEW 3: INSCRIÇÃO (/inscricao), CANDIDATO (/candidato), PROVA (/prova), CONFIRMAÇÃO (/inscricao/:id) */}
        {(activeTab === 'inscricao' || activeTab === 'candidato' || activeTab === 'prova') && (
          <CandidateFlowWrapper
            activeTab={activeTab}
            submissionId={submissionId}
            processoId={currentProcessoId}
            candidates={candidates}
            isInscriptionOpen={isInscriptionOpen}
            isAuthenticated={isAuthenticated}
            currentUser={currentUser}
            onCandidateSubmitted={handleCandidateSubmitted}
            onNavigateToCandidato={() => navigateTo('candidato', true, currentProcessoId)}
            onNavigateToInscricao={() => navigateTo('inscricao', true, currentProcessoId)}
            onNavigateToProva={() => navigateTo('prova', true, currentProcessoId)}
            onNavigateToSuccess={(candId, procId) => navigateToSuccess(candId, procId || currentProcessoId)}
            onGoToLogin={() => navigateTo('login')}
            onGoToHome={() => navigateTo('vitrine')}
          />
        )}

        {/* VIEW 4: PORTAL DO PROFESSOR TITULAR (/ProfCarlos) */}
        {activeTab === 'professor' && (
          <ProfessorPortalView
            currentUser={
              currentUser ||
              systemUsers.find((u) => u.role === 'professor') || {
                id: 'prof-carlos',
                name: 'Pr. Carlos Alberto Pinheiro',
                email: 'carlos.pinheiro@comieadepa.org.br',
                whatsapp: '(91) 98111-2233',
                role: 'professor',
                password: 'senha',
                initials: 'CP',
                roleLabel: 'PROFESSOR TITULAR',
                routeSlug: '/ProfCarlos',
                disciplina: 'Hermenêutica e Metodologia Teológica',
                turmaId: 'turma-2026',
              }
            }
            candidates={candidates}
            modules={modules}
            students={students}
            turmas={turmas}
            users={systemUsers}
            disciplinas={disciplinas}
            avisos={muralAvisos}
            onUpdateCandidate={handleUpdateCandidate}
            onUpdateStudents={setStudents}
            onUpdateAvisos={setMuralAvisos}
            onUpdateTurmas={setTurmas}
            onUpdateUsers={(updated) => {
              setSystemUsers(updated);
              if (Array.isArray(updated)) updated.forEach((u) => upsertUserToSupabase(u));
            }}
            onUpdateDisciplinas={setDisciplinas}
            onOpenReportModal={() => {}}
            onAddComplementaryMaterial={(newMat) => {
              setModules((prev) =>
                prev.map((mod) => {
                  if (mod.number === newMat.moduloNumber) {
                    return {
                      ...mod,
                      complementaryMaterials: [newMat, ...mod.complementaryMaterials],
                    };
                  }
                  return mod;
                })
              );
            }}
          />
        )}

        {/* VIEW 5: PORTAL DO ALUNO VOCACIONADO (/turma2026-1024) */}
        {activeTab === 'aluno' && (() => {
          // Identifica o aluno ativo: se o usuário logado for 'aluno', busca o registro dele na tabela de matriculados.
          // Caso contrário (ex: Coordenador/Admin acessando a aba Aluno), seleciona o primeiro aluno da tabela de matriculados.
          const targetStudent =
            (currentUser && currentUser.role === 'aluno'
              ? students.find(
                  (s) =>
                    s.alunoId === currentUser.id ||
                    (s.matricula &&
                      currentUser.matricula &&
                      s.matricula.trim().toLowerCase() === currentUser.matricula.trim().toLowerCase()) ||
                    (s.alunoName &&
                      currentUser.name &&
                      s.alunoName.trim().toLowerCase() === currentUser.name.trim().toLowerCase())
                )
              : null) ||
            students[0] || {
              alunoId: 'user-aluno-1',
              matricula: '2026-QGU-1024',
              turmaId: 'turma-2026',
              alunoName: 'Marcos Paulo de Oliveira',
              polo: 'Campo Belém Central',
              frequenciaPercent: 0,
              presencas: 0,
              aulasTotais: 0,
              mediaGeral: 0,
              statusAcademico: 'Cursando',
              submissions: [],
              notas: [],
            };

          return (
            <StudentPortalView
              currentUser={
                currentUser || {
                  id: targetStudent.alunoId,
                  name: targetStudent.alunoName,
                  email: 'aluno@comieadepa.org.br',
                  whatsapp: '(91) 99182-4455',
                  role: 'aluno',
                  password: 'senha',
                  initials: targetStudent.alunoName.slice(0, 2).toUpperCase(),
                  roleLabel: 'ALUNO VOCACIONADO',
                  routeSlug: '/turma2026-1024',
                  matricula: targetStudent.matricula,
                  polo: targetStudent.polo,
                }
              }
              studentRecord={targetStudent}
              students={students}
              onUpdateStudentRecord={(updated) => {
                setStudents((prev) =>
                  prev.map((s) => (s.alunoId === updated.alunoId ? updated : s))
                );
                upsertStudentToSupabase(updated);
              }}
              modules={modules}
              avisos={muralAvisos}
              disciplinas={disciplinas}
              turmas={turmas}
              onSubmitWork={(alunoId, submission) => {
                setStudents((prev) =>
                  prev.map((s) => {
                    if (s.alunoId === alunoId) {
                      const updated = {
                        ...s,
                        submissions: [submission, ...s.submissions],
                      };
                      upsertStudentToSupabase(updated);
                      return updated;
                    }
                    return s;
                  })
                );
              }}
            />
          );
        })()}

        {/* VIEW 6: PAINEL DA COORDENAÇÃO (Admin /Paineladm) */}
        {activeTab === 'painel' && isAuthenticated && adminView === 'list' && (
          <DashboardView
            candidates={candidates}
            onSelectCandidate={handleSelectCandidate}
            isInscriptionOpen={isInscriptionOpen}
            onToggleInscription={() => setIsInscriptionOpen((prev) => !prev)}
            onCreateCandidate={handleCreateCandidate}
            onUpdateCandidate={handleUpdateCandidate}
            onDeleteCandidate={handleDeleteCandidate}
            onResetCandidates={handleResetCandidates}
            turmas={turmas}
            users={systemUsers}
            modules={modules}
            students={students}
            avisos={muralAvisos}
            disciplinas={disciplinas}
            onUpdateTurmas={(updated) => {
              setTurmas(updated);
              if (Array.isArray(updated)) updated.forEach((t) => upsertTurmaToSupabase(t));
            }}
            onUpdateUsers={(updated) => {
              setSystemUsers(updated);
              if (Array.isArray(updated)) updated.forEach((u) => upsertUserToSupabase(u));
            }}
            onUpdateStudents={(updated) => {
              setStudents(updated);
              if (Array.isArray(updated)) updated.forEach((st) => upsertStudentToSupabase(st));
            }}
            onUpdateAvisos={(updated) => {
              setMuralAvisos(updated);
              if (Array.isArray(updated)) updated.forEach((av) => upsertAvisoToSupabase(av));
            }}
            onUpdateDisciplinas={(updated) => {
              setDisciplinas(updated);
              if (Array.isArray(updated)) updated.forEach((d) => upsertDisciplinaToSupabase(d));
            }}
          />
        )}

        {activeTab === 'painel' && isAuthenticated && adminView === 'dossier' && (
          <CandidateDossierView
            candidate={selectedCandidate}
            onBack={() => {
              setAdminView('list');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onUpdateStatus={handleUpdateStatus}
            onUpdateCandidate={handleUpdateCandidate}
            onDeleteCandidate={handleDeleteCandidate}
          />
        )}

        {/* Fallback protection for painel */}
        {activeTab === 'painel' && !isAuthenticated && (
          <CommissionLogin
            users={systemUsers}
            onLoginSuccess={handleLoginSuccess}
            onBackToPublic={() => navigateTo('vitrine')}
            redirectedFromPainel={true}
          />
        )}
      </main>

      {/* Footer - Hidden on login page and hidden on mobile in painel adm */}
      {!isLoginPage && (
        <Footer
          onGoToLogin={() => navigateTo('login')}
          className={activeTab === 'painel' ? 'hidden sm:block' : ''}
        />
      )}

      {/* Modal: Edição de Perfil do Usuário */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        userProfile={userProfile}
        onSaveProfile={handleSaveProfile}
      />
    </div>
  );
}
