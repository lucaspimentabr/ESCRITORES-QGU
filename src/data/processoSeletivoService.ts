import { Candidate } from '../types';

export interface ProcessoSeletivoItem {
  id: string; // e.g. '#PS-2026-1'
  nome: string;
  route: string; // e.g. '/inscricao/PS-2026-1' or '/inscricao'
  editalId: string;
  status: 'Aberto' | 'Encerrado';
  createdAt?: string;
}

export interface InscriptionModuleItem {
  number: string;
  title: string;
  desc: string;
}

export interface ProcessoJourneyConfig {
  processoId: string; // e.g. '#PS-2026-2'
  cleanId: string; // e.g. 'PS-2026-2'
  nome: string;
  titulo: string;
  subtitulo: string;
  periodoInscricao: string;
  horarioAulas: string;
  detalhesAulas: string;
  datasCurso: string;
  toleranciaMinutos: number;
  vagas: number;
  editalNumero: string;
  status: 'Aberto' | 'Encerrado';
  modulos: InscriptionModuleItem[];
  createdAt: string;
}

const STORAGE_KEY_PROCESSOS = 'qgu_processos_seletivos_list';
const STORAGE_PREFIX_CONFIG = 'qgu_processo_config_';

export const INITIAL_DEFAULT_PROCESSOS: ProcessoSeletivoItem[] = [
  {
    id: '#PS-2026-1',
    nome: 'Processo Seletivo 2026.1',
    route: '/inscricao',
    editalId: 'edital-2026-1',
    status: 'Aberto',
    createdAt: new Date().toISOString(),
  },
];

export const normalizeProcessoId = (raw: string): string => {
  return raw.trim().replace(/^#+/, '');
};

export const formatProcessoId = (raw: string): string => {
  const clean = normalizeProcessoId(raw);
  return clean ? `#${clean}` : '';
};

export const getStoredProcessos = (): ProcessoSeletivoItem[] => {
  if (typeof window === 'undefined') return INITIAL_DEFAULT_PROCESSOS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PROCESSOS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Erro ao ler processos seletivos do storage', e);
  }
  return INITIAL_DEFAULT_PROCESSOS;
};

export const saveStoredProcessos = (list: ProcessoSeletivoItem[]): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_PROCESSOS, JSON.stringify(list));
    window.dispatchEvent(new Event('processos_seletivos_updated'));
  } catch (e) {
    console.error('Erro ao salvar processos seletivos', e);
  }
};

export const validateProcessoIdUnique = (
  rawId: string,
  existingList: ProcessoSeletivoItem[]
): { valid: boolean; error?: string; cleanId: string; formattedId: string } => {
  const cleanId = normalizeProcessoId(rawId);
  if (!cleanId) {
    return {
      valid: false,
      error: 'O ID do Processo Seletivo é obrigatório.',
      cleanId: '',
      formattedId: '',
    };
  }

  // Regex para permitir caracteres alfanuméricos, hífens e pontos (ex: PS-2026-1, PS.2026.2, etc.)
  if (!/^[a-zA-Z0-9_\-\.]+$/.test(cleanId)) {
    return {
      valid: false,
      error: 'O ID deve conter apenas letras, números, hífens e pontos.',
      cleanId,
      formattedId: `#${cleanId}`,
    };
  }

  const cleanLower = cleanId.toLowerCase();
  const exists = existingList.some(
    (p) => normalizeProcessoId(p.id).toLowerCase() === cleanLower
  );

  if (exists) {
    return {
      valid: false,
      error: `O ID informado ("#${cleanId}") já está em uso. Por favor, informe outro ID.`,
      cleanId,
      formattedId: `#${cleanId}`,
    };
  }

  return {
    valid: true,
    cleanId,
    formattedId: `#${cleanId}`,
  };
};

export const createDefaultJourneyConfig = (rawId: string): ProcessoJourneyConfig => {
  const cleanId = normalizeProcessoId(rawId);
  const formattedId = `#${cleanId}`;

  return {
    processoId: formattedId,
    cleanId,
    nome: `Processo Seletivo ${cleanId}`,
    titulo: 'Inscrição Escritores QGU',
    subtitulo:
      'Escritores QGU é um programa de formação destinado a capacitar novos escritores, visando desenvolver a vocação literária para servir à igreja local.',
    periodoInscricao: '18 à 22 de Setembro',
    horarioAulas: 'Quintas–feiras às 20h',
    detalhesAulas:
      'Aulas semanais transmitidas via Google Meet, de 24 de Setembro a 10 de Dezembro.',
    datasCurso: '24 de Setembro a 10 de Dezembro',
    toleranciaMinutos: 10,
    vagas: 50,
    editalNumero: `Edital ${cleanId}/2026`,
    status: 'Aberto',
    modulos: [
      {
        number: '1',
        title: 'Leitura de Textos',
        desc: 'Aprenda técnicas para absorver e reter o máximo de suas leituras.',
      },
      {
        number: '2',
        title: 'Abrangência Teológica',
        desc: 'Conheça as principais áreas de estudo e os grandes debates teológicos.',
      },
      {
        number: '3',
        title: 'Método Teológico',
        desc: 'Aprenda a produzir teologia de maneira sólida e profunda.',
      },
      {
        number: '4',
        title: 'Processo de Escrita',
        desc: 'Estruturação, clareza e elegância na hora de redigir o seu texto.',
      },
      {
        number: '5',
        title: 'Laboratório de Teologia',
        desc: 'Oficina de redação final, banca de avaliação e preparação prática para publicação.',
      },
    ],
    createdAt: new Date().toISOString(),
  };
};

export const getProcessoConfig = (cleanId: string): ProcessoJourneyConfig | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX_CONFIG}${cleanId.toLowerCase()}`);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Erro ao ler configuração do processo', e);
  }
  return null;
};

export const saveProcessoConfig = (config: ProcessoJourneyConfig): void => {
  if (typeof window === 'undefined') return;
  try {
    const key = `${STORAGE_PREFIX_CONFIG}${config.cleanId.toLowerCase()}`;
    localStorage.setItem(key, JSON.stringify(config));
    window.dispatchEvent(new Event('processo_config_updated'));
  } catch (e) {
    console.error('Erro ao salvar configuração do processo', e);
  }
};

export const deleteProcessoConfig = (cleanId: string): void => {
  if (typeof window === 'undefined') return;
  try {
    const key = `${STORAGE_PREFIX_CONFIG}${cleanId.toLowerCase()}`;
    localStorage.removeItem(key);
  } catch (e) {
    console.error('Erro ao deletar configuração do processo', e);
  }
};

/**
 * Exclusão total e permanente do processo seletivo:
 * - O processo seletivo selecionado
 * - Todas as páginas criadas especificamente para esse processo
 * - Todas as inscrições vinculadas ao processo
 * - Todos os dados dos candidatos vinculados às inscrições daquele processo
 */
export const deleteProcessoAndRelatedData = (
  processoId: string,
  candidatesList: Candidate[]
): {
  remainingProcessos: ProcessoSeletivoItem[];
  remainingCandidates: Candidate[];
  deletedCandidateIds: string[];
} => {
  const cleanId = normalizeProcessoId(processoId).toLowerCase();
  const formattedId = formatProcessoId(processoId).toLowerCase();

  // 1. Excluir configuração e páginas do processo
  deleteProcessoConfig(cleanId);

  // 2. Atualizar lista de processos seletivos
  const currentProcessos = getStoredProcessos();
  const remainingProcessos = currentProcessos.filter(
    (p) => normalizeProcessoId(p.id).toLowerCase() !== cleanId
  );
  saveStoredProcessos(remainingProcessos);

  // 3. Excluir inscrições e dados dos candidatos vinculados ao processo
  const deletedCandidateIds: string[] = [];
  const remainingCandidates = candidatesList.filter((c) => {
    const candEdital = (c.editalId || '').replace(/^#/, '').toLowerCase();
    const candProcesso = (c as any).processoId
      ? String((c as any).processoId).replace(/^#/, '').toLowerCase()
      : '';

    const isMatch =
      candEdital === cleanId ||
      candEdital === `edital-${cleanId}` ||
      candProcesso === cleanId ||
      candProcesso === formattedId;

    if (isMatch) {
      deletedCandidateIds.push(c.id);
      return false;
    }
    return true;
  });

  // Atualizar cache de candidatos no localStorage se existir
  try {
    localStorage.setItem('escritores_qgu_candidates', JSON.stringify(remainingCandidates));
  } catch {}

  return {
    remainingProcessos,
    remainingCandidates,
    deletedCandidateIds,
  };
};

/**
 * Validação: Um mesmo candidato poderá possuir apenas uma inscrição em cada processo seletivo.
 */
export const checkCandidateAlreadyRegistered = (
  candidates: Candidate[],
  processoId: string | null | undefined,
  email: string,
  cpf?: string
): Candidate | null => {
  if (!email && !cpf) return null;
  const cleanProc = processoId ? normalizeProcessoId(processoId).toLowerCase() : '';

  const cleanCpfDigits = cpf ? cpf.replace(/\D/g, '') : '';
  const cleanEmail = email ? email.trim().toLowerCase() : '';

  return (
    candidates.find((c) => {
      // Se processoId for especificado, restringir ao processo
      if (cleanProc) {
        const cEdital = (c.editalId || '').replace(/^#/, '').toLowerCase();
        const cProc = (c as any).processoId
          ? String((c as any).processoId).replace(/^#/, '').toLowerCase()
          : '';

        const matchesProc =
          cEdital === cleanProc ||
          cEdital === `edital-${cleanProc}` ||
          cProc === cleanProc ||
          (cleanProc === 'ps-2026-1' && (!cEdital || cEdital === 'edital-2026-1'));

        if (!matchesProc) return false;
      }

      const matchEmail =
        cleanEmail && c.email && c.email.trim().toLowerCase() === cleanEmail;
      const cCpfDigits = (c as any).cpf ? String((c as any).cpf).replace(/\D/g, '') : '';
      const matchCpf = cleanCpfDigits && cCpfDigits && cCpfDigits === cleanCpfDigits;

      return matchEmail || matchCpf;
    }) || null
  );
};
